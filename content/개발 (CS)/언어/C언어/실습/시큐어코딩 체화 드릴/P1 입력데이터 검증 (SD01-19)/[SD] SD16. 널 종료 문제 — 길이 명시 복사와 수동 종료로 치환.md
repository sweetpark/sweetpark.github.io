---
title: "SD16. 널 종료 문제 — 길이 명시 복사와 수동 종료로 치환"
description: "시큐어코딩 SD16 널 종료 문제 (CWE-170): 취약한 코드를 길이 명시 복사와 수동 종료 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD16. 널 종료 문제 — 길이 명시 복사와 수동 종료로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 16. 널 종료 문제](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#16-널-종료-문제-cwe-170) `CWE-170`
> **repo 폴더**: `sd16_nullterm/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 1-3의 마지막 드릴.
> `read()` 로 받은 바이트 배열처럼 **널 종료가 보장되지 않는 버퍼**를 문자열 함수에 넘기면 무슨 일이 생기는지 실제로 재현한다.

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
- strcpy(out, raw);                                    /* raw가 널 종료 안 되면 계속 읽음 */
+ size_t n = (raw_len < out_size - 1) ? raw_len : out_size - 1;
+ memcpy(out, raw, n);
+ out[n] = '\0';                                        /* 널 종료를 직접 보장 */
```

`read()`/`readlink()` 로 받은 버퍼는 "문자열"이 아니라 "바이트 배열"로 취급하라 — `strcpy`/`strcat`/`strlen` 을 바로 적용하지 않는다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 고정 길이로 읽은 원본 복사 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 두 조각을 이어붙이기(`strncat` 흉내) | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** C++ `std::string`/C의 길이 기반 구조체로 전환 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 고정 길이로 읽은 원본 복사

`read()` 로 읽은 것처럼 길이가 고정된(`raw_len`) 바이트 버퍼를 문자열 버퍼(`out`)로 복사한다.
- `raw` 는 널로 끝난다는 보장이 없다.
- `out` 은 항상 널로 끝나야 한다.

**함수**

```c
void copy_raw_bad(const char *raw, char *out);
int copy_raw_good(const char *raw, size_t raw_len, char *out, size_t out_size);
```

#### 공격 입력표

| `raw` 상태 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 8바이트를 `\0` 로 채우고 `"hi"` 를 앞에 씀 (정상) | 정상 동작 | 우연히 널 종료가 되어 있는 경우 |
| **정확히 8바이트를 `'A'` 로만 채움(널 없음)** | **힙 버퍼 오버리드로 크래시** | `strcpy` 가 8바이트를 넘어 널을 찾아 계속 읽는다 |

### 1-B. 변형 B — 두 조각을 이어붙이기(`strncat` 흉내)

`firstName` + `" "` + `lastName` 을 붙이는 로직에서, 앞부분이 널 종료가 안 됐을 때 `strncat` 이 어떻게 추가로 폭주하는지 재현

### 1-C. 변형 C — C++ `std::string`/C의 길이 기반 구조체로 전환

널 종료에 의존하지 않는 자료구조(길이를 항상 들고 다니는 구조체)로 설계를 바꾸면 이 계열의 문제가 원천적으로 사라진다는 것을 체감

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `copy_raw_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void copy_raw_bad(const char *raw, char *out)
{
    /* 1. strcpy(out, raw)   ← raw 가 널로 끝난다고 믿는다 */
}

int copy_raw_good(const char *raw, size_t raw_len, char *out, size_t out_size)
{
    /* [ ] 1. 복사할 길이
     *        n = (raw_len < out_size - 1) ? raw_len : out_size - 1 */

    /* [ ] 2. memcpy(out, raw, n)   ← raw 에는 길이 기반 함수만 쓴다 */

    /* [ ] 3. out[n] = '\0'   ← 널 종료는 out 쪽에서 직접 */

    /* [ ] 4. return (raw_len < out_size) ? 0 : -1   (잘렸으면 -1) */
}
```

