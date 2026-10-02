---
title: "SD15. 검사되지 않은 배열 인덱싱 — 하한·상한 동시 검사로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD15. 검사되지 않은 배열 인덱싱 — 하한·상한 동시 검사로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 15. 검사되지 않은 배열 인덱싱](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#15-검사되지-않은-배열-인덱싱-cwe-129) `CWE-129`
> **repo 폴더**: `sd15_writeindex/` (`make D=sd15_writeindex T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> SD14가 "읽기"였다면 이 항목은 그 반대인 **"쓰기"** 다. 게다가 위치(`num`)와 값(`value`)을 **모두** 외부가 정하므로, 오버플로우 없이 곧바로 임의 주소 쓰기가 된다는 점이 SD11~13과 다르다.

---

## 0. 이 드릴로 체화할 것

```diff
- arr[num - 1] = value;                                       /* 최대·최소 검사 없음 */
+ if (num <= 0 || (size_t)num > arr_size) return -1;           /* 하한 + 상한 */
+ arr[num - 1] = value;
```

루프 비교 연산자는 `>` 보다 `>=` 를 쓰는 습관, 그리고 **하한과 상한을 항상 같이 검사**하는 습관을 SD14(읽기)와 짝지어 체화한다.

---

## 1. 취약 시나리오 — 변형 A: 1-based 인덱스로 배열에 쓰기

> [!QUOTE] 요구사항서 (발췌)
> 사용자가 지정한 "1번째, 2번째, ..." 같은 1-based 위치(`num`)에 값을 쓴다.
> - `num` 은 1 이상, 배열 크기 이하만 유효하다.

### 공격 입력표

| `num` (배열 크기 5) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 5 (정상, 상한) | 정상 동작 | `arr[4]` 는 유효 |
| 10 (상한 초과) | **힙 버퍼 오버플로우로 크래시** | `arr[9]` 는 할당 범위 밖 |
| 0 (하한 미만) | **버퍼 시작 이전 쓰기** | `arr[-1]` 은 배열 앞의 메모리 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 1-based 인덱스 쓰기 | 위 내용 |
| **B (2회차)** | **네트워크에서 받은 (인덱스, 값) 쌍을 배치 처리** | PDF 원문처럼 `sscanf("%d %d", &num, &size)` 로 여러 쌍을 반복 처리하는 루프로 확장 — 한 번이라도 검사를 빼먹으면 전체가 뚫린다는 걸 체감 |
| **C (3회차)** | **행·열 인덱스 동시 검사** | `data[row][col]` 형태에서 두 인덱스를 각각 검사하되, 검사 실패 시 어느 쪽이 문제였는지 구분해서 반환 |

---

## 2. 제출물

```text
sd15_writeindex/src/arr_write.h
sd15_writeindex/src/arr_write.c
sd15_writeindex/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>
#include "arr_write.h"

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

static int *g_arr;
static int g_num;
static void call_bad(void) { write_at_index_bad(g_arr, g_num, 99); }

static void test_bad_is_vulnerable(void)
{
    int *arr = malloc(5 * sizeof(int));
    g_arr = arr; g_num = 10;
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 배열 크기를 넘는 인덱스에 쓰면 크래시해야 한다(취약점 재현)");
    free(arr);
}

static void test_bad_normal(void)
{
    int *arr = malloc(5 * sizeof(int));
    g_arr = arr; g_num = 5;
    T_TRUE(expect_crash(call_bad) == 0, "유효 인덱스는 크래시 없이 정상 동작해야 한다");
    free(arr);
}

static void test_good_blocks_overwrite(void)
{
    int arr[5] = {0};
    T_TRUE(write_at_index_good(arr, 5, 10, 99) == -1, "Good은 상한 밖 인덱스를 거부해야 한다");
    T_TRUE(write_at_index_good(arr, 5, 0, 99) == -1, "Good은 0(하한 밖)도 거부해야 한다");
}

static void test_good_normal(void)
{
    int arr[5] = {0};
    T_TRUE(write_at_index_good(arr, 5, 5, 99) == 0, "정상 인덱스는 성공해야 한다");
    T_TRUE(arr[4] == 99, "쓰인 값이 정확해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_overwrite();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 25 | ☐ |
| `test_good_blocks_overwrite` 통과 — **상한과 하한 둘 다** 거부 | 30 | ☐ |
| `test_good_normal` 통과 | 15 | ☐ |
| 경계값(`num == arr_size`, `num == 1`)이 정상 통과한다 | 20 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 상한만 검사하고 `num <= 0` (하한)을 빼먹음 | PDF 원문 예시(`sizes[num-1]=size`)의 실제 결함이 이것이다 — `num` 이 0이면 `arr[-1]`, 음수면 더 먼 곳에 쓴다 |
| `num > arr_size` 로만 비교(경계값 처리 오류) | `num == arr_size` 는 유효한 값(`arr[arr_size-1]`)인데 `>` 대신 `>=` 를 잘못 써서 정상 케이스까지 막을 수 있다. 반대로 `num > arr_size` 로만 하고 `<` 를 빼먹으면 하한이 뚫린다 |
| `arr_size` 를 `int` 로 받고 `num` 과 부호 있는 비교만 함 | `(size_t)num > arr_size` 형태로 캐스팅해 비교해야, `num` 이 매우 큰 `int` 값일 때도 정확히 비교된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `arr_write.h` / `arr_write.c`
> **헤더 (`arr_write.h`)**
> ```c
> #ifndef ARR_WRITE_H
> #define ARR_WRITE_H
> #include <stddef.h>
> void write_at_index_bad(int *arr, int num, int value);
> int write_at_index_good(int *arr, size_t arr_size, int num, int value);
> #endif
> ```
> **구현 (`arr_write.c`)**
> ```c
> #include "arr_write.h"
>
> void write_at_index_bad(int *arr, int num, int value)
> {
>     arr[num - 1] = value;
> }
>
> int write_at_index_good(int *arr, size_t arr_size, int num, int value)
> {
>     if (num <= 0 || (size_t)num > arr_size) return -1;
>     arr[num - 1] = value;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: 조건문 한 줄(`num <= 0 || (size_t)num > arr_size`)에 **하한**(`<= 0`)과 **상한**(`> arr_size`)이 나란히 있다. 이 항목의 모범답안은 "무엇을 검사하는가"보다 **"두 검사를 절대 따로 떼어놓지 않는다"** 는 습관이 핵심이다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (1-based 쓰기) |  |  |  |
| 2 |  | B (배치 처리) |  |  |  |
| 3 |  | C (행·열) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD14. 범위 초과해서 읽기](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD14.%20범위%20초과해서%20읽기%20—%20길이%20동반%20전달로%20치환.md)
- [다음: SD16. 널 종료 문제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD16.%20널%20종료%20문제%20—%20길이%20명시%20복사와%20수동%20종료로%20치환.md)
