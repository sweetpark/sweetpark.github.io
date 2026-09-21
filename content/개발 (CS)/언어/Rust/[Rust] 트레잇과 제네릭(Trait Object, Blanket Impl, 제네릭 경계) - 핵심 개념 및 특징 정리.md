---
title: "트레잇과 제네릭(Trait Object, Blanket Impl, 제네릭 경계)"
tags: [학습, 개발-CS, 언어, Rust, 트레잇, 제네릭, GlueSQL]
created: 2026-09-05
modified: 2026-09-20
---

# 트레잇과 제네릭 (Trait Object, Blanket Impl, 제네릭 경계)

> [!NOTE]
> 제네릭이 왜 필요한지(코드 중복 제거)부터, 제네릭 함수/구조체/열거형/메서드 기본 문법, 트레잇 경계(Trait Bound) 기초를 정리한 뒤, GlueSQL 실전 코드에서 `dyn Trait` 동적 디스패치, 여러 트레잇을 합성하는 Blanket Impl, 복잡한 제네릭 경계까지 실제 사례로 정리.

## 📌 개념

### 제네릭이 필요한 이유 — 코드 중복 제거

타입만 다르고 로직이 완전히 같은 함수를 여러 번 만들어야 하는 문제부터 시작.

```rust
// 제네릭 없이: 타입별로 똑같은 로직을 반복 작성
fn largest_i32(list: &[i32]) -> &i32 {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}

fn largest_char(list: &[char]) -> &char {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}
```

```rust
// 제네릭으로 통합: 타입 매개변수 T 하나로 모든 비교 가능한 타입을 지원
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}

let numbers = vec![34, 50, 25, 100, 65];
println!("{}", largest(&numbers)); // 100

let chars = vec!['y', 'm', 'a', 'q'];
println!("{}", largest(&chars)); // y
```

- `<T: PartialOrd>`: `T`는 아무 타입이나 올 수 있는 게 아니라, **크기 비교(`>`)가 가능한 타입**이어야 한다는 제약(트레잇 경계). 이 제약이 없으면 함수 내부의 `item > largest`가 어떤 타입에서든 성립한다고 컴파일러가 보장할 수 없어 컴파일 에러가 남.

### 제네릭 구조체 / 열거형

```rust
// 타입 매개변수 하나
struct Point<T> {
    x: T,
    y: T,
}
let integer_point = Point { x: 5, y: 10 };
let float_point = Point { x: 1.0, y: 4.0 };
// let mixed = Point { x: 5, y: 4.0 }; // ❌ 에러! 같은 T이므로 x, y는 반드시 같은 타입이어야 함

// 서로 다른 타입을 허용하려면 타입 매개변수를 여러 개로
struct Point2<T, U> {
    x: T,
    y: U,
}
let mixed = Point2 { x: 5, y: 4.0 }; // ✅ 정상: T=i32, U=f64
```

표준 라이브러리에서 가장 자주 쓰는 제네릭 열거형은 `Option<T>`와 `Result<T, E>`이며, 이미 앞서 다룬 [열거형과 패턴 매칭 노트]([Rust]%20열거형과%20패턴%20매칭%28Enum%20&%20Match%29%20-%20핵심%20개념%20및%20특징%20정리.md)에서 정의를 확인할 수 있다.

```rust
enum Option<T> { Some(T), None }
enum Result<T, E> { Ok(T), Err(E) }
```

### 제네릭 메서드 — `impl<T>`

