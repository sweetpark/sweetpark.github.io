---
title: "매크로(절차적 매크로 & macro_rules!)"
tags: [학습, 개발-CS, 언어, Rust, 매크로, GlueSQL]
created: 2026-09-05
modified: 2026-09-05
---

# 매크로 (절차적 매크로 & macro_rules!)

> [!NOTE]
> 매크로가 함수와 근본적으로 다른 이유, `macro_rules!` 기본 문법(패턴·반복·fragment specifier), 매크로 3종류(declarative / derive / attribute / function-like) 구분부터 정리한 뒤, GlueSQL이 Row ↔ 구조체 변환 코드를 자동 생성하는 절차적 매크로와 테스트용 `macro_rules!`를 실전 코드로 확인.

## 📌 개념

### 매크로 vs 함수 — 왜 매크로가 필요한가

매크로는 **함수 호출이 아니라 코드를 코드로 확장(expand)하는** 컴파일 타임 메타프로그래밍이다. 함수로는 할 수 없는 일들을 매크로는 할 수 있다.

- **가변 개수의 인자**: `println!("{} {} {}", a, b, c)`처럼 인자 개수가 매번 달라져도 되는 함수는 만들 수 없지만, 매크로는 가능
- **컴파일 타임에 코드 생성**: 함수는 런타임에 호출되지만, 매크로는 컴파일 전에 실제 코드로 치환되어 그 자리에 삽입됨
- **타입에 매이지 않는 반복 작업**: 구조체 필드마다 반복되는 보일러플레이트(예: 각 필드를 순회하며 변환하는 코드)를 필드 개수/타입에 상관없이 자동 생성 가능

### `macro_rules!` 기본 문법 — 선언적 매크로

표준 라이브러리의 `vec!`도 사실 `macro_rules!`로 정의되어 있다 (개념 이해를 위해 단순화한 버전).

```rust
macro_rules! my_vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $( temp_vec.push($x); )*
            temp_vec
        }
    };
}

let v = my_vec![1, 2, 3]; // vec![1, 2, 3]과 동일하게 동작
```

- `( $( $x:expr ),* )`: 패턴 부분. `$x:expr`은 "표현식 하나"를 캡처, `$( ... ),*`는 "콤마로 구분된 것이 0개 이상 반복"됨을 의미
- `=> { ... }`: 매치되면 확장될 코드. `$( temp_vec.push($x); )*`처럼 패턴에서 반복된 만큼(`,*`) 확장부도 똑같이 반복됨
- 즉 `my_vec![1, 2, 3]`은 `$x`에 `1`, `2`, `3`이 각각 매칭되어 `temp_vec.push(1); temp_vec.push(2); temp_vec.push(3);`으로 펼쳐짐

### 여러 패턴(매치 암)을 가진 매크로

함수의 오버로딩처럼, 하나의 매크로가 여러 형태의 입력을 받도록 여러 패턴을 나열할 수 있다.

```rust
macro_rules! greet {
    () => {
        println!("Hello!");
    };
    ($name:expr) => {
        println!("Hello, {}!", $name);
    };
}

greet!();           // Hello!
greet!("Rust");      // Hello, Rust!
```

### 자주 쓰는 fragment specifier

| 지정자 | 의미 | 예시 |
| --- | --- | --- |
| `expr` | 표현식 | `1 + 2`, `foo()` |
| `ident` | 식별자(변수/함수 이름) | `x`, `my_var` |
| `literal` | 리터럴 값 | `"hello"`, `42` |
| `ty` | 타입 | `i32`, `Vec<String>` |
| `block` | 중괄호로 감싼 코드 블록 | `{ let x = 1; x }` |
| `pat` | 패턴 (match 갈래에 쓰는 것과 동일) | `Some(x)` |
| `stmt` | 하나의 문장(statement) | `let x = 1;` |

### 매크로 3종류 구분

