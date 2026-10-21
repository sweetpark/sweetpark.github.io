---
title: "SD02. 자원 삽입 — 화이트리스트 범위 검사로 치환"
description: "시큐어코딩 SD02 자원 삽입 (CWE-99): 취약한 코드를 화이트리스트 범위 검사 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD02. 자원 삽입 — 화이트리스트 범위 검사로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 2. 자원 삽입](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#2-자원-삽입-cwe-99) `CWE-99`
> **repo 폴더**: `sd02_resinj/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> 이 항목은 mock이 필요 없다 — 소켓을 실제로 열지 않고 "포트 번호를 결정하는 함수"만 떼어서 검증한다.

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
- return atoi(env_val);                              /* 검증 없이 그대로 포트로 사용 */
+ int port = atoi(env_val);
+ if (port < PORT_MIN || port > PORT_MAX) return PORT_DEFAULT;  /* 범위 밖이면 기본값 */
+ return port;
```

자원 식별자(포트·파일명·핸들)는 "값"으로 받지 말고 "허용된 범위/목록 안의 값인가"로 받는다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 서비스 포트 결정 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 로그 레벨 결정 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 워커 스레드 수 결정 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 서비스 포트 결정

환경변수 문자열(`env_val`)을 받아 서비스가 리슨할 포트 번호를 결정한다.
- 허용 포트는 `3000`~`3003` 4개뿐이다.
- 범위를 벗어나면 기본값 `3000` 을 쓴다(연결 실패 대신 안전한 기본값으로 대체).

**함수**

```c
int parse_port_bad(const char *env_val);
int parse_port_good(const char *env_val);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `env_val` | 외부(환경변수) | 소켓 `bind()` 포트 인자 |

#### 공격 입력표

| 입력 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `"3002"` (정상) | 3002 | 정상 동작 |
| `"22"` | **22** | SSH 등 다른 서비스 포트를 그대로 점유하려 든다 |
| `"99999"` | **99999** | `uint16_t` 범위(0~65535)를 넘어 소켓 바인딩 시 오동작·크래시 소지 |

### 1-B. 변형 B — 로그 레벨 결정

환경변수로 로그 레벨 문자열(`"debug"`,`"info"`,`"error"` 등)을 받되, 화이트리스트에 없으면 `"info"` 로 강제.
값 자체가 아니라 "허용된 문자열 집합"으로 판단하는 연습

### 1-C. 변형 C — 워커 스레드 수 결정

환경변수 정수값이 `1~16` 범위 밖이면 기본값 `4` 로 대체.
정수 파싱 실패(`atoi` 가 0을 반환하는 비정상 문자열)까지 구분해서 처리

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `parse_port_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int parse_port_bad(const char *env_val)
{
    /* 1. return atoi(env_val)   ← 범위 검사 없음 */
}

int parse_port_good(const char *env_val)
{
    /* [ ] 1. 상수
     *        PORT_MIN 3000, PORT_MAX 3003, PORT_DEFAULT 3000 */

    /* [ ] 2. int port = atoi(env_val) */

    /* [ ] 3. 범위 검사
     *        port < PORT_MIN 또는 port > PORT_MAX
     *            → return PORT_DEFAULT  (실패 대신 안전한 기본값) */

    /* [ ] 4. return port */
}
```

### 2-B. `parse_port_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int parse_port_good(const char *env_val)
{
    /* [ ] 1. 상수 */

    /* [ ] 2. int port = atoi(env_val) */

    /* [ ] 3. 범위 검사 */

    /* [ ] 4. return port */
}
```

### 2-C. `parse_port_good` — Level 3 (3회차, 백지)

```c
int parse_port_good(const char *env_val)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `atoi` 의 헤더 (`<stdlib.h>`)
     *   - 하한·상한을 **둘 다** 검사
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
sd02_resinj/src/port_guard.h
sd02_resinj/src/port_guard.c
sd02_resinj/test/test.c
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
#include "port_guard.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_accepts_dangerous_port(void)
{
    T_TRUE(parse_port_bad("22") == 22, "Bad는 SSH 포트도 그대로 받아들여야 한다(취약점 재현)");
    T_TRUE(parse_port_bad("99999") == 99999, "Bad는 유효 범위 밖 포트도 그대로 반환");
}

