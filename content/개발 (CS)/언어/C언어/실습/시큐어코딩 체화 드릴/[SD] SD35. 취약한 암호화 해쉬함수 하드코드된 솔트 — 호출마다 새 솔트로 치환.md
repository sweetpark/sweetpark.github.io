---
title: "SD35. 취약한 암호화 해쉬함수 하드코드된 솔트 — 호출마다 새 솔트로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD35. 취약한 암호화 해쉬함수: 하드코드된 솔트 — 호출마다 새 솔트로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 16. 취약한 암호화 해쉬함수: 하드코드된 솔트](../../시큐어코딩가이드/Part%202.%20보안기능/%5B시큐어코딩%5D%202-3.%20암호화%20계열.md#16-취약한-암호화-해쉬함수-하드코드된-솔트-cwe-326) `CWE-326`
> **repo 폴더**: `sd35_hcsalt/` (`make D=sd35_hcsalt T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 2-3 마지막 드릴이자 암호화 계열의 마지막이다. SD33(솔트 없음)과 SD26(하드코드된 키)이 만나는 지점 — **"솔트 자체가 SD26처럼 상수로 박혀 있으면"** SD33에서 배운 방어가 전부 무력화된다는 걸 확인한다.

---

## 0. 이 드릴로 체화할 것

```diff
- unsigned get_salt_bad(void) { return 0xC0FFEE; }             /* 항상 같은 솔트 */
+ if (getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw)) return -1;
+ memcpy(out_salt, raw, sizeof(unsigned));                      /* 호출마다 새 솔트 */
```

솔트는 비밀이 아니라 "매번 달라야 하는 값"이다. 고정된 순간 솔트로서의 존재 이유가 사라진다.

---

## 1. 취약 시나리오 — 변형 A: 신규 계정 생성 시 솔트 발급

> [!QUOTE] 요구사항서 (발췌)
> 새 계정을 만들 때마다 그 계정 전용 솔트를 발급한다.
> - 솔트는 매번 달라야 한다.

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 계정 100개를 연달아 생성 | **전부 같은 솔트(`0xC0FFEE`)** | SD33의 솔트 방어가 사실상 무효화된다 — 모든 계정이 같은 솔트를 쓰면 그 솔트 하나로 만든 레인보우 테이블이 전체 계정에 통한다 |
| 같은 상황(Good) | 계정마다 다른 솔트 | SD31의 `getrandom` 을 그대로 재사용 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 신규 계정 솔트 발급 | 위 내용 |
| **B (2회차)** | **SD33·SD26과 전부 결합** | "계정 생성 시 새 솔트 발급(SD35) → 그 솔트로 패스워드 해시(SD33) → 결과를 저장(SD32)"까지 하나의 함수 체인으로 완성 — Part 2-3 전체를 관통하는 최종 통합 드릴 |
| **C (3회차)** | **솔트 크기를 16바이트(128비트)로 확장** | `unsigned`(보통 4바이트) 대신 `unsigned char[16]` 배열로 바꿔 실전 수준의 솔트 크기를 다룬다 |

---

## 2. 제출물

```text
sd35_hcsalt/src/salt_gen.h
sd35_hcsalt/src/salt_gen.c
sd35_hcsalt/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "salt_gen.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    unsigned s1 = get_salt_bad();
    unsigned s2 = get_salt_bad();
    T_TRUE(s1 == s2,
        "Bad는 언제 호출해도 완전히 같은 솔트를 반환해야 한다(레인보우테이블 재사용 가능 = 취약점 재현)");
}

static void test_good_produces_fresh_salt(void)
{
    unsigned s1 = 0, s2 = 0, s3 = 0;
    T_TRUE(get_salt_good(&s1) == 0, "첫 번째 호출은 성공해야 한다");
    T_TRUE(get_salt_good(&s2) == 0, "두 번째 호출도 성공해야 한다");
    T_TRUE(get_salt_good(&s3) == 0, "세 번째 호출도 성공해야 한다");
    T_TRUE(!(s1 == s2 && s2 == s3),
        "Good은 호출마다 매번 새 솔트를 만들어야 한다(세 값이 전부 같을 확률은 무시 가능)");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_produces_fresh_salt();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 30 | ☐ |
| `test_good_produces_fresh_salt` 통과 | 45 | ☐ |
| Good이 SD31의 `getrandom` 패턴을 정확히 재사용한다(실패 시 `-1`) | 20 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "솔트 하드코딩"과 "키 하드코딩"(SD26)을 같은 문제로 뭉뚱그림 | 키는 비밀이라 저장소에서 안전하게 보관해야 하지만, 솔트는 **비밀이 아니라 매번 새로 만들어야 하는 값**이다. 대응 방식이 다르다(SD26=키 저장소 조회, SD35=매번 신규 생성) |
| 솔트를 `rand()` 로 생성(SD31 이전 방식으로 회귀) | 솔트도 예측 가능하면 사전 계산 공격의 여지가 생긴다. SD31에서 이미 확립한 `getrandom` 패턴을 그대로 가져온다 |
| Part 2-3을 여기서 끝내고 SD32·33·35를 하나로 잇는 변형 B를 건너뜀 | 실전에서는 이 세 항목이 **한 함수 안에서 동시에** 지켜져야 한다. 따로따로는 이해했지만 합쳐서 짜보지 않으면 실무에서 순서를 놓치기 쉽다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `salt_gen.h` / `salt_gen.c`
> ```c
> #ifndef SALT_GEN_H
> #define SALT_GEN_H
> unsigned get_salt_bad(void);
> int get_salt_good(unsigned *out_salt);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <string.h>
> #include <sys/random.h>
> #include "salt_gen.h"
>
> unsigned get_salt_bad(void)
> {
>     return 0xC0FFEE;
> }
>
> int get_salt_good(unsigned *out_salt)
> {
>     unsigned char raw[sizeof(unsigned)];
>     if (getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw)) return -1;
>     memcpy(out_salt, raw, sizeof(unsigned));
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `get_salt_good` 의 구현이 [SD31](%5BSD%5D%20SD31.%20적절하지%20않은%20난수%20값의%20사용%20—%20커널%20CSPRNG로%20치환.md)의 `gen_token_good` 과 거의 동일하다 — **난수가 필요한 모든 곳(토큰·솔트·IV)은 결국 같은 CSPRNG 호출로 귀결된다.** Part 2-3에서 배운 여러 항목이 결국 "믿을 수 있는 난수원 하나"로 수렴한다는 걸 확인하며 이 계열을 마친다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (계정 솔트) |  |  |  |
| 2 |  | B (전체 통합) |  |  |  |
| 3 |  | C (16바이트 확장) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD34. 부적절한 RSA 패딩](%5BSD%5D%20SD34.%20취약한%20암호화%20적절하지%20못한%20RSA%20패딩%20—%20OAEP%20패딩%20강제로%20치환.md)
- Part 2-3 암호화 계열 8개 완료 — [다음: SD36. 같은 포트번호의 다중 연결](%5BSD%5D%20SD36.%20같은%20포트번호의%20다중%20연결%20—%20SO_REUSEPORT%20신중%20사용으로%20치환.md)