| 종류 | 정의 위치 | 트리거 문법 | 용도 |
| --- | --- | --- | --- |
| **선언적 매크로** (`macro_rules!`) | 아무 파일 (같은 크레이트 내) | `이름!(...)` | 반복되는 코드 패턴 치환 (예: `vec!`, `println!`) |
| **파생 매크로** (`#[proc_macro_derive]`) | 별도의 `proc-macro = true` 크레이트 | `#[derive(이름)]` | 구조체/열거형에 자동으로 트레잇 구현 추가 |
| **속성 매크로** (`#[proc_macro_attribute]`) | 별도의 proc-macro 크레이트 | `#[이름]` | 함수/구조체 전체를 감싸 변형 (예: `#[tokio::main]`) |
| **함수형 매크로** (`#[proc_macro]`) | 별도의 proc-macro 크레이트 | `이름!(...)` | `macro_rules!`보다 복잡한 파싱/생성 로직이 필요할 때 |

절차적 매크로(파생/속성/함수형)는 내부적으로 입력 코드를 실제 문법 트리(AST)로 파싱해야 하므로, 보통 `syn`(파싱) + `quote`(코드 생성) 크레이트 조합을 사용한다.

## GlueSQL 실전 예제

GlueSQL은 반복적인 Row ↔ 구조체 변환 코드를 자동 생성하기 위해 `macros` 크레이트에서 **절차적 파생 매크로**를 직접 구현하고, 테스트 코드에서는 반복되는 assert 패턴을 줄이기 위해 **선언적 매크로(`macro_rules!`)** 를 사용한다.

### 절차적 파생 매크로(Derive Macro) 정의

```rust
// macros/src/lib.rs:53-69
#[proc_macro_derive(FromGlueRow, attributes(glue))]
pub fn derive_from_glue_row(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    match from_glue_row::expand_from_glue_row(input) {
        Ok(ts) => TokenStream::from(ts),
        Err(e) => e.to_compile_error().into(),
    }
}

#[proc_macro_derive(ToGlueRow, attributes(glue))]
pub fn derive_to_glue_row(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    match to_glue_row::expand_to_glue_row(input) {
        Ok(ts) => TokenStream::from(ts),
        Err(e) => e.to_compile_error().into(),
    }
}
```

- `#[proc_macro_derive(FromGlueRow, attributes(glue))]`: `#[derive(FromGlueRow)]`를 사용자 구조체에 붙일 수 있게 해주는 매크로를 정의. `attributes(glue)`는 `#[glue(...)]`라는 추가 속성(attribute)을 필드에 붙여 커스터마이징할 수 있게 허용
- `parse_macro_input!(input as DeriveInput)`: 입력받은 `TokenStream`(코드 텍스트를 토큰으로 쪼갠 것)을 `syn` 크레이트의 `DeriveInput`(구조체 정의를 나타내는 AST)으로 파싱
- 매크로 전개 중 에러가 나면 런타임 패닉이 아니라 `e.to_compile_error()`로 **컴파일 에러 메시지**를 만들어 반환 (매크로 작성 시 흔한 패턴)

### 매크로 사용 예시 (사용자 코드 관점)

```rust
#[derive(FromGlueRow)]
struct User {
    id: i64,
    name: String,
    #[glue(default)]
    nickname: Option<String>,
}
```

이렇게 `#[derive(FromGlueRow)]`만 붙이면, DB에서 읽은 `Vec<Value>` 한 행(row)을 `User` 구조체로 자동 변환하는 코드가 컴파일 타임에 생성된다 — 매번 수동으로 `row[0]`, `row[1]`을 꺼내 타입 변환하는 코드를 직접 쓰지 않아도 됨.

### 매크로 내부 구현 — `quote!`로 코드 생성

```rust
// macros/src/from_glue_row.rs:68-88 (일부 축약)
let init_expr = if is_option {
    quote! {
        let __idx = __labels.iter().position(|l| l == #column_name)
            .ok_or(#gluesql_crate::row_conversion::RowConversionError::MissingColumn {
                field: #field_name_literal,
                column: #column_name
            })?;
        let __v = &__row[__idx];
        let #field_ident = match __v {
            #gluesql_crate::data::Value::Null => None,
            __v => Some({ #value_match_ref }),
        };
    }
} else {
    // ...
};
```

