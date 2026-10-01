---
title: "SD30. 충분하지 못한 키 길이 사용 — 최소 길이 상수 검증으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD30. 충분하지 못한 키 길이 사용 — 최소 길이 상수 검증으로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 11. 충분하지 못한 키 길이 사용](../../시큐어코딩가이드/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#11-충분하지-못한-키-길이-사용-cwe-310) `CWE-310`
> **repo 폴더**: `sd30_keylen/` (`make D=sd30_keylen T=main`)
> **목표 시간**: 1회차 8분 / 2회차 5분 / **3회차 3분**
> Part 2-3에서 가장 짧은 드릴 — 검사 로직 자체는 한 줄이지만, "그 한 줄이 왜 빠지기 쉬운가"를 체감하는 게 목적이다.

---

## 0. 이 드릴로 체화할 것

```diff
- int validate_key_length_bad(int key_bits) { (void)key_bits; return 1; }
+ int validate_key_length_good(int key_bits) { return key_bits >= MIN_SYMMETRIC_KEY_BITS; }
```

알고리즘이 안전해도 키가 짧으면 무의미하다. 대칭키 128비트 이상, RSA 2048비트 이상이 하한선이다.

---

## 1. 취약 시나리오 — 변형 A: 대칭키 길이 검증

> [!QUOTE] 요구사항서 (발췌)
> 암호화에 쓸 대칭키의 비트 수를 검증한다. 128비트 미만은 거부한다.

### 공격 입력표

| `key_bits` | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 256 (정상) | 통과 | 충분한 길이 |
| 56(DES 수준) | **통과(취약)** | 검사 자체가 없다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 대칭키 길이 검증(최소 128) | 위 내용 |
| **B (2회차)** | **RSA 키 길이 검증** | 최소 기준을 2048로, 3072 이상이면 "권장" 등급까지 반환하는 3단계(거부/최소/권장) 함수로 확장 |
| **C (3회차)** | **알고리즘별 최소 기준표** | SD28의 화이트리스트와 결합해, 알고리즘 이름에 따라 다른 최소 키 길이를 요구하는 테이블 기반 검증으로 발전 |

---

## 2. 제출물

```text
sd30_keylen/src/key_length.h
sd30_keylen/src/key_length.c
sd30_keylen/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "key_length.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(validate_key_length_bad(56) == 1,
        "Bad는 DES 수준의 56비트 키도 그대로 통과시켜야 한다(취약점 재현)");
    T_TRUE(validate_key_length_bad(0) == 1, "Bad는 0비트도 통과시킨다");
}

static void test_good_blocks_short_key(void)
{
    T_TRUE(validate_key_length_good(56) == 0, "Good은 56비트 키를 거부해야 한다");
    T_TRUE(validate_key_length_good(64) == 0, "Good은 64비트 키도 거부해야 한다");
}

static void test_good_normal(void)
{
    T_TRUE(validate_key_length_good(128) == 1, "Good은 128비트 키는 통과시켜야 한다(경계값)");
    T_TRUE(validate_key_length_good(256) == 1, "Good은 256비트 키도 통과시켜야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_short_key();
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
| `test_good_blocks_short_key` 통과 | 35 | ☐ |
| `test_good_normal` 통과 — 경계값(128) 포함 | 30 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `key_bits > MIN` 으로 써서 정확히 128을 거부 | 경계값 처리 실수다. "128비트 이상"이므로 `>=` 가 맞다 |
| 이 검사를 알고리즘 선택(SD28) 로직과 분리하지 않고 하나로 뭉침 | 알고리즘 종류와 키 길이는 서로 다른 축의 검증이다. 함수를 분리해야 SD30 변형 C(알고리즘별 기준표)로 자연스럽게 확장된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `key_length.h` / `key_length.c`
> ```c
> #ifndef KEY_LENGTH_H
> #define KEY_LENGTH_H
> int validate_key_length_bad(int key_bits);
> int validate_key_length_good(int key_bits);
> #endif
> ```
> ```c
> #include "key_length.h"
> #define MIN_SYMMETRIC_KEY_BITS 128
>
> int validate_key_length_bad(int key_bits) { (void)key_bits; return 1; }
> int validate_key_length_good(int key_bits) { return key_bits >= MIN_SYMMETRIC_KEY_BITS; }
> ```
>
> **눈여겨볼 점**: `MIN_SYMMETRIC_KEY_BITS` 가 매직 넘버(128)가 아니라 **이름 있는 상수**다. 기준이 나중에 바뀌어도(예: 256으로 상향) 이 한 줄만 고치면 된다 — SD17의 "이름 있는 상수" 원칙이 여기서도 반복된다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (대칭키) |  |  |  |
| 2 |  | B (RSA) |  |  |  |
| 3 |  | C (기준표) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD29. 사용자 중요정보 평문 저장]([SD]%20SD29.%20사용자%20중요정보%20평문%20저장%28또는%20전송%29%20—%20전송%20전%20변환으로%20치환.md)
- [다음: SD31. 적절하지 않은 난수 값]([SD]%20SD31.%20적절하지%20않은%20난수%20값의%20사용%20—%20커널%20CSPRNG로%20치환.md)
