---
title: "SD51. 무한 자원 할당 — 상한 및 풀로 치환"
description: "시큐어코딩 SD51 무한 자원 할당 (CWE-770): 취약한 코드를 상한 및 풀 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD51. 무한 자원 할당 — 상한 및 풀로 치환

> **원본 항목**: [Part 5. 코드 오류 — 9. 무한 자원 할당](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#9-무한-자원-할당-cwe-770) `CWE-770`
> **repo 폴더**: `sd51_unbounded/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 5(코드 오류)의 마지막 드릴이다.
> 실제 `accept()`/`pthread_create()` 대신, "지금 활성 연결이 몇 개인가"를 정수 하나로 추적해 **상한의 유무가 결과에 미치는 영향**을 요청 10개로 직접 관찰한다.

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
  int handle_connection(void) {
-     g_active++;                        /* 접속마다 상한 없이 생성 */
-     return 0;
+     if (g_active >= POOL_MAX) return -1;   /* Pool 초과 시 거부 */
+     g_active++;
+     return 0;
  }
```

"요청당 무제한 할당"은 공격자에게 준 무료 DoS 버튼이다.
메시지 길이든 연결 수든 스레드 수든, 요청 하나가 만들 수 있는 자원에는 항상 상한이 있어야 한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 동시 접속 수 제한 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 메시지 길이 상한으로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 연결 반환(release)까지 포함한 전체 수명주기로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 동시 접속 수 제한

서버는 동시에 여러 클라이언트의 접속을 받아들인다.
- 동시 활성 연결 수에는 상한이 있어야 한다.
- 상한을 넘는 요청은 거부해야 한다(서비스 자체는 계속 동작해야 한다).

**함수**

```c
int active_count(void);
void reset_active(void);
int handle_connection_bad(void);
int handle_connection_good(void);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 연결 요청 횟수 | 외부(클라이언트) | 요청마다 무조건 자원을 늘리는 카운터 증가 지점 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 연결 요청 10회 | **활성 연결 10개 전부 생성**(상한 없음) | 요청 횟수만큼 그대로 자원이 늘어난다 — 공격자가 소수의 요청만으로도 자원을 무한정 소진시킬 수 있다 |
| 같은 상황(Good) | **`POOL_MAX`(4)개까지만 수락, 나머지 6개는 거부** | 상한에 도달하면 이후 요청은 실패로 응답하고 자원을 늘리지 않는다 |

### 1-B. 변형 B — 메시지 길이 상한으로 변형

가이드 원문의 또 다른 축인 "요청 메시지 길이"에 상한을 두는 함수로 바꿔본다.
`unsigned` 길이 인자에 `MAX_MSG_LEN` 상수 검사를 추가하는 형태

### 1-C. 변형 C — 연결 반환(release)까지 포함한 전체 수명주기로 확장

`release_connection()`을 추가해, 상한에 걸려 거부됐던 요청도 기존 연결이 반환되면 다시 수락될 수 있게 만든다 — 단순 거부가 아니라 진짜 "풀(pool)"처럼 재사용되는 구조를 완성한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `handle_connection_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int handle_connection_bad(void)
{
    /* 1. g_active++   ← 상한 없이 생성
     * 2. return 0 */
}

int handle_connection_good(void)
{
    /* [ ] 1. 상수와 카운터
     *        POOL_MAX 4,  static int g_active = 0 */

    /* [ ] 2. 상한 검사 (증가 전)
     *        g_active >= POOL_MAX → return -1   (서비스는 계속 동작) */

    /* [ ] 3. g_active++ */

    /* [ ] 4. return 0 */
}
```

### 2-B. `handle_connection_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int handle_connection_good(void)
{
    /* [ ] 1. 상수와 카운터 */

    /* [ ] 2. 상한 검사 (증가 전) */

    /* [ ] 3. g_active++ */

    /* [ ] 4. return 0 */
}
```

### 2-C. `handle_connection_good` — Level 3 (3회차, 백지)

```c
int handle_connection_good(void)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `>=` 와 `>` 의 차이
     *   - `reset_active()` 로 시험 사이에 상태 초기화
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
sd51_unbounded/src/unbounded.h
sd51_unbounded/src/unbounded.c
sd51_unbounded/test/test.c
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
#include "unbounded.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

#define ATTEMPTS 10

static void test_bad_is_unbounded(void)
{
    int i;
    reset_active();
    for (i = 0; i < ATTEMPTS; i++) {
        handle_connection_bad();
    }
    T_TRUE(active_count() == ATTEMPTS,
        "Bad는 상한이 없어 요청한 만큼(10개) 전부 활성 연결로 쌓여야 한다(취약점 재현)");
}

static void test_good_caps_at_pool_max(void)
{
    int i, accepted = 0, rejected = 0;
    reset_active();
    for (i = 0; i < ATTEMPTS; i++) {
        if (handle_connection_good() == 0) accepted++;
        else rejected++;
    }
    T_TRUE(accepted == POOL_MAX, "Good은 POOL_MAX(4)개까지만 수락해야 한다");
    T_TRUE(rejected == ATTEMPTS - POOL_MAX, "나머지 요청은 거부돼야 한다");
    T_TRUE(active_count() == POOL_MAX, "활성 연결 수는 POOL_MAX를 절대 넘지 않아야 한다");
}

int main(void)
{
    test_bad_is_unbounded();
    test_good_caps_at_pool_max();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 메시지 길이 상한으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `unsigned len` 이 `MAX_MSG_LEN` 초과 | 그대로 처리 | -1 |
| `len = MAX_MSG_LEN` | 정상 | 정상 |

**변형 C — 연결 반환(release)까지 포함한 전체 수명주기로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `release_connection()` 후 재요청 | 상한이 풀리지 않는다 | 반환된 자리에 다시 수락 |
| 상한 도달 상태에서 요청 | 허용 | 거부 (-1) |

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
make D=sd51_unbounded V=main SRC="sd51_unbounded/src/unbounded.c sd51_unbounded/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd51_unbounded/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd51_unbounded/src/unbounded.c sd51_unbounded/test/test.c \
>     -pthread -o build/sd51_unbounded_main
> ./build/sd51_unbounded_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 상한을 두되 거부 시 아무 값도 반환하지 않음 | 호출자가 성공했는지 거부됐는지 모르면 [SD41](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD41.%20오류상황%20대응%20부재%20—%20실제%20조치%20동반으로%20치환.md)의 "오류상황 대응 부재"로 이어진다.<br>상한 검사는 반드시 명확한 실패 반환과 짝을 이뤄야 한다 |
| 상한 값을 코드 여기저기에 매직 넘버로 흩어놓음 | `POOL_MAX`처럼 이름 붙인 상수 하나로 관리해야 나중에 정책이 바뀔 때(운영 중 튜닝) 한 곳만 고치면 된다 |
| "상한을 두면 정상 사용자도 거부당할 수 있다"는 이유로 상한을 아예 안 둠 | 상한이 없으면 정상 사용자 전원이 서비스 자체를 못 쓰게 되는 결과(DoS)로 이어진다.<br>상한은 "일부 요청의 불편"과 "전체 서비스 마비" 중 전자를 선택하는 것이다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `unbounded.h` / `unbounded.c`
> ```c
> #ifndef UNBOUNDED_H
> #define UNBOUNDED_H
> #define POOL_MAX 4
> int active_count(void);
> void reset_active(void);
> int handle_connection_bad(void);
> int handle_connection_good(void);
> #endif
> ```
> ```c
> #include "unbounded.h"
>
> static int g_active = 0;
>
> int active_count(void) { return g_active; }
> void reset_active(void) { g_active = 0; }
>
> int handle_connection_bad(void)
> {
>     g_active++;                        /* 접속마다 상한 없이 생성 */
>     return 0;
> }
>
> int handle_connection_good(void)
> {
>     if (g_active >= POOL_MAX) return -1;   /* Pool 초과 시 거부 */
>     g_active++;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `handle_connection_good`은 `handle_connection_bad`보다 딱 **한 줄**(`if (g_active >= POOL_MAX) return -1;`) 앞서 나온다.
> Part 5(코드 오류) 9개 항목 중 상당수가 이렇게 "몇 줄 안 되는 차이"로 갈렸다는 걸 되짚어보면, 코드 오류 계열의 본질은 복잡한 로직이 아니라 **빠뜨리기 쉬운 한두 줄**에 있다는 걸 알 수 있다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD50. 스레드 조기 종료](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD50.%20코드정확성%20스레드%20조기%20종료%20—%20join%20또는%20detach%20명시로%20치환.md)
- Part 5(코드 오류) 9개 완료 — [다음: SD52. 남은 디버그 코드](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD52.%20남은%20디버그%20코드%20—%20빌드%20매크로%20제거로%20치환.md)
