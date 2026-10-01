---
title: "SD13. 버퍼 시작 지점 이전에 쓰기 — 하한 검사로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD13. 버퍼 시작 지점 이전에 쓰기 — 하한 검사로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 13. 버퍼 시작 지점 이전에 쓰기](../../시큐어코딩가이드/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#13-버퍼-시작-지점-이전에-쓰기-cwe-124) `CWE-124`
> **repo 폴더**: `sd13_writebeforestart/` (`make D=sd13_writebeforestart T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> SD11·12가 "위(끝)"를 넘었다면 이 항목은 **"아래(시작)"** 를 넘는다. `expect_crash` 패턴을 그대로 쓴다.

---

## 0. 이 드릴로 체화할 것

```diff
  int wordIndex = MAX_WORDS - 1;
  for (i = 0; i < count; i++) {
+     if (wordIndex < 0) return -1;   /* 하한 검사 */
      words[wordIndex] = i;
      wordIndex--;
  }
```

오버플로우는 상한뿐 아니라 하한으로도 발생한다. **감소하는 인덱스**를 볼 때마다 "0 아래로 내려갈 수 있는가"를 반사적으로 묻는다.

---

## 1. 취약 시나리오 — 변형 A: 역순으로 채우는 고정 배열

> [!QUOTE] 요구사항서 (발췌)
> 크기 10짜리 배열에 `count` 개의 값을 **역순**(뒤 인덱스부터)으로 채운다.
> - `count` 가 배열 크기(10)보다 많을 수 있다 — 이 경우 안전하게 실패 처리해야 한다.

### 공격 입력표

| `count` | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 10 (정상, 배열 크기와 동일) | 정상 동작 | 인덱스가 정확히 9→0으로 끝난다 |
| 11 (배열 크기 초과) | **버퍼 시작 이전 쓰기로 크래시** | 인덱스가 0 아래로 내려가 `words[-1]` 에 쓴다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 크기 10 배열 역순 채우기 | 위 내용 |
| **B (2회차)** | **포인터 뺄셈으로 순회** | 인덱스 대신 포인터(`int *p = arr + N - 1; *p-- = ...`)로 같은 로직을 짜서, 포인터가 배열 시작보다 앞으로 가는 경우도 같은 문제임을 확인 |
| **C (3회차)** | **가변 길이 배열(VLA) 버전** | 크기를 런타임에 받는 배열로 바꿔서, 컴파일타임 상수(`MAX_WORDS`)에 의존하지 않는 하한 검사를 설계 |

---

## 2. 제출물

```text
sd13_writebeforestart/src/array_ops.h
sd13_writebeforestart/src/array_ops.c
sd13_writebeforestart/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>
#include "array_ops.h"

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
static void call_bad(void) { write_before_start_bad(g_count); }

static void test_bad_is_vulnerable(void)
{
    g_count = 11;
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 토큰이 배열 크기보다 많으면 버퍼 시작 이전에 써서 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_count = 10;
    T_TRUE(expect_crash(call_bad) == 0, "배열 크기와 같은 개수는 크래시 없이 정상 동작");
}

static void test_good_blocks_underflow(void)
{
    int arr[10];
    T_TRUE(write_before_start_good(11, arr, 10) == -1,
        "Good은 배열 크기를 넘는 개수를 거부해야 한다");
}

static void test_good_normal(void)
{
    int arr[10] = {0};
    T_TRUE(write_before_start_good(10, arr, 10) == 0, "정상 개수는 성공해야 한다");
    T_TRUE(arr[0] == 9, "역순으로 채워진 마지막 값이 정확해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_underflow();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 — 실제로 하한 미만 쓰기로 크래시한다 | 25 | ☐ |
| `test_good_blocks_underflow` / `test_good_normal` 통과 | 30 | ☐ |
| 하한 검사가 **루프 안, 쓰기 직전**에 있다 | 25 | ☐ |
| `count == arr_size` 경계값(정확히 딱 맞는 경우)이 정상 통과한다 | 15 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 루프 시작 전에 `count > arr_size` 만 검사하고 끝냄 | 이 항목의 취약점은 "인덱스가 반복 중에 감소하다가" 발생한다. 시작 전 검사만으로는 "정확히 언제 0 아래로 내려가는지" 찾기 어렵다 — 매 반복 직전에 검사하는 게 더 명확하다(이 드릴의 모범답안 방식) |
| 상한 검사(SD15)와 하한 검사(이 항목)를 혼동해서 `>=` 방향을 반대로 씀 | "감소 인덱스는 하한", "증가 인덱스는 상한"이라는 방향 감각을 반사적으로 연결한다 |
| `int` 대신 `size_t` 로 인덱스를 선언 | `size_t` 는 부호 없는 타입이라 `wordIndex--` 가 0에서 한 번 더 감소하면 거대한 양수(랩어라운드)가 되어 오히려 더 위험해진다. 감소하는 인덱스는 **부호 있는 타입**으로 선언한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `array_ops.h` / `array_ops.c`
> **헤더 (`array_ops.h`)**
> ```c
> #ifndef ARRAY_OPS_H
> #define ARRAY_OPS_H
> #include <stddef.h>
> void write_before_start_bad(int count);
> int write_before_start_good(int count, int *out_arr, size_t arr_size);
> #endif
> ```
> **구현 (`array_ops.c`)**
> ```c
> #include "array_ops.h"
> #define MAX_WORDS 10
>
> void write_before_start_bad(int count)
> {
>     int words[MAX_WORDS];
>     int wordIndex = MAX_WORDS - 1;
>     int i;
>     for (i = 0; i < count; i++) {
>         words[wordIndex] = i;
>         wordIndex--;
>     }
>     (void)words;
> }
>
> int write_before_start_good(int count, int *out_arr, size_t arr_size)
> {
>     int wordIndex;
>     int i;
>     if (count < 0) return -1;
>     wordIndex = (int)arr_size - 1;
>     for (i = 0; i < count; i++) {
>         if (wordIndex < 0) return -1;
>         out_arr[wordIndex] = i;
>         wordIndex--;
>     }
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `wordIndex` 의 **초기값**은 항상 안전하다(`arr_size - 1`). 문제는 반복 "횟수"가 배열 크기를 넘을 때만 생긴다 — 그래서 검사를 초기화 시점이 아니라 **매 반복 직전**에 두는 것이 유일하게 안전한 위치다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (배열) |  |  |  |
| 2 |  | B (포인터 뺄셈) |  |  |  |
| 3 |  | C (VLA) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD12. 힙 버퍼 오버플로우]([SD]%20SD12.%20힙%20버퍼%20오버플로우%20—%20strlcpy와%20인덱스%20상한%20검사로%20치환.md)
- [다음: SD14. 범위 초과해서 읽기]([SD]%20SD14.%20범위%20초과해서%20읽기%20—%20길이%20동반%20전달로%20치환.md)
