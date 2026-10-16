---
title: "SD22. 잘못된 권한 부여 — 그룹별 UID 테이블로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD22. 잘못된 권한 부여 — 그룹별 UID 테이블로 치환

> **원본 항목**: [Part 2-1. 인가·권한 계열 — 3. 잘못된 권한 부여](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-1.%20인가·권한%20계열.md#3-잘못된-권한-부여-cwe-266) `CWE-266`
> **repo 폴더**: `sd22_privgrant/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> 실제 `seteuid()` 는 보통 root 권한이 있어야 성공하므로, 이 드릴은 "**어떤 UID를 부여할지 결정하는 로직**"만 떼어서 검증한다(실제 `seteuid()` 호출은 SD23에서 다룬다).

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
- if (isCorrectUser) return 0;              /* 정상 유저이기만 하면 무조건 root(0) */
+ for (그룹별 테이블에서 group과 일치하는 항목을 찾는다)
+     return 테이블에_정의된_UID;
+ return -1;                                 /* 모르는 그룹은 권한 없음 */
```

"인증(누구인가)"과 "인가(무엇을 할 수 있는가)"는 별개다.
로그인 성공이 root 권한의 근거가 될 수 없다 — 권한은 항상 **그룹별 최소 유효 UID 테이블**에서 찾는다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 로그인 성공 시 UID 결정 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 부서별 접근 등급 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 테이블에 없는 신규 그룹 추가 시 기본값 정책 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 로그인 성공 시 UID 결정

사용자의 그룹(관리자/일반/게스트)에 따라 부여할 UID를 결정한다.
- 관리자 그룹만 UID 0(root)을 받을 수 있다.
- 모르는 그룹은 어떤 권한도 받으면 안 된다.

**함수**

```c
int resolve_uid_bad(int isCorrectUser);
int resolve_uid_good(group_t group);
```

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 정상 로그인(그룹 무관) | **UID 0(root) 부여** | "정상 유저인지"만 확인하고 어떤 그룹인지는 안 본다 |
| 게스트 그룹 정상 로그인(Good 대상) | 게스트 전용 UID | 그룹에 맞는 권한만 부여 |

### 1-B. 변형 B — 부서별 접근 등급

UID 대신 "결재 등급"(1~5)을 그룹별 테이블에서 조회하는 형태로 변형

### 1-C. 변형 C — 테이블에 없는 신규 그룹 추가 시 기본값 정책

새 그룹이 테이블에 없을 때 "기본값은 항상 최소 권한"이어야 한다는 원칙을 코드로 강제(테이블 순회 결과가 없으면 반드시 최소 권한 상수를 반환하도록 구조화)

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `resolve_uid_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int resolve_uid_bad(int isCorrectUser)
{
    /* 1. isCorrectUser 이면 return 0   ← 로그인만 성공하면 root
     * 2. 아니면 return -1 */
}

int resolve_uid_good(group_t group)
{
    /* [ ] 1. 그룹별 테이블 (grp_uid_t { group_t grp; int uid; })
     *        { GRP_ADMIN, 0 }, { GRP_NORMAL, 1000 }, { GRP_GUEST, 1001 }
     *        GRP_UNKNOWN 행은 **일부러 만들지 않는다** */

    /* [ ] 2. 테이블을 순회한다
     *        TBL[i].grp == group 이면 → return TBL[i].uid */

    /* [ ] 3. 못 찾았으면 → return -1   (모르는 그룹은 권한 없음) */
}
```

### 2-B. `resolve_uid_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int resolve_uid_good(group_t group)
{
    /* [ ] 1. 그룹별 테이블 (grp_uid_t { group_t grp; int uid; }) */

    /* [ ] 2. 테이블을 순회한다 */

    /* [ ] 3. 못 찾았으면 → return -1   (모르는 그룹은 권한 없음) */
}
```

### 2-C. `resolve_uid_good` — Level 3 (3회차, 백지)

```c
int resolve_uid_good(group_t group)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 테이블 크기는 `sizeof` 로 계산
     *   - 기본값은 항상 최소 권한
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
sd22_privgrant/src/uid_resolve.h
sd22_privgrant/src/uid_resolve.c
sd22_privgrant/test/test.c
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
#include "uid_resolve.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(resolve_uid_bad(1) == 0,
        "Bad는 정상 로그인만 하면 손님 계정도 root(0)를 받아야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    T_TRUE(resolve_uid_bad(0) == -1, "인증 실패는 권한이 없어야 한다");
}

