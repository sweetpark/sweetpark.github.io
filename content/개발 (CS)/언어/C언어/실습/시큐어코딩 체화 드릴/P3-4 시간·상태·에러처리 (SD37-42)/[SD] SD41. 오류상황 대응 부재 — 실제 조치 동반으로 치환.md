---
title: "SD41. 오류상황 대응 부재 — 실제 조치 동반으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD41. 오류상황 대응 부재 — 실제 조치 동반으로 치환

> **원본 항목**: [Part 4. 에러 처리 — 2. 오류상황 대응 부재](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%204.%20에러%20처리.md#2-오류상황-대응-부재-cwe-390) `CWE-390`
> **repo 폴더**: `sd41_erract/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> "검사는 했지만 아무 조치가 없는" 빈 오류 처리 블록을 재현한다 — 실패를 **감지**하는 것과 실패에 **대응**하는 것은 완전히 다른 일이라는 걸 상태 변화로 직접 확인한다.

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
  if (rc != 0) {
-     /* do nothing */              /* 검사는 하지만 아무 조치도 없음 */
+     return -1;                     /* 실제 조치: 즉시 중단하고 실패를 알림 */
  }
```

빈 `if` 블록은 "검사했다"가 아니라 "오류를 은폐했다"는 뜻이다.
검사 뒤에는 반드시 로그·복구·중단 중 하나의 **실제 조치**가 있어야 한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 잔액 차감 트랜잭션 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 파일 쓰기 실패로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 재시도(retry) 로직 추가 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 잔액 차감 트랜잭션

요청을 처리하기 전에 사전 검증 단계를 거친다.
- 사전 검증이 실패하면 잔액 차감이 절대 일어나서는 안 된다.
- 실패 시 호출자는 반드시 실패를 알 수 있어야 한다.

**함수**

```c
int process_request_bad(int step1_will_fail, int *out_balance);
int process_request_good(int step1_will_fail, int *out_balance);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 사전 검증 결과(`rc`) | 내부 검증 로직 | `if (rc != 0)` 블록이 비어 있어 검증 결과와 무관하게 다음 로직(잔액 차감)이 그대로 실행된다 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 사전 검증 실패(`rc = -1`) | **잔액이 그대로 차감되고 함수는 성공(0)을 반환** | `if` 블록이 비어 있어 실패를 감지만 하고 아무 것도 막지 않는다 — 심지어 반환값도 거짓으로 성공을 알린다 |
| 같은 상황(Good) | **잔액은 그대로, 함수는 실패(-1)를 반환** | 실패를 감지한 즉시 `return -1`로 이후 로직 실행 자체를 막는다 |

### 1-B. 변형 B — 파일 쓰기 실패로 변형

가이드 원문처럼 `fputs`류 함수의 반환값을 검사하는 형태로 바꿔, "쓰기 실패 감지 후 아무 조치 없음" 대 "실패 로그 남기고 중단"을 비교한다

### 1-C. 변형 C — 재시도(retry) 로직 추가

Good을 한 단계 발전시켜, 실패 시 즉시 중단하는 대신 최대 3회까지 재시도한 뒤에도 실패하면 그때 중단하는 함수로 확장한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `process_request_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int process_request_bad(int step1_will_fail, int *out_balance)
{
    /* 1. rc = step1_will_fail ? -1 : 0
     * 2. rc != 0 이면 { /* do nothing */ }   ← 검사만 하고 조치가 없다
     * 3. *out_balance -= 100                 ← 실패해도 그대로 진행
     * 4. return 0                            ← 실패를 숨긴다 */
}

int process_request_good(int step1_will_fail, int *out_balance)
{
    /* [ ] 1. rc = step1_will_fail ? -1 : 0 */

    /* [ ] 2. rc != 0 이면 → return -1
     *        (실제 조치: 즉시 중단하고 실패를 알린다) */

    /* [ ] 3. *out_balance -= 100 */

    /* [ ] 4. return 0 */
}
```

### 2-B. `process_request_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int process_request_good(int step1_will_fail, int *out_balance)
{
    /* [ ] 1. rc = step1_will_fail ? -1 : 0 */

    /* [ ] 2. rc != 0 이면 → return -1 */

    /* [ ] 3. *out_balance -= 100 */

    /* [ ] 4. return 0 */
}
```

### 2-C. `process_request_good` — Level 3 (3회차, 백지)

```c
int process_request_good(int step1_will_fail, int *out_balance)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 빈 `if` 블록은 오류를 은폐한 것
     *   - 실패 시 `*out_balance` 가 **변하지 않는지** 시험으로 확인
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
sd41_erract/src/erract.h
sd41_erract/src/erract.c
sd41_erract/test/test.c
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
#include "erract.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_hides_failure(void)
{
    int balance = 500;
    int rc = process_request_bad(1 /* step1 실패 */, &balance);
    T_TRUE(rc == 0, "Bad는 내부 단계가 실패해도 항상 성공(0)을 보고해야 한다(실패 은폐 재현)");
    T_TRUE(balance == 400,
        "Bad는 실패를 감지하고도 아무 조치가 없어 잔액 차감이 그대로 진행돼야 한다(상태 오염 재현)");
}

