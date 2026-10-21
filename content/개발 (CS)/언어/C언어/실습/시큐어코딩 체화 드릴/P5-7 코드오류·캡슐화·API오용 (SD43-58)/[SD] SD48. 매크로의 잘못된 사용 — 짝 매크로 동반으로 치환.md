---
title: "SD48. 매크로의 잘못된 사용 — 짝 매크로 동반으로 치환"
description: "시큐어코딩 SD48 매크로의 잘못된 사용 (CWE-730): 취약한 코드를 짝 매크로 동반 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD48. 매크로의 잘못된 사용 — 짝 매크로 동반으로 치환

> **원본 항목**: [Part 5. 코드 오류 — 6. 매크로의 잘못된 사용](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#6-매크로의-잘못된-사용-cwe-730) `CWE-730`
> **repo 폴더**: `sd48_macropair/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> 가이드 원문의 `pthread_cleanup_push`/`pop`은 실제로 중괄호 블록을 여닫는 매크로라, 하나만 쓰면 **컴파일 자체가 안 된다**(짝이 안 맞으면 문법 오류).
> 이 드릴은 같은 "짝 매크로" 개념을 **런타임에 값으로 확인 가능한** 형태(잠금 카운터)로 재구성해, 짝이 안 맞을 때 실제로 무엇이 남는지 숫자로 직접 본다.

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
  void do_work(void) {
      LOCK_BEGIN();
      /* 임계 구역 작업 */
-     /* LOCK_END() 짝을 빠뜨림 -> 잠금이 영원히 풀리지 않음 */
+     LOCK_END();
  }
```

push/pop, BEGIN/END 같은 쌍 매크로는 "먼저 두 줄 다 쓰고 그 사이를 채운다"가 유일한 안전 습관이다.
나중에 END를 채우려고 하면 잊어버리기 쉽다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 임계 구역 진입·이탈 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** `TRANSACTION_BEGIN`/`TRANSACTION_END` 이름으로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 중간에 조기 `return`이 있는 함수로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 임계 구역 진입·이탈

임계 구역에 들어갈 때는 `LOCK_BEGIN()`, 나올 때는 `LOCK_END()`를 반드시 짝으로 쓴다.
- 함수가 끝나면 잠금 카운터는 항상 호출 전 상태로 돌아와야 한다.

**함수**

```c
int lock_depth(void);
void reset_lock(void);
void do_work_bad(void);
void do_work_good(void);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| (해당 없음) | — | 짝 매크로 중 하나를 빠뜨리는 것 자체가 결함이다 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `do_work_bad()` 한 번 호출 | **잠금 카운터가 `1`로 남음** | `LOCK_END()`를 아예 안 썼다 |
| `do_work_bad()` 두 번 연속 호출 | **잠금 카운터가 `2`로 누적** | 호출할 때마다 풀리지 않은 잠금이 계속 쌓인다(실전에서는 곧 데드락) |
| 같은 상황(Good) | 잠금 카운터가 항상 `0`으로 복귀 | `LOCK_BEGIN()`과 `LOCK_END()`를 짝으로 썼다 |

### 1-B. 변형 B — `TRANSACTION_BEGIN`/`TRANSACTION_END` 이름으로 변형

같은 구조를 DB 트랜잭션 시작·커밋 매크로로 이름만 바꿔 다시 작성한다 — 맥락이 달라도 패턴은 동일함을 확인한다

### 1-C. 변형 C — 중간에 조기 `return`이 있는 함수로 확장

임계 구역 안에 조건부 조기 종료를 추가하고, 그 경로에서도 `LOCK_END()`가 반드시 호출되도록(`goto cleanup` 또는 각 return 지점마다 명시) 만든다 — [SD44](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD44.%20부적절한%20자원%20해제%20—%20단일%20해제%20지점으로%20치환.md)의 에러 경로 자원 해제와 정확히 같은 원리가 매크로 짝에도 적용된다는 걸 연결한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `do_work_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void do_work_bad(void)
{
    /* 1. LOCK_BEGIN()
     * 2. 임계 구역 작업
     * 3. (LOCK_END() 를 빠뜨림)   ← 잠금이 영원히 풀리지 않는다 */
}

void do_work_good(void)
{
    /* [ ] 1. 매크로와 카운터
     *        static int g_lock_depth = 0
     *        LOCK_BEGIN() = (g_lock_depth++),  LOCK_END() = (g_lock_depth--) */

    /* [ ] 2. LOCK_BEGIN()
     *        LOCK_END()       ← **먼저 두 줄을 다 쓰고** 그 사이를 채운다 */

    /* [ ] 3. 두 줄 사이에 임계 구역 작업 */
}
```

### 2-B. `do_work_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void do_work_good(void)
{
    /* [ ] 1. 매크로와 카운터 */

    /* [ ] 2. LOCK_BEGIN() */

    /* [ ] 3. 두 줄 사이에 임계 구역 작업 */
}
```

### 2-C. `do_work_good` — Level 3 (3회차, 백지)

```c
void do_work_good(void)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `lock_depth()` / `reset_lock()` 헬퍼
     *   - BEGIN 을 쓰자마자 END 를 같이 쓴다
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
sd48_macropair/src/macropair.h
sd48_macropair/src/macropair.c
sd48_macropair/test/test.c
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
#include "macropair.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_leaves_lock_held(void)
{
    reset_lock();
    do_work_bad();
    T_TRUE(lock_depth() == 1,
        "Bad는 LOCK_END를 짝으로 쓰지 않아 잠금 카운터가 0으로 돌아오지 않아야 한다(취약점 재현)");
}

static void test_bad_accumulates(void)
{
    reset_lock();
    do_work_bad();
    do_work_bad();
    T_TRUE(lock_depth() == 2,
        "Bad를 반복 호출하면 풀리지 않은 잠금이 계속 누적돼야 한다(실전에서는 곧 데드락)");
}

static void test_good_releases_lock(void)
{
    reset_lock();
    do_work_good();
    T_TRUE(lock_depth() == 0, "Good은 짝을 맞춰 호출해 잠금 카운터가 정확히 0으로 돌아와야 한다");
}

int main(void)
{
    test_bad_leaves_lock_held();
    test_bad_accumulates();
    test_good_releases_lock();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] 왜 `pthread_cleanup_push`/`pop`을 그대로 안 쓰는가
> glibc를 포함한 여러 구현에서 이 두 매크로는 실제로 `{`와 `}`를 여닫도록 정의돼 있다 — 하나만 쓰면 중괄호 짝이 안 맞아 **컴파일 오류**가 난다.
> 즉 원본 예시는 "빌드는 되지만 런타임에 위험한 코드"가 아니라 "애초에 빌드가 안 되는 코드"다.
> 이 드릴은 같은 패턴(짝을 이뤄야 하는 매크로)을 런타임에 관찰 가능한 카운터로 바꿔, "짝이 안 맞으면 무엇이 남는가"를 직접 눈으로 확인하게 만들었다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — `TRANSACTION_BEGIN`/`TRANSACTION_END` 이름으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `TRANSACTION_BEGIN` / `TRANSACTION_END` | COMMIT 을 빠뜨려 열린 채 종료 | 짝이 맞아 깊이 0 |
| 정상 호출 | 깊이 1 로 남음 | 깊이 0 |

**변형 C — 중간에 조기 `return`이 있는 함수로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 임계 구역 안의 조기 `return` | END 가 호출되지 않는다 | `goto cleanup` 으로 END 를 항상 통과 |
| 조기 종료 없음 | 깊이 1 로 남음 | 깊이 0 |

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
make D=sd48_macropair V=main SRC="sd48_macropair/src/macropair.c sd48_macropair/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd48_macropair/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd48_macropair/src/macropair.c sd48_macropair/test/test.c \
>     -pthread -o build/sd48_macropair_main
> ./build/sd48_macropair_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `LOCK_END()`를 함수 맨 끝이 아니라 중간에 씀 | 그 뒤에 추가된 코드가 임계 구역 밖에서 실행되는 셈이 되어, 나중에 코드가 늘어나면 보호돼야 할 로직이 잠금 없이 돌게 된다.<br>짝 매크로는 "보호해야 할 구간 전체"를 정확히 감싸야 한다 |
| 매크로 이름만 다르면 서로 관련 없다고 생각 | `LOCK_BEGIN`/`END`, `TRANSACTION_BEGIN`/`END`, `pthread_cleanup_push`/`pop`은 이름은 다르지만 전부 같은 계약(BEGIN 계열을 쓰면 반드시 END 계열로 닫는다)을 가진다.<br>코드베이스에서 새로운 짝 매크로를 만들 때도 이 계약을 문서화해야 한다 |
| 리뷰에서 매크로 호출을 "그냥 함수 호출"처럼 대충 넘김 | 일반 함수 호출과 달리 짝 매크로는 **두 번째 호출이 없으면 첫 번째 호출의 효과가 영원히 남는다**는 특수성이 있다.<br>코드 리뷰 시 BEGIN 계열 매크로를 보면 반사적으로 대응하는 END가 있는지 확인하는 습관이 필요하다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `macropair.h` / `macropair.c`
> ```c
> #ifndef MACROPAIR_H
> #define MACROPAIR_H
> int lock_depth(void);
> void reset_lock(void);
> void do_work_bad(void);
> void do_work_good(void);
> #endif
> ```
> ```c
> #include "macropair.h"
>
> static int g_lock_depth = 0;
>
> #define LOCK_BEGIN() (g_lock_depth++)
> #define LOCK_END()   (g_lock_depth--)
>
> int lock_depth(void) { return g_lock_depth; }
> void reset_lock(void) { g_lock_depth = 0; }
>
> void do_work_bad(void)
> {
>     LOCK_BEGIN();
>     /* 임계 구역 작업 */
>     /* LOCK_END() 짝을 빠뜨림 -> 잠금이 영원히 풀리지 않음 */
> }
>
> void do_work_good(void)
> {
>     LOCK_BEGIN();
>     /* 임계 구역 작업 */
>     LOCK_END();
> }
> ```
>
> **눈여겨볼 점**: `do_work_bad`와 `do_work_good`의 차이는 딱 **한 줄**(`LOCK_END();`)이다.
> 이 항목 전체에서 가장 눈에 띄지 않는 차이지만, 코드 리뷰에서 놓치기 가장 쉬운 종류의 버그이기도 하다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD47. 스택 변수 주소 리턴](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD47.%20스택%20변수%20주소%20리턴%20—%20힙%20할당%20반환으로%20치환.md)
- [다음: SD49. 스택 주소 해제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD49.%20코드정확성%20스택%20주소%20해제%20—%20malloc%20포인터만%20해제로%20치환.md)
