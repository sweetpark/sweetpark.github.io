---
title: "에러 처리(thiserror, Result, ? 연산자)"
tags: [학습, 개발-CS, 언어, Rust, 에러처리, thiserror, GlueSQL]
created: 2026-09-05
modified: 2026-09-05
---

# 에러 처리 (thiserror, Result, ? 연산자)

> [!NOTE]
> GlueSQL은 예외(exception) 없이 `Result<T, E>` 값과 `?` 연산자만으로 에러를 처리하는 Rust의 표준 방식을 따름. `thiserror` 크레이트로 각 계층(파서/실행/평가 등)마다 별도의 에러 타입을 만들고, `#[from]`으로 하위 에러를 상위 에러로 자동 변환함.

## 📌 개념

### 계층별 에러 enum + `thiserror`

```rust
// core/src/result.rs:16-71 (일부 축약)
#[derive(ThisError, Serialize, Debug, PartialEq)]
pub enum Error {
    #[error("storage: {0}")]
    StorageMsg(String),

    #[error("parser: {0}")]
    Parser(String),

    #[error("translate: {0}")]
    Translate(#[from] TranslateError),

    #[error("execute: {0}")]
    Execute(#[from] ExecuteError),

    #[error("evaluate: {0}")]
    Evaluate(#[from] EvaluateError),
}

pub type Result<T, E = Error> = std::result::Result<T, E>;
```

- `#[derive(ThisError, ...)]`: `thiserror` 크레이트의 매크로로, `#[error("...")]`에 적은 문자열을 바탕으로 `std::error::Error`와 `Display`를 자동 구현해줌 (직접 `impl Display for Error` 안 써도 됨)
- `#[error("storage: {0}")]`: `{0}`은 해당 variant의 0번째 필드 값을 메시지에 끼워 넣음 (`Parser(String)` → `"parser: 문법 오류 메시지"`)
- `#[from] TranslateError`: 이 필드에 붙이면 `TranslateError`에 대해 `impl From<TranslateError> for Error`가 자동 생성됨 → 하위 모듈의 에러(`TranslateError`, `ExecuteError`, `EvaluateError`)를 `?` 연산자로 던지기만 해도 자동으로 상위 `Error`로 변환됨

### 모듈별 세부 에러 타입 — `EvaluateError`

```rust
// core/src/executor/evaluate/error.rs:12-161 (일부 축약)
#[derive(ThisError, Serialize, Debug)]
pub enum EvaluateError {
    #[error("literal add on non-numeric")]
    LiteralAddOnNonNumeric,

    #[error("function requires string value: {0}")]
    FunctionRequiresStringValue(String),

    #[error("identifier not found: {0}")]
    IdentifierNotFound(String),

    #[error("identifier not found: {table_alias}.{column_name}")]
    CompoundIdentifierNotFound { table_alias: String, column_name: String },
}
```

- 위 `Error::Evaluate(#[from] EvaluateError)`와 짝을 이뤄, `EvaluateError`가 발생하는 곳에서는 `Result<T, EvaluateError>`를 다루다가, 상위 함수에서 `?`로 반환하는 순간 자동으로 `Error::Evaluate(...)`로 감싸짐
- `{table_alias}.{column_name}`처럼 필드 이름을 직접 메시지에 넣을 수도 있음 (struct-like variant의 경우)

### `?` 연산자로 에러 전파하기

```rust
// core/src/glue.rs:26-43 (일부 축약)
pub fn plan_with_params<Sql, I, P>(&mut self, sql: Sql, params: I) -> Result<Vec<StatementPlan>>
where
    Sql: AsRef<str>,
    I: IntoIterator<Item = P>,
    P: IntoParamLiteral,
{
    let parsed = parse(sql)?; // 실패 시 즉시 Err를 반환하고 함수 종료
    let params: Vec<ParamLiteral> = params
        .into_iter()
        .map(IntoParamLiteral::into_param_literal)
        .collect();
    parsed
        .into_iter()
        .map(|p| {
            translate_with_params(&p, &params)
                .and_then(|statement| self.storage.plan(statement.into()))
        })
        .collect()
}
```

- `parse(sql)?`: `parse`가 `Result`를 반환할 때, `Ok(v)`면 `v`를 꺼내 계속 진행하고, `Err(e)`면 **그 자리에서 함수 전체가 `Err(e)`를 반환**하며 종료됨. 예외(try/catch)를 언어에 넣는 대신, `?`라는 문법 설탕(syntax sugar)으로 에러를 "값처럼" 다루는 것이 Rust의 특징
- `.and_then(...)`: `Result`가 `Ok`일 때만 다음 연산을 이어서 실행 (실패하면 그대로 `Err` 전파) — `?`를 클로저 체인 안에서 쓰기 어려운 경우 대안으로 사용

### 커스텀 에러 타입 예시 — `IndexError`

```rust
// core/src/store/index.rs:13-38
#[derive(ThisError, Serialize, Debug, PartialEq, Eq)]
pub enum IndexError {
    #[error("table not found: {0}")]
    TableNotFound(String),

    #[error("index name already exists: {0}")]
    IndexNameAlreadyExists(String),

    #[error("conflict - update failed - index value")]
    ConflictOnEmptyIndexValueUpdate,
}
```

> [!NOTE]
> **왜 async가 아니라 `?`만으로 충분한가**
> GlueSQL의 core 실행 엔진은 async/await 없이 완전히 동기(sync)로 작성됨. 에러 발생 여부와 무관하게 함수 호출이 즉시(블로킹) 끝나기 때문에, 비동기 런타임(tokio 등) 없이 `Result` + `?`만으로 에러 전파가 충분히 처리됨. 일부 저장소 구현체(sled 등)가 내부적으로 다른 방식을 쓸 수 있지만, `Store`/`StoreMut` 트레잇 시그니처 자체는 동기 함수로 고정되어 있음.

## 🔗 참고

- [thiserror 크레이트 문서](https://docs.rs/thiserror)
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/[Rust]%20GlueSQL%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EA%B5%AC%EC%A1%B0%EC%99%80%20%ED%95%84%EC%9A%94%20%EB%AC%B8%EB%B2%95%20%EA%B0%9C%EA%B4%80%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)
