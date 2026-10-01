---
title: "SD16. 널 종료 문제 — 길이 명시 복사와 수동 종료로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD16. 널 종료 문제 — 길이 명시 복사와 수동 종료로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 16. 널 종료 문제](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#16-널-종료-문제-cwe-170) `CWE-170`
> **repo 폴더**: `sd16_nullterm/` (`make D=sd16_nullterm T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 1-3의 마지막 드릴. `read()` 로 받은 바이트 배열처럼 **널 종료가 보장되지 않는 버퍼**를 문자열 함수에 넘기면 무슨 일이 생기는지 실제로 재현한다.

---

## 0. 이 드릴로 체화할 것

```diff
- strcpy(out, raw);                                    /* raw가 널 종료 안 되면 계속 읽음 */
+ size_t n = (raw_len < out_size - 1) ? raw_len : out_size - 1;
+ memcpy(out, raw, n);
+ out[n] = '\0';                                        /* 널 종료를 직접 보장 */
```

`read()`/`readlink()` 로 받은 버퍼는 "문자열"이 아니라 "바이트 배열"로 취급하라 — `strcpy`/`strcat`/`strlen` 을 바로 적용하지 않는다.

---

## 1. 취약 시나리오 — 변형 A: 고정 길이로 읽은 원본 복사

> [!QUOTE] 요구사항서 (발췌)
> `read()` 로 읽은 것처럼 길이가 고정된(`raw_len`) 바이트 버퍼를 문자열 버퍼(`out`)로 복사한다.
> - `raw` 는 널로 끝난다는 보장이 없다.
> - `out` 은 항상 널로 끝나야 한다.

### 공격 입력표

| `raw` 상태 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 8바이트를 `\0` 로 채우고 `"hi"` 를 앞에 씀 (정상) | 정상 동작 | 우연히 널 종료가 되어 있는 경우 |
| **정확히 8바이트를 `'A'` 로만 채움(널 없음)** | **힙 버퍼 오버리드로 크래시** | `strcpy` 가 8바이트를 넘어 널을 찾아 계속 읽는다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 고정 길이 버퍼 복사 | 위 내용 |
| **B (2회차)** | **두 조각을 이어붙이기(`strncat` 흉내)** | `firstName` + `" "` + `lastName` 을 붙이는 로직에서, 앞부분이 널 종료가 안 됐을 때 `strncat` 이 어떻게 추가로 폭주하는지 재현 |
| **C (3회차)** | **C++ `std::string`/C의 길이 기반 구조체로 전환** | 널 종료에 의존하지 않는 자료구조(길이를 항상 들고 다니는 구조체)로 설계를 바꾸면 이 계열의 문제가 원천적으로 사라진다는 것을 체감 |

---

## 2. 제출물

```text
sd16_nullterm/src/raw_copy.h
sd16_nullterm/src/raw_copy.c
sd16_nullterm/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>
#include "raw_copy.h"

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

static char *g_raw;
static char g_out[256];
static void call_bad(void) { copy_raw_bad(g_raw, g_out); }

static void test_bad_is_vulnerable(void)
{
    g_raw = malloc(8);
    memset(g_raw, 'A', 8);          /* 정확히 8바이트, 널 종료 없음 */
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 널 종료 안 된 버퍼를 strcpy로 읽으면 경계를 넘어 크래시해야 한다(취약점 재현)");
    free(g_raw);
}

static void test_bad_normal(void)
{
    g_raw = malloc(8);
    memset(g_raw, 0, 8);
    memcpy(g_raw, "hi", 2);
    T_TRUE(expect_crash(call_bad) == 0, "정상 널 종료 문자열은 크래시 없이 동작해야 한다");
    free(g_raw);
}

static void test_good_blocks_overread(void)
{
    char raw[8];
    char out[4];
    memset(raw, 'A', 8);
    T_TRUE(copy_raw_good(raw, 8, out, sizeof(out)) == -1,
        "Good은 out 버퍼가 raw_len을 다 담을 수 없으면 실패를 알려야 한다");
    T_TRUE(out[3] == '\0', "그래도 out은 항상 널로 끝나야 한다");
}

static void test_good_normal(void)
{
    char raw[8];
    char out[16];
    memset(raw, 0, 8);
    memcpy(raw, "hi", 2);
    T_TRUE(copy_raw_good(raw, 2, out, sizeof(out)) == 0, "정상 길이는 성공해야 한다");
    T_TRUE(strcmp(out, "hi") == 0, "복사된 내용이 정확해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_overread();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 — 정확히 raw_len만큼만 할당해서 재현했다 | 25 | ☐ |
| `test_good_blocks_overread` 통과 — 버퍼 부족을 실패로 알린다 | 20 | ☐ |
| **실패 시에도** `out` 이 널로 끝난다(부분 복사 후 종료) | 25 | ☐ |
| `test_good_normal` 통과 | 20 | ☐ |
| Good이 `strcpy`/`strcat`/`strlen` 을 `raw` 에 전혀 쓰지 않는다(`memcpy` 로만 처리) | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 테스트에서 `raw` 를 스택 배열(`char raw[8]`)로만 두고 `malloc(8)` 을 안 씀 | 스택 배열은 컴파일러가 여유 공간이나 다른 지역변수를 바로 뒤에 둘 수 있어 ASan이 항상 정확히 잡아주지 못할 때가 있다. **힙에 정확한 크기로 할당**해야 재현이 안정적이다 |
| Good에서 실패(`-1`) 시 `out` 을 아예 안 건드림 | 호출자가 실패를 무시하고 `out` 을 문자열로 쓰면 초기화 안 된 메모리를 읽는 또 다른 버그가 생긴다. 실패해도 **최소한 널 종료된 빈 상태**는 보장한다 |
| `raw_len` 을 아예 안 받고 `strlen(raw)` 로 길이를 구하려 함 | 이 항목의 전제 자체가 "raw는 널 종료가 안 되어 있다"는 것이다. `strlen` 을 쓰는 순간 이미 이 항목이 경고하는 함정에 빠진 것이다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `raw_copy.h` / `raw_copy.c`
> **헤더 (`raw_copy.h`)**
> ```c
> #ifndef RAW_COPY_H
> #define RAW_COPY_H
> #include <stddef.h>
> void copy_raw_bad(const char *raw, char *out);
> int copy_raw_good(const char *raw, size_t raw_len, char *out, size_t out_size);
> #endif
> ```
> **구현 (`raw_copy.c`)**
> ```c
> #include <string.h>
> #include "raw_copy.h"
>
> void copy_raw_bad(const char *raw, char *out)
> {
>     strcpy(out, raw);
> }
>
> int copy_raw_good(const char *raw, size_t raw_len, char *out, size_t out_size)
> {
>     size_t n = (raw_len < out_size - 1) ? raw_len : out_size - 1;
>     memcpy(out, raw, n);
>     out[n] = '\0';
>     return (raw_len < out_size) ? 0 : -1;
> }
> ```
>
> **눈여겨볼 점**: `copy_raw_good` 은 `raw` 에 대해 **길이 기반 함수(`memcpy`)만** 쓴다. `raw` 안에 널 문자가 있는지 없는지는 이 함수의 관심사가 아니다 — 항상 `raw_len` 만큼만 정확히 읽고, 종료는 `out` 쪽에서 직접 보장한다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (고정 길이 복사) |  |  |  |
| 2 |  | B (strncat 흉내) |  |  |  |
| 3 |  | C (길이 기반 구조체) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD15. 검사되지 않은 배열 인덱싱](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD15.%20검사되지%20않은%20배열%20인덱싱%20—%20하한·상한%20동시%20검사로%20치환.md)
- Part 1-3 메모리 경계 계열 6개 완료 — [다음: SD17. 정수 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD17.%20정수%20오버플로우%20—%20연산%20전%20오버플로우%20검사로%20치환.md)
