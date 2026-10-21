---
title: "SD13. 버퍼 시작 지점 이전에 쓰기 — 하한 검사로 치환"
description: "시큐어코딩 SD13 버퍼 시작 지점 이전에 쓰기 (CWE-124): 취약한 코드를 하한 검사 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD13. 버퍼 시작 지점 이전에 쓰기 — 하한 검사로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 13. 버퍼 시작 지점 이전에 쓰기](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#13-버퍼-시작-지점-이전에-쓰기-cwe-124) `CWE-124`
> **repo 폴더**: `sd13_writebeforestart/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> SD11·12가 "위(끝)"를 넘었다면 이 항목은 **"아래(시작)"** 를 넘는다.
> `expect_crash` 패턴을 그대로 쓴다.

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
  int wordIndex = MAX_WORDS - 1;
  for (i = 0; i < count; i++) {
+     if (wordIndex < 0) return -1;   /* 하한 검사 */
      words[wordIndex] = i;
      wordIndex--;
  }
```

오버플로우는 상한뿐 아니라 하한으로도 발생한다.
**감소하는 인덱스**를 볼 때마다 "0 아래로 내려갈 수 있는가"를 반사적으로 묻는다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 역순으로 채우는 고정 배열 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 포인터 뺄셈으로 순회 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 가변 길이 배열(VLA) 버전 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 역순으로 채우는 고정 배열

크기 10짜리 배열에 `count` 개의 값을 **역순**(뒤 인덱스부터)으로 채운다.
- `count` 가 배열 크기(10)보다 많을 수 있다 — 이 경우 안전하게 실패 처리해야 한다.

**함수**

```c
void write_before_start_bad(int count);
int write_before_start_good(int count, int *out_arr, size_t arr_size);
```

#### 공격 입력표

| `count` | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 10 (정상, 배열 크기와 동일) | 정상 동작 | 인덱스가 정확히 9→0으로 끝난다 |
| 11 (배열 크기 초과) | **버퍼 시작 이전 쓰기로 크래시** | 인덱스가 0 아래로 내려가 `words[-1]` 에 쓴다 |

### 1-B. 변형 B — 포인터 뺄셈으로 순회

인덱스 대신 포인터(`int *p = arr + N - 1; *p-- = ...`)로 같은 로직을 짜서, 포인터가 배열 시작보다 앞으로 가는 경우도 같은 문제임을 확인

### 1-C. 변형 C — 가변 길이 배열(VLA) 버전

크기를 런타임에 받는 배열로 바꿔서, 컴파일타임 상수(`MAX_WORDS`)에 의존하지 않는 하한 검사를 설계

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `write_before_start_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void write_before_start_bad(int count)
{
    /* 1. int words[MAX_WORDS]   (MAX_WORDS 10)
     * 2. wordIndex = MAX_WORDS - 1
     * 3. count 번 반복: words[wordIndex] = i, wordIndex--
     *    ← 0 아래로 내려가는지 검사 없음 */
}

int write_before_start_good(int count, int *out_arr, size_t arr_size)
{
    /* [ ] 1. 지역변수
     *        int wordIndex, i */

    /* [ ] 2. count < 0 이면 → return -1 */

    /* [ ] 3. wordIndex = (int)arr_size - 1   (초기값은 항상 안전) */

    /* [ ] 4. count 번 반복
     *        [ ] 4-1. wordIndex < 0 이면 → return -1   ← 매 반복 **쓰기 직전**에 하한 검사
     *        [ ] 4-2. out_arr[wordIndex] = i
     *        [ ] 4-3. wordIndex-- */

    /* [ ] 5. return 0 */
}
```