### 2-B. `copy_raw_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int copy_raw_good(const char *raw, size_t raw_len, char *out, size_t out_size)
{
    /* [ ] 1. 복사할 길이 */

    /* [ ] 2. memcpy(out, raw, n)   ← raw 에는 길이 기반 함수만 쓴다 */

    /* [ ] 3. out[n] = '\0'   ← 널 종료는 out 쪽에서 직접 */

    /* [ ] 4. return (raw_len < out_size) ? 0 : -1   (잘렸으면 -1) */
}
```

### 2-C. `copy_raw_good` — Level 3 (3회차, 백지)

```c
int copy_raw_good(const char *raw, size_t raw_len, char *out, size_t out_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `raw` 에 `strlen` / `strcpy` 를 쓰지 않는다
     *   - `out_size - 1` 은 널 한 칸
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
sd16_nullterm/src/raw_copy.h
sd16_nullterm/src/raw_copy.c
sd16_nullterm/test/test.c
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
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>
#include "raw_copy.h"

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

static char *g_raw;
static char g_out[256];
static void call_bad(void) { copy_raw_bad(g_raw, g_out); }

static void test_bad_is_vulnerable(void)
{
    g_raw = malloc(8);
    memset(g_raw, 'A', 8);          /* 정확히 8바이트, 널 종료 없음 */
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 널 종료 안 된 버퍼를 strcpy로 읽으면 경계를 넘어 크래시해야 한다(취약점 재현)");
    free(g_raw);
}

static void test_bad_normal(void)
{
    g_raw = malloc(8);
    memset(g_raw, 0, 8);
    memcpy(g_raw, "hi", 2);
    T_TRUE(expect_crash(call_bad) == 0, "정상 널 종료 문자열은 크래시 없이 동작해야 한다");
    free(g_raw);
}

static void test_good_blocks_overread(void)
{
    char raw[8];
    char out[4];
    memset(raw, 'A', 8);
    T_TRUE(copy_raw_good(raw, 8, out, sizeof(out)) == -1,
        "Good은 out 버퍼가 raw_len을 다 담을 수 없으면 실패를 알려야 한다");
    T_TRUE(out[3] == '\0', "그래도 out은 항상 널로 끝나야 한다");
}

static void test_good_normal(void)
{
    char raw[8];
    char out[16];
    memset(raw, 0, 8);
    memcpy(raw, "hi", 2);
    T_TRUE(copy_raw_good(raw, 2, out, sizeof(out)) == 0, "정상 길이는 성공해야 한다");
    T_TRUE(strcmp(out, "hi") == 0, "복사된 내용이 정확해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_overread();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 두 조각을 이어붙이기(`strncat` 흉내)**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `firstName` 에 널이 없는 8바이트 + `strncat` | 앞 문자열이 끝나지 않아 뒤를 계속 읽는다 | 길이 기반으로 이어 붙여 널을 직접 쓴다 |
| 널로 끝나는 짧은 이름 둘 | 정상 | 정상 |

**변형 C — C++ `std::string`/C의 길이 기반 구조체로 전환**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 길이를 들고 다니는 구조체 `{ ptr, len }` | 널 종료에 의존하지 않는다 | 같은 입력이 `len` 만큼만 복사된다 |
| `len = 0` | 빈 문자열 | 빈 문자열 |

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
make D=sd16_nullterm V=main SRC="sd16_nullterm/src/raw_copy.c sd16_nullterm/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd16_nullterm/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd16_nullterm/src/raw_copy.c sd16_nullterm/test/test.c \
>     -pthread -o build/sd16_nullterm_main
> ./build/sd16_nullterm_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 테스트에서 `raw` 를 스택 배열(`char raw[8]`)로만 두고 `malloc(8)` 을 안 씀 | 스택 배열은 컴파일러가 여유 공간이나 다른 지역변수를 바로 뒤에 둘 수 있어 ASan이 항상 정확히 잡아주지 못할 때가 있다.<br>**힙에 정확한 크기로 할당**해야 재현이 안정적이다 |
| Good에서 실패(`-1`) 시 `out` 을 아예 안 건드림 | 호출자가 실패를 무시하고 `out` 을 문자열로 쓰면 초기화 안 된 메모리를 읽는 또 다른 버그가 생긴다.<br>실패해도 **최소한 널 종료된 빈 상태**는 보장한다 |
| `raw_len` 을 아예 안 받고 `strlen(raw)` 로 길이를 구하려 함 | 이 항목의 전제 자체가 "raw는 널 종료가 안 되어 있다"는 것이다.<br>`strlen` 을 쓰는 순간 이미 이 항목이 경고하는 함정에 빠진 것이다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `raw_copy.h` / `raw_copy.c`
> **헤더 (`raw_copy.h`)**
> ```c
> #ifndef RAW_COPY_H
> #define RAW_COPY_H
> #include <stddef.h>
> void copy_raw_bad(const char *raw, char *out);
> int copy_raw_good(const char *raw, size_t raw_len, char *out, size_t out_size);
> #endif
> ```
> **구현 (`raw_copy.c`)**
> ```c
> #include <string.h>
> #include "raw_copy.h"
>
> void copy_raw_bad(const char *raw, char *out)
> {
>     strcpy(out, raw);
> }
>
> int copy_raw_good(const char *raw, size_t raw_len, char *out, size_t out_size)
> {
>     size_t n = (raw_len < out_size - 1) ? raw_len : out_size - 1;
>     memcpy(out, raw, n);
>     out[n] = '\0';
>     return (raw_len < out_size) ? 0 : -1;
> }
> ```
>
> **눈여겨볼 점**: `copy_raw_good` 은 `raw` 에 대해 **길이 기반 함수(`memcpy`)만** 쓴다.
> `raw` 안에 널 문자가 있는지 없는지는 이 함수의 관심사가 아니다 — 항상 `raw_len` 만큼만 정확히 읽고, 종료는 `out` 쪽에서 직접 보장한다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD15. 검사되지 않은 배열 인덱싱](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD15.%20검사되지%20않은%20배열%20인덱싱%20—%20하한·상한%20동시%20검사로%20치환.md)
- Part 1-3 메모리 경계 계열 6개 완료 — [다음: SD17. 정수 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD17.%20정수%20오버플로우%20—%20연산%20전%20오버플로우%20검사로%20치환.md)
