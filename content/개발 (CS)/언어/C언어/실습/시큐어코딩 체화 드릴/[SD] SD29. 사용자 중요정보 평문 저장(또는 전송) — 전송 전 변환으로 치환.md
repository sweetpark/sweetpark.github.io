---
title: "SD29. 사용자 중요정보 평문 저장(또는 전송) — 전송 전 변환으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD29. 사용자 중요정보 평문 저장(또는 전송) — 전송 전 변환으로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 10. 사용자 중요정보 평문 저장(또는 전송)](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#10-사용자-중요정보-평문-저장또는-전송-cwe-311) `CWE-311`
> **repo 폴더**: `sd29_plaintextstore/` (`make D=sd29_plaintextstore T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**

> [!WARNING] 이 드릴의 `xor_mask`는 실제 암호화가 아니다
> XOR 마스킹은 "저장/전송되는 값이 원본과 달라야 한다"는 **구조**만 보여주는 자리표시자다. 실무에서는 SD28에서 고른 검증된 알고리즘(AES-GCM 등)으로 교체한다.

---

## 0. 이 드릴로 체화할 것

```diff
- strncpy(out, pw, out_size - 1); out[out_size-1] = '\0';   /* 그대로 전송/저장 */
+ xor_mask(pw, out, out_size);                               /* 원본과 다른 값으로 변환 후 전송/저장 */
```

"내부망이라 괜찮다"는 없다. 저장할 때뿐 아니라 통신채널을 지날 때도 암호화해야 한다.

---

## 1. 취약 시나리오 — 변형 A: 인증 패킷 조립

> [!QUOTE] 요구사항서 (발췌)
> 로그인 패킷에 실을 패스워드 필드를 준비한다.
> - 패킷에 담기는 값은 원본 패스워드와 달라야 한다.
> - 정당한 수신자는 원본을 복원할 수 있어야 한다(암호화는 은닉이지 파기가 아니다).

### 공격 입력표

| 값 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `mypassword123` | **패킷에 그대로 실림** | 스니핑 한 번으로 그대로 노출 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 인증 패킷 조립 | 위 내용 |
| **B (2회차)** | **로그 기록 시 마스킹** | 디버그 로그에 패스워드 필드를 남길 때도 같은 원리 적용 — 단, 로그는 "복원 불필요"이므로 되돌릴 수 없는 마스킹(`****`)으로 바꿔도 됨을 비교해본다 |
| **C (3회차)** | **주민등록번호 등 개인정보로 확장** | 여러 필드(주민번호, 카드번호)를 한 번에 마스킹하는 구조체 단위 변환 함수로 확장 |

---

## 2. 제출물

```text
sd29_plaintextstore/src/secure_transmit.h
sd29_plaintextstore/src/secure_transmit.c
sd29_plaintextstore/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <string.h>
#include "secure_transmit.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char out[64];
    prepare_for_send_bad("mypassword123", out, sizeof(out));
    T_TRUE(strcmp(out, "mypassword123") == 0,
        "Bad는 전송/저장 직전에도 원본 패스워드가 그대로 노출되어야 한다(취약점 재현)");
}

static void test_good_hides_plaintext(void)
{
    char out[64];
    prepare_for_send_good("mypassword123", out, sizeof(out));
    T_TRUE(strcmp(out, "mypassword123") != 0,
        "Good은 전송/저장되는 값이 원본과 달라야 한다(평문 노출 없음)");
}

static void test_good_is_reversible_by_the_right_party(void)
{
    char masked[64], restored[64];
    prepare_for_send_good("mypassword123", masked, sizeof(masked));
    undo_mask(masked, restored, sizeof(restored));
    T_TRUE(strcmp(restored, "mypassword123") == 0,
        "정당한 수신자는 원본을 복원할 수 있어야 한다(암호화의 목적은 은닉이지 손실이 아님)");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_hides_plaintext();
    test_good_is_reversible_by_the_right_party();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 25 | ☐ |
| `test_good_hides_plaintext` 통과 | 35 | ☐ |
| `test_good_is_reversible_by_the_right_party` 통과 | 30 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "복원 불가능한 변환"(단방향 해시)을 인증 패킷에 적용 | 로그인 패킷은 서버가 원본과 대조해야 하므로 **양방향(암호화)** 이어야 한다. 단방향(해시)은 SD32~33(저장용)과 다른 용도다 — 용도별로 방식이 다르다는 걸 구분한다 |
| `test_good_hides_plaintext` 만 확인하고 복원 테스트를 생략 | "숨기기만 하고 다시 못 꺼내면" 암호화가 아니라 그냥 데이터 파괴다. 두 시험이 한 쌍이어야 의미가 있다 |
| 이 드릴의 `xor_mask` 를 실전 코드에 그대로 가져다 씀 | 이 드릴은 원리 시연용이다. 실전에서는 반드시 SD28의 화이트리스트를 통과한 검증된 알고리즘을 쓴다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `secure_transmit.h` / `secure_transmit.c`
> **헤더 (`secure_transmit.h`)**
> ```c
> #ifndef SECURE_TRANSMIT_H
> #define SECURE_TRANSMIT_H
> #include <stddef.h>
> void prepare_for_send_bad(const char *pw, char *out, size_t out_size);
> void prepare_for_send_good(const char *pw, char *out, size_t out_size);
> void undo_mask(const char *masked, char *out, size_t out_size);
> #endif
> ```
> **구현 (`secure_transmit.c`)**
> ```c
> #include <string.h>
> #include "secure_transmit.h"
>
> void prepare_for_send_bad(const char *pw, char *out, size_t out_size)
> {
>     strncpy(out, pw, out_size - 1);
>     out[out_size - 1] = '\0';
> }
>
> static void xor_mask(const char *in, char *out, size_t out_size)
> {
>     size_t i;
>     for (i = 0; i + 1 < out_size && in[i]; i++) out[i] = (char)(in[i] ^ 0x5A);
>     out[i] = '\0';
> }
>
> void prepare_for_send_good(const char *pw, char *out, size_t out_size)
> {
>     xor_mask(pw, out, out_size);
> }
>
> void undo_mask(const char *masked, char *out, size_t out_size)
> {
>     xor_mask(masked, out, out_size);   /* XOR은 대칭이라 같은 함수로 복원된다 */
> }
> ```
>
> **눈여겨볼 점**: `undo_mask` 가 `xor_mask` 를 **한 번 더 호출하는 것만으로 원복**된다 — XOR의 대칭성 때문이다. 실전 암호화(AES 등)에서는 암호화/복호화 함수가 분리되지만, "변환 후 저장·전송, 필요할 때 역변환"이라는 골격 자체는 동일하다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (인증 패킷) |  |  |  |
| 2 |  | B (로그 마스킹) |  |  |  |
| 3 |  | C (구조체 확장) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD28. 취약한 암호화 알고리즘 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD28.%20취약한%20암호화%20알고리즘%20사용%20—%20식별자%20화이트리스트%20검증으로%20치환.md)
- [다음: SD30. 충분하지 못한 키 길이](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD30.%20충분하지%20못한%20키%20길이%20사용%20—%20최소%20길이%20상수%20검증으로%20치환.md)
