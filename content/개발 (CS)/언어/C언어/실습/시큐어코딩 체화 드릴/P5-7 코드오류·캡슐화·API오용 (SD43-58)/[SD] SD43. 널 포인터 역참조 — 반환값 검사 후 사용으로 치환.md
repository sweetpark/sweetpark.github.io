---
title: "SD43. 널 포인터 역참조 — 반환값 검사 후 사용으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD43. 널 포인터 역참조 — 반환값 검사 후 사용으로 치환

> **원본 항목**: [Part 5. 코드 오류 — 1. 널(Null)포인터 역참조](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#1-널null포인터-역참조-cwe-476) `CWE-476`
> **repo 폴더**: `sd43_nullderef/` (`make D=sd43_nullderef T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 5(코드 오류, 9개)의 첫 드릴이다. `getenv()`는 값이 없으면 `NULL`을 반환하는데, 실제 프로세스 환경변수 상태에 의존하면 테스트가 실행 환경마다 달라지므로 `lookup_env_like()`라는 결정론적 대역으로 같은 계약(못 찾으면 `NULL`)을 재현한다.

---

## 0. 이 드릴로 체화할 것

```diff
  const char *p = lookup_env_like(key);
- strncpy(out, p, out_size - 1);                  /* NULL 검사 없이 역참조 */
+ if (p == NULL) return -1;                        /* 사용 전 NULL 검사 */
+ strncpy(out, p, out_size - 1);
```

"이 함수가 실패하면 `NULL`을 반환할 수 있는가"를 팀 표준으로 정하고, 역참조 직전에 무조건 검사하는 습관을 들인다.

---

## 1. 취약 시나리오 — 변형 A: 환경설정 값 복사

> [!QUOTE] 요구사항서 (발췌)
> 설정 키에 해당하는 값을 복사해 반환한다.
> - 존재하지 않는 키가 들어와도 프로세스가 죽어서는 안 된다.
> - 실패는 호출자에게 알려야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `lookup_env_like()`의 반환값 | 설정 조회 결과(`getenv`류) | 검사 없이 바로 넘어가는 `strncpy`의 원본 포인터 |

### 공격 입력표

| 입력(`key`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `"MISSING_VAR"`(존재하지 않는 키) | **NULL 역참조로 크래시**(`expect_crash`가 감지) | `lookup_env_like`가 `NULL`을 반환해도 검사 없이 바로 `strncpy`에 넘긴다 |
| `"HOME"`(존재하는 키, Bad에서도) | 정상 복사 | 정상 입력에서는 Bad도 문제없이 동작한다 — "항상 죽는다"가 아니라 "특정 입력에서만 죽는다"는 걸 확인 |
| `"MISSING_VAR"`(Good) | `-1` 반환, 크래시 없음 | 역참조 전에 `NULL` 검사로 걸러낸다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 환경설정 값 복사 | 위 내용 |
| **B (2회차)** | **구조체 멤버 포인터로 변형** | `lookup_env_like`가 문자열 대신 `struct config *`를 반환하는(못 찾으면 `NULL`) 형태로 바꿔, 포인터 멤버 접근(`cfg->value`) 전에 검사하는 패턴으로 확장한다 |
| **C (3회차)** | **여러 단계 체이닝** | "설정 조회 → 그 결과로 다른 조회 → 최종 사용"까지 3단계로 늘려, 중간 단계 중 하나라도 `NULL`이면 전체가 안전하게 실패해야 하는 함수로 만든다 |

---

## 2. 제출물

```text
sd43_nullderef/src/nullderef.h
sd43_nullderef/src/nullderef.c
sd43_nullderef/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>
#include "nullderef.h"

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

static void call_bad_missing(void)
{
    char out[64];
    copy_env_bad("MISSING_VAR", out, sizeof(out));
}

static void test_bad_is_vulnerable(void)
{
    T_TRUE(expect_crash(call_bad_missing) == 1,
        "Bad는 알 수 없는 키에서 NULL을 검사 없이 역참조해 크래시해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    char out[64];
    copy_env_bad("HOME", out, sizeof(out));
    T_TRUE(strcmp(out, "/home/appuser") == 0, "알려진 키에서는 크래시 없이 정상 복사돼야 한다");
}

static void test_good_blocks_null(void)
{
    char out[64];
    T_TRUE(copy_env_good("MISSING_VAR", out, sizeof(out)) == -1,
        "Good은 NULL을 검사해 알 수 없는 키에서 실패를 반환해야 한다");
}

static void test_good_normal(void)
{
    char out[64];
    T_TRUE(copy_env_good("HOME", out, sizeof(out)) == 0, "알려진 키에서는 성공해야 한다");
    T_TRUE(strcmp(out, "/home/appuser") == 0, "복사된 내용이 정확해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_null();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] 이 크래시는 두 단계로 보고된다
> `make check`를 돌리면 먼저 UBSan이 "`strncpy`의 두 번째 인자가 `NULL`이면 안 된다"(`nonnull attribute`)는 **경고를 출력하고 계속 진행**한다(UBSan은 기본적으로 복구 가능 모드). 그 직후 `strncpy` 내부가 실제로 주소 `0`을 읽으려다 진짜 `SIGSEGV`가 나고, 이걸 ASan이 잡아 프로세스를 중단시킨다. 두 리포트 모두 "실패가 아니라 증거"다 — [SD17](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD17.%20정수%20오버플로우%20—%20연산%20전%20오버플로우%20검사로%20치환.md)에서 본 "UBSan 리포트 + ASan abort" 조합과 같은 패턴이다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 25 | ☐ |
| `test_bad_normal` 통과 | 15 | ☐ |
| `test_good_blocks_null` 통과 | 35 | ☐ |
| `test_good_normal` 통과 | 15 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `if (p)` 만 쓰고 `else` 경로에서 아무 것도 안 함 | 검사만 하고 실패를 호출자에게 알리지 않으면 [SD41](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD41.%20오류상황%20대응%20부재%20—%20실제%20조치%20동반으로%20치환.md)의 "오류상황 대응 부재"로 그대로 이어진다. 검사와 조치는 항상 짝이어야 한다 |
| `assert(p != NULL)`로 대체 | `assert`는 릴리스 빌드(`NDEBUG`)에서 통째로 사라진다. 보안에 중요한 검사를 `assert`에만 의존하면 프로덕션에서는 검사 자체가 없는 것과 같다 |
| "이 값은 항상 존재한다"고 가정하고 검사를 생략 | 지금 항상 존재해도, 설정 파일이 바뀌거나 배포 환경이 달라지면 언제든 `NULL`이 될 수 있다. 반환형에 `NULL` 가능성이 명시된 함수는 예외 없이 검사한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `nullderef.h` / `nullderef.c`
> ```c
> #ifndef NULLDEREF_H
> #define NULLDEREF_H
> #include <stddef.h>
> const char *lookup_env_like(const char *key);
> void copy_env_bad(const char *key, char *out, size_t out_size);
> int copy_env_good(const char *key, char *out, size_t out_size);
> #endif
> ```
> ```c
> #include <string.h>
> #include "nullderef.h"
>
> const char *lookup_env_like(const char *key)
> {
>     if (strcmp(key, "HOME") == 0) return "/home/appuser";
>     return NULL;                                   /* 미설정 시 NULL 반환 */
> }
>
> void copy_env_bad(const char *key, char *out, size_t out_size)
> {
>     const char *p = lookup_env_like(key);
>     strncpy(out, p, out_size - 1);                  /* NULL 검사 없이 역참조 */
>     out[out_size - 1] = '\0';
> }
>
> int copy_env_good(const char *key, char *out, size_t out_size)
> {
>     const char *p = lookup_env_like(key);
>     if (p == NULL) return -1;                        /* 사용 전 NULL 검사 */
>     strncpy(out, p, out_size - 1);
>     out[out_size - 1] = '\0';
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `copy_env_good`은 `copy_env_bad`보다 딱 **두 줄**(`if (p == NULL) return -1;`) 많다. 이 항목 전체에서 가장 짧은 치환 규칙 중 하나지만, 이 두 줄이 빠지면 CWE-476이 성립한다는 걸 기억한다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (환경설정 값 복사) |  |  |  |
| 2 |  | B (구조체 멤버 포인터) |  |  |  |
| 3 |  | C (여러 단계 체이닝) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD42. 적절하지 않은 예외처리](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD42.%20적절하지%20않은%20예외처리%20—%20반환값%20검사%20동반으로%20치환.md)
- [다음: SD44. 부적절한 자원 해제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD44.%20부적절한%20자원%20해제%20—%20단일%20해제%20지점으로%20치환.md)
