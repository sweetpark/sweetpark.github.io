---
title: "SD08. 보호 메커니즘을 우회할 수 있는 입력값 변조 — 세션ID만 신뢰하도록 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD08. 보호 메커니즘을 우회할 수 있는 입력값 변조 — 세션ID만 신뢰하도록 치환

> **원본 항목**: [Part 1-2. 외부제어·우회 계열 — 8. 보호 메커니즘을 우회할 수 있는 입력값 변조](../../시큐어코딩가이드/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-2.%20외부제어·우회%20계열.md#8-보호-메커니즘을-우회할-수-있는-입력값-변조-cwe-807) `CWE-807`
> **repo 폴더**: `sd08_cookietamper/` (`make D=sd08_cookietamper T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> `mock_session` 은 서버가 로그인 시점에 세션ID→권한을 저장해 두는 저장소를 흉내낸다. 클라이언트(쿠키)는 이 저장소를 조회하는 "열쇠"만 들고 있을 뿐, 열쇠에 적힌 글씨를 아무리 바꿔도 저장소 내용은 바뀌지 않는다.

---

## 0. 이 드릴로 체화할 것

```diff
- return (cookie_role != NULL && strcmp(cookie_role, "admin") == 0);   /* 클라이언트 값으로 직접 판단 */
+ return mock_session_lookup_role(cookie_session_id) == ROLE_ADMIN;    /* 서버 저장소 조회 결과로 판단 */
```

이 계열(SD08~SD10)은 삽입 계열과 달리 "값을 검증"하는 게 아니라 **"판단 근거를 클라이언트가 아니라 서버에 두는가"** 가 치환의 핵심이다.

---

## 1. 환경 코드 — `mock_session` (미리 제공, 타이핑하지 않음)

> [!NOTE]- `sd08_cookietamper/src/mock_session.h` / `mock_session.c` — repo에 이미 있다
> ```c
> /* mock_session.h */
> #ifndef MOCK_SESSION_H
> #define MOCK_SESSION_H
> typedef enum { ROLE_GUEST, ROLE_USER, ROLE_ADMIN } role_t;
> role_t mock_session_lookup_role(const char *session_id);
> void mock_session_register(const char *session_id, role_t role);   /* 테스트용: 로그인 흉내 */
> #endif
> ```
> ```c
> /* mock_session.c */
> #include <string.h>
> #include "mock_session.h"
>
> typedef struct { const char *sid; role_t role; } session_entry_t;
> static session_entry_t g_sessions[8];
> static int g_session_count = 0;
>
> void mock_session_register(const char *session_id, role_t role)
> {
>     if (g_session_count < 8) {
>         g_sessions[g_session_count].sid = session_id;
>         g_sessions[g_session_count].role = role;
>         g_session_count++;
>     }
> }
>
> role_t mock_session_lookup_role(const char *session_id)
> {
>     int i;
>     if (session_id == NULL) return ROLE_GUEST;
>     for (i = 0; i < g_session_count; i++)
>         if (strcmp(g_sessions[i].sid, session_id) == 0) return g_sessions[i].role;
>     return ROLE_GUEST;
> }
> ```

---

## 2. 취약 시나리오 — 변형 A: 관리자 기능 접근 판정

> [!QUOTE] 요구사항서 (발췌)
> 요청에 실려온 쿠키 값으로 "이 요청이 관리자 권한인지"를 판정한다.
> - 실제 서비스라면 로그인 시점에 세션ID가 발급되고, 그 세션ID에 역할(role)이 매핑되어 서버에 저장된다.
> - 클라이언트는 세션ID만 쿠키로 들고 다닌다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 쿠키 값(`role` 또는 `session_id`) | 외부(클라이언트가 보낸 요청) | 관리자 권한 판정 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 쿠키 `role=admin` (조작) | **관리자로 판정됨** | 쿠키 값은 프록시 도구 하나로 누구나 바꿀 수 있다 |
| 등록되지 않은 세션ID를 `"admin"` 으로 지정 (Good 대상 공격) | 거부됨 | 서버 저장소에 없는 값이므로 `ROLE_GUEST` 로 취급 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 관리자 기능 접근 판정 | 위 내용 |
| **B (2회차)** | **결제 승인 권한 판정** | `ROLE_ADMIN` 대신 별도 `can_approve_payment` 불리언 플래그를 세션에 저장하는 구조로 변경 — enum 하나로 부족할 때 세션 구조체를 어떻게 넓힐지 연습 |
| **C (3회차)** | **세션 만료 추가** | `mock_session_register` 에 만료 시각을 추가하고, `mock_session_lookup_role` 이 만료된 세션은 `ROLE_GUEST` 로 취급하도록 mock 자체를 확장(이번엔 mock까지 직접 고쳐본다) |

---

## 3. 제출물

```text
sd08_cookietamper/src/mock_session.h   (제공됨)
sd08_cookietamper/src/mock_session.c   (제공됨)
sd08_cookietamper/src/admin_check.h    (직접 타이핑)
sd08_cookietamper/src/admin_check.c    (직접 타이핑)
sd08_cookietamper/test/test.c          (직접 타이핑)
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "mock_session.h"
#include "admin_check.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(is_admin_bad("admin") == 1,
        "Bad는 쿠키 값을 'admin' 문자열로 바꾸기만 해도 관리자 취급해야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    T_TRUE(is_admin_bad("user") == 0, "일반 role 문자열은 관리자가 아니다");
}

static void test_good_blocks_tampering(void)
{
    T_TRUE(is_admin_good("admin") == 0,
        "Good은 세션 저장소에 없는 값이면 조작해도 관리자가 될 수 없다");
}

static void test_good_normal(void)
{
    mock_session_register("sid-user1", ROLE_USER);
    mock_session_register("sid-admin1", ROLE_ADMIN);

    T_TRUE(is_admin_good("sid-user1") == 0, "일반 사용자 세션은 관리자가 아니다");
    T_TRUE(is_admin_good("sid-admin1") == 1, "서버가 실제로 등록한 관리자 세션만 관리자다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_tampering();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 4. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 — Bad가 문자열만으로 뚫린다 | 20 | ☐ |
| `test_good_blocks_tampering` 통과 | 25 | ☐ |
| `test_good_normal` 통과 | 15 | ☐ |
| `is_admin_good` 이 판정 근거를 **서버 저장소 조회 결과**로만 삼는다(쿠키 문자열을 직접 비교하지 않는다) | 30 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 5. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| Good에서도 여전히 세션ID 문자열 자체에 의미를 부여함(예: `"admin"`으로 시작하면 통과) | 판단 근거가 여전히 클라이언트가 보낸 문자열이다 — 저장소 조회를 우회한 것 |
| 세션 등록을 안 하고 테스트만 통과시키려 함 | `mock_session_register` 를 호출하지 않으면 모든 세션ID가 `ROLE_GUEST` 다 — Good이 항상 거부해서 "잘 막는 것처럼" 보이는 착시에 빠지지 않도록, 정상 케이스(등록된 관리자 세션)도 반드시 통과해야 한다 |
| SD01·SD05처럼 "검증 함수"를 만들려고 시도 | 이 항목은 검증이 아니라 **정보의 출처를 바꾸는 것**이다. 값을 아무리 정교하게 검증해도 클라이언트가 보낸 값 자체를 신뢰하면 우회된다 |

---

## 6. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `admin_check.h` / `admin_check.c`
> **헤더 (`admin_check.h`)**
> ```c
> #ifndef ADMIN_CHECK_H
> #define ADMIN_CHECK_H
> int is_admin_bad(const char *cookie_role);
> int is_admin_good(const char *cookie_session_id);
> #endif
> ```
> **구현 (`admin_check.c`)**
> ```c
> #include <string.h>
> #include "mock_session.h"
> #include "admin_check.h"
>
> int is_admin_bad(const char *cookie_role)
> {
>     return (cookie_role != NULL && strcmp(cookie_role, "admin") == 0);
> }
>
> int is_admin_good(const char *cookie_session_id)
> {
>     return mock_session_lookup_role(cookie_session_id) == ROLE_ADMIN;
> }
> ```
>
> **눈여겨볼 점**: `is_admin_good` 의 매개변수 이름이 `cookie_role` 이 아니라 `cookie_session_id` 로 바뀌었다 — 함수가 받는 **데이터의 의미 자체**가 달라졌다. "권한을 나타내는 값"을 클라이언트에서 받지 않고, "누구인지를 가리키는 표"만 받는다는 원칙이 시그니처에 그대로 드러난다.

---

## 7. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (관리자 판정) |  |  |  |
| 2 |  | B (결제 승인) |  |  |  |
| 3 |  | C (세션 만료) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD07. LDAP 처리]([SD]%20SD07.%20LDAP%20처리%20—%20베이스%20DN%20상수%20고정으로%20치환.md)
- [다음: SD09. 시스템·구성 설정 외부 제어]([SD]%20SD09.%20시스템·구성%20설정의%20외부%20제어%20—%20인덱스%20간접참조로%20치환.md)
