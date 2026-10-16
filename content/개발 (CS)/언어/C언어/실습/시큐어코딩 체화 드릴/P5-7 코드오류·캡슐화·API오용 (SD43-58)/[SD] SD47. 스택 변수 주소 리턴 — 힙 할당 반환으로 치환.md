---
title: "SD47. 스택 변수 주소 리턴 — 힙 할당 반환으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD47. 스택 변수 주소 리턴 — 힙 할당 반환으로 치환

> **원본 항목**: [Part 5. 코드 오류 — 5. 스택 변수 주소 리턴](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#5-스택-변수-주소-리턴-cwe-562) `CWE-562`
> **repo 폴더**: `sd47_stackret/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> **진짜 UB**(지역 변수 주소 반환)를 역참조해서 크래시로 재현한다.
> gcc 는 `return p;`(지역 배열 주소)를 컴파일 타임에 `NULL` 반환으로 바꿔 버리므로(clang 의 ASan `stack-use-after-return` 과 다르다), 크래시는 **직접 바이트 역참조**(`p[0]`)할 때 NULL 역참조(SEGV)로 나타난다.
> `printf("%s", p)` 처럼 문자열 전체를 넘기는 경로는 glibc 가 `(null)` 로 찍고 지나가므로 크래시가 재현되지 않는다는 것 자체가 이 드릴의 숨은 교훈이다.

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
  char *rpl(void) {
      char p[10];
      strcpy(p, "SECRET123");
-     return p;                              /* 함수 종료 시 소멸되는 주소 */
+     char *buf = (char *)malloc(10);
+     if (!buf) return NULL;
+     memcpy(buf, p, 10);
+     return buf;                            /* 함수 종료 후에도 유효, 호출자가 free */
  }
```

지역 배열은 함수가 끝나는 순간 사라지는 임시 좌표일 뿐이다.
그 주소를 밖으로 내보내는 순간, 받은 쪽은 이미 무효한 메모리를 붙들게 된다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 임시 문자열 조립 함수 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 호출자 제공 버퍼 방식으로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** `static` 버퍼로 "고친" 척하는 함정 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 임시 문자열 조립 함수

내부에서 조립한 문자열을 호출자에게 돌려준다.
- 호출자는 반환된 포인터를 함수 호출 이후에도 계속 읽을 수 있어야 한다.

**함수**

```c
char *rpl_bad(void);
char *rpl_good(void);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 함수가 반환하는 포인터 | 함수 내부의 지역 배열 주소 | 호출자가 함수 종료 이후에도 유효하다고 가정하고 읽는 지점 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 반환된 포인터를 직접 역참조(`p[0]`) | **크래시**(gcc: NULL 역참조 SEGV, clang+ASan: `stack-use-after-return`) — `expect_crash`가 감지 | 함수가 끝나며 그 스택 프레임은 이미 무효화됐다 — gcc 는 이를 아예 `NULL` 반환으로 바꿔 버린다 |
| 같은 반환값을 `printf("%s", p)` 처럼 라이브러리 경유로 읽음 | **크래시하지 않고 `(null)` 이 찍히거나(gcc), 값이 그대로 보일 수 있음**(clang) | 라이브러리 함수는 NULL 을 걸러 주거나 ASan 이 계측하지 않은 경로를 탈 수 있다 — "크래시가 안 났다"가 "안전하다"는 뜻이 아니다 |
| 같은 상황(Good) | 힙 메모리이므로 언제 읽어도 유효 | `malloc`으로 받은 메모리는 `free`하기 전까지 계속 존재한다 |

### 1-B. 변형 B — 호출자 제공 버퍼 방식으로 변형

`malloc` 대신 `void rpl_good_buf(char *out, size_t out_size)` 형태로 바꿔, 호출자가 미리 준비한 버퍼에 채워 넣는 또 다른 표준 치환 방식을 익힌다(이 방식은 `free` 책임 자체가 아예 사라진다)

### 1-C. 변형 C — `static` 버퍼로 "고친" 척하는 함정

`char p[10]`을 `static char p[10]`으로만 바꾼 버전을 만들어본다.
크래시는 사라지지만, 같은 함수를 연달아 두 번 호출하면 첫 번째 호출 결과가 두 번째 호출로 덮어써진다는 걸 직접 확인해 "크래시가 없다고 안전한 게 아니다"를 다시 한 번 체감한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `rpl_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
char *rpl_bad(void)
{
    /* 1. char p[10]
     * 2. strcpy(p, "SECRET123")
     * 3. return p   ← 함수가 끝나면 사라지는 스택 주소
     *    (gcc 경고는 pragma 로 끈다, §3 의 WARNING 참고) */
}

char *rpl_good(void)
{
    /* [ ] 1. 지역변수
     *        char p[10], char *buf */

    /* [ ] 2. buf = malloc(10)
     *        NULL 이면 → return NULL */

    /* [ ] 3. strcpy(p, "SECRET123") */

    /* [ ] 4. memcpy(buf, p, 10)   ← 힙으로 복사 */

    /* [ ] 5. return buf   (호출자가 free) */
}
```

### 2-B. `rpl_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
char *rpl_good(void)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. buf = malloc(10) */

    /* [ ] 3. strcpy(p, "SECRET123") */

    /* [ ] 4. memcpy(buf, p, 10)   ← 힙으로 복사 */

    /* [ ] 5. return buf   (호출자가 free) */
}
```

### 2-C. `rpl_good` — Level 3 (3회차, 백지)

```c
char *rpl_good(void)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 핵심은 지역 변수를 없애는 게 아니라 **밖으로 나가는 주소가 어디인가**
     *   - 호출자가 `free` 하는 것까지 시험에 넣는다
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
sd47_stackret/src/stackret.h
sd47_stackret/src/stackret.c
sd47_stackret/test/test.c
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
#include "stackret.h"

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

