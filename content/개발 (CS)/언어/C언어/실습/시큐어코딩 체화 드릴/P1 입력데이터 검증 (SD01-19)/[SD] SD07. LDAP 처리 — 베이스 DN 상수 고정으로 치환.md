---
title: "SD07. LDAP 처리 — 베이스 DN 상수 고정으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD07. LDAP 처리 — 베이스 DN 상수 고정으로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 7. LDAP 처리](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#7-ldap-처리-cwe-90) `CWE-90`
> **repo 폴더**: `sd07_ldapbase/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> SD05가 "필터"가 오염되는 경우였다면, 이 드릴은 **"베이스(검색 스코프)"** 가 오염되는 경우다.
> 치환 규칙이 다르다는 게 핵심 — 값을 검증하는 게 아니라 **아예 입력을 받지 않는다.**

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
- return mock_ldap_search_base(userSuppliedBase, "manager=m1");   /* base 자체가 외부 입력 */
+ return mock_ldap_search_base("ou=NewHires", "manager=m1");      /* base는 상수로 고정 */
```

SD01·SD05는 "검증 함수를 통과한 값만 조립"이 치환 규칙이었지만, 이 항목은 **"애초에 함수가 그 값을 인자로 받지 않는다."** 검증이 아니라 **입력 경로 자체를 없애는 것**도 유효한(오히려 더 강한) 치환 방식임을 체감한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 매니저로 팀원 조회 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 부서 이동 이력 조회 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 관리자만 스코프 전환 허용 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-0. 환경 코드 — `mock_ldap2` (미리 제공, 타이핑하지 않음)

> [!NOTE]- `sd07_ldapbase/src/mock_ldap2.h` / `mock_ldap2.c` — repo에 이미 있다
> 부서(`ou`)가 다른 엔트리를 하나 섞어 둔다 — 스코프(base)가 지켜지면 절대 노출되면 안 되는 대상이다.
> ```c
> /* mock_ldap2.h */
> #ifndef MOCK_LDAP2_H
> #define MOCK_LDAP2_H
> /* -1: 잘못된 인자, 0 이상: base(스코프)+filter를 모두 통과한 엔트리 개수 */
> int mock_ldap_search_base(const char *base, const char *fixed_filter);
> #endif
> ```
> ```c
> /* mock_ldap2.c */
> #include <string.h>
> #include <stdio.h>
> #include "mock_ldap2.h"
>
> typedef struct { const char *name; const char *manager; const char *ou; } entry_t;
> static const entry_t g_dir[] = {
>     { "alice", "m1", "NewHires" },
>     { "bob",   "m1", "NewHires" },
>     { "carol", "m1", "Finance"  },  /* 다른 부서 — 정상적으로는 노출되면 안 된다 */
> };
> #define DIR_COUNT (sizeof(g_dir)/sizeof(g_dir[0]))
>
> int mock_ldap_search_base(const char *base, const char *fixed_filter)
> {
>     size_t i, matched = 0;
>     int scope_bypassed;
>     if (base == NULL || fixed_filter == NULL) return -1;
>
>     scope_bypassed = (strchr(base, '*') != NULL);   /* base에 와일드카드 -> 스코프 무력화 */
>
>     for (i = 0; i < DIR_COUNT; i++) {
>         char expect[64];
>         if (!scope_bypassed && strcmp(base, "ou=NewHires") != 0) continue;
>         if (!scope_bypassed && strcmp(g_dir[i].ou, "NewHires") != 0) continue;
>         snprintf(expect, sizeof(expect), "manager=%s", g_dir[i].manager);
>         if (strcmp(fixed_filter, expect) == 0) matched++;
>     }
>     return (int)matched;
> }
> ```

### 1-A. 변형 A — 매니저로 팀원 조회

"신입사원(NewHires)" 부서 안에서 매니저가 `m1` 인 팀원만 조회해야 한다.
- 검색 스코프(base)는 원래 `"ou=NewHires"` 로 고정되어야 한다.
- 필터(`manager=m1`)는 고정값이다.

**함수**

```c
int ldap_by_manager_bad(const char *userSuppliedBase);
int ldap_by_manager_good(void);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `userSuppliedBase` | 외부(파일에서 읽은 값 등) | LDAP 검색 스코프(base) |

#### 공격 입력표

| 입력(base) | Bad 결과(매칭 개수) | 이유 |
| :--- | :--- | :--- |
| `"ou=NewHires"` (정상) | 2 (alice, bob) | 정상 동작 |
| `"*"` | **3 (alice, bob, carol)** | 스코프가 무력화되어 다른 부서(Finance)의 carol까지 노출된다 |

### 1-B. 변형 B — 부서 이동 이력 조회

base가 `"ou=Alumni"` 로 바뀌는 버전.
상수가 여러 개일 때 "선택은 인덱스로, 문자열은 내부 테이블에서"라는 원칙([1-2. 외부제어·우회 계열](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-2.%20외부제어·우회%20계열.md)의 9번과 연결)을 적용

### 1-C. 변형 C — 관리자만 스코프 전환 허용

일반 사용자는 base 고정, 관리자 세션일 때만 미리 정의된 base 목록(`{"ou=NewHires","ou=Finance"}`) 중 하나를 인덱스로 선택하게 허용 — "상수 고정"과 "화이트리스트 인덱스"를 한 드릴에서 함께 연습

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `ldap_by_manager_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int ldap_by_manager_bad(const char *userSuppliedBase)
{
    /* 1. return mock_ldap_search_base(userSuppliedBase, "manager=m1")
     *    ← base 가 외부 입력 */
}

