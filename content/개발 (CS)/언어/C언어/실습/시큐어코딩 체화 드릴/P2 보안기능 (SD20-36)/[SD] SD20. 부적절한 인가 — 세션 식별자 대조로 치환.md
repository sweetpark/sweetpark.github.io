---
title: "SD20. 부적절한 인가 — 세션 식별자 대조로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD20. 부적절한 인가 — 세션 식별자 대조로 치환

> **원본 항목**: [Part 2-1. 인가·권한 계열 — 1. 부적절한 인가](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-1.%20인가·권한%20계열.md#1-부적절한-인가-cwe-285) `CWE-285`
> **repo 폴더**: `sd20_idor/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 2의 첫 드릴.
> 전형적인 **IDOR**(Insecure Direct Object Reference)를 재현한다 — "로그인은 했지만, 그 사람 것인지는 확인 안 했다."

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
  const char *loginUser = mock_login_lookup_user(sid);
- return (loginUser != NULL);                          /* 세션이 유효하기만 하면 허용 */
+ if (loginUser == NULL) return 0;
+ return (strcmp(loginUser, targetUsername) == 0);      /* 요청 대상과 로그인 사용자를 대조 */
```

인증(로그인 여부)과 인가(그 자원에 접근할 자격이 있는가)는 별개의 검사다.
요청에 담긴 식별자는 "사용자의 주장"일 뿐이므로 세션에 저장된 진짜 신원과 반드시 대조한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 개인 레코드 조회 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 주문 취소 기능 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 관리자는 예외 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-0. 환경 코드 — `mock_login` (미리 제공, 타이핑하지 않음)

> [!NOTE]- `sd20_idor/src/mock_login.h` / `mock_login.c` — repo에 이미 있다
> ```c
> /* mock_login.h */
> #ifndef MOCK_LOGIN_H
> #define MOCK_LOGIN_H
> const char *mock_login_lookup_user(const char *sid);
> void mock_login_register(const char *sid, const char *username);
> #endif
> ```
> ```c
> /* mock_login.c */
> #include <string.h>
> #include "mock_login.h"
>
> typedef struct { const char *sid; const char *username; } entry_t;
> static entry_t g_logins[8];
> static int g_count = 0;
>
> void mock_login_register(const char *sid, const char *username)
> {
>     if (g_count < 8) { g_logins[g_count].sid = sid; g_logins[g_count].username = username; g_count++; }
> }
>
> const char *mock_login_lookup_user(const char *sid)
> {
>     int i;
>     if (sid == NULL) return NULL;
>     for (i = 0; i < g_count; i++)
>         if (strcmp(g_logins[i].sid, sid) == 0) return g_logins[i].username;
>     return NULL;
> }
> ```

### 1-A. 변형 A — 개인 레코드 조회

`GET /record?user=<targetUsername>` 형태로 특정 사용자의 레코드를 조회한다.
- 요청자는 세션ID(`sid`)를 함께 보낸다.
- **자기 자신의 레코드만** 조회할 수 있어야 한다.

**함수**

```c
int view_record_bad(const char *sid, const char *targetUsername);
int view_record_good(const char *sid, const char *targetUsername);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `targetUsername` | 외부(요청 파라미터) | 조회 허용 여부 판정 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| alice 세션으로 alice 레코드 조회 | 허용 | 정상 |
| **alice 세션으로 bob 레코드 조회** | **허용됨(IDOR)** | 세션 유효성만 확인하고 대상과 대조하지 않는다 |

### 1-B. 변형 B — 주문 취소 기능

조회가 아니라 "변경"(취소)이라 피해가 더 커진다는 점을 강조 — `cancel_order_good` 으로 함수명을 바꿔 설계

### 1-C. 변형 C — 관리자는 예외

관리자 세션이면 모든 사용자의 레코드를 조회할 수 있도록 예외를 추가하되, "예외 처리가 새로운 구멍이 되지 않는지" 확인(관리자 판정 자체도 SD08처럼 세션 저장소 기반이어야 한다)

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `view_record_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int view_record_bad(const char *sid, const char *targetUsername)
{
    /* 1. loginUser = mock_login_lookup_user(sid)
     * 2. (void)targetUsername   ← 대상은 쳐다보지도 않는다
     * 3. return (loginUser != NULL)   ← 로그인만 했으면 허용 */
}

int view_record_good(const char *sid, const char *targetUsername)
{
    /* [ ] 1. 세션에서 진짜 신원을 꺼낸다
     *        loginUser = mock_login_lookup_user(sid) */

    /* [ ] 2. 세션이 없으면 → return 0   (인증 실패) */

    /* [ ] 3. 요청 대상과 로그인 사용자를 대조한다
     *        return (strcmp(loginUser, targetUsername) == 0)   (인가) */
}
```

### 2-B. `view_record_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int view_record_good(const char *sid, const char *targetUsername)
{
    /* [ ] 1. 세션에서 진짜 신원을 꺼낸다 */

    /* [ ] 2. 세션이 없으면 → return 0   (인증 실패) */

    /* [ ] 3. 요청 대상과 로그인 사용자를 대조한다 */
}
```

### 2-C. `view_record_good` — Level 3 (3회차, 백지)

```c
int view_record_good(const char *sid, const char *targetUsername)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 인증(로그인 여부)과 인가(그 자원의 주인인가)는 별개
     *   - `strcmp` 결과가 0 일 때만 허용
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
sd20_idor/src/mock_login.h     (제공됨)
sd20_idor/src/mock_login.c     (제공됨)
sd20_idor/src/record_access.h  (직접 타이핑)
sd20_idor/src/record_access.c  (직접 타이핑)
sd20_idor/test/test.c          (직접 타이핑)
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
#include "mock_login.h"
#include "record_access.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    mock_login_register("sid-alice", "alice");
    T_TRUE(view_record_bad("sid-alice", "bob") == 1,
        "Bad는 alice로 로그인해도 bob의 레코드를 조회할 수 있어야 한다(IDOR 재현)");
}