static void call_bad(void)
{
    char *p = rpl_bad();
    char c = p[0];             /* 한 바이트라도 직접 역참조해야 ASan이 감지한다 */
    (void)c;
}

static void test_bad_is_vulnerable(void)
{
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad가 반환한 포인터를 역참조하면 크래시해야 한다(취약점 재현)");
}

static void test_good_is_valid_after_return(void)
{
    char *g = rpl_good();
    T_TRUE(g != NULL, "Good은 힙 할당에 성공해야 한다");
    T_TRUE(strcmp(g, "SECRET123") == 0, "Good이 반환한 메모리는 함수 종료 후에도 내용이 그대로 유지돼야 한다");
    free(g);
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_is_valid_after_return();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!WARNING] `rpl_bad`를 그대로 타이핑하면 컴파일이 안 될 수 있다
> `return p;`(지역 배열 반환)는 gcc 가 `-Wreturn-local-addr` 로 **컴파일 타임에 경고**한다.
> 이 프로젝트는 `-Werror` 라 경고가 곧 빌드 실패다.
> [SD38](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD38.%20제대로%20제어되지%20않은%20재귀%20—%20깊이%20제한%20동반으로%20치환.md)에서 썼던 것과 같은 방식으로, `rpl_bad` 함수 앞뒤를 `#pragma GCC diagnostic push` / `ignored "-Wreturn-local-addr"`(와 `-Wdangling-pointer`) / `pop` 으로 감싸 "의도적으로 재현한 버그"라고 컴파일러에 알린다.

> [!NOTE] 왜 직접 `p[0]`으로 읽어야 크래시가 나는가
> `printf("%s", p)`처럼 문자열 전체를 한 번에 다루는 라이브러리 함수는 glibc 가 NULL 을 `(null)` 로 처리하거나, ASan 이 계측하지 않은 최적화된 경로(SIMD 스캔 등)를 탈 수 있어, 무효한 포인터를 읽고 있어도 크래시 없이 지나간다.
> 반면 `p[0]`처럼 컴파일러가 직접 생성한 단순 메모리 접근은 gcc 에서는 NULL 역참조(SEGV)로, ASan 이 심어둔 검사 코드가 있는 clang 에서는 `stack-use-after-return` 으로 반드시 걸린다.
> **"크래시가 재현이 안 됐다"가 "버그가 없다"의 증거가 아니라는 것** 자체가 이 항목의 핵심 위험이다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 호출자 제공 버퍼 방식으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `void rpl_good_buf(char *out, size_t out_size)` | 스택 주소 반환 | 호출자 버퍼에 복사 |
| 충분한 `out_size` | 정상 | 정상 |