- `quote! { ... }`: 매크로 내부에서 "생성하고 싶은 실제 Rust 코드"를 문자열이 아니라 **코드 그대로** 작성하게 해주는 매크로 (quote 크레이트). `#column_name`, `#field_ident`처럼 `#` 뒤에 변수를 쓰면 그 값이 코드 조각으로 치환(interpolation)됨 — `macro_rules!`의 `$x` 치환과 근본적으로 같은 발상이지만, `quote!`는 임의의 Rust 값(문자열, 식별자 등)을 자유롭게 프로그래밍적으로 조합해 코드를 만들 수 있다는 점이 다름
- 이렇게 생성된 코드가 `#[derive(FromGlueRow)]`가 붙은 각 구조체마다 컴파일 시점에 실제로 삽입됨 (구조체 필드 개수·타입이 달라도 매크로가 필드를 순회하며 그에 맞는 코드를 만들어냄 — 이게 함수로는 불가능하고 매크로로만 가능한 이유)

### 선언적 매크로 — `macro_rules!` (테스트 코드)

```rust
// storages/shared-memory-storage/tests/shared_memory_storage.rs:26-36
macro_rules! exec {
    ($glue: ident $sql: literal) => {
        $glue.execute($sql).unwrap();
    };
}

macro_rules! test {
    ($glue: ident $sql: literal, $result: expr) => {
        assert_eq!($glue.execute($sql), $result);
    };
}
```

- 위 fragment specifier 표에서 배운 `ident`(식별자), `literal`(리터럴), `expr`(표현식)이 그대로 쓰임
- 사용 예: `exec!(glue "CREATE TABLE Foo (id INTEGER);");` → `glue.execute("CREATE TABLE Foo (id INTEGER);").unwrap();`로 치환되어, 반복되는 SQL 실행/검증 코드를 짧게 줄여줌

> [!NOTE]
> **`macro_rules!` vs 절차적 매크로 — 언제 뭘 쓰나**
> - `macro_rules!`: 토큰 패턴 → 토큰 치환. 문법이 간단하고 같은 파일에 바로 정의 가능하지만, 복잡한 분석/조건부 코드 생성엔 한계가 있음 (GlueSQL 테스트 코드처럼 단순 반복 축약에 적합)
> - 절차적 매크로(`#[proc_macro_derive]` 등): 별도 크레이트로 분리해야 하며, 입력 코드를 실제 AST(`syn` 크레이트)로 파싱해 임의의 로직(필드 순회, 조건 분기 등)으로 코드를 생성할 수 있음 → GlueSQL의 `FromGlueRow`/`ToGlueRow`처럼 구조체 필드를 순회하며 각 필드 타입에 맞는 변환 코드를 만들어내는 작업에 필요

## 일반적인 매크로 사용 vs GlueSQL 스타일 매크로 사용 — 비교 및 연습

교과서 예제(`my_vec!`, `greet!`)와 GlueSQL 실전 코드(`FromGlueRow`/`ToGlueRow`, `exec!`/`test!`)는 같은 "매크로"라는 이름이지만 목적과 구현 방식이 크게 다르다.

| 구분 | 일반적인(교과서) 사용 | GlueSQL 스타일 사용 |
| --- | --- | --- |
| 정의 위치 | 같은 파일/크레이트 안에 `macro_rules!`로 바로 정의 | 파생 매크로는 별도 `proc-macro = true` 크레이트(`macros/`)로 완전히 분리 |
| 목적 | 반복되는 **토큰 패턴** 축약(`vec!`, `my_vec!`) | 구조체 **필드를 순회**하며 트레잇 구현 코드를 자동 생성(`FromGlueRow`/`ToGlueRow`) |
| 입력 처리 방식 | 토큰을 패턴 매칭만 함 (실제 파싱 불필요) | `syn`으로 입력을 AST(`DeriveInput`)로 파싱한 뒤, 필드 이름·타입별로 분기 로직 실행 |
| 에러 처리 | 패턴이 안 맞으면 컴파일러 기본 에러 메시지 | 직접 `Result<TokenStream, syn::Error>`로 판단해 `e.to_compile_error()`로 의미 있는 컴파일 에러를 만들어 반환 |
| 실제 쓰임 | 테스트 코드의 반복되는 실행/검증을 줄임(`exec!`, `test!`) | 사용자 구조체에 `#[derive(FromGlueRow)]`만 붙이면 Row ↔ 구조체 변환 코드 전체가 자동 생성됨 |

