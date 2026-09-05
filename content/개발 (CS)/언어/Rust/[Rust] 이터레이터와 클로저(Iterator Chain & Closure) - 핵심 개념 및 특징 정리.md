---
title: "이터레이터와 클로저(Iterator Chain & Closure)"
tags: [학습, 개발-CS, 언어, Rust, 이터레이터, 클로저, GlueSQL]
created: 2026-09-05
modified: 2026-09-05
---

# 이터레이터와 클로저 (Iterator Chain & Closure)

> [!NOTE]
> GlueSQL의 쿼리 실행 코드(row 필터링, 정렬, 평가 등)는 `for`문 대신 `.map()`, `.filter_map()`, `.collect()` 같은 이터레이터 체인과 클로저로 작성되어 있음. 이 스타일에 익숙해지는 것이 GlueSQL 코드를 읽는 데 핵심.

## 📌 개념

### `filter_map` + 클로저 — WHERE 절 필터링

```rust
// core/src/executor/fetch.rs:46-70 (일부 축약)
let rows = storage.scan_data(table_name)?.filter_map(move |row| {
    let (key, values) = match row {
        Ok(row) => row,
        Err(error) => return Some(Err(error)),
    };
    let row = Row { columns: Rc::clone(&columns), values };

    match where_clause {
        Some(expr) => {
            let context = Rc::new(RowContext::new(table_name, Cow::Borrowed(&row), None));
            match check_expr(storage, Some(&context), None, expr) {
                Ok(true) => Some(Ok((key, row))),
                Ok(false) => None, // WHERE 조건 불만족 → 이 행은 결과에서 제거
                Err(error) => Some(Err(error)),
            }
        }
        None => Some(Ok((key, row))),
    }
});

Ok(Box::new(rows))
```

- `move |row| { ... }`: `move` 클로저는 바깥 스코프의 변수(`columns`, `where_clause`, `table_name`, `storage`)의 **소유권을 클로저 내부로 이동**시킴. 이터레이터가 함수 스코프보다 오래 살아남아야 하므로(반환값으로 나가야 하므로), 클로저가 참조가 아닌 소유권을 가져가야 함
- `.filter_map(f)`: `f`가 `Some(v)`를 반환하면 `v`를 유지하고, `None`을 반환하면 그 원소를 제거 — `filter`(조건 검사)와 `map`(변환)을 한 번에 수행. WHERE 절처럼 "조건에 안 맞으면 버리고, 맞으면 변환해서 남긴다"는 로직에 정확히 들어맞음
- C였다면 `for` 루프 + 배열에 조건부로 append하는 코드로 직접 작성했을 부분을 선언적으로 표현

### `flat_map` — 중첩 컬렉션 펼치기

```rust
// core/src/store.rs:50-68 (일부 축약)
Ok(schemas
    .into_iter()
    .flat_map(|schema| {
        let Schema { table_name: referencing_table_name, foreign_keys, .. } = schema;

        foreign_keys.into_iter().filter_map(move |foreign_key| {
            (foreign_key.referenced_table_name == table_name
                && referencing_table_name != table_name)
                .then_some(Referencing {
                    table_name: referencing_table_name.clone(),
                    foreign_key,
                })
        })
    })
    .collect())
```

- 각 `schema`마다 `foreign_keys`라는 **또 다른 리스트**가 나오는데, `flat_map`은 이렇게 생긴 "리스트의 리스트"를 하나의 평평한(flat) 리스트로 합쳐줌 (`map` + `flatten`을 한 번에)
- `.then_some(v)`: `bool` 값에 대해 `true`면 `Some(v)`, `false`면 `None`을 반환하는 축약 메서드 — `if cond { Some(v) } else { None }`을 짧게 씀
- `let Schema { table_name: ..., foreign_keys, .. } = schema;`: 구조체 구조 분해(destructuring) — 구조체 필드를 개별 변수로 한 번에 꺼냄 (`..`은 "나머지 필드는 무시")

### `.collect::<Result<Vec<_>>>()` — 에러가 있는 컬렉션 한 번에 처리

```rust
// core/src/executor/select.rs (order by 처리, 일부 축약)
let keys = order_by
    .iter()
    .map(|OrderByExprPlan { expr, asc }| {
        evaluate_stateless(Some(row.as_context()), expr)
            .and_then(Value::try_from)
            .and_then(Key::try_from)
            .map(|key| (key, *asc))
    })
    .collect::<Result<Vec<_>>>()?;
```

- `.map(|OrderByExprPlan { expr, asc }| ...)`: 클로저 매개변수 자리에서 바로 구조체를 구조 분해하며 받음
- `.collect::<Result<Vec<_>>>()`: `Iterator<Item = Result<T, E>>`를 `Result<Vec<T>, E>`로 뒤집어 모아줌 — 원소 중 하나라도 `Err`이면 전체가 `Err`이 되고, 모두 `Ok`이면 값들을 모은 `Vec`이 `Ok`로 감싸져 나옴. 매번 수동으로 에러 검사 루프를 짜지 않아도 되는 Rust 이터레이터의 대표적인 관용구
- 뒤에 붙은 `?`로 이 `Result` 자체도 즉시 에러 전파

### `.any()` — 하나라도 조건을 만족하는지 검사

```rust
// core/src/executor/evaluate.rs:157-162
let matched = list
    .iter()
    .map(eval)
    .collect::<Result<Vec<_>>>()?
    .into_iter()
    .any(|v| v.evaluate_eq(&target).is_true());

Ok(Evaluated::Value(Cow::Owned(Value::Bool(matched ^ negated))))
```

- `.any(predicate)`: 원소 중 하나라도 `predicate`가 `true`면 즉시 `true` 반환 (SQL의 `IN (...)` 구문 구현에 사용)
- `matched ^ negated`: 불리언 XOR로 `NOT IN`(negated=true) 케이스까지 한 번에 처리하는 간결한 트릭

> [!NOTE]
> **왜 `for` 루프 대신 이터레이터 체인을 쓰는가**
> - 컴파일러가 최적화하기 좋음(zero-cost abstraction) — 이터레이터 체인은 컴파일 후 손으로 짠 루프와 동등하거나 더 빠른 코드로 컴파일됨
> - 각 단계(`filter_map`, `flat_map`, `collect`)의 이름 자체가 "무엇을 하는지"를 설명해 가독성이 높음
> - 에러가 섞인 컬렉션을 다룰 때 `collect::<Result<...>>()` 같은 관용구로 에러 처리 보일러플레이트를 줄일 수 있음

## 🔗 참고

- [GlueSQL - core/src/executor](https://github.com/gluesql/gluesql/tree/main/core/src/executor)
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/[Rust]%20GlueSQL%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EA%B5%AC%EC%A1%B0%EC%99%80%20%ED%95%84%EC%9A%94%20%EB%AC%B8%EB%B2%95%20%EA%B0%9C%EA%B4%80%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)
