---
title: "열거형과 패턴 매칭(Enum & Match)"
tags: [학습, 개발-CS, 언어, Rust, 열거형, 패턴매칭, GlueSQL]
created: 2026-09-05
modified: 2026-09-05
---

# 열거형과 패턴 매칭 (Enum & Match)

> [!NOTE]
> Rust의 `enum`이 C의 `enum`(단순 정수 상수)과 근본적으로 다른 이유(각 variant가 데이터를 가질 수 있는 대수적 데이터 타입, ADT)부터, `Option<T>`로 null을 대체하는 이유, `match`/`if let` 기초 문법을 정리한 뒤, GlueSQL이 SQL 문장·표현식·값을 어떻게 enum으로 모델링하는지 실전 코드로 확인.

## 📌 개념

### 기본 enum 정의 — variant마다 다른 데이터

```rust
enum IpAddrKind {
    V4,
    V6,
}

// variant가 자신만의 데이터를 가질 수 있음 (tuple-like variant)
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}
let home = IpAddr::V4(127, 0, 0, 1);

// variant마다 완전히 다른 형태의 데이터를 가질 수도 있음
enum Message {
    Quit,                       // 데이터 없음 (unit variant)
    Move { x: i32, y: i32 },    // 이름 있는 필드 (struct-like variant)
    Write(String),              // 값 하나 (tuple-like variant)
    ChangeColor(i32, i32, i32), // 값 여러 개
}
```

C의 `enum`은 정수 상수 이름의 집합일 뿐이라 `Message` 같은 구조를 표현하려면 `union` + 태그 필드를 직접 조합해야 한다(→ [Union, Typedef, Struct 노트](../C%EC%96%B8%EC%96%B4/[Lang]%20Union,%20Typedef,%20Struct%20%EA%B5%AC%EC%A1%B0%20%EB%B0%8F%20%ED%99%9C%EC%9A%A9.md)의 Tagged Union이 바로 그 수작업 버전). Rust는 이걸 `enum` 하나로 컴파일러가 안전하게 보장해준다 — 한 시점에는 정확히 하나의 variant만 존재하고, 그 variant에 맞는 데이터만 꺼낼 수 있음이 타입 시스템으로 강제됨.

