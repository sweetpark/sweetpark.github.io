---
title: "SD28. 취약한 암호화 알고리즘 사용 — 식별자 화이트리스트 검증으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD28. 취약한 암호화 알고리즘 사용 — 식별자 화이트리스트 검증으로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 9. 취약한 암호화 알고리즘 사용](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#9-취약한-암호화-알고리즘-사용-cwe-327) `CWE-327`
> **repo 폴더**: `sd28_cipherchoice/` (`make D=sd28_cipherchoice T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**

> [!IMPORTANT] 여기서부터(SD28~35)는 OpenSSL 없이 "선택 로직"만 검증한다
> 실제 암호화 연산은 하지 않는다. 학습 환경(WSL2/macOS)에 OpenSSL 개발 헤더가 없을 수 있어서, 이 계열은 **"이 코드가 올바른 알고리즘·키 길이·난수원을 선택하는가"** 를 문자열/상수 비교로 검증하는 데 집중한다. 실무에서 OpenSSL이 있다면 같은 골격에 `EVP_*` 호출만 얹으면 된다.

---

## 0. 이 드릴로 체화할 것

```diff
- int is_allowed_cipher_bad(const char *cipher_name) { (void)cipher_name; return 1; }
+ /* 블랙리스트로 위험 알고리즘 차단 + 화이트리스트에 없으면 기본 거부 */
+ for (BANNED 목록과 일치하면) return 0;
+ for (ALLOWED 목록과 일치하면) return 1;
+ return 0;
```

base64는 암호화가 아니라 인코딩이다. DES·3DES·RC4·MD5·SHA-1은 신규 사용 금지 — 검증필 모듈의 AES·ARIA·SEED만 쓴다.

---

## 1. 취약 시나리오 — 변형 A: 암호화 알고리즘 선택 게이트

> [!QUOTE] 요구사항서 (발췌)
> 암호화에 사용할 알고리즘 식별자 문자열을 검사해 허용 여부를 판정한다.
> - `AES-*`, `ARIA-*`, `SEED-*` 계열만 허용한다.
> - `DES`, `3DES`, `RC4`, `MD5`, `SHA1` 은 명시적으로 금지한다.

### 공격 입력표

| 알고리즘 식별자 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `AES-256-GCM` (정상) | 허용 | 정상 동작 |
| `DES-ECB` | **허용됨(취약)** | 검사 자체가 없다 |
| `MD5` | **허용됨(취약)** | 해시 무결성용 알고리즘도 그냥 통과 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 암호화 알고리즘 게이트 | 위 내용 |
| **B (2회차)** | **해시 알고리즘 전용 게이트** | 암호화가 아니라 무결성 검증용 해시(SHA-256 이상만 허용, MD5/SHA-1 금지)로 변형 |
| **C (3회차)** | **버전 접미사까지 검사** | `"AES-128"` 처럼 모드가 빠진 식별자(ECB 모드가 기본값으로 깔릴 위험)까지 걸러내도록 정규식 대신 문자열 파싱으로 모드 부분을 분리해 검사 |

---

## 2. 제출물

```text
sd28_cipherchoice/src/cipher_check.h
sd28_cipherchoice/src/cipher_check.c
sd28_cipherchoice/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "cipher_check.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(is_allowed_cipher_bad("DES-ECB") == 1,
        "Bad는 DES-ECB 같은 취약 알고리즘도 그대로 허용해야 한다(취약점 재현)");
    T_TRUE(is_allowed_cipher_bad("MD5") == 1, "Bad는 MD5도 허용해야 한다");
}

static void test_good_blocks_weak(void)
{
    T_TRUE(is_allowed_cipher_good("DES-ECB") == 0, "Good은 DES-ECB를 거부해야 한다");
    T_TRUE(is_allowed_cipher_good("RC4") == 0, "Good은 RC4를 거부해야 한다");
    T_TRUE(is_allowed_cipher_good("SHA1") == 0, "Good은 SHA1을 거부해야 한다");
}

static void test_good_allows_strong(void)
{
    T_TRUE(is_allowed_cipher_good("AES-256-GCM") == 1, "Good은 AES-256-GCM을 허용해야 한다");
}

static void test_good_default_deny(void)
{
    T_TRUE(is_allowed_cipher_good("SOME-UNKNOWN-CIPHER") == 0,
        "Good은 목록에 없는 미지의 알고리즘도 화이트리스트 원칙상 거부해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_weak();
    test_good_allows_strong();
    test_good_default_deny();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 20 | ☐ |
| `test_good_blocks_weak` 통과(DES/RC4/SHA1 전부) | 30 | ☐ |
| `test_good_allows_strong` 통과 | 15 | ☐ |
| `test_good_default_deny` 통과 — **미지의 값은 기본 거부**(화이트리스트 원칙) | 30 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 블랙리스트만 만들고 화이트리스트 기본 거부를 빼먹음 | 블랙리스트에 없는 새로운 취약 알고리즘(미래에 깨질 알고리즘)이 그냥 통과한다. 반드시 "허용 목록에 있는 것만" 통과시키는 이중 구조로 짠다 |
| 대소문자를 구분해서 `"aes-256-gcm"` 은 놓침 | 실무에서는 대소문자 정규화(대문자로 통일 등)를 먼저 하거나 대소문자 무관 비교를 쓴다 |
| base64 같은 인코딩 식별자를 화이트리스트에 올림 | base64는 암호화가 아니라 인코딩이다 — 애초에 이 목록에 낄 자격이 없다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `cipher_check.h` / `cipher_check.c`
> **헤더 (`cipher_check.h`)**
> ```c
> #ifndef CIPHER_CHECK_H
> #define CIPHER_CHECK_H
> int is_allowed_cipher_bad(const char *cipher_name);
> int is_allowed_cipher_good(const char *cipher_name);
> #endif
> ```
> **구현 (`cipher_check.c`)**
> ```c
> #include <string.h>
> #include <stddef.h>
> #include "cipher_check.h"
>
> int is_allowed_cipher_bad(const char *cipher_name)
> {
>     (void)cipher_name;
>     return 1;
> }
>
> static const char *BANNED[]  = { "DES-ECB", "3DES", "RC4", "MD5", "SHA1" };
> static const char *ALLOWED[] = { "AES-128-CBC", "AES-256-GCM", "ARIA-128-CBC", "SEED-CBC" };
>
> int is_allowed_cipher_good(const char *cipher_name)
> {
>     size_t i;
>     for (i = 0; i < sizeof(BANNED) / sizeof(BANNED[0]); i++)
>         if (strcmp(cipher_name, BANNED[i]) == 0) return 0;
>     for (i = 0; i < sizeof(ALLOWED) / sizeof(ALLOWED[0]); i++)
>         if (strcmp(cipher_name, ALLOWED[i]) == 0) return 1;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `is_allowed_cipher_good` 은 블랙리스트를 **먼저** 보고, 그다음 화이트리스트를 본다. 순서가 바뀌어도 결과는 같지만(둘 다 안 맞으면 결국 `0`), "명백히 위험한 것"을 먼저 걸러낸다는 코드의 의도가 이 순서에 드러난다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (암호화 게이트) |  |  |  |
| 2 |  | B (해시 게이트) |  |  |  |
| 3 |  | C (모드 검사) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD27. 주석문안 주요정보](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD27.%20주석문안에%20포함된%20주요정보%20—%20배포%20전%20자동%20검사로%20치환.md)
- [다음: SD29. 사용자 중요정보 평문 저장](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD29.%20사용자%20중요정보%20평문%20저장%28또는%20전송%29%20—%20전송%20전%20변환으로%20치환.md)
