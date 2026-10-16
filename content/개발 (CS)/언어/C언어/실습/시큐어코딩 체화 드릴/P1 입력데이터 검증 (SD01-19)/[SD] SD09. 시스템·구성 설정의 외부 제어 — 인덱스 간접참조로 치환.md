---
title: "SD09. 시스템 또는 구성 설정의 외부 제어 — 인덱스 간접참조로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD09. 시스템 또는 구성 설정의 외부 제어 — 인덱스 간접참조로 치환

> **원본 항목**: [Part 1-2. 외부제어·우회 계열 — 9. 시스템 또는 구성 설정의 외부 제어](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-2.%20외부제어·우회%20계열.md#9-시스템-또는-구성-설정의-외부-제어-cwe-15) `CWE-15`
> **repo 폴더**: `sd09_sysconfig/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> mock 불필요 — "설정값을 결정하는 함수"만 떼어서 검증한다.
> SD02(자원 삽입)와 자매 항목이지만 치환 방식이 다르다는 걸 확인한다.

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
- return atoi(portStr);                              /* 외부 문자열을 그대로 설정값으로 */
+ if (index < 0 || index >= PORT_TABLE_SIZE) return -1;
+ return PORT_TABLE[index];                            /* 외부에서는 "인덱스"만 받는다 */
```

SD02가 "범위 검사"였다면 이 항목은 **"값 자체를 아예 외부에서 못 받게" 하는 간접 참조(indirection)** 다 — 외부는 `0`, `1`, `2` 같은 선택지 번호만 알고, 실제 값(포트 21, 2121, 8021)은 내부 테이블에만 존재한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** FTP 서비스 포트 결정 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 호스트 ID 설정 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 테이블 크기를 런타임에 바꿔야 하는 상황 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — FTP 서비스 포트 결정

서비스가 사용할 FTP 포트를 결정한다.
- 허용되는 포트는 미리 정의한 3개(기본 `21`, 대체1 `2121`, 대체2 `8021`)뿐이다.
- 외부에서는 "몇 번째 대체 포트를 쓸지" 인덱스만 전달받아야 한다.

**함수**

```c
int resolve_service_port_bad(const char *portStr);
int resolve_service_port_good(int index);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `portStr` | 외부(명령줄 인자/설정 요청) | 서비스 포트 설정값 |

#### 공격 입력표

| 입력 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `"21"` (정상) | 21 | 정상 동작 |
| `"22"` | **22** | SSH 등 이미 쓰이는 포트와 충돌시켜 서비스 거부(DoS)를 유발할 수 있다 |
| `"0"` | **0** | 예약 포트(0)를 그대로 받아 시스템이 예기치 않게 동작할 수 있다 |

### 1-B. 변형 B — 호스트 ID 설정

PDF 원문의 `sethostid()` 사례처럼, 문자열이 아니라 정수 하나를 통째로 시스템 설정 함수에 넘기는 대신 미리 정의한 상수(`0xC0A80101` 등) 중 하나를 인덱스로 선택하도록 변경

### 1-C. 변형 C — 테이블 크기를 런타임에 바꿔야 하는 상황

포트 후보가 설정 파일에서 동적으로 로드되는 경우, "로드된 테이블도 여전히 서버 내부 자원이고 외부는 인덱스만 받는다"는 원칙이 유지되는지 확인

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `resolve_service_port_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int resolve_service_port_bad(const char *portStr)
{
    /* 1. return atoi(portStr)   ← 외부 문자열이 그대로 설정값 */
}

int resolve_service_port_good(int index)
{
    /* [ ] 1. 내부 테이블
     *        PORT_TABLE[] = { 21, 2121, 8021 }
     *        PORT_TABLE_SIZE = sizeof 로 계산 */

    /* [ ] 2. 인덱스 범위 검사
     *        index < 0 또는 (size_t)index >= PORT_TABLE_SIZE → return -1 */

    /* [ ] 3. return PORT_TABLE[index] */
}
```

### 2-B. `resolve_service_port_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int resolve_service_port_good(int index)
{
    /* [ ] 1. 내부 테이블 */

    /* [ ] 2. 인덱스 범위 검사 */

    /* [ ] 3. return PORT_TABLE[index] */
}
```

### 2-C. `resolve_service_port_good` — Level 3 (3회차, 백지)

```c
int resolve_service_port_good(int index)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `size_t` 와 `int` 비교 시 캐스팅
     *   - 하한(`< 0`) 검사
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
sd09_sysconfig/src/service_port.h
sd09_sysconfig/src/service_port.c
sd09_sysconfig/test/test.c
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
#include "service_port.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(resolve_service_port_bad("22") == 22,
        "Bad는 외부 입력을 그대로 서비스 포트로 써서 임의 포트를 지정할 수 있어야 한다(취약점 재현)");
    T_TRUE(resolve_service_port_bad("0") == 0, "0번 포트 같은 비정상 값도 그대로 통과");
}