```rust
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// 특정 타입에 대해서만 메서드를 추가하는 것도 가능 (예: f32 전용 거리 계산)
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

- `impl<T> Point<T>`: 모든 `T`에 대해 적용되는 메서드
- `impl Point<f32>`: `T`가 `f32`로 확정된 경우에만 존재하는 메서드 (다른 타입의 `Point`에서는 `distance_from_origin` 호출 불가)

### 모노모피제이션(Monomorphization) — 제네릭의 성능 비밀

Rust의 제네릭은 런타임에 타입을 검사하는 것이 아니라, **컴파일 타임에 실제 사용된 타입별로 코드를 복제**해 생성한다. 예를 들어 `largest::<i32>`와 `largest::<char>`가 모두 호출되면, 컴파일러는 마치 아래처럼 각 타입 전용 함수를 따로 만들어낸다.

```rust
fn largest_i32(list: &[i32]) -> &i32 { /* largest<T>의 i32 버전 */ }
fn largest_char(list: &[char]) -> &char { /* largest<T>의 char 버전 */ }
```

이 덕분에 제네릭 함수는 런타임 오버헤드가 전혀 없다(zero-cost abstraction) — 대신 사용되는 타입 수만큼 바이너리 크기가 커질 수 있다는 트레이드오프가 있음.

## GlueSQL 실전 예제

GlueSQL은 저장소 백엔드를 자유롭게 교체할 수 있도록 트레잇(trait) 중심으로 설계됨. 위 기초 위에서, `dyn Trait`을 이용한 동적 디스패치, 여러 트레잇을 합성하는 Blanket Impl, 제네릭 함수의 트레잇 경계(bound)를 실제 코드로 확인한다.

### `dyn Trait`과 `Box<dyn Trait>` — 동적 디스패치

`Store::scan_data`는 테이블의 모든 행을 순회하는 이터레이터를 반환해야 하는데, 저장소마다 이터레이터의 실제 타입이 다르므로 트레잇 객체로 추상화한다.

```rust
// core/src/store.rs:35
pub type RowIter<'a> = Box<dyn Iterator<Item = Result<(Key, Vec<Value>)>> + 'a>;
```

- `dyn Iterator<...>`: "이 타입은 컴파일 타임에 정확히 몰라도 되고, `Iterator` 트레잇만 구현하면 된다"는 의미의 트레잇 객체
- `Box<...>`: 트레잇 객체는 크기를 컴파일 타임에 알 수 없으므로(unsized) 힙에 할당해 포인터로 다룸
- `+ 'a`: 이 트레잇 객체가 최소 `'a` 라이프타임만큼은 유효해야 함을 명시
- 위 모노모피제이션(정적 디스패치)과 반대로, `dyn Trait`은 **런타임에** 실제 타입의 메서드 테이블(vtable)을 찾아 호출하는 동적 디스패치 방식

### 핵심 트레잇 정의 — `Store` / `StoreMut`

저장소가 구현해야 하는 인터페이스를 트레잇으로 정의한다.

```rust
// core/src/store.rs:38-104 (일부 축약)
pub trait Store {
    fn fetch_schema(&self, table_name: &str) -> Result<Option<Schema>>;
    fn fetch_all_schemas(&self) -> Result<Vec<Schema>>;
    fn fetch_data(&self, table_name: &str, key: &Key) -> Result<Option<Vec<Value>>>;
    fn scan_data<'a>(&'a self, table_name: &str) -> Result<RowIter<'a>>;
}

pub trait StoreMut {
    // 기본 구현(default impl)을 제공 → 구현체가 필요할 때만 override
    fn insert_schema(&mut self, _schema: &Schema) -> Result<()> { /* ... */ Ok(()) }
    fn delete_schema(&mut self, _table_name: &str) -> Result<()> { /* ... */ Ok(()) }
    fn insert_data(&mut self, _table_name: &str, _rows: Vec<(Key, Vec<Value>)>) -> Result<()> { /* ... */ Ok(()) }
}
```

`StoreMut`의 메서드들은 기본 구현(default method body)을 가지고 있어, 구현체(예: read-only 저장소)는 필요한 메서드만 override하면 된다.

### 실제 구현체 — `MemoryStorage`

```rust
// storages/memory-storage/src/lib.rs:63-96 (일부 축약)
impl Store for MemoryStorage {
    fn fetch_all_schemas(&self) -> Result<Vec<Schema>> {
        let mut schemas = self.items.values().map(|item| item.schema.clone()).collect::<Vec<_>>();
        schemas.sort_by(|a, b| a.table_name.cmp(&b.table_name));
        Ok(schemas)
    }

    fn scan_data<'a>(&'a self, table_name: &str) -> Result<RowIter<'a>> {
        let rows = MemoryStorage::scan_data(self, table_name).into_iter().map(Ok);
        Ok(Box::new(rows)) // 구체 타입을 Box로 감싸 트레잇 객체로 반환
    }
}
```

### Blanket Impl — 여러 트레잇을 하나로 묶기

여러 개의 작은 트레잇(`Store`, `Index`, `Metadata`, `CustomFunction`)을 매번 나열하지 않도록, 이들을 모두 만족하는 타입에 자동으로 `GStore`를 구현해주는 패턴.

```rust
// core/src/store.rs:8-18
pub trait GStore: Store + Index + Metadata + CustomFunction {}
impl<S: Store + Index + Metadata + CustomFunction> GStore for S {}

