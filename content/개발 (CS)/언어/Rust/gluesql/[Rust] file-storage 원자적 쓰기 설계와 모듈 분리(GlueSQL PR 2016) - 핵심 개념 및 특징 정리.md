---
title: "\"file-storage 원자적 쓰기 설계와 모듈 분리(GlueSQL #2016)\""
tags: [학습, 개발-CS, 언어, Rust, GlueSQL, 오픈소스아카데미, 파일시스템, 크래시안전성, "#2016"]
created: 2026-09-05
modified: 2026-09-05
---

# file-storage 원자적 쓰기 설계와 모듈 분리 (GlueSQL #2016)

> [!NOTE]
> 진행 중인 [PR #2016](https://github.com/gluesql/gluesql/pull/2016)(브랜치 `file-storage/atomic-writes`) 기록. GlueSQL의 `file-storage` 백엔드가 행(row) 데이터를 `File::create` + `write_all`로 직접 덮어쓰던 문제 — 쓰다가 크래시하면 파일이 손상된 채 남는 문제 — 를, 이미 마이그레이션 코드에 있던 "임시 파일 + fsync + rename" 원자적 쓰기 패턴을 재사용해서 고친 과정. 리팩터링을 "동작 불변 리팩터링(모듈 분리)"과 "실제 동작 변경(원자적 쓰기 적용)" 두 단계로 쪼갠 이유, 왜 `delete_data`는 그대로 뒀는지, 그리고 이 작업 중 나온 "쓰기를 병렬화하면 더 빠르지 않을까"라는 질문에 대한 판단까지 정리한다.

## 📌 개념

### 문제 — row 데이터 쓰기가 크래시에 취약함

`file-storage`는 각 행을 `.ron` 파일 하나에 저장한다. `insert_data`/`append_data`는 지금까지 대상 파일을 아래처럼 직접 덮어썼다.

```rust
// storages/file-storage/src/store_mut.rs (수정 전)
fn append_data(&mut self, table_name: &str, rows: Vec<Vec<Value>>) -> Result<()> {
    for row in rows {
        let key = Key::Uuid(Uuid::now_v7().as_u128());
        let path = self.data_path(table_name, &key)?;
        let row = FileRow { key, row };
        let row = to_string_pretty(&row, PrettyConfig::default()).map_storage_err()?;

        let mut file = File::create(path).map_storage_err()?;
        file.write_all(row.as_bytes()).map_storage_err()?;
    }
    Ok(())
}
```

쓰는 도중 프로세스가 죽거나 디스크가 꽉 차면 파일이 절반만 쓰인 채 남는다. 다음에 그 파일을 읽으면 파싱 에러가 나거나, 최악의 경우 예전 값도 새 값도 아닌 깨진 데이터를 읽게 된다.

흥미로운 점은 이 크레이트 안에 이미 정답이 있었다는 것이다. `migration.rs`(v1→v2 포맷 마이그레이션 코드)에는 임시 파일에 쓰고 → `fsync` → `rename`으로 교체하는 `write_file_atomically` 헬퍼가 있었고, `insert_schema`(스키마 쓰기)는 실제로 이미 이 패턴을 쓰고 있었다. 다만 **row 데이터를 쓰는 `insert_data`/`append_data`만 이 패턴을 안 쓰고 있었다** — 코드베이스 안에 이미 검증된 해법이 있는데 정작 가장 자주 호출되는 경로가 그걸 재사용하지 않는 전형적인 케이스였다.

### 1단계 — 동작 불변 리팩터링: 헬퍼를 독립 모듈로 분리

`write_file_atomically`를 `store_mut.rs`에서도 쓰려면, 두 파일이 같이 참조할 수 있는 곳으로 옮겨야 한다. 그런데 이 이동을 "실제 동작 변경(2단계)"과 한 커밋에 같이 하지 않고 **순수 이동만 하는 커밋을 먼저** 냈다.

```rust
// storages/file-storage/src/atomic_write.rs (신규 파일)
pub(crate) fn write_file_atomically(path: &Path, data: &str) -> Result<()> {
    let temp_path = temp_path_for(path);
    let backup_path = backup_path_for(path);
    let has_existing_target = path.exists();

    let mut file = fs::File::create(&temp_path).map_storage_err()?;
    file.write_all(data.as_bytes()).map_storage_err()?;
    file.sync_all().map_storage_err()?;
    drop(file);

    if has_existing_target && let Err(backup_err) = fs::rename(path, &backup_path).map_storage_err()
    {
        let _ = fs::remove_file(&temp_path);
        return Err(backup_err);
    }

    if let Err(target_rename_err) = fs::rename(&temp_path, path).map_storage_err() {
        let _ = fs::remove_file(&temp_path);
        if has_existing_target
            && let Err(restore_err) = fs::rename(&backup_path, path).map_storage_err()
        {
            return Err(Error::StorageMsg(format!(
                "[FileStorage] failed to atomically replace '{}': {target_rename_err}; and failed to restore backup '{}': {restore_err}",
                path.display(),
                backup_path.display()
            )));
        }
        return Err(target_rename_err);
    }

    if has_existing_target {
        let _ = fs::remove_file(&backup_path);
    }
    Ok(())
}
```

동작 순서를 풀어보면:

1. 임시 파일(`*.tmp-<uuid>`)에 새 내용을 쓰고 `fsync`로 디스크에 확실히 반영
2. 기존 파일이 있으면 백업 경로(`*.bak-<uuid>`)로 먼저 옮겨둠
3. 임시 파일을 최종 경로로 `rename` — 같은 파일시스템 내 `rename`은 원자적 연산이라 "절반만 교체된" 중간 상태가 존재하지 않음
4. 성공하면 백업 삭제, 실패하면 백업을 원래 자리로 복원 시도

**왜 이동만 하는 커밋을 따로 냈는가**: 다음 단계(실제 동작 변경)에서 테스트가 깨지면 "코드를 옮기다가 실수한 건지" vs "동작을 바꾸다가 실수한 건지"를 바로 구분할 수 있다. 이렇게 나누면 리뷰어 입장에서도 각 커밋의 diff가 "이 커밋은 동작 변화 없음" / "이 커밋이 진짜 변경"으로 명확히 갈려서 리뷰 부담이 줄어든다.

`pub(crate)` 가시성을 쓴 것도 포인트다 — 이 헬퍼는 크레이트(`gluesql-file-storage`) 안의 다른 모듈(`migration.rs`, `store_mut.rs`)에서는 보여야 하지만, 크레이트 바깥(다른 스토리지 크레이트나 `core`)에는 노출할 이유가 없다.

### 2단계 — 실제 동작 변경: insert_data/append_data 전환

모듈 분리가 끝난 뒤, `insert_data`/`append_data`의 파일 쓰기 두 줄을 헬퍼 호출 한 줄로 교체했다.

```rust
// after
fn append_data(&mut self, table_name: &str, rows: Vec<Vec<Value>>) -> Result<()> {
    for row in rows {
        let key = Key::Uuid(Uuid::now_v7().as_u128());
        let path = self.data_path(table_name, &key)?;
        let row = FileRow { key, row };
        let row = to_string_pretty(&row, PrettyConfig::default()).map_storage_err()?;

        write_file_atomically(&path, &row)?;
    }
    Ok(())
}
```

**대안으로 고려했지만 안 한 것**: 완전히 새로운 원자적 쓰기 로직을 직접 작성하는 방법도 있었지만, 그럴 필요가 없었다. 같은 크레이트 안에 이미 마이그레이션 경로에서 실사용되며 검증된 구현이 있으니 재사용하는 게 가장 안전하고, 리뷰 관점에서도 "새 로직"이 아니라 "기존에 검증된 패턴을 넓게 적용"하는 변경으로 보이므로 검토 부담이 적다.

### 왜 delete_data는 그대로 뒀는가 — "원자적"의 기준은 연산 하나

`insert_data`/`append_data`가 취약했던 이유는 "파일 내용을 새로 쓰는 도중" 크래시가 나면 파일이 반쯤 쓰인 채로 남을 수 있어서였다. 반면 `delete_data`는 다르다.

```rust
fn delete_data(&mut self, table_name: &str, keys: Vec<Key>) -> Result<()> {
    for key in keys {
        let path = self.data_path(table_name, &key)?;
        fs::remove_file(path).map_storage_err()?;
    }
    Ok(())
}
```

`fs::remove_file`이 감싸는 `unlink` 시스템 콜은 파일시스템이 보장하는 원자적 연산이다 — 파일이 "반쯤 지워진" 중간 상태 자체가 존재하지 않는다. 지워지거나 안 지워지거나 둘 중 하나뿐이라, 임시 파일 트릭이 필요 없다.

다만 `keys: Vec<Key>` 하나에 여러 키가 들어올 때, 루프 도중 세 번째 키에서 실패하면 앞의 두 개는 이미 지워진 채로 남는다 — 이건 "파일 하나의 원자성" 문제가 아니라 "여러 파일에 걸친 statement 단위 원자성" 문제라서 이번 PR의 스코프 밖이다(아래 "다음 단계" 참고).

### 다음 단계로 미룬 것들

이번 PR에는 아직 남아있는 크래시 윈도우가 하나 있다. 기존 파일을 백업 경로로 옮긴 직후, 새 파일을 최종 경로로 옮기기 전에 크래시하면 최종 경로가 일시적으로 사라진 상태가 된다(백업에는 이전 내용이 온전히 남아있음). 이걸 감지해서 복구하는 시작 시(startup) 로직은 아직 없다 — PR 본문에 known limitation으로 명시하고, 후속 PR(시작 시 잔여 `.tmp-*`/`.bak-*` 파일 복구)로 넘겼다.

### 부록 — 병렬 쓰기 여부에 대한 사전 논의

PR을 올리기 전 "대량 insert 시 row마다 순차적으로 `write_file_atomically`를 호출하면 느리지 않은가, 병렬화하면 어떤가"라는 질문이 나왔다. 정리한 판단:

- 병렬화 자체는 안전하다 — 각 row가 독립된 파일이고, 임시 파일명에 UUID가 붙어 스레드 간 충돌 여지가 없다.
- 병목은 CPU가 아니라 **`fsync` 호출당 디스크 플러시 대기시간**이다. I/O-bound 작업이므로 여러 요청을 동시에 던지면 대기시간이 겹쳐서 실질적인 이득이 있다(블로킹 I/O 여러 개를 스레드풀로 동시에 던지는 것과 같은 원리).
- 하지만 **더 근본적인 해법은 병렬화가 아니라 배치(batch) fsync**다. row마다 fsync 1번씩 하는 대신, 여러 row를 모아 fsync 1번으로 묶으면(WAL/저널을 도입할 때) 병렬화보다 더 큰 성능 이득을 얻을 수 있다 — PostgreSQL의 WAL 그룹 커밋 등 실제 DB들이 성능을 얻는 방식과 같다.
- 결론: 이번 PR의 스코프는 바꾸지 않는다(순차 처리 유지, 크래시 안전성만 목표). 병렬 처리와 배치 fsync 여부는 통계적으로 배치 fsync가 우선순위가 높다고 보고, statement 단위 원자성을 다루는 후속 설계 단계에서 함께 검토하기로 했다.

## 🔗 참고

- [GlueSQL PR #2016 — Write file-storage row data atomically to prevent torn writes on crash](https://github.com/gluesql/gluesql/pull/2016) — 이 글 작성 시점(2026-09-05) 기준 아직 머지되지 않고 열려 있는 PR. 자동 리뷰(CodeRabbit)의 1차 피드백까지 반영된 상태이며 메인테이너 리뷰를 기다리는 중
- [GlueSQL Issue #2004 — file-storage migration applies partially and leaves no trace when it is interrupted](https://github.com/gluesql/gluesql/issues/2004) — 같은 "중단된 쓰기가 흔적을 안 남긴다" 문제를 마이그레이션 관점에서 다루는, 메인테이너가 연 트래킹 이슈
- [(Rust) 크래시 안전성 회귀 테스트 설계(GlueSQL #2016) - 핵심 개념 및 특징 정리]([Rust]%20크래시%20안전성%20회귀%20테스트%20설계%28GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 변경을 검증하는 자동 테스트 설계
- [(Rust) 오픈소스 PR 리뷰 대응기(CodeRabbit, GlueSQL #2016) - 핵심 개념 및 특징 정리]([Rust]%20오픈소스%20PR%20리뷰%20대응기%28CodeRabbit,%20GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md) — PR을 올린 뒤 받은 자동 리뷰에 대한 대응 판단
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리]([Rust]%20GlueSQL%20프로젝트%20구조와%20필요%20문법%20개관%20-%20핵심%20개념%20및%20특징%20정리.md)
