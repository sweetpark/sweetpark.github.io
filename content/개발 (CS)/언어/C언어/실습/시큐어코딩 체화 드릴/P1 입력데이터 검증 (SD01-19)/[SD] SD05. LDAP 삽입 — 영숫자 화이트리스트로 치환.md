---
title: "SD05. LDAP 삽입 — 영숫자 화이트리스트로 치환"
description: "시큐어코딩 SD05 LDAP 삽입 (CWE-90): 취약한 코드를 영숫자 화이트리스트 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD05. LDAP 삽입 — 영숫자 화이트리스트로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 5. LDAP 삽입](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#5-ldap-삽입-cwe-90) `CWE-90`
> **repo 폴더**: `sd05_ldapinj/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> `mock_ldap` 은 필터 문자열을 "정직하게" 평가하는 장난감 디렉터리다 — 진짜 LDAP처럼 `*` 를 만나면 전체를 매치시킨다.

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
- snprintf(filter, sizeof(filter), "(name=%s)", name);   /* 검증 없이 조립 */
+ if (!is_safe_ldap_value(name)) return -1;               /* 영숫자만 허용 */
+ snprintf(filter, sizeof(filter), "(name=%s)", name);
```

SD01(SQL)과 정확히 같은 패턴이다 — 조립 코드는 그대로, **조립 전 검증만 추가**한다.
항목이 달라도 치환 규칙의 "모양"은 재사용된다는 걸 확인하는 드릴이기도 하다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 이름으로 디렉터리 조회 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 부서 조회 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 화이트리스트 대신 이스케이프로 전환 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-0. 환경 코드 — `mock_ldap` (미리 제공, 타이핑하지 않음)

> [!NOTE]- `sd05_ldapinj/src/mock_ldap.h` / `mock_ldap.c` — repo에 이미 있다
> ```c
> /* mock_ldap.h */
> #ifndef MOCK_LDAP_H
> #define MOCK_LDAP_H
> /* -1: 잘못된 인자, 0 이상: 매칭된 엔트리 개수 */
> int mock_ldap_search(const char *filter);
> #endif
> ```
> ```c
> /* mock_ldap.c */
> #include <string.h>
> #include <stdio.h>
> #include "mock_ldap.h"
>
> typedef struct { const char *name; } entry_t;
> static const entry_t g_dir[] = { { "alice" }, { "bob" }, { "carol" } };
> #define DIR_COUNT (sizeof(g_dir)/sizeof(g_dir[0]))
>
> int mock_ldap_search(const char *filter)
> {
>     size_t i, matched = 0;
>     if (filter == NULL) return -1;
>     if (strchr(filter, '*') != NULL) return (int)DIR_COUNT;   /* 와일드카드 -> 전체 매치 */
>     for (i = 0; i < DIR_COUNT; i++) {
>         char expect[64];
>         snprintf(expect, sizeof(expect), "(name=%s)", g_dir[i].name);
>         if (strcmp(filter, expect) == 0) matched++;
>     }
>     return (int)matched;
> }
> ```

### 1-A. 변형 A — 이름으로 디렉터리 조회

사용자 이름(`name`)으로 디렉터리 엔트리를 조회한다.
- 필터는 `(name=<name>)` 형태로 조립한다.
- `name` 은 영숫자만 허용하며 최대 32자.

**함수**

```c
int ldap_lookup_bad(const char *name);
int ldap_lookup_good(const char *name);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `name` | 외부(조회 폼) | LDAP 필터 문자열 |

#### 공격 입력표

| 입력 | Bad 결과(매칭 개수) | 이유 |
| :--- | :--- | :--- |
| `alice` (정상) | 1 | 정상 동작 |
| `*` | **3** | 와일드카드로 디렉터리 전체가 노출된다 |

### 1-B. 변형 B — 부서 조회

`(department=%s)` 형태.
`department` 값에 `)(uid=*` 같은 필터 이스케이프 시도가 들어올 수 있음을 고려

### 1-C. 변형 C — 화이트리스트 대신 이스케이프로 전환

영숫자만 허용하는 대신, `* ( ) \ NUL` 다섯 문자를 LDAP RFC 방식(`\2a`, `\28` 등)으로 이스케이프하도록 바꾼다 — 한글 이름처럼 영숫자가 아닌 정상 입력도 통과시켜야 할 때 필요한 접근

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `ldap_lookup_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int ldap_lookup_bad(const char *name)
{
    /* 1. char filter[64]
     * 2. snprintf(filter, sizeof(filter), "(name=%s)", name)   ← 검증 없이 조립
     * 3. return mock_ldap_search(filter) */
}

int ldap_lookup_good(const char *name)
{
    /* [ ] 1. 지역변수
     *        char filter[64] */

    /* [ ] 2. 검증 함수 is_safe_ldap_value(s) 를 먼저 만든다
     *        길이가 0 이거나 32 초과              → 0
     *        isalnum((unsigned char)c) 가 아님     → 0
     *        그 외                                 → 1 */

    /* [ ] 3. 검증 (조립 전)
     *        실패 → return -1 */

    /* [ ] 4. snprintf 로 "(name=%s)" 조립 */

    /* [ ] 5. return mock_ldap_search(filter) */
}
```

### 2-B. `ldap_lookup_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int ldap_lookup_good(const char *name)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. 검증 함수 is_safe_ldap_value(s) 를 먼저 만든다 */

    /* [ ] 3. 검증 (조립 전) */

    /* [ ] 4. snprintf 로 "(name=%s)" 조립 */

    /* [ ] 5. return mock_ldap_search(filter) */
}
```

### 2-C. `ldap_lookup_good` — Level 3 (3회차, 백지)

```c
int ldap_lookup_good(const char *name)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `isalnum` 에 `unsigned char` 캐스팅
     *   - SD01 의 검증 함수와 같은 모양
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
sd05_ldapinj/src/mock_ldap.h   (제공됨)
sd05_ldapinj/src/mock_ldap.c   (제공됨)
sd05_ldapinj/src/ldap_auth.h   (직접 타이핑)
sd05_ldapinj/src/ldap_auth.c   (직접 타이핑)
sd05_ldapinj/test/test.c       (직접 타이핑)
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
#include "ldap_auth.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(ldap_lookup_bad("*") == 3,
        "Bad는 와일드카드로 디렉터리 전체가 노출되어야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    T_TRUE(ldap_lookup_bad("alice") == 1, "정상 조회는 1건");
}