pub trait GStoreMut:
    StoreMut + IndexMut + AlterTable + Transaction + CustomFunction + CustomFunctionMut
{
}
impl<S: StoreMut + IndexMut + AlterTable + Transaction + CustomFunction + CustomFunctionMut>
    GStoreMut for S
{
}
```

- `pub trait GStore: Store + Index + ... {}`: 슈퍼트레잇(supertrait) 문법 — `GStore`를 구현하려면 나열된 트레잇들을 모두 구현해야 함
- `impl<S: ...> GStore for S {}`: **제네릭 타입 `S`에 대해 조건부로 자동 구현** → 이 조건(4개 트레잇)을 만족하는 모든 타입은 별도 코드 없이 `GStore`가 됨. 이를 "Blanket Implementation"이라 부름. 위에서 배운 `impl<T> Point<T>`와 문법 구조는 같지만, 대상이 `Point<T>`라는 구체 타입이 아니라 "조건을 만족하는 임의의 타입 `S`"라는 점이 다름

### 오르판 규칙(Orphan Rule)과 커버 규칙(Coverage Rule) — Blanket Impl이 항상 되는 건 아니다

바로 위 `impl<S: Store + Index + Metadata + CustomFunction> GStore for S {}`가 되는 이유는 `GStore`가 **이 크레이트가 정의한 트레잇**이기 때문이다. 트레잇과 타입이 둘 다 표준 라이브러리(외부) 것이면, 똑같은 모양의 코드라도 컴파일이 안 될 수 있다.

```rust
// Value는 core 크레이트의 로컬 타입. TryFrom과 Option은 둘 다 std(외부) 것
impl<T> TryFrom<Value> for Option<T>
where
    T: TryFrom<Value, Error = ValueError>,
{
    type Error = ValueError;
    fn try_from(v: Value) -> Result<Self> {
        match v {
            Value::Null => Ok(None),
            v => T::try_from(v).map(Some),
        }
    }
}
```

```
error[E0210]: type parameter `T` must be covered by another type
  when it appears before the first local type (`Value`)
```

- **오르판 규칙(orphan rule)**: `impl Trait for Type`을 쓰려면 `Trait`과 `Type` 둘 중 최소 하나는 반드시 "내 크레이트가 정의한 것(로컬 타입)"이어야 한다. 여기선 `Value`가 로컬 타입이라 이 조건 자체는 만족한다.
- **커버 규칙(coverage rule, E0210)**: 오르판 규칙만으로는 부족해서 붙는 추가 제약 — trait의 제네릭 인자 목록에서 로컬 타입(`Value`)이 나오기 *전에* 등장하는 타입 파라미터는 전부 어떤 로컬 타입 안에 "감싸여(covered)" 있어야 한다. 위 코드는 `Self = Option<T>`가 문제다: `T`가 `Option<...>` 안에 있긴 하지만 `Option`은 로컬 타입이 아니라 std 타입이라 "가려짐(covered)"으로 인정되지 않아, `T`가 사실상 벌거벗은 채로 먼저 등장한 것으로 취급된다.
- **왜 이런 규칙이 필요한가**: 이 규칙이 없으면 서로 다른 두 크레이트가 각자 "내 로컬 타입만 보면 문제없다"고 판단해 **같은 조합에 대해 서로 다른 impl**을 만들어버릴 수 있다(coherence 위반). 오르판+커버 규칙은 "이 impl이 유효한지"를 크레이트 하나만 보고도 컴파일러가 판단할 수 있게 보장하는 장치다.
- **우회법**: 제네릭 blanket impl 대신, 매크로로 타입별 **구체(non-generic) impl**을 여러 개 찍어내면 우회할 수 있다 — 매크로가 전개된 뒤에는 `T`가 이미 `Decimal`, `i64` 같은 구체 타입으로 치환돼 있어서 애초에 "커버되지 않은 타입 파라미터"가 존재하지 않는다. ([매크로 노트]([Rust]%20매크로%28절차적%20매크로%20&%20macro_rules%21%29%20-%20핵심%20개념%20및%20특징%20정리.md)의 `try_from_owned_value!` 확장이 실전 예시)

### 제네릭 함수와 트레잇 경계 (Trait Bound)

```rust
// core/src/glue.rs:10-17
#[derive(Debug)]
pub struct Glue<T: GStore + GStoreMut + Planner> {
    pub storage: T,
}

