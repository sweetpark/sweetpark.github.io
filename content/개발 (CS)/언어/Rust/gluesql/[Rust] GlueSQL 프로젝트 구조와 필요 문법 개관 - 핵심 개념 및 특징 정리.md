---
title: "\"GlueSQL 프로젝트 구조와 필요 문법 개관\""
tags: [학습, 개발-CS, 언어, Rust, GlueSQL, 프로젝트구조, 오픈소스아카데미]
created: 2026-09-05
modified: 2026-09-05
---

# GlueSQL 프로젝트 구조와 필요 문법 개관

> [!NOTE]
> GlueSQL(SQL 데이터베이스 엔진) 프로젝트를 읽고 기여하기 위해 알아야 하는 Rust 문법을 항목별로 정리한 시리즈의 개관 노트. 각 문법 항목은 별도 노트로 분리되어 있으며, 이 문서는 프로젝트 구조와 각 노트로의 안내 역할을 함.

## 📌 개념

### 워크스페이스(Workspace) 구성

GlueSQL은 여러 크레이트(crate)로 구성된 Cargo 워크스페이스다 (`Cargo.toml`).

| 크레이트 | 역할 |
| --- | --- |
| `core` | SQL 파싱·플래닝·실행을 담당하는 핵심 엔진 (`gluesql-core`) |
| `cli` | 커맨드라인 인터페이스 |
| `macros` | Row ↔ 구조체 변환을 위한 절차적 매크로(`FromGlueRow`, `ToGlueRow`) |
| `storages/*` | 저장소 백엔드 구현체 (memory, sled, redis, mongo, parquet, csv, json, file, git, composite 등) |
| `pkg/rust` | Rust 언어 바인딩 패키지 |
| `test-suite` | 여러 크레이트가 공유하는 테스트 유틸리티 |

핵심 흐름: **SQL 문자열 → 파싱(AST) → 플랜(Plan) → 실행(Executor) → 저장소(Store) 접근** 구조로, `core`가 파싱/실행 로직을, `storages/*`가 실제 데이터 저장을 담당하고 이 둘을 `Store`/`StoreMut` 트레잇으로 연결한다.

### 동기(Sync) 기반 설계

GlueSQL의 core 실행 엔진은 **async/await를 사용하지 않는 동기(synchronous) 코드**로 작성되어 있다. 대신 에러 전파는 `?` 연산자를 통해 이루어진다 (`core/src/executor/filter.rs:45-58`). 저장소 크레이트 중 일부(sled 등)는 내부적으로 비동기 런타임을 쓸 수 있지만, `Store`/`StoreMut` 트레잇 자체는 동기 시그니처로 정의되어 있다.

### 이 시리즈의 다른 노트

GlueSQL 코드베이스를 이해하는 데 필요한 Rust 문법을 아래 노트들로 분리해 정리함.

- [(Rust) CREATE TABLE 옵션 거부(early-return 검증, GlueSQL #1972) - 핵심 개념 및 특징 정리]([Rust]%20CREATE%20TABLE%20옵션%20거부%28early-return%20검증,%20GlueSQL%20PR%201972%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) TranslateError Enum 타입화(strum·thiserror, GlueSQL #1975) - 핵심 개념 및 특징 정리]([Rust]%20TranslateError%20Enum%20타입화%28strum·thiserror,%20GlueSQL%20Issue%201975%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- (Rust) 트레잇과 제네릭(Trait Object, Blanket Impl, 제네릭 경계) - 핵심 개념 및 특징 정리
- (Rust) 열거형과 패턴 매칭(Enum & Match) - 핵심 개념 및 특징 정리
- (Rust) 에러 처리(thiserror, Result, ? 연산자) - 핵심 개념 및 특징 정리
- (Rust) 매크로(절차적 매크로 & macro_rules!) - 핵심 개념 및 특징 정리
- (Rust) 모듈 시스템과 가시성(mod, pub, pub use) - 핵심 개념 및 특징 정리
- (Rust) 이터레이터와 클로저(Iterator Chain & Closure) - 핵심 개념 및 특징 정리
- (Rust) 라이프타임 심화(구조체·트레잇 함수의 라이프타임) - 핵심 개념 및 특징 정리

## 🔗 참고

- [GlueSQL GitHub](https://github.com/gluesql/gluesql)
- (Rust) 소유권과 참조(Ownership & Borrowing) - 핵심 개념 및 특징 정리
