---
title: "SD34. 취약한 암호화 적절하지 못한 RSA 패딩 — OAEP 패딩 강제로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD34. 취약한 암호화: 적절하지 못한 RSA 패딩 — OAEP 패딩 강제로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 15. 취약한 암호화: 적절하지 못한 RSA 패딩](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#15-취약한-암호화-적절하지-못한-rsa-패딩-cwe-325) `CWE-325`
> **repo 폴더**: `sd34_rsapad/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 8분 / 2회차 5분 / **3회차 3분**
> Part 2-3에서 SD30과 함께 가장 짧은 드릴 — enum 값 하나만 걸러내면 된다.
> 짧다고 가볍게 보지 말고, "왜 이 하나가 그렇게 치명적인가"를 설명할 수 있어야 통과다.

> [!NOTE] 이 드릴의 문서 구성 (SD01~SD58 공통)
> ① **요구사항서** — 어떤 코드가 뚫려 있고, 무엇을 만드나.
> ② **pseudo code 템플릿** — Bad 와 Good 의 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 공격은 막히고 정상은 통과해야 끝이다.
> ④ 자주 하는 실수
> ⑤ 모범답안 — 맨 뒤에 접어 둔다.
>
> 변형 A/B/C 는 **같은 치환 규칙을 다른 소재로 다시 치는 것**이다.

---

## 0. 이 드릴로 체화할 것

```diff
- int is_safe_padding_bad(padding_t p) { (void)p; return 1; }        /* PAD_NONE도 허용 */
+ int is_safe_padding_good(padding_t p) { return p != PAD_NONE; }     /* 패딩 없는 RSA만 거부 */
```

RSA는 "알고리즘"이 아니라 "알고리즘 + 패딩"이 한 세트다.
`NO_PADDING`은 사실상 암호화하지 않은 것과 같다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** RSA 패딩 모드 게이트 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 서명용 패딩 게이트 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 패딩 모드별 최소 RSA 키 길이까지 결합 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — RSA 패딩 모드 게이트

RSA 암호화에 사용할 패딩 모드를 검증한다.
- 패딩 없음(NO_PADDING)은 절대 허용하면 안 된다.
- OAEP, PKCS1 패딩은 허용한다.

**함수**

```c
int is_safe_padding_bad(padding_t p);
int is_safe_padding_good(padding_t p);
```

#### 공격 입력표

| 패딩 모드 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `PAD_OAEP` (정상) | 허용 | 안전한 패딩 |
| `PAD_NONE` | **허용됨(취약)** | 교과서적 RSA는 결정적이라 같은 평문이 같은 암호문을 만들고, 선택 암호문 공격에 취약하다 |

### 1-B. 변형 B — 서명용 패딩 게이트

암호화가 아니라 서명(PSS vs PKCS1v1.5)용 패딩 검증으로 변형

### 1-C. 변형 C — 패딩 모드별 최소 RSA 키 길이까지 결합

SD30(키 길이)과 결합해, "OAEP + 2048비트 이상"처럼 두 조건을 함께 검증하는 함수로 확장

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `is_safe_padding_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int is_safe_padding_bad(padding_t p)
{
    /* 1. (void)p
     * 2. return 1   ← PAD_NONE 도 허용 */
}

