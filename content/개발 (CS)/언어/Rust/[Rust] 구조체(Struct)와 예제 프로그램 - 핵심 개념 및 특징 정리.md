---
title: "구조체(Struct)와 예제 프로그램"
tags: [학습, 개발-CS, 언어, Rust, 구조체, 디버깅]
created: 2026-09-05
modified: 2026-09-05
---

# 구조체(Struct)와 예제 프로그램

> [!NOTE]
> 구조체 정의 3가지 형태, 필드 초기화 축약/업데이트 문법, `impl`로 메서드·연관 함수 붙이는 법부터, 사각형 넓이 계산 예제로 보는 "개별 변수 → 튜플 → 구조체" 리팩토링 과정, `#[derive(Debug)]` / `dbg!` 매크로를 이용한 디버깅까지 정리.

## 📌 개념

### 구조체의 3가지 형태

Rust의 `struct`는 데이터(필드)만 정의하며, C의 구조체처럼 메서드를 내부에 넣을 수 없다. 형태는 세 가지.

```rust
// 1. 이름 있는 필드 구조체 (Named-Field Struct) — 가장 일반적인 형태
struct Rectangle {
    width: u32,
    height: u32,
}

// 2. 튜플 구조체 (Tuple Struct) — 필드 이름 없이 순서로만 구분
struct Point(i32, i32, i32);
let origin = Point(0, 0, 0);
println!("{}", origin.0); // 인덱스로 접근

// 3. 유닛 구조체 (Unit-Like Struct) — 필드가 아예 없음
struct AlwaysEqual;
let subject = AlwaysEqual;
```

- **튜플 구조체**는 `Point(i32, i32, i32)`처럼 이름이 있는 튜플. `Point`와 `Color` 둘 다 `(i32, i32, i32)` 구조여도, 서로 다른 타입이라 섞어 쓸 수 없다는 점이 일반 튜플과의 차이.
- **유닛 구조체**는 필드가 없어 데이터를 저장하지 않지만, 어떤 트레잇을 구현하기 위한 "타입 자체"가 필요할 때(마커 타입) 사용.

### 필드 초기화 축약 (Field Init Shorthand)

매개변수 이름과 필드 이름이 같으면 `필드: 변수` 대신 이름만 써도 된다.

```rust
fn build_rectangle(width: u32, height: u32) -> Rectangle {
    Rectangle { width, height } // width: width, height: height 를 축약
}
```

### 구조체 업데이트 문법 (Struct Update Syntax)

기존 인스턴스의 나머지 필드 값을 그대로 가져오면서 일부만 바꿔 새 인스턴스를 만들 때 `..기존값` 사용.

```rust
let rect1 = Rectangle { width: 30, height: 50 };
let rect2 = Rectangle { width: 10, ..rect1 }; // height는 rect1의 값(50)을 그대로 사용
```

> [!NOTE]
> `..rect1`로 가져오는 필드가 `String`처럼 소유권이 있는 타입이면, 그 필드에 한해 `rect1`의 소유권이 `rect2`로 이동(Move)되어 이후 `rect1` 전체를 사용할 수 없게 될 수 있다. (`u32`처럼 `Copy` 타입인 필드는 복사되므로 영향 없음)

### `impl` 블록 — 메서드와 연관 함수

구조체는 필드만 갖고, 동작(함수)은 별도의 `impl` 블록에서 붙인다.

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 메서드 (method): 첫 매개변수가 self  → rect1.area() 처럼 인스턴스에서 호출
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }

    // 연관 함수 (associated function): self가 없음 → Rectangle::square(20) 처럼 타입 자체에서 호출
    // 다른 언어의 "정적 메서드/생성자"와 비슷한 역할, 관례적으로 new()라는 이름을 많이 씀
    fn square(size: u32) -> Self {
        Self { width: size, height: size }
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    let sq = Rectangle::square(20);

    println!("{}", rect1.area());        // 1500  (rect1.area() → Rectangle::area(&rect1) 로 자동 변환됨)
    println!("{}", rect1.can_hold(&sq));  // true
}
```

- `&self`: 불변 대여 — 값을 읽기만 함 (가장 흔한 형태)
- `&mut self`: 가변 대여 — 값을 수정
- `self`: 소유권 자체를 가져옴 — 주로 인스턴스를 변환/소비하고 새 값을 반환하는 메서드에 사용
- 같은 구조체에 대해 `impl` 블록을 여러 번 나눠 작성해도 됨 (기능별로 분리 가능)
- `impl Trait for Struct` 형태(트레잇 구현)는 이 `impl`과 문법은 비슷하지만 별개 개념 → [트레잇과 제네릭 노트]([Rust]%20트레잇과%20제네릭%28Trait%20Object,%20Blanket%20Impl,%20제네릭%20경계%29%20-%20핵심%20개념%20및%20특징%20정리.md) 참고

### 생성자처럼 쓰는 연관 함수 — `new()` 관례

Rust에는 C++/Java의 `new`, `constructor` 같은 **전용 문법이 없다**. 대신 `Self`를 반환하는 연관 함수를 관례적으로 `new`라는 이름으로 만들어 "생성자"처럼 사용한다. (`new`는 그냥 관례일 뿐, 언어가 강제하는 예약어가 아님)

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 자기 자신(Self)을 만들어 반환 → 생성자 역할
    fn new(width: u32, height: u32) -> Self {
        Self { width, height } // 필드 초기화 축약 문법 사용
    }

    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle::new(30, 50); // Rectangle { width: 30, height: 50 }과 동일하지만,
                                         // 생성 시점에 유효성 검사·기본값 처리 등을 끼워 넣을 수 있음
    println!("{}", rect1.area());
}
```

