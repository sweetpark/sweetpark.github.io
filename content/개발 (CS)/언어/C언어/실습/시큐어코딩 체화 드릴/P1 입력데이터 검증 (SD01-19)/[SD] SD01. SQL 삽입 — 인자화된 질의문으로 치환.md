---
title: "SD01. SQL 삽입 — 인자화된 질의문으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD01. SQL 삽입 — 인자화된 질의문으로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 1. SQL 삽입](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#1-sql-삽입-cwe-89) `CWE-89`
> **repo 폴더**: `sd01_sqli/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 20분 / 2회차 12분 / **3회차 8분**
> 진짜 DB 없이 "질의의 구조가 바뀌는 순간"을 눈으로 본다.
> 아래 `mock_db`는 이미 만들어진 **환경 코드**다 — 손으로 치지 않고 그대로 가져다 쓴다.

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
- snprintf(where, sizeof(where), "username='%s' AND password='%s'", userId, password);
- return mock_db_login(where);                      /* 조립 후 검사 없음 */
+ if (!is_safe_sql_literal(userId, MAX_USER_ID_LENGTH))     return -1;
+ if (!is_safe_sql_literal(password, MAX_PASSWORD_LENGTH))  return -1;
+ snprintf(where, sizeof(where), "username='%s' AND password='%s'", userId, password);
+ return mock_db_login(where);                      /* 검증된 값만 조립 */
```

**이 순서가 흔들리지 않는 게 목표다.** 조립하기 *전에* 검증한다.
실무에서는 필터보다 인자화된 질의문(prepared statement)이 우선이지만, C 표준 라이브러리만으로는 그 계층이 없으므로 이 드릴은 가이드 원문의 "예약어·특수문자 금지 + 길이 제한" 3종 필터로 체화한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 로그인 인증 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 상품 카테고리 검색 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 주문 조회 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-0. 환경 코드 — `mock_db` (미리 제공, 타이핑하지 않음)

> [!NOTE]- `common/mock_db.h` / `sd01_sqli/src/mock_db.c` — repo에 이미 있다고 가정하고 그대로 include
> **왜 필요한가**: 진짜 SQL 엔진이 없으면 "OR 트릭이 실제로 인증을 우회한다"를 눈으로 볼 수 없다.
> 이 mock은 진짜 SQL 파서가 아니라, `WHERE 절 문자열을 정직하게 실행`하는 아주 단순한 매칭기다 — 실제 DB 엔진처럼 문자열 안에 있는 조건을 있는 그대로 평가한다는 점만 흉내낸다.
> ```c
> /* mock_db.h */
> #ifndef MOCK_DB_H
> #define MOCK_DB_H
> /* -1: 실패, 0 이상: 매칭된 회원 인덱스 */
> int mock_db_login(const char *where_clause);
> #endif
> ```
> ```c
> /* mock_db.c */
> #include <string.h>
> #include <stdio.h>
> #include "mock_db.h"
>
> typedef struct { const char *username; const char *password; } mock_member_t;
> static const mock_member_t g_members[] = {
>     { "alice", "pw123!" },
>     { "bob",   "hunter2" },
> };
> #define MEMBER_COUNT (sizeof(g_members) / sizeof(g_members[0]))
>
> int mock_db_login(const char *where_clause)
> {
>     size_t i;
>     if (where_clause == NULL) return -1;
>
>     /* "정직한 실행기": 항상 참이 되는 조건이 섞이면 WHERE 절 전체가 참이 된다
>        — 실제 DB 엔진의 OR 단축 평가와 같은 원리다. */
>     if (strstr(where_clause, "OR '1'='1") != NULL) {
>         return 0;                       /* 첫 번째 회원으로 "인증 우회" 성공 */
>     }
>     for (i = 0; i < MEMBER_COUNT; i++) {
>         char expect[128];
>         snprintf(expect, sizeof(expect), "username='%s' AND password='%s'",
>             g_members[i].username, g_members[i].password);
>         if (strcmp(where_clause, expect) == 0) return (int)i;
>     }
>     return -1;
> }
> ```

### 1-A. 변형 A — 로그인 인증

`username`, `password` 두 문자열을 받아 회원 인증을 수행한다.
- 인증 성공 시 매칭된 회원 인덱스(0 이상)를, 실패 시 `-1` 을 반환한다.
- `username` 은 최대 8자, `password` 는 최대 16자.
- 회원 데이터는 `mock_db` 안에 고정되어 있다(직접 건드리지 않는다).

**함수**

