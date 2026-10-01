---
title: "SD45. 부호 정수를 무부호 정수로 타입 변환 오류 — 안전한 에러값으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD45. 부호 정수를 무부호 정수로 타입 변환 오류 — 안전한 에러값으로 치환

> **원본 항목**: [Part 5. 코드 오류 — 3. 부호 정수를 무부호 정수로 타입 변환 오류](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/[시큐어코딩]%20Part%205.%20코드%20오류.md#3-부호-정수를-무부호-정수로-타입-변환-오류-cwe-195) `CWE-195`
> **repo 폴더**: `sd45_signconv/` (`make D=sd45_signconv T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> `-1`이 `unsigned int`로 감기면 `4294967295`가 된다는 걸 값 비교로 확인하는 데서 그치지 않고, **그 값이 실제 경계 검사를 무력화시키는 순간**까지 재현한다.

---

## 0. 이 드릴로 체화할 것

```diff
  unsigned int len(char *s) {
-     if (s == NULL) return -1;      /* -1 -> 4294967295 */
+     if (s == NULL) return 0;       /* 무부호에 안전한 0 반환 */
      return strnlen(s, BUFSIZE-1);
  }
```

에러를 `-1`로 표시하는 관용구는 반환형이 `signed`일 때만 안전하다. 반환형이 `unsigned`인 함수에서 `-1`은 최댓값으로 감겨버려, "에러"가 "역대 가장 큰 정상값"으로 둔갑한다.

---

## 1. 취약 시나리오 — 변형 A: 문자열 길이 조회 + 경계 검사

> [!QUOTE] 요구사항서 (발췌)
> 문자열의 길이를 구해 인덱스 접근 범위를 검사하는 데 사용한다.
> - 문자열이 `NULL`이면 그 어떤 인덱스도 "범위 안"으로 판정되어서는 안 된다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `len_bad()`의 반환값(`unsigned int`) | `NULL` 에러 표시(`-1`) | 이후 `idx < len` 같은 경계 검사식의 우변 |

### 공격 입력표

| 입력 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `len_bad(NULL)` | `4294967295`(`UINT_MAX`) | `-1`이 `unsigned int`로 변환되며 최댓값으로 감긴다 |
| `within_len_bad(999999, NULL)` | **`참`(범위 안으로 착각)** | `999999 < 4294967295`이 참이 되어, 원래는 무조건 거부돼야 할 접근이 통과해버린다 |
| 같은 상황(Good) | `within_len_good(999999, NULL)` → **`거짓`** | `len_good(NULL)`이 `0`이라 `999999 < 0`은 항상 거짓(무부호라 음수 자체가 없음에도 검사가 의도대로 작동) |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 문자열 길이 조회 + 경계 검사 | 위 내용 |
| **B (2회차)** | **`memcpy` 길이 인자로 변형** | `len_bad`의 결과를 `memcpy(dst, src, len)`의 세 번째 인자로 그대로 넘기는 함수를 만들어, "거대한 길이로 복사를 시도하다 즉시 실패/크래시"하는 것까지 이어서 본다(직접 `memcpy`를 실행하지 않고 "그 크기를 받아들이는지"만 확인해도 충분하다) |
| **C (3회차)** | **`size_t` 버전으로 확장** | `unsigned int` 대신 `size_t`(64비트 플랫폼에서는 8바이트)로 바꿔, 같은 문제가 자료형이 커져도 동일하게 발생함을 확인한다 |

---

## 2. 제출물

```text
sd45_signconv/src/signconv.h
sd45_signconv/src/signconv.c
sd45_signconv/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <limits.h>
#include "signconv.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_wraps_to_uint_max(void)
{
    T_TRUE(len_bad(NULL) == UINT_MAX,
        "Bad는 NULL에서 -1을 unsigned로 반환해 UINT_MAX로 감겨야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    T_TRUE(len_bad("hi") == 2, "정상 문자열은 길이를 정확히 반환해야 한다");
}

static void test_good_returns_zero(void)
{
    T_TRUE(len_good(NULL) == 0, "Good은 NULL에서 무부호에 안전한 0을 반환해야 한다");
}

static void test_good_normal(void)
{
    T_TRUE(len_good("hi") == 2, "정상 문자열은 길이를 정확히 반환해야 한다");
}

static void test_bad_bounds_check_bypassed(void)
{
    T_TRUE(within_len_bad(999999u, NULL) != 0,
        "Bad는 -1이 UINT_MAX로 감겨서 어떤 큰 idx도 범위 안으로 착각해야 한다(경계검사 무력화 재현)");
}

static void test_good_bounds_check_holds(void)
{
    T_TRUE(within_len_good(999999u, NULL) == 0,
        "Good은 0을 반환하므로 같은 idx가 범위 밖으로 올바르게 거부돼야 한다");
}

int main(void)
{
    test_bad_wraps_to_uint_max();
    test_bad_normal();
    test_good_returns_zero();
    test_good_normal();
    test_bad_bounds_check_bypassed();
    test_good_bounds_check_holds();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!WARNING] `_DEFAULT_SOURCE`가 필요하다
> `strnlen()`은 POSIX 확장 함수라 `-std=c11 -pedantic` 아래에서는 `#define _DEFAULT_SOURCE`를 첫 `#include`보다 먼저 적어야 한다([SD06](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD06.%20디렉터리%20경로%20조작%20—%20절대경로%20정규화%20검증으로%20치환.md)에서 다룬 것과 같은 이슈).

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_wraps_to_uint_max` 통과 | 20 | ☐ |
| `test_good_returns_zero` 통과 | 20 | ☐ |
| `test_bad_bounds_check_bypassed`/`test_good_bounds_check_holds` 둘 다 통과(실제 경계 검사 영향까지 확인) | 40 | ☐ |
| 목표 시간 내 | 20 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `return -1`을 `return (unsigned int)0 - 1`로 바꿔서 "고쳤다"고 착각 | 표현만 바뀌었을 뿐 값은 여전히 `UINT_MAX`다. 핵심은 "감기지 않는 표현"이 아니라 **"에러를 나타내는 값 자체를 0처럼 안전한 값으로 바꾸는 것"**이다 |
| 호출자 쪽에서 `(int)len_bad(s) == -1`로 검사하려 함 | 함수가 이미 `unsigned int`를 반환하기로 계약했는데 호출자가 다시 `int`로 캐스팅해 검사하는 건 임시방편이다. 함수 시그니처 자체(반환형과 에러값)를 무부호에 안전하게 설계하는 게 근본 해결책이다 |
| "이 값이 인덱스나 길이로 쓰이지 않으니 상관없다"고 넘김 | 지금 안 쓰여도 나중에 다른 코드가 이 반환값을 경계 검사나 메모리 크기로 재사용할 수 있다. 함수의 반환값 계약은 사용처와 무관하게 항상 안전해야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `signconv.h` / `signconv.c`
> ```c
> #ifndef SIGNCONV_H
> #define SIGNCONV_H
> unsigned int len_bad(const char *s);
> unsigned int len_good(const char *s);
> int within_len_bad(unsigned int idx, const char *s);
> int within_len_good(unsigned int idx, const char *s);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <string.h>
> #include "signconv.h"
>
> #define BUFSIZE 256
>
> unsigned int len_bad(const char *s)
> {
>     if (s == NULL) return (unsigned int)-1;   /* -1 -> 4294967295 */
>     return (unsigned int)strnlen(s, BUFSIZE - 1);
> }
>
> unsigned int len_good(const char *s)
> {
>     if (s == NULL) return 0;                   /* 무부호에 안전한 0 반환 */
>     return (unsigned int)strnlen(s, BUFSIZE - 1);
> }
>
> int within_len_bad(unsigned int idx, const char *s)
> {
>     return idx < len_bad(s);
> }
>
> int within_len_good(unsigned int idx, const char *s)
> {
>     return idx < len_good(s);
> }
> ```
>
> **눈여겨볼 점**: `within_len_bad`와 `within_len_good`은 **완전히 동일한 코드**(`idx < len(s)`)다. 버그는 이 비교식이 아니라 **비교 대상이 되는 함수의 에러값 설계**에 있었다. 같은 로직이라도 그 로직이 딛고 선 함수의 계약이 잘못되면 결과가 뒤집힌다는 걸 보여주는 좋은 예다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (길이 조회 + 경계 검사) |  |  |  |
| 2 |  | B (memcpy 길이 인자) |  |  |  |
| 3 |  | C (size_t 확장) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD44. 부적절한 자원 해제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD44.%20부적절한%20자원%20해제%20—%20단일%20해제%20지점으로%20치환.md)
- [다음: SD46. 정수를 문자로 변환](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD46.%20정수를%20문자로%20변환%20—%20용도에%20맞는%20타입%20선언으로%20치환.md)
