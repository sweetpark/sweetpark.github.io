---
title: "SD11. 스택 버퍼 오버플로우 — 길이 검사 후 strncpy로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD11. 스택 버퍼 오버플로우 — 길이 검사 후 strncpy로 치환

> **원본 항목**: [Part 1-3. 메모리 경계 계열 — 11. 스택에 할당된 버퍼 오버플로우](../../시큐어코딩가이드/Part%201.%20입력데이터%20검증%20및%20표현/%5B시큐어코딩%5D%201-3.%20메모리%20경계%20계열.md#11-스택에-할당된-버퍼-오버플로우-cwe-121) `CWE-121`
> **repo 폴더**: `sd11_stackoverflow/` (`make D=sd11_stackoverflow T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> 여기부터(SD11~SD19)는 mock이 필요 없다 — **진짜 UB**라서 ASan/UBSan이 그대로 잡아준다. 대신 "Bad를 호출하면 실제로 프로세스가 죽는다"를 테스트로 증명하는 새 패턴(`expect_crash`)을 쓴다.

---

## 0. 이 드릴로 체화할 것

```diff
- char buf[24];
- strcpy(buf, input);                      /* 길이 검사 없는 복사 */
+ char buf[24];
+ if (strlen(input) < sizeof(buf))
+     strncpy(buf, input, sizeof(buf)-1);
+ buf[sizeof(buf)-1] = '\0';                /* 반드시 null 종료 */
```

`strcpy/strcat/sprintf/gets` 는 보이는 즉시 교체 대상이다. `strncpy` 로 바꿔도 마지막 바이트 널 종료는 **직접** 채워야 한다는 걸 이번 드릴에서 몸에 새긴다.

---

## 1. 새 패턴 — `expect_crash` (테스트 안에 직접 타이핑)

ASan이 위반을 감지하면 프로세스를 즉시 `abort()` 시킨다. 이 특성을 거꾸로 이용해서 **"Bad가 실제로 위험하다"를 자동화된 시험으로 증명**한다 — Bad를 자식 프로세스에서 실행하고, 부모가 "자식이 비정상 종료했는가"를 확인한다.

```c
#define _DEFAULT_SOURCE
#include <sys/wait.h>
#include <unistd.h>

/* fn을 자식 프로세스에서 실행한다. 자식이 크래시(시그널 종료 또는 exit!=0)하면 1,
   정상 종료(exit 0)하면 0을 반환한다. */
static int expect_crash(void (*fn)(void))
{
    pid_t pid = fork();
    if (pid == 0) {
        fn();
        _exit(0);
    }
    int status = 0;
    waitpid(pid, &status, 0);
    if (WIFSIGNALED(status)) return 1;
    if (WIFEXITED(status) && WEXITSTATUS(status) != 0) return 1;
    return 0;
}
```

> [!NOTE] 자식 프로세스가 ASan 리포트를 화면에 찍는다
> `make check` 를 실행하면 `PASS` 뒤에 `AddressSanitizer: stack-buffer-overflow ...` 같은 긴 리포트가 함께 출력된다. **이건 실패가 아니라 증거다** — 부모는 그 크래시를 "예상된 결과"로 판정해 `PASS` 를 출력한 것이다. 이 드릴 이후(SD12~19) 계열에서 계속 재사용하는 패턴이니 잘 기억해 둔다.

---

## 2. 취약 시나리오 — 변형 A: 고정 크기 문자열 버퍼에 복사

> [!QUOTE] 요구사항서 (발췌)
> 외부에서 받은 문자열을 24바이트 지역 버퍼에 복사하는 함수를 만든다.
> - 입력이 버퍼보다 길면 안전하게 실패 처리해야 한다.
> - 버퍼 안 문자열은 항상 널로 끝나야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `input` | 외부(함수 인자) | 24바이트 스택 지역 버퍼로의 복사 |

### 공격 입력표

| 입력 길이 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 5자 (정상) | 정상 동작 | 버퍼 크기 이내 |
| 41자 (24바이트 초과) | **스택 버퍼 오버플로우로 크래시** | `strcpy` 가 버퍼 경계를 넘어 인접 스택 영역(반환주소 포함)을 덮는다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 24바이트 버퍼 복사 | 위 내용 |
| **B (2회차)** | **8바이트 버퍼 + 두 개 필드** | `char id[8]; char tag[8];` 처럼 인접한 두 버퍼 중 하나에 오버플로우가 나면 다른 필드까지 오염되는 것을 확인 |
| **C (3회차)** | **함수 인자를 구조체로 교체** | `char buf[N]` 을 구조체 멤버로 두고, 구조체 안의 다른 멤버(정수 플래그 등)가 오버플로우로 덮이는지 관찰(가능하면 값 검증까지 추가) |

---

## 3. 제출물

```text
sd11_stackoverflow/src/buf_ops.h
sd11_stackoverflow/src/buf_ops.c
sd11_stackoverflow/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>
#include "buf_ops.h"

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
static void call_bad(void) { manipulate_string_bad(g_input); }

static void test_bad_is_vulnerable(void)
{
    g_input = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"; /* 24바이트 훨씬 초과 */
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 24바이트를 넘는 입력에서 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    g_input = "short";
    T_TRUE(expect_crash(call_bad) == 0, "짧은 입력은 크래시 없이 정상 동작해야 한다");
}

static void test_good_blocks_overflow(void)
{
    char out[24];
    T_TRUE(manipulate_string_good(
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", out, sizeof(out)) == -1,
        "Good은 버퍼보다 긴 입력을 거부해야 한다");
}

static void test_good_normal(void)
{
    char out[24];
    T_TRUE(manipulate_string_good("short", out, sizeof(out)) == 0, "정상 입력은 성공해야 한다");
    T_TRUE(strcmp(out, "short") == 0, "복사된 내용이 정확해야 한다");
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
| `test_bad_is_vulnerable` 통과 — Bad가 실제로 크래시한다 | 25 | ☐ |
| `test_bad_normal` 통과 — 짧은 입력은 안 죽는다 | 10 | ☐ |
| `test_good_blocks_overflow` / `test_good_normal` 통과 | 25 | ☐ |
| Good이 `strncpy` + **수동 널 종료**를 둘 다 한다 | 25 | ☐ |
| `expect_crash` 헬퍼를 그대로 재현했다(다음 드릴들에서 계속 쓴다) | 10 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 5. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `strncpy` 로 바꾸고 널 종료를 안 함 | `strncpy` 는 원본이 대상 크기보다 길거나 같으면 널 종료를 보장하지 않는다. `out[out_size-1] = '\0'` 을 반드시 별도로 적어야 한다 |
| `test_bad_normal` 이 없어서 Good만 있으면 되는 줄 앎 | Bad가 "항상" 죽는 게 아니라 "긴 입력에서만" 죽는다는 걸 확인해야 한다 — 짧은 입력에서도 죽으면 애초에 테스트 설계가 잘못된 것 |
| `expect_crash` 안에서 `fn()` 호출 전에 `fflush(stdout)` 을 안 함 | fork 이후 자식과 부모가 동일한 stdio 버퍼를 공유해 출력이 중복되거나 꼬일 수 있다(이 드릴 정도 규모에서는 거의 안 나타나지만, 실무 습관으로 기억) |

---

## 6. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `buf_ops.h` / `buf_ops.c`
> **헤더 (`buf_ops.h`)**
> ```c
> #ifndef BUF_OPS_H
> #define BUF_OPS_H
> #include <stddef.h>
> void manipulate_string_bad(const char *input);
> int manipulate_string_good(const char *input, char *out, size_t out_size);
> #endif
> ```
> **구현 (`buf_ops.c`)**
> ```c
> #include <string.h>
> #include "buf_ops.h"
>
> void manipulate_string_bad(const char *input)
> {
>     char buf[24];
>     strcpy(buf, input);      /* 길이 검사 없는 복사 */
>     (void)buf;
> }
>
> int manipulate_string_good(const char *input, char *out, size_t out_size)
> {
>     if (strlen(input) >= out_size) return -1;
>     strncpy(out, input, out_size - 1);
>     out[out_size - 1] = '\0';
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `manipulate_string_good` 은 실패를 **명시적으로 반환**한다(`-1`). PDF 원문의 "그냥 자르고 넘어간다"보다 한 걸음 더 나간 설계다 — 잘린 문자열을 그대로 쓰는 것도 다른 종류의 버그(잘못된 값으로 계속 동작)로 이어질 수 있으므로, 이 드릴에서는 "버퍼에 안 맞으면 실패로 알린다"를 기본값으로 삼는다.

---

## 7. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (24바이트) |  |  |  |
| 2 |  | B (인접 필드) |  |  |  |
| 3 |  | C (구조체) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD10. 프로세스 제어](%5BSD%5D%20SD10.%20프로세스%20제어%20—%20허용%20명령%20매핑으로%20치환.md)
- [다음: SD12. 힙 버퍼 오버플로우](%5BSD%5D%20SD12.%20힙%20버퍼%20오버플로우%20—%20strlcpy와%20인덱스%20상한%20검사로%20치환.md)