```c
int login_bad(const char *userId, const char *password);
int login_good(const char *userId, const char *password);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `userId` | 외부(로그인 폼) | `where` 절 문자열 조립 |
| `password` | 외부(로그인 폼) | `where` 절 문자열 조립 |

#### 공격 입력표

| 입력(`password`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `pw123!` (정상) | 로그인 성공(인덱스 0) | 정상 동작 |
| `x' OR '1'='1` | **로그인 성공(인덱스 0)** | `where` 문자열이 `...password='x' OR '1'='1'` 가 되어 뒤 조건이 항상 참 |
| `wrong` | 로그인 실패(-1) | 정상 동작(오답 처리) |

### 1-B. 변형 B — 상품 카테고리 검색

`category` 문자열로 `mock_db_search(where)` 를 호출(신규 mock 함수, `category='%s'` 형태).
카테고리에 `' OR '1'='1` 을 넣으면 전체 상품이 노출되는지 확인

### 1-C. 변형 C — 주문 조회

`orderId`, `customerId` 두 값으로 `mock_db_login` 과 동일한 두 칸 WHERE 절을 조립.
단 `orderId` 는 숫자만 허용(길이 제한 대신 `isdigit` 전수 검사)으로 필터 로직을 바꿔본다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `login_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int login_bad(const char *userId, const char *password)
{
    /* 1. where[256] 에 "username='%s' AND password='%s'" 를 snprintf 로 조립한다.
     * 2. 검증 없이 mock_db_login(where) 를 호출하고 결과를 반환한다. */
}

int login_good(const char *userId, const char *password)
{
    /* [ ] 1. 지역변수
     *        char where[256] */

    /* [ ] 2. 검증 함수 is_safe_sql_literal(s, max_len) 를 먼저 만든다
     *        길이가 0 이거나 max_len 초과          → 0
     *        영숫자 또는 '!' 가 아닌 글자가 있음    → 0
     *        banned 문자열이 들어 있음              → 0
     *          { "select","delete","update","insert","or","and","--" }
     *        그 외                                  → 1 */

    /* [ ] 3. userId 검증 (조립 전)
     *        실패 → return -1 */

    /* [ ] 4. password 검증 (조립 전)
     *        실패 → return -1 */

    /* [ ] 5. where 조립 (Bad 와 똑같은 snprintf) */

    /* [ ] 6. return mock_db_login(where) */
}
```

### 2-B. `login_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int login_good(const char *userId, const char *password)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. 검증 함수 is_safe_sql_literal(s, max_len) 를 먼저 만든다 */

    /* [ ] 3. userId 검증 (조립 전) */

    /* [ ] 4. password 검증 (조립 전) */

    /* [ ] 5. where 조립 (Bad 와 똑같은 snprintf) */

    /* [ ] 6. return mock_db_login(where) */
}
```

### 2-C. `login_good` — Level 3 (3회차, 백지)

```c
int login_good(const char *userId, const char *password)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `isalnum` 에 `unsigned char` 캐스팅
     *   - 허용 문자 집합 (요구사항의 `!`)
     *   - `strstr` 로 예약어 찾기
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
sd01_sqli/src/sql_auth.h    login_bad / login_good 선언
sd01_sqli/src/sql_auth.c    두 함수 구현
sd01_sqli/test/test.c       공격 입력 차단 시험 + 정상 동작 시험
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
#include "sql_auth.h"