static void test_good_reports_failure(void)
{
    int balance = 500;
    int rc = process_request_good(1 /* step1 실패 */, &balance);
    T_TRUE(rc == -1, "Good은 내부 단계가 실패하면 그 실패를 그대로 호출자에게 알려야 한다");
    T_TRUE(balance == 500, "Good은 실패 시 즉시 중단해 잔액이 전혀 바뀌지 않아야 한다");
}

static void test_good_normal_path(void)
{
    int balance = 500;
    int rc = process_request_good(0 /* step1 성공 */, &balance);
    T_TRUE(rc == 0, "정상 경로는 성공을 보고해야 한다");
    T_TRUE(balance == 400, "정상 경로는 잔액이 정확히 차감돼야 한다");
}

int main(void)
{
    test_bad_hides_failure();
    test_good_reports_failure();
    test_good_normal_path();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 파일 쓰기 실패로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `fputs` 반환값이 EOF | 아무 조치 없이 진행 | 실패 로그를 남기고 중단 (-1) |
| 쓰기 성공 | 정상 | 정상 |

**변형 C — 재시도(retry) 로직 추가**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 실패 2회 후 성공 (재시도 최대 3회) | 첫 실패에서 진행 | 재시도 후 성공 |
| 계속 실패 | 진행 | 3회 뒤 중단 (-1) |

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
make D=sd41_erract V=main SRC="sd41_erract/src/erract.c sd41_erract/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd41_erract/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd41_erract/src/erract.c sd41_erract/test/test.c \
>     -pthread -o build/sd41_erract_main
> ./build/sd41_erract_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `if (rc != 0) { }` 를 지우기만 하고 끝냄 | 블록을 지워도 다음 줄(`*out_balance -= 100`)이 여전히 무조건 실행된다.<br>핵심은 "블록을 없애는 것"이 아니라 "블록 안에 `return`/중단을 넣어 이후 코드 실행을 막는 것"이다 |
| 로그만 남기고 `return`을 빼먹음 | "감지했다는 흔적"을 남기는 것과 "실행 흐름을 실제로 바꾸는 것"은 다르다.<br>로그를 찍어도 다음 줄이 계속 실행되면 상태 오염은 똑같이 일어난다 |
| Bad의 반환값이 왜 `0`(성공)인지 이해 못 함 | 이 항목의 핵심 위험은 단순히 "차감이 일어난다"가 아니라, **호출자마저 실패를 모른 채 성공으로 착각한다**는 것이다.<br>이중 은폐(상태 오염 + 거짓 성공 보고)라는 점을 놓치기 쉽다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `erract.h` / `erract.c`
> ```c
> #ifndef ERRACT_H
> #define ERRACT_H
> int process_request_bad(int step1_will_fail, int *out_balance);
> int process_request_good(int step1_will_fail, int *out_balance);
> #endif
> ```
> ```c
> #include "erract.h"
>
> int process_request_bad(int step1_will_fail, int *out_balance)
> {
>     int rc = step1_will_fail ? -1 : 0;
>     if (rc != 0) {
>         /* do nothing */              /* 검사는 하지만 아무 조치도 없음 */
>     }
>     *out_balance -= 100;               /* 실패했든 말든 그대로 진행 */
>     return 0;                          /* 실패를 숨기고 항상 성공을 보고 */
> }
>
> int process_request_good(int step1_will_fail, int *out_balance)
> {
>     int rc = step1_will_fail ? -1 : 0;
>     if (rc != 0) {
>         return -1;                     /* 실제 조치: 즉시 중단하고 실패를 알림 */
>     }
>     *out_balance -= 100;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: 두 함수의 차이는 `if` 블록 안의 **단 한 줄**(`/* do nothing */` vs `return -1;`)뿐이다.
> 겉보기엔 사소해 보이지만, 그 한 줄의 유무가 "실패가 다음 로직 실행을 막는가"를 완전히 가른다.
> 코드 리뷰에서 빈 오류 처리 블록을 그냥 지나치기 쉬운 이유가 바로 이 시각적 사소함이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD40. 오류 메시지를 통한 정보 노출](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD40.%20오류%20메시지를%20통한%20정보%20노출%20—%20일반%20메시지%20응답으로%20치환.md)
- [다음: SD42. 적절하지 않은 예외처리](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD42.%20적절하지%20않은%20예외처리%20—%20반환값%20검사%20동반으로%20치환.md)
