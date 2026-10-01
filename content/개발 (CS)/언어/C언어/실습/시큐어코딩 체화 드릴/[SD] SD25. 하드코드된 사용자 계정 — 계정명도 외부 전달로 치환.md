---
title: "SD25. 하드코드된 사용자 계정 — 계정명도 외부 전달로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD25. 하드코드된 사용자 계정 — 계정명도 외부 전달로 치환

> **원본 항목**: [Part 2-2. 자격증명 관리 계열 — 6. 하드코드된 사용자 계정](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/Part%202.%20보안기능/[시큐어코딩]%202-2.%20자격증명%20관리%20계열.md#6-하드코드된-사용자-계정-cwe-255) `CWE-255`
> **repo 폴더**: `sd25_hcaccount/` (`make D=sd25_hcaccount T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> SD24와 형제 항목이다 — 이번엔 패스워드가 아니라 **계정명(`"root"`)** 이 상수로 박혀 있다. SD24의 시험 패턴을 그대로 재사용해서 "패턴이 재사용된다"는 감각을 체화한다.

---

## 0. 이 드릴로 체화할 것

```diff
- snprintf(out, out_size, "user=%s;pw=%s", "root", passwd);   /* 계정명이 상수 */
+ void db_login_good(const char *user, const char *passwd, ...)
+ snprintf(out, out_size, "user=%s;pw=%s", user, passwd);      /* 계정명도 인자로 */
```

계정이나 패스워드를 코드에 하드코드하지 않고, 검증 과정을 거쳐 얻은 값을 사용한다 — SD24와 원리는 같고 **하드코딩된 대상만 다르다.**

---

## 1. 취약 시나리오 — 변형 A: 서비스 계정 로그인

> [!QUOTE] 요구사항서 (발췌)
> 서비스가 DB에 접속할 계정명과 패스워드로 로그인 문자열을 만든다.
> - 계정명은 절대 소스에 상수로 있으면 안 된다(패스워드를 바꿔도 계정을 바꿀 수 없는 구조는 안 된다).

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 패스워드를 무엇으로 바꿔도 | **`user=root` 로 고정** | 계정명이 소스에 박혀 있다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 서비스 계정 로그인 | 위 내용 |
| **B (2회차)** | **다중 환경(운영/스테이징) 계정 분리** | 환경별로 계정명이 달라야 하는데, Bad는 환경이 바뀌어도 같은 계정을 쓴다는 걸 재현 |
| **C (3회차)** | **계정+패스워드 둘 다 인자화한 뒤, 그 값이 실제로는 SD24의 파일 로드 함수에서 온 것으로 연결** | SD24 변형 C와 이어붙여, "계정명·패스워드 둘 다 하나의 설정 로더에서 나온다"는 실무 구조를 완성 |

---

## 2. 제출물

```text
sd25_hcaccount/src/db_login.h
sd25_hcaccount/src/db_login.c
sd25_hcaccount/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <string.h>
#include "db_login.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char out[128];
    db_login_bad("x", out, sizeof(out));
    T_TRUE(strstr(out, "user=root") != NULL,
        "Bad는 항상 계정명이 root로 고정되어야 한다(취약점 재현)");
}

static void test_bad_cannot_change_account(void)
{
    char out1[128], out2[128];
    db_login_bad("pw1", out1, sizeof(out1));
    db_login_bad("pw2", out2, sizeof(out2));
    T_TRUE(strstr(out1, "user=root") != NULL && strstr(out2, "user=root") != NULL,
        "Bad는 패스워드가 바뀌어도 계정명은 절대 못 바꾼다");
}

static void test_good_uses_provided_account(void)
{
    char out[128];
    db_login_good("svc_alice", "x", out, sizeof(out));
    T_TRUE(strstr(out, "user=svc_alice") != NULL, "Good은 전달받은 계정명을 그대로 사용해야 한다");
}

static void test_good_changes_with_input(void)
{
    char out1[128], out2[128];
    db_login_good("acct-one", "x", out1, sizeof(out1));
    db_login_good("acct-two", "x", out2, sizeof(out2));
    T_TRUE(strcmp(out1, out2) != 0, "Good은 계정명을 바꿔 부르면 결과도 달라져야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_cannot_change_account();
    test_good_uses_provided_account();
    test_good_changes_with_input();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` / `test_bad_cannot_change_account` 통과 | 30 | ☐ |
| `test_good_uses_provided_account` / `test_good_changes_with_input` 통과 | 40 | ☐ |
| Good 시그니처에 `user` 인자가 있다 | 25 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| SD24와 이 항목을 같은 결함이라고 뭉뚱그려 하나만 체화하고 넘어감 | CWE 번호가 다르고(259 vs 255) "무엇이 하드코딩됐는가"가 다르다. Part 2 전체를 관통하는 "CWE 두 자리를 대상으로 구분하라"는 원칙을 여기서 직접 확인한다 |
| 계정명은 인자화했지만 여전히 함수 안에서 `"root"` 를 기본값으로 씀 | 인자를 안 넘겼을 때만 몰래 하드코딩 값으로 대체하는 것도 같은 결함이다. 기본값 자체를 두지 않는다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `db_login.h` / `db_login.c`
> **헤더 (`db_login.h`)**
> ```c
> #ifndef DB_LOGIN_H
> #define DB_LOGIN_H
> #include <stddef.h>
> void db_login_bad(const char *passwd, char *out, size_t out_size);
> void db_login_good(const char *user, const char *passwd, char *out, size_t out_size);
> #endif
> ```
> **구현 (`db_login.c`)**
> ```c
> #include <stdio.h>
> #include "db_login.h"
>
> void db_login_bad(const char *passwd, char *out, size_t out_size)
> {
>     snprintf(out, out_size, "user=%s;pw=%s", "root", passwd);
> }
>
> void db_login_good(const char *user, const char *passwd, char *out, size_t out_size)
> {
>     snprintf(out, out_size, "user=%s;pw=%s", user, passwd);
> }
> ```
>
> **눈여겨볼 점**: `db_login_bad` 의 매개변수 목록에는 **"누구로 로그인할지"에 대한 정보가 아예 없다.** 함수 시그니처만 보고도 "이 함수는 계정을 선택할 수 없게 만들어져 있다"는 걸 알아채는 눈을 기르는 것이 이 드릴의 목표다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (서비스 계정) |  |  |  |
| 2 |  | B (다중 환경) |  |  |  |
| 3 |  | C (SD24와 연결) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD24. 하드코드된 패스워드](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD24.%20하드코드된%20패스워드%20—%20외부%20설정%20로드로%20치환.md)
- [다음: SD26. 하드코드된 암호화 키](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD26.%20하드코드된%20암호화%20키%20—%20키%20저장소%20주입으로%20치환.md)
