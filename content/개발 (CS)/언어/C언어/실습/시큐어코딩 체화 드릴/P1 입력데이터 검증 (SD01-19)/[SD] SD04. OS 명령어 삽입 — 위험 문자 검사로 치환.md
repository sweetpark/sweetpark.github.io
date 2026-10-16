---
title: "SD04. OS 명령어 삽입 — 위험 문자 검사로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD04. OS 명령어 삽입 — 위험 문자 검사로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 4. 운영체제 명령어 삽입](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#4-운영체제-명령어-삽입-cwe-78) `CWE-78`
> **repo 폴더**: `sd04_oscmd/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> `system()` 을 실제로 호출하면 위험하므로, "몇 개의 명령이 실행될 것인가"만 세는 `mock_shell` 로 재현한다.
> 이 mock은 미리 제공된다.

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
- snprintf(cmd, sizeof(cmd), "cat %s", userArg);           /* 검증 없이 조립 */
+ if (strpbrk(userArg, ";|&`$\\\"'") != NULL) return -1;   /* 위험 문자 있으면 거부 */
+ snprintf(cmd, sizeof(cmd), "cat %s", userArg);
```

> [!NOTE] PDF 원문과 다른 점
> 원문 가이드는 위험 문자로 `; \ " ' .` 을 검사하라고 하지만, `.` 은 파일 확장자(`Story.txt`)에 정상적으로 쓰이는 문자라 그대로 적용하면 정상 케이스까지 막힌다.
> 이 드릴에서는 **셸 메타문자만**(`; | & `` ` `` $ \ " '`) 검사한다 — 근본적으로는 `system()` 자체를 없애고 `execve()` 계열로 인자를 배열 분리하는 것이 정답이다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 파일 출력 명령 조립 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 압축 명령 조립 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 허용 명령 화이트리스트로 전환 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-0. 환경 코드 — `mock_shell` (미리 제공, 타이핑하지 않음)

> [!NOTE]- `sd04_oscmd/src/mock_shell.h` / `mock_shell.c` — repo에 이미 있다
> ```c
> /* mock_shell.h */
> #ifndef MOCK_SHELL_H
> #define MOCK_SHELL_H
> /* 실제로 실행하지 않고 ';' 로 구분되는 "명령 개수"만 센다.
>    진짜 셸이라면 이 개수만큼 프로세스가 실행된다. */
> int mock_shell_command_count(const char *cmdline);
> #endif
> ```
> ```c
> /* mock_shell.c */
> #include "mock_shell.h"
> int mock_shell_command_count(const char *cmdline)
> {
>     int count = 1;
>     const char *p;
>     for (p = cmdline; *p; p++) if (*p == ';') count++;
>     return count;
> }
> ```

### 1-A. 변형 A — 파일 출력 명령 조립

사용자가 지정한 파일명(`userArg`)으로 `cat <파일명>` 명령을 조립해 실행한다.
- 조립된 명령이 실제로 몇 개의 명령으로 나뉘어 실행될지(`mock_shell_command_count`)를 반환한다.
- 정상 파일명은 항상 명령 1개로 끝나야 한다.

**함수**

```c
int build_and_count_bad(const char *userArg);
int build_and_count_good(const char *userArg);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `userArg` | 외부(표준입력) | `system()` 에 전달될 명령 문자열 |

#### 공격 입력표

| 입력 | Bad 결과(명령 개수) | 이유 |
| :--- | :--- | :--- |
| `Story.txt` (정상) | 1 | 정상 동작 |
| `Story.txt; ls` | **2** | 세미콜론 뒤 `ls` 가 별도 명령으로 실행된다 |
| `Story.txt \ | rm -rf /` | (파이프, mock에서는 명령 1개로 세지만 실제 셸에서는 위험) | Good에서 파이프도 함께 차단 |

### 1-B. 변형 B — 압축 명령 조립

`gzip <로그파일명>` 형태.
위험 문자에 `>`(리다이렉트)도 추가해야 하는 이유를 생각해본다

### 1-C. 변형 C — 허용 명령 화이트리스트로 전환

위험 문자 블랙리스트 대신, 미리 정의한 명령 후보 목록(`{"cat","gzip","ls"}`)에서만 선택하도록 바꾼다 — 가이드 원문이 제시하는 더 근본적인 해법

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `build_and_count_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int build_and_count_bad(const char *userArg)
{
    /* 1. char cmd[256]
     * 2. snprintf(cmd, sizeof(cmd), "cat %s", userArg)   ← 검증 없이 조립
     * 3. return mock_shell_command_count(cmd) */
}

int build_and_count_good(const char *userArg)
{
    /* [ ] 1. 지역변수
     *        char cmd[256] */

    /* [ ] 2. 위험 문자 검사 (조립 전)
     *        strpbrk(userArg, 셸 메타문자) != NULL → return -1
     *        셸 메타문자: ; | & ` $ \ " '
     *        '.' 은 넣지 않는다 (확장자에 쓰인다) */

    /* [ ] 3. snprintf 로 "cat %s" 조립 */

    /* [ ] 4. return mock_shell_command_count(cmd) */
}
```

### 2-B. `build_and_count_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int build_and_count_good(const char *userArg)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. 위험 문자 검사 (조립 전) */

    /* [ ] 3. snprintf 로 "cat %s" 조립 */

    /* [ ] 4. return mock_shell_command_count(cmd) */
}
```

### 2-C. `build_and_count_good` — Level 3 (3회차, 백지)

```c
int build_and_count_good(const char *userArg)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `strpbrk` 의 헤더 (`<string.h>`)
     *   - C 문자열 안에서 `\` 와 `"` 이스케이프
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
sd04_oscmd/src/mock_shell.h    (제공됨)
sd04_oscmd/src/mock_shell.c    (제공됨)
sd04_oscmd/src/cmd_builder.h   (직접 타이핑)
sd04_oscmd/src/cmd_builder.c   (직접 타이핑)
sd04_oscmd/test/test.c         (직접 타이핑)
```

> [!IMPORTANT] 시험 구조는 고정이다 (SD01~SD58 공통)
> 1. **Bad 가 실제로 뚫린다.**
>    이 시험이 실패하면 Bad 를 잘못 옮겨 적은 것이다.
> 2. **Bad 도 정상 입력은 처리한다.**
> 3. **Good 이 같은 공격을 막는다.**
> 4. **Good 이 정상 입력까지 막지 않는다.** (과잉 차단 없음)

### 3-A. 변형 A 시험 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "cmd_builder.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(build_and_count_bad("Story.txt; ls") == 2,
        "Bad는 세미콜론 뒤 명령이 추가로 실행되어야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    T_TRUE(build_and_count_bad("Story.txt") == 1, "정상 입력은 명령 1개");
}

static void test_good_blocks_injection(void)
{
    T_TRUE(build_and_count_good("Story.txt; ls") == -1, "Good은 위험 문자를 거부해야 한다");
    T_TRUE(build_and_count_good("Story.txt | rm -rf /") == -1, "파이프도 거부");
}

static void test_good_normal(void)
{
    T_TRUE(build_and_count_good("Story.txt") == 1, "Good도 정상 파일명은 그대로 통과(점 포함)");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_injection();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 압축 명령 조립**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `a.log > /etc/passwd` | 리다이렉트로 덮어쓴다 | 거부 (-1) — `>` 추가 |
| `app.log` | 명령 1개 | 명령 1개 |

**변형 C — 허용 명령 화이트리스트로 전환**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `cat; rm -rf /` | 명령 2개 | 화이트리스트에 없는 명령 → 거부 (-1) |
| `gzip` | 정상 | 허용 목록에 있어 통과 |

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
make D=sd04_oscmd V=main SRC="sd04_oscmd/src/mock_shell.c sd04_oscmd/src/cmd_builder.c sd04_oscmd/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd04_oscmd/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd04_oscmd/src/mock_shell.c sd04_oscmd/src/cmd_builder.c sd04_oscmd/test/test.c \
>     -pthread -o build/sd04_oscmd_main
> ./build/sd04_oscmd_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| PDF 원문 그대로 `.` 을 위험 문자에 넣음 | 정상 파일 확장자까지 차단(과잉 차단) — 요구사항과 실제 위협을 구분하지 못한 것 |
| 세미콜론만 막고 파이프(`\ | `)·백틱을 빠뜨림 | 셸 메타문자는 세미콜론 하나가 아니다.<br>`` `cmd` ``, `$(cmd)` 도 명령 실행이다 |
| 위험 문자 검사를 `system()` 호출 **직전이 아니라** 다른 곳에서 함 | 검증과 사용 사이에 값이 바뀔 여지가 있으면 안 된다 — 조립 직전에 검사 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `cmd_builder.h` / `cmd_builder.c`
> **헤더 (`cmd_builder.h`)**
> ```c
> #ifndef CMD_BUILDER_H
> #define CMD_BUILDER_H
> int build_and_count_bad(const char *userArg);
> int build_and_count_good(const char *userArg);
> #endif
> ```
> **구현 (`cmd_builder.c`)**
> ```c
> #include <stdio.h>
> #include <string.h>
> #include "mock_shell.h"
> #include "cmd_builder.h"
>
> int build_and_count_bad(const char *userArg)
> {
>     char cmd[256];
>     snprintf(cmd, sizeof(cmd), "cat %s", userArg);
>     return mock_shell_command_count(cmd);
> }
>
> /* 셸 메타문자만 검사한다. '.' 은 뺀다 — 파일 확장자에 정상적으로 쓰이기 때문이다. */
> int build_and_count_good(const char *userArg)
> {
>     char cmd[256];
>     if (strpbrk(userArg, ";|&`$\\\"'") != NULL) return -1;
>     snprintf(cmd, sizeof(cmd), "cat %s", userArg);
>     return mock_shell_command_count(cmd);
> }
> ```
>
> **눈여겨볼 점**: `build_and_count_good` 도 여전히 `system()`(mock)에 문자열을 넘긴다 — 블랙리스트는 **차선책**이다.
> 최종적으로는 `execve("cat", (char *[]){"cat", userArg, NULL}, ...)` 처럼 셸을 아예 거치지 않는 것이 정답이라는 걸 잊지 않는다(변형 C에서 화이트리스트로 한 걸음 더 나아간다).

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD03. 크로스사이트 스크립트](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD03.%20크로스사이트%20스크립트%20—%20출력%20직전%20HTML%20이스케이프로%20치환.md)
- [다음: SD05. LDAP 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD05.%20LDAP%20삽입%20—%20영숫자%20화이트리스트로%20치환.md)
