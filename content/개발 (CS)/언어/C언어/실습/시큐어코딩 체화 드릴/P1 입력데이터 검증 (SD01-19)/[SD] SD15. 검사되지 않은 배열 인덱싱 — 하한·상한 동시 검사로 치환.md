---
title: "SD15. 검사되지 않은 배열 인덱싱 — 하한·상한 동시 검사로 치환"
description: "시큐어코딩 SD15 검사되지 않은 배열 인덱싱 (CWE-129): 취약한 코드를 하한·상한 동시 검사 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD15. 검사되지 않은 배열 인덱싱 — 하한·상한 동시 검사로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 15. 검사되지 않은 배열 인덱싱](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#15-검사되지-않은-배열-인덱싱-cwe-129) `CWE-129`
> **repo 폴더**: `sd15_writeindex/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> SD14가 "읽기"였다면 이 항목은 그 반대인 **"쓰기"** 다.
> 게다가 위치(`num`)와 값(`value`)을 **모두** 외부가 정하므로, 오버플로우 없이 곧바로 임의 주소 쓰기가 된다는 점이 SD11~13과 다르다.

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
- arr[num - 1] = value;                                       /* 최대·최소 검사 없음 */
+ if (num <= 0 || (size_t)num > arr_size) return -1;           /* 하한 + 상한 */
+ arr[num - 1] = value;
```

루프 비교 연산자는 `>` 보다 `>=` 를 쓰는 습관, 그리고 **하한과 상한을 항상 같이 검사**하는 습관을 SD14(읽기)와 짝지어 체화한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 1-based 인덱스로 배열에 쓰기 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 네트워크에서 받은 (인덱스, 값) 쌍을 배치 처리 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 행·열 인덱스 동시 검사 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 1-based 인덱스로 배열에 쓰기

사용자가 지정한 "1번째, 2번째, ..." 같은 1-based 위치(`num`)에 값을 쓴다.
- `num` 은 1 이상, 배열 크기 이하만 유효하다.

**함수**

```c
void write_at_index_bad(int *arr, int num, int value);
int write_at_index_good(int *arr, size_t arr_size, int num, int value);
```

#### 공격 입력표

| `num` (배열 크기 5) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 5 (정상, 상한) | 정상 동작 | `arr[4]` 는 유효 |
| 10 (상한 초과) | **힙 버퍼 오버플로우로 크래시** | `arr[9]` 는 할당 범위 밖 |
| 0 (하한 미만) | **버퍼 시작 이전 쓰기** | `arr[-1]` 은 배열 앞의 메모리 |

### 1-B. 변형 B — 네트워크에서 받은 (인덱스, 값) 쌍을 배치 처리

PDF 원문처럼 `sscanf("%d %d", &num, &size)` 로 여러 쌍을 반복 처리하는 루프로 확장 — 한 번이라도 검사를 빼먹으면 전체가 뚫린다는 걸 체감

### 1-C. 변형 C — 행·열 인덱스 동시 검사

`data[row][col]` 형태에서 두 인덱스를 각각 검사하되, 검사 실패 시 어느 쪽이 문제였는지 구분해서 반환

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `write_at_index_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void write_at_index_bad(int *arr, int num, int value)
{
    /* 1. arr[num - 1] = value   ← 하한·상한 검사 없음 */
}

int write_at_index_good(int *arr, size_t arr_size, int num, int value)
{
    /* [ ] 1. 범위 검사 (쓰기 전, 한 줄에 둘 다)
     *        num <= 0 또는 (size_t)num > arr_size → return -1 */

    /* [ ] 2. arr[num - 1] = value */

    /* [ ] 3. return 0 */
}
```

### 2-B. `write_at_index_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int write_at_index_good(int *arr, size_t arr_size, int num, int value)
{
    /* [ ] 1. 범위 검사 (쓰기 전, 한 줄에 둘 다) */

    /* [ ] 2. arr[num - 1] = value */

    /* [ ] 3. return 0 */
}
```

### 2-C. `write_at_index_good` — Level 3 (3회차, 백지)

```c
int write_at_index_good(int *arr, size_t arr_size, int num, int value)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 1-based 라서 하한은 `<= 0`, 상한은 `> arr_size`
     *   - 하한과 상한을 따로 떼어놓지 않는다
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
sd15_writeindex/src/arr_write.h
sd15_writeindex/src/arr_write.c
sd15_writeindex/test/test.c
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
#include "arr_write.h"

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
static int g_num;
static void call_bad(void) { write_at_index_bad(g_arr, g_num, 99); }