static void test_bad_normal(void)
{
    T_TRUE(parse_port_bad("3002") == 3002, "정상 포트는 그대로 반환");
}

static void test_good_rejects_out_of_range(void)
{
    T_TRUE(parse_port_good("22") == 3000, "Good은 범위 밖이면 기본값(3000)으로 대체");
    T_TRUE(parse_port_good("99999") == 3000, "Good은 65535 초과도 기본값으로 대체");
}

static void test_good_allows_normal(void)
{
    T_TRUE(parse_port_good("3002") == 3002, "Good도 허용 범위 안 값은 그대로 통과");
}

int main(void)
{
    test_bad_accepts_dangerous_port();
    test_bad_normal();
    test_good_rejects_out_of_range();
    test_good_allows_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 로그 레벨 결정**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `"trace"` (화이트리스트에 없음) | 그대로 사용 | `"info"` 로 강제 |
| `"debug"` | `"debug"` | `"debug"` |

**변형 C — 워커 스레드 수 결정**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `"0"` / `"abc"` (파싱 실패) | 0 이 그대로 나온다 | 기본값 `4` |
| `"8"` | 8 | 8 |

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
make D=sd02_resinj V=main SRC="sd02_resinj/src/port_guard.c sd02_resinj/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd02_resinj/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd02_resinj/src/port_guard.c sd02_resinj/test/test.c \
>     -pthread -o build/sd02_resinj_main
> ./build/sd02_resinj_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 상한만 검사하고 하한(음수)은 빼먹음 | `atoi("-1")` 은 `-1` 을 반환한다.<br>포트로 쓰이면 정수 변환 시 예기치 않은 값이 된다 |
| 기본값을 범위 밖 값(예: `0`)으로 잡음 | "안전한 기본값"이 아니라 새로운 결함이 된다 |
| `atoi` 실패(비숫자 문자열)와 "범위 밖"을 구분하지 않음 | 변형 C에서는 이 둘을 구분해야 한다 — `atoi("abc")` 는 `0` 을 반환하므로 "파싱 실패"인지 "값이 0"인지 알 수 없다(`strtol` + `endptr` 검사로 개선 가능) |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `port_guard.h` / `port_guard.c`
> **헤더 (`port_guard.h`)**
> ```c
> #ifndef PORT_GUARD_H
> #define PORT_GUARD_H
> int parse_port_bad(const char *env_val);
> int parse_port_good(const char *env_val);
> #endif
> ```
> **구현 (`port_guard.c`)**
> ```c
> #include <stdlib.h>
> #include "port_guard.h"
>
> #define PORT_MIN     3000
> #define PORT_MAX     3003
> #define PORT_DEFAULT 3000
>
> int parse_port_bad(const char *env_val)
> {
>     return atoi(env_val);
> }
>
> int parse_port_good(const char *env_val)
> {
>     int port = atoi(env_val);
>     if (port < PORT_MIN || port > PORT_MAX) return PORT_DEFAULT;
>     return port;
> }
> ```
>
> **눈여겨볼 점**: 검증 로직이 `parse_port_bad` 안에는 아예 없다 — "검증을 깜빡한 것"이 아니라 "검증이라는 단계 자체가 빠진 것"이다.
> 이 항목의 치환은 코드를 고치는 게 아니라 **단계를 추가하는 것**이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD01. SQL 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD01.%20SQL%20삽입%20—%20인자화된%20질의문으로%20치환.md)
- [다음: SD03. 크로스사이트 스크립트](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD03.%20크로스사이트%20스크립트%20—%20출력%20직전%20HTML%20이스케이프로%20치환.md)
