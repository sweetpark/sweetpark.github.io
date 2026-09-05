---
title: "소유권과 참조(Ownership & Borrowing)"
tags: [학습, 개발-CS, 언어, Rust, 소유권, 참조, 메모리]
created: 2026-09-05
modified: 2026-09-05
---

# 소유권과 참조 (Ownership & Borrowing)

> [!NOTE]
> Rust의 소유권(Ownership), 이동(Move)/클론(Clone)/대여(Borrow) 차이, 참조(`&`)와 C 포인터의 비교, 자동 역참조, Raw Pointer까지 정리.

## 📌 개념

### 1. 소유권(Ownership)과 함수 매개변수

Rust에서는 변수가 데이터의 소유권(Ownership)을 가진다. 함수에 변수를 전달할 때 타입 정의에 따라 동작이 달라진다.

```rust
fn main() {
    let test = String::from("Hello");
    // 1. 소유권 이동 (Move)
    read_test_move(test);
    // println!("{test}"); // ❌ 에러! test의 소유권이 넘어갔으므로 접근 불가 (E0382)

    // 2. 소유권 대여 (Borrow / 참조)
    let test2 = String::from("World");
    read_test_borrow(&test2);
    println!("{test2}"); // ✅ 정상 작동! 소유권이 main에 남아있음
}

fn read_test_move(parameter: String) {
    println!("{parameter}");
} // parameter가 스코프를 벗어나며 메모리(Heap)에서 해제(drop)됨

fn read_test_borrow(parameter: &str) { // Idiomatic: &String보다 &str 사용 권장
    println!("{parameter}");
}
```

### 2. 이동(Move) vs 클론(Clone) vs 참조(&)

`String`처럼 힙(Heap) 메모리를 사용하는 타입의 데이터 복사/전달 방식 차이.

| 구분 | 소유권 변화 | 힙(Heap) 메모리 동작 | 비고 / 성능 |
| --- | --- | --- | --- |
| **Move (`let b = a`)** | `a` → `b` 이동 | 메모리 재할당 없음 (Stack의 포인터 정보만 복사 후 `a` 무효화) | 오버헤드 없음 (기본 동작) |
| **Clone (`let b = a.clone()`)** | `a`, `b` 각각 소유 | **깊은 복사(Deep Copy)** 발생 (힙 메모리 새로 할당 및 데이터 전체 복사) | 힙 할당 비용 발생 |
| **Borrow (`let b = &a`)** | `a` 유지 (`b`는 빌림) | 메모리 재할당 없음 (주소값만 전달) | **가장 효율적 (추천)** |

### 3. 참조(&)와 대여(Borrowing) — 공식 규칙

**참조자(Reference)**는 해당 주소에 저장된 데이터에 접근할 수 있게 해주는 주솟값으로, 포인터와 유사하지만 "살아있는 동안 특정 타입에 대한 유효한 값을 가리킴을 보장"한다. `&` 연산자로 만들며, 값의 소유권을 가져오지 않고 참조하는 행위를 **대여(borrow)** 라고 한다.

```rust
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1); // 참조자 전달
    println!("'{}'의 길이: {}", s1, len); // s1을 계속 사용 가능
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

**불변 참조자 (기본값)**: 빌린 값은 수정 불가.

```rust
fn change(some_string: &String) {
    some_string.push_str(", world"); // ❌ 컴파일 에러 (cannot borrow as mutable)
}
```

**가변 참조자 (`&mut`)**: 값을 수정하려면 명시적으로 가변 참조를 사용.

```rust
fn main() {
    let mut s = String::from("hello");
    change(&mut s);
}

fn change(some_string: &mut String) {
    some_string.push_str(", world"); // ✅ 정상 작동
}
```

**참조자의 두 가지 황금 규칙**

1. 특정 스코프 내에서 하나의 가변 참조자(`&mut`) *또는* 여러 개의 불변 참조자(`&`) 중 하나만 가질 수 있다 (동시 사용 불가).
2. 참조자는 항상 유효해야 한다 (댕글링 참조 금지).

```rust
let mut s = String::from("hello");
let r1 = &mut s;
let r2 = &mut s; // ❌ E0499: 가변 참조자 2개 동시 불가

