---
title: "SD11. 스택 버퍼 오버플로우 — 길이 검사 후 strncpy로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD11. 스택 버퍼 오버플로우 — 길이 검사 후 strncpy로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 11. 스택에 할당된 버퍼 오버플로우](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#11-스택에-할당된-버퍼-오버플로우-cwe-121) `CWE-121`
> **repo 폴더**: `sd11_stackoverflow/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> 여기부터(SD11~SD19)는 mock이 필요 없다 — **진짜 UB**라서 ASan/UBSan이 그대로 잡아준다.
> 대신 "Bad를 호출하면 실제로 프로세스가 죽는다"를 테스트로 증명하는 새 패턴(`expect_crash`)을 쓴다.

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
- char buf[24];
- strcpy(buf, input);                      /* 길이 검사 없는 복사 */
+ char buf[24];
+ if (strlen(input) < sizeof(buf))
+     strncpy(buf, input, sizeof(buf)-1);
+ buf[sizeof(buf)-1] = '\0';                /* 반드시 null 종료 */
```

`strcpy/strcat/sprintf/gets` 는 보이는 즉시 교체 대상이다.
`strncpy` 로 바꿔도 마지막 바이트 널 종료는 **직접** 채워야 한다는 걸 이번 드릴에서 몸에 새긴다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 고정 크기 문자열 버퍼에 복사 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 8바이트 버퍼 + 두 개 필드 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 함수 인자를 구조체로 교체 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 고정 크기 문자열 버퍼에 복사

외부에서 받은 문자열을 24바이트 지역 버퍼에 복사하는 함수를 만든다.
- 입력이 버퍼보다 길면 안전하게 실패 처리해야 한다.
- 버퍼 안 문자열은 항상 널로 끝나야 한다.

**함수**

```c
void manipulate_string_bad(const char *input);
int manipulate_string_good(const char *input, char *out, size_t out_size);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `input` | 외부(함수 인자) | 24바이트 스택 지역 버퍼로의 복사 |

#### 공격 입력표

| 입력 길이 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 5자 (정상) | 정상 동작 | 버퍼 크기 이내 |
| 41자 (24바이트 초과) | **스택 버퍼 오버플로우로 크래시** | `strcpy` 가 버퍼 경계를 넘어 인접 스택 영역(반환주소 포함)을 덮는다 |

### 1-B. 변형 B — 8바이트 버퍼 + 두 개 필드

`char id[8]; char tag[8];` 처럼 인접한 두 버퍼 중 하나에 오버플로우가 나면 다른 필드까지 오염되는 것을 확인

### 1-C. 변형 C — 함수 인자를 구조체로 교체

`char buf[N]` 을 구조체 멤버로 두고, 구조체 안의 다른 멤버(정수 플래그 등)가 오버플로우로 덮이는지 관찰(가능하면 값 검증까지 추가)

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `manipulate_string_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void manipulate_string_bad(const char *input)
{
    /* 1. char buf[24]
     * 2. strcpy(buf, input)   ← 길이 검사 없음 */
}