- `fn new(...) -> Self`: 매개변수를 받아 필드를 채운 뒤 `Self { ... }`(또는 구조체 이름을 직접 써서 `Rectangle { ... }`)를 반환. `Self`는 현재 `impl` 대상 타입(`Rectangle`)을 가리키는 별칭이라, 구조체 이름이 나중에 바뀌어도 `impl` 내부 코드는 그대로 유지됨
- 필드를 직접 `pub`으로 노출하지 않고 `new()`를 통해서만 만들도록 강제하면, 생성 시점에 값 검증(예: `width`가 0이면 안 됨)을 한 곳에 모아둘 수 있음 — 필드에 직접 접근해 잘못된 값을 넣는 실수를 막는 캡슐화 효과
- `Rectangle::square(size)`도 결국 같은 패턴(연관 함수가 `Self`를 반환)이지만, `new`는 "일반적인 생성", `square`는 "정사각형이라는 특수 케이스 전용 생성자"라는 의미상 차이만 있을 뿐 문법적으로는 동일

## 실전 예제 — 사각형 넓이 계산 리팩토링

### 1단계: 개별 변수로 시작

```rust
fn main() {
    let width1 = 30;
    let height1 = 50;
    println!("The area of the rectangle is {} square pixels.",
             area(width1, height1));
}

fn area(width: u32, height: u32) -> u32 {
    width * height
}
```

- **문제점**: `width1`, `height1` 두 변수가 하나의 사각형을 나타낸다는 관계가 코드에 드러나지 않음. 함수 시그니처만 보고는 두 인자의 의미 파악이 어려움.

### 2단계: 튜플로 개선

```rust
fn main() {
    let rect1 = (30, 50);
    println!("The area of the rectangle is {} square pixels.",
             area(rect1));
}

fn area(dimensions: (u32, u32)) -> u32 {
    dimensions.0 * dimensions.1
}
```

- **장점**: 인수가 하나(`rect1`)로 줄어들어 관련 데이터가 한 곳에 묶임.
- **문제점**: `dimensions.0`, `dimensions.1`처럼 인덱스로 접근해야 해서 어느 값이 너비/높이인지 이름만으로 알 수 없음 → 의미 불명확.

### 3단계: 구조체로 최적화

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };
    println!("The area of the rectangle is {} square pixels.",
             area(&rect1));
}

