---
title: "SD12. 힙 버퍼 오버플로우 — 길이 검사 후 strncpy로 치환"
description: "시큐어코딩 SD12 힙 버퍼 오버플로우 (CWE-122): 취약한 코드를 strlcpy와 인덱스 상한 검사 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD12. 힙 버퍼 오버플로우 — 길이 검사 후 strncpy로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 12. 힙에 할당된 버퍼 오버플로우](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#12-힙에-할당된-버퍼-오버플로우-cwe-122) `CWE-122`
> **repo 폴더**: `sd12_heapoverflow/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> SD11과 원리는 같지만 대상이 스택이 아니라 힙이다 — 인접해서 깨지는 게 반환주소가 아니라 **힙 관리 구조체(청크 메타데이터)** 라는 차이를 확인한다.

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
- char *dest = (char *)malloc(BUFSIZE);
- strcpy(dest, input);                    /* 길이 검사 없음 */
+ if (strlen(input) >= BUFSIZE) return -1;
+ *out = (char *)malloc(BUFSIZE);
+ strncpy(*out, input, BUFSIZE - 1);
+ (*out)[BUFSIZE - 1] = '\0';
```

`expect_crash` 패턴을 그대로 재사용한다([SD11](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD11.%20스택%20버퍼%20오버플로우%20—%20길이%20검사%20후%20strncpy로%20치환.md) 참고).

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 힙 버퍼에 사용자 문자열 복사 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 가변 크기 할당 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 토큰 배열을 힙에 저장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 힙 버퍼에 사용자 문자열 복사

`malloc()` 으로 10바이트 힙 버퍼를 만들고 외부 문자열을 복사한다.
- 입력이 버퍼보다 길면 실패로 처리한다.

**함수**

```c
void heap_copy_bad(const char *input);
int heap_copy_good(const char *input, char **out);
```

#### 공격 입력표

| 입력 길이 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 5자 (정상) | 정상 동작 | 버퍼 크기 이내 |
| 32자 (10바이트 초과) | **힙 버퍼 오버플로우로 크래시** | 인접 힙 청크의 메타데이터(size·fd·bk)가 덮인다 |

### 1-B. 변형 B — 가변 크기 할당

버퍼 크기를 인자로 받는 `malloc(size)` 로 바꾸고, `size` 자체가 외부에서 온다면 [SD17. 정수 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD17.%20정수%20오버플로우%20—%20연산%20전%20오버플로우%20검사로%20치환.md)와 어떻게 연결되는지 생각해본다

### 1-C. 변형 C — 토큰 배열을 힙에 저장

고정 배열(`int dataBuffer[N]`) 대신 `malloc` 으로 할당한 배열에 인덱스 상한 검사 없이 쓰는 경우까지 확장

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `heap_copy_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void heap_copy_bad(const char *input)
{
    /* 1. char *dest = malloc(BUFSIZE)   (BUFSIZE 10)
     * 2. NULL 이면 return
     * 3. strcpy(dest, input)   ← 길이 검사 없음
     * 4. free(dest) */
}

int heap_copy_good(const char *input, char **out)
{
    /* [ ] 1. 길이 구하기
     *        size_t len = strlen(input) */

    /* [ ] 2. 길이 검사 (할당 전)
     *        len >= BUFSIZE → return -1 */

    /* [ ] 3. 할당
     *        *out = malloc(BUFSIZE)
     *        NULL 이면 → return -1 */

    /* [ ] 4. strncpy(*out, input, BUFSIZE - 1) */

    /* [ ] 5. (*out)[BUFSIZE - 1] = '\0' */

    /* [ ] 6. return 0   (해제는 호출자 책임) */
}
```

### 2-B. `heap_copy_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int heap_copy_good(const char *input, char **out)
{
    /* [ ] 1. 길이 구하기 */

    /* [ ] 2. 길이 검사 (할당 전) */

    /* [ ] 3. 할당 */

    /* [ ] 4. strncpy(*out, input, BUFSIZE - 1) */

    /* [ ] 5. (*out)[BUFSIZE - 1] = '\0' */

    /* [ ] 6. return 0   (해제는 호출자 책임) */
}
```

### 2-C. `heap_copy_good` — Level 3 (3회차, 백지)

```c
int heap_copy_good(const char *input, char **out)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 할당 크기와 검증 상수를 같은 `BUFSIZE` 로 쓴다
     *   - 호출자가 `free(*out)` 하는 것까지 시험에 넣는다
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
sd12_heapoverflow/src/heap_ops.h
sd12_heapoverflow/src/heap_ops.c
sd12_heapoverflow/test/test.c
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
#include <string.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>
#include "heap_ops.h"

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

