---
title: "SD14. 범위 초과해서 읽기 — 길이 동반 전달로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD14. 범위 초과해서 읽기 — 길이 동반 전달로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 14. 범위 초과해서 읽기](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#14-범위-초과해서-읽기-cwe-125) `CWE-125`
> **repo 폴더**: `sd14_readoverflow/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> SD11~13은 전부 "쓰기(write)" 오버플로우였다.
> 이 항목은 **"읽기(read)"** 오버플로우다 — 겉보기에는 크래시하지 않고 조용히 넘어갈 수도 있어서 더 위험하다는 걸 체감한다.

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
- return arr[idx];                                    /* 상한 검사 없음 */
+ if (idx < 0 || (size_t)idx >= size) return -1;       /* 배열과 "길이"를 항상 같이 받는다 */
+ *out = arr[idx];
```

배열 포인터를 넘길 때는 반드시 길이도 함께 넘긴다.
"포인터 단독 전달"이 out-of-bounds read의 근본 원인이다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 배열 인덱스 조회 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 문자열 배열(`char*[]`) 조회 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 2차원 배열(행렬) 조회 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 배열 인덱스 조회

정수 배열과 인덱스를 받아 해당 위치의 값을 반환한다.
- 인덱스가 배열 크기를 벗어나면 안전하게 실패 처리해야 한다.

**함수**

```c
int read_at_index_bad(const int *arr, int idx);
int read_at_index_good(const int *arr, size_t size, int idx, int *out);
```

#### 공격 입력표

| `idx` (배열 크기 3) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 2 (정상) | 정상 값 반환 | 유효 인덱스(0~2) |
| 5 (범위 초과) | **힙 버퍼 오버리드로 크래시** | 배열 뒤 힙 메모리를 읽는다 — 다른 데이터·포인터 값이 새어나갈 수 있다 |

### 1-B. 변형 B — 문자열 배열(`char*[]`) 조회

범위를 넘으면 포인터 값 자체가 유출될 수 있다는 점(ASLR 무력화로 이어지는 이유)을 노트에 적어본다

### 1-C. 변형 C — 2차원 배열(행렬) 조회

`data[row][col]` 형태에서 `row`, `col` **양쪽 모두** 범위를 검사해야 하는 이유를 확인

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `read_at_index_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int read_at_index_bad(const int *arr, int idx)
{
    /* 1. return arr[idx]   ← 범위 검사 없음 */
}

int read_at_index_good(const int *arr, size_t size, int idx, int *out)
{
    /* [ ] 1. 범위 검사 (읽기 전)
     *        idx < 0 또는 (size_t)idx >= size → return -1 */

    /* [ ] 2. *out = arr[idx]
     *        값은 out 으로, 상태는 리턴으로 분리한다 */

    /* [ ] 3. return 0 */
}
```

### 2-B. `read_at_index_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int read_at_index_good(const int *arr, size_t size, int idx, int *out)
{
    /* [ ] 1. 범위 검사 (읽기 전) */

    /* [ ] 2. *out = arr[idx] */

    /* [ ] 3. return 0 */
}
```

### 2-C. `read_at_index_good` — Level 3 (3회차, 백지)

```c
int read_at_index_good(const int *arr, size_t size, int idx, int *out)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 배열과 **길이를 항상 같이** 받는다
     *   - 하한(`< 0`)을 빼먹지 않는다
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
sd14_readoverflow/src/arr_read.h
sd14_readoverflow/src/arr_read.c
sd14_readoverflow/test/test.c
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
#include <sys/wait.h>
#include <unistd.h>
#include "arr_read.h"

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

static int *g_arr;
static int g_idx;
static void call_bad(void) { (void)read_at_index_bad(g_arr, g_idx); }

static void test_bad_is_vulnerable(void)
{
    int *arr = malloc(3 * sizeof(int));
    arr[0] = 1; arr[1] = 2; arr[2] = 3;
    g_arr = arr; g_idx = 5;
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 배열 경계를 넘는 인덱스를 읽으면 크래시해야 한다(취약점 재현)");
    free(arr);
}

