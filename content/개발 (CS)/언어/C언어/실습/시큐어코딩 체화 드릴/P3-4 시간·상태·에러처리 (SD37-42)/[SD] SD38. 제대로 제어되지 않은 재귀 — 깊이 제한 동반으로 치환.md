---
title: "SD38. 제대로 제어되지 않은 재귀 — 깊이 제한 동반으로 치환"
description: "시큐어코딩 SD38 제대로 제어되지 않은 재귀 (CWE-674): 취약한 코드를 깊이 제한 동반 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD38. 제대로 제어되지 않은 재귀 — 깊이 제한 동반으로 치환

> **원본 항목**: [Part 3. 시간 및 상태 — 2. 제대로 제어되지 않은 재귀](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%203.%20시간%20및%20상태.md#2-제대로-제어되지-않은-재귀-cwe-674) `CWE-674`
> **repo 폴더**: `sd38_recursion/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> `expect_crash`([SD11](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD11.%20스택%20버퍼%20오버플로우%20—%20길이%20검사%20후%20strncpy로%20치환.md)에서 확립)를 재사용해 "종료 조건 없는 재귀가 실제로 스택을 고갈시켜 죽는다"를 증명하고, Good은 base case와 깊이 제한을 **모두** 가져야 함을 확인한다.

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
- long fac_bad(int n)
- {
-     return n * fac_bad(n - 1);          /* 종료 조건이 없어 무한 재귀 -> 스택 고갈 */
- }
+ if (depth > MAX_DEPTH) return 실패;      /* 깊이 제한 */
+ if (n <= 0) return 1;                     /* 종료 조건(base case) */
+ return n * fac_good_impl(n - 1, depth + 1, ...);
```

재귀에는 "언제 멈추는가"(base case)와 "얼마나 깊어질 수 있는가"(깊이 제한) 두 가지 통제가 **모두** 있어야 한다.
하나만 있으면 나머지 하나가 뚫린다 — base case만 있으면 정상 입력에서는 멈추지만 비정상적으로 깊은 입력에는 여전히 취약하고, 깊이 제한만 있으면 원래 있어야 할 종료 로직 자체가 없다는 설계 결함이 남는다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 계승(factorial) 계산 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** JSON/트리 구조 재귀 파서로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 꼬리 재귀를 반복문으로 전환 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 계승(factorial) 계산

정수 `n`의 계승을 재귀로 계산한다.
- 비정상적으로 큰 `n`이 들어와도 프로세스가 죽어서는 안 된다.
- 실패는 반드시 호출자에게 알려야 한다.

**함수**

```c
long fac_bad(int n);
int fac_good(int n, long *out);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `n` | 외부 입력(요청 파라미터) | 재귀 호출 깊이를 그대로 결정 |

#### 공격 입력표

| 입력(`n`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 아무 값이나(종료 조건 자체가 없음) | **스택 오버플로우로 프로세스 크래시**(`expect_crash`가 감지) | `n`이 계속 감소해 음수로 끝없이 내려가도 멈출 조건이 코드에 없다 |
| `n = 100000`(Good) | **정상적으로 `-1` 반환**(크래시 없음) | 깊이 제한(`MAX_DEPTH`)에 도달하면 재귀를 스스로 멈추고 실패를 호출자에게 알린다 |
| `n = 5`(Good) | `120` | 정상 범위는 base case로 정확히 종료 |

### 1-B. 변형 B — JSON/트리 구조 재귀 파서로 변형

중첩 객체를 재귀로 파싱하는 함수로 바꿔, "입력이 만드는 중첩 깊이"가 곧 재귀 깊이가 되는 실전 시나리오를 체감한다(실제로 여러 JSON 파서 CVE가 이 패턴이다)

### 1-C. 변형 C — 꼬리 재귀를 반복문으로 전환

같은 계승 계산을 `while` 루프로 바꿔, 애초에 재귀를 쓰지 않으면 이 취약점 계열 자체가 성립하지 않는다는 걸 구조로 증명한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `fac_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
long fac_bad(int n)
{
    /* 1. return n * fac_bad(n - 1)   ← 종료 조건이 없다 → 스택 고갈
     *    (gcc 경고는 pragma 로 끈다, §3 의 WARNING 참고) */
}

int fac_good(int n, long *out)
{
    /* [ ] 1. fac_good_impl(n, depth, &ok) 를 먼저 만든다
     *        depth > MAX_DEPTH (10000)  → *ok = 0, return 0      ← 깊이 제한
     *        n <= 0                     → *ok = 1, return 1      ← 종료 조건(base case)
     *        그 외                      → inner_ok 를 둔 채 fac_good_impl(n - 1, depth + 1, &inner_ok)
     *                                     inner_ok 가 0 이면 *ok = 0, return 0
     *                                     아니면 *ok = 1, return n * r */

    /* [ ] 2. 바깥 함수
     *        r = fac_good_impl(n, 0, &ok)    ← depth 는 전역이 아니라 **인자**
     *        !ok 이면 → return -1 */

    /* [ ] 3. *out = r, return 0 */
}
```

### 2-B. `fac_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int fac_good(int n, long *out)
{
    /* [ ] 1. fac_good_impl(n, depth, &ok) 를 먼저 만든다 */

    /* [ ] 2. 바깥 함수 */

    /* [ ] 3. *out = r, return 0 */
}
```

### 2-C. `fac_good` — Level 3 (3회차, 백지)

```c
int fac_good(int n, long *out)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 깊이 제한과 종료 조건은 **둘 다** 있어야 한다
     *   - 깊이는 전역 변수가 아니라 매개변수로 (재진입 안전)
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
sd38_recursion/src/recur.h
sd38_recursion/src/recur.c
sd38_recursion/test/test.c
```

> [!IMPORTANT] 시험 구조는 고정이다 (SD01~SD58 공통)
> 1. **Bad 가 실제로 뚫린다.**
>    이 시험이 실패하면 Bad 를 잘못 옮겨 적은 것이다.
> 2. **Bad 도 정상 입력은 처리한다.**
> 3. **Good 이 같은 공격을 막는다.**
> 4. **Good 이 정상 입력까지 막지 않는다.** (과잉 차단 없음)

### 3-A. 변형 A 시험 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>
#include "recur.h"

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

static void call_bad(void) { (void)fac_bad(5); }

static void test_bad_is_vulnerable(void)
{
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 종료 조건이 없어 스택이 고갈될 때까지 재귀하다가 크래시해야 한다(취약점 재현)");
}

static void test_good_normal(void)
{
    long out = 0;
    T_TRUE(fac_good(5, &out) == 0, "정상 범위(n=5)는 성공해야 한다");
    T_TRUE(out == 120, "5! = 120 이어야 한다");
}

static void test_good_blocks_deep_recursion(void)
{
    long out = 0;
    T_TRUE(fac_good(100000, &out) == -1,
        "Good은 깊이 제한을 넘으면 크래시 대신 통제된 실패(-1)를 반환해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_normal();
    test_good_blocks_deep_recursion();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!WARNING] `fac_bad`를 그대로 타이핑하면 컴파일이 안 될 수 있다
> `return n * fac_bad(n - 1);` 한 줄짜리 무조건 재귀는 gcc 12 이상에서 `-Winfinite-recursion` 으로 **컴파일 타임에 잡힌다.**
> 이 프로젝트는 `-Werror` 라 경고가 곧 빌드 실패다.
> 원래 버그(종료 조건 없음)는 그대로 두고, 함수 앞뒤를 `#pragma GCC diagnostic push` / `ignored "-Winfinite-recursion"` / `pop` 으로 감싸 "알고 있는, 의도적으로 재현한 취약 코드"라고 컴파일러에 알린다.
> 구버전 gcc 는 이 경고 이름을 몰라서 `-Wpragmas` 가 뜨므로 그 경고도 같은 구간에서 함께 끈다.
> **컴파일러 경고를 끄는 것과 버그를 고치는 것은 다르다.**
> 실무에서 이런 pragma 를 남발하면 진짜 실수도 함께 숨어버리니, 이 드릴처럼 "의도적 재현"이 명확한 경우로 한정한다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — JSON/트리 구조 재귀 파서로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 깊게 중첩된 JSON/트리 입력 | 재귀가 입력 깊이만큼 깊어져 스택 고갈 | 깊이 한도 초과 시 파싱 실패 |
| 얕은 입력 | 정상 | 정상 |

**변형 C — 꼬리 재귀를 반복문으로 전환**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `while` 루프로 바꾼 계승 | 재귀가 없어 성립하지 않는다 | 같은 결과 (재귀 없음) |
| `n = 5` | 120 | 120 |

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
make D=sd38_recursion V=main SRC="sd38_recursion/src/recur.c sd38_recursion/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd38_recursion/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd38_recursion/src/recur.c sd38_recursion/test/test.c \
>     -pthread -o build/sd38_recursion_main
> ./build/sd38_recursion_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 깊이 제한만 걸고 base case(`n <= 0`)를 빼먹음 | 정상 입력에서도 항상 `MAX_DEPTH`까지 다 내려갔다가 실패로 끝난다 — 정상 동작 자체가 망가진다 |
| 깊이 제한 도달 시 `exit(1)`로 프로세스 전체를 종료 | 가이드 원문은 `exit(1)`을 쓰지만, 서버 프로세스에서 이 함수 하나 때문에 프로세스 전체가 죽으면 다른 요청까지 함께 죽는다(그 자체로 DoS).<br>이 드릴에서는 **호출자에게 실패를 반환**하도록 바꿔, 장애를 그 함수 호출 하나로 국한시킨다 |
| `MAX_DEPTH`를 스택 크기 대비 너무 크게 잡음 | 깊이 제한이 있어도 그 값이 실제 스택이 감당하기엔 이미 너무 큰 값이면 제한이 걸리기도 전에 크래시가 먼저 날 수 있다.<br>여유를 넉넉히 두고 잡아야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `recur.h` / `recur.c`
> ```c
> #ifndef RECUR_H
> #define RECUR_H
> long fac_bad(int n);
> int fac_good(int n, long *out);
> #endif
> ```
> ```c
> #include "recur.h"
>
> #define MAX_DEPTH 10000
>
> #pragma GCC diagnostic push
> #pragma GCC diagnostic ignored "-Wpragmas"
> #pragma GCC diagnostic ignored "-Winfinite-recursion"
> long fac_bad(int n)
> {
>     return n * fac_bad(n - 1);      /* 종료 조건이 없어 무한 재귀 -> 스택 고갈 */
> }
> #pragma GCC diagnostic pop
>
> static long fac_good_impl(int n, int depth, int *ok)
> {
>     if (depth > MAX_DEPTH) { *ok = 0; return 0; }
>     if (n <= 0) { *ok = 1; return 1; }
>     {
>         int inner_ok = 0;
>         long r = fac_good_impl(n - 1, depth + 1, &inner_ok);
>         *ok = inner_ok;
>         if (!inner_ok) return 0;
>         return n * r;
>     }
> }
>
> int fac_good(int n, long *out)
> {
>     int ok = 0;
>     long r = fac_good_impl(n, 0, &ok);
>     if (!ok) return -1;
>     *out = r;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `fac_good_impl`은 매개변수로 `depth`를 **값으로 전달**한다(가이드 원문의 전역 변수 `int i` 대신).
> 전역 카운터는 함수가 재진입되거나 여러 스레드에서 동시에 불리면 값이 오염되지만, 매개변수로 넘긴 깊이는 호출 스택마다 독립적이라 그런 문제가 아예 생기지 않는다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD37. 경쟁 조건](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD37.%20경쟁%20조건%20—%20파일%20디스크립터%20원자적%20생성으로%20치환.md)
- [다음: SD39. 심볼릭명 매핑 오류](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD39.%20심볼릭명이%20정확한%20대상에%20매핑되어%20있지%20않음%20—%20mkstemp로%20치환.md)