### 2-B. `write_before_start_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int write_before_start_good(int count, int *out_arr, size_t arr_size)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. count < 0 이면 → return -1 */

    /* [ ] 3. wordIndex = (int)arr_size - 1   (초기값은 항상 안전) */

    /* [ ] 4. count 번 반복 */

    /* [ ] 5. return 0 */
}
```

### 2-C. `write_before_start_good` — Level 3 (3회차, 백지)

```c
int write_before_start_good(int count, int *out_arr, size_t arr_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 검사 위치는 초기화가 아니라 **매 반복 직전**
     *   - `size_t` → `int` 캐스팅 주의
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
sd13_writebeforestart/src/array_ops.h
sd13_writebeforestart/src/array_ops.c
sd13_writebeforestart/test/test.c
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
#include "array_ops.h"

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
static void call_bad(void) { write_before_start_bad(g_count); }

static void test_bad_is_vulnerable(void)
{
    g_count = 11;
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 토큰이 배열 크기보다 많으면 버퍼 시작 이전에 써서 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_count = 10;
    T_TRUE(expect_crash(call_bad) == 0, "배열 크기와 같은 개수는 크래시 없이 정상 동작");
}

static void test_good_blocks_underflow(void)
{
    int arr[10];
    T_TRUE(write_before_start_good(11, arr, 10) == -1,
        "Good은 배열 크기를 넘는 개수를 거부해야 한다");
}

static void test_good_normal(void)
{
    int arr[10] = {0};
    T_TRUE(write_before_start_good(10, arr, 10) == 0, "정상 개수는 성공해야 한다");
    T_TRUE(arr[0] == 9, "역순으로 채워진 마지막 값이 정확해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_underflow();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 포인터 뺄셈으로 순회**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 포인터 `p = arr + N - 1; *p-- = ...` 를 `count > N` 번 | 배열 시작보다 앞에 쓴다 | `p < arr` 를 쓰기 직전에 검사 → -1 |
| `count = N` | 정상 | 정상 |

**변형 C — 가변 길이 배열(VLA) 버전**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 런타임 크기 `n` 의 VLA 에 `count > n` | 앞쪽 스택을 덮는다 | `wordIndex < 0` 검사로 -1 (`MAX_WORDS` 대신 `n`) |
| `count = n` | 정상 | 정상 |

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
make D=sd13_writebeforestart V=main SRC="sd13_writebeforestart/src/array_ops.c sd13_writebeforestart/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd13_writebeforestart/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd13_writebeforestart/src/array_ops.c sd13_writebeforestart/test/test.c \
>     -pthread -o build/sd13_writebeforestart_main
> ./build/sd13_writebeforestart_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 루프 시작 전에 `count > arr_size` 만 검사하고 끝냄 | 이 항목의 취약점은 "인덱스가 반복 중에 감소하다가" 발생한다.<br>시작 전 검사만으로는 "정확히 언제 0 아래로 내려가는지" 찾기 어렵다 — 매 반복 직전에 검사하는 게 더 명확하다(이 드릴의 모범답안 방식) |
| 상한 검사(SD15)와 하한 검사(이 항목)를 혼동해서 `>=` 방향을 반대로 씀 | "감소 인덱스는 하한", "증가 인덱스는 상한"이라는 방향 감각을 반사적으로 연결한다 |
| `int` 대신 `size_t` 로 인덱스를 선언 | `size_t` 는 부호 없는 타입이라 `wordIndex--` 가 0에서 한 번 더 감소하면 거대한 양수(랩어라운드)가 되어 오히려 더 위험해진다.<br>감소하는 인덱스는 **부호 있는 타입**으로 선언한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `array_ops.h` / `array_ops.c`
> **헤더 (`array_ops.h`)**
> ```c
> #ifndef ARRAY_OPS_H
> #define ARRAY_OPS_H
> #include <stddef.h>
> void write_before_start_bad(int count);
> int write_before_start_good(int count, int *out_arr, size_t arr_size);
> #endif
> ```
> **구현 (`array_ops.c`)**
> ```c
> #include "array_ops.h"
> #define MAX_WORDS 10
>
> void write_before_start_bad(int count)
> {
>     int words[MAX_WORDS];
>     int wordIndex = MAX_WORDS - 1;
>     int i;
>     for (i = 0; i < count; i++) {
>         words[wordIndex] = i;
>         wordIndex--;
>     }
>     (void)words;
> }
>
> int write_before_start_good(int count, int *out_arr, size_t arr_size)
> {
>     int wordIndex;
>     int i;
>     if (count < 0) return -1;
>     wordIndex = (int)arr_size - 1;
>     for (i = 0; i < count; i++) {
>         if (wordIndex < 0) return -1;
>         out_arr[wordIndex] = i;
>         wordIndex--;
>     }
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `wordIndex` 의 **초기값**은 항상 안전하다(`arr_size - 1`).
> 문제는 반복 "횟수"가 배열 크기를 넘을 때만 생긴다 — 그래서 검사를 초기화 시점이 아니라 **매 반복 직전**에 두는 것이 유일하게 안전한 위치다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD12. 힙 버퍼 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD12.%20힙%20버퍼%20오버플로우%20—%20strlcpy와%20인덱스%20상한%20검사로%20치환.md)
- [다음: SD14. 범위 초과해서 읽기](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD14.%20범위%20초과해서%20읽기%20—%20길이%20동반%20전달로%20치환.md)
