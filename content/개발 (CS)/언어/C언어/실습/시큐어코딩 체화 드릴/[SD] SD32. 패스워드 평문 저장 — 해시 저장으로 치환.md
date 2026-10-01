---
title: "SD32. 패스워드 평문 저장 — 해시 저장으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD32. 패스워드 평문 저장 — 해시 저장으로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 13. 패스워드 평문 저장](../../시큐어코딩가이드/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#13-패스워드-평문-저장-cwe-256) `CWE-256`
> **repo 폴더**: `sd32_pwplain/` (`make D=sd32_pwplain T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> SD29와 헷갈리기 쉽다 — SD29는 "전송 중" 노출, 이 항목은 **"저장된 상태"** 자체가 평문인가를 다룬다. 저장 형식을 아예 다른 타입(`unsigned` 해시값)으로 바꿔서 "구조적으로 평문일 수 없게" 만드는 방식을 쓴다.

---

## 0. 이 드릴로 체화할 것

```diff
- void save_password_bad(const char *pw, char *stored, size_t size) { strncpy(stored, pw, ...); }
- int verify_password_bad(const char *stored, const char *input) { return strcmp(stored, input) == 0; }
+ void save_password_good(const char *pw, unsigned *stored) { *stored = toy_hash(pw); }
+ int verify_password_good(unsigned stored, const char *input) { return toy_hash(input) == stored; }
```

패스워드는 암호화해서 저장하거나, 인증 목적이면 복호화 가능한 암호화 대신 **일방향 해시**로 저장한다.

---

## 1. 취약 시나리오 — 변형 A: 설정 파일 인증

> [!QUOTE] 요구사항서 (발췌)
> 설정 파일에 저장된 값과 사용자가 입력한 패스워드를 대조해 인증한다.
> - 저장된 값 자체에서 원본 패스워드를 알 수 없어야 한다.

### 공격 입력표

| 저장 방식 | 저장된 값에서 원본 패스워드를 알 수 있는가 | 위험 |
| :--- | :--- | :--- |
| 평문(Bad) | **그대로 보인다** | 설정 파일 하나만 유출되면 패스워드 전체 노출 |
| 해시(Good) | 알 수 없다(단방향) | 유출돼도 원본 복원 불가 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 설정 파일 인증 | 위 내용 |
| **B (2회차)** | **비밀번호 변경 시 이전 값과 비교** | "새 비밀번호가 이전 3개와 달라야 한다"는 요구사항을 해시값만 비교해서 구현(평문 이력을 남기지 않고도 정책을 지킬 수 있음을 보여줌) |
| **C (3회차)** | **SD33(솔트)과 결합** | 이 드릴의 `toy_hash` 를 SD33의 솔트 방식과 합쳐, 최종적으로 "솔트+해시" 저장 형태를 완성 |

---

## 2. 제출물

```text
sd32_pwplain/src/pw_store.h
sd32_pwplain/src/pw_store.c
sd32_pwplain/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <string.h>
#include "pw_store.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char stored[32];
    save_password_bad("hunter2", stored, sizeof(stored));
    T_TRUE(strcmp(stored, "hunter2") == 0,
        "Bad는 저장된 값 자체가 원본 패스워드와 완전히 같아야 한다(평문 저장 재현)");
}

static void test_bad_normal(void)
{
    char stored[32];
    save_password_bad("hunter2", stored, sizeof(stored));
    T_TRUE(verify_password_bad(stored, "hunter2") == 1, "정상 인증은 통과해야 한다");
    T_TRUE(verify_password_bad(stored, "wrong") == 0, "틀린 패스워드는 실패해야 한다");
}

static void test_good_never_stores_plaintext(void)
{
    unsigned stored;
    save_password_good("hunter2", &stored);
    T_TRUE(stored != 0, "저장된 해시값이 존재해야 한다(타입 자체가 평문일 수 없음을 구조로 보증)");
}

static void test_good_normal(void)
{
    unsigned stored;
    save_password_good("hunter2", &stored);
    T_TRUE(verify_password_good(stored, "hunter2") == 1, "정상 인증은 통과해야 한다");
    T_TRUE(verify_password_good(stored, "wrong") == 0, "틀린 패스워드는 실패해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_never_stores_plaintext();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!TIP] "타입이 다르다"는 것 자체가 방어다
> `stored` 가 `char[]` 이 아니라 `unsigned` 라는 사실만으로 "여기엔 원본 문자열이 들어갈 수 없다"는 게 컴파일 타임에 보장된다. 리뷰어가 코드를 볼 때 **자료형만 보고도** 평문 저장 여부를 의심할 수 있다는 걸 기억한다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 20 | ☐ |
| `test_good_never_stores_plaintext` / `test_good_normal` 통과 | 45 | ☐ |
| 저장 타입이 원본 문자열을 담을 수 없는 타입(`unsigned` 등)이다 | 25 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `toy_hash` 를 실제 프로덕션 해시로 착각 | djb2류 체크섬은 암호학적 해시가 아니다(충돌·역산이 쉽다). 이 드릴은 **저장 구조**(평문 vs 해시)의 차이만 보여준다 — 실전은 PBKDF2/bcrypt/scrypt/Argon2 |
| SD29(전송)와 SD32(저장)를 같은 문제로 취급 | 전송은 양방향(복호화 필요), 저장은 단방향(복호화 불필요, 오히려 안 되는 게 낫다)이 원칙이다. 이 둘을 같은 함수로 처리하면 안 된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `pw_store.h` / `pw_store.c`
> ```c
> #ifndef PW_STORE_H
> #define PW_STORE_H
> #include <stddef.h>
> unsigned toy_hash(const char *s);
> void save_password_bad(const char *pw, char *stored, size_t size);
> int verify_password_bad(const char *stored, const char *input);
> void save_password_good(const char *pw, unsigned *stored);
> int verify_password_good(unsigned stored, const char *input);
> #endif
> ```
> ```c
> #include <string.h>
> #include "pw_store.h"
>
> unsigned toy_hash(const char *s)
> {
>     unsigned h = 5381;
>     while (*s) h = ((h << 5) + h) + (unsigned char)(*s++);
>     return h;
> }
>
> void save_password_bad(const char *pw, char *stored, size_t size)
> {
>     strncpy(stored, pw, size - 1);
>     stored[size - 1] = '\0';
> }
>
> int verify_password_bad(const char *stored, const char *input)
> {
>     return strcmp(stored, input) == 0;
> }
>
> void save_password_good(const char *pw, unsigned *stored) { *stored = toy_hash(pw); }
> int verify_password_good(unsigned stored, const char *input) { return toy_hash(input) == stored; }
> ```
>
> **눈여겨볼 점**: `verify_password_good` 은 저장된 값을 **복호화하지 않는다** — 입력을 다시 해시해서 저장된 해시와 비교할 뿐이다. "원본을 절대 복원하지 않고도 검증할 수 있다"는 게 단방향 해시의 핵심이다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (설정 파일) |  |  |  |
| 2 |  | B (이전 값 비교) |  |  |  |
| 3 |  | C (솔트 결합) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD31. 적절하지 않은 난수 값]([SD]%20SD31.%20적절하지%20않은%20난수%20값의%20사용%20—%20커널%20CSPRNG로%20치환.md)
- [다음: SD33. 솔트 없는 일방향 해쉬]([SD]%20SD33.%20솔트%20없이%20일방향%20해쉬%20함수%20사용%20—%20사용자별%20난수%20솔트로%20치환.md)
