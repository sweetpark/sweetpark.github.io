---
title: "모듈 시스템과 가시성(mod, pub, pub use)"
tags: [학습, 개발-CS, 언어, Rust, 모듈, 가시성, GlueSQL]
created: 2026-09-05
modified: 2026-09-05
---

# 모듈 시스템과 가시성 (mod, pub, pub use)

> [!NOTE]
> GlueSQL의 `core` 크레이트는 수십 개의 하위 모듈로 구성되어 있지만, 사용자는 `gluesql_core::prelude::*` 하나만 `use`하면 필요한 타입을 전부 가져올 수 있음. 이는 `mod`/`pub`/`pub use`를 조합한 모듈 설계 덕분.

## 📌 개념

### 크레이트 최상위 모듈 구성

```rust
// core/src/lib.rs:1-36 (일부 축약)
#![deny(clippy::str_to_string)]

// re-export
pub use {chrono, sqlparser};

mod glue;
mod mock;
mod result;

pub mod ast;
pub mod data;
pub mod executor;
pub mod parse_sql;
pub mod plan;
pub mod query_builder;
pub mod row_conversion;
pub mod store;
pub mod translate;

pub mod prelude {
    pub use crate::{
        ast::DataType,
        data::{Key, Value},
        executor::{Payload, PayloadVariable, execute},
        glue::Glue,
    };
}

pub mod error {
    pub use crate::result::*;
}
```

- `mod glue;` (앞에 `pub` 없음): 이 모듈은 **크레이트 내부에서만** 접근 가능. 외부 사용자는 `gluesql_core::glue::...`로 직접 접근할 수 없음
- `pub mod ast;`: 이 모듈은 **크레이트 밖에서도** `gluesql_core::ast::...`로 접근 가능
- `pub mod prelude { pub use crate::{...}; }`: 여기저기 흩어진 핵심 타입들(`Glue`, `Value`, `execute` 등)을 한 곳에 모아 **재수출(re-export)**. 사용자는 `use gluesql_core::prelude::*;` 한 줄로 자주 쓰는 타입을 전부 가져올 수 있음 — 내부 모듈 구조(`glue::Glue`가 실제로는 비공개 모듈에 있다는 사실)를 몰라도 됨
- `pub use {chrono, sqlparser};`: 의존 크레이트 자체를 재수출 — 사용자가 `chrono`를 별도로 `Cargo.toml`에 추가하지 않고도 `gluesql_core::chrono`로 바로 사용 가능

### 하위 모듈에서의 선택적 재수출

```rust
// core/src/store.rs:1-27 (일부 축약)
mod alter_table;
mod function;
mod index;
mod metadata;
mod planner;
mod transaction;

pub trait GStore: Store + Index + Metadata + CustomFunction {}

pub use {
    alter_table::{AlterTable, AlterTableError},
    function::{CustomFunction, CustomFunctionMut},
    index::{Index, IndexError, IndexMut},
    metadata::{MetaIter, Metadata},
    planner::Planner,
    transaction::Transaction,
};
```

- `mod alter_table;` 등 각 하위 모듈 파일(`alter_table.rs`)은 비공개로 선언
- 하지만 그 안의 `AlterTable`, `AlterTableError` 같은 **필요한 타입만 골라서** `pub use`로 다시 내보냄
- 결과적으로 외부에서는 `gluesql_core::store::AlterTable`로 접근하지만, 실제 정의 파일(`store/alter_table.rs`)의 존재는 몰라도 됨 → **내부 파일 구조를 자유롭게 리팩터링해도 외부 API(경로)는 그대로 유지**할 수 있는 캡슐화 기법

> [!NOTE]
> **C의 헤더 파일(.h)과의 차이**
> C에서는 `.h` 파일에 선언을 나열하고 `#include`로 가져오는 방식이라, 내부 구현 파일 이름이 곧 외부에 노출되는 경로와 밀접하게 얽히기 쉽다. Rust는 `mod`(비공개 파일 구조)와 `pub use`(공개 API 경로)를 분리할 수 있어서, 실제 폴더/파일 구조를 바꿔도 사용자가 `use`하는 경로(`prelude::Glue` 등)는 그대로 유지할 수 있음.

## 🔗 참고

- [GlueSQL - core/src/lib.rs](https://github.com/gluesql/gluesql/blob/main/core/src/lib.rs)
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/[Rust]%20GlueSQL%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EA%B5%AC%EC%A1%B0%EC%99%80%20%ED%95%84%EC%9A%94%20%EB%AC%B8%EB%B2%95%20%EA%B0%9C%EA%B4%80%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)