static void test_good_blocks_over_grant(void)
{
    T_TRUE(resolve_uid_good(GRP_GUEST) != 0, "Good은 게스트 그룹에 root(0)를 주면 안 된다");
    T_TRUE(resolve_uid_good(GRP_UNKNOWN) == -1, "Good은 모르는 그룹은 권한 없음으로 처리해야 한다");
}

static void test_good_normal(void)
{
    T_TRUE(resolve_uid_good(GRP_ADMIN) == 0, "관리자 그룹만 root(0)를 받아야 한다");
    T_TRUE(resolve_uid_good(GRP_NORMAL) == 1000, "일반 그룹은 일반 UID를 받아야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_over_grant();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 부서별 접근 등급**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `GRP_NORMAL` 에 결재 등급 조회 | 항상 최고 등급 | 테이블의 등급 (예: 2) |
| `GRP_ADMIN` | 최고 등급 | 최고 등급 |

**변형 C — 테이블에 없는 신규 그룹 추가 시 기본값 정책**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 테이블에 없는 신규 그룹 | root | -1 (최소 권한 상수) |
| `GRP_GUEST` | 1001 | 1001 |

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
make D=sd22_privgrant V=main SRC="sd22_privgrant/src/uid_resolve.c sd22_privgrant/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd22_privgrant/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd22_privgrant/src/uid_resolve.c sd22_privgrant/test/test.c \
>     -pthread -o build/sd22_privgrant_main
> ./build/sd22_privgrant_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 테이블 순회 후 못 찾았을 때 기본값을 `0`(root)으로 둠 | "모르면 최소 권한"이 원칙이다.<br>실수로 기본값을 관대하게 잡으면 새로 추가되는 그룹이 전부 관리자가 되는 사고로 이어진다 |
| `isCorrectUser` 하나로 인증과 인가를 동시에 처리하려 함 | Bad의 근본 결함이다.<br>인증 확인과 권한 조회는 **별개의 함수/단계**로 분리한다 |
| 그룹 enum에 없는 값(정수 캐스팅 등)이 들어와도 대응 못 함 | `group_t` 는 enum이라 잘못된 정수가 들어오면 정의되지 않은 case가 될 수 있다 — 테이블에 없으면 무조건 거부하는 구조(`for` 루프 후 `return -1`)로 이런 상황도 커버된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `uid_resolve.h` / `uid_resolve.c`
> **헤더 (`uid_resolve.h`)**
> ```c
> #ifndef UID_RESOLVE_H
> #define UID_RESOLVE_H
> typedef enum { GRP_ADMIN, GRP_NORMAL, GRP_GUEST, GRP_UNKNOWN } group_t;
> int resolve_uid_bad(int isCorrectUser);
> int resolve_uid_good(group_t group);
> #endif
> ```
> **구현 (`uid_resolve.c`)**
> ```c
> #include <stddef.h>
> #include "uid_resolve.h"
>
> int resolve_uid_bad(int isCorrectUser)
> {
>     if (isCorrectUser) return 0;
>     return -1;
> }
>
> typedef struct { group_t grp; int uid; } grp_uid_t;
> static const grp_uid_t TBL[] = {
>     { GRP_ADMIN, 0 }, { GRP_NORMAL, 1000 }, { GRP_GUEST, 1001 },
> };
> #define TBL_SIZE (sizeof(TBL)/sizeof(TBL[0]))
>
> int resolve_uid_good(group_t group)
> {
>     size_t i;
>     for (i = 0; i < TBL_SIZE; i++)
>         if (TBL[i].grp == group) return TBL[i].uid;
>     return -1;
> }
> ```
>
> **눈여겨볼 점**: `TBL` 에 `GRP_UNKNOWN` 항목이 **없다.** 화이트리스트에 "모르는 것"을 위한 행을 일부러 만들지 않는 것 자체가 "모르면 거부"를 코드 구조로 강제하는 방법이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD21. 중요 자원 잘못된 권한허용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD21.%20중요한%20자원에%20대한%20잘못된%20권한허용%20—%20최소%20권한%20umask로%20치환.md)
- [다음: SD23. 최소 권한 적용 위배](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD23.%20최소%20권한%20적용%20위배%20—%20즉시%20권한%20복귀로%20치환.md)
