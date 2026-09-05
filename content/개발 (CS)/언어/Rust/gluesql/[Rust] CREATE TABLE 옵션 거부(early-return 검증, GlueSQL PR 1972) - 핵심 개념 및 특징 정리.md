---
title: "\"CREATE TABLE 옵션 거부(early-return 검증, GlueSQL #1972)\""
tags: [학습, 개발-CS, 언어, Rust, thiserror, GlueSQL, 오픈소스아카데미, "#1972"]
created: 2026-09-05
modified: 2026-09-05
---

# CREATE TABLE 옵션 거부 (early-return 검증, GlueSQL #1972)

> [!NOTE]
> 내가 작업해서 머지한 [PR #1972](https://github.com/gluesql/gluesql/pull/1972)(2026-07-28 머지, 커밋 `7c9009e`) 기록. GlueSQL이 지원하지 않는 `CREATE TABLE ... TEMPORARY` / `LIKE` / `CLONE` 구문을 에러 없이 조용히 무시(사실상 빈 테이블 생성)하던 문제를 고침. 여기서 쓴 `&'static str` 기반 에러 표현 패턴이 이후 [Issue #1975](https://github.com/gluesql/gluesql/issues/1975)의 배경이 됨.

## 📌 개념

### 문제 — 지원하지 않는 옵션을 조용히 무시

리팩터링 전에는 `CREATE TABLE t2 LIKE t1`처럼 GlueSQL이 실제로 구현하지 않은 구문을 파싱은 성공시키고, 해당 옵션을 그냥 버린 채 빈 테이블을 만들어버림. `CREATE TEMPORARY TABLE`도 영구 테이블로 만들어짐 — 사용자 입장에서는 "성공했다"고 나오지만 기대한 동작이 아님.

### 해결 — early-return 검증 구조

```rust
// core/src/translate.rs:191-216 (일부 축약)
SqlStatement::CreateTable(SqlCreateTable {
    if_not_exists,
    name,
    columns,
    query,
    engine,
    constraints,
    comment,
    temporary,
    like,
    clone,
    ..
}) => {
    let violation = if *temporary {
        Some("TEMPORARY clause")
    } else if like.is_some() {
        Some("LIKE clause")
    } else if clone.is_some() {
        Some("CLONE clause")
    } else {
        None
    };

    if let Some(reason) = violation {
        return Err(TranslateError::UnsupportedCreateTableOption(reason).into());
    }

    let columns = columns
        .iter()
        .map(|column_def| translate_column_def(column_def, params))
        .collect::<Result<Vec<_>>>()?;
    // ... 이후 컬럼 변환 등 정상 처리로 진행
}
```

```rust
// core/src/translate/error.rs
#[error("unsupported CREATE TABLE option: {0}")]
UnsupportedCreateTableOption(&'static str),
```

- **조기 반환(early-return) 검증 구조**: `if/else if` 체인으로 지원하지 않는 옵션 중 하나라도 걸리면 `Some(reason)`을 만들고, 그 즉시 `Err(...)`로 반환 — 이후의 정상 처리 로직(컬럼 파싱 등)까지 갈 필요가 없음을 코드 흐름에서 명확히 보여줌
- `sqlparser`가 파싱해준 `SqlCreateTable` 구조체에서 GlueSQL이 실제로 처리할 수 있는 필드(`columns`, `name`, `if_not_exists` 등)만 구조 분해(destructuring)로 꺼내 쓰고, 나머지는 `..`로 무시 — `temporary`/`like`/`clone`처럼 검증에만 쓰는 필드는 이름으로 명시해서 꺼냄
- 새 에러 variant `TranslateError::UnsupportedCreateTableOption(&'static str)` 추가 — 이 시점엔 아직 문자열 기반. 오타를 컴파일러가 못 잡는 한계는 동일하게 존재함

### 검증

- `test-suite/fixtures/alter/create_table.sql`에 `TEMPORARY`/`LIKE`/`CLONE` 3가지 케이스 각각 테스트 추가
- 추가된 코드 32줄 전부 커버리지 포함, 전체 테스트 통과 확인 후 머지

> [!NOTE]
> **업데이트 — Issue #1975 작업에서 enum으로 전환됨**
> 여기서 추가한 `UnsupportedCreateTableOption(&'static str)`은 이후 [Issue #1975](https://github.com/gluesql/gluesql/issues/1975) 작업(같은 브랜치)에서 `CreateTableOption` enum으로 타입화됨. 이슈 본문엔 이 variant가 명시적으로 언급되지 않았지만, 동일한 문자열 기반 패턴이라 같이 정리함. 자세한 내용은 아래 TranslateError Enum 타입화 노트 참고.

## 🔗 참고

- [GlueSQL PR #1972 — Reject TEMPORARY/LIKE/CLONE options on CREATE TABLE](https://github.com/gluesql/gluesql/pull/1972)
- [(Rust) TranslateError Enum 타입화(strum·thiserror, GlueSQL #1975) - 핵심 개념 및 특징 정리]([Rust]%20TranslateError%20Enum%20타입화%28strum·thiserror,%20GlueSQL%20Issue%201975%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 여기서 쓴 문자열 기반 패턴이 반복되던 걸 정리한 후속 작업
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리]([Rust]%20GlueSQL%20프로젝트%20구조와%20필요%20문법%20개관%20-%20핵심%20개념%20및%20특징%20정리.md)
- (Rust) 에러 처리(thiserror, Result, ? 연산자) - 핵심 개념 및 특징 정리
