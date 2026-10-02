---
title: "SD18. 의도하지 않은 부호 확장 — 원본 타입으로 직접 검사하도록 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD18. 의도하지 않은 부호 확장 — 원본 타입으로 직접 검사하도록 치환

> **원본 항목**: [Part 1-4. 정수·타입변환 계열 — 18. 의도하지 않은 부호 확장](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-4.%20정수·타입변환%20계열.md#18-의도하지-않은-부호-확장-cwe-194) `CWE-194`
> **repo 폴더**: `sd18_signext/` (`make D=sd18_signext T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> `int → short` 축소 변환은 **구현정의 동작**(UB 아님)이라 UBSan이 잡아주지 않는다. 그런데도 실제로 배열이 크게 벗어나 **SIGSEGV로 확실히 크래시**한다 — 새니타이저가 안 잡아주는 함정도 있다는 걸 체감하는 드릴이다.

---

## 0. 이 드릴로 체화할 것

```diff
- s = (short)id;              /* int -> short, 음수화 가능 */
- if (s > 256) return -1;     /* 음수는 이 검사를 통과해버린다 */
- sz = (unsigned)s;           /* 음수 -> unsigned, 거대한 값 */
- return info[sz];
+ if (id < 0 || (size_t)id >= info_size) return -1;   /* 원본 int로 직접, 축소 변환 없이 검사 */
+ return info[id];
```

형 변환 전에 "축소했을 때 음수가 될 수 있는가"를 묻지 말고, **아예 축소 변환을 하지 않는다** — 이게 이 항목의 가장 확실한 치환이다.

---

## 1. 왜 UBSan이 못 잡는가

```c
short s = (short)40000;   /* 40000 은 short(16비트) 범위 밖 -> 이 대입 자체는 UB가 아니라 "구현정의" */
```

C 표준은 부호 있는 정수형이 표현 범위를 넘는 값으로 **변환**될 때의 결과를 "구현정의(implementation-defined)"로 규정한다(연산 중 오버플로우인 SD17과는 다른 조항이다). 대부분의 실제 컴파일러(x86 GCC/Clang)는 하위 비트만 잘라내는 방식으로 동작해 `40000` 이 `-25536` 이 되지만, **표준적으로 보장된 동작은 아니고 새니타이저가 위반으로 보지도 않는다.** 그런데 그렇게 만들어진 음수가 `unsigned` 로 다시 뒤집히면서(SD19와 이어지는 패턴) 배열 인덱스가 40억대로 치솟아 **실제 메모리 미매핑 영역**을 건드리게 되고, 이건 새니타이저 유무와 무관하게 OS가 SIGSEGV로 죽인다.

---

## 2. 취약 시나리오 — 변형 A: ID로 정보 배열 조회

> [!QUOTE] 요구사항서 (발췌)
> 사용자 ID(`id`)로 300칸짜리 정보 배열을 조회한다.
> - `id` 는 0 이상 300 미만이어야 한다.

### 공격 입력표

| `id` | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 10 (정상) | 정상 값 반환 | 유효 범위 |
| **40000** | **SIGSEGV로 크래시** | `short` 로 잘리며 `-25536` 이 되어 `s > 256` 검사를 통과, 이후 `unsigned` 로 뒤집혀 `info[4294941760]` 접근 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | ID로 정보 배열 조회 | 위 내용 |
| **B (2회차)** | **권한 등급 비교** | `short level = (short)userLevel;` 로 권한 등급을 비교하는 코드에서, 음수로 뒤집힌 값이 "가장 높은 권한"으로 오판되는 시나리오 |
| **C (3회차)** | **뺄셈 결과가 음수가 되지 않는지 사전 확인** | PDF 원문의 `if (userLevel > penalty) userLevel -= penalty; else userLevel = 0;` 패턴을 직접 짜보고, 이 검사가 왜 필요한지 SD18의 문맥에서 설명해본다 |

---

## 3. 제출물

```text
sd18_signext/src/info_lookup.h
sd18_signext/src/info_lookup.c
sd18_signext/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>
#include "info_lookup.h"

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

static int g_id;
static int g_info[300];
static void call_bad(void) { (void)lookup_info_bad(g_id, g_info); }

static void test_bad_is_vulnerable(void)
{
    g_id = 40000;
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 short로 잘리며 음수가 된 값이 거대한 unsigned 인덱스가 되어 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_id = 10;
    T_TRUE(expect_crash(call_bad) == 0, "정상 범위의 id는 크래시 없이 동작해야 한다");
}

static void test_good_blocks_wraparound(void)
{
    T_TRUE(lookup_info_good(40000, g_info, 300) == -1,
        "Good은 범위를 넘는 id를 원본 int로 직접 검사해 거부해야 한다");
    T_TRUE(lookup_info_good(-1, g_info, 300) == -1, "음수 id도 거부해야 한다");
}

static void test_good_normal(void)
{
    g_info[10] = 99;
    T_TRUE(lookup_info_good(10, g_info, 300) == 99, "정상 id는 값을 정확히 반환해야 한다");
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

---

## 4. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 25 | ☐ |
| `test_good_blocks_wraparound` / `test_good_normal` 통과 | 30 | ☐ |
| Good이 `short` 로 축소 변환을 **아예 하지 않는다**(원본 `int` 로 직접 비교) | 30 | ☐ |
| 하한(`id < 0`)과 상한(`id >= info_size`)을 둘 다 검사한다 | 10 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 5. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `short s = (short)id;` 를 그대로 두고 `if (s < 0)` 검사만 추가 | 이미 축소 변환이 일어난 **뒤**에 검사하는 것이라 늦다. 축소 자체를 하지 않는 것이 유일한 확실한 해법이다 |
| `unsigned` 변환 직전에만 `if (s < 0) return -1;` 을 넣고 원본 `id` 상한(300)은 검사 안 함 | 부호 문제는 막아도, `id` 가 300~32767 사이의 정상 양수 `short` 범위라면 여전히 배열을 벗어난다. 상한 검사는 별개로 필요하다 |
| 이 항목도 SD17처럼 UBSan이 잡아줄 거라 기대함 | 대입에 의한 축소 변환은 구현정의이지 UB가 아니다 — 새니타이저에 기대지 말고 **코드 자체를 정확히** 짜야 하는 항목이다 |

---

## 6. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `info_lookup.h` / `info_lookup.c`
> **헤더 (`info_lookup.h`)**
> ```c
> #ifndef INFO_LOOKUP_H
> #define INFO_LOOKUP_H
> #include <stddef.h>
> int lookup_info_bad(int id, const int *info);
> int lookup_info_good(int id, const int *info, size_t info_size);
> #endif
> ```
> **구현 (`info_lookup.c`)**
> ```c
> #include "info_lookup.h"
>
> int lookup_info_bad(int id, const int *info)
> {
>     short s;
>     unsigned sz;
>     s = (short)id;
>     if (s > 256) return -1;
>     sz = (unsigned)s;
>     return info[sz];
> }
>
> int lookup_info_good(int id, const int *info, size_t info_size)
> {
>     if (id < 0 || (size_t)id >= info_size) return -1;
>     return info[id];
> }
> ```
>
> **눈여겨볼 점**: `lookup_info_good` 에는 `short` 도 `unsigned` 도 등장하지 않는다. **타입 변환 자체가 없으면 타입 변환 버그도 없다** — 가장 강력한 방어는 "위험한 연산을 안 하는 것"이라는 원칙이 SD07(베이스 DN 고정)에 이어 여기서도 반복된다.

---

## 7. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (정보 배열) |  |  |  |
| 2 |  | B (권한 등급) |  |  |  |
| 3 |  | C (뺄셈 하한) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD17. 정수 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD17.%20정수%20오버플로우%20—%20연산%20전%20오버플로우%20검사로%20치환.md)
- [다음: SD19. 무부호→부호 변환 오류](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD19.%20무부호%20정수를%20부호%20정수로%20타입%20변환%20오류%20—%20signed로%20받아%20검증%20후%20변환으로%20치환.md)
