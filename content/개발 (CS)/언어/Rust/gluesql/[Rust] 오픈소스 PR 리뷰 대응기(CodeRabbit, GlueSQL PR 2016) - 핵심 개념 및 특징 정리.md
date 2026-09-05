---
title: "오픈소스 PR 리뷰 대응기(CodeRabbit, GlueSQL #2016)"
tags: [학습, 개발-CS, 언어, Rust, GlueSQL, 오픈소스아카데미, 코드리뷰, "#2016"]
created: 2026-09-05
modified: 2026-09-05
---

# 오픈소스 PR 리뷰 대응기 (CodeRabbit 자동 리뷰, GlueSQL #2016)

> [!NOTE]
> [PR #2016](https://github.com/gluesql/gluesql/pull/2016)에 자동 리뷰 봇(CodeRabbit)이 남긴 지적 3건 중, 어떤 것을 지금 고치고 어떤 것을 의도적으로 남겨뒀는지에 대한 판단 기록. 자동 리뷰라고 전부 반영하거나 전부 무시하는 게 아니라, "이 PR의 목적과 직접 모순되는가" 기준으로 골라서 대응한 과정과, 그 판단 근거를 어떻게 사람이 검증 가능한 형태로 남겼는지를 정리한다.

## 📌 개념

### 자동 리뷰가 남긴 지적 3건

PR을 올린 뒤 사람(메인테이너) 리뷰는 아직 없었고, CodeRabbit이 코드 리뷰를 자동으로 남겼다.

1. **(Minor)** `write_file_atomically`에서 `write_all`/`sync_all`이 실패하면 이미 만들어둔 임시 파일(`.tmp-*`)을 정리하지 않고 그대로 에러를 반환한다.
2. **(Major)** 기존 파일을 백업 경로로 옮긴 직후, 새 파일을 최종 경로로 옮기기 전에 크래시하면 최종 경로가 아예 사라진 상태로 남는다. 이걸 감지해서 복구하는 시작 시(startup) 로직이 없다.
3. **(Minor)** 읽기 전용 디렉터리 테스트가 `root` 권한으로 실행되면 다르게(통과하지 못하고 패닉) 동작할 수 있다.

### 왜 셋 중 하나만 고쳤는가

**#1(leftover temp file)은 바로 고쳤다.** 이 PR이 추가한 테스트 이름 자체가 `insert_data_leaves_no_leftover_temp_or_backup_files`("잔여 파일이 없다")인데, 정작 쓰기 자체가 실패하는 경로에서는 잔여 파일이 남는 게 이 PR이 스스로 내세운 목적과 직접 모순된다. 수정도 로직을 새로 만드는 게 아니라 에러 처리 순서만 바꾸는 수준이라 리스크가 낮았다.

```rust
// 수정 전 — 실패해도 temp_path가 정리되지 않음
let mut file = fs::File::create(&temp_path).map_storage_err()?;
file.write_all(data.as_bytes()).map_storage_err()?;
file.sync_all().map_storage_err()?;
drop(file);
```

```rust
// 수정 후 — 실패 시 temp_path를 정리하고 에러를 반환
if let Err(err) = fs::File::create(&temp_path)
    .map_storage_err()
    .and_then(|mut file| {
        file.write_all(data.as_bytes()).map_storage_err()?;
        file.sync_all().map_storage_err()
    })
{
    let _ = fs::remove_file(&temp_path);
    return Err(err);
}
```

`?`를 두 번 연달아 쓰면 함수 전체가 그 자리에서 즉시 반환돼서, 그 사이에 정리 코드(temp 파일 삭제)를 끼워 넣을 자리가 없다. `.and_then(...)`으로 "파일 생성 + 쓰기 + 동기화" 세 단계를 하나의 `Result` 값으로 묶으면, 그 전체 결과에 대해 딱 한 곳(`if let Err(err) = ...`)에서만 분기해서 정리 코드를 넣을 수 있다. C의 `goto cleanup;` 패턴, Java의 try-with-resources가 예외 발생 지점과 무관하게 한 곳에서 정리하는 것과 목적이 같다.

클로저 안의 `?`는 클로저 자신의 반환값에 대한 조기 반환이라 바깥 함수 전체를 빠져나가지 않는다 — `write_all`이 실패하면 클로저가 즉시 `Err`를 반환하고, 그 값이 `and_then`을 거쳐 바깥의 `if let Err(err) = ...`로 전달되는 흐름이다.

**#2(backup↔target 크래시 윈도우)는 의도적으로 남겨뒀다.** 이 PR 이전에도 "쓰다가 죽으면 파일이 손상된 채 남는다"는 문제가 있었다. 이 PR이 적용된 이후 최악의 경우는 "손상된 파일"에서 "파일이 없음(단, 백업 경로에 이전 내용이 온전히 남아있음)"으로 바뀐 것뿐이다 — 더 나빠진 게 아니라 실패 형태가 더 명확해진 것이다. 이걸 완전히 없애려면 시작 시 백업 파일을 감지해서 복구하는 별도 로직이 필요한데, 그건 이미 로드맵에 있는 후속 PR(시작 시 복구)의 스코프와 정확히 겹친다. 지금 PR에서 억지로 떠안기보다, PR 본문에 known limitation으로 명시하고 후속 PR로 연결하는 쪽을 택했다.

**#3(root 권한 테스트 흔들림)은 이미 알려진 한계**라 손대지 않았다 — 애초에 테스트를 설계할 때 "root로 돌리면 이 테스트가 실패할 것"이라고 이미 문서화해둔 사안이다.

### 판단 기준을 일반화하면

자동 리뷰든 사람 리뷰든, 지적받은 걸 전부 그 자리에서 고치거나 전부 무시하는 건 둘 다 좋은 대응이 아니다. 이번에 실제로 쓴 기준:

- **이 PR이 스스로 내세운 주장(테스트 이름, PR 설명)과 직접 모순되는가?** → 지금 고친다 (#1)
- **다른 후속 작업의 스코프와 명백히 겹치는가?** → 지금 억지로 떠안지 않고, PR 본문에 known limitation으로 명시 + 후속 작업 링크로 연결한다 (#2)
- **이미 알고 있었고 문서화된 한계인가?** → 반복해서 손대지 않는다 (#3)

이렇게 나누고, PR 코멘트에 "왜 이건 지금 고치고 저건 안 고치는지"를 설명해두면 리뷰어(사람이든 봇 재검토든)가 "누락"과 "의도적 보류"를 구분할 수 있다.

### PR #2016의 현재 상태 (2026-09-05 기준)

이 글을 쓰는 시점에도 **PR #2016은 아직 머지되지 않고 열려 있다(OPEN)**. 진행 상황을 요약하면:

- 커밋 8개가 순서대로 쌓여 있다: 설계 문서 추가/제거 → `atomic_write` 모듈 분리(순수 리팩터링) → `insert_data`/`append_data` 원자적 쓰기 전환 → 회귀 테스트 3개 추가 → `main` 머지 → `append_data` 회귀 테스트 추가 → 이 글에서 다룬 leftover 정리 수정.
- 자동 리뷰(CodeRabbit)는 이 글에서 다룬 수정 이후 재검토를 돌렸고, 최근 리뷰 결과는 "actionable한 코멘트 없음" — 즉 자동 리뷰가 지적한 사항 중 반영하기로 한 부분은 이미 반영된 상태다.
- 다만 **메인테이너를 포함한 사람 리뷰는 아직 달리지 않았다.** `mergeable` 상태 자체는 `main`과 충돌 없이 깨끗하지만, 이는 "머지 가능"이 아니라 "리뷰 대기 중"을 뜻한다.
- 따라서 이 PR을 인용할 때는 "머지됨"이 아니라 "**리뷰 대기 중인 오픈 PR**"이라고 정확히 표현해야 한다 — 오픈소스에서는 자동 검증(CI, 자동 리뷰봇)을 통과한 것과 실제로 메인테이너가 승인해서 머지되는 것 사이에 시간차가 있고, 그 상태를 정직하게 기록해두는 것도 기여 과정의 일부다.

## 🔗 참고

- [GlueSQL PR #2016 — Write file-storage row data atomically to prevent torn writes on crash](https://github.com/gluesql/gluesql/pull/2016) — 최신 상태는 링크에서 직접 확인
- [(Rust) file-storage 원자적 쓰기 설계와 모듈 분리(GlueSQL #2016) - 핵심 개념 및 특징 정리]([Rust]%20file-storage%20원자적%20쓰기%20설계와%20모듈%20분리%28GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) 크래시 안전성 회귀 테스트 설계(GlueSQL #2016) - 핵심 개념 및 특징 정리]([Rust]%20크래시%20안전성%20회귀%20테스트%20설계%28GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) TranslateError Enum 타입화(strum·thiserror, GlueSQL #1975) - 핵심 개념 및 특징 정리]([Rust]%20TranslateError%20Enum%20타입화%28strum·thiserror,%20GlueSQL%20Issue%201975%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 사람 리뷰(메인테이너)와의 대응 사례는 이 글 참고
