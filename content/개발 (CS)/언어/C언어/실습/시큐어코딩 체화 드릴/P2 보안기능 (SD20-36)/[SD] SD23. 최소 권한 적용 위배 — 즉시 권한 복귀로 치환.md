---
title: "SD23. 최소 권한 적용 위배 — 즉시 권한 복귀로 치환"
description: "시큐어코딩 SD23 최소 권한 적용 위배 (CWE-272): 취약한 코드를 즉시 권한 복귀 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD23. 최소 권한 적용 위배 — 즉시 권한 복귀로 치환

> **원본 항목**: [Part 2-1. 인가·권한 계열 — 4. 최소 권한 적용 위배](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-1.%20인가·권한%20계열.md#4-최소-권한-적용-위배-cwe-272) `CWE-272`
> **repo 폴더**: `sd23_privdrop/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 2-1 마지막 드릴.
> 실제 `seteuid()` 대신 "현재 유효 권한"을 흉내내는 전역 변수로 재현한다 — 원리(빌렸으면 갚는다)는 완전히 동일하다.

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
- g_current_priv = ROOT_UID;      /* 상승만 하고 되돌리지 않는다 */
+ int backup = g_current_priv;
+ g_current_priv = ROOT_UID;
+ /* ... 필요한 작업만 ... */
+ g_current_priv = backup;        /* 즉시 원래 권한으로 복귀 */
```

권한 상승은 "빌린 것"이다.
쓰자마자 즉시 반납한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 상승 후 미반납 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 예외 경로에서도 반납 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 중첩 상승 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 상승 후 미반납

특정 작업은 상위 권한(root)으로 수행해야 한다.
- 작업이 끝나면 반드시 원래 권한으로 돌아와야 한다.

**함수**

```c
int get_current_priv(void);
void reset_priv(void);
void elevate_bad(void);
void do_privileged_work_good(void);
```

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `elevate_bad()` 호출 후 | **권한이 계속 root(0)로 남아있다** | 반납 코드가 아예 없다 |
| `do_privileged_work_good()` 호출 후 | 원래 권한(1000)으로 복귀 | 작업 직후 즉시 반납 |

### 1-B. 변형 B — 예외 경로에서도 반납

작업 도중 "실패"가 발생하는 상황을 추가하고, 실패해도 반드시 원래 권한으로 복귀하는지 확인(early return이 있어도 반납 로직을 타야 한다)

### 1-C. 변형 C — 중첩 상승

이미 상승된 상태에서 한 번 더 상승을 요청하는 경우, 반납이 "최초 권한"으로 정확히 돌아가는지(중간값으로 잘못 복귀하지 않는지) 확인

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `do_privileged_work_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void elevate_bad(void)
{
    /* 1. g_current_priv = ROOT_UID   ← 올리고 되돌리지 않는다 */
}

void do_privileged_work_good(void)
{
    /* [ ] 1. 현재 권한을 백업한다
     *        int backup = g_current_priv */

    /* [ ] 2. g_current_priv = ROOT_UID */

    /* [ ] 3. 필요한 작업만 이 구간에서 수행한다 */

    /* [ ] 4. g_current_priv = backup   ← 즉시 복귀 */
}
```

### 2-B. `do_privileged_work_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void do_privileged_work_good(void)
{
    /* [ ] 1. 현재 권한을 백업한다 */

    /* [ ] 2. g_current_priv = ROOT_UID */

    /* [ ] 3. 필요한 작업만 이 구간에서 수행한다 */

    /* [ ] 4. g_current_priv = backup   ← 즉시 복귀 */
}
```

### 2-C. `do_privileged_work_good` — Level 3 (3회차, 백지)

```c
void do_privileged_work_good(void)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 복귀 값은 NORMAL 이 아니라 **백업한 값**
     *   - `reset_priv()` 로 시험 사이에 상태 초기화
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
sd23_privdrop/src/priv_ops.h
sd23_privdrop/src/priv_ops.c
sd23_privdrop/test/test.c
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
#include "priv_ops.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    reset_priv();
    elevate_bad();
    T_TRUE(get_current_priv() == 0,
        "Bad는 권한 상승 후 계속 root(0) 상태로 남아있어야 한다(취약점 재현)");
}