static int g_fail = 0;
#define T_TRUE(cond, msg)                                                \
    do { if (!(cond)) { g_fail++;                                        \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)     /* Bad의 결함이 실제로 있어야 한다 */
{
    T_TRUE(login_bad("alice", "x' OR '1'='1") == 0,
        "Bad는 OR 트릭으로 인증이 우회되어야 한다(취약점 재현 확인)");
}

static void test_bad_normal_login(void)      /* Bad도 정상 케이스는 원래 동작해야 한다 */
{
    T_TRUE(login_bad("alice", "pw123!") == 0, "정상 로그인 성공");
    T_TRUE(login_bad("alice", "wrong")  == -1, "오답 처리 실패");
}

static void test_good_blocks_injection(void) /* Good은 같은 공격을 막아야 한다 */
{
    T_TRUE(login_good("alice", "x' OR '1'='1") == -1,
        "Good은 같은 공격 입력을 막아야 한다");
}

static void test_good_normal_login(void)     /* Good이 정상까지 막으면(과잉 차단) 실패 */
{
    T_TRUE(login_good("alice", "pw123!") == 0, "Good도 정상 로그인은 통과");
    T_TRUE(login_good("bob", "hunter2")  == 1, "두 번째 회원도 통과");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal_login();
    test_good_blocks_injection();
    test_good_normal_login();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!TIP] `test_bad_is_vulnerable` 이 이 드릴의 핵심이다
> 이 시험이 실패한다면(Bad가 우회되지 않는다면) Bad 코드를 잘못 옮겨 적은 것이다.
> **Bad가 "제대로 뚫려야"** Good의 방어가 의미를 가진다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 상품 카테고리 검색**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `' OR '1'='1` | 전체 상품 노출 | 거부 (-1) |
| `book` | 정상 조회 | 정상 조회 |

**변형 C — 주문 조회**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `1 OR 1=1` (orderId) | 조건 우회 | 거부 (-1) |
| `12345` (orderId) | 정상 조회 | 정상 조회 |

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [템플릿 체화 드릴 README](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 와 **같은 파일**이다.
recipe 줄은 **반드시 탭**으로 들여쓴다.

> [!example]- 공통 Makefile (gcc)
> ```makefile
> # ~/cdrill/Makefile  (템플릿 체화 드릴과 같은 파일)
> # 사용법:  make D=sd01_sqli V=main SRC="sd01_sqli/src/mock_db.c sd01_sqli/src/sql_auth.c sd01_sqli/test/test.c"
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
make D=sd01_sqli V=main SRC="sd01_sqli/src/mock_db.c sd01_sqli/src/sql_auth.c sd01_sqli/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd01_sqli/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd01_sqli/src/mock_db.c sd01_sqli/src/sql_auth.c sd01_sqli/test/test.c \
>     -pthread -o build/sd01_sqli_main
> ./build/sd01_sqli_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| Good에서 `strcasestr` 블랙리스트만 걸고 문자 종류는 검사 안 함 | `' O R '1'='1`(공백 삽입)처럼 우회 여지가 생긴다.<br>**화이트리스트(영숫자만 허용)** 가 우선이고 예약어 검사는 이중 방어일 뿐 |
| 길이 검사를 조립 **후** `where` 버퍼에 대해서 함 | 그때는 이미 조립된 뒤라 늦다.<br>`userId`/`password` **원본 값**의 길이를 조립 전에 검사 |
| Good에서 공격 입력을 막다가 정상 입력(`pw123!`)까지 거부 | 영숫자만 허용하면서 `!` 를 빼먹지 않았는지 확인 — 요구사항에 맞게 허용 문자 집합을 다시 정의 |
| `test_bad_is_vulnerable` 을 그냥 지워버림 | Bad가 진짜 취약한지 증명하는 시험을 지우면 이 드릴의 핵심(대조군)이 사라진다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `sql_auth.h` / `sql_auth.c`
> **헤더 (`sql_auth.h`)**
> ```c
> #ifndef SQL_AUTH_H
> #define SQL_AUTH_H
> int login_bad(const char *userId, const char *password);
> int login_good(const char *userId, const char *password);
> #endif
> ```
> **구현 (`sql_auth.c`)**
> ```c
> #include <stdio.h>
> #include <string.h>
> #include <ctype.h>
> #include "mock_db.h"
> #include "sql_auth.h"
>
> #define MAX_USER_ID_LENGTH   8
> #define MAX_PASSWORD_LENGTH 16
>
> /* 취약: 사용자 입력을 검증 없이 그대로 WHERE 절에 이어붙인다 */
> int login_bad(const char *userId, const char *password)
> {
>     char where[256];
>     snprintf(where, sizeof(where),
>         "username='%s' AND password='%s'", userId, password);
>     return mock_db_login(where);
> }
>
> /* 영숫자만 허용(화이트리스트) + 길이 상한. 예약어 검사는 이중 방어용 */
> static int is_safe_sql_literal(const char *s, size_t max_len)
> {
>     size_t i, len = strlen(s);
>     static const char *banned[] =
>         { "select","delete","update","insert","or","and","--" };
>     size_t nb = sizeof(banned) / sizeof(banned[0]);
>
>     if (len == 0 || len > max_len) return 0;
>
>     for (i = 0; i < len; i++) {
>         unsigned char c = (unsigned char)s[i];
>         if (!isalnum(c) && c != '!') return 0;   /* 요구사항상 '!' 는 허용 문자 */
>     }
>     for (i = 0; i < nb; i++) {
>         if (strstr(s, banned[i]) != NULL) return 0;
>     }
>     return 1;
> }
>
> int login_good(const char *userId, const char *password)
> {
>     char where[256];
>
>     if (!is_safe_sql_literal(userId, MAX_USER_ID_LENGTH))    return -1;
>     if (!is_safe_sql_literal(password, MAX_PASSWORD_LENGTH)) return -1;
>
>     snprintf(where, sizeof(where),
>         "username='%s' AND password='%s'", userId, password);
>     return mock_db_login(where);
> }
> ```
>
> **눈여겨볼 점 3가지**
> 1. `login_bad` 와 `login_good` 은 **조립 코드가 완전히 동일**하다.
>    차이는 오직 "조립 전에 검증했는가" 하나뿐 — 이게 이 항목의 치환 규칙이다.
> 2. 검증은 **화이트리스트(허용 문자 집합)** 가 먼저고, 예약어 블랙리스트는 보조 수단이다.
>    블랙리스트만으로는 공백·대소문자·인코딩 변형에 뚫린다.
> 3. `is_safe_sql_literal` 이 `userId`·`password` 양쪽에 **똑같이** 적용된다 — 한쪽만 검증하면 나머지 한쪽이 여전히 구멍이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [Part 1-1. 삽입(Injection) 계열](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md)
- [다음: SD02. 자원 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD02.%20자원%20삽입%20—%20화이트리스트%20범위%20검사로%20치환.md)
