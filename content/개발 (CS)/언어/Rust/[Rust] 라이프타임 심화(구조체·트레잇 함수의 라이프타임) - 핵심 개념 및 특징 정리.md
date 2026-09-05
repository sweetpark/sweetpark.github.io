---
title: "라이프타임 심화(구조체·트레잇 함수의 라이프타임)"
tags: [학습, 개발-CS, 언어, Rust, 라이프타임, GlueSQL]
created: 2026-09-05
modified: 2026-09-05
---

# 라이프타임 심화 (구조체·트레잇 함수의 라이프타임)

> [!NOTE]
> [소유권과 참조 노트]([Rust]%20소유권과%20참조%28Ownership%20&%20Borrowing%29%20-%20핵심%20개념%20및%20특징%20정리.md)에서 다룬 기본 참조 규칙을 넘어, GlueSQL은 **참조를 담은 구조체**와 **여러 라이프타임이 얽힌 함수 시그니처**를 실무 수준으로 사용함. 이 노트는 그 실전 패턴을 정리.

## 📌 개념

### 트레잇 메서드의 라이프타임 — `scan_data<'a>`

```rust
// core/src/store.rs:45
fn scan_data<'a>(&'a self, table_name: &str) -> Result<RowIter<'a>>;
```

- `<'a>`: 이 메서드만의 라이프타임 매개변수를 선언
- `&'a self`: 반환되는 `RowIter<'a>`가 **`self`를 빌린 기간(`'a`)만큼만** 유효함을 명시 — 즉 "이 이터레이터가 살아있는 동안은 원본 저장소(`self`)도 살아있어야 한다"는 컴파일러 차원의 보장
- 이 표시가 없으면, 이터레이터를 다 쓰기도 전에 저장소가 사라지는(dangling) 코드를 실수로 작성해도 컴파일러가 잡아내지 못함

### 참조를 담은 구조체 — `Filter<'a, T>`

```rust
// core/src/executor/filter.rs:10-14
pub struct Filter<'a, T: GStore> {
    storage: &'a T,
    where_clause: Option<&'a ExprPlan>,
    context: Option<Rc<RowContext<'a>>>,
}
```

- 구조체가 참조(`&'a T`, `&'a ExprPlan`)를 필드로 가지면, **구조체 자체에도 라이프타임을 선언**해야 함 (`Filter<'a, T>`)
- 의미: `Filter` 인스턴스는 `'a`만큼만 살 수 있고, 그 안의 모든 참조도 최소 `'a`만큼은 유효함이 보장됨 → `Filter`를 오래 들고 있으면서 원본 `storage`나 `where_clause`가 먼저 사라지는 일은 컴파일 타임에 차단됨
- C의 구조체에 포인터를 담을 때는 이런 보장이 전혀 없어서, 원본이 먼저 해제되면 댕글링 포인터가 되어도 컴파일은 통과함 — Rust는 이를 언어 차원에서 막음

### 여러 라이프타임과 `'b: 'a` (outlives 관계)

```rust
// core/src/executor/evaluate.rs:25-35
pub fn evaluate<'a, 'b, T>(
    storage: &'a T,
    context: Option<&Rc<RowContext<'b>>>,
    aggregated: Option<&Rc<AggregateValues>>,
    expr: &'a ExprPlan,
) -> Result<Evaluated<'a>>
where
    'b: 'a, // 'b가 최소한 'a만큼(또는 그 이상) 오래 살아야 함
    T: GStore,
{
    evaluate_inner(Some(storage), context, aggregated, expr)
}
```

- 이 함수는 라이프타임이 서로 다른 두 참조(`storage: &'a T`와 `context: &Rc<RowContext<'b>>`)를 받는데, 이 둘의 라이프타임이 같다고 가정할 수 없는 상황
- `'b: 'a` (읽는 법: "`'b` outlives `'a`"): "`'b`로 표시된 데이터는 `'a`가 끝나는 시점까지는 최소한 살아있어야 한다"는 제약을 `where` 절에 명시 → 이렇게 해야 반환값 `Evaluated<'a>` 안에서 `context`(라이프타임 `'b`)의 데이터를 안전하게 참조할 수 있다는 것을 컴파일러에게 증명

### 함수 시그니처 전체에 하나의 라이프타임을 통일

```rust
// core/src/executor/fetch.rs:73-77
pub fn fetch_relation_rows<'a, T: GStore>(
    storage: &'a T,
    table_factor: &'a TableFactorPlan,
    filter_context: Option<&Rc<RowContext<'a>>>,
) -> Result<RelationRows<'a>> {
    // ...
}
```

- `storage`, `table_factor`, `filter_context`, 반환 타입까지 **전부 같은 `'a`** 를 사용 → "이 함수에 들어오는 모든 참조와 나가는 결과가 동일한 하나의 스코프 안에서만 유효하다"는, 앞의 `evaluate`보다 단순한 케이스
- 실무에서는 이렇게 라이프타임을 하나로 통일할 수 있는 경우가 대부분이며, `'b: 'a`처럼 여러 개를 구분해야 하는 경우는 "서로 다른 소스에서 온 참조를 함께 반환해야 할 때"처럼 필요할 때만 등장

> [!NOTE]
> **읽는 요령**: 라이프타임 표기(`'a`, `'b`)는 "실제 메모리 수명을 늘려주는 것"이 아니라, **컴파일러에게 "이 참조들이 서로 어떤 순서로 살고 죽어야 하는지"를 알려주는 주석**에 가깝다. 코드를 읽을 때는 "반환값에 어떤 라이프타임이 붙어 있는가 → 그 라이프타임을 가진 매개변수가 이 반환값보다 먼저 사라지면 안 된다"는 방식으로 추적하면 됨.

## 🔗 참고

- [(Rust) 소유권과 참조(Ownership & Borrowing) - 핵심 개념 및 특징 정리]([Rust]%20소유권과%20참조%28Ownership%20&%20Borrowing%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/[Rust]%20GlueSQL%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EA%B5%AC%EC%A1%B0%EC%99%80%20%ED%95%84%EC%9A%94%20%EB%AC%B8%EB%B2%95%20%EA%B0%9C%EA%B4%80%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)