int ldap_by_manager_good(void)
{
    /* [ ] 1. 시그니처에서 base 인자를 **없앤다**
     *        (검증이 아니라 입력 경로 제거) */

    /* [ ] 2. return mock_ldap_search_base("ou=NewHires", "manager=m1")
     *        base 와 필터는 둘 다 코드 안의 상수 */
}
```

### 2-B. `ldap_by_manager_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int ldap_by_manager_good(void)
{
    /* [ ] 1. 시그니처에서 base 인자를 **없앤다** */

    /* [ ] 2. return mock_ldap_search_base("ou=NewHires", "manager=m1") */
}
```

### 2-C. `ldap_by_manager_good` — Level 3 (3회차, 백지)

```c
int ldap_by_manager_good(void)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 왜 검증이 아니라 인자 제거인가 (§0 설명)
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
sd07_ldapbase/src/mock_ldap2.h   (제공됨)
sd07_ldapbase/src/mock_ldap2.c   (제공됨)
sd07_ldapbase/src/ldap_base.h    (직접 타이핑)
sd07_ldapbase/src/ldap_base.c    (직접 타이핑)
sd07_ldapbase/test/test.c        (직접 타이핑)
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
#include "ldap_base.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_normal(void)
{
    T_TRUE(ldap_by_manager_bad("ou=NewHires") == 2,
        "정상 base면 NewHires 부서 2명(alice,bob)만 매칭");
}

static void test_bad_is_vulnerable(void)
{
    T_TRUE(ldap_by_manager_bad("*") == 3,
        "Bad는 base가 오염되면 스코프가 무력화되어 다른 부서(carol)까지 노출된다(취약점 재현)");
}

static void test_good_always_scoped(void)
{
    T_TRUE(ldap_by_manager_good() == 2,
        "Good은 base를 상수로 고정했으므로 항상 NewHires 2명만 나온다(우회 자체가 불가능)");
}

int main(void)
{
    test_bad_normal();
    test_bad_is_vulnerable();
    test_good_always_scoped();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!TIP] `ldap_by_manager_good()` 은 인자가 없다
> 시그니처 자체가 `void` 인 게 이 드릴의 핵심이다.
> Good 함수의 원형을 Bad와 다르게 선언하는 걸 주저하지 마라 — "외부 입력을 아예 받지 않는 함수"가 가장 강력한 방어다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 부서 이동 이력 조회**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `"ou=Alumni"` 를 외부에서 전달 | Alumni 전체가 조회됨 | 시그니처에 base 인자가 없어 전달 자체가 불가능 |
| 정상 호출 | NewHires 팀원 | NewHires 팀원 |

**변형 C — 관리자만 스코프 전환 허용**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 일반 사용자가 `"ou=Finance"` 요청 | Finance 조회됨 | 거부 (-1) |
| 관리자 세션 + 목록 안의 base | 조회됨 | 조회됨 |

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
make D=sd07_ldapbase V=main SRC="sd07_ldapbase/src/mock_ldap2.c sd07_ldapbase/src/ldap_base.c sd07_ldapbase/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd07_ldapbase/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd07_ldapbase/src/mock_ldap2.c sd07_ldapbase/src/ldap_base.c sd07_ldapbase/test/test.c \
>     -pthread -o build/sd07_ldapbase_main
> ./build/sd07_ldapbase_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `ldap_by_manager_good` 에도 인자를 남기고 내부에서 검증만 함 | 틀린 답은 아니지만 이 항목의 핵심 교훈(입력 경로 자체 제거)을 놓친다 — SD05와 똑같은 해법을 또 쓴 것 |
| base와 filter를 혼동해서 Bad에서도 filter를 오염시킴 | 이 드릴의 신뢰 경계는 **base** 다.<br>filter(`manager=m1`)는 애초에 고정값이었다는 걸 요구사항에서 다시 확인 |
| mock의 `ou` 필드 의미를 놓치고 "매칭 개수가 왜 3인지" 못 짚음 | carol이 다른 부서인데도 매니저가 같아서 노출되는 것 — "필터는 통과했지만 스코프를 벗어난" 정확한 사례 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `ldap_base.h` / `ldap_base.c`
> **헤더 (`ldap_base.h`)**
> ```c
> #ifndef LDAP_BASE_H
> #define LDAP_BASE_H
> int ldap_by_manager_bad(const char *userSuppliedBase);
> int ldap_by_manager_good(void);
> #endif
> ```
> **구현 (`ldap_base.c`)**
> ```c
> #include "mock_ldap2.h"
> #include "ldap_base.h"
>
> int ldap_by_manager_bad(const char *userSuppliedBase)
> {
>     return mock_ldap_search_base(userSuppliedBase, "manager=m1");
> }
>
> int ldap_by_manager_good(void)
> {
>     return mock_ldap_search_base("ou=NewHires", "manager=m1");
> }
> ```
>
> **눈여겨볼 점**: 코드량으로 보면 이번 드릴이 가장 짧다.
> 그런데 SD01·SD05처럼 "검증 함수 추가"가 아니라 **함수 시그니처 자체를 바꿔서 공격 표면을 없앴다.** 코드가 짧다고 체화가 쉬운 게 아니다 — "왜 검증이 아니라 제거인가"를 설명할 수 있어야 이 드릴을 통과한 것이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD06. 디렉터리 경로 조작](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD06.%20디렉터리%20경로%20조작%20—%20절대경로%20정규화%20검증으로%20치환.md)
- Part 1-1 삽입 계열 7개 완료 — [다음: SD08. 보호 메커니즘 우회 가능한 입력값 변조](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD08.%20보호%20메커니즘%20우회%20가능한%20입력값%20변조%20—%20세션ID만%20신뢰하도록%20치환.md)
