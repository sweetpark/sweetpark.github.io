---
title: "SD42. 적절하지 않은 예외처리 — 반환값 검사 동반으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD42. 적절하지 않은 예외처리 — 반환값 검사 동반으로 치환

> **원본 항목**: [Part 4. 에러 처리 — 3. 적절하지 않은 예외처리](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/[시큐어코딩]%20Part%204.%20에러%20처리.md#3-적절하지-않은-예외처리-cwe-754) `CWE-754`
> **repo 폴더**: `sd42_except/` (`make D=sd42_except T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> Part 4의 마지막 드릴이자 원본 가이드의 `fgets`→`strcpy` 예시를 그대로 재현한다. 실제 `fgets`는 표준입력 타이밍에 좌우돼 실패를 결정론적으로 일으키기 어려우므로, **"읽기 실패로 널 종료가 안 된 상태"를 강제로 흉내내는 내부 헬퍼**를 두어 매 실행마다 똑같이 재현되게 만든다(README의 Part 3·4·6·7 재현 전략: 실패 주입).

---

## 0. 이 드릴로 체화할 것

```diff
- fgets(fromBuf, 10, stdin);        /* 반환값을 검사하지 않는다 */
- strcpy(toBuf, fromBuf);           /* 에러로 '\0' 종료가 안 되면 오버플로우 */
+ char *retBuf = fgets(fromBuf, 10, stdin);
+ if (retBuf != fromBuf) { /* 에러 처리 후 중단 */ return -1; }
+ strcpy(toBuf, fromBuf);
```

반환값을 검사하지 않는 것 자체가 예외처리 부재다. `fgets`가 실패하면 버퍼 내용이 어떻게 되는지는 보장되지 않는다 — 이어지는 `strcpy`가 그 미보장 상태를 그대로 신뢰하면서 사고가 터진다.

---

## 1. 취약 시나리오 — 변형 A: 입력 재복사

> [!QUOTE] 요구사항서 (발췌)
> 표준입력에서 한 줄을 읽어 다른 버퍼로 복사한다.
> - 읽기에 실패하면 복사를 시도해서는 안 된다.
> - 읽기 함수의 반환값은 반드시 확인해야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `fgets`(또는 이를 흉내낸 `mock_fgets`)의 반환값 | 표준입력 읽기 결과 | 반환값 확인 없이 바로 이어지는 `strcpy`의 원본 버퍼 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 읽기 실패로 `fromBuf`가 널 종료 없이 쓰레기 값으로 채워짐 | **`strcpy`가 버퍼 경계를 넘어 읽어 크래시**(`expect_crash`가 감지) | 반환값을 검사하지 않아 실패 상태를 그대로 신뢰하고 다음 연산으로 넘어간다 |
| 같은 상황(Good) | **복사를 아예 하지 않고 `-1` 반환** | `retBuf != fromBuf` 로 실패를 확인한 즉시 중단한다 |
| 정상 읽기(둘 다) | 정상 복사 | 반환값이 예상대로일 때는 그대로 진행 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 입력 재복사 | 위 내용 |
| **B (2회차)** | **`malloc` 실패 검사로 변형** | `fgets` 대신 `malloc`이 `NULL`을 반환하는 상황을 흉내내, 반환값 미검사 후 `NULL` 포인터에 그대로 쓰기 시도하는 패턴으로 바꿔본다 |
| **C (3회차)** | **여러 단계 체인으로 확장** | 읽기 → 파싱 → 저장까지 3단계로 늘리고, 각 단계의 반환값을 모두 검사해야만 마지막 단계까지 도달하는 함수로 만든다 |

---

## 2. 제출물

```text
sd42_except/src/except.h
sd42_except/src/except.c
sd42_except/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>
#include "except.h"

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

static void call_bad_fail(void)
{
    char fromBuf[10], toBuf[10];
    copy_input_bad(fromBuf, sizeof(fromBuf), 1 /* 읽기 실패 */, toBuf, sizeof(toBuf));
}

static void test_bad_is_vulnerable(void)
{
    T_TRUE(expect_crash(call_bad_fail) == 1,
        "Bad는 읽기 실패로 널 종료가 안 된 fromBuf를 그대로 strcpy해 오버플로우로 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    char fromBuf[10], toBuf[10];
    copy_input_bad(fromBuf, sizeof(fromBuf), 0 /* 정상 읽기 */, toBuf, sizeof(toBuf));
    T_TRUE(strcmp(toBuf, "hi") == 0, "정상 읽기에서는 크래시 없이 내용이 그대로 복사돼야 한다");
}

static void test_good_blocks_on_failure(void)
{
    char fromBuf[10];
    char toBuf[10] = "SENTINEL";
    int rc = copy_input_good(fromBuf, sizeof(fromBuf), 1 /* 읽기 실패 */, toBuf, sizeof(toBuf));
    T_TRUE(rc == -1, "Good은 읽기 실패를 감지하면 복사를 하지 않고 실패를 반환해야 한다");
}

static void test_good_normal(void)
{
    char fromBuf[10], toBuf[10];
    int rc = copy_input_good(fromBuf, sizeof(fromBuf), 0 /* 정상 읽기 */, toBuf, sizeof(toBuf));
    T_TRUE(rc == 0, "정상 읽기는 성공해야 한다");
    T_TRUE(strcmp(toBuf, "hi") == 0, "정상 읽기에서는 내용이 정확히 복사돼야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_on_failure();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] 왜 진짜 `fgets`가 아니라 `mock_fgets`인가
> 실제로 `fgets`를 표준입력에서 실패시키려면 스트림을 미리 닫거나 EOF를 정확한 타이밍에 줘야 해서 자동화된 반복 테스트로는 다루기 번거롭다. 이 드릴은 **"읽기에 실패하면 무슨 일이 벌어지는가"**가 핵심이지 `fgets` 자체가 핵심이 아니므로, `mock_fgets(buf, size, simulate_fail)`이라는 내부 헬퍼로 그 실패 상태(널 종료 없는 버퍼 + `NULL` 반환)를 결정론적으로 흉내낸다. README의 Part 3·4·6·7 재현 전략표에 적힌 "실패 주입(모의 실패 콜백)"이 바로 이 패턴이다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과(실제 크래시 감지) | 30 | ☐ |
| `test_good_blocks_on_failure` 통과(복사 없이 `-1`) | 35 | ☐ |
| `test_good_normal`/`test_bad_normal` 둘 다 통과 | 20 | ☐ |
| 목표 시간 내 | 15 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `if (retBuf == NULL)` 로만 검사 | 가이드 원문은 `retBuf != fromBuf` 로 비교한다. `fgets` 계열 함수는 실패 시 보통 `NULL`을 반환하지만, "성공하면 첫 번째 인자를 그대로 반환한다"는 계약 자체를 검사하는 것이 더 일반적이고 안전한 관용구다 |
| Good에서 실패 시에도 `to_buf`를 건드림(예: 빈 문자열로 초기화) | 요구사항은 "복사를 시도해서는 안 된다"이지 "안전하게 초기화하라"가 아니다. 실패 시 `to_buf`에 아예 손대지 않고 즉시 반환하는 것이 이 드릴의 핵심이다(테스트의 `SENTINEL` 값이 그대로 남아 있는지로 확인 가능) |
| `mock_fgets`가 실패 시 왜 버퍼를 `'A'`로 가득 채우는지 이해 못 함 | 단순히 아무 값이나 남겨두면(초기화 안 된 스택 메모리) 우연히 널 바이트가 포함되어 크래시가 재현 안 될 수도 있다. **의도적으로 널 바이트 없이 꽉 채워서** 오버플로우가 항상 결정론적으로 일어나게 만든 것이다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `except.h` / `except.c`
> ```c
> #ifndef EXCEPT_H
> #define EXCEPT_H
> #include <stddef.h>
> void copy_input_bad(char *from_buf, size_t from_size, int simulate_read_fail,
>                      char *to_buf, size_t to_size);
> int copy_input_good(char *from_buf, size_t from_size, int simulate_read_fail,
>                      char *to_buf, size_t to_size);
> #endif
> ```
> ```c
> #include <string.h>
> #include "except.h"
>
> /* 진짜 fgets() 대신, "읽기 실패로 널 종료가 안 된 상태"를 결정론적으로 재현하는 내부 헬퍼 */
> static char *mock_fgets(char *buf, size_t size, int simulate_fail)
> {
>     if (simulate_fail) {
>         memset(buf, 'A', size);      /* 널 바이트 없이 버퍼를 가득 채움 -- 실제 fgets 실패를 흉내 */
>         return NULL;                  /* fgets가 실패하면 NULL을 반환한다 */
>     }
>     strncpy(buf, "hi", size);
>     return buf;
> }
>
> void copy_input_bad(char *from_buf, size_t from_size, int simulate_read_fail,
>                      char *to_buf, size_t to_size)
> {
>     (void)to_size;
>     mock_fgets(from_buf, from_size, simulate_read_fail);   /* 반환값을 검사하지 않는다 */
>     strcpy(to_buf, from_buf);                               /* 널 종료가 안 되면 오버플로우 */
> }
>
> int copy_input_good(char *from_buf, size_t from_size, int simulate_read_fail,
>                      char *to_buf, size_t to_size)
> {
>     char *ret = mock_fgets(from_buf, from_size, simulate_read_fail);
>     if (ret != from_buf) return -1;                         /* 함수 호출 이후 결과 값을 비교 */
>     if (to_size <= strlen(from_buf)) return -1;
>     strcpy(to_buf, from_buf);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `copy_input_good`은 반환값 검사를 **두 번** 한다 — `mock_fgets`의 반환값(`ret != from_buf`)과 길이 검사(`to_size <= strlen(...)`). 하나의 함수 호출에 실패 지점이 여럿이면, 그만큼 검사도 여럿이어야 한다는 걸 보여준다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (입력 재복사) |  |  |  |
| 2 |  | B (malloc 실패 검사) |  |  |  |
| 3 |  | C (3단계 체인) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD41. 오류상황 대응 부재](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD41.%20오류상황%20대응%20부재%20—%20실제%20조치%20동반으로%20치환.md)
- Part 4(에러 처리) 3개 완료 — [다음: SD43. 널 포인터 역참조](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD43.%20널%20포인터%20역참조%20—%20반환값%20검사%20후%20사용으로%20치환.md)