fn area(rectangle: &Rectangle) -> u32 {
    rectangle.width * rectangle.height
}
```

**핵심 개선사항**

- 필드에 `width`, `height`라는 명확한 이름을 부여 → 가독성 및 의도 전달력 향상
- 함수에는 `&Rectangle` (불변 참조)로 전달 → `main`이 `rect1`의 소유권을 계속 유지하면서 `area` 함수를 호출 가능 ([소유권과 참조](%5BRust%5D%20소유권과%20참조%28Ownership%20&%20Borrowing%29%20-%20핵심%20개념%20및%20특징%20정리.md) 문서의 대여(Borrow) 개념과 동일)

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| 개별 변수 | 단순함 | 값들의 관계성이 불명확 |
| 튜플 | 간결함, 인자 1개로 축소 | 인덱스 접근(`.0`, `.1`)이라 의미 파악 어려움 |
| 구조체 | 필드 이름으로 의미가 명확, `impl`로 관련 동작(예: `area`)까지 묶을 수 있음 | 정의 코드가 추가로 필요 |

> [!NOTE]
> 위 `area(&rectangle)` 함수는 `impl Rectangle { fn area(&self) -> u32 { self.width * self.height } }`로 바꿔 `rect1.area()`처럼 호출하는 것이 더 관용적(idiomatic)이다. 함수 형태로 남겨둔 이유는 원문 예제가 구조체 도입 자체에 집중하기 위함.

### 구조체 디버그 출력

기본적으로 구조체는 `println!("{}", ...)`(`Display`)로 출력할 수 없다. 디버깅 목적의 출력을 위해서는 `#[derive(Debug)]` 속성을 구조체 위에 붙여야 한다.

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}
```

**방법 1 — `{:?}` 포맷 (한 줄 출력)**

```rust
println!("rect1 is {:?}", rect1);
// 출력: rect1 is Rectangle { width: 30, height: 50 }
```

**방법 2 — `{:#?}` 포맷 (여러 줄 정렬, pretty-print)**

```rust
println!("rect1 is {:#?}", rect1);
// 출력:
// rect1 is Rectangle {
//     width: 30,
//     height: 50,
// }
```

**방법 3 — `dbg!` 매크로 (stderr 출력 + 파일/라인 정보 포함)**

`dbg!`는 `println!`과 달리 표준 에러(stderr)에 출력하며, 표현식의 **값을 소유권째로 반환**하므로 코드 흐름 중간에 끼워 넣을 수 있다. 참조(`&`)를 넘기면 소유권을 유지한 채로 디버깅 가능.

```rust
let scale = 2;
let rect1 = Rectangle {
    width: dbg!(30 * scale), // 표현식 결과를 반환하면서 동시에 디버그 출력
    height: 50,
};

dbg!(&rect1); // 참조를 넘겨 소유권 유지
```

출력 예시:

```
[src/main.rs:10] 30 * scale = 60
[src/main.rs:14] &rect1 = Rectangle {
    width: 60,
    height: 50,
}
```

> [!NOTE]
> - `{:?}` / `{:#?}` → `println!`에서 사용, 표준 출력(stdout)
> - `dbg!` → 표현식 자체를 감싸서 사용, 표준 에러(stderr) + 파일명·라인 번호 함께 출력
> - 셋 다 구조체에 `#[derive(Debug)]`가 선언되어 있어야 동작함

## 실습 트러블슈팅 — 자주 하는 실수 (C/타 언어 문법과 혼동)

직접 `struct` + `impl`을 작성하며 자주 걸리는 5가지 실수. C/Java/JS 문법 습관이 그대로 남아서 발생하는 패턴이 대부분.

| 구분 | ❌ 실수 | ✅ 올바른 표현 | 원인 |
| --- | --- | --- | --- |
| 필드 선언 | `name = String,` | `name: String,` | 구조체 필드는 `이름: 타입`. `=`는 값 대입에만 쓰고, 필드 "타입 지정"에는 콜론(`:`)을 사용 |
| 반환 타입 | `fn new(...) => Self` | `fn new(...) -> Self` | `->`는 함수 반환 타입 전용. `=>`는 `match` 갈래나 클로저 본문에서만 등장 |
| 매개변수 & 문자열 참조 | `fn new(&name, &age, ...)` | `fn new(name: &str, age: i64, ...)` | 매개변수는 반드시 `이름: 타입` 형식. 문자열 리터럴을 받으려면 `&`만으로는 부족하고 문자열 슬라이스 타입 `&str`을 명시해야 함 |
| 구조체 리터럴 생성 | `Self { name.to_string(), age, ... }` | `Self { name: name.to_string(), age, ... }` | [필드 초기화 축약](#필드-초기화-축약-field-init-shorthand)은 **매개변수 이름과 필드 이름이 완전히 같을 때만** 가능(`age`, `active`). `name.to_string()`처럼 변환식이 들어가면 어느 필드용인지 `name:`을 반드시 명시 |
| `println!` 호출 | `println!({"{}, {}", self.name, ...});` | `println!("{}, {}", self.name, ...);` | `println!`은 포맷 문자열을 `()` 안에 문자열 리터럴로 바로 전달. `{}`로 전체를 감싸는 건 문법 자체가 다름(포맷 문자열 내부에서만 `{}`가 자리표시자로 쓰임) |

### 최종 예제 — 자주 하는 실수를 모두 바로잡은 코드

```rust
struct User {
    name: String,
    age: i64,
    email: String,
    active: bool,
}

impl User {
    fn new(name: &str, age: i64, email: &str, active: bool) -> Self {
        Self {
            name: name.to_string(),  // &str → String 변환이 들어가므로 필드명 명시 필수
            age,                      // 매개변수명 == 필드명 → 축약 가능
            email: email.to_string(),
            active,                   // 매개변수명 == 필드명 → 축약 가능
        }
    }

    fn print(&self) {
        println!("{}, {}, {}, {}", self.name, self.email, self.age, self.active);
    }
}

fn main() {
    let user = User::new("park", 10, "w@wiez.com", true);
    user.print();
}
```

- `name: &str`, `email: &str`로 받은 뒤 `new()` 내부에서 `.to_string()`으로 `String`으로 변환 — 함수 매개변수는 참조(`&str`)로 가볍게 받고, 구조체 필드는 소유권을 가진 `String`으로 저장하는 전형적인 패턴(호출부에서 `"park"` 같은 문자열 리터럴을 그대로 넘길 수 있게 해줌)
- `age`, `active`는 타입이 이미 `i64`, `bool`(둘 다 `Copy` 타입)이라 변환이 필요 없어 축약 표기가 그대로 가능

## 🔗 참고

- [Rust 5.2장 - An Example Program Using Structs](https://doc.rust-kr.org/ch05-02-example-structs.html)
- [(Rust) 소유권과 참조(Ownership & Borrowing) - 핵심 개념 및 특징 정리]([Rust]%20소유권과%20참조%28Ownership%20&%20Borrowing%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) 트레잇과 제네릭(Trait Object, Blanket Impl, 제네릭 경계) - 핵심 개념 및 특징 정리]([Rust]%20트레잇과%20제네릭%28Trait%20Object,%20Blanket%20Impl,%20제네릭%20경계%29%20-%20핵심%20개념%20및%20특징%20정리.md)