### 연습 예제 1 — GlueSQL 테스트 스타일 `macro_rules!` 직접 만들기

`exec!`/`test!`와 같은 발상으로, "실행 결과를 기대값 목록과 비교"하는 나만의 매크로를 만들어보는 연습.

```rust
macro_rules! assert_rows {
    ($glue: ident $sql: literal, $expected: expr) => {
        let rows: Vec<_> = $glue.execute($sql).unwrap().select().unwrap().collect();
        assert_eq!(rows, $expected);
    };
}

// 사용 예
assert_rows!(glue "SELECT * FROM Foo;", vec![row1, row2]);
// 위 한 줄이 아래처럼 펼쳐짐(매크로 확장):
// let rows: Vec<_> = glue.execute("SELECT * FROM Foo;").unwrap().select().unwrap().collect();
// assert_eq!(rows, vec![row1, row2]);
```

- `$glue: ident`, `$sql: literal`, `$expected: expr` — 앞서 배운 fragment specifier 3개를 그대로 조합
- `exec!`/`test!`가 "실행만" 또는 "값 하나만 비교"였다면, 이 매크로는 "실행 + 컬렉션 비교"까지 한 번에 묶은 것 — 매크로는 이렇게 반복되는 여러 줄을 한 호출로 줄이는 데 목적이 있음이 드러남

### 연습 예제 2 — 파생 매크로가 실제로 만드는 코드 손으로 확인하기

`#[derive(FromGlueRow)]`를 직접 실행할 순 없지만, 그 매크로가 **개념적으로 어떤 코드를 대신 써주는지** 손으로 펼쳐보면 절차적 매크로의 역할이 분명해진다.

```rust
// 사용자가 작성하는 코드는 이게 전부
#[derive(FromGlueRow)]
struct User {
    id: i64,
    name: String,
}
```

```rust
// #[derive(FromGlueRow)]가 컴파일 타임에 대신 생성해주는 코드 (개념적 예시)
impl FromGlueRow for User {
    fn from_glue_row(labels: &[String], row: &[Value]) -> Result<Self, RowConversionError> {
        let idx = labels.iter().position(|l| l == "id")
            .ok_or(RowConversionError::MissingColumn { field: "id", column: "id" })?;
        let id = match &row[idx] {
            Value::I64(v) => *v,
            _ => return Err(RowConversionError::IncompatibleType { field: "id" }),
        };

        let idx = labels.iter().position(|l| l == "name")
            .ok_or(RowConversionError::MissingColumn { field: "name", column: "name" })?;
        let name = match &row[idx] {
            Value::Str(v) => v.clone(),
            _ => return Err(RowConversionError::IncompatibleType { field: "name" }),
        };

        Ok(User { id, name })
    }
}
```

- 필드가 `id`, `name` 두 개뿐이라 짧아 보이지만, 필드가 10개인 구조체라면 똑같은 패턴을 10번 반복해야 함 — 이걸 손으로 매번 쓰지 않게 해주는 것이 `#[proc_macro_derive]`의 핵심 가치
- 실제 매크로 구현(`macros/src/from_glue_row.rs`)은 이 반복 패턴을 `syn`으로 필드 목록을 얻고 `quote!`로 필드 개수만큼 코드 조각을 찍어내는 방식으로 만든 것 — 위 손으로 쓴 코드가 바로 그 결과물의 실체