static void test_bad_normal(void)
{
    T_TRUE(view_record_bad("sid-nobody", "bob") == 0, "로그인 안 된 세션은 거부되어야 한다");
}

static void test_good_blocks_idor(void)
{
    T_TRUE(view_record_good("sid-alice", "bob") == 0,
        "Good은 alice 세션으로 bob 레코드를 조회하면 거부해야 한다");
}

static void test_good_normal(void)
{
    T_TRUE(view_record_good("sid-alice", "alice") == 1,
        "Good은 본인 레코드는 조회를 허용해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_idor();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 주문 취소 기능**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 남의 주문 번호 취소 | 취소됨 | 주문자와 로그인 사용자가 다르면 거부 |
| 내 주문 취소 | 취소됨 | 취소됨 |

**변형 C — 관리자는 예외**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 일반 세션이 남의 레코드 조회 | 허용 | 거부 |
| 관리자 세션이 남의 레코드 조회 | 허용 | 허용 (관리자 판정도 세션 저장소에서) |

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
make D=sd20_idor V=main SRC="sd20_idor/src/mock_login.c sd20_idor/src/record_access.c sd20_idor/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd20_idor/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd20_idor/src/mock_login.c sd20_idor/src/record_access.c sd20_idor/test/test.c \
>     -pthread -o build/sd20_idor_main
> ./build/sd20_idor_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "로그인 여부"만 확인하고 끝냄(`loginUser != NULL`) | 이게 Bad 그 자체다.<br>인증과 인가를 같은 검사로 착각하는 게 이 항목의 핵심 함정 |
| 대조를 `targetUsername` 문자열 길이만 비교 | 전체 문자열이 정확히 일치하는지(`strcmp == 0`) 확인해야 한다 |
| 관리자 예외(변형 C)를 하드코드된 사용자명(`"admin"`)으로 처리 | [SD08](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD08.%20보호%20메커니즘%20우회%20가능한%20입력값%20변조%20—%20세션ID만%20신뢰하도록%20치환.md)에서 배운 대로, 역할 판정도 반드시 서버 저장소 조회를 거쳐야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `record_access.h` / `record_access.c`
> **헤더 (`record_access.h`)**
> ```c
> #ifndef RECORD_ACCESS_H
> #define RECORD_ACCESS_H
> int view_record_bad(const char *sid, const char *targetUsername);
> int view_record_good(const char *sid, const char *targetUsername);
> #endif
> ```
> **구현 (`record_access.c`)**
> ```c
> #include <string.h>
> #include "mock_login.h"
> #include "record_access.h"
>
> int view_record_bad(const char *sid, const char *targetUsername)
> {
>     const char *loginUser = mock_login_lookup_user(sid);
>     (void)targetUsername;
>     return (loginUser != NULL);
> }
>
> int view_record_good(const char *sid, const char *targetUsername)
> {
>     const char *loginUser = mock_login_lookup_user(sid);
>     if (loginUser == NULL) return 0;
>     return (strcmp(loginUser, targetUsername) == 0);
> }
> ```
>
> **눈여겨볼 점**: `view_record_bad` 에서 `targetUsername` 은 `(void)` 로 버려진다 — **아예 안 쓰인다.** 이 항목의 결함은 "검증을 잘못했다"가 아니라 "검증해야 할 값을 쳐다보지도 않았다"는 것이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD19. 무부호→부호 변환 오류](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD19.%20무부호%20정수를%20부호%20정수로%20타입%20변환%20오류%20—%20signed로%20받아%20검증%20후%20변환으로%20치환.md)
- [다음: SD21. 중요 자원 잘못된 권한허용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD21.%20중요한%20자원에%20대한%20잘못된%20권한허용%20—%20최소%20권한%20umask로%20치환.md)
