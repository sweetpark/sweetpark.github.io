---
title: "SD25. 하드코드된 사용자 계정 — 계정명도 외부 전달로 치환"
description: "시큐어코딩 SD25 하드코드된 사용자 계정 (CWE-255): 취약한 코드를 계정명도 외부 전달 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD25. 하드코드된 사용자 계정 — 계정명도 외부 전달로 치환

> **원본 항목**: [Part 2-2. 자격증명 관리 계열 — 6. 하드코드된 사용자 계정](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-2.%20자격증명%20관리%20계열.md#6-하드코드된-사용자-계정-cwe-255) `CWE-255`
> **repo 폴더**: `sd25_hcaccount/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> SD24와 형제 항목이다 — 이번엔 패스워드가 아니라 **계정명(`"root"`)** 이 상수로 박혀 있다.
> SD24의 시험 패턴을 그대로 재사용해서 "패턴이 재사용된다"는 감각을 체화한다.

> [!NOTE] 이 드릴의 문서 구성 (SD01~SD58 공통)
> ① **요구사항서** — 어떤 코드가 뚫려 있고, 무엇을 만드나.
> ② **pseudo code 템플릿** — Bad 와 Good 의 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 공격은 막히고 정상은 통과해야 끝이다.
> ④ 자주 하는 실수
> ⑤ 모범답안 — 맨 뒤에 접어 둔다.
>
> 변형 A/B/C 는 **같은 치환 규칙을 다른 소재로 다시 치는 것**이다.

---

## 0. 이 드릴로 체화할 것

```diff
- snprintf(out, out_size, "user=%s;pw=%s", "root", passwd);   /* 계정명이 상수 */
+ void db_login_good(const char *user, const char *passwd, ...)
+ snprintf(out, out_size, "user=%s;pw=%s", user, passwd);      /* 계정명도 인자로 */
```

계정이나 패스워드를 코드에 하드코드하지 않고, 검증 과정을 거쳐 얻은 값을 사용한다 — SD24와 원리는 같고 **하드코딩된 대상만 다르다.**

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 서비스 계정 로그인 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 다중 환경(운영/스테이징) 계정 분리 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 계정+패스워드 둘 다 인자화한 뒤, 그 값이 실제로는 SD24의 파일 로드 함수에서 온 것으로 연결 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 서비스 계정 로그인

서비스가 DB에 접속할 계정명과 패스워드로 로그인 문자열을 만든다.
- 계정명은 절대 소스에 상수로 있으면 안 된다(패스워드를 바꿔도 계정을 바꿀 수 없는 구조는 안 된다).

**함수**

```c
void db_login_bad(const char *passwd, char *out, size_t out_size);
void db_login_good(const char *user, const char *passwd, char *out, size_t out_size);
```

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 패스워드를 무엇으로 바꿔도 | **`user=root` 로 고정** | 계정명이 소스에 박혀 있다 |

### 1-B. 변형 B — 다중 환경(운영/스테이징) 계정 분리

환경별로 계정명이 달라야 하는데, Bad는 환경이 바뀌어도 같은 계정을 쓴다는 걸 재현

### 1-C. 변형 C — 계정+패스워드 둘 다 인자화한 뒤, 그 값이 실제로는 SD24의 파일 로드 함수에서 온 것으로 연결

SD24 변형 C와 이어붙여, "계정명·패스워드 둘 다 하나의 설정 로더에서 나온다"는 실무 구조를 완성

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `db_login_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void db_login_bad(const char *passwd, char *out, size_t out_size)
{
    /* 1. snprintf(out, out_size, "user=%s;pw=%s", "root", passwd)
     *    ← 계정명이 소스 상수 */
}

void db_login_good(const char *user, const char *passwd, char *out, size_t out_size)
{
    /* [ ] 1. 매개변수에 user 를 **추가**한다 */

    /* [ ] 2. snprintf(out, out_size, "user=%s;pw=%s", user, passwd) */
}
```

### 2-B. `db_login_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void db_login_good(const char *user, const char *passwd, char *out, size_t out_size)
{
    /* [ ] 1. 매개변수에 user 를 **추가**한다 */

    /* [ ] 2. snprintf(out, out_size, "user=%s;pw=%s", user, passwd) */
}
```

### 2-C. `db_login_good` — Level 3 (3회차, 백지)

```c
void db_login_good(const char *user, const char *passwd, char *out, size_t out_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - SD24 와 같은 모양이다 (대상만 계정명)
     */
}
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 를 연다.
>    SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 로직이 막히면 **§3 테스트의 기대값**을 먼저 읽는다.
>    공격 입력표(§1)와 테스트가 답이다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
sd25_hcaccount/src/db_login.h
sd25_hcaccount/src/db_login.c
sd25_hcaccount/test/test.c
```

> [!IMPORTANT] 시험 구조는 고정이다 (SD01~SD58 공통)
> 1. **Bad 가 실제로 뚫린다.**
>    이 시험이 실패하면 Bad 를 잘못 옮겨 적은 것이다.
> 2. **Bad 도 정상 입력은 처리한다.**
> 3. **Good 이 같은 공격을 막는다.**
> 4. **Good 이 정상 입력까지 막지 않는다.** (과잉 차단 없음)

### 3-A. 변형 A 시험 — 이 형태를 고정한다

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

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 다중 환경(운영/스테이징) 계정 분리**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 운영 / 스테이징 환경 | 항상 같은 계정 | 환경별 계정명을 인자로 받는다 |
| `user = "stg_app"` | `root` 가 나온다 | `stg_app` 이 나온다 |

**변형 C — 계정+패스워드 둘 다 인자화한 뒤, 그 값이 실제로는 SD24의 파일 로드 함수에서 온 것으로 연결**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 계정명·패스워드를 한 로더에서 받음 | 계정만 상수 | 둘 다 로더의 값 |
| 로더 실패 | 상수로 진행 | 실패 반환 |

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [템플릿 체화 드릴 README](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 와 **같은 파일**이다.
recipe 줄은 **반드시 탭**으로 들여쓴다.

> [!example]- 공통 Makefile (gcc)
> ```makefile
> # ~/cdrill/Makefile  (템플릿 체화 드릴과 같은 파일)
> # 사용법:  make D=sd01_sqli V=main SRC="common/mock_db.c sd01_sqli/src/sql_auth.c sd01_sqli/test/test.c"
> CC       := gcc
> CFLAGS   := -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST -Icommon -I$(D)/src
> SAN      := -fsanitize=address,undefined -fno-omit-frame-pointer
> LDLIBS   ?= -pthread
>
> D        ?= d1_pure
> V        ?= main
> SRC      ?= $(D)/src/$(V).c $(D)/test/test_$(V).c
> BIN      := build/$(D)_$(V)
>
> all: run
>
> build:
> 	@mkdir -p build
>
> $(BIN): build $(SRC)
> 	$(CC) $(CFLAGS) $(SAN) $(SRC) $(LDLIBS) -o $(BIN)
>
> run: $(BIN)
> 	@echo "── run ──────────────────────────────"
> 	@./$(BIN)
>
> check: $(BIN)
> 	@./$(BIN) && echo "PASS" || (echo "FAIL"; exit 1)
>
> clean:
> 	rm -rf build
>
> .PHONY: all run check clean build
> ```

실행 명령이다.

```bash
make D=sd25_hcaccount V=main SRC="sd25_hcaccount/src/db_login.c sd25_hcaccount/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd25_hcaccount/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd25_hcaccount/src/db_login.c sd25_hcaccount/test/test.c \
>     -pthread -o build/sd25_hcaccount_main
> ./build/sd25_hcaccount_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| SD24와 이 항목을 같은 결함이라고 뭉뚱그려 하나만 체화하고 넘어감 | CWE 번호가 다르고(259 vs 255) "무엇이 하드코딩됐는가"가 다르다.<br>Part 2 전체를 관통하는 "CWE 두 자리를 대상으로 구분하라"는 원칙을 여기서 직접 확인한다 |
| 계정명은 인자화했지만 여전히 함수 안에서 `"root"` 를 기본값으로 씀 | 인자를 안 넘겼을 때만 몰래 하드코딩 값으로 대체하는 것도 같은 결함이다.<br>기본값 자체를 두지 않는다 |

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

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD24. 하드코드된 패스워드](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD24.%20하드코드된%20패스워드%20—%20외부%20설정%20로드로%20치환.md)
- [다음: SD26. 하드코드된 암호화 키](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD26.%20하드코드된%20암호화%20키%20—%20키%20저장소%20주입으로%20치환.md)