int manipulate_string_good(const char *input, char *out, size_t out_size)
{
    /* [ ] 1. 길이 검사 (복사 전)
     *        strlen(input) >= out_size → return -1 */

    /* [ ] 2. strncpy(out, input, out_size - 1) */

    /* [ ] 3. 널 종료를 **직접** 채운다
     *        out[out_size - 1] = '\0' */

    /* [ ] 4. return 0 */
}
```

### 2-B. `manipulate_string_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int manipulate_string_good(const char *input, char *out, size_t out_size)
{
    /* [ ] 1. 길이 검사 (복사 전) */

    /* [ ] 2. strncpy(out, input, out_size - 1) */

    /* [ ] 3. 널 종료를 **직접** 채운다 */

    /* [ ] 4. return 0 */
}
```

### 2-C. `manipulate_string_good` — Level 3 (3회차, 백지)

```c
int manipulate_string_good(const char *input, char *out, size_t out_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `strncpy` 는 널 종료를 보장하지 않는다
     *   - `>=` 와 `>` 의 차이 (널 한 칸)
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
sd11_stackoverflow/src/buf_ops.h
sd11_stackoverflow/src/buf_ops.c
sd11_stackoverflow/test/test.c
```

> [!IMPORTANT] 시험 구조는 고정이다 (SD01~SD58 공통)
> 1. **Bad 가 실제로 뚫린다.**
>    이 시험이 실패하면 Bad 를 잘못 옮겨 적은 것이다.
> 2. **Bad 도 정상 입력은 처리한다.**
> 3. **Good 이 같은 공격을 막는다.**
> 4. **Good 이 정상 입력까지 막지 않는다.** (과잉 차단 없음)

### 3-0. 새 패턴 — `expect_crash` (테스트 안에 직접 타이핑)

ASan이 위반을 감지하면 프로세스를 즉시 `abort()` 시킨다.
이 특성을 거꾸로 이용해서 **"Bad가 실제로 위험하다"를 자동화된 시험으로 증명**한다 — Bad를 자식 프로세스에서 실행하고, 부모가 "자식이 비정상 종료했는가"를 확인한다.

```c
#define _DEFAULT_SOURCE
#include <sys/wait.h>
#include <unistd.h>

/* fn을 자식 프로세스에서 실행한다. 자식이 크래시(시그널 종료 또는 exit!=0)하면 1,
   정상 종료(exit 0)하면 0을 반환한다. */
static int expect_crash(void (*fn)(void))
{
    pid_t pid = fork();
    if (pid == 0) {
        fn();
        _exit(0);
    }
    int status = 0;
    waitpid(pid, &status, 0);
    if (WIFSIGNALED(status)) return 1;
    if (WIFEXITED(status) && WEXITSTATUS(status) != 0) return 1;
    return 0;
}
```

> [!NOTE] 자식 프로세스가 ASan 리포트를 화면에 찍는다
> `make check` 를 실행하면 `PASS` 뒤에 `AddressSanitizer: stack-buffer-overflow ...` 같은 긴 리포트가 함께 출력된다.
> **이건 실패가 아니라 증거다** — 부모는 그 크래시를 "예상된 결과"로 판정해 `PASS` 를 출력한 것이다.
> 이 드릴 이후(SD12~19) 계열에서 계속 재사용하는 패턴이니 잘 기억해 둔다.

### 3-A. 변형 A 시험 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>
#include "buf_ops.h"

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
static void call_bad(void) { manipulate_string_bad(g_input); }

static void test_bad_is_vulnerable(void)
{
    g_input = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"; /* 24바이트 훨씬 초과 */
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 24바이트를 넘는 입력에서 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_input = "short";
    T_TRUE(expect_crash(call_bad) == 0, "짧은 입력은 크래시 없이 정상 동작해야 한다");
}

static void test_good_blocks_overflow(void)
{
    char out[24];
    T_TRUE(manipulate_string_good(
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", out, sizeof(out)) == -1,
        "Good은 버퍼보다 긴 입력을 거부해야 한다");
}

static void test_good_normal(void)
{
    char out[24];
    T_TRUE(manipulate_string_good("short", out, sizeof(out)) == 0, "정상 입력은 성공해야 한다");
    T_TRUE(strcmp(out, "short") == 0, "복사된 내용이 정확해야 한다");
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

**변형 B — 8바이트 버퍼 + 두 개 필드**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `id[8]` 에 20자 | 인접한 `tag` 가 오염됨 | -1, `tag` 보존 |
| 7자 | 정상 | 정상 |

**변형 C — 함수 인자를 구조체로 교체**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 구조체 `buf[N]` 에 `N + 8`자 | 뒤의 정수 플래그가 덮임 | -1, 플래그 보존 |
| `N - 1`자 | 정상 | 정상 |

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
make D=sd11_stackoverflow V=main SRC="sd11_stackoverflow/src/buf_ops.c sd11_stackoverflow/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd11_stackoverflow/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd11_stackoverflow/src/buf_ops.c sd11_stackoverflow/test/test.c \
>     -pthread -o build/sd11_stackoverflow_main
> ./build/sd11_stackoverflow_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `strncpy` 로 바꾸고 널 종료를 안 함 | `strncpy` 는 원본이 대상 크기보다 길거나 같으면 널 종료를 보장하지 않는다.<br>`out[out_size-1] = '\0'` 을 반드시 별도로 적어야 한다 |
| `test_bad_normal` 이 없어서 Good만 있으면 되는 줄 앎 | Bad가 "항상" 죽는 게 아니라 "긴 입력에서만" 죽는다는 걸 확인해야 한다 — 짧은 입력에서도 죽으면 애초에 테스트 설계가 잘못된 것 |
| `expect_crash` 안에서 `fn()` 호출 전에 `fflush(stdout)` 을 안 함 | fork 이후 자식과 부모가 동일한 stdio 버퍼를 공유해 출력이 중복되거나 꼬일 수 있다(이 드릴 정도 규모에서는 거의 안 나타나지만, 실무 습관으로 기억) |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `buf_ops.h` / `buf_ops.c`
> **헤더 (`buf_ops.h`)**
> ```c
> #ifndef BUF_OPS_H
> #define BUF_OPS_H
> #include <stddef.h>
> void manipulate_string_bad(const char *input);
> int manipulate_string_good(const char *input, char *out, size_t out_size);
> #endif
> ```
> **구현 (`buf_ops.c`)**
> ```c
> #include <string.h>
> #include "buf_ops.h"
>
> void manipulate_string_bad(const char *input)
> {
>     char buf[24];
>     strcpy(buf, input);      /* 길이 검사 없는 복사 */
>     (void)buf;
> }
>
> int manipulate_string_good(const char *input, char *out, size_t out_size)
> {
>     if (strlen(input) >= out_size) return -1;
>     strncpy(out, input, out_size - 1);
>     out[out_size - 1] = '\0';
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `manipulate_string_good` 은 실패를 **명시적으로 반환**한다(`-1`).
> PDF 원문의 "그냥 자르고 넘어간다"보다 한 걸음 더 나간 설계다 — 잘린 문자열을 그대로 쓰는 것도 다른 종류의 버그(잘못된 값으로 계속 동작)로 이어질 수 있으므로, 이 드릴에서는 "버퍼에 안 맞으면 실패로 알린다"를 기본값으로 삼는다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD10. 프로세스 제어](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD10.%20프로세스%20제어%20—%20허용%20명령%20매핑으로%20치환.md)
- [다음: SD12. 힙 버퍼 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD12.%20힙%20버퍼%20오버플로우%20—%20strlcpy와%20인덱스%20상한%20검사로%20치환.md)