## derive 매크로 심화 — GlueSQL #1975 작업에서 배운 것

`TranslateError`의 옵션 enum들(`InsertOption` 등)을 `#[derive(Display, Debug, Clone, Copy, Serialize, PartialEq, Eq)]`로 만들면서, 위 개념들만으로는 안 보이던 몇 가지가 실전에서 드러났다. (전체 구현 맥락은 [TranslateError Enum 타입화 노트](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/[Rust]%20TranslateError%20Enum%20%ED%83%80%EC%9E%85%ED%99%94(strum%C2%B7thiserror,%20GlueSQL%20Issue%201975)%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md) 참고)

### derive를 여러 개 나열하면 — 트레잇마다 독립적인 `impl` 블록이 따로 생김

```rust
#[derive(Display, Debug, Clone, Copy, Serialize, PartialEq, Eq)]
pub enum CreateTableOption { Temporary, Like, Clone }
```

`#[derive(A, B, C)]`는 "A, B, C 매크로를 각각 실행해서, **서로 독립적인** `impl` 블록을 하나씩 만들어라"는 뜻이다. `cargo expand`(별도 설치: `cargo install cargo-expand`)로 실제 생성된 코드를 보면:

```rust
// cargo expand -p gluesql-core translate::error 실제 출력 (일부)
impl ::core::fmt::Display for CreateTableOption {
    fn fmt(&self, f: &mut Formatter) -> Result<(), Error> {
        match *self {
            CreateTableOption::Temporary => f.pad("TEMPORARY clause"),
            // ...
        }
    }
}
impl ::core::fmt::Debug for CreateTableOption {
    fn fmt(&self, f: &mut Formatter) -> Result {
        f.write_str(match self {
            CreateTableOption::Temporary => "Temporary",   // ← variant 이름 그대로!
            // ...
        })
    }
}
```

`Display`는 strum이, `Debug`는 표준 라이브러리가 만드는데 **서로 완전히 별개의 코드**다. 이게 실전에서 버그로 이어졌다: `#[strum(to_string = "TEMPORARY clause")]`만 붙이고 `Serialize`도 derive했더니, `Serialize`는 `strum`의 attribute를 전혀 모르니 `Debug`와 똑같이 variant 이름 그대로(`"Temporary"`) JSON을 만들어버렸다. **"이 derive에 설정을 줬으니 다른 derive도 알겠지"는 틀린 가정** — 각 derive는 자기가 명시적으로 등록한 헬퍼 attribute(`#[strum(...)]`은 strum만, `#[serde(...)]`는 serde만)만 읽는다.

### `trait`/`impl`/`derive`를 Java로 옮기면

Java(특히 Lombok)를 알고 있다면 이렇게 대응된다:

| Java | Rust | 의미 |
|---|---|---|
| `interface Comparable<T> { int compareTo(T o); }` | `trait Display { fn fmt(...) -> Result; }` | 지켜야 할 계약(메서드 시그니처) |
| `class Foo implements Comparable<Foo> { ... }` | `impl Display for Foo { ... }` | 계약을 직접 구현 |
| `@EqualsAndHashCode` (Lombok) | `#[derive(PartialEq)]` | "본문은 내가 안 쓸 테니 자동 생성기가 써줘" |
| Lombok 어노테이션 프로세서가 컴파일 시점에 `.class`에 메서드 삽입 | derive 매크로가 컴파일 시점에 `impl` 블록 삽입 | 코드 생성 메커니즘 자체가 유사 |

차이점: Java는 `implements`를 클래스 선언 시점에 같이 써야 하지만, Rust는 `impl Trait for Type`을 **타입 선언과 완전히 분리된 곳**에, 심지어 다른 크레이트에서도 쓸 수 있다(단, 트레잇이나 타입 둘 중 하나는 내 크레이트 소유여야 하는 "orphan rule" 제약은 있음). 또 Java 인터페이스는 8버전부터 `default` 메서드로 기본 구현을 지원하는데, Rust `trait`는 처음부터 기본 구현을 지원했다.

