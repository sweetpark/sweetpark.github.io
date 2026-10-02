---
title: "SD52. 남은 디버그 코드 — 빌드 매크로 제거로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD52. 제거되지 않고 남은 디버그 코드 — 빌드 매크로 제거로 치환

> **원본 항목**: [Part 6. 캡슐화 — 1. 제거되지 않고 남은 디버그 코드](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%206.%20캡슐화.md#1-제거되지-않고-남은-디버그-코드-cwe-489) `CWE-489`
> **repo 폴더**: `sd52_debugcode/` (`make D=sd52_debugcode T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> Part 6(캡슐화, 2개)의 첫 드릴이다. `stdout`을 임시 파일로 가로채는 기법으로 "이 빌드가 정말로 디버그 메시지를 찍는가"를 **출력 내용 자체**로 검증한다.

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

디버그 코드는 "지우거나 `#ifdef`로 감싸거나" 둘 중 하나다. 조건 없이 그냥 남겨두는 선택지는 없다.

---

## 1. 취약 시나리오 — 변형 A: 디버그 로그 출력

> [!QUOTE] 요구사항서 (발췌)
> 개발 중에는 디버그 메시지를 볼 수 있어야 한다.
> - 배포 빌드(기본 빌드, `DEBUG_ENABLE` 미정의)에서는 어떤 디버그 메시지도 출력되어서는 안 된다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 디버그 출력 코드 | 개발 단계에 추가한 임시 코드 | 조건부 컴파일 없이 그대로 남아 배포 빌드에 포함되는 지점 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 기본(배포) 빌드에서 함수 호출 | **`"Debug message"`가 그대로 출력됨** | `puts()`가 아무 조건 없이 호출된다 |
| 같은 상황(Good, `DEBUG_ENABLE` 미정의) | **아무 것도 출력되지 않음** | `DEBUG_LOG` 매크로가 `#else` 분기로 빈 문장이 된다 |
| `-DDEBUG_ENABLE`로 다시 빌드(Good) | 필요하면 다시 출력됨 | 개발 중에는 매크로 하나로 다시 켤 수 있다(직접 확인해볼 것) |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 디버그 로그 출력 | 위 내용 |
| **B (2회차)** | **숨은 관리자 진입점으로 변형** | "디버그용으로 남긴 특수 명령줄 인자(`--debug-skip-auth`)가 인증을 건너뛰게 하는" 함수로 바꿔, 디버그 코드가 단순 로그가 아니라 백도어가 될 수 있음을 재현한다 |
| **C (3회차)** | **여러 디버그 지점을 한 매크로로 통합 관리** | `DEBUG_LOG` 하나가 아니라 함수 3~4곳에 흩어진 디버그 출력을 전부 같은 매크로로 통일해, 배포 빌드 시 한 번의 재컴파일로 전부 꺼지는지 확인한다 |

---

## 2. 제출물

```text
sd52_debugcode/src/debugcode.h
sd52_debugcode/src/debugcode.c
sd52_debugcode/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

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
> `make D=sd52_debugcode T=main check`(기본)로는 `test_good_silent_in_release_build`가 통과해야 한다. 그다음 `CFLAGS`에 `-DDEBUG_ENABLE`을 추가해 다시 빌드하면(직접 `clang ... -DDEBUG_ENABLE ...`로 컴파일), 이번엔 반대로 그 테스트가 **일부러 실패**한다 — Good의 매크로가 `DEBUG_ENABLE` 유무에 따라 실제로 다르게 동작한다는 걸 두 눈으로 확인하는 과정이다. 이 실패는 코드가 잘못된 게 아니라 **매크로가 의도대로 작동한다는 증거**다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_always_prints` 통과 | 30 | ☐ |
| `test_good_silent_in_release_build` 통과 | 40 | ☐ |
| `-DDEBUG_ENABLE`로 재빌드했을 때 Good이 실제로 출력하는 것까지 직접 확인 | 20 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `#ifdef DEBUG_ENABLE`을 소스 파일 맨 위에서만 한 번 확인하고, 실제 출력 코드에는 조건을 안 걺 | 매크로 정의 여부를 확인하는 것과 그 조건으로 코드를 감싸는 것은 다른 일이다. 출력 코드 자체가 `#ifdef`/매크로 안에 있어야 한다 |
| 디버그 코드를 지우는 대신 `if (0)`으로 감싸 둠 | `if (0) { puts(...); }`은 컴파일러가 최적화로 없앨 수도 있지만 표준이 보장하지 않는다. 게다가 코드가 여전히 소스에 남아 검색·리뷰 시 "죽은 코드"인지 "곧 켤 코드"인지 헷갈린다. `#ifdef`로 명확히 의도를 드러내야 한다 |
| 디버그 매크로 안에 실제 로직(부수효과가 있는 코드)까지 넣음 | `DEBUG_LOG(foo())`처럼 매크로 인자 안에서 부수효과가 있는 함수를 호출하면, `DEBUG_ENABLE`이 꺼졌을 때 그 함수 자체가 아예 실행되지 않아 로직이 달라질 수 있다. 디버그 매크로에는 순수 로깅만 넣는다 |

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
> **눈여겨볼 점**: `debug_output_good`의 코드는 `puts("Debug message")` 대신 `DEBUG_LOG("Debug message")` **한 단어**만 다르다. 실행 코드의 모양은 똑같이 유지하면서, "이게 켜질지 말지"를 컴파일 시점 매크로 하나로 완전히 분리해낸 것이 이 치환의 전부다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (디버그 로그) |  |  |  |
| 2 |  | B (숨은 관리자 진입점) |  |  |  |
| 3 |  | C (여러 지점 통합) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD51. 무한 자원 할당](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD51.%20무한%20자원%20할당%20—%20상한%20및%20풀로%20치환.md)
- [다음: SD53. 시스템 데이터 정보노출](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD53.%20시스템%20데이터%20정보노출%20—%20경로%20제외%20일반%20메시지로%20치환.md)
