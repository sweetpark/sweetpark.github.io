---
title: "SD26. 하드코드된 암호화 키 — 키 저장소 주입으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD26. 하드코드된 암호화 키 — 키 저장소 주입으로 치환

> **원본 항목**: [Part 2-2. 자격증명 관리 계열 — 7. 하드코드된 암호화 키](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-2.%20자격증명%20관리%20계열.md#7-하드코드된-암호화-키-cwe-321) `CWE-321`
> **repo 폴더**: `sd26_hckey/` (`make D=sd26_hckey T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> SD24·25가 패스워드·계정명이었다면 이번엔 **바이트 배열(암호화 키)** 이다. "키 교체(rotation)가 실제로 되는가"를 `mock_keystore` 로 직접 증명한다.

---

## 0. 이 드릴로 체화할 것

```diff
- static const unsigned char HARD_KEY[16] = { 0x13,0x2a, ... };
- return HARD_KEY;                                          /* 항상 같은 키 */
+ int get_key_good(const char *key_name, unsigned char *out, size_t out_len)
+ {
+     return mock_keystore_load(key_name, out, out_len);     /* 저장소에서 이름으로 조회 */
+ }
```

키를 코드에 박으면 키 교체가 불가능해진다. 키는 코드 밖(키 저장소·설정파일)에서 주입받아야 한다.

---

## 1. 환경 코드 — `mock_keystore` (미리 제공, 타이핑하지 않음)

> [!NOTE]- `sd26_hckey/src/mock_keystore.h` / `mock_keystore.c` — repo에 이미 있다
> ```c
> /* mock_keystore.h */
> #ifndef MOCK_KEYSTORE_H
> #define MOCK_KEYSTORE_H
> #include <stddef.h>
> int mock_keystore_load(const char *key_name, unsigned char *out, size_t out_len);
> void mock_keystore_register(const char *key_name, const unsigned char *key, size_t key_len);
> #endif
> ```
> ```c
> /* mock_keystore.c */
> #include <string.h>
> #include "mock_keystore.h"
>
> typedef struct { const char *name; const unsigned char *key; size_t len; } entry_t;
> static entry_t g_keys[8];
> static int g_count = 0;
>
> void mock_keystore_register(const char *key_name, const unsigned char *key, size_t key_len)
> {
>     if (g_count < 8) {
>         g_keys[g_count].name = key_name; g_keys[g_count].key = key;
>         g_keys[g_count].len = key_len; g_count++;
>     }
> }
>
> int mock_keystore_load(const char *key_name, unsigned char *out, size_t out_len)
> {
>     int i;
>     for (i = 0; i < g_count; i++) {
>         if (strcmp(g_keys[i].name, key_name) == 0) {
>             if (g_keys[i].len > out_len) return -1;
>             memcpy(out, g_keys[i].key, g_keys[i].len);
>             return 0;
>         }
>     }
>     return -1;
> }
> ```

---

## 2. 취약 시나리오 — 변형 A: AES 키 로드

> [!QUOTE] 요구사항서 (발췌)
> DB 암호화에 쓸 16바이트 AES 키를 가져온다.
> - 키는 필요할 때 교체할 수 있어야 한다(rotation).

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 몇 번을 호출해도 | **완전히 같은 키(같은 주소, 같은 바이트)** | 키가 소스 상수라 절대 안 바뀐다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | AES 키 로드 | 위 내용 |
| **B (2회차)** | **HMAC 서명 키 로드** | 용도가 다른 키(서명용)로 바꿔서, 용도별로 키 이름(key_name)을 분리하는 실무 패턴을 확인 |
| **C (3회차)** | **사용 후 메모리 클리어** | 키를 다 쓴 뒤 `memset` 으로 지우는 코드를 추가하고, 지운 뒤에는 메모리 내용이 0으로 채워졌는지까지 검증 |

---

## 3. 제출물

```text
sd26_hckey/src/mock_keystore.h   (제공됨)
sd26_hckey/src/mock_keystore.c   (제공됨)
sd26_hckey/src/key_load.h        (직접 타이핑)
sd26_hckey/src/key_load.c        (직접 타이핑)
sd26_hckey/test/test.c           (직접 타이핑)
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <string.h>
#include "mock_keystore.h"
#include "key_load.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    const unsigned char *k1 = get_key_bad();
    const unsigned char *k2 = get_key_bad();
    T_TRUE(k1 == k2 && memcmp(k1, k2, 16) == 0,
        "Bad는 언제 호출해도 완전히 같은 키를 반환해야 한다(교체 불가능함 = 취약점 재현)");
}

static void test_good_can_rotate_key(void)
{
    unsigned char keyA[16] = { 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 };
    unsigned char keyB[16] = { 2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2 };
    unsigned char outA[16], outB[16];

    mock_keystore_register("db-enc-key-v1", keyA, sizeof(keyA));
    mock_keystore_register("db-enc-key-v2", keyB, sizeof(keyB));

    T_TRUE(get_key_good("db-enc-key-v1", outA, sizeof(outA)) == 0, "v1 키 로드는 성공해야 한다");
    T_TRUE(get_key_good("db-enc-key-v2", outB, sizeof(outB)) == 0, "v2 키 로드는 성공해야 한다");
    T_TRUE(memcmp(outA, outB, 16) != 0,
        "Good은 키 이름만 바꾸면 완전히 다른 키를 가져올 수 있어야 한다(키 교체 가능함을 증명)");
}

static void test_good_rejects_unknown_key(void)
{
    unsigned char out[16];
    T_TRUE(get_key_good("no-such-key", out, sizeof(out)) == -1,
        "Good은 등록되지 않은 키 이름은 실패로 알려야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_can_rotate_key();
    test_good_rejects_unknown_key();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 4. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 25 | ☐ |
| `test_good_can_rotate_key` 통과 — **서로 다른 키가 실제로 나온다** | 40 | ☐ |
| `test_good_rejects_unknown_key` 통과 | 20 | ☐ |
| `get_key_good` 시그니처에 `key_name` 이 있다(소스에 키 바이트가 없다) | 10 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 5. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `get_key_good` 안에 여전히 기본 키 바이트 배열을 상수로 두고 "저장소 실패 시 대체"로 씀 | 대체(fallback)라는 명목으로 하드코딩이 다시 들어온 것이다. 실패는 실패로 알리고 끝나야 한다(`-1`) |
| 키를 `char*` 로 다루며 문자열 함수(`strcpy` 등)를 사용 | 암호화 키는 문자열이 아니라 **바이트 배열**이다. NUL 바이트가 키 중간에 있을 수 있으므로 `memcpy`/`memcmp` 만 쓴다 |
| `test_good_can_rotate_key` 를 "다르게 등록했으니 당연히 다르다"고 생략 | 이 시험이 **키 교체가 실제로 동작한다는 유일한 증거**다. 생략하면 "인터페이스만 바뀌었지 여전히 하드코딩"인지 구분할 수 없다 |

---

## 6. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `key_load.h` / `key_load.c`
> **헤더 (`key_load.h`)**
> ```c
> #ifndef KEY_LOAD_H
> #define KEY_LOAD_H
> #include <stddef.h>
> const unsigned char *get_key_bad(void);
> int get_key_good(const char *key_name, unsigned char *out, size_t out_len);
> #endif
> ```
> **구현 (`key_load.c`)**
> ```c
> #include "mock_keystore.h"
> #include "key_load.h"
>
> static const unsigned char HARD_KEY[16] = {
>     0x13,0x2a,0x7f,0xc4,0x09,0xe1,0x55,0xb8,
>     0x6d,0x30,0xa2,0x4e,0xf7,0x81,0x0c,0x93
> };
>
> const unsigned char *get_key_bad(void)
> {
>     return HARD_KEY;
> }
>
> int get_key_good(const char *key_name, unsigned char *out, size_t out_len)
> {
>     return mock_keystore_load(key_name, out, out_len);
> }
> ```
>
> **눈여겨볼 점**: `get_key_bad` 는 **포인터**를 반환하고 `get_key_good` 은 **호출자 버퍼에 복사**한다. 이것도 우연이 아니다 — 저장소에서 가져온 키는 호출자 것으로 복사해서 쓰고 다 쓰면 지우는(변형 C) 흐름이 자연스럽지만, 상수 배열의 포인터는 "원본을 그대로 계속 공유"하는 구조라 애초에 그런 위생 관리가 불가능하다.

---

## 7. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (AES 키) |  |  |  |
| 2 |  | B (HMAC 키) |  |  |  |
| 3 |  | C (메모리 클리어) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD25. 하드코드된 사용자 계정](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD25.%20하드코드된%20사용자%20계정%20—%20계정명도%20외부%20전달로%20치환.md)
- [다음: SD27. 주석문안 주요정보](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD27.%20주석문안에%20포함된%20주요정보%20—%20배포%20전%20자동%20검사로%20치환.md)
