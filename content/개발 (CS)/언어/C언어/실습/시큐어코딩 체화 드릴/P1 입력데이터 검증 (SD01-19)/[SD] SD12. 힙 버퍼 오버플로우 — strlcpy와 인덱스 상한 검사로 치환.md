---
title: "SD12. 힙 버퍼 오버플로우 — 길이 검사 후 strncpy로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD12. 힙 버퍼 오버플로우 — 길이 검사 후 strncpy로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 12. 힙에 할당된 버퍼 오버플로우](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md#12-힙에-할당된-버퍼-오버플로우-cwe-122) `CWE-122`
> **repo 폴더**: `sd12_heapoverflow/` (`make D=sd12_heapoverflow T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> SD11과 원리는 같지만 대상이 스택이 아니라 힙이다 — 인접해서 깨지는 게 반환주소가 아니라 **힙 관리 구조체(청크 메타데이터)** 라는 차이를 확인한다.

---

## 0. 이 드릴로 체화할 것

```diff
- char *dest = (char *)malloc(BUFSIZE);
- strcpy(dest, input);                    /* 길이 검사 없음 */
+ if (strlen(input) >= BUFSIZE) return -1;
+ *out = (char *)malloc(BUFSIZE);
+ strncpy(*out, input, BUFSIZE - 1);
+ (*out)[BUFSIZE - 1] = '\0';
```

`expect_crash` 패턴을 그대로 재사용한다([SD11](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD11.%20스택%20버퍼%20오버플로우%20—%20길이%20검사%20후%20strncpy로%20치환.md) 참고).

---

## 1. 취약 시나리오 — 변형 A: 힙 버퍼에 사용자 문자열 복사

> [!QUOTE] 요구사항서 (발췌)
> `malloc()` 으로 10바이트 힙 버퍼를 만들고 외부 문자열을 복사한다.
> - 입력이 버퍼보다 길면 실패로 처리한다.

### 공격 입력표

| 입력 길이 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 5자 (정상) | 정상 동작 | 버퍼 크기 이내 |
| 32자 (10바이트 초과) | **힙 버퍼 오버플로우로 크래시** | 인접 힙 청크의 메타데이터(size·fd·bk)가 덮인다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 10바이트 힙 버퍼 복사 | 위 내용 |
| **B (2회차)** | **가변 크기 할당** | 버퍼 크기를 인자로 받는 `malloc(size)` 로 바꾸고, `size` 자체가 외부에서 온다면 [SD17. 정수 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD17.%20정수%20오버플로우%20—%20연산%20전%20오버플로우%20검사로%20치환.md)와 어떻게 연결되는지 생각해본다 |
| **C (3회차)** | **토큰 배열을 힙에 저장** | 고정 배열(`int dataBuffer[N]`) 대신 `malloc` 으로 할당한 배열에 인덱스 상한 검사 없이 쓰는 경우까지 확장 |

---

## 2. 제출물

```text
sd12_heapoverflow/src/heap_ops.h
sd12_heapoverflow/src/heap_ops.c
sd12_heapoverflow/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <unistd.h>
#include "heap_ops.h"

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

static const char *g_input;
static void call_bad(void) { heap_copy_bad(g_input); }

static void test_bad_is_vulnerable(void)
{
    g_input = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 10바이트를 넘는 입력에서 힙 오버플로우로 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_input = "short";
    T_TRUE(expect_crash(call_bad) == 0, "짧은 입력은 크래시 없이 정상 동작해야 한다");
}

static void test_good_blocks_overflow(void)
{
    char *out = NULL;
    T_TRUE(heap_copy_good("AAAAAAAAAAAAAAAAAAAA", &out) == -1,
        "Good은 버퍼보다 긴 입력을 거부해야 한다");
}

static void test_good_normal(void)
{
    char *out = NULL;
    T_TRUE(heap_copy_good("short", &out) == 0, "정상 입력은 성공해야 한다");
    T_TRUE(out != NULL && strcmp(out, "short") == 0, "복사된 내용이 정확해야 한다");
    free(out);
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

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 25 | ☐ |
| `test_good_blocks_overflow` / `test_good_normal` 통과 | 30 | ☐ |
| Good이 `malloc` 실패도 `-1` 로 처리한다 | 15 | ☐ |
| `free(out)` 을 테스트에서 빠뜨리지 않았다(ASan 메모리 누수 0) | 20 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| Good 성공 경로에서 `*out` 을 `free` 하지 않고 테스트를 끝냄 | ASan의 LeakSanitizer가 누수로 잡는다. "오버플로우만 막으면 끝"이 아니라 소유권까지 관리해야 한다 |
| `malloc(BUFSIZE)` 실패(`NULL`) 검사를 빼먹음 | 드물지만 힙 고갈 시 `NULL` 에 `strncpy` 하면 또 다른 크래시(널 역참조)가 된다 |
| 스택 버퍼(SD11)와 힙 버퍼(SD12)의 방어 코드를 그대로 복붙 | 원리는 같지만 **소유권(할당·해제) 책임**이 추가된다는 차이를 놓치기 쉽다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `heap_ops.h` / `heap_ops.c`
> **헤더 (`heap_ops.h`)**
> ```c
> #ifndef HEAP_OPS_H
> #define HEAP_OPS_H
> void heap_copy_bad(const char *input);
> int heap_copy_good(const char *input, char **out);
> #endif
> ```
> **구현 (`heap_ops.c`)**
> ```c
> #include <stdlib.h>
> #include <string.h>
> #include "heap_ops.h"
>
> #define BUFSIZE 10
>
> void heap_copy_bad(const char *input)
> {
>     char *dest = (char *)malloc(BUFSIZE);
>     if (dest == NULL) return;
>     strcpy(dest, input);
>     free(dest);
> }
>
> int heap_copy_good(const char *input, char **out)
> {
>     size_t len = strlen(input);
>     if (len >= BUFSIZE) return -1;
>     *out = (char *)malloc(BUFSIZE);
>     if (*out == NULL) return -1;
>     strncpy(*out, input, BUFSIZE - 1);
>     (*out)[BUFSIZE - 1] = '\0';
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `heap_copy_good` 은 **할당 크기와 검증을 한 함수 안에서 같이 관리**한다. "할당 크기"와 "쓰기 인덱스(길이)"를 한 쌍으로 보라는 원문의 경고가 이 함수 하나에 그대로 들어있다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (10바이트) |  |  |  |
| 2 |  | B (가변 크기) |  |  |  |
| 3 |  | C (토큰 배열) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD11. 스택 버퍼 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD11.%20스택%20버퍼%20오버플로우%20—%20길이%20검사%20후%20strncpy로%20치환.md)
- [다음: SD13. 버퍼 시작 지점 이전에 쓰기](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD13.%20버퍼%20시작%20지점%20이전에%20쓰기%20—%20하한%20검사로%20치환.md)
