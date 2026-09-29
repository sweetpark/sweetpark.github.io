---
title: "SD04. OS 명령어 삽입 — 위험 문자 검사로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD04. OS 명령어 삽입 — 위험 문자 검사로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 4. 운영체제 명령어 삽입](../../시큐어코딩가이드/Part%201.%20입력데이터%20검증%20및%20표현/%5B시큐어코딩%5D%201-1.%20삽입(Injection)%20계열.md#4-운영체제-명령어-삽입-cwe-78) `CWE-78`
> **repo 폴더**: `sd04_oscmd/` (`make D=sd04_oscmd T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> `system()` 을 실제로 호출하면 위험하므로, "몇 개의 명령이 실행될 것인가"만 세는 `mock_shell` 로 재현한다. 이 mock은 미리 제공된다.

---

## 0. 이 드릴로 체화할 것

```diff
- snprintf(cmd, sizeof(cmd), "cat %s", userArg);           /* 검증 없이 조립 */
+ if (strpbrk(userArg, ";|&`$\\\"'") != NULL) return -1;   /* 위험 문자 있으면 거부 */
+ snprintf(cmd, sizeof(cmd), "cat %s", userArg);
```

> [!NOTE] PDF 원문과 다른 점
> 원문 가이드는 위험 문자로 `; \ " ' .` 을 검사하라고 하지만, `.` 은 파일 확장자(`Story.txt`)에 정상적으로 쓰이는 문자라 그대로 적용하면 정상 케이스까지 막힌다. 이 드릴에서는 **셸 메타문자만**(`; | & `` ` `` $ \ " '`) 검사한다 — 근본적으로는 `system()` 자체를 없애고 `execve()` 계열로 인자를 배열 분리하는 것이 정답이다.

---

## 1. 환경 코드 — `mock_shell` (미리 제공, 타이핑하지 않음)

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

---

## 2. 취약 시나리오 — 변형 A: 파일 출력 명령 조립

> [!QUOTE] 요구사항서 (발췌)
> 사용자가 지정한 파일명(`userArg`)으로 `cat <파일명>` 명령을 조립해 실행한다.
> - 조립된 명령이 실제로 몇 개의 명령으로 나뉘어 실행될지(`mock_shell_command_count`)를 반환한다.
> - 정상 파일명은 항상 명령 1개로 끝나야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `userArg` | 외부(표준입력) | `system()` 에 전달될 명령 문자열 |

### 공격 입력표

| 입력 | Bad 결과(명령 개수) | 이유 |
| :--- | :--- | :--- |
| `Story.txt` (정상) | 1 | 정상 동작 |
| `Story.txt; ls` | **2** | 세미콜론 뒤 `ls` 가 별도 명령으로 실행된다 |
| `Story.txt \| rm -rf /` | (파이프, mock에서는 명령 1개로 세지만 실제 셸에서는 위험) | Good에서 파이프도 함께 차단 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | `cat` 명령 조립 | 위 내용 |
| **B (2회차)** | **압축 명령 조립** | `gzip <로그파일명>` 형태. 위험 문자에 `>`(리다이렉트)도 추가해야 하는 이유를 생각해본다 |
| **C (3회차)** | **허용 명령 화이트리스트로 전환** | 위험 문자 블랙리스트 대신, 미리 정의한 명령 후보 목록(`{"cat","gzip","ls"}`)에서만 선택하도록 바꾼다 — 가이드 원문이 제시하는 더 근본적인 해법 |

---

## 3. 제출물

```text
sd04_oscmd/src/mock_shell.h    (제공됨)
sd04_oscmd/src/mock_shell.c    (제공됨)
sd04_oscmd/src/cmd_builder.h   (직접 타이핑)
sd04_oscmd/src/cmd_builder.c   (직접 타이핑)
sd04_oscmd/test/test.c         (직접 타이핑)
```

### 시험 코드 — 이 형태를 고정한다

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

---

## 4. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 — Bad가 실제로 명령 2개로 늘어난다 | 20 | ☐ |
| `test_good_blocks_injection` 통과(세미콜론·파이프 모두) | 25 | ☐ |
| `test_good_normal` 통과 — 점(`.`)이 포함된 정상 파일명이 통과한다 | 20 | ☐ |
| 위험 문자 집합에 `; \| & `` ` `` $ \ " '` 이 모두 포함된다 | 20 | ☐ |
| `.` 을 위험 문자에서 뺀 이유를 한 줄로 설명할 수 있다 | 10 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 5. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| PDF 원문 그대로 `.` 을 위험 문자에 넣음 | 정상 파일 확장자까지 차단(과잉 차단) — 요구사항과 실제 위협을 구분하지 못한 것 |
| 세미콜론만 막고 파이프(`\|`)·백틱을 빠뜨림 | 셸 메타문자는 세미콜론 하나가 아니다. `` `cmd` ``, `$(cmd)` 도 명령 실행이다 |
| 위험 문자 검사를 `system()` 호출 **직전이 아니라** 다른 곳에서 함 | 검증과 사용 사이에 값이 바뀔 여지가 있으면 안 된다 — 조립 직전에 검사 |

---

## 6. 모범답안 (변형 A)

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
> **눈여겨볼 점**: `build_and_count_good` 도 여전히 `system()`(mock)에 문자열을 넘긴다 — 블랙리스트는 **차선책**이다. 최종적으로는 `execve("cat", (char *[]){"cat", userArg, NULL}, ...)` 처럼 셸을 아예 거치지 않는 것이 정답이라는 걸 잊지 않는다(변형 C에서 화이트리스트로 한 걸음 더 나아간다).

---

## 7. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (cat) |  |  |  |
| 2 |  | B (gzip) |  |  |  |
| 3 |  | C (화이트리스트) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD03. 크로스사이트 스크립트](%5BSD%5D%20SD03.%20크로스사이트%20스크립트%20—%20출력%20직전%20HTML%20이스케이프로%20치환.md)
- [다음: SD05. LDAP 삽입](%5BSD%5D%20SD05.%20LDAP%20삽입%20—%20영숫자%20화이트리스트로%20치환.md)
