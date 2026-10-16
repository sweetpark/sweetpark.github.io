---
title: "SD44. 부적절한 자원 해제 — 단일 해제 지점으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD44. 부적절한 자원 해제 — 단일 해제 지점으로 치환

> **원본 항목**: [Part 5. 코드 오류 — 2. 부적절한 자원 해제](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#2-부적절한-자원-해제-cwe-404) `CWE-404`
> **repo 폴더**: `sd44_resleak/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> 실제 DB 핸들(`SQLAllocHandle`) 대신, "몇 개가 지금 할당돼 있는가"를 직접 셀 수 있는 작은 핸들 풀을 만들어 자원 누수를 **숫자로 정확히** 증명한다.

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
  int con_hd = alloc_handle();
  if (con_hd < 0) { free_handle(env_hd); return -1; }

  if (simulate_late_failure) {
-     return -1;                              /* 핸들을 반환하지 않고 함수 종료 -> 자원 누수 */
+     free_handle(con_hd);                    /* 할당 역순 반환 -- 에러 경로에서도 반드시 */
+     free_handle(env_hd);
+     return -1;
  }
```

자원 해제는 "정상 경로"가 아니라 "에러 경로"에서 빠진다.
할당한 모든 자원은, 성공하든 실패하든 **모든 코드 경로**에서 짝을 이뤄 반환돼야 한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 두 단계 핸들 할당 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** `goto cleanup` 단일 해제 지점으로 리팩터링 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 핸들 3단계로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 두 단계 핸들 할당

작업을 위해 핸들 두 개(env, connection)를 순서대로 할당한다.
- 중간에 어떤 이유로 실패하더라도, 이미 할당한 핸들은 반드시 반환해야 한다.
- 풀은 유한하다 — 반환하지 않으면 다음 요청이 실패한다.

**함수**

```c
int alloc_handle(void);
void free_handle(int h);
int handles_in_use(void);
void reset_handle_pool(void);
int process_bad(int simulate_late_failure);
int process_good(int simulate_late_failure);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `simulate_late_failure`(늦은 실패 여부) | 호출자/외부 조건 | 이미 할당된 핸들을 반환할지 그냥 종료할지를 가르는 분기 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 두 핸들을 할당한 뒤 늦게 실패 | **핸들 2개가 반환되지 않고 그대로 누수**(`handles_in_use() == 2`) | 에러 경로에 `free_handle` 호출이 아예 없다 |
| 같은 상황(Good) | **핸들 사용량이 0으로 복귀** | 에러 경로에서도 할당 역순으로 반환한다 |
| 정상 종료(둘 다) | 핸들 사용량 0 | 정상 경로는 원래도 반환 로직이 있어 문제없다 |

### 1-B. 변형 B — `goto cleanup` 단일 해제 지점으로 리팩터링

여러 개의 `free_handle` 호출을 함수 끝의 `cleanup:` 레이블 하나로 모아, 어떤 실패 지점에서도 같은 정리 코드를 한 번만 거치도록 바꾼다

### 1-C. 변형 C — 핸들 3단계로 확장

env → connection → statement 3단계로 늘려, 각 단계에서 실패할 때마다 "그 이전까지 할당된 것만" 정확히 반환하는지 확인한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `process_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int process_bad(int simulate_late_failure)
{
    /* 1. env_hd = alloc_handle()       < 0 이면 return -1
     * 2. con_hd = alloc_handle()       < 0 이면 return -1        ← env_hd 를 안 돌려준다
     * 3. simulate_late_failure 이면 return -1   ← 두 핸들 모두 누수
     * 4. free_handle(con_hd), free_handle(env_hd), return 0 */
}

int process_good(int simulate_late_failure)
{
    /* [ ] 1. env_hd = alloc_handle()
     *        < 0 이면 → return -1 */

    /* [ ] 2. con_hd = alloc_handle()
     *        < 0 이면 → free_handle(env_hd), return -1 */

    /* [ ] 3. simulate_late_failure 이면
     *        free_handle(con_hd)
     *        free_handle(env_hd)     ← 할당 역순
     *        return -1 */

    /* [ ] 4. 정상 경로도 같은 순서로 해제
     *        free_handle(con_hd), free_handle(env_hd) */

    /* [ ] 5. return 0 */
}
```

### 2-B. `process_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int process_good(int simulate_late_failure)
{
    /* [ ] 1. env_hd = alloc_handle() */

    /* [ ] 2. con_hd = alloc_handle() */

    /* [ ] 3. simulate_late_failure 이면 */

    /* [ ] 4. 정상 경로도 같은 순서로 해제 */

    /* [ ] 5. return 0 */
}
```

### 2-C. `process_good` — Level 3 (3회차, 백지)

```c
int process_good(int simulate_late_failure)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 핸들 풀 헬퍼 4개 (`alloc_handle`, `free_handle`, `handles_in_use`, `reset_handle_pool`)
     *   - 에러 경로마다 "지금까지 할당한 것만" 해제
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
sd44_resleak/src/resleak.h
sd44_resleak/src/resleak.c
sd44_resleak/test/test.c
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
#include "resleak.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_leaks_on_failure(void)
{
    reset_handle_pool();
    int rc = process_bad(1 /* 늦은 실패 */);
    T_TRUE(rc == -1, "실패 경로이므로 실패를 반환해야 한다");
    T_TRUE(handles_in_use() == 2,
        "Bad는 실패 경로에서 할당했던 핸들 2개를 반환하지 않아 누수돼야 한다(취약점 재현)");
}

static void test_bad_normal_releases(void)
{
    reset_handle_pool();
    int rc = process_bad(0 /* 정상 */);
    T_TRUE(rc == 0, "정상 경로는 성공해야 한다");
    T_TRUE(handles_in_use() == 0, "정상 경로에서는 Bad도 핸들을 모두 반환한다");
}

static void test_good_releases_on_failure(void)
{
    reset_handle_pool();
    int rc = process_good(1 /* 늦은 실패 */);
    T_TRUE(rc == -1, "실패 경로이므로 실패를 반환해야 한다");
    T_TRUE(handles_in_use() == 0,
        "Good은 실패 경로에서도 이미 할당한 핸들을 모두 반환해야 한다(누수 없음)");
}

static void test_good_normal_releases(void)
{
    reset_handle_pool();
    int rc = process_good(0 /* 정상 */);
    T_TRUE(rc == 0, "정상 경로는 성공해야 한다");
    T_TRUE(handles_in_use() == 0, "정상 경로에서도 핸들을 모두 반환해야 한다");
}

int main(void)
{
    test_bad_leaks_on_failure();
    test_bad_normal_releases();
    test_good_releases_on_failure();
    test_good_normal_releases();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — `goto cleanup` 단일 해제 지점으로 리팩터링**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `goto cleanup` 단일 해제 지점 | 경로마다 해제 코드가 흩어져 있다 | `cleanup:` 한 곳에서 해제 |
| 실패 경로 | 누수 | 누수 없음 (`handles_in_use() == 0`) |

**변형 C — 핸들 3단계로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| env → connection → statement 3단계 | 단계별 실패에서 누수 | 그 전 단계까지만 정확히 해제 |
| 3단계 모두 성공 | 정상 | 정상 |

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
make D=sd44_resleak V=main SRC="sd44_resleak/src/resleak.c sd44_resleak/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd44_resleak/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd44_resleak/src/resleak.c sd44_resleak/test/test.c \
>     -pthread -o build/sd44_resleak_main
> ./build/sd44_resleak_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `con_hd`만 반환하고 `env_hd`는 빼먹음 | 나중에 할당한 자원부터 먼저 반환해야 한다는 원칙(역순 반환)을 지키지 않으면 중간에 하나를 빼먹기 쉽다.<br>항상 "가장 최근 할당 → 가장 오래된 할당" 순서로 정리한다 |
| 실패 지점마다 반환 코드를 매번 다르게 작성 | 실패 지점이 늘어날수록 각 지점에서 "지금까지 뭘 할당했는지"를 따로 추적해야 해서 실수하기 쉽다.<br>변형 B의 `goto cleanup` 패턴이 바로 이 문제를 해결한다 |
| 이미 반환한 핸들을 또 반환(중복 해제) | `free_handle`을 실수로 두 번 부르면 실제 자원(파일 디스크립터·DB 핸들)에서는 다른 코드가 이미 재사용 중인 자원을 엉뚱하게 반환하는 사고로 이어질 수 있다.<br>반환한 핸들 변수는 즉시 -1 등 무효값으로 표시하는 습관을 들인다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `resleak.h` / `resleak.c`
> ```c
> #ifndef RESLEAK_H
> #define RESLEAK_H
> #define POOL_SIZE 4
> int alloc_handle(void);
> void free_handle(int h);
> int handles_in_use(void);
> void reset_handle_pool(void);
> int process_bad(int simulate_late_failure);
> int process_good(int simulate_late_failure);
> #endif
> ```
> ```c
> #include "resleak.h"
>
> static int g_used[POOL_SIZE];
>
> int alloc_handle(void)
> {
>     int i;
>     for (i = 0; i < POOL_SIZE; i++) {
>         if (!g_used[i]) { g_used[i] = 1; return i; }
>     }
>     return -1;
> }
>
> void free_handle(int h)
> {
>     if (h >= 0 && h < POOL_SIZE) g_used[h] = 0;
> }
>
> int handles_in_use(void)
> {
>     int i, n = 0;
>     for (i = 0; i < POOL_SIZE; i++) n += g_used[i];
>     return n;
> }
>
> void reset_handle_pool(void)
> {
>     int i;
>     for (i = 0; i < POOL_SIZE; i++) g_used[i] = 0;
> }
>
> int process_bad(int simulate_late_failure)
> {
>     int env_hd = alloc_handle();
>     int con_hd;
>     if (env_hd < 0) return -1;
>
>     con_hd = alloc_handle();
>     if (con_hd < 0) return -1;
>
>     if (simulate_late_failure) {
>         return -1;                              /* 핸들을 반환하지 않고 함수 종료 -> 자원 누수 */
>     }
>
>     free_handle(con_hd);
>     free_handle(env_hd);
>     return 0;
> }
>
> int process_good(int simulate_late_failure)
> {
>     int env_hd = alloc_handle();
>     int con_hd;
>     if (env_hd < 0) return -1;
>
>     con_hd = alloc_handle();
>     if (con_hd < 0) { free_handle(env_hd); return -1; }
>
>     if (simulate_late_failure) {
>         free_handle(con_hd);
>         free_handle(env_hd);
>         return -1;
>     }
>
>     free_handle(con_hd);
>     free_handle(env_hd);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `process_bad`와 `process_good`은 각 실패 지점 **직전까지 완전히 동일**하다.
> 차이는 오직 실패가 확정된 순간 `free_handle`을 호출하느냐다.
> "무엇을 할당했는가"가 아니라 "실패했을 때 그것들을 되돌리는가"가 이 항목의 전부다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD43. 널 포인터 역참조](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD43.%20널%20포인터%20역참조%20—%20반환값%20검사%20후%20사용으로%20치환.md)
- [다음: SD45. 부호→무부호 변환 오류](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD45.%20부호%20정수를%20무부호%20정수로%20타입%20변환%20오류%20—%20안전한%20에러값으로%20치환.md)