**변형 C — `static` 버퍼로 "고친" 척하는 함정**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `static char p[10]` 로만 바꾼 버전, 연속 두 번 호출 | 두 결과가 같은 주소를 공유해 서로 덮는다 | 호출마다 독립된 힙 버퍼 |
| 한 번 호출 | 정상 | 정상 |

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
make D=sd47_stackret V=main SRC="sd47_stackret/src/stackret.c sd47_stackret/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd47_stackret/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd47_stackret/src/stackret.c sd47_stackret/test/test.c \
>     -pthread -o build/sd47_stackret_main
> ./build/sd47_stackret_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `p`를 `static char p[10]`으로 바꿔서 "고쳤다"고 생각 | 크래시는 사라지지만 함수가 재진입되거나 여러 스레드에서 동시에 불리면 이전 호출의 결과가 덮어써진다.<br>변형 C에서 직접 겪어봐야 하는 함정이다 |
| Good에서 `malloc` 실패(`NULL`) 검사를 빼먹음 | 힙 할당도 실패할 수 있다.<br>`if (!buf) return NULL;` 없이 바로 `memcpy`하면 NULL 포인터 역참조([SD43](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD43.%20널%20포인터%20역참조%20—%20반환값%20검사%20후%20사용으로%20치환.md))로 새로운 버그가 생긴다 |
| Good이 반환한 메모리를 호출자가 `free`하지 않음 | 이 함수는 "힙에 할당해서 반환"하는 계약이므로 소유권이 호출자에게 넘어간다.<br>`free`를 잊으면 이번엔 메모리 누수([SD44](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD44.%20부적절한%20자원%20해제%20—%20단일%20해제%20지점으로%20치환.md))가 된다 — 한 취약점을 고치다 다른 취약점을 만들지 않도록 계약을 명확히 하라 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `stackret.h` / `stackret.c`
> ```c
> #ifndef STACKRET_H
> #define STACKRET_H
> char *rpl_bad(void);
> char *rpl_good(void);
> #endif
> ```
> ```c
> #include <string.h>
> #include <stdlib.h>
> #include "stackret.h"
>
> #pragma GCC diagnostic push
> #pragma GCC diagnostic ignored "-Wpragmas"
> #pragma GCC diagnostic ignored "-Wreturn-local-addr"
> #pragma GCC diagnostic ignored "-Wdangling-pointer"
> char *rpl_bad(void)
> {
>     char p[10];
>     strcpy(p, "SECRET123");
>     return p;                    /* 스택 지역 배열의 주소 반환 -- 함수 종료 시 소멸 */
> }
> #pragma GCC diagnostic pop
>
> char *rpl_good(void)
> {
>     char p[10];
>     char *buf = (char *)malloc(10);
>     if (!buf) return NULL;
>     strcpy(p, "SECRET123");
>     memcpy(buf, p, 10);
>     return buf;                  /* 힙에 있으므로 함수 종료 후에도 유효 -- 호출자가 free */
> }
> ```
>
> **눈여겨볼 점**: `rpl_good`은 여전히 지역 배열 `p`를 쓰지만, **반환하는 것은 `p`가 아니라 `buf`**(힙 주소)다.
> 지역 변수 자체를 없애는 게 핵심이 아니라, **"함수 밖으로 나가는 주소가 어디를 가리키는가"**가 핵심이라는 걸 이 한 줄 차이(`return p;` vs `return buf;`)로 체감한다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD46. 정수를 문자로 변환](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD46.%20정수를%20문자로%20변환%20—%20용도에%20맞는%20타입%20선언으로%20치환.md)
- [다음: SD48. 매크로의 잘못된 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD48.%20매크로의%20잘못된%20사용%20—%20짝%20매크로%20동반으로%20치환.md)
