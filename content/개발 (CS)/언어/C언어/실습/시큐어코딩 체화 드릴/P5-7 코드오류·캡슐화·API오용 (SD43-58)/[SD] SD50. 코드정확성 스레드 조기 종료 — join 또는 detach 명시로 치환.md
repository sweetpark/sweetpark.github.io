---
title: "SD50. 코드정확성 스레드 조기 종료 — join 또는 detach 명시로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD50. 코드정확성: 스레드 조기 종료 — join 또는 detach 명시로 치환

> **원본 항목**: [Part 5. 코드 오류 — 8. 코드 정확성: 스레드 조기 종료](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#8-코드-정확성-스레드-조기-종료-cwe-730) `CWE-730`
> **repo 폴더**: `sd50_threadexit/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> **실제 `pthread`**를 사용한다.
> 다만 "스레드가 회수됐는가"를 OS 자원 소진까지 기다리지 않고 즉시 확인할 수 있도록, 생성·회수 시점마다 직접 세는 카운터(`g_unreaped`)를 함께 둔다.

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
  pthread_t th;
  if (pthread_create(&th, NULL, worker, result) != 0) return -1;
  g_unreaped++;
- return 0;                          /* join/detach 없이 부모 종료 -> 자원 미회수 */
+ pthread_join(th, NULL);            /* 즉시 회수 */
+ g_unreaped--;
+ return 0;
```

스레드는 만드는 순간 "join할 것인가 detach할 것인가"를 반드시 함께 결정해야 한다.
결정을 안 하는 것 자체가 결함이다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 백그라운드 작업 스레드 생성 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** `pthread_detach`로 회수하는 버전으로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 여러 스레드를 반복 생성하는 루프로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 백그라운드 작업 스레드 생성

작업을 처리할 워커 스레드를 생성한다.
- 생성한 스레드는 반드시 join 또는 detach로 회수 여부가 결정돼야 한다.
- 결과값은 필요하면 안전하게 받아올 수 있어야 한다.

**함수**

```c
int unreaped_count(void);
void reset_unreaped(void);
int spawn_worker_bad(int *result);
int spawn_worker_good(int *result);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| (해당 없음) | — | join/detach 결정 누락 자체가 결함이다 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `spawn_worker_bad()` 호출 | **미회수 스레드 카운트가 `1`로 남음** | `pthread_join`도 `pthread_detach`도 호출하지 않아 스레드 자원의 운명이 결정되지 않은 채 함수가 끝난다 |
| 같은 상황(Good) | 미회수 카운트가 `0`으로 복귀, 결과값도 확실히 반영됨 | `pthread_join`으로 완료를 기다린 뒤 회수한다 |

### 1-B. 변형 B — `pthread_detach`로 회수하는 버전으로 변형

결과를 기다릴 필요가 없는 "fire-and-forget" 워커라면 `pthread_join` 대신 `pthread_attr_setdetachstate(PTHREAD_CREATE_DETACHED)`나 생성 직후 `pthread_detach(th)`로 회수하는 함수를 만들어, "기다리지 않고도 회수는 확실히 한다"는 또 다른 표준 패턴을 익힌다

### 1-C. 변형 C — 여러 스레드를 반복 생성하는 루프로 확장

워커를 5개 연속 생성하는 함수를 만들어, Bad 버전은 `unreaped_count()`가 5까지 누적되고 Good 버전은 매번 0으로 돌아오는 것을 반복 확인한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `spawn_worker_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int spawn_worker_bad(int *result)
{
    /* 1. pthread_create(&th, NULL, worker, result)   실패 → return -1
     * 2. g_unreaped++
     * 3. return 0   ← join 도 detach 도 안 한다 */
}

int spawn_worker_good(int *result)
{
    /* [ ] 1. worker 와 카운터를 먼저 만든다
     *        worker(arg): *(int *)arg = 42, return NULL
     *        static int g_unreaped = 0,  unreaped_count() / reset_unreaped() */

    /* [ ] 2. pthread_create(&th, NULL, worker, result)
     *        실패 → return -1 */

    /* [ ] 3. g_unreaped++ */

    /* [ ] 4. pthread_join(th, NULL)   ← 즉시 회수 */

    /* [ ] 5. g_unreaped-- */

    /* [ ] 6. return 0 */
}
```

### 2-B. `spawn_worker_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int spawn_worker_good(int *result)
{
    /* [ ] 1. worker 와 카운터를 먼저 만든다 */

    /* [ ] 2. pthread_create(&th, NULL, worker, result) */

    /* [ ] 3. g_unreaped++ */

    /* [ ] 4. pthread_join(th, NULL)   ← 즉시 회수 */

    /* [ ] 5. g_unreaped-- */

    /* [ ] 6. return 0 */
}
```

### 2-C. `spawn_worker_good` — Level 3 (3회차, 백지)

```c
int spawn_worker_good(int *result)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `pthread_create` 직후에 join 할지 detach 할지 **같이** 결정
     *   - `-pthread` 링크 (Makefile 의 `LDLIBS`)
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
sd50_threadexit/src/threadexit.h
sd50_threadexit/src/threadexit.c
sd50_threadexit/test/test.c
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
#include "threadexit.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static int g_result_bad;
static int g_result_good;

static void test_bad_leaves_thread_unreaped(void)
{
    reset_unreaped();
    T_TRUE(spawn_worker_bad(&g_result_bad) == 0, "스레드 생성 자체는 성공해야 한다");
    T_TRUE(unreaped_count() == 1,
        "Bad는 join도 detach도 하지 않아 생성한 스레드가 회수되지 않은 채로 남아야 한다(취약점 재현)");
}

static void test_good_reaps_thread(void)
{
    reset_unreaped();
    T_TRUE(spawn_worker_good(&g_result_good) == 0, "스레드 생성과 join이 모두 성공해야 한다");
    T_TRUE(unreaped_count() == 0, "Good은 join으로 즉시 회수해 미회수 카운트가 0이어야 한다");
    T_TRUE(g_result_good == 42, "join으로 완료를 기다렸으므로 워커의 결과가 반영돼 있어야 한다");
}

int main(void)
{
    test_bad_leaves_thread_unreaped();
    test_good_reaps_thread();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] `g_result_bad`가 왜 전역 변수인가
> Bad는 스레드를 회수하지 않으므로, 테스트 함수가 반환한 뒤에도 워커 스레드가 계속 실행 중일 수 있다.
> 결과를 담을 변수가 지역 스택 변수라면 함수가 끝난 뒤 워커가 그 자리에 늦게 쓰기를 시도하면서 이미 사라진 스택 메모리에 접근하는 **또 다른 버그**([SD47](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD47.%20스택%20변수%20주소%20리턴%20—%20힙%20할당%20반환으로%20치환.md)과 같은 종류)가 생길 수 있다.
> 그래서 `g_result_bad`는 프로세스가 끝날 때까지 유효한 전역 변수로 뒀다 — Bad 자체의 문제(미회수)와 그로 인한 2차 문제(댕글링 접근)를 뒤섞지 않기 위해서다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — `pthread_detach`로 회수하는 버전으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `pthread_attr_setdetachstate` 로 detach | 회수 결정이 없다 | detach 로 자원 자동 회수 |
| 결과를 기다릴 필요가 없는 워커 | 누적 | 누적 없음 |

**변형 C — 여러 스레드를 반복 생성하는 루프로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 워커 5 개 연속 생성 | `unreaped_count()` 가 5 까지 누적 | 매번 0 으로 돌아온다 |
| 1 개 | 1 | 0 |

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
make D=sd50_threadexit V=main SRC="sd50_threadexit/src/threadexit.c sd50_threadexit/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd50_threadexit/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd50_threadexit/src/threadexit.c sd50_threadexit/test/test.c \
>     -pthread -o build/sd50_threadexit_main
> ./build/sd50_threadexit_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "메인 스레드가 곧 종료되니 상관없다"고 판단 | 짧게 끝나는 프로그램에서는 우연히 문제가 안 드러나지만, 장시간 도는 서버 프로세스에서 요청마다 스레드를 생성하면 미회수 스레드가 계속 쌓여 결국 스레드 생성 자체가 실패하는 지점에 도달한다 |
| `pthread_join`과 `pthread_detach`를 동시에 호출 | 이미 detach된 스레드를 join하려고 하면 정의되지 않은 동작이다.<br>하나의 스레드에는 join과 detach 중 **정확히 하나만** 적용해야 한다 |
| 결과를 기다릴 필요가 없다는 이유로 아예 아무 것도 안 함(Bad) | "기다릴 필요가 없다"는 "회수할 필요가 없다"가 아니다.<br>결과가 필요 없다면 `pthread_detach`로 명시적으로 "이 스레드는 알아서 회수된다"고 선언해야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `threadexit.h` / `threadexit.c`
> ```c
> #ifndef THREADEXIT_H
> #define THREADEXIT_H
> int unreaped_count(void);
> void reset_unreaped(void);
> int spawn_worker_bad(int *result);
> int spawn_worker_good(int *result);
> #endif
> ```
> ```c
> #include <pthread.h>
> #include "threadexit.h"
>
> static int g_unreaped = 0;
>
> static void *worker(void *arg)
> {
>     int *r = (int *)arg;
>     *r = 42;
>     return NULL;
> }
>
> int unreaped_count(void) { return g_unreaped; }
> void reset_unreaped(void) { g_unreaped = 0; }
>
> int spawn_worker_bad(int *result)
> {
>     pthread_t th;
>     if (pthread_create(&th, NULL, worker, result) != 0) return -1;
>     g_unreaped++;                      /* join도 detach도 안 함 -> 스레드 자원이 회수되지 않음 */
>     return 0;
> }
>
> int spawn_worker_good(int *result)
> {
>     pthread_t th;
>     if (pthread_create(&th, NULL, worker, result) != 0) return -1;
>     g_unreaped++;
>     pthread_join(th, NULL);            /* 즉시 회수 */
>     g_unreaped--;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `spawn_worker_bad`와 `spawn_worker_good`은 `pthread_create` 호출까지 완전히 동일하다.
> 차이는 그다음 **`pthread_join` 한 줄의 유무**뿐이다 — 스레드를 "만드는 것"과 "책임지고 회수하는 것"은 별개의 결정이라는 걸 보여준다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD49. 스택 주소 해제](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD49.%20코드정확성%20스택%20주소%20해제%20—%20malloc%20포인터만%20해제로%20치환.md)
- Part 5(코드 오류) 9개 중 8개 완료 — [다음: SD51. 무한 자원 할당](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD51.%20무한%20자원%20할당%20—%20상한%20및%20풀로%20치환.md)