let r3 = &s;
let r4 = &mut s; // ❌ E0502: 불변 참조와 가변 참조 혼용 불가
```

이 제약은 **데이터 경합(Data Race)** — ① 둘 이상의 포인터가 동일 데이터에 접근, ② 하나 이상이 쓰기 작업 수행, ③ 동기화 메커니즘 부재 — 를 컴파일 타임에 원천 차단하기 위함이다.

**NLL (Non-Lexical Lifetimes)**: 참조자는 정의 지점부터 "마지막으로 사용된 지점"까지만 유효하다. 따라서 아래처럼 불변 참조 사용이 끝난 뒤 가변 참조를 만드는 것은 허용된다.

```rust
let mut s = String::from("hello");
let r1 = &s;
let r2 = &s;
println!("{} and {}", r1, r2); // r1, r2의 마지막 사용 지점

let r3 = &mut s; // ✅ 정상: r1, r2는 이미 사용이 끝남
println!("{}", r3);
```

**댕글링 참조(Dangling Reference) 방지**: 함수가 지역 변수의 참조를 반환하려 하면 컴파일 에러가 발생한다.

```rust
fn dangle() -> &String {
    let s = String::from("hello");
    &s // ❌ 에러: s가 함수 끝에서 drop되므로 참조가 무효해짐
}

fn no_dangle() -> String {
    let s = String::from("hello");
    s // ✅ 정상: 참조 대신 소유권 자체를 이전
}
```

### 4. Rust의 참조(`&`) vs C언어의 포인터

참조(`&`)의 내부 동작은 **C언어의 포인터(주소값 전달)와 동일**하지만, **컴파일 타임 안전성**에서 차이가 난다.

```
[Stack]                           [Heap]
test2 (String) ──(포인터/길이)──> "World"
parameter (&str) ─(주소값 참조)──┘
```

- **공통점**: 8바이트(64bit 기준) 주소값만 전달하므로 힙 복사 없이 빠름.
- **Rust만의 차이점 (컴파일러 검증)**
  1. Null Pointer 없음 — 참조는 항상 유효한 메모리를 가리킴.
  2. Dangling Pointer 없음 — 원본 데이터가 해제되면 참조도 컴파일 불가능 (위 3번 항목).
  3. Data Race 방지 — 불변 참조(`&T`)는 여러 개 가능하지만, 가변 참조(`&mut T`)는 단 1개만 허용.

### 5. `.` 연산자와 자동 역참조 (Auto-Deref)

C언어에서는 포인터 접근 시 `->` 화살표 연산자를 사용하지만, **Rust는 원본이든 참조(`&`)든 모두 `.`(점) 연산자를 사용**한다.

```rust
struct Point { x: i32, y: i32 }

let p = Point { x: 10, y: 20 };
let p_ref = &p;

println!("{}", p.x);     // 10
println!("{}", p_ref.x); // 10 (컴파일러가 (*p_ref).x 로 자동 역참조)
```

> Rust에서 `->`는 오직 **함수의 반환 타입 지정**(`fn add() -> i32`)에만 쓰인다. C의 화살표 역참조와 혼동하지 않도록 주의.

### 6. 포인터 주소값 및 값 직접 다루기

| 목적 | 방법 | 예시 |
| --- | --- | --- |
| 주소값 자체 출력 | `{:p}` 포맷팅 | `println!("{:p}", r);` → `0x7ff7bfe0f8f4` |
| 포인터가 가리키는 값 변경 | `*` 역참조 연산자 | `let mut num = 10; let r = &mut num; *r += 5;` |
| C언어 스타일 날 포인터 | Raw Pointer (`*const T`, `*mut T`) | `let raw = &num as *const i32; unsafe { println!("{}", *raw); }` |

Raw Pointer는 Rust의 안전성 보장(Null/Dangling/Data Race 방지)을 받지 않으므로, 역참조 시 반드시 `unsafe` 블록이 필요하다.

> [!NOTE]
> "Rust에는 명시적 `return`이 없다?"는 표현식 기반 반환은 별도 노트로 분리했다 — [(Rust) 표현식과 문장(Expression vs Statement, 암묵적 반환) - 핵심 개념 및 특징 정리]([Rust]%20표현식과%20문장%28Expression%20vs%20Statement,%20암묵적%20반환%29%20-%20핵심%20개념%20및%20특징%20정리.md) 참고.

## 🔗 참고

- [Rust 4.2장 - References and Borrowing](https://doc.rust-kr.org/ch04-02-references-and-borrowing.html)