> [!NOTE]
> `:`, `->`, `=>`, `=` 같은 기호 구분과 `String` vs `&str`은 별도 노트로 분리했다 — [(Rust) 기호 완전정리(콜론·화살표·등호, String vs str) - 핵심 개념 및 특징 정리]([Rust]%20기호%20완전정리%28콜론·화살표·등호,%20String%20vs%20str%29%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.

### enum에도 메서드를 붙일 수 있다 — `impl`

구조체와 마찬가지로 `impl` 블록으로 enum에 메서드를 추가할 수 있다.

```rust
impl Message {
    fn call(&self) {
        match self {
            Message::Quit => println!("종료"),
            Message::Move { x, y } => println!("이동: {x}, {y}"),
            Message::Write(text) => println!("쓰기: {text}"),
            Message::ChangeColor(r, g, b) => println!("색상: {r},{g},{b}"),
        }
    }
}
```

### `Option<T>` — null 없는 언어에서 "값이 없음"을 표현하는 법

Rust에는 `null`이 없다. 대신 표준 라이브러리가 제공하는 제네릭 열거형 `Option<T>`로 "값이 있을 수도, 없을 수도 있음"을 명시적으로 표현한다.

```rust
enum Option<T> {
    Some(T),
    None,
}

let some_number = Some(5);
let absent_number: Option<i32> = None;
```

- `Option<T>`와 `T`(예: `Option<i32>`와 `i32`)는 **서로 다른 타입**이라, `Some(5) + 1`처럼 바로 연산할 수 없다. 반드시 `match`나 `if let`으로 `Some`/`None`을 먼저 구분한 뒤에야 안의 값을 꺼내 쓸 수 있음
- 이 강제성 덕분에 "null인 줄 모르고 접근해서 터지는" NullPointerException류의 버그가 **컴파일 타임에** 차단됨

### `match` 기초 — 모든 경우를 빠짐없이 처리

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

- `match`는 **표현식(expression)** 이라 각 갈래의 결과값이 바로 함수의 반환값이 될 수 있음 (마지막에 `return` 불필요 — [소유권과 참조 노트]([Rust]%20소유권과%20참조%28Ownership%20&%20Borrowing%29%20-%20핵심%20개념%20및%20특징%20정리.md)의 표현식 기반 반환과 같은 원리)
- **Exhaustiveness (전수 검사)**: `enum`의 모든 variant를 빠짐없이 처리해야 컴파일된다. 나중에 `Coin`에 variant를 추가하면, 이를 처리하지 않는 모든 `match` 구문에서 컴파일 에러가 발생해 "빠뜨린 곳"을 컴파일러가 알려줌 — C의 `switch`(variant를 빠뜨려도 조용히 컴파일됨)와 가장 큰 차이점
- 처리하지 않는 나머지 경우는 `_ => ...`로 한 번에 받을 수 있음

### `match` 가드(guard)와 값 바인딩(`@`)

```rust
let num = 4;
match num {
    x if x < 0 => println!("음수"),
    x if x % 2 == 0 => println!("짝수: {x}"),
    x => println!("홀수: {x}"),
}

// @ 바인딩: 패턴이 맞는지 검사하면서 동시에 그 값을 변수로 사용
match num {
    n @ 1..=5 => println!("1~5 사이의 값: {n}"),
    _ => println!("범위 밖"),
}
```

### `if let` / `while let` — match 축약형

`match` 갈래가 하나만 관심 대상이고 나머지는 무시하고 싶을 때 더 간결하게 쓰는 문법.

```rust
let config_max = Some(3u8);

// match로 쓰면
match config_max {
    Some(max) => println!("최댓값: {max}"),
    _ => (),
}

// if let으로 축약 (동일한 의미)
if let Some(max) = config_max {
    println!("최댓값: {max}");
}
```

### 재귀적 enum과 `Box`

enum의 variant가 자기 자신을 다시 담아야 하는 경우(연결 리스트 등), 크기가 무한히 커지는 문제 때문에 `Box`로 감싸야 한다.

```rust
enum List {
    Cons(i32, Box<List>), // Box로 감싸 힙에 고정 크기(포인터)로 저장
    Nil,
}
use List::{Cons, Nil};
let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
```

## GlueSQL 실전 예제

GlueSQL은 SQL 문장·표현식·값(Value)을 모두 위에서 배운 enum으로 모델링하고 `match`로 분기 처리한다.

### SQL 문장을 표현하는 `Statement` enum

```rust
// core/src/ast.rs:48-142 (일부 축약)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Statement {
    ShowColumns { table_name: String },
    Query(Query),
    Insert { table_name: String, columns: Vec<String>, source: Query },
    Update { table_name: String, assignments: Vec<Assignment>, selection: Option<Expr> },
    Delete { table_name: String, selection: Option<Expr> },
    CreateTable { if_not_exists: bool, name: String, columns: Option<Vec<ColumnDef>> /* .. */ },
    AlterTable { name: String, operation: AlterTableOperation },
    DropTable { if_exists: bool, names: Vec<String>, cascade: bool },
}
```

각 variant가 서로 다른 필드 구조를 가짐: `ShowColumns`는 문자열 하나, `Insert`는 3개 필드를 가진 struct-like variant, `Query`는 다른 타입 하나를 감싸는 tuple-like variant. `selection: Option<Expr>`처럼 "WHERE 절이 있을 수도, 없을 수도 있음"을 표현하는 데도 `Option`이 쓰임.

### SQL 표현식을 표현하는 `Expr` enum (재귀적 구조)

```rust
// core/src/ast/expr.rs:11-86 (일부 축약)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Expr {
    Identifier(String),
    CompoundIdentifier { alias: String, ident: String },
    IsNull(Box<Expr>),
    InList { expr: Box<Expr>, list: Vec<Expr>, negated: bool },
    BinaryOp { left: Box<Expr>, op: BinaryOperator, right: Box<Expr> },
    Nested(Box<Expr>),
    Literal(Literal),
    Function(Box<Function>),
    Case { operand: Option<Box<Expr>>, when_then: Vec<(Expr, Expr)>, else_result: Option<Box<Expr>> },
    Array { elem: Vec<Expr> },
}
```

`BinaryOp`처럼 `Expr` variant가 다시 `Expr`을 담아야 하는 재귀적 타입은 위 `List`/`Cons` 예제와 똑같은 이유로 `Box<Expr>`로 감싼다 (`a + b * c` 같은 중첩 표현식 트리를 표현하려면 필수).

### 값(Value)을 표현하는 `Value` enum

```rust
// core/src/data/value.rs:42-70 (일부 축약)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Value {
    Bool(bool), I8(i8), I16(i16), I32(i32), I64(i64), I128(i128),
    U8(u8), U16(u16), U32(u32), U64(u64), U128(u128),
    F32(f32), F64(f64), Decimal(Decimal), Str(String), Bytea(Vec<u8>),
    Inet(IpAddr), Date(NaiveDate), Timestamp(NaiveDateTime), Time(NaiveTime),
    Interval(Interval), Uuid(u128), Map(BTreeMap<String, Value>),
    List(Vec<Value>), Point(Point), Null,
}
```

SQL의 동적 타입 시스템(한 컬럼에 여러 타입이 올 수 있음)을 표현하기 위한 대표적인 "하나의 값, 여러 가능한 타입" 패턴. `Null` variant가 별도로 있는 것에 주목 — SQL의 `NULL`은 "값이 없는 상태"인데, 흥미롭게도 이 경우엔 `Option<Value>`가 아니라 `Value::Null`이라는 variant로 직접 표현했다(SQL 값 자체에 `NULL`이 포함되는 게 자연스럽기 때문).

### `match`로 enum 분기 처리

```rust
// core/src/executor/evaluate.rs:60-88 (일부 축약)
match expr {
    ExprPlan::Literal(literal) => Ok(expr::literal(literal)),
    ExprPlan::Value(value) => Ok(Evaluated::Value(Cow::Borrowed(value))),
    ExprPlan::TypedString { data_type, value } => expr::typed_string(data_type, value),
    ExprPlan::Identifier(ident) => {
        let context = context
            .ok_or_else(|| EvaluateError::IdentifierRequiresRowContext(ident.to_owned()))?;
        match context.get_value(ident) {
            Some(value) => Ok(Evaluated::Value(Cow::Owned(value.clone()))),
            None => Err(EvaluateError::IdentifierNotFound(ident.to_owned()).into()),
        }
    }
}
```

variant에 담긴 데이터를 `match` 패턴 안에서 바로 꺼내 쓸 수 있음 (`ExprPlan::Literal(literal)`에서 `literal` 변수 바로 사용). 안쪽의 `context.get_value(ident)`는 `Option<Value>`를 반환하므로, 앞서 배운 `Some`/`None` 매칭이 그대로 적용됨.

### 튜플 패턴 매칭 — `evaluate_eq`

```rust
// core/src/data/value.rs:83-108 (일부 축약)
pub fn evaluate_eq(&self, other: &Value) -> Tribool {
    use Value::*;
    match (self, other) {
        (Null, _) | (_, Null) => Tribool::Null,
        (I8(l), _) => Tribool::from(l == other),
        (Date(l), Timestamp(r)) => Tribool::from(
            l.and_hms_opt(0, 0, 0).is_some_and(|date_time| &date_time == r),
        ),
        _ => Tribool::from(self == other),
    }
}
```

- `match (self, other)`: 두 값을 튜플로 묶어 **두 enum의 조합**에 대해 패턴 매칭 (Rust는 튜플도 패턴으로 분해 가능)
- `(Null, _) | (_, Null)`: `|`로 여러 패턴을 OR 조건처럼 하나의 분기에 묶음
- `_`: "나머지 모든 경우" — C의 `default`와 유사하지만 반드시 마지막에 두어 예외적으로 처리 안 된 조합을 잡아냄

## 일반적인 enum 사용 vs GlueSQL 스타일 enum 사용 — 비교 및 연습

교과서 예제(`Coin`, `Message`, `List`)와 GlueSQL 실전 코드(`Statement`, `Expr`, `Value`)는 같은 `enum` 문법을 쓰지만 "왜 이렇게 설계했는가"에서 차이가 크다. 연습 삼아 그 차이를 표로 정리하고, GlueSQL 스타일을 흉내 낸 미니 예제를 직접 만들어본다.

| 구분 | 일반적인(교과서) 사용 | GlueSQL 스타일 사용 |
| --- | --- | --- |
| variant 데이터 | 값 하나 정도로 단순 (`Message::Write(String)`) | struct-like variant에 필드 여러 개(`Insert { table_name, columns, source }`)가 흔함 — 실제 도메인 데이터가 복잡하기 때문 |
| 재귀 구조 | 학습용으로 `List`/`Cons` 하나만 다룸 | SQL 표현식 트리 전체가 재귀 enum(`Expr::BinaryOp { left: Box<Expr>, .. }`)으로 구성 — 실제 "트리 구조 데이터"를 표현할 때 재귀 enum이 필요함을 보여줌 |
| `Option` 사용 | "값의 유무" 자체를 배우는 데 집중 | `selection: Option<Expr>`처럼 "이 필드는 있을 수도, 없을 수도 있는 선택 사항"이라는 **도메인 의미**를 타입으로 드러냄 (WHERE 절 유무) |
| derive 개수 | 학습 예제는 대개 derive 없이 진행 | 실무 enum엔 `Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize` 등을 거의 항상 붙임 — 비교/복제/직렬화가 실제로 필요해서 |
| match 대상 | 값 하나만 매칭 | `match (self, other)`처럼 튜플로 묶어 **두 enum의 조합**을 한 번에 매칭하기도 함(`evaluate_eq`) |
| null 표현 | `Option<T>::None`으로 통일 | 도메인상 "없음"도 값의 하나로 자연스러우면 `Option` 대신 자체 `Null` variant를 둠(`Value::Null`) — SQL의 `NULL`이 값 자체의 일부이기 때문 |

### 연습 예제 1 — 재귀 enum으로 수식 트리 만들기 (`Expr::BinaryOp` 흉내)

GlueSQL의 `Expr::BinaryOp { left: Box<Expr>, op, right: Box<Expr> }` 구조를 그대로 축소해서, `(2 + 3) * -4` 같은 중첩 수식을 표현하고 계산하는 연습.

```rust
#[derive(Debug, Clone, PartialEq)]
enum Expr {
    Num(i32),
    Neg(Box<Expr>),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
}

impl Expr {
    fn eval(&self) -> i32 {
        match self {
            Expr::Num(n) => *n,
            Expr::Neg(e) => -e.eval(),
            Expr::Add(l, r) => l.eval() + r.eval(),
            Expr::Mul(l, r) => l.eval() * r.eval(),
        }
    }
}

fn main() {
    // (2 + 3) * -4
    let expr = Expr::Mul(
        Box::new(Expr::Add(Box::new(Expr::Num(2)), Box::new(Expr::Num(3)))),
        Box::new(Expr::Neg(Box::new(Expr::Num(4)))),
    );
    println!("{:?} = {}", expr, expr.eval()); // -20
}
```

- `Neg`/`Add`/`Mul`이 자기 자신(`Expr`)을 다시 담으므로 `Box`로 감싸야 크기가 고정됨 — 앞서 배운 `List`/`Cons`와 같은 이유
- `eval()`이 `match` 안에서 재귀적으로 자기 자신을 호출(`l.eval()`, `r.eval()`) — GlueSQL의 `evaluate.rs`가 `Expr` 트리를 실제 값으로 계산하는 방식과 동일한 패턴

### 연습 예제 2 — struct-like variant + `Option` 필드 (`selection: Option<Expr>` 흉내)

GlueSQL의 `Update`/`Delete` variant가 `selection: Option<Expr>`로 "WHERE 절이 있을 수도 없을 수도 있음"을 표현하는 방식을 그대로 연습.

```rust
#[derive(Debug)]
enum Command {
    Select { table: String, condition: Option<Expr> },
    Delete { table: String, condition: Option<Expr> },
}

fn describe(cmd: &Command) {
    match cmd {
        Command::Select { table, condition: Some(cond) } => {
            println!("SELECT FROM {table} WHERE {cond:?}")
        }
        Command::Select { table, condition: None } => {
            println!("SELECT FROM {table} (조건 없음)")
        }
        Command::Delete { table, condition } => {
            println!("DELETE FROM {table}, 조건: {condition:?}")
        }
    }
}

fn main() {
    describe(&Command::Select { table: "users".into(), condition: Some(Expr::Num(1)) });
    describe(&Command::Select { table: "users".into(), condition: None });
}
```

- `match` 패턴 안에서 `condition: Some(cond)` / `condition: None`처럼 struct-like variant의 필드까지 한 번에 분해 가능 — GlueSQL의 `context.get_value(ident)` 매칭(`Some(value)` / `None`)과 같은 원리
- `Select` variant를 조건 유무에 따라 두 갈래로 나눠 처리 vs `Delete`는 `condition` 그대로 넘겨 `{:?}`로 출력 — 실무에서는 이렇게 필드를 "분해해서 쓸지, 통째로 넘길지"를 상황에 맞게 섞어 씀

## 🔗 참고

- [Rust 6장 - Enums and Pattern Matching](https://doc.rust-kr.org/ch06-00-enums.html)
- [GlueSQL - ast.rs](https://github.com/gluesql/gluesql/blob/main/core/src/ast.rs)
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/[Rust]%20GlueSQL%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EA%B5%AC%EC%A1%B0%EC%99%80%20%ED%95%84%EC%9A%94%20%EB%AC%B8%EB%B2%95%20%EA%B0%9C%EA%B4%80%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)
- [(Lang) Union, Typedef, Struct 구조 및 활용](../C%EC%96%B8%EC%96%B4/[Lang]%20Union,%20Typedef,%20Struct%20%EA%B5%AC%EC%A1%B0%20%EB%B0%8F%20%ED%99%9C%EC%9A%A9.md) — C의 Tagged Union과 Rust enum 비교
