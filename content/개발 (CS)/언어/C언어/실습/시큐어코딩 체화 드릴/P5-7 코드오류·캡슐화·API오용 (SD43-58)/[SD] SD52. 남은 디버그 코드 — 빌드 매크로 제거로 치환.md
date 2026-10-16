---
title: "SD52. 남은 디버그 코드 — 빌드 매크로 제거로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD52. 제거되지 않고 남은 디버그 코드 — 빌드 매크로 제거로 치환

> **원본 항목**: [Part 6. 캡슐화 — 1. 제거되지 않고 남은 디버그 코드](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%206.%20캡슐화.md#1-제거되지-않고-남은-디버그-코드-cwe-489) `CWE-489`
> **repo 폴더**: `sd52_debugcode/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> Part 6(캡슐화, 2개)의 첫 드릴이다.
> `stdout`을 임시 파일로 가로채는 기법으로 "이 빌드가 정말로 디버그 메시지를 찍는가"를 **출력 내용 자체**로 검증한다.

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
- puts("Debug message");        /* 배포본에 남은 디버그 출력 -- 조건 없이 항상 실행 */
+ #ifdef DEBUG_ENABLE
+ #define DEBUG_LOG(message) do { puts(message); } while (0)
+ #else
+ #define DEBUG_LOG(message) do { } while (0)   /* 배포 시 아무것도 안 함 */
+ #endif
+ DEBUG_LOG("Debug message");
```

디버그 코드는 "지우거나 `#ifdef`로 감싸거나" 둘 중 하나다.
조건 없이 그냥 남겨두는 선택지는 없다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 디버그 로그 출력 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 숨은 관리자 진입점으로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 여러 디버그 지점을 한 매크로로 통합 관리 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 디버그 로그 출력

개발 중에는 디버그 메시지를 볼 수 있어야 한다.
- 배포 빌드(기본 빌드, `DEBUG_ENABLE` 미정의)에서는 어떤 디버그 메시지도 출력되어서는 안 된다.

**함수**

```c
void debug_output_bad(void);
void debug_output_good(void);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 디버그 출력 코드 | 개발 단계에 추가한 임시 코드 | 조건부 컴파일 없이 그대로 남아 배포 빌드에 포함되는 지점 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 기본(배포) 빌드에서 함수 호출 | **`"Debug message"`가 그대로 출력됨** | `puts()`가 아무 조건 없이 호출된다 |
| 같은 상황(Good, `DEBUG_ENABLE` 미정의) | **아무 것도 출력되지 않음** | `DEBUG_LOG` 매크로가 `#else` 분기로 빈 문장이 된다 |
| `-DDEBUG_ENABLE`로 다시 빌드(Good) | 필요하면 다시 출력됨 | 개발 중에는 매크로 하나로 다시 켤 수 있다(직접 확인해볼 것) |

### 1-B. 변형 B — 숨은 관리자 진입점으로 변형

"디버그용으로 남긴 특수 명령줄 인자(`--debug-skip-auth`)가 인증을 건너뛰게 하는" 함수로 바꿔, 디버그 코드가 단순 로그가 아니라 백도어가 될 수 있음을 재현한다

### 1-C. 변형 C — 여러 디버그 지점을 한 매크로로 통합 관리

`DEBUG_LOG` 하나가 아니라 함수 3~4곳에 흩어진 디버그 출력을 전부 같은 매크로로 통일해, 배포 빌드 시 한 번의 재컴파일로 전부 꺼지는지 확인한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `debug_output_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void debug_output_bad(void)
{
    /* 1. puts("Debug message")   ← 배포본에도 조건 없이 항상 실행 */
}

void debug_output_good(void)
{
    /* [ ] 1. 헤더에 DEBUG_LOG 매크로 두 갈래
     *        #ifdef DEBUG_ENABLE
     *            #define DEBUG_LOG(message)  do { puts(message); } while (0)
     *        #else
     *            #define DEBUG_LOG(message)  do { } while (0)    ← 배포: 아무 일도 안 함
     *        #endif */

    /* [ ] 2. DEBUG_LOG("Debug message")   ← puts 대신 이 한 단어만 바뀐다 */
}
```

### 2-B. `debug_output_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void debug_output_good(void)
{
    /* [ ] 1. 헤더에 DEBUG_LOG 매크로 두 갈래 */

    /* [ ] 2. DEBUG_LOG("Debug message")   ← puts 대신 이 한 단어만 바뀐다 */
}
```

### 2-C. `debug_output_good` — Level 3 (3회차, 백지)

```c
void debug_output_good(void)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `do { ... } while (0)` 로 감싸는 이유
     *   - `DEBUG_ENABLE` 없이 빌드했을 때 출력이 **0 바이트**인지 확인
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
sd52_debugcode/src/debugcode.h
sd52_debugcode/src/debugcode.c
sd52_debugcode/test/test.c
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
#include <unistd.h>
#include "debugcode.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static int capture_output_contains(void (*fn)(void), const char *needle)
{
    char buf[256];
    FILE *tmp;
    int saved_fd, found;
    long n;

    memset(buf, 0, sizeof(buf));
    tmp = tmpfile();
    if (!tmp) return -1;

    fflush(stdout);
    saved_fd = dup(fileno(stdout));
    dup2(fileno(tmp), fileno(stdout));

    fn();

    fflush(stdout);
    dup2(saved_fd, fileno(stdout));
    close(saved_fd);

    rewind(tmp);
    n = (long)fread(buf, 1, sizeof(buf) - 1, tmp);
    (void)n;
    fclose(tmp);

    found = strstr(buf, needle) != NULL;
    return found;
}

static void test_bad_always_prints(void)
{
    T_TRUE(capture_output_contains(debug_output_bad, "Debug message") == 1,
        "Bad는 DEBUG_ENABLE 여부와 무관하게 항상 디버그 메시지를 출력해야 한다(취약점 재현)");
}

static void test_good_silent_in_release_build(void)
{
    T_TRUE(capture_output_contains(debug_output_good, "Debug message") == 0,
        "Good은 DEBUG_ENABLE 없이 빌드(기본 릴리스 빌드)하면 아무 것도 출력하지 않아야 한다");
}

int main(void)
{
    test_bad_always_prints();
    test_good_silent_in_release_build();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!TIP] 매크로가 진짜로 작동하는지 두 번 빌드해서 직접 확인
> 기본 빌드(§3-1 의 `make` 명령)에서는 `test_good_silent_in_release_build` 가 통과해야 한다.
> 그다음 `-DDEBUG_ENABLE` 을 추가해 다시 빌드하면 이번에는 그 테스트가 **일부러 실패**한다.
> `-DDEBUG_ENABLE` 빌드는 Makefile 의 `CFLAGS` 가 고정이라 순수 gcc 로 직접 컴파일한다.
> ```bash
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST -DDEBUG_ENABLE \
>     -Icommon -Isd52_debugcode/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd52_debugcode/src/debugcode.c sd52_debugcode/test/test.c \
>     -o build/sd52_debugcode_debug
> ./build/sd52_debugcode_debug
> ```
> Good 의 매크로가 `DEBUG_ENABLE` 유무에 따라 실제로 다르게 동작한다는 걸 두 눈으로 확인하는 과정이다.
> 이 실패는 코드가 잘못된 게 아니라 **매크로가 의도대로 작동한다는 증거**다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 숨은 관리자 진입점으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `--debug-skip-auth` 같은 숨은 진입점 | 인증을 건너뛴다 | `#ifdef DEBUG_ENABLE` 안에서만 존재 |
| 배포 빌드 | 건너뛴다 | 건너뛰지 못한다 |

**변형 C — 여러 디버그 지점을 한 매크로로 통합 관리**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 디버그 지점 3~4곳 | 각자 `puts` | 모두 `DEBUG_LOG` 로 통일 |
| 한 번의 재컴파일 (`-DDEBUG_ENABLE` 없음) | 출력 남음 | 전부 꺼짐 |

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
make D=sd52_debugcode V=main SRC="sd52_debugcode/src/debugcode.c sd52_debugcode/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd52_debugcode/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd52_debugcode/src/debugcode.c sd52_debugcode/test/test.c \
>     -pthread -o build/sd52_debugcode_main
> ./build/sd52_debugcode_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `#ifdef DEBUG_ENABLE`을 소스 파일 맨 위에서만 한 번 확인하고, 실제 출력 코드에는 조건을 안 걺 | 매크로 정의 여부를 확인하는 것과 그 조건으로 코드를 감싸는 것은 다른 일이다.<br>출력 코드 자체가 `#ifdef`/매크로 안에 있어야 한다 |
| 디버그 코드를 지우는 대신 `if (0)`으로 감싸 둠 | `if (0) { puts(...); }`은 컴파일러가 최적화로 없앨 수도 있지만 표준이 보장하지 않는다.<br>게다가 코드가 여전히 소스에 남아 검색·리뷰 시 "죽은 코드"인지 "곧 켤 코드"인지 헷갈린다.<br>`#ifdef`로 명확히 의도를 드러내야 한다 |
| 디버그 매크로 안에 실제 로직(부수효과가 있는 코드)까지 넣음 | `DEBUG_LOG(foo())`처럼 매크로 인자 안에서 부수효과가 있는 함수를 호출하면, `DEBUG_ENABLE`이 꺼졌을 때 그 함수 자체가 아예 실행되지 않아 로직이 달라질 수 있다.<br>디버그 매크로에는 순수 로깅만 넣는다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `debugcode.h` / `debugcode.c`
> ```c
> #ifndef DEBUGCODE_H
> #define DEBUGCODE_H
> #include <stdio.h>
> void debug_output_bad(void);
> #ifdef DEBUG_ENABLE
> #define DEBUG_LOG(message) do { puts(message); } while (0)
> #else
> #define DEBUG_LOG(message) do { } while (0)
> #endif
> void debug_output_good(void);
> #endif
> ```
> ```c
> #include "debugcode.h"
>
> void debug_output_bad(void)
> {
>     puts("Debug message");        /* 배포본에 남은 디버그 출력 -- 조건 없이 항상 실행 */
> }
>
> void debug_output_good(void)
> {
>     DEBUG_LOG("Debug message");   /* DEBUG_ENABLE 없이 빌드하면 아무 일도 안 함 */
> }
> ```
>
> **눈여겨볼 점**: `debug_output_good`의 코드는 `puts("Debug message")` 대신 `DEBUG_LOG("Debug message")` **한 단어**만 다르다.
> 실행 코드의 모양은 똑같이 유지하면서, "이게 켜질지 말지"를 컴파일 시점 매크로 하나로 완전히 분리해낸 것이 이 치환의 전부다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD51. 무한 자원 할당](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD51.%20무한%20자원%20할당%20—%20상한%20및%20풀로%20치환.md)
- [다음: SD53. 시스템 데이터 정보노출](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD53.%20시스템%20데이터%20정보노출%20—%20경로%20제외%20일반%20메시지로%20치환.md)