static const char *g_input;
static void call_bad(void) { heap_copy_bad(g_input); }

static void test_bad_is_vulnerable(void)
{
    g_input = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 10바이트를 넘는 입력에서 힙 오버플로우로 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_input = "short";
    T_TRUE(expect_crash(call_bad) == 0, "짧은 입력은 크래시 없이 정상 동작해야 한다");
}

static void test_good_blocks_overflow(void)
{
    char *out = NULL;
    T_TRUE(heap_copy_good("AAAAAAAAAAAAAAAAAAAA", &out) == -1,
        "Good은 버퍼보다 긴 입력을 거부해야 한다");
}

static void test_good_normal(void)
{
    char *out = NULL;
    T_TRUE(heap_copy_good("short", &out) == 0, "정상 입력은 성공해야 한다");
    T_TRUE(out != NULL && strcmp(out, "short") == 0, "복사된 내용이 정확해야 한다");
    free(out);
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

**변형 B — 가변 크기 할당**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `size` 를 외부에서 받는 `malloc(size)` | `size` 가 작게 할당돼 복사가 넘친다 | `size` 상한 검사 후 -1 |
| 정상 크기 + 짧은 문자열 | 정상 | 정상 |

**변형 C — 토큰 배열을 힙에 저장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 토큰 `count` 가 배열 크기를 초과 | 힙 밖에 쓴다 | -1 |
| `count` = 크기 - 1 | 정상 | 정상 |

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
make D=sd12_heapoverflow V=main SRC="sd12_heapoverflow/src/heap_ops.c sd12_heapoverflow/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd12_heapoverflow/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd12_heapoverflow/src/heap_ops.c sd12_heapoverflow/test/test.c \
>     -pthread -o build/sd12_heapoverflow_main
> ./build/sd12_heapoverflow_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| Good 성공 경로에서 `*out` 을 `free` 하지 않고 테스트를 끝냄 | ASan의 LeakSanitizer가 누수로 잡는다.<br>"오버플로우만 막으면 끝"이 아니라 소유권까지 관리해야 한다 |
| `malloc(BUFSIZE)` 실패(`NULL`) 검사를 빼먹음 | 드물지만 힙 고갈 시 `NULL` 에 `strncpy` 하면 또 다른 크래시(널 역참조)가 된다 |
| 스택 버퍼(SD11)와 힙 버퍼(SD12)의 방어 코드를 그대로 복붙 | 원리는 같지만 **소유권(할당·해제) 책임**이 추가된다는 차이를 놓치기 쉽다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `heap_ops.h` / `heap_ops.c`
> **헤더 (`heap_ops.h`)**
> ```c
> #ifndef HEAP_OPS_H
> #define HEAP_OPS_H
> void heap_copy_bad(const char *input);
> int heap_copy_good(const char *input, char **out);
> #endif
> ```
> **구현 (`heap_ops.c`)**
> ```c
> #include <stdlib.h>
> #include <string.h>
> #include "heap_ops.h"
>
> #define BUFSIZE 10
>
> void heap_copy_bad(const char *input)
> {
>     char *dest = (char *)malloc(BUFSIZE);
>     if (dest == NULL) return;
>     strcpy(dest, input);
>     free(dest);
> }
>
> int heap_copy_good(const char *input, char **out)
> {
>     size_t len = strlen(input);
>     if (len >= BUFSIZE) return -1;
>     *out = (char *)malloc(BUFSIZE);
>     if (*out == NULL) return -1;
>     strncpy(*out, input, BUFSIZE - 1);
>     (*out)[BUFSIZE - 1] = '\0';
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `heap_copy_good` 은 **할당 크기와 검증을 한 함수 안에서 같이 관리**한다.
> "할당 크기"와 "쓰기 인덱스(길이)"를 한 쌍으로 보라는 원문의 경고가 이 함수 하나에 그대로 들어있다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD11. 스택 버퍼 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD11.%20스택%20버퍼%20오버플로우%20—%20길이%20검사%20후%20strncpy로%20치환.md)
- [다음: SD13. 버퍼 시작 지점 이전에 쓰기](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD13.%20버퍼%20시작%20지점%20이전에%20쓰기%20—%20하한%20검사로%20치환.md)