impl<T: GStore + GStoreMut + Planner> Glue<T> {
    pub fn new(storage: T) -> Self {
        Self { storage }
    }
}
```

`Glue<T>`는 아무 타입이나 담는 게 아니라, `GStore`이면서 `GStoreMut`이면서 `Planner`인 타입만 담을 수 있다는 뜻(`T: A + B + C`처럼 `+`로 여러 트레잇 경계를 동시에 요구). 이렇게 하면 `Glue` 내부에서 `self.storage.fetch_schema(...)`처럼 세 트레잇의 메서드를 모두 자유롭게 호출 가능.

### `where` 절로 복잡한 경계 분리

트레잇 경계가 많아지면 `<T: A + B>`처럼 한 줄에 몰아 쓰지 않고 `where` 절로 분리해 가독성을 높인다.

```rust
// core/src/glue.rs:26-31
pub fn plan_with_params<Sql, I, P>(&mut self, sql: Sql, params: I) -> Result<Vec<StatementPlan>>
where
    Sql: AsRef<str>,
    I: IntoIterator<Item = P>,
    P: IntoParamLiteral,
{
    // ...
}
```

- `Sql: AsRef<str>`: `String`, `&str` 등 문자열로 취급 가능한 아무 타입이나 받겠다는 의미
- `I: IntoIterator<Item = P>`: 반복 가능한 아무 컬렉션이나 받되, 그 원소 타입은 `P`
- 제네릭 함수는 호출 시점에 실제 타입이 결정되며, 컴파일러가 각 타입별로 코드를 생성(모노모피제이션)하므로 `dyn Trait`과 달리 런타임 오버헤드가 없음

> [!NOTE]
> **`dyn Trait` vs 제네릭 `<T: Trait>`**
> - `dyn Trait` (동적 디스패치): 런타임에 어떤 타입인지 결정, 힙 할당(`Box`) 필요, 유연하지만 약간의 오버헤드
> - `<T: Trait>` (정적 디스패치): 컴파일 타임에 타입 확정, 오버헤드 없음, 대신 함수마다 코드가 복제됨(모노모피제이션)
> - GlueSQL은 `RowIter`(반환 타입이 저장소마다 달라짐)에는 `dyn`을, `Glue<T>`(저장소 하나로 고정)에는 제네릭을 사용해 두 방식을 상황에 맞게 혼용

### `AsRef<T>`의 실제 정의 — 왜 "읽기 전용"으로 고정되는가

`Sql: AsRef<str>`처럼 문자열 하나 받는 자리에 굳이 제네릭+트레잇 경계를 쓰는 이유는 "이미 갖고 있는 `String`이든 `&str`이든 그대로 넘길 수 있게" 하기 위함. 트레잇 자체 정의를 보면 왜 이게 "읽기 전용"으로 강제되는지 알 수 있음(rust-src 기준 `core/src/convert/mod.rs:220-224`):

```rust
pub trait AsRef<T: ?Sized> {
    fn as_ref(&self) -> &T;
}
```

- 메서드 시그니처가 `fn as_ref(&self) -> &T`뿐 — 즉 "나 자신을 불변으로 빌려서, `T`에 대한 불변 참조 하나를 돌려준다"는 능력만 정의되어 있음
- `&mut T`를 돌려주는 시그니처가 트레잇 안에 아예 없으므로, `AsRef<str>`을 구현한 타입이 아무리 내부적으로 가변이더라도 `.as_ref()`를 통해서는 절대 값을 바꿀 수 없음 — "읽기 전용"은 규칙이 아니라 **타입 시그니처로 원천 차단된 것**
- `String`은 `impl AsRef<str> for String { fn as_ref(&self) -> &str { self.as_str() } }`처럼 구현되어 있어서, `Sql: AsRef<str>` 경계 하나로 `String`, `&str`, `Box<str>` 등 여러 타입을 함수 내부에서 `sql.as_ref()` 한 줄로 동일하게 `&str`로 다룰 수 있음(굳이 `&str`로 타입을 고정하지 않아도 되는 유연함)

C 비교: C라면 `const char *`를 받는 함수 하나로 충분(포인터는 이미 "값 하나를 참조"하는 방식이라 소유권 구분이 없음). Rust는 소유 타입(`String`)과 참조 타입(`&str`)이 서로 다른 타입이기 때문에, 이 둘을 모두 받아들이려면 `AsRef<str>` 같은 트레잇 경계로 "참조를 얻어올 수 있는 능력"만 요구하는 방식이 필요함.

## 🔗 참고

- [Rust 10장 - Generic Types, Traits, and Lifetimes](https://doc.rust-kr.org/ch10-00-generics.html)
- [GlueSQL - store.rs](https://github.com/gluesql/gluesql/blob/main/core/src/store.rs)
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/1.%20[Rust]%20GlueSQL%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EA%B5%AC%EC%A1%B0%EC%99%80%20%ED%95%84%EC%9A%94%20%EB%AC%B8%EB%B2%95%20%EA%B0%9C%EA%B4%80%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)
- [(Rust) 열거형과 패턴 매칭(Enum & Match) - 핵심 개념 및 특징 정리]([Rust]%20열거형과%20패턴%20매칭%28Enum%20&%20Match%29%20-%20핵심%20개념%20및%20특징%20정리.md)
