---
title: "SD31. 적절하지 않은 난수 값의 사용 — 커널 CSPRNG로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD31. 적절하지 않은 난수 값의 사용 — 커널 CSPRNG로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 12. 적절하지 않은 난수 값의 사용](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#12-적절하지-않은-난수-값의-사용-cwe-330) `CWE-330`
> **repo 폴더**: `sd31_weakrandom/` (`make D=sd31_weakrandom T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 2-3에서 유일하게 **실제 동작으로 완전히 재현**되는 드릴이다 — `getrandom()` 이 진짜 예측 불가능한 값을 만드는지 직접 확인한다.

---

## 0. 이 드릴로 체화할 것

```diff
- srand(seed); for (...) out[i] = "0123456789abcdef"[rand() % 16];   /* seed만 알면 재현됨 */
+ if (getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw)) return -1;  /* 실패는 반드시 중단 */
+ for (...) sprintf(out + i*2, "%02x", raw[i]);
```

seed를 바꾸는 것으로는 해결되지 않는다. `rand()` 계열은 보안용이 아니며, 커널 CSPRNG(`getrandom`)로 통째로 교체해야 한다.

---

## 1. 취약 시나리오 — 변형 A: 세션 토큰 생성

> [!QUOTE] 요구사항서 (발췌)
> 32자 16진수 세션 토큰을 생성한다.
> - 토큰은 예측 불가능해야 한다.
> - 난수 생성에 실패하면 반드시 에러를 반환해야 한다(약한 값으로 대체 금지).

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 같은 seed로 두 번 생성 | **완전히 같은 토큰** | `rand()` 는 seed가 같으면 항상 같은 시퀀스를 낸다(예측 가능) |
| 매번 새로 생성(Good) | 매번 다른 토큰 | 커널 CSPRNG는 내부 엔트로피 풀에서 뽑는다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 세션 토큰 생성 | 위 내용 |
| **B (2회차)** | **일회용 비밀번호(OTP) 생성** | 16진수 대신 6자리 숫자 OTP로 변형 — `getrandom` 결과를 숫자 범위로 매핑할 때 모듈로 편향(modulo bias)이 생기지 않게 하는 법까지 고려 |
| **C (3회차)** | **초기화 벡터(IV) 생성** | AES-CBC용 16바이트 IV를 만드는 함수로 변형. IV는 비밀은 아니지만 예측 불가능해야 하는 이유를 설명해본다 |

---

## 2. 제출물

```text
sd31_weakrandom/src/token_gen.h
sd31_weakrandom/src/token_gen.c
sd31_weakrandom/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <string.h>
#include "token_gen.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char t1[33], t2[33];
    gen_token_bad(1, t1, sizeof(t1));
    gen_token_bad(1, t2, sizeof(t2));
    T_TRUE(strcmp(t1, t2) == 0,
        "Bad는 같은 seed면 항상 같은 토큰을 만들어야 한다(예측 가능함 = 취약점 재현)");
}

static void test_bad_normal(void)
{
    char t1[33], t2[33];
    gen_token_bad(1, t1, sizeof(t1));
    gen_token_bad(2, t2, sizeof(t2));
    T_TRUE(strcmp(t1, t2) != 0, "적어도 seed가 다르면 결과도 달라진다(그래도 예측 가능한 건 여전함)");
}

static void test_good_is_unpredictable(void)
{
    char t1[33], t2[33];
    T_TRUE(gen_token_good(t1, sizeof(t1)) == 0, "정상 크기 버퍼는 성공해야 한다");
    T_TRUE(gen_token_good(t2, sizeof(t2)) == 0, "두 번째 호출도 성공해야 한다");
    T_TRUE(strcmp(t1, t2) != 0,
        "Good은 매 호출마다 다른 토큰을 만들어야 한다(진짜 난수원을 쓴다는 증거)");
}

static void test_good_rejects_small_buffer(void)
{
    char tiny[4];
    T_TRUE(gen_token_good(tiny, sizeof(tiny)) == -1, "Good은 버퍼가 너무 작으면 실패로 알려야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_is_unpredictable();
    test_good_rejects_small_buffer();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] macOS에서는 `getrandom` 대신 `arc4random_buf`
> macOS는 `<sys/random.h>` 의 `getrandom()` 대신 `<stdlib.h>` 의 `arc4random_buf(buf, len)` 을 쓴다(반환값이 없고 항상 성공). 이 드릴을 macOS에서 풀 때는 `#ifdef __APPLE__` 로 분기하거나, 실패 처리 로직 없이 `arc4random_buf` 만 써도 된다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 20 | ☐ |
| `test_good_is_unpredictable` 통과 — **실제로 다른 값**이 나온다 | 40 | ☐ |
| `test_good_rejects_small_buffer` 통과 | 20 | ☐ |
| `getrandom` 실패 시 약한 값으로 대체하지 않고 `-1` 을 반환한다 | 15 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `srand(time(NULL))` 로 "개선"했다고 착각 | seed가 초 단위 시각이면 하루치 후보가 86400개뿐이라 전수 시도로 재현된다. 여전히 `rand()` 계열 자체가 문제다 |
| `getrandom` 실패 시 `rand()` 로 폴백 | "실패하면 약한 값이라도 쓰자"는 대응이 가장 위험하다. 실패는 반드시 호출자에게 알리고 중단한다 |
| 반환된 바이트를 `%d` 로 찍어 10진수 토큰을 만듦 | 바이트당 표현 범위가 줄어 엔트로피가 낭비된다. 16진수(`%02x`)로 그대로 펼치는 것이 표준적이다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `token_gen.h` / `token_gen.c`
> ```c
> #ifndef TOKEN_GEN_H
> #define TOKEN_GEN_H
> #include <stddef.h>
> void gen_token_bad(unsigned seed, char *out, size_t out_size);
> int gen_token_good(char *out, size_t out_size);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <stdlib.h>
> #include <stdio.h>
> #include <sys/random.h>
> #include "token_gen.h"
>
> void gen_token_bad(unsigned seed, char *out, size_t out_size)
> {
>     size_t i;
>     srand(seed);
>     for (i = 0; i + 1 < out_size; i++)
>         out[i] = "0123456789abcdef"[rand() % 16];
>     out[i] = '\0';
> }
>
> int gen_token_good(char *out, size_t out_size)
> {
>     unsigned char raw[16];
>     size_t i;
>     if (out_size < sizeof(raw) * 2 + 1) return -1;
>     if (getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw)) return -1;
>     for (i = 0; i < sizeof(raw); i++)
>         sprintf(out + i * 2, "%02x", raw[i]);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `gen_token_bad` 는 `seed` 를 **인자로 받는다** — 즉 함수 시그니처 자체가 "이 값은 재현 가능하다"고 선언하고 있는 셈이다. `gen_token_good` 에는 seed 인자가 아예 없다. 함수가 무엇을 인자로 받는지가 곧 그 함수의 예측 가능성을 말해준다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (세션 토큰) |  |  |  |
| 2 |  | B (OTP) |  |  |  |
| 3 |  | C (IV) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD30. 충분하지 못한 키 길이](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD30.%20충분하지%20못한%20키%20길이%20사용%20—%20최소%20길이%20상수%20검증으로%20치환.md)
- [다음: SD32. 패스워드 평문 저장](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD32.%20패스워드%20평문%20저장%20—%20해시%20저장으로%20치환.md)