### `thiserror`의 `#[error("{0}")]`가 필드 타입을 안 가리는 이유

```rust
#[error("unsupported INSERT option: {0}")]
UnsupportedInsertOption(InsertOption),   // 원래는 &'static str이었음
```

`#[derive(Error)]`가 생성하는 `Display::fmt`는 대략 `write!(f, "unsupported INSERT option: {}", self.0)`로 펼쳐진다. `{}`는 "`Display`를 구현한 아무 타입이나 받는다"는 뜻이라, 필드 타입을 `&'static str` → `InsertOption`으로 바꿔도(둘 다 `Display`를 구현하고 있으므로) `#[error(...)]` 쪽 코드는 한 글자도 안 고쳐도 됐다. 제네릭/트레잇 기반 다형성이 매크로가 생성한 코드에도 그대로 적용된 사례.

### 중복을 다시 줄인 커스텀 `macro_rules!` — Serialize를 Display에 위임

`#[serde(rename = "...")]`로 위 버그를 고치긴 했지만, 그럼 문자열을 `#[strum(to_string=...)]`/`#[serde(rename=...)]` **두 곳에 똑같이** 적어야 해서 또 다른 실수(하나만 고치고 하나는 까먹기) 여지가 남았다. 최종적으로는 `Serialize`를 derive하는 대신, `Display` 결과를 그대로 JSON 문자열로 쓰는 **직접 만든 `macro_rules!`**로 대체했다:

```rust
macro_rules! serialize_via_display {
    ($($ty:ty),+ $(,)?) => {
        $(impl Serialize for $ty {
            fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
                s.collect_str(self)   // Display가 만든 문자열을 그대로 JSON 문자열로
            }
        })+
    };
}
serialize_via_display!(CreateTableOption, InsertOption, /* ...나머지 5개 */);
```

이 매크로는 `macro_rules!`(선언적 매크로)라서 별도 크레이트가 필요 없고, 실제로 딱 이 파일(`error.rs`) 안에서만 쓰이므로 **다른 파일로 분리하지 않고 같은 파일에** 정의했다 — "여러 파일이 공유하는 매크로만 별도 파일로 뺀다"는 이 저장소의 관례(`core/src/data/value/binary_op/integer/macros.rs`가 그 예)와 일관됨. 이제 문자열은 `#[strum(to_string=...)]` 한 곳에만 존재한다.

## 🔗 참고

- [Rust 19장 - Macros](https://doc.rust-kr.org/ch19-06-macros.html)
- [GlueSQL - macros/src/lib.rs](https://github.com/gluesql/gluesql/blob/main/macros/src/lib.rs)
- [(Rust) GlueSQL 프로젝트 구조와 필요 문법 개관 - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/[Rust]%20GlueSQL%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20%EA%B5%AC%EC%A1%B0%EC%99%80%20%ED%95%84%EC%9A%94%20%EB%AC%B8%EB%B2%95%20%EA%B0%9C%EA%B4%80%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md)
- [(Rust) TranslateError Enum 타입화(strum·thiserror, GlueSQL Issue 1975) - 핵심 개념 및 특징 정리](../../../%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8/%EC%98%A4%ED%94%88%EC%86%8C%EC%8A%A4/GlueSQL/[Rust]%20TranslateError%20Enum%20%ED%83%80%EC%9E%85%ED%99%94(strum%C2%B7thiserror,%20GlueSQL%20Issue%201975)%20-%20%ED%95%B5%EC%8B%AC%20%EA%B0%9C%EB%85%90%20%EB%B0%8F%20%ED%8A%B9%EC%A7%95%20%EC%A0%95%EB%A6%AC.md) — 이 심화 내용의 실전 배경
- [(Rust) 에러 처리(thiserror, Result, ? 연산자) - 핵심 개념 및 특징 정리]([Rust]%20에러%20처리%28thiserror,%20Result,%20%EF%BC%9F%20연산자%29%20-%20핵심%20개념%20및%20특징%20정리.md)
