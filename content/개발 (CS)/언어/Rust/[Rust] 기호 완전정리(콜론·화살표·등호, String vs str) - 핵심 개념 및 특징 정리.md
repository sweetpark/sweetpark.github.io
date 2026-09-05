---
title: "기호 완전정리(콜론·화살표·등호, String vs &str)"
tags: [학습, 개발-CS, 언어, Rust, 기호, String, str]
created: 2026-09-05
modified: 2026-09-05
---

# 기호 완전정리 — `:` vs `->` vs `=>` vs `=`, 그리고 `String` vs `&str`

> [!NOTE]
> struct-like variant를 가진 enum(`PaymentStatus`)을 직접 써보면 콜론(`:`), 화살표(`->`, `=>`), 등호(`=`)가 비슷하게 생겨서 헷갈리기 쉽다. 각 기호가 등장하는 위치와 의미, 그리고 `String` vs `&str`을 언제 골라야 하는지 하나의 예제로 정리.

## 📌 개념

### 예제로 쓸 enum

```rust
enum PaymentStatus {
    Pending,
    Processing,
    Completed { transaction_id: String, amount: u64 },
    Failed(String),
}
```

- 키워드는 `enum`(소문자)이다. `Enum`처럼 첫 글자를 대문자로 쓰면 컴파일 에러 — Rust 키워드는 전부 소문자, 대문자로 시작하는 건 타입/variant **이름** 규칙(`PaymentStatus`, `Pending`)일 뿐

### 기호별 정리표

| 기호 | 의미 | 등장 위치 | 이 예제에서 |
| --- | --- | --- | --- |
| `:` (콜론) | ① **타입 지정** ("이 이름은 이 타입") · ② **필드 초기화** ("이 필드에 이 값") — 겉보기엔 같은 기호지만 문맥으로 구분 | ① 필드/매개변수 선언, `let` 타입 명시 · ② 구조체·struct-like variant 리터럴 생성 | `transaction_id: String`(①, 필드 타입) / `Completed { transaction_id: "TX1".to_string() }`(②, 값 대입) |
| `->` (화살표) | 함수/메서드의 **반환 타입** 지정 | `fn` 시그니처 끝에만 등장 | `fn describe(status: &PaymentStatus) -> String` |
| `=>` (매치 화살표) | "이 패턴에 매칭되면 → 이 코드를 실행" | `match`의 각 갈래, `macro_rules!`의 각 규칙에서만 등장 | `PaymentStatus::Pending => "대기중"` |
| `=` (대입) | 변수·상수에 **값**을 대입 | `let`, `const`, `static` | `let temp: i64 = 100;` |

> [!NOTE]
> `let temp i64 = 100;`처럼 타입 앞의 콜론을 빼면 컴파일 에러. Rust 변수 선언은 항상 `let 이름: 타입 = 값;` 형태(타입은 추론 가능하면 생략해서 `let temp = 100;`도 가능하지만, 타입을 **명시할 때는 반드시 `:`** 를 써야 함) — [구조체 노트의 실습 트러블슈팅]([Rust]%20구조체%28Struct%29와%20예제%20프로그램%20-%20핵심%20개념%20및%20특징%20정리.md)에서 다룬 `=>` vs `->` 혼동과 같은 종류의 실수

### match + 생성 예제로 기호 한 번에 확인

```rust
fn describe(status: &PaymentStatus) -> String {
    match status {
        PaymentStatus::Pending => "대기중".to_string(),
        PaymentStatus::Processing => "처리중".to_string(),
        PaymentStatus::Completed { transaction_id, amount } => {
            format!("완료: {transaction_id}, {amount}원")
        }
        PaymentStatus::Failed(reason) => format!("실패: {reason}"),
    }
}

fn main() {
    let temp: i64 = 100; // 변수 선언 — 타입은 `:`, 값 대입은 `=`
    let status = PaymentStatus::Completed {
        transaction_id: "TX1234".to_string(), // 리터럴 초기화도 `:` (필드: 값)
        amount: temp as u64,
    };
    println!("{}", describe(&status)); // 함수 호출 → 내부 match에서만 `=>` 사용
}
```

- `fn describe(...) -> String` — 반환 타입 지정은 항상 `->`
- `match status { ... => ... }` — 갈래 구분은 항상 `=>`
- `Completed { transaction_id: ..., amount: ... }` — struct-like variant를 **생성**할 때는 필드마다 `필드명: 값`을 `:`로 이어줌 (정의할 때 `필드명: 타입`이었던 것과 똑같은 자리에 이번엔 값이 들어감)
- `let temp: i64 = 100;` — 변수 선언은 `:` + `=`가 한 문장에 같이 등장(타입은 `:`, 값은 `=`)해서 특히 헷갈리기 쉬움

### `String` vs `&str` — 왜 `Completed`는 `String`, `Failed`도 `String`인가

| 구분 | `String` | `&str` |
| --- | --- | --- |
| 소유권 | 값을 **소유**(heap에 할당된 가변 버퍼) | 값을 **빌림**(어딘가에 있는 문자열 데이터를 가리키는 참조) |
| 크기 변경 | 가능 (`push_str` 등으로 늘어남) | 불가능 (참조 대상은 고정) |
| 주로 쓰는 곳 | 구조체/enum **필드**(값을 계속 들고 있어야 함), `.to_string()`의 결과 | 함수 **매개변수**(잠깐 읽기만 할 때), 문자열 리터럴(`"text"`)의 타입 |
| 서로 변환 | `&str` → `String`: `.to_string()` / `String::from(s)` | `String` → `&str`: `&s` 또는 `s.as_str()` (자동 역참조로 대부분 생략 가능) |

`PaymentStatus::Completed { transaction_id: String, .. }`와 `Failed(String)`이 `&str`이 아니라 `String`을 쓰는 이유: enum 값은 함수 호출이 끝난 뒤에도 계속 살아있어야 하는데, `&str`은 "누군가의 데이터를 빌린 참조"라 원본이 사라지면 같이 무효화됨(라이프타임을 명시해야 하는 복잡함 발생). 그래서 enum/구조체 필드는 데이터를 직접 **소유**하는 `String`을 쓰고, 그 값을 채워 넣을 때만 `&str`을 받아 `.to_string()`으로 변환하는 게 관례 — [구조체 노트의 `User::new` 예제]([Rust]%20구조체%28Struct%29와%20예제%20프로그램%20-%20핵심%20개념%20및%20특징%20정리.md)에서 이미 쓴 패턴과 동일.

## 🔗 참고

- [(Rust) 열거형과 패턴 매칭(Enum & Match) - 핵심 개념 및 특징 정리]([Rust]%20열거형과%20패턴%20매칭%28Enum%20&%20Match%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) 구조체(Struct)와 예제 프로그램 - 핵심 개념 및 특징 정리]([Rust]%20구조체%28Struct%29와%20예제%20프로그램%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) 소유권과 참조(Ownership & Borrowing) - 핵심 개념 및 특징 정리]([Rust]%20소유권과%20참조%28Ownership%20&%20Borrowing%29%20-%20핵심%20개념%20및%20특징%20정리.md)
