---
title: "TranslateError Enum 타입화(strum·thiserror, GlueSQL #1975)"
tags: [학습, 개발-CS, 언어, Rust, 에러처리, strum, thiserror, GlueSQL, 오픈소스아카데미, 트러블슈팅, "#1975", "#1981"]
created: 2026-09-05
modified: 2026-09-05
---

# TranslateError Enum 타입화 (strum·thiserror, GlueSQL #1975)

> [!NOTE]
> `&'static str`/`String`로 에러 사유를 표현하던 `TranslateError`의 variant들을 전용 enum + `strum_macros::Display`로 타입화한 리팩터링 기록. 이슈 본문엔 `UnsupportedInsertOption` 등 5개 variant만 예시로 나와 있었지만, 같은 문자열 기반 패턴을 가진 `UnsupportedCreateTableOption`(PR #1972에서 내가 추가)과 `UnsupportedJoinConstraint`까지 찾아서 총 7개 variant를 같은 브랜치에서 함께 타입화함. 왜 문제였는지, `strum::Display`가 `thiserror`와 어떻게 맞물려 동작하는지, 작업 중 발견한 `Serialize` 회귀 버그, 실제로 어떤 절차(RED→GREEN)로 안전하게 리팩터링했는지 정리함.

## 📌 개념

### 문제의 시작 — `&'static str`로 표현된 에러 사유

```rust
// core/src/translate/error.rs (리팩터링 전)
#[error("unsupported INSERT option: {0}")]
UnsupportedInsertOption(&'static str),
```

```rust
// core/src/translate.rs (호출부, 리팩터링 전)
let violation = if returning.is_some() {
    Some("RETURNING clause")
} else if on.is_some() {
    Some("ON CONFLICT clause")
} else if table_alias.is_some() {
    Some("table alias")
} // ...
```

- 호출부가 문자열 리터럴을 직접 넘기다 보니 **오타를 컴파일러가 못 잡음** (`"RETRUNING clause"`라고 써도 컴파일 통과)
- 어떤 값들이 유효한지 타입 정의만 봐서는 알 수 없음 — 실제 사용처를 다 찾아봐야 전체 목록을 알 수 있음
- 이런 패턴이 `TranslateError`에 5곳(`Insert`/`Update`/`Delete`/`Query`/`Select` Option), 그리고 내가 직전에 작업해 머지한 PR #1972(`CREATE TABLE`의 `TEMPORARY`/`LIKE`/`CLONE` 거부)의 `UnsupportedCreateTableOption`까지 총 6곳에서 반복됨 — #1972 배경은 아래 "🔗 참고"의 CREATE TABLE 옵션 거부 노트 참고

### 해결 — 전용 enum + `strum_macros::Display`

```rust
// core/src/translate/error.rs (리팩터링 후)
use strum_macros::Display;

#[derive(Display, Debug, Clone, Copy, Serialize, PartialEq, Eq)]
pub enum InsertOption {
    #[strum(to_string = "RETURNING clause")]
    Returning,

    #[strum(to_string = "ON CONFLICT clause")]
    OnConflict,

    #[strum(to_string = "table alias")]
    TableAlias,

    #[strum(to_string = "PARTITION clause")]
    Partition,

    #[strum(to_string = "OVERWRITE clause")]
    Overwrite,

    #[strum(to_string = "TABLE keyword")]
    TableKeyword,
}

#[error("unsupported INSERT option: {0}")]
UnsupportedInsertOption(InsertOption),
```

```rust
// core/src/translate.rs (호출부, 리팩터링 후)
let violation = if returning.is_some() {
    Some(InsertOption::Returning)
} else if on.is_some() {
    Some(InsertOption::OnConflict)
} // ...
```

- `#[strum(to_string = "...")]`: 이 variant가 `.to_string()` / `{}` 포맷팅될 때 출력할 문자열을 지정 — 사람이 읽는 에러 메시지는 리팩터링 전후로 **한 글자도 바뀌지 않음**
- 이제 오타를 내면 `InsertOption::Retruning`처럼 **컴파일 에러**가 남 (`no variant named 'Retruning'`)
- `PartialEq, Eq`를 derive해서 기존처럼 테스트에서 `assert_eq!(actual, TranslateError::UnsupportedInsertOption(InsertOption::Returning))` 형태로 비교 가능

### 이슈에 예시로 없던 6번째 대상 — `CreateTableOption`

`InsertOption`/`UpdateOption`/`DeleteOption`/`QueryOption`/`SelectOption` 5개는 이슈 본문에 직접 나열돼 있었지만, PR #1972에서 내가 추가한 `UnsupportedCreateTableOption(&'static str)`도 정확히 같은 문제를 갖고 있어서 같은 브랜치에서 같이 처리함.

```rust
// core/src/translate/error.rs
#[derive(Display, Debug, Clone, Copy, Serialize, PartialEq, Eq)]
pub enum CreateTableOption {
    #[strum(to_string = "TEMPORARY clause")]
    Temporary,

    #[strum(to_string = "LIKE clause")]
    Like,

    #[strum(to_string = "CLONE clause")]
    Clone,
}

#[error("unsupported CREATE TABLE option: {0}")]
UnsupportedCreateTableOption(CreateTableOption),
```

- 나머지 5개와 완전히 동일한 구조 — enum 이름/variant만 다르고 `strum`·`thiserror` 연동 방식은 그대로 재사용
- 자세한 배경(PR #1972가 왜/어떻게 이 variant를 추가했는지)은 [CREATE TABLE 옵션 거부 노트](참고 섹션) 참고

### 이슈에 예시로 없던 7번째 대상 — `JoinConstraintReason`

`translate/query.rs`를 다시 훑어보다가 하나 더 찾음. `UnsupportedJoinConstraint(String)`도 `SqlJoinConstraint`(4개뿐인 닫힌 집합) 중 `Using`/`Natural` 두 경우에만 항상 `"USING"`/`"NATURAL"` 리터럴을 넘기고 있었음 — 이름은 `...Option`이 아니고 타입도 `&'static str`가 아니라 `String`이라 처음엔 놓쳤지만, "닫힌 집합을 문자열로 표현"한다는 본질은 동일.

```rust
// core/src/translate/error.rs
#[derive(Display, Debug, Clone, Copy, Serialize, PartialEq, Eq)]
pub enum JoinConstraintReason {
    #[strum(to_string = "USING")]
    Using,

    #[strum(to_string = "NATURAL")]
    Natural,
}

#[error("unsupported join constraint: {0}")]
UnsupportedJoinConstraint(JoinConstraintReason),
```

```rust
// core/src/translate/query.rs (호출부)
SqlJoinConstraint::Using(_) => {
    Err(TranslateError::UnsupportedJoinConstraint(JoinConstraintReason::Using).into())
}
SqlJoinConstraint::Natural => {
    Err(TranslateError::UnsupportedJoinConstraint(JoinConstraintReason::Natural).into())
}
```

- `String` → 전용 enum도 같은 방식으로 되는 이유는 아래 "왜 `thiserror`의 `{0}`이 그대로 동작하는가"와 동일 — `thiserror`는 필드 타입이 `Display`이기만 하면 됨
- 이걸 찾은 계기: 리뷰 관점에서 "이슈 예시가 5개(혹은 6개)뿐이라고 그게 전부는 아니다"라는 피드백을 받고, 같은 파일 안에서 동일 패턴을 다시 검색(`grep`)해서 발견함 — 기계적으로 안 놓치려면 "닫힌 집합 + 문자열 리터럴"이라는 패턴 자체로 검색하는 게 variant 이름을 하나하나 아는 것보다 신뢰도가 높음

### 왜 `thiserror`의 `{0}`이 그대로 동작하는가

```rust
#[error("unsupported INSERT option: {0}")]
UnsupportedInsertOption(InsertOption),
```

- `thiserror`의 `#[error("...")]`는 내부적으로 `write!(f, "...", self.0)`처럼 필드를 그대로 포맷 인자로 넘김 → 필드 타입이 `Display`를 구현하고 있기만 하면 타입이 무엇이든(`&str`, `String`, `InsertOption`, ...) 그대로 동작함
- 즉 `&'static str` → `InsertOption`으로 필드 타입을 바꿔도 `#[error(...)]` 매크로 쪽은 **한 글자도 안 고쳐도 됨** — `InsertOption`이 `strum`의 `Display`를 구현하고 있어서 `str`이 `Display`를 구현하는 것과 동일하게 취급되기 때문
- 크레이트 추가 부담 없음: `strum_macros`는 이미 이전 PR들에서 다른 enum에 쓰던 중이라 `core/Cargo.toml`에 기존 의존성으로 있었음

### 함정 — `#[derive(Serialize)]`는 `strum::Display`와 완전히 별개로 동작한다

작업 중 실제로 겪은 회귀 버그. `strum::Display`는 `#[strum(to_string = "...")]`로 지정한 문자열을 쓰지만, `#[derive(Serialize)]`는 그 값을 전혀 모름 — serde 기본 동작은 unit variant를 **Rust 식별자 이름 그대로**(`Temporary`, `TableAlias`, ...) 직렬화함. 즉 `strum(to_string = "TEMPORARY clause")`를 붙였어도 JSON 직렬화 결과는 `"Temporary"`가 되어버림.

```rust
// 처음 작성한 버전 (버그)
#[derive(Display, Debug, Clone, Copy, Serialize, PartialEq, Eq)]
pub enum CreateTableOption {
    #[strum(to_string = "TEMPORARY clause")]
    Temporary,   // Display: "TEMPORARY clause" (O) / Serialize: "Temporary" (X, 원래는 "TEMPORARY clause"였어야 함)
}
```

- **발견 경로**: `cargo test -p gluesql-core --lib`(514~515개)는 전부 통과해서 못 잡음 — 이건 `TranslateError`의 `PartialEq` 비교(Rust 값끼리 비교)만 검증하지, JSON 직렬화 결과는 안 봄. `test-suite/fixtures/alter/create_table.sql`에 `@json: "TEMPORARY clause"`처럼 **JSON 문자열 값을 직접 비교**하는 fixture가 있었는데, 이건 `cargo test -p gluesql_memory_storage --test memory_storage`로 별도 크레이트에서 돌려야 실행됨. 즉 **core 크레이트 유닛 테스트만 돌리고 fixture 통합 테스트를 안 돌리면 이 회귀를 놓칠 수 있음**
- **수정**: 6개 enum(+`JoinConstraintReason`) 전체 variant에 `#[serde(rename = "...")]`를 `#[strum(to_string = "...")]`와 나란히 붙여서 Display/Serialize 둘 다 원래 문자열을 내도록 맞춤

```rust
#[strum(to_string = "TEMPORARY clause")]
#[serde(rename = "TEMPORARY clause")]
Temporary,
```

- **교훈**: 이 저장소에서 `Serialize`를 derive하는 에러 타입을 건드릴 땐 `cargo test -p gluesql-core --lib`뿐 아니라 `cargo test -p gluesql_memory_storage --test memory_storage`(fixture 기반 통합 테스트)까지 반드시 같이 돌려야 함

### 리팩터링 절차 — TDD RED → GREEN (동작 불변 리팩터링)

동작(에러 메시지)이 바뀌면 안 되는 순수 리팩터링이라, "새 동작에 대한 실패 테스트"보다는 **"아직 없는 타입을 쓰는 테스트를 먼저 작성 → 컴파일 실패(RED) 확인 → 구현으로 컴파일 통과(GREEN)"** 방식으로 진행:

1. 테스트 코드를 `TranslateError::UnsupportedInsertOption(InsertOption::Returning)`처럼 **아직 존재하지 않는 타입**을 쓰도록 먼저 고침
2. `cargo check -p gluesql-core --lib --tests` → `error[E0433]: failed to resolve: use of undeclared type` 확인 (RED — 정확히 "타입이 없다"는 이유로 실패해야 함)
3. `error.rs`에 enum 정의 + 호출부(`translate.rs`/`translate/query.rs`) 수정
4. `cargo test -p gluesql-core --lib` → 통과 확인 (GREEN)
5. 7개 enum(`InsertOption`/`UpdateOption`/`DeleteOption`/`QueryOption`/`SelectOption`/`CreateTableOption`/`JoinConstraintReason`) 전부 반복 후 `cargo test -p gluesql_memory_storage --test memory_storage`(fixture 통합 테스트), `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --all`로 마무리

이 방식의 장점: 컴파일러 자체가 "누락된 호출부"를 전부 찾아주기 때문에, 21곳에 흩어진 호출부를 하나도 빠짐없이 고쳤는지 수작업으로 추적할 필요가 없음.

### 실제 동작 확인 — CLI 레벨

```
$ echo "CREATE TABLE Foo (id INTEGER); INSERT INTO Foo VALUES (1) RETURNING *;" | gluesql-cli
[error] translate: unsupported INSERT option: RETURNING clause

$ echo "CREATE TABLE Foo (id INTEGER); CREATE TABLE Bar LIKE Foo;" | gluesql-cli
[error] translate: unsupported CREATE TABLE option: LIKE clause

$ echo "CREATE TABLE Foo (id INTEGER); CREATE TABLE Bar (id INTEGER); SELECT * FROM Foo JOIN Bar USING (id);" | gluesql-cli
[error] translate: unsupported join constraint: USING
```

리팩터링 전 문자열(`"RETURNING clause"`, `"LIKE clause"`, `"USING"` 등)과 리팩터링 후 각 enum variant의 `strum::Display` 출력이 정확히 일치 — 타입만 안전해졌고 사용자에게 보이는 에러 메시지는 그대로임을 CLI로 직접 확인함 (7개 옵션 전부 확인).

> [!NOTE]
> **PR #1972와의 관계 (업데이트)**
> 처음엔 `UnsupportedCreateTableOption(&'static str)`을 #1975 이슈 범위 밖(#1972에서 내가 막 추가한 variant, 이슈 본문엔 언급 없음)으로 보고 건드리지 않았는데, "이슈가 든 예시가 전부는 아니다"는 판단하에 같은 브랜치에서 `CreateTableOption`과 `JoinConstraintReason`까지 함께 enum으로 타입화함. 위 "이슈에 예시로 없던 7번째 대상" 섹션 참고.

### 가장 예상 밖이었던 버그 — variant 이름이 `Clone`이라 전혀 무관한 크레이트의 테스트가 깨짐

PR을 올리고 CI를 돌렸더니 `gluesql-macros`(내가 전혀 안 건드린 크레이트)의 `compile_fail` 테스트(trybuild로 "이 코드는 컴파일이 실패해야 하고, 에러 메시지는 정확히 이거여야 한다"를 검증하는 테스트)가 깨졌다. 처음엔 "CI 캐시 문제"로 의심했는데 — **완전히 새로운 worktree(캐시 하나도 없는 상태)에서도 재현**되는 걸 확인하고 나서야 내 코드가 진짜 원인이라는 걸 알게 됨.

```
EXPECTED: error[E0277]: the trait bound `T: Clone` is not satisfied
ACTUAL  : error[E0277]: the trait bound `T: std::clone::Clone` is not satisfied
```

**원인**: `CreateTableOption` enum에 `Clone`이라는 variant를 만들었는데(`CREATE TABLE ... CLONE <table>` 구문을 표현하려고), 이 enum 자체도 `#[derive(..., Clone, ...)]`로 표준 `Clone` **트레잇**을 derive하고 있었다. **"variant 이름 `Clone`"과 "트레잇 이름 `Clone`"이 겹치면서**, `gluesql-macros`의 `#[derive(ToGlueRow)]`가 생성하는 코드(`::core::clone::Clone::clone(...)`) 안에서 `T: Clone`이 안 만족될 때 rustc가 그 진단 메시지를 출력하는 방식이 달라졌다 — 원래는 `Clone`이라고 짧게 쓰던 걸 `std::clone::Clone`로 완전정규화해서 출력하게 됨. `gluesql_core`가 `pub`으로 노출하는 이름 중에 `Clone`이 하나 더 생기니, rustc의 진단 출력기가 모호함을 피하려고 더 명시적인 경로를 택한 것으로 보임 (전체 크레이트 그래프에 걸친 영향이라 정확한 내부 메커니즘까지는 확인 못 함).

**검증 방법**: 별도 worktree에서 `CreateTableOption::Clone` → `CreateTableOption::CloneTable`로 variant 이름만 바꿔서 같은 테스트를 다시 돌려봄 → 9개 서브테스트 전부 통과. 이름 하나 바꾼 게 원인이자 해결책이라는 게 확정됨.

```rust
// 수정 전 — 트레잇 Clone과 이름이 겹침
pub enum CreateTableOption {
    Temporary,
    Like,
    #[strum(to_string = "CLONE clause")]
    Clone,   // ← 이 이름이 문제
}

// 수정 후
pub enum CreateTableOption {
    Temporary,
    Like,
    #[strum(to_string = "CLONE clause")]
    CloneTable,   // strum 문자열("CLONE clause")은 그대로 — Display/JSON 출력 불변
}
```

> [!NOTE]
> **교훈**
> Rust의 표준 트레잇 이름(`Clone`, `Debug`, `Copy`, `Eq`, `Default` 등)과 겹치는 enum variant 이름은 피하는 게 좋다. 같은 파일/모듈 안에서는 네임스페이스(타입 vs 값)가 달라 컴파일 자체는 되지만, **rustc의 진단 메시지 출력기는 크레이트 그래프 전체를 고려**하기 때문에, 전혀 무관해 보이는 다른 크레이트의 테스트(특히 trybuild처럼 정확한 에러 문구를 스냅샷으로 비교하는 테스트)를 깨뜨릴 수 있다. 원인 파악이 극도로 어려운 종류의 버그라서(증상이 나타나는 곳과 원인이 있는 곳이 완전히 다른 크레이트), "완전히 새 worktree에서 재현되는지"로 캐시 문제와 실제 코드 문제를 구분하는 절차가 없었으면 못 찾았을 것.

### 메인테이너 확인 — 근본 원인은 매크로 쪽에 있었다 ([PR #1981](https://github.com/gluesql/gluesql/pull/1981))

PR에 리뷰 코멘트가 달렸는데, 메인테이너(panarch)가 정확히 같은 원인을 독립적으로 짚어줬다:

> The new `CreateTableOption::Clone` name only changes how rustc renders the unrelated `ToGlueRow` trait-bound diagnostic, from `Clone` to `std::clone::Clone`. Since trybuild compares the entire stderr output, that formatting difference causes the check to fail.

그리고 `CloneTable`로 이름을 피하는 임시방편이 아니라, **`ToGlueRow` 매크로가 애초에 `Clone`을 요구하지 않도록** 근본적으로 고치는 별도 PR(`#1981`, Draft)을 열었다:

- **기존**: 필드를 `IntoParamLiteral`로 변환하기 전에 `::core::clone::Clone::clone(&self.field)`로 **일단 복제**부터 했음 → 그래서 제네릭 타입 `T`가 `Clone`을 구현해야 했음
- **변경**: 복제 없이 **참조(`&T`)를 그대로** 변환하도록 바꾸고, "빌린 값을 쿼리 파라미터로 변환"하는 새 트레잇 `ToParamLiteral`을 추가. `#[derive(ToGlueRow)]`가 생성하는 제약이 `T: Clone + IntoParamLiteral` → `T: ToParamLiteral`로 바뀌면서 **`Clone` 요구사항 자체가 사라짐** (`Option<T>` 재귀 처리도 개선되어 `Clone` 안 쓰는 타입도 지원)

이 PR이 머지되면 `to_glue_row_missing_bounds.rs` 스냅샷 자체가 더 이상 `T: Clone`을 요구하지 않게 되어, variant 이름이 `Clone`이든 뭐든 이 문제가 재발하지 않는다. 즉:
- **내 수정(`CloneTable`로 rename)**: 지금 당장 PR을 통과시키기 위한 **국소적 회피(workaround)** — 이 enum 하나의 문제만 해결
- **메인테이너의 `#1981`**: **근본 원인 제거** — 앞으로 누구든 `Clone`이라는 이름을 다른 곳에 또 써도 이 문제가 재발하지 않게 매크로 자체를 고침

리뷰에 아래 코멘트를 남기고 CI 12개 체크(Run tests, coverage 포함) 전부 통과 확인함:

> I renamed `CreateTableOption::Clone` to `CreateTableOption::CloneTable`. This follows the same naming style already used in `InsertOption` (e.g. `TableAlias`, `TableKeyword`)... all 12 checks are now passing on that commit, including `Run tests` and `coverage`.

### 🔧 트러블슈팅 체크리스트 — "무관해 보이는 크레이트의 테스트가 갑자기 깨질 때"

이번 경험을 일반화하면, 나중에 비슷한 상황(내가 건드리지 않은 크레이트의 테스트가 CI에서 갑자기 실패)을 만났을 때 쓸 수 있는 절차:

1. **정말 무관한지 의심하기 전에, 우선 diff에 새로 추가된 `pub` 심볼 이름을 확인한다** — 특히 표준 트레잇 이름(`Clone`/`Debug`/`Copy`/`Eq`/`Ord`/`Default`/`Hash` 등)과 겹치는 이름이 있는지 (`Display`도 주의: strum 등에서 흔히 씀)
2. **"캐시/환경 문제"라고 성급히 결론 내리지 않는다** — `cargo clean` 없이 로컬에서 여러 번 빌드해온 `target/`은 상태가 계속 누적되므로, 재현이 안 되거나 될 때 원인 판단을 흐린다
3. **완전히 새로운 `git worktree`로 A/B 비교한다**: `git worktree add <경로> <커밋>`으로 (a) 변경 전 커밋, (b) 변경 후 커밋 각각에서 실패하는 테스트만 단독으로 돌려본다 (`cargo test -p <크레이트> --test <테스트파일>`). 둘 다 "완전히 새 target"이라는 조건이 동일해야 캐시 문제와 코드 문제를 구분할 수 있음
4. **재현되면 이분 탐색(bisection)**: 의심되는 심볼 이름 하나만 바꿔서 같은 worktree에서 재테스트 — 원인과 해결책을 동시에 확정할 수 있음
5. **trybuild류(스냅샷 비교) 테스트가 실패 원인이면**, 실제 로직 문제가 아니라 "진단 메시지 텍스트가 통째로 비교되는" 특성 때문일 가능성을 고려 — 메시지 안에 내 변경과 무관해 보이는 트레잇/타입 이름이 있는지 살펴봄
6. **로컬 임시 검증**: `#[cfg(test)] mod temp_json_check { ... }`처럼 던져쓰는 테스트 + `--nocapture`로 실제 런타임 값을 눈으로 직접 확인 (JSON 직렬화 확인할 때 썼던 방식과 동일한 발상)

## 🔗 참고

- [GlueSQL Issue #1975 — Use typed enums for unsupported SQL options](https://github.com/gluesql/gluesql/issues/1975)
- [GlueSQL PR #1981 — Remove Clone requirement from ToGlueRow derive](https://github.com/gluesql/gluesql/pull/1981) — `CreateTableOption::Clone` 이름 충돌의 근본 원인을 매크로 쪽에서 제거하는 메인테이너의 후속 PR
- [(Rust) CREATE TABLE 옵션 거부(early-return 검증, GlueSQL #1972) - 핵심 개념 및 특징 정리]([Rust]%20CREATE%20TABLE%20옵션%20거부%28early-return%20검증,%20GlueSQL%20PR%201972%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 리팩터링의 배경이 된 선행 PR
- [strum 크레이트 문서](https://docs.rs/strum)
- (Rust) 에러 처리(thiserror, Result, ? 연산자) - 핵심 개념 및 특징 정리
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리]([Rust]%20GlueSQL%20프로젝트%20구조와%20필요%20문법%20개관%20-%20핵심%20개념%20및%20특징%20정리.md)

## 관련 문서

- [(Rust) 오픈소스 컨트리뷰션 실전 가이드(이슈 찾기부터 PR 작성까지, GlueSQL 사례) - 핵심 개념 및 특징 정리]([Rust]%20오픈소스%20컨트리뷰션%20실전%20가이드(이슈%20찾기부터%20PR%20작성까지,%20GlueSQL%20사례)%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트를 "스코프를 넓혀 처리한 실제 예"로 인용하는 오픈소스 기여 가이드
- [(Rust) 오픈소스 PR 리뷰 대응기(CodeRabbit, GlueSQL PR 2016) - 핵심 개념 및 특징 정리]([Rust]%20오픈소스%20PR%20리뷰%20대응기%28CodeRabbit,%20GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 이 노트를 "사람 리뷰 대응 사례"로 인용하는 PR #2016 리뷰 대응기
