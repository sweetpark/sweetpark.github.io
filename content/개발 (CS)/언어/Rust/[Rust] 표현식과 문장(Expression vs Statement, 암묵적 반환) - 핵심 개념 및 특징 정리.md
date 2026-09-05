---
title: "표현식과 문장(Expression vs Statement, 암묵적 반환)"
tags: [학습, 개발-CS, 언어, Rust, 표현식, 문장, 반환]
created: 2026-09-05
modified: 2026-09-05
---

# 표현식과 문장 (Expression vs Statement, 암묵적 반환)

> [!NOTE]
> Rust에는 `return` 키워드가 존재하지만 필수가 아니다. 함수 본문이 표현식(expression) 중심으로 설계되어 있기 때문인데, 이 원리는 함수 반환뿐 아니라 `match`, `if`, `{ }` 블록 전체에 공통으로 적용되는 Rust의 핵심 문법 개념이라 별도 노트로 정리.

## 📌 개념

### Rust에는 명시적 `return`이 없다? (표현식 기반 반환)

Rust의 함수 본문은 **표현식(expression) 중심**으로 설계되어, 마지막 줄에 **세미콜론(`;`)을 붙이지 않으면** 그 값이 자동으로 함수의 반환값이 된다. 즉 `return` 키워드는 존재하지만 필수가 아니며, 보통 **조기 반환(early return)** 에만 사용한다.

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b // 세미콜론 없음 → 이 값이 반환됨 (return a + b; 와 동일)
}

fn add_explicit(a: i32, b: i32) -> i32 {
    return a + b; // 명시적 return도 가능하지만 관용적이지 않음
}

fn abs(n: i32) -> i32 {
    if n < 0 {
        return -n; // 조기 반환 시에는 return을 명시적으로 사용
    }
    n // 마지막 표현식이 최종 반환값
}
```

### 문장(Statement) vs 표현식(Expression) — 세미콜론의 역할

- **문장(statement)**: 어떤 동작을 수행하지만 값을 반환하지 않음. `let x = 5;`처럼 항상 세미콜론으로 끝남.
- **표현식(expression)**: 평가되어 **값**을 만들어냄. `5 + 6`, `{ ... }` 블록, `if`, `match`가 모두 표현식.

```rust
let y = {
    let x = 3;
    x + 1 // 세미콜론 없음 → 이 블록 전체의 값은 4
};
println!("{y}"); // 4
```

- `{ ... }` 블록, `if`, `match` 등은 모두 값으로 평가되는 **표현식**이라서 `let x = if cond { 1 } else { 2 };`처럼 변수에 바로 대입 가능.
- 문장에는 세미콜론이 필요하지만, 표현식에 세미콜론을 붙이면 `()` (unit 타입)로 바뀌어 반환값이 사라진다 → 실수로 세미콜론을 붙이면 "expected type, found `()`" 컴파일 에러가 자주 발생하는 지점.

### `if`를 표현식으로 — 변수에 바로 대입

```rust
let condition = true;
let number = if condition { 5 } else { 6 };
println!("{number}"); // 5
```

- `if`의 각 갈래(`{ 5 }`, `{ 6 }`)가 반환하는 타입은 반드시 같아야 함 — `if condition { 5 } else { "six" }`처럼 타입이 다르면 컴파일 에러(하나의 변수는 하나의 타입만 가질 수 있으므로).

### `match`도 표현식이다

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

- `match`의 각 갈래(`=>` 뒤)가 만들어내는 값이 곧 `match` 표현식 전체의 값 — 그래서 함수의 마지막 줄에 `match`를 두면 별도 `return` 없이 결과가 그대로 반환됨 ([열거형과 패턴 매칭 노트]([Rust]%20열거형과%20패턴%20매칭%28Enum%20&%20Match%29%20-%20핵심%20개념%20및%20특징%20정리.md) 참고)

## 🔗 참고

- [Rust 3.3장 - Functions](https://doc.rust-kr.org/ch03-03-how-functions-work.html)
- [(Rust) 소유권과 참조(Ownership & Borrowing) - 핵심 개념 및 특징 정리]([Rust]%20소유권과%20참조%28Ownership%20&%20Borrowing%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) 열거형과 패턴 매칭(Enum & Match) - 핵심 개념 및 특징 정리]([Rust]%20열거형과%20패턴%20매칭%28Enum%20&%20Match%29%20-%20핵심%20개념%20및%20특징%20정리.md)