int is_safe_padding_good(padding_t p)
{
    /* [ ] 1. return p != PAD_NONE
     *        위험한 값 **하나**만 거른다 */
}
```

### 2-B. `is_safe_padding_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int is_safe_padding_good(padding_t p)
{
    /* [ ] 1. return p != PAD_NONE */
}
```

### 2-C. `is_safe_padding_good` — Level 3 (3회차, 백지)

```c
int is_safe_padding_good(padding_t p)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `PAD_NONE` 은 암호화하지 않은 것과 같다
     *   - 열거형 정의 (`typedef enum { PAD_NONE, PAD_OAEP, PAD_PKCS1 }`)
     */
}
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 를 연다.
>    SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 로직이 막히면 **§3 테스트의 기대값**을 먼저 읽는다.
>    공격 입력표(§1)와 테스트가 답이다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
sd34_rsapad/src/padding_check.h
sd34_rsapad/src/padding_check.c
sd34_rsapad/test/test.c
```

> [!IMPORTANT] 시험 구조는 고정이다 (SD01~SD58 공통)
> 1. **Bad 가 실제로 뚫린다.**
>    이 시험이 실패하면 Bad 를 잘못 옮겨 적은 것이다.
> 2. **Bad 도 정상 입력은 처리한다.**
> 3. **Good 이 같은 공격을 막는다.**
> 4. **Good 이 정상 입력까지 막지 않는다.** (과잉 차단 없음)

### 3-A. 변형 A 시험 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "padding_check.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(is_safe_padding_bad(PAD_NONE) == 1,
        "Bad는 패딩 없는(NO_PADDING) RSA도 그대로 허용해야 한다(취약점 재현)");
}

static void test_good_blocks_no_padding(void)
{
    T_TRUE(is_safe_padding_good(PAD_NONE) == 0, "Good은 패딩 없는 RSA를 거부해야 한다");
}

static void test_good_allows_safe_padding(void)
{
    T_TRUE(is_safe_padding_good(PAD_OAEP) == 1, "Good은 OAEP 패딩을 허용해야 한다");
    T_TRUE(is_safe_padding_good(PAD_PKCS1) == 1, "Good은 PKCS1 패딩도 허용해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_no_padding();
    test_good_allows_safe_padding();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 서명용 패딩 게이트**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 서명용 `PSS` / `PKCS1v1.5` | 모두 허용 | 서명 패딩 목록 기준으로 판정 |
| `PAD_NONE` | 허용 | 거부 |

**변형 C — 패딩 모드별 최소 RSA 키 길이까지 결합**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| OAEP + 1024 비트 | 허용 | 거부 (키 길이 미달) |
| OAEP + 2048 비트 | 허용 | 허용 |

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [템플릿 체화 드릴 README](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 와 **같은 파일**이다.
recipe 줄은 **반드시 탭**으로 들여쓴다.

> [!example]- 공통 Makefile (gcc)
> ```makefile
> # ~/cdrill/Makefile  (템플릿 체화 드릴과 같은 파일)
> # 사용법:  make D=sd01_sqli V=main SRC="common/mock_db.c sd01_sqli/src/sql_auth.c sd01_sqli/test/test.c"
> CC       := gcc
> CFLAGS   := -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST -Icommon -I$(D)/src
> SAN      := -fsanitize=address,undefined -fno-omit-frame-pointer
> LDLIBS   ?= -pthread
>
> D        ?= d1_pure
> V        ?= main
> SRC      ?= $(D)/src/$(V).c $(D)/test/test_$(V).c
> BIN      := build/$(D)_$(V)
>
> all: run
>
> build:
> 	@mkdir -p build
>
> $(BIN): build $(SRC)
> 	$(CC) $(CFLAGS) $(SAN) $(SRC) $(LDLIBS) -o $(BIN)
>
> run: $(BIN)
> 	@echo "── run ──────────────────────────────"
> 	@./$(BIN)
>
> check: $(BIN)
> 	@./$(BIN) && echo "PASS" || (echo "FAIL"; exit 1)
>
> clean:
> 	rm -rf build
>
> .PHONY: all run check clean build
> ```

실행 명령이다.

```bash
make D=sd34_rsapad V=main SRC="sd34_rsapad/src/padding_check.c sd34_rsapad/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd34_rsapad/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd34_rsapad/src/padding_check.c sd34_rsapad/test/test.c \
>     -pthread -o build/sd34_rsapad_main
> ./build/sd34_rsapad_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `p == PAD_OAEP` 로만 허용(화이트리스트가 너무 좁음) | PKCS1도 안전한 패딩이다.<br>"안전하지 않은 것만 콕 집어 거부"가 이 항목의 요구사항이다 — 안전한 옵션이 늘어나도 코드를 안 고쳐도 되게 설계한다 |
| enum 대신 문자열로 패딩을 표현해서 오타에 취약 | `padding_t` 처럼 enum을 쓰면 컴파일러가 오타를 잡아준다.<br>이런 유한한 선택지는 문자열보다 enum이 안전하다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `padding_check.h` / `padding_check.c`
> ```c
> #ifndef PADDING_CHECK_H
> #define PADDING_CHECK_H
> typedef enum { PAD_NONE, PAD_OAEP, PAD_PKCS1 } padding_t;
> int is_safe_padding_bad(padding_t p);
> int is_safe_padding_good(padding_t p);
> #endif
> ```
> ```c
> #include "padding_check.h"
>
> int is_safe_padding_bad(padding_t p) { (void)p; return 1; }
> int is_safe_padding_good(padding_t p) { return p != PAD_NONE; }
> ```
>
> **눈여겨볼 점**: `is_safe_padding_good` 은 "안전한 것 목록"이 아니라 **"위험한 것 하나"** 만 걸러낸다.
> 안전한 패딩 옵션이 표준에 추가되어도(예: 미래의 새 패딩 방식) 이 코드는 고칠 필요가 없다 — 위험 요소가 단 하나뿐이라는 걸 알 때는 화이트리스트보다 이 방식이 더 유지보수하기 쉽다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD33. 솔트 없는 일방향 해쉬](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD33.%20솔트%20없이%20일방향%20해쉬%20함수%20사용%20—%20사용자별%20난수%20솔트로%20치환.md)
- [다음: SD35. 하드코드된 솔트](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD35.%20취약한%20암호화%20해쉬함수%20하드코드된%20솔트%20—%20호출마다%20새%20솔트로%20치환.md)