static void test_good_blocks_injection(void)
{
    T_TRUE(ldap_lookup_good("*") == -1, "Good은 와일드카드를 거부해야 한다");
}

static void test_good_normal(void)
{
    T_TRUE(ldap_lookup_good("alice") == 1, "Good도 정상 조회는 통과");
    T_TRUE(ldap_lookup_good("bob") == 1, "다른 정상 사용자도 통과");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_injection();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 부서 조회**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `x)(uid=*` | 필터가 둘로 갈라져 전체 조회 | 거부 (-1) |
| `sales` | 정상 조회 | 정상 조회 |

**변형 C — 화이트리스트 대신 이스케이프로 전환**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `a*` (이스케이프 방식) | 와일드카드로 확장 | `a\2a` 로 치환되어 리터럴 매칭 |
| `alice` | 정상 조회 | 정상 조회 |

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
make D=sd05_ldapinj V=main SRC="sd05_ldapinj/src/mock_ldap.c sd05_ldapinj/src/ldap_auth.c sd05_ldapinj/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd05_ldapinj/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd05_ldapinj/src/mock_ldap.c sd05_ldapinj/src/ldap_auth.c sd05_ldapinj/test/test.c \
>     -pthread -o build/sd05_ldapinj_main
> ./build/sd05_ldapinj_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `*` 하나만 블랙리스트로 막음 | LDAP 특수문자는 `* ( ) \ NUL` 다섯 개다.<br>`(`, `)` 를 넣으면 필터 구조 자체를 깰 수 있다 |
| SD01의 SQL 필터 함수를 그대로 복사해서 예약어(`select` 등) 검사를 넣음 | LDAP은 SQL과 위험 문자 집합이 다르다.<br>계열이 같다고 필터 내용까지 같지 않다 |
| DN과 필터의 이스케이프 규칙을 혼동 | DN 특수문자(`\`)와 필터 특수문자(`= + < > # ; \`)는 서로 다르다(변형 C에서 필터 이스케이프만 다룬다) |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `ldap_auth.h` / `ldap_auth.c`
> **헤더 (`ldap_auth.h`)**
> ```c
> #ifndef LDAP_AUTH_H
> #define LDAP_AUTH_H
> int ldap_lookup_bad(const char *name);
> int ldap_lookup_good(const char *name);
> #endif
> ```
> **구현 (`ldap_auth.c`)**
> ```c
> #include <stdio.h>
> #include <string.h>
> #include <ctype.h>
> #include "mock_ldap.h"
> #include "ldap_auth.h"
>
> int ldap_lookup_bad(const char *name)
> {
>     char filter[64];
>     snprintf(filter, sizeof(filter), "(name=%s)", name);
>     return mock_ldap_search(filter);
> }
>
> /* 영숫자만 허용 — LDAP 특수문자(* ( ) \ NUL)를 전부 배제한다 */
> static int is_safe_ldap_value(const char *s)
> {
>     size_t i, len = strlen(s);
>     if (len == 0 || len > 32) return 0;
>     for (i = 0; i < len; i++) {
>         if (!isalnum((unsigned char)s[i])) return 0;
>     }
>     return 1;
> }
>
> int ldap_lookup_good(const char *name)
> {
>     char filter[64];
>     if (!is_safe_ldap_value(name)) return -1;
>     snprintf(filter, sizeof(filter), "(name=%s)", name);
>     return mock_ldap_search(filter);
> }
> ```
>
> **눈여겨볼 점**: `isalnum` 화이트리스트 하나로 `*`, `(`, `)`, `\`, NUL 다섯 특수문자를 **전부** 막는다 — 특수문자를 하나씩 블랙리스트에 나열하는 것보다 "허용할 것만 정의"하는 쪽이 누락이 없다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD04. OS 명령어 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD04.%20OS%20명령어%20삽입%20—%20위험%20문자%20검사로%20치환.md)
- [다음: SD06. 디렉터리 경로 조작](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD06.%20디렉터리%20경로%20조작%20—%20절대경로%20정규화%20검증으로%20치환.md)