static void test_good_restores_priv(void)
{
    reset_priv();
    int before = get_current_priv();
    do_privileged_work_good();
    T_TRUE(get_current_priv() == before,
        "Good은 작업이 끝나면 상승 전 권한으로 정확히 복귀해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_restores_priv();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!TIP] 왜 `reset_priv()` 가 필요한가
> `g_current_priv` 는 전역 상태다.
> 한 시험이 남긴 상태가 다음 시험에 영향을 주지 않도록, 각 시험 맨 앞에서 알려진 값으로 되돌린다 — SD21의 `umask` 원복과 같은 이유다.
> **전역 상태를 건드리는 코드는 테스트에서도 반드시 격리한다.**

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 예외 경로에서도 반납**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 작업 도중 실패 (early return) | root 로 남는다 | 실패해도 원래 권한으로 복귀 |
| 정상 종료 | root 로 남는다 | 원래 권한 |

**변형 C — 중첩 상승**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 이미 상승한 상태에서 한 번 더 상승 | 중간값으로 잘못 복귀 | 최초 권한으로 정확히 복귀 |
| 단일 상승 | root 로 남는다 | 원래 권한 |

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
make D=sd23_privdrop V=main SRC="sd23_privdrop/src/priv_ops.c sd23_privdrop/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd23_privdrop/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd23_privdrop/src/priv_ops.c sd23_privdrop/test/test.c \
>     -pthread -o build/sd23_privdrop_main
> ./build/sd23_privdrop_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 복귀 값을 상수(`1000`)로 하드코드 | 변형 C(중첩 상승)처럼 "상승 전 값"이 항상 기본값이 아닐 수 있다.<br>반드시 **그 시점의 실제 값을 백업**해서 되돌려야 한다 |
| 작업 중간에 `return` 이 있는데 그 경로엔 반납 코드가 없음 | 변형 B에서 드러나는 함정이다.<br>모든 종료 경로(정상+예외)에서 반납이 실행되어야 한다 — 자원 정리와 똑같은 원칙([SD44. 부적절한 자원 해제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD44.%20부적절한%20자원%20해제%20—%20단일%20해제%20지점으로%20치환.md)와 같은 계열의 문제) |
| 백업 변수를 지역이 아니라 전역으로 둠 | 여러 스레드/재귀 호출이 얽히면 백업값 자체가 덮인다.<br>백업은 반드시 **그 함수 호출의 지역 변수**로 둔다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `priv_ops.h` / `priv_ops.c`
> **헤더 (`priv_ops.h`)**
> ```c
> #ifndef PRIV_OPS_H
> #define PRIV_OPS_H
> int get_current_priv(void);
> void reset_priv(void);
> void elevate_bad(void);
> void do_privileged_work_good(void);
> #endif
> ```
> **구현 (`priv_ops.c`)**
> ```c
> #include "priv_ops.h"
>
> #define NORMAL_UID 1000
> #define ROOT_UID   0
>
> static int g_current_priv = NORMAL_UID;
>
> int get_current_priv(void) { return g_current_priv; }
> void reset_priv(void) { g_current_priv = NORMAL_UID; }
>
> void elevate_bad(void)
> {
>     g_current_priv = ROOT_UID;
> }
>
> void do_privileged_work_good(void)
> {
>     int backup = g_current_priv;
>     g_current_priv = ROOT_UID;
>     /* ... 필요한 작업만 이 구간에서 수행한다고 가정 ... */
>     g_current_priv = backup;
> }
> ```
>
> **눈여겨볼 점**: `elevate_bad` 와 `do_privileged_work_good` 의 차이는 **딱 한 줄**(`g_current_priv = backup;`)이다.
> 권한 관리 결함은 대개 "복잡한 로직"이 아니라 "빠뜨린 한 줄"에서 생긴다는 걸 이 드릴이 가장 짧게 보여준다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD22. 잘못된 권한 부여](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD22.%20잘못된%20권한%20부여%20—%20그룹별%20UID%20테이블로%20치환.md)
- Part 2-1 인가·권한 계열 4개 완료 — [다음: SD24. 하드코드된 패스워드](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD24.%20하드코드된%20패스워드%20—%20외부%20설정%20로드로%20치환.md)
