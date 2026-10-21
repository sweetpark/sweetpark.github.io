---
title: "SD17. 정수 오버플로우 — 연산 전 오버플로우 검사로 치환"
description: "시큐어코딩 SD17 정수 오버플로우 (CWE-190): 취약한 코드를 연산 전 오버플로우 검사 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD17. 정수 오버플로우 — 연산 전 오버플로우 검사로 치환

> **원본 항목**: [Part 1-4. 정수·타입변환 계열 — 17. 정수 오버플로우](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-4.%20정수·타입변환%20계열.md#17-정수-오버플로우-cwe-190) `CWE-190`
> **repo 폴더**: `sd17_intoverflow/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> 여기서부터(SD17~19)는 UBSan이 기본적으로 **"에러만 출력하고 계속 진행"** 한다는 걸 먼저 알아야 한다 — `expect_crash` 가 그래도 통하는 이유를 아래에서 확인한다.

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
- int total = count + RESERVE;
- return malloc((size_t)total * sizeof(int));            /* 오버플로우된 값을 그대로 할당 크기로 */
+ if (count < 0 || count > INT_MAX - RESERVE) return NULL;   /* 덧셈 전에 검사 */
+ int total = count + RESERVE;
+ if ((size_t)total > SIZE_MAX / sizeof(int)) return NULL;   /* 곱셈 전에 검사 */
+ return malloc((size_t)total * sizeof(int));
```

`malloc(n + reserve)` 나 `malloc(n * size)` 를 보면 오버플로우부터 의심한다.
검사는 계산 **"후"** 가 아니라 **"전"** 에 한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 예약 공간을 더한 정수 배열 할당 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 곱셈 오버플로우로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 뺄셈 오버플로우 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 예약 공간을 더한 정수 배열 할당

`count` 개의 int를 저장할 버퍼에 여유 공간(`RESERVE=8`)을 더해 할당한다.
- `count` 가 매우 커서 오버플로우가 나면 할당을 거부해야 한다.

**함수**

```c
void *int_alloc_bad(int count);
void *int_alloc_good(int count);
void use_buffer_bad(int count);
void *use_buffer_good(int count);
```

#### 공격 입력표

| `count` | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 10 (정상) | 정상 할당 | 오버플로우 없음 |
| `INT_MAX - 4` | **UBSan이 오버플로우를 리포트 → 결과값이 음수 → size_t 캐스팅으로 거대해짐 → ASan이 할당 요청을 거부하며 abort** | `count + RESERVE` 가 `INT_MAX` 를 넘는다 |

### 1-B. 변형 B — 곱셈 오버플로우로 변형

`malloc(n * elem_size)` 형태에서 `n`, `elem_size` 둘 다 외부에서 온다고 가정하고, `n > SIZE_MAX / elem_size` 형태의 나눗셈 사전 검사를 직접 짜본다

### 1-C. 변형 C — 뺄셈 오버플로우

`remaining = total - used` 형태에서 `used > total` 이면 결과가 큰 양수(부호 있는 경우 음수)가 되는 패턴을 다뤄본다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `int_alloc_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void *int_alloc_bad(int count)
{
    /* 1. int total = count + RESERVE   (RESERVE 8)
     * 2. return malloc((size_t)total * sizeof(int))   ← 오버플로우된 값을 그대로 */
}

void use_buffer_bad(int count)
{
    /* 1. buf = int_alloc_bad(count)
     * 2. buf[0] = 42   ← 반환값 검사 없음
     * 3. free(buf) */
}

void *int_alloc_good(int count)
{
    /* [ ] 1. 덧셈 전 검사
     *        count < 0 또는 count > INT_MAX - RESERVE → return NULL */

    /* [ ] 2. int total = count + RESERVE */

    /* [ ] 3. 곱셈 전 검사
     *        (size_t)total > SIZE_MAX / sizeof(int) → return NULL */

    /* [ ] 4. return malloc((size_t)total * sizeof(int)) */
}

void *use_buffer_good(int count)
{
    /* [ ] 1. buf = int_alloc_good(count)
     *        NULL 이면 → return NULL */

    /* [ ] 2. buf[0] = 42 */

    /* [ ] 3. return buf   (해제는 호출자) */
}
```

### 2-B. `int_alloc_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void *int_alloc_good(int count)
{
    /* [ ] 1. 덧셈 전 검사 */

    /* [ ] 2. int total = count + RESERVE */

    /* [ ] 3. 곱셈 전 검사 */

    /* [ ] 4. return malloc((size_t)total * sizeof(int)) */
}

void *use_buffer_good(int count)
{
    /* [ ] 1. buf = int_alloc_good(count) */

    /* [ ] 2. buf[0] = 42 */

    /* [ ] 3. return buf   (해제는 호출자) */
}
```

### 2-C. `int_alloc_good` — Level 3 (3회차, 백지)

```c
void *int_alloc_good(int count)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 검사는 계산 **전**에 한다 (`a > MAX - b` 꼴)
     *   - `INT_MAX` / `SIZE_MAX` 의 헤더 (`<limits.h>`, `<stdint.h>`)
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
sd17_intoverflow/src/int_alloc.h
sd17_intoverflow/src/int_alloc.c
sd17_intoverflow/test/test.c
```

> [!IMPORTANT] 시험 구조는 고정이다 (SD01~SD58 공통)
> 1. **Bad 가 실제로 뚫린다.**
>    이 시험이 실패하면 Bad 를 잘못 옮겨 적은 것이다.
> 2. **Bad 도 정상 입력은 처리한다.**
> 3. **Good 이 같은 공격을 막는다.**
> 4. **Good 이 정상 입력까지 막지 않는다.** (과잉 차단 없음)

### 3-0. UBSan은 기본적으로 "안 죽는다" — 그런데도 크래시가 나는 이유

```c
int x = INT_MAX;
int y = x + 1;    /* UBSan: "signed integer overflow" 리포트만 하고 y=-2147483648로 계속 진행, exit code 0 */
```

이 프로젝트 Makefile(`-fsanitize=address,undefined`)은 UBSan을 **recoverable 모드**로 켠다 — 위반을 만나도 리포트만 찍고 실행을 이어간다.
그런데 이 드릴의 Bad는 그 왜곡된 값을 **`malloc()` 크기로 그대로 사용**하기 때문에, UBSan이 봐주고 넘어간 값을 이번엔 **ASan이 잡는다**: 오버플로우로 음수가 된 `total` 을 `size_t` 로 캐스팅하면 거의 2^64에 가까운 값이 되고, ASan은 "이렇게 비정상적으로 큰 할당 요청"을 그 자체로 위반(`allocation-size-too-big`)으로 판정해 프로세스를 **abort** 시킨다.

> [!NOTE] 그래서 `expect_crash` 로 여전히 잡을 수 있다
> 정수 오버플로우 자체는 안 죽어도, **오버플로우된 값이 malloc/memcpy 크기로 흘러가는 다음 단계**에서 ASan이 대신 잡아준다.
> 이 연쇄(정수 오버플로우 → 크기·인덱스 오염 → 메모리 위반)가 바로 이 계열이 "코드 오류"가 아니라 "보안약점"으로 분류되는 이유다.

### 3-A. 변형 A 시험 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>
#include <sys/wait.h>
#include <unistd.h>
#include "int_alloc.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static int expect_crash(void (*fn)(void))
{
    pid_t pid = fork();
    if (pid == 0) { fn(); _exit(0); }
    int status = 0;
    waitpid(pid, &status, 0);
    if (WIFSIGNALED(status)) return 1;
    if (WIFEXITED(status) && WEXITSTATUS(status) != 0) return 1;
    return 0;
}

static int g_count;
static void call_bad(void) { use_buffer_bad(g_count); }

static void test_bad_is_vulnerable(void)
{
    g_count = INT_MAX - 4;
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 오버플로우로 할당이 실패해도 반환값을 안 보고 써서 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_count = 10;
    T_TRUE(expect_crash(call_bad) == 0, "정상 범위의 count는 크래시 없이 동작해야 한다");
}

static void test_good_blocks_overflow(void)
{
    T_TRUE(int_alloc_good(INT_MAX - 4) == NULL,
        "Good은 덧셈 전에 오버플로우를 검사해 NULL을 반환해야 한다");
}

static void test_good_normal(void)
{
    void *buf = use_buffer_good(10);
    T_TRUE(buf != NULL, "정상 범위는 성공해야 한다");
    free(buf);
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_overflow();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 곱셈 오버플로우로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `n * elem_size` 에서 `n > SIZE_MAX / elem_size` | 곱이 감겨 작은 할당 | NULL |
| 정상 크기 | 정상 | 정상 |

**변형 C — 뺄셈 오버플로우**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `remaining = total - used` 에서 `used > total` | 큰 양수로 감긴다 | 계산 전에 `used > total` 검사 → 거부 |
| `used <= total` | 정상 | 정상 |

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
make D=sd17_intoverflow V=main SRC="sd17_intoverflow/src/int_alloc.c sd17_intoverflow/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* UBSan 은 정수 오버플로우를 보고만 하고 계속 진행한다 (§1-0 참고).

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd17_intoverflow/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd17_intoverflow/src/int_alloc.c sd17_intoverflow/test/test.c \
>     -pthread -o build/sd17_intoverflow_main
> ./build/sd17_intoverflow_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `count + RESERVE > INT_MAX` 로 검사(오버플로우가 이미 일어난 후 비교) | 이 비교 자체가 이미 오버플로우된 값을 사용하는 UB다.<br>`count > INT_MAX - RESERVE` 처럼 **뺄셈으로 미리 뒤집어서** 오버플로우가 나기 전에 검사해야 한다 |
| 곱셈 오버플로우 검사를 빼먹고 덧셈만 막음 | `total` 이 안전해도 `total * sizeof(int)` 에서 또 오버플로우(혹은 극단적인 크기)가 날 수 있다.<br>나눗셈으로 사전 검사(`total > SIZE_MAX / sizeof(int)`) |
| Bad를 "정수 오버플로우 자체가 크래시"라고 오해 | 정수 오버플로우는 UBSan이 리포트만 하고 넘어간다.<br>**그 값이 메모리 크기·인덱스로 쓰일 때** 비로소 위험해진다는 연쇄를 이해해야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `int_alloc.h` / `int_alloc.c`
> **헤더 (`int_alloc.h`)**
> ```c
> #ifndef INT_ALLOC_H
> #define INT_ALLOC_H
> #include <stddef.h>
> void *int_alloc_bad(int count);
> void *int_alloc_good(int count);
> void use_buffer_bad(int count);
> void *use_buffer_good(int count);
> #endif
> ```
> **구현 (`int_alloc.c`)**
> ```c
> #include <stdlib.h>
> #include <limits.h>
> #include <stdint.h>
> #include "int_alloc.h"
>
> #define RESERVE 8
>
> void *int_alloc_bad(int count)
> {
>     int total = count + RESERVE;
>     return malloc((size_t)total * sizeof(int));
> }
>
> void use_buffer_bad(int count)
> {
>     int *buf = (int *)int_alloc_bad(count);
>     buf[0] = 42;               /* 반환값 검사 없음 */
>     free(buf);
> }
>
> void *int_alloc_good(int count)
> {
>     int total;
>     if (count < 0 || count > INT_MAX - RESERVE) return NULL;
>     total = count + RESERVE;
>     if ((size_t)total > SIZE_MAX / sizeof(int)) return NULL;
>     return malloc((size_t)total * sizeof(int));
> }
>
> void *use_buffer_good(int count)
> {
>     int *buf = (int *)int_alloc_good(count);
>     if (buf == NULL) return NULL;
>     buf[0] = 42;
>     return buf;
> }
> ```
>
> **눈여겨볼 점**: `int_alloc_good` 은 **두 번** 검사한다 — 덧셈 전 한 번, 곱셈 전 한 번.
> "정수 연산이 하나라도 있으면 그 연산 전에 검사"라는 원칙을 기계적으로 적용한 결과가 이 코드다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD16. 널 종료 문제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD16.%20널%20종료%20문제%20—%20길이%20명시%20복사와%20수동%20종료로%20치환.md)
- [다음: SD18. 의도하지 않은 부호 확장](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD18.%20의도하지%20않은%20부호%20확장%20—%20원본%20타입으로%20직접%20검사하도록%20치환.md)
- [[C] 개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md) — 5-2절: `calloc(count, sizeof(*item))`이 이 드릴의 곱셈 오버플로우 검사를 대신 해주는 이유