static void test_bad_is_vulnerable(void)
{
    int *arr = malloc(5 * sizeof(int));
    g_arr = arr; g_num = 10;
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 배열 크기를 넘는 인덱스에 쓰면 크래시해야 한다(취약점 재현)");
    free(arr);
}

static void test_bad_normal(void)
{
    int *arr = malloc(5 * sizeof(int));
    g_arr = arr; g_num = 5;
    T_TRUE(expect_crash(call_bad) == 0, "유효 인덱스는 크래시 없이 정상 동작해야 한다");
    free(arr);
}

static void test_good_blocks_overwrite(void)
{
    int arr[5] = {0};
    T_TRUE(write_at_index_good(arr, 5, 10, 99) == -1, "Good은 상한 밖 인덱스를 거부해야 한다");
    T_TRUE(write_at_index_good(arr, 5, 0, 99) == -1, "Good은 0(하한 밖)도 거부해야 한다");
}

static void test_good_normal(void)
{
    int arr[5] = {0};
    T_TRUE(write_at_index_good(arr, 5, 5, 99) == 0, "정상 인덱스는 성공해야 한다");
    T_TRUE(arr[4] == 99, "쓰인 값이 정확해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_overwrite();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 네트워크에서 받은 (인덱스, 값) 쌍을 배치 처리**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `"0 5\n3 7\n11 9"` 같은 (num, value) 쌍 배치 | 마지막 쌍에서 범위 밖 쓰기 | 범위 밖 쌍은 -1, 앞의 정상 쌍은 반영 |
| 모두 정상 쌍 | 정상 | 정상 |

**변형 C — 행·열 인덱스 동시 검사**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `data[row][col]` 에서 `row` 가 범위 밖 | 다른 행을 덮는다 | -1 (행 오류) |
| `col` 이 범위 밖 | 다른 행을 덮는다 | -2 (열 오류) — 어느 쪽인지 구분 |

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
make D=sd15_writeindex V=main SRC="sd15_writeindex/src/arr_write.c sd15_writeindex/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd15_writeindex/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd15_writeindex/src/arr_write.c sd15_writeindex/test/test.c \
>     -pthread -o build/sd15_writeindex_main
> ./build/sd15_writeindex_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 상한만 검사하고 `num <= 0` (하한)을 빼먹음 | PDF 원문 예시(`sizes[num-1]=size`)의 실제 결함이 이것이다 — `num` 이 0이면 `arr[-1]`, 음수면 더 먼 곳에 쓴다 |
| `num > arr_size` 로만 비교(경계값 처리 오류) | `num == arr_size` 는 유효한 값(`arr[arr_size-1]`)인데 `>` 대신 `>=` 를 잘못 써서 정상 케이스까지 막을 수 있다.<br>반대로 `num > arr_size` 로만 하고 `<` 를 빼먹으면 하한이 뚫린다 |
| `arr_size` 를 `int` 로 받고 `num` 과 부호 있는 비교만 함 | `(size_t)num > arr_size` 형태로 캐스팅해 비교해야, `num` 이 매우 큰 `int` 값일 때도 정확히 비교된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `arr_write.h` / `arr_write.c`
> **헤더 (`arr_write.h`)**
> ```c
> #ifndef ARR_WRITE_H
> #define ARR_WRITE_H
> #include <stddef.h>
> void write_at_index_bad(int *arr, int num, int value);
> int write_at_index_good(int *arr, size_t arr_size, int num, int value);
> #endif
> ```
> **구현 (`arr_write.c`)**
> ```c
> #include "arr_write.h"
>
> void write_at_index_bad(int *arr, int num, int value)
> {
>     arr[num - 1] = value;
> }
>
> int write_at_index_good(int *arr, size_t arr_size, int num, int value)
> {
>     if (num <= 0 || (size_t)num > arr_size) return -1;
>     arr[num - 1] = value;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: 조건문 한 줄(`num <= 0 || (size_t)num > arr_size`)에 **하한**(`<= 0`)과 **상한**(`> arr_size`)이 나란히 있다.
> 이 항목의 모범답안은 "무엇을 검사하는가"보다 **"두 검사를 절대 따로 떼어놓지 않는다"** 는 습관이 핵심이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD14. 범위 초과해서 읽기](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD14.%20범위%20초과해서%20읽기%20—%20길이%20동반%20전달로%20치환.md)
- [다음: SD16. 널 종료 문제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD16.%20널%20종료%20문제%20—%20길이%20명시%20복사와%20수동%20종료로%20치환.md)
