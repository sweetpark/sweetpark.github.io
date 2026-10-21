---
title: "SD19. 무부호 정수를 부호 정수로 타입 변환 오류 — signed로 받아 검증 후 변환으로 치환"
description: "시큐어코딩 SD19 무부호 정수를 부호 정수로 타입 변환 오류 (CWE-196): 취약한 코드를 signed로 받아 검증 후 변환 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD19. 무부호 정수를 부호 정수로 타입 변환 오류 — signed로 받아 검증 후 변환으로 치환

> **원본 항목**: [Part 1-4. 정수·타입변환 계열 — 19. 무부호 정수를 부호 정수로 타입 변환 오류](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-4.%20정수·타입변환%20계열.md#19-무부호-정수를-부호-정수로-타입-변환-오류-cwe-196) `CWE-196`
> **repo 폴더**: `sd19_unsignedtosigned/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 1-4의 마지막 드릴.
> `-1`(에러 표시)이 `unsigned` 로 뒤집혀 `memcpy` 크기로 흘러가는, 가장 고전적인 "에러코드 → 크기값 오염" 패턴이다.

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
- unsigned size;
- size = (unsigned)get_chunk_size(initialized, chunk_size);   /* -1 -> 4294967295 */
- memcpy(dst, src, size);
+ int size = get_chunk_size(initialized, chunk_size);          /* signed로 받는다 */
+ if (size < 0) return -1;                                     /* 에러 여부 먼저 확인 */
+ memcpy(dst, src, (size_t)size);
```

크기·인덱스는 "부호 있는 채로 검증 → 검증 후 unsigned로 변환" 순서를 지키고, 비교 양쪽의 타입을 통일한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 초기화 여부에 따른 청크 복사 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 파일 읽기 크기로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 비교 연산으로 변형 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 초기화 여부에 따른 청크 복사

"초기화됨" 상태일 때만 지정된 크기만큼 `src` 를 `dst` 로 복사한다.
- 초기화가 안 됐으면 크기 조회 함수는 에러(`-1`)를 반환한다.
- 에러 상태에서는 복사를 수행하면 안 된다.

**함수**

```c
int get_chunk_size(int initialized, int chunk_size);
void chunk_copy_bad(void *dst, const void *src, int initialized, int chunk_size);
int chunk_copy_good(void *dst, size_t dst_size, const void *src, int initialized, int chunk_size);
```

#### 공격 입력표

| `initialized` | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 1 (정상, 정상 크기) | 정상 복사 | 에러 없음 |
| **0 (미초기화)** | **memcpy가 약 4GB 복사를 시도하며 크래시** | `get_chunk_size()` 가 반환한 `-1` 을 `unsigned` 로 받아 `4294967295` 가 된다 |

### 1-B. 변형 B — 파일 읽기 크기로 변형

`read()` 가 실패 시 반환하는 `-1` 을 `size_t` 로 받아 버퍼 크기로 쓰는 흔한 실무 패턴으로 재현

### 1-C. 변형 C — 비교 연산으로 변형

`unsigned int userLevel` 과 `int SUPER_USER_LEVEL` 을 비교할 때 비교 양쪽의 타입을 통일하지 않으면 어떤 값에서 비교 결과가 뒤집히는지 직접 찾아본다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `chunk_copy_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void chunk_copy_bad(void *dst, const void *src, int initialized, int chunk_size)
{
    /* 1. unsigned size = (unsigned)get_chunk_size(initialized, chunk_size)
     *    ← -1 이 4294967295 로 바뀐다
     * 2. memcpy(dst, src, size) */
}

int chunk_copy_good(void *dst, size_t dst_size, const void *src,
                    int initialized, int chunk_size)
{
    /* [ ] 1. signed 로 받는다
     *        int size = get_chunk_size(initialized, chunk_size) */

    /* [ ] 2. 에러 먼저 확인
     *        size < 0 → return -1 */

    /* [ ] 3. 목적지 크기 검사
     *        (size_t)size > dst_size → return -1 */

    /* [ ] 4. memcpy(dst, src, (size_t)size) */

    /* [ ] 5. return 0 */
}
```

### 2-B. `chunk_copy_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int chunk_copy_good(void *dst, size_t dst_size, const void *src,
                    int initialized, int chunk_size)
{
    /* [ ] 1. signed 로 받는다 */

    /* [ ] 2. 에러 먼저 확인 */

    /* [ ] 3. 목적지 크기 검사 */

    /* [ ] 4. memcpy(dst, src, (size_t)size) */

    /* [ ] 5. return 0 */
}
```

### 2-C. `chunk_copy_good` — Level 3 (3회차, 백지)

```c
int chunk_copy_good(void *dst, size_t dst_size, const void *src,
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `get_chunk_size` 는 바꾸지 않는다 (받는 쪽 타입이 문제)
     *   - 검증은 signed 로, 변환은 검증 뒤에
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
sd19_unsignedtosigned/src/chunk_copy.h
sd19_unsignedtosigned/src/chunk_copy.c
sd19_unsignedtosigned/test/test.c
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
#include <sys/wait.h>
#include <unistd.h>
#include "chunk_copy.h"

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

static char g_dst[16], g_src[16];
static void call_bad(void) { chunk_copy_bad(g_dst, g_src, 0, 8); }

static void test_bad_is_vulnerable(void)
{
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 초기화 실패(-1)가 거대한 unsigned 크기로 바뀌어 memcpy가 폭주해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    char dst[16], src[16] = "hello";
    chunk_copy_bad(dst, src, 1, 6);
    T_TRUE(strcmp(dst, "hello") == 0, "정상 초기화 상태는 크래시 없이 동작해야 한다");
}

static void test_good_blocks_wraparound(void)
{
    char dst[16], src[16] = {0};
    T_TRUE(chunk_copy_good(dst, sizeof(dst), src, 0, 8) == -1,
        "Good은 초기화 실패(-1)를 부호 있는 채로 확인해 거부해야 한다");
}

static void test_good_normal(void)
{
    char dst[16] = {0}, src[16] = "hello";
    T_TRUE(chunk_copy_good(dst, sizeof(dst), src, 1, 6) == 0, "정상 초기화 상태는 성공해야 한다");
    T_TRUE(strcmp(dst, "hello") == 0, "복사된 내용이 정확해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_wraparound();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 파일 읽기 크기로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `read()` 가 -1 을 반환했는데 `size_t n = read(...)` | 거대한 길이로 복사 | `ssize_t` 로 받아 `< 0` 이면 -1 |
| 정상 읽기 | 정상 | 정상 |

**변형 C — 비교 연산으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `unsigned userLevel` 과 `int SUPER` 비교, `userLevel` 이 큰 값 | 비교가 뒤집힌다 | 양쪽 타입을 통일해서 비교 |
| 작은 값 | 정상 | 정상 |

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
make D=sd19_unsignedtosigned V=main SRC="sd19_unsignedtosigned/src/chunk_copy.c sd19_unsignedtosigned/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd19_unsignedtosigned/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd19_unsignedtosigned/src/chunk_copy.c sd19_unsignedtosigned/test/test.c \
>     -pthread -o build/sd19_unsignedtosigned_main
> ./build/sd19_unsignedtosigned_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `unsigned size = get_chunk_size(...)` 로 받은 뒤 `if (size == (unsigned)-1)` 로 검사 | 동작은 하지만 "부호 있는 채로 먼저 검증"이라는 원칙에서 벗어난 임기응변이다.<br>애초에 `int` 로 받으면 이런 매직 넘버 비교 자체가 필요 없다 |
| 함수 리턴 타입은 고쳤지만 호출부에서 여전히 `unsigned` 변수에 대입 | 선언부만 바꾸고 호출부의 타입을 안 맞추면 암묵적 변환이 도로 일어난다.<br>호출부까지 한 세트로 확인한다 |
| `dst_size` 검사 없이 `size < 0` 만 확인 | 크기가 양수여도 대상 버퍼보다 크면 여전히 오버플로우다.<br>이 드릴은 두 가지(부호·용량)를 모두 요구한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `chunk_copy.h` / `chunk_copy.c`
> **헤더 (`chunk_copy.h`)**
> ```c
> #ifndef CHUNK_COPY_H
> #define CHUNK_COPY_H
> #include <stddef.h>
> int get_chunk_size(int initialized, int chunk_size);
> void chunk_copy_bad(void *dst, const void *src, int initialized, int chunk_size);
> int chunk_copy_good(void *dst, size_t dst_size, const void *src, int initialized, int chunk_size);
> #endif
> ```
> **구현 (`chunk_copy.c`)**
> ```c
> #include <string.h>
> #include "chunk_copy.h"
>
> int get_chunk_size(int initialized, int chunk_size)
> {
>     if (!initialized) return -1;
>     return chunk_size;
> }
>
> void chunk_copy_bad(void *dst, const void *src, int initialized, int chunk_size)
> {
>     unsigned size;
>     size = (unsigned)get_chunk_size(initialized, chunk_size);
>     memcpy(dst, src, size);
> }
>
> int chunk_copy_good(void *dst, size_t dst_size, const void *src, int initialized, int chunk_size)
> {
>     int size = get_chunk_size(initialized, chunk_size);
>     if (size < 0) return -1;
>     if ((size_t)size > dst_size) return -1;
>     memcpy(dst, src, (size_t)size);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `get_chunk_size` 자체는 **바뀌지 않는다** — 에러를 `-1` 로 표현하는 함수 자체는 정상적인 관용구다.
> 문제는 그 반환값을 **받는 쪽**의 타입이었다.
> SD17~19를 관통하는 교훈: 오류는 값을 만드는 곳이 아니라 **그 값을 다음 계산에 넘기는 지점**에서 막는다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD18. 의도하지 않은 부호 확장](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD18.%20의도하지%20않은%20부호%20확장%20—%20원본%20타입으로%20직접%20검사하도록%20치환.md)
- Part 1 전체(19개) 완료 — [다음: SD20. 부적절한 인가](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD20.%20부적절한%20인가%20—%20세션%20식별자%20대조로%20치환.md)
