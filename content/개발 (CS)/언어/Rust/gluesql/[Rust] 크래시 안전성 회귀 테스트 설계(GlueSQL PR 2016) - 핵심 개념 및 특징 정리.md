---
title: "\"크래시 안전성 회귀 테스트 설계(GlueSQL #2016)\""
tags: [학습, 개발-CS, 언어, Rust, GlueSQL, 오픈소스아카데미, 테스트, 파일시스템, "#2016"]
created: 2026-09-05
modified: 2026-09-05
---

# 크래시 안전성 회귀 테스트 설계 (GlueSQL #2016)

> [!NOTE]
> [PR #2016](https://github.com/gluesql/gluesql/pull/2016)에서 "원자적 쓰기로 바꿨다"는 주장을 코드로 증명하는 테스트를 설계한 기록. 핵심 질문은 "크래시/실패를 어떻게 결정적(deterministic)으로, CI에서도 안정적으로 재현할 것인가"였다. 디스크가 꽉 찬 상황을 흉내 내는 대신 읽기 전용 디렉터리로 실패를 유도한 이유, 그리고 정상 경로와 실패 경로를 각각 어떻게 나눠 검증했는지를 정리한다.

## 📌 개념

### 왜 "정상 동작 테스트"만으로는 부족한가

기존 테스트 스위트는 "insert 후 select가 되는지" 같은 정상 경로만 확인했다. 하지만 이번 작업(행 데이터를 임시 파일 + fsync + rename으로 쓰도록 전환)이 실제로 지킨다고 주장하는 보장은 두 가지다.

1. 정상적으로 끝나면 임시/백업 파일이 하나도 안 남는다 (뒷정리가 깨끗하다)
2. **쓰기 자체가 실패해도** 기존에 있던 유효한 데이터는 손상되지 않는다

이 중 2번이 핵심인데, 기존 테스트는 애초에 실패를 유도하는 시나리오 자체가 없어서 이 보장을 전혀 검증하지 못했다. "말로만 안전하다"와 "테스트로 실제 확인됨"의 차이를 메우는 게 이번 테스트 설계의 목표였다.

### 실패를 어떻게 결정적으로 재현할 것인가 — 디스크풀 대신 읽기 전용 디렉터리

실패를 유도하는 방법으로 "디스크가 꽉 찬 상황을 흉내"내는 것도 고려했지만 기각했다. 플랫폼마다 재현 방법이 다르고(리눅스의 loopback 파일시스템 크기 제한 등), 테스트가 불안정(flaky)해지기 쉽다.

대신 **테이블 디렉터리를 읽기 전용(`0o500`, r-x)으로 만들어서 새 파일(임시 파일) 생성 자체를 막는** 방법을 택했다. 이 방법은 결정적이고 CI 환경에서도 안정적으로 재현된다.

```rust
#[cfg(unix)]
#[test]
fn insert_into_readonly_table_dir_preserves_existing_row() {
    use std::os::unix::fs::PermissionsExt;

    let path = test_path("insert-readonly-dir");
    let mut storage = FileStorage::new(&path).expect("FileStorage::new");
    let schema = Schema::from_ddl("CREATE TABLE Foo (id INTEGER);").expect("parse schema");
    storage.insert_schema(&schema).expect("insert schema");

    let key = Key::I64(1);
    storage
        .insert_data("Foo", vec![(key.clone(), vec![Value::I64(1)])])
        .expect("first insert");

    let table_dir = storage.path("Foo");
    let original_perms = fs::metadata(&table_dir).expect("metadata").permissions();
    let mut readonly_perms = original_perms.clone();
    readonly_perms.set_mode(0o500); // r-x: 새 파일(임시 파일)을 못 만들게 막음
    fs::set_permissions(&table_dir, readonly_perms).expect("set readonly");

    let result = storage.insert_data("Foo", vec![(key.clone(), vec![Value::I64(2)])]);

    fs::set_permissions(&table_dir, original_perms).expect("restore permissions");

    result.expect_err("insert into a read-only table directory should fail");

    let row = storage
        .fetch_data("Foo", &key)
        .expect("fetch data")
        .expect("row exists");
    assert_eq!(row, vec![Value::I64(1)]);

    let _ = fs::remove_dir_all(&path);
}
```

디렉터리에 쓰기 권한이 없으면 `write_file_atomically`의 첫 단계(`File::create(&temp_path)`)가 바로 실패한다. 그 실패가 값(`2`)이 기존 값(`1`)을 덮어쓰지 못하게 막는지를 `expect_err` + 이후 `fetch_data` 비교로 확인한다.

권한 조작 테스트에서 잊기 쉬운 것: 테스트 마지막에 `fs::set_permissions`로 권한을 원래대로 복구해야 한다. 안 그러면 정리 단계인 `fs::remove_dir_all`조차 실패할 수 있다. 또한 **`root` 권한으로 CI가 돌아가면 이 테스트는 의미가 없어진다** — `root`는 읽기 전용 권한도 무시하고 쓸 수 있기 때문이다. 이건 완전히 없앨 수 없는 한계라서, 알려진 한계로 그대로 문서에 남겨뒀다(로컬/CI가 비-root로 도는 한 정상 동작한다).

### 세 가지 테스트로 다른 각도를 커버하기

의도적으로 테스트를 세 개로 나눴다.

| 테스트 | 검증 대상 |
|---|---|
| `insert_data_leaves_no_leftover_temp_or_backup_files` | 정상 케이스에서 뒷정리가 깨끗한지 |
| `reinserting_existing_key_replaces_content_without_leftovers` | 덮어쓰기(같은 키 재삽입)도 똑같이 깨끗한지 |
| `insert_into_readonly_table_dir_preserves_existing_row` | **실패 케이스**에서 기존 데이터가 안전한지 |

세 번째가 없으면 "원자적 쓰기"라는 주장의 핵심(실패해도 안전하다)을 실제로 증명하지 못한다. 잔여 파일 검사에 쓰는 헬퍼는 다음과 같다.

```rust
fn stray_files(path: &str, table: &str) -> Vec<PathBuf> {
    fs::read_dir(format!("{path}/{table}"))
        .expect("read table dir")
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|p| {
            let name = p.file_name().and_then(OsStr::to_str).unwrap_or_default();
            name.contains(".tmp-") || name.contains(".bak-")
        })
        .collect()
}
```

`Glue`(SQL 실행 엔진)를 거치지 않고 `FileStorage`/`Store`/`StoreMut` 트레이트를 직접 호출한 이유는, 파일 시스템 상태(임시/백업 파일 존재 여부, 디렉터리 권한)를 정밀하게 제어하려면 SQL 파서를 거치지 않는 저수준 접근이 더 적합하기 때문이다. 기존 `tests/migration_v1_to_v2.rs`도 같은 스타일을 이미 쓰고 있어서 일관성도 맞았다.

### insert_data와 append_data를 대칭으로 테스트한 이유

첫 라운드에서는 `insert_data` 경로만 테스트했다. 하지만 `insert_data`와 `append_data`는 내부에서 완전히 같은 안전장치(`write_file_atomically`)를 쓰지만, 공개 API 계약이 다르다 — `insert_data(table, Vec<(Key, Vec<Value>)>)`는 키를 직접 받고, `append_data(table, Vec<Vec<Value>>)`는 키를 내부에서 `Uuid::now_v7()`로 자동 생성한다. "한쪽 테스트가 통과한다고 다른 쪽 경로가 검증됐다고 볼 수 없다"는 판단하에, `append_data`용 테스트를 추가로 채워 넣었다.

```rust
#[test]
fn append_data_leaves_no_leftover_temp_or_backup_files() {
    let path = test_path("append-no-leftover");
    let mut storage = FileStorage::new(&path).expect("FileStorage::new");
    let schema = Schema::from_ddl("CREATE TABLE Foo (id INTEGER);").expect("parse schema");
    storage.insert_schema(&schema).expect("insert schema");

    storage
        .append_data("Foo", vec![vec![Value::I64(1)], vec![Value::I64(2)]])
        .expect("append data");

    let rows = storage
        .scan_data("Foo")
        .expect("scan data")
        .collect::<Result<Vec<_>, _>>()
        .expect("rows readable");
    assert_eq!(rows.len(), 2);

    let leftovers = stray_files(&path, "Foo");
    assert!(leftovers.is_empty(), "unexpected leftover files: {leftovers:?}");

    let _ = fs::remove_dir_all(&path);
}
```

`append_data`는 키를 스스로 만들기 때문에 `fetch_data(table, &key)`로 특정 행을 조회할 수 없다. 대신 `scan_data`(반환 타입 `Result<RowIter<'a>>`, 실체는 `Box<dyn Iterator<Item = Result<(Key, Vec<Value>)>> + 'a>`)로 테이블 전체를 훑고, `.collect::<Result<Vec<_>, _>>()`로 "하나라도 읽기 실패하면 전체를 실패로 처리"하는 패턴을 썼다. 여기서 `::<Result<Vec<_>, _>>`는 turbofish 문법 — 제네릭 메서드 호출 시 컴파일러가 추론하기 애매한 타입을 명시적으로 지정하는 용도다.

### 이번 변경에 전용 테스트를 추가하지 않은 경우도 있다

이후 자동 리뷰(CodeRabbit)를 반영해 `write_file_atomically`의 에러 처리 순서를 바꾼 적이 있는데(임시 파일 생성 후 쓰기/동기화가 실패하면 임시 파일을 정리하도록), 이 분기 자체를 직접 트리거하는 전용 테스트는 추가하지 않았다. `write_all`/`sync_all`이 실제로 실패하는 상황(디스크 풀, I/O 에러)은 플랫폼마다 재현 방법이 다르고 결정적으로 흉내 내기 어렵다는, 위에서 이미 내린 판단과 같은 이유다. `File::create` 자체가 실패하는 경로는 이미 읽기 전용 디렉터리 테스트로 결정적으로 재현되지만, 그 테스트는 `File::create` 단계에서 이미 막히기 때문에 `write_all`/`sync_all` 실패 분기까지는 도달하지 않는다. 이 경우 "기존 회귀 테스트 스위트 전체가 깨지지 않았다"만 확인하고, 새 분기를 직접 검증하는 테스트가 없다는 것을 한계로 남겨두는 것도 하나의 합리적인 선택이다 — 모든 분기에 결정적 테스트를 억지로 끼워 맞추기보다, 재현 불가능한 조건은 정직하게 한계로 문서화하는 편이 유지보수에 더 낫다고 판단했다.

## 🔗 참고

- [GlueSQL PR #2016 — Write file-storage row data atomically to prevent torn writes on crash](https://github.com/gluesql/gluesql/pull/2016)
- [(Rust) file-storage 원자적 쓰기 설계와 모듈 분리(GlueSQL #2016) - 핵심 개념 및 특징 정리]([Rust]%20file-storage%20원자적%20쓰기%20설계와%20모듈%20분리%28GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 테스트가 검증하는 실제 구현 변경
- [(Rust) 오픈소스 PR 리뷰 대응기(CodeRabbit, GlueSQL #2016) - 핵심 개념 및 특징 정리]([Rust]%20오픈소스%20PR%20리뷰%20대응기%28CodeRabbit,%20GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md)
