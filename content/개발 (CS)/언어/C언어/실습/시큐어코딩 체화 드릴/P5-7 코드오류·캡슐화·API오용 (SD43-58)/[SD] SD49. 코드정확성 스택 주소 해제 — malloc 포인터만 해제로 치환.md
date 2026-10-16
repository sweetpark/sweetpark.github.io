---
title: "SD49. 코드정확성 스택 주소 해제 — malloc 포인터만 해제로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD49. 코드정확성: 스택 주소 해제 — malloc 포인터만 해제로 치환

> **원본 항목**: [Part 5. 코드 오류 — 7. 코드정확성: 스택 주소 해제](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#7-코드정확성-스택-주소-해제-cwe-730) `CWE-730`
> **repo 폴더**: `sd49_badfree/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 8분 / 2회차 5분 / **3회차 3분**
> `free()`의 유일한 정당한 인자는 "내가 malloc 계열로 받은 포인터"뿐이다.
> ASan은 `free()`를 가로채 대상 주소가 실제로 malloc이 추적 중인 청크인지 확인하므로, 이 위반은 **진짜 UB로 100% 결정론적으로 재현**된다.

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
- char p[10];
- free(p);                          /* 스택 주소 해제 -> 비정상 동작 */
+ char *p = (char *)malloc(10);
+ if (!p) return -1;
+ /* 사용 */
+ free(p);                          /* malloc으로 받은 포인터만 해제 */
```

`free()`에 넘기는 포인터가 "정말 malloc 계열이 반환한 것인가"를 항상 스스로에게 묻는다.
스택 배열, 전역 변수, `strtok()`의 반환값은 전부 대상이 아니다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 임시 버퍼 정리 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** `strtok()` 반환값을 `free()`하는 실수로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 이중 해제(double free)로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 임시 버퍼 정리

임시로 쓴 버퍼를 다 쓴 뒤 정리한다.
- 힙에서 받은 메모리만 `free()` 대상이다.

**함수**

```c
void free_stack_addr_bad(void);
int  alloc_and_free_good(void);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| (해당 없음) | — | `free()` 대상 오분류(스택 주소를 힙 포인터로 착각) 자체가 결함이다 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 스택 배열 `p`를 그대로 `free(p)` | **`bad-free`로 크래시**(`expect_crash`가 감지) | `free()`가 관리하는 힙 메타데이터에 스택 주소가 없으니 즉시 위반이 드러난다 |
| 같은 상황(Good) | 정상 종료 | `malloc`으로 받은 포인터만 `free`한다 |

### 1-B. 변형 B — `strtok()` 반환값을 `free()`하는 실수로 변형

가이드 원문처럼 `strtok(str, " ,.-")`의 반환값을 순회하며 실수로 `free(pch)`를 호출하는 버전을 만들어본다 — `strtok`은 원본 문자열 내부를 가리킬 뿐 아무것도 할당하지 않는다는 걸 크래시로 확인한다

### 1-C. 변형 C — 이중 해제(double free)로 확장

이번엔 진짜 `malloc` 포인터를 두 번 연속 `free()`하는 함수를 만들어, "malloc 포인터라도 한 번만 해제해야 한다"는 별개의 규칙까지 재현한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `alloc_and_free_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void free_stack_addr_bad(void)
{
    /* 1. char p[10]
     * 2. free(p)   ← 스택 주소 해제
     *    (gcc 경고는 pragma 로 끈다, §3 의 WARNING 참고) */
}

int alloc_and_free_good(void)
{
    /* [ ] 1. char *p = malloc(10)
     *        NULL 이면 → return -1 */

    /* [ ] 2. p[0] = 'x'   (사용) */

    /* [ ] 3. free(p)   ← malloc 으로 받은 포인터만 해제 */

    /* [ ] 4. return 0 */
}
```

### 2-B. `alloc_and_free_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int alloc_and_free_good(void)
{
    /* [ ] 1. char *p = malloc(10) */

    /* [ ] 2. p[0] = 'x'   (사용) */

    /* [ ] 3. free(p)   ← malloc 으로 받은 포인터만 해제 */

    /* [ ] 4. return 0 */
}
```

### 2-C. `alloc_and_free_good` — Level 3 (3회차, 백지)

```c
int alloc_and_free_good(void)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 선언 방식(`char p[10]` vs `char *p = malloc`) 이 해제 가능 여부를 결정한다
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
sd49_badfree/src/badfree.h
sd49_badfree/src/badfree.c
sd49_badfree/test/test.c
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
#include "badfree.h"

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

static void test_bad_is_vulnerable(void)
{
    T_TRUE(expect_crash(free_stack_addr_bad) == 1,
        "Bad는 malloc으로 받지 않은 스택 주소를 free해 크래시해야 한다(취약점 재현)");
}

static void test_good_normal(void)
{
    T_TRUE(alloc_and_free_good() == 0, "Good은 malloc으로 받은 주소만 free하므로 정상 종료해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!WARNING] `free_stack_addr_bad`를 그대로 타이핑하면 컴파일이 안 될 수 있다
> `free(p)` 에 스택 배열을 넘기면 gcc 가 `-Wfree-nonheap-object` 로 **컴파일 타임에 잡아낸다.**
> `-Werror` 라 빌드가 실패한다.
> [SD38](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD38.%20제대로%20제어되지%20않은%20재귀%20—%20깊이%20제한%20동반으로%20치환.md), [SD47](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD47.%20스택%20변수%20주소%20리턴%20—%20힙%20할당%20반환으로%20치환.md)과 같은 방식으로 `#pragma GCC diagnostic push` / `ignored "-Wfree-nonheap-object"` / `pop` 으로 감싸 "의도적으로 재현한 버그"임을 명시한다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — `strtok()` 반환값을 `free()`하는 실수로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `strtok()` 반환값을 `free(pch)` | 비정상 동작 | `free` 하지 않는다 (원본 버퍼 소유) |
| 순회만 | 정상 | 정상 |

**변형 C — 이중 해제(double free)로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 진짜 `malloc` 포인터를 두 번 `free` | 이중 해제 | 해제 후 `p = NULL` 로 한 번만 |
| 한 번만 해제 | 정상 | 정상 |

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
make D=sd49_badfree V=main SRC="sd49_badfree/src/badfree.c sd49_badfree/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd49_badfree/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd49_badfree/src/badfree.c sd49_badfree/test/test.c \
>     -pthread -o build/sd49_badfree_main
> ./build/sd49_badfree_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "포인터가 유효해 보이니 괜찮다"고 판단 | `free()`의 정당성은 "가리키는 메모리가 유효한가"가 아니라 **"malloc 계열이 반환한 그 주소인가"**다.<br>스택 주소도 함수가 살아있는 동안은 완전히 유효한 메모리지만 `free()` 대상은 아니다 |
| 라이브러리 함수의 반환값을 볼 때마다 "할당 여부"를 확인하지 않음 | `strtok()`, `getenv()`, `ctime()` 등 많은 표준 함수가 "내부 정적 버퍼" 또는 "입력 문자열 내부"를 가리키는 포인터를 반환한다.<br>반환값을 받을 때마다 매뉴얼에서 "할당된 메모리인가"를 확인하는 습관이 필요하다 |
| `free()` 이후 포인터를 `NULL`로 안 만듦(이 드릴 자체보단 습관 문제) | 이 항목의 핵심은 아니지만, `free(p)` 직후 `p = NULL;`을 습관화하면 실수로 같은 포인터를 다시 `free()`하는 이중 해제(변형 C)를 예방하는 데 도움이 된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `badfree.h` / `badfree.c`
> ```c
> #ifndef BADFREE_H
> #define BADFREE_H
> void free_stack_addr_bad(void);
> int  alloc_and_free_good(void);
> #endif
> ```
> ```c
> #include <stdlib.h>
> #include "badfree.h"
>
> #pragma GCC diagnostic push
> #pragma GCC diagnostic ignored "-Wpragmas"
> #pragma GCC diagnostic ignored "-Wfree-nonheap-object"
> void free_stack_addr_bad(void)
> {
>     char p[10];
>     free(p);                          /* 스택 주소 해제 -> 비정상 동작 */
> }
> #pragma GCC diagnostic pop
>
> int alloc_and_free_good(void)
> {
>     char *p = (char *)malloc(10);
>     if (!p) return -1;
>     p[0] = 'x';                       /* 사용 */
>     free(p);                          /* malloc으로 받은 포인터만 해제 */
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `free_stack_addr_bad`의 `p`는 `char p[10]`(스택 배열)이고, `alloc_and_free_good`의 `p`는 `char *p = malloc(10)`(힙 포인터)이다.
> **선언 방식 하나가 그 변수를 `free()`해도 되는지 여부를 완전히 결정한다** — 변수 이름도 크기도 똑같은데 말이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD48. 매크로의 잘못된 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD48.%20매크로의%20잘못된%20사용%20—%20짝%20매크로%20동반으로%20치환.md)
- [다음: SD50. 스레드 조기 종료](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD50.%20코드정확성%20스레드%20조기%20종료%20—%20join%20또는%20detach%20명시로%20치환.md)