static void test_bad_normal(void)
{
    T_TRUE(resolve_service_port_bad("21") == 21, "정상 포트 문자열도 그대로 반환");
}

static void test_good_blocks_arbitrary_value(void)
{
    T_TRUE(resolve_service_port_good(99) == -1, "Good은 범위 밖 인덱스를 거부해야 한다");
    T_TRUE(resolve_service_port_good(-5) == -1, "음수 인덱스도 거부");
}

static void test_good_normal(void)
{
    T_TRUE(resolve_service_port_good(0) == 21, "인덱스 0은 기본 포트(21)");
    T_TRUE(resolve_service_port_good(1) == 2121, "인덱스 1은 대체 포트(2121)");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_arbitrary_value();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 호스트 ID 설정**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 호스트 ID `0xDEADBEEF` 를 직접 전달 | 그대로 `sethostid` | 상수 후보 중 인덱스만 받음 → 범위 밖 거부 |
| `index = 0` | 정상 | 정상 |

**변형 C — 테이블 크기를 런타임에 바꿔야 하는 상황**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 로드된 테이블 크기 밖의 `index` | 범위 밖 읽기 | -1 |
| `index = size - 1` | 정상 | 정상 |

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
make D=sd09_sysconfig V=main SRC="sd09_sysconfig/src/service_port.c sd09_sysconfig/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd09_sysconfig/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd09_sysconfig/src/service_port.c sd09_sysconfig/test/test.c \
>     -pthread -o build/sd09_sysconfig_main
> ./build/sd09_sysconfig_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `resolve_service_port_good` 도 문자열을 받아서 내부에서 `atoi` 후 범위 검사 | SD02와 똑같은 해법이 되어버린다 — 이 항목의 핵심(값 자체를 안 받는 것)을 놓친 것 |
| 테이블 인덱스 범위 검사에서 상한만 확인하고 음수는 빼먹음 | `index`가 `int` 이므로 음수가 들어올 수 있다.<br>`(size_t)index >= SIZE` 로 캐스팅 비교 시 음수가 거대한 값으로 바뀌어 우연히 막히는 경우와, 하한을 명시적으로 검사하는 경우를 구분해서 이해할 것 |
| 테이블에 없는 값을 반환할 때 `0`을 리턴 | 포트 `0`은 그 자체로 유효하지 않은 값일 수 있다 — 에러를 알리는 값(`-1`)과 정상 값(`0`)이 겹치지 않게 설계 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `service_port.h` / `service_port.c`
> **헤더 (`service_port.h`)**
> ```c
> #ifndef SERVICE_PORT_H
> #define SERVICE_PORT_H
> int resolve_service_port_bad(const char *portStr);
> int resolve_service_port_good(int index);
> #endif
> ```
> **구현 (`service_port.c`)**
> ```c
> #include <stdlib.h>
> #include "service_port.h"
>
> int resolve_service_port_bad(const char *portStr)
> {
>     return atoi(portStr);
> }
>
> static const int PORT_TABLE[] = { 21, 2121, 8021 };  /* DEFAULT, ALT1, ALT2 */
> #define PORT_TABLE_SIZE (sizeof(PORT_TABLE)/sizeof(PORT_TABLE[0]))
>
> int resolve_service_port_good(int index)
> {
>     if (index < 0 || (size_t)index >= PORT_TABLE_SIZE) return -1;
>     return PORT_TABLE[index];
> }
> ```
>
> **눈여겨볼 점**: `resolve_service_port_bad` 와 `resolve_service_port_good` 은 **매개변수 타입 자체가 다르다**(`const char *` vs `int`).
> SD08과 마찬가지로, 이 항목의 방어는 "검증 로직 추가"가 아니라 "함수가 받아들이는 정보의 종류를 바꾸는 것"이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD08. 보호 메커니즘 우회 가능한 입력값 변조](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD08.%20보호%20메커니즘%20우회%20가능한%20입력값%20변조%20—%20세션ID만%20신뢰하도록%20치환.md)
- [다음: SD10. 프로세스 제어](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD10.%20프로세스%20제어%20—%20허용%20명령%20매핑으로%20치환.md)
