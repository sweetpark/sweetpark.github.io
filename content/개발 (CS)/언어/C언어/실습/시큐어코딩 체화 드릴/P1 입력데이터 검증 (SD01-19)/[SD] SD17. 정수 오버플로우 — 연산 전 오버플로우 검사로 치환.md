---
title: "SD17. 정수 오버플로우 — 연산 전 오버플로우 검사로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-29
---

# SD17. 정수 오버플로우 — 연산 전 오버플로우 검사로 치환

> **원본 항목**: [Part 1-4. 정수·타입변환 계열 — 17. 정수 오버플로우](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-4.%20정수·타입변환%20계열.md#17-정수-오버플로우-cwe-190) `CWE-190`
> **repo 폴더**: `sd17_intoverflow/` (`make D=sd17_intoverflow T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> 여기서부터(SD17~19)는 UBSan이 기본적으로 **"에러만 출력하고 계속 진행"** 한다는 걸 먼저 알아야 한다 — `expect_crash` 가 그래도 통하는 이유를 아래에서 확인한다.

---

## 0. 이 드릴로 체화할 것

```diff
- int total = count + RESERVE;
- return malloc((size_t)total * sizeof(int));            /* 오버플로우된 값을 그대로 할당 크기로 */
+ if (count < 0 || count > INT_MAX - RESERVE) return NULL;   /* 덧셈 전에 검사 */
+ int total = count + RESERVE;
+ if ((size_t)total > SIZE_MAX / sizeof(int)) return NULL;   /* 곱셈 전에 검사 */
+ return malloc((size_t)total * sizeof(int));
```

`malloc(n + reserve)` 나 `malloc(n * size)` 를 보면 오버플로우부터 의심한다. 검사는 계산 **"후"** 가 아니라 **"전"** 에 한다.

---

## 1. UBSan은 기본적으로 "안 죽는다" — 그런데도 크래시가 나는 이유

```c
int x = INT_MAX;
int y = x + 1;    /* UBSan: "signed integer overflow" 리포트만 하고 y=-2147483648로 계속 진행, exit code 0 */
```

이 프로젝트 Makefile(`-fsanitize=address,undefined`)은 UBSan을 **recoverable 모드**로 켠다 — 위반을 만나도 리포트만 찍고 실행을 이어간다. 그런데 이 드릴의 Bad는 그 왜곡된 값을 **`malloc()` 크기로 그대로 사용**하기 때문에, UBSan이 봐주고 넘어간 값을 이번엔 **ASan이 잡는다**: 오버플로우로 음수가 된 `total` 을 `size_t` 로 캐스팅하면 거의 2^64에 가까운 값이 되고, ASan은 "이렇게 비정상적으로 큰 할당 요청"을 그 자체로 위반(`allocation-size-too-big`)으로 판정해 프로세스를 **abort** 시킨다.

> [!NOTE] 그래서 `expect_crash` 로 여전히 잡을 수 있다
> 정수 오버플로우 자체는 안 죽어도, **오버플로우된 값이 malloc/memcpy 크기로 흘러가는 다음 단계**에서 ASan이 대신 잡아준다. 이 연쇄(정수 오버플로우 → 크기·인덱스 오염 → 메모리 위반)가 바로 이 계열이 "코드 오류"가 아니라 "보안약점"으로 분류되는 이유다.

---

## 2. 취약 시나리오 — 변형 A: 예약 공간을 더한 정수 배열 할당

> [!QUOTE] 요구사항서 (발췌)
> `count` 개의 int를 저장할 버퍼에 여유 공간(`RESERVE=8`)을 더해 할당한다.
> - `count` 가 매우 커서 오버플로우가 나면 할당을 거부해야 한다.

### 공격 입력표

| `count` | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 10 (정상) | 정상 할당 | 오버플로우 없음 |
| `INT_MAX - 4` | **UBSan이 오버플로우를 리포트 → 결과값이 음수 → size_t 캐스팅으로 거대해짐 → ASan이 할당 요청을 거부하며 abort** | `count + RESERVE` 가 `INT_MAX` 를 넘는다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 예약 공간을 더한 배열 할당 | 위 내용 |
| **B (2회차)** | **곱셈 오버플로우로 변형** | `malloc(n * elem_size)` 형태에서 `n`, `elem_size` 둘 다 외부에서 온다고 가정하고, `n > SIZE_MAX / elem_size` 형태의 나눗셈 사전 검사를 직접 짜본다 |
| **C (3회차)** | **뺄셈 오버플로우** | `remaining = total - used` 형태에서 `used > total` 이면 결과가 큰 양수(부호 있는 경우 음수)가 되는 패턴을 다뤄본다 |

---

## 3. 제출물

```text
sd17_intoverflow/src/int_alloc.h
sd17_intoverflow/src/int_alloc.c
sd17_intoverflow/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>
#include <sys/wait.h>
#include <unistd.h>
#include "int_alloc.h"

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
static void call_bad(void) { use_buffer_bad(g_count); }

static void test_bad_is_vulnerable(void)
{
    g_count = INT_MAX - 4;
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 오버플로우로 할당이 실패해도 반환값을 안 보고 써서 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_count = 10;
    T_TRUE(expect_crash(call_bad) == 0, "정상 범위의 count는 크래시 없이 동작해야 한다");
}

static void test_good_blocks_overflow(void)
{
    T_TRUE(int_alloc_good(INT_MAX - 4) == NULL,
        "Good은 덧셈 전에 오버플로우를 검사해 NULL을 반환해야 한다");
}

static void test_good_normal(void)
{
    void *buf = use_buffer_good(10);
    T_TRUE(buf != NULL, "정상 범위는 성공해야 한다");
    free(buf);
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

---

## 4. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 25 | ☐ |
| `test_good_blocks_overflow` / `test_good_normal` 통과 | 30 | ☐ |
| Good의 검사가 **덧셈 전**(`count > INT_MAX - RESERVE`), **곱셈 전**(`total > SIZE_MAX / sizeof(int)`) 둘 다 있다 | 30 | ☐ |
| 실행 로그에서 UBSan의 "signed integer overflow" 리포트를 실제로 확인했다 | 10 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 5. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `count + RESERVE > INT_MAX` 로 검사(오버플로우가 이미 일어난 후 비교) | 이 비교 자체가 이미 오버플로우된 값을 사용하는 UB다. `count > INT_MAX - RESERVE` 처럼 **뺄셈으로 미리 뒤집어서** 오버플로우가 나기 전에 검사해야 한다 |
| 곱셈 오버플로우 검사를 빼먹고 덧셈만 막음 | `total` 이 안전해도 `total * sizeof(int)` 에서 또 오버플로우(혹은 극단적인 크기)가 날 수 있다. 나눗셈으로 사전 검사(`total > SIZE_MAX / sizeof(int)`) |
| Bad를 "정수 오버플로우 자체가 크래시"라고 오해 | 정수 오버플로우는 UBSan이 리포트만 하고 넘어간다. **그 값이 메모리 크기·인덱스로 쓰일 때** 비로소 위험해진다는 연쇄를 이해해야 한다 |

---

## 6. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `int_alloc.h` / `int_alloc.c`
> **헤더 (`int_alloc.h`)**
> ```c
> #ifndef INT_ALLOC_H
> #define INT_ALLOC_H
> #include <stddef.h>
> void *int_alloc_bad(int count);
> void *int_alloc_good(int count);
> void use_buffer_bad(int count);
> void *use_buffer_good(int count);
> #endif
> ```
> **구현 (`int_alloc.c`)**
> ```c
> #include <stdlib.h>
> #include <limits.h>
> #include <stdint.h>
> #include "int_alloc.h"
>
> #define RESERVE 8
>
> void *int_alloc_bad(int count)
> {
>     int total = count + RESERVE;
>     return malloc((size_t)total * sizeof(int));
> }
>
> void use_buffer_bad(int count)
> {
>     int *buf = (int *)int_alloc_bad(count);
>     buf[0] = 42;               /* 반환값 검사 없음 */
>     free(buf);
> }
>
> void *int_alloc_good(int count)
> {
>     int total;
>     if (count < 0 || count > INT_MAX - RESERVE) return NULL;
>     total = count + RESERVE;
>     if ((size_t)total > SIZE_MAX / sizeof(int)) return NULL;
>     return malloc((size_t)total * sizeof(int));
> }
>
> void *use_buffer_good(int count)
> {
>     int *buf = (int *)int_alloc_good(count);
>     if (buf == NULL) return NULL;
>     buf[0] = 42;
>     return buf;
> }
> ```
>
> **눈여겨볼 점**: `int_alloc_good` 은 **두 번** 검사한다 — 덧셈 전 한 번, 곱셈 전 한 번. "정수 연산이 하나라도 있으면 그 연산 전에 검사"라는 원칙을 기계적으로 적용한 결과가 이 코드다.

---

## 7. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (덧셈) |  |  |  |
| 2 |  | B (곱셈) |  |  |  |
| 3 |  | C (뺄셈) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD16. 널 종료 문제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD16.%20널%20종료%20문제%20—%20길이%20명시%20복사와%20수동%20종료로%20치환.md)
- [다음: SD18. 의도하지 않은 부호 확장](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD18.%20의도하지%20않은%20부호%20확장%20—%20원본%20타입으로%20직접%20검사하도록%20치환.md)
- [[C] 개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md) — 5-2절: `calloc(count, sizeof(*item))`이 이 드릴의 곱셈 오버플로우 검사를 대신 해주는 이유