static void test_bad_normal(void)
{
    int *arr = malloc(3 * sizeof(int));
    arr[0] = 1; arr[1] = 2; arr[2] = 3;
    g_arr = arr; g_idx = 2;
    T_TRUE(expect_crash(call_bad) == 0, "유효 인덱스는 크래시 없이 정상 동작해야 한다");
    free(arr);
}

static void test_good_blocks_overread(void)
{
    int arr[3] = {1, 2, 3};
    int out;
    T_TRUE(read_at_index_good(arr, 3, 5, &out) == -1, "Good은 범위 밖 인덱스를 거부해야 한다");
}

static void test_good_normal(void)
{
    int arr[3] = {1, 2, 3};
    int out;
    T_TRUE(read_at_index_good(arr, 3, 2, &out) == 0, "정상 인덱스는 성공해야 한다");
    T_TRUE(out == 3, "읽은 값이 정확해야 한다");
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

**변형 B — 문자열 배열(`char*[]`) 조회**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `char *names[N]` 에서 `idx = N` | 범위 밖 포인터 값을 읽는다 (주소 유출) | -1 |
| `idx = N - 1` | 정상 | 정상 |

**변형 C — 2차원 배열(행렬) 조회**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `data[row][col]` 에서 `col` 만 범위 밖 | 옆 행의 값을 읽는다 | -1 (`row`, `col` 양쪽 검사) |
| `row`, `col` 모두 범위 안 | 정상 | 정상 |

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
make D=sd14_readoverflow V=main SRC="sd14_readoverflow/src/arr_read.c sd14_readoverflow/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd14_readoverflow/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd14_readoverflow/src/arr_read.c sd14_readoverflow/test/test.c \
>     -pthread -o build/sd14_readoverflow_main
> ./build/sd14_readoverflow_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "읽기"라서 검사를 생략해도 된다고 생각함 | 읽기 오버플로우는 크래시가 없을 때도 있다(매핑된 페이지라면).<br>대신 세션 토큰·키 같은 민감정보가 반환값에 실려 유출된다 — 쓰기보다 더 늦게 발견된다 |
| 함수가 값과 에러를 같은 채널로 반환(`int read_at_index(...)` 하나로 값과 -1 에러를 겸용) | 정상 값이 우연히 `-1` 일 때 구분이 안 된다.<br>이 드릴처럼 리턴값은 상태 전용, 실제 값은 출력 인자(`*out`)로 분리하는 습관을 들인다 |
| `size` 를 `int` 로 받아서 음수 크기가 들어올 가능성을 열어둠 | 배열 크기는 개념적으로 음수일 수 없다.<br>`size_t` 로 받아 타입 자체가 음수를 표현 못 하게 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `arr_read.h` / `arr_read.c`
> **헤더 (`arr_read.h`)**
> ```c
> #ifndef ARR_READ_H
> #define ARR_READ_H
> #include <stddef.h>
> int read_at_index_bad(const int *arr, int idx);
> int read_at_index_good(const int *arr, size_t size, int idx, int *out);
> #endif
> ```
> **구현 (`arr_read.c`)**
> ```c
> #include "arr_read.h"
>
> int read_at_index_bad(const int *arr, int idx)
> {
>     return arr[idx];
> }
>
> int read_at_index_good(const int *arr, size_t size, int idx, int *out)
> {
>     if (idx < 0 || (size_t)idx >= size) return -1;
>     *out = arr[idx];
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `read_at_index_bad` 는 인자가 2개, `read_at_index_good` 은 4개다.
> 늘어난 두 개(`size`, `int *out`)가 이 항목이 요구하는 방어 그 자체다 — **길이를 동반**하고, **값과 상태를 분리**한다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD13. 버퍼 시작 지점 이전에 쓰기](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD13.%20버퍼%20시작%20지점%20이전에%20쓰기%20—%20하한%20검사로%20치환.md)
- [다음: SD15. 검사되지 않은 배열 인덱싱](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD15.%20검사되지%20않은%20배열%20인덱싱%20—%20하한·상한%20동시%20검사로%20치환.md)
