---
title: "SD50. 코드정확성 스레드 조기 종료 — join 또는 detach 명시로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD50. 코드정확성: 스레드 조기 종료 — join 또는 detach 명시로 치환

> **원본 항목**: [Part 5. 코드 오류 — 8. 코드 정확성: 스레드 조기 종료](../../시큐어코딩가이드/%5B시큐어코딩%5D%20Part%205.%20코드%20오류.md#8-코드-정확성-스레드-조기-종료-cwe-730) `CWE-730`
> **repo 폴더**: `sd50_threadexit/` (`make D=sd50_threadexit T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> **실제 `pthread`**를 사용한다. 다만 "스레드가 회수됐는가"를 OS 자원 소진까지 기다리지 않고 즉시 확인할 수 있도록, 생성·회수 시점마다 직접 세는 카운터(`g_unreaped`)를 함께 둔다.

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

스레드는 만드는 순간 "join할 것인가 detach할 것인가"를 반드시 함께 결정해야 한다. 결정을 안 하는 것 자체가 결함이다.

---

## 1. 취약 시나리오 — 변형 A: 백그라운드 작업 스레드 생성

> [!QUOTE] 요구사항서 (발췌)
> 작업을 처리할 워커 스레드를 생성한다.
> - 생성한 스레드는 반드시 join 또는 detach로 회수 여부가 결정돼야 한다.
> - 결과값은 필요하면 안전하게 받아올 수 있어야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| (해당 없음) | — | join/detach 결정 누락 자체가 결함이다 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `spawn_worker_bad()` 호출 | **미회수 스레드 카운트가 `1`로 남음** | `pthread_join`도 `pthread_detach`도 호출하지 않아 스레드 자원의 운명이 결정되지 않은 채 함수가 끝난다 |
| 같은 상황(Good) | 미회수 카운트가 `0`으로 복귀, 결과값도 확실히 반영됨 | `pthread_join`으로 완료를 기다린 뒤 회수한다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 백그라운드 작업 스레드 생성(join으로 회수) | 위 내용 |
| **B (2회차)** | **`pthread_detach`로 회수하는 버전으로 변형** | 결과를 기다릴 필요가 없는 "fire-and-forget" 워커라면 `pthread_join` 대신 `pthread_attr_setdetachstate(PTHREAD_CREATE_DETACHED)`나 생성 직후 `pthread_detach(th)`로 회수하는 함수를 만들어, "기다리지 않고도 회수는 확실히 한다"는 또 다른 표준 패턴을 익힌다 |
| **C (3회차)** | **여러 스레드를 반복 생성하는 루프로 확장** | 워커를 5개 연속 생성하는 함수를 만들어, Bad 버전은 `unreaped_count()`가 5까지 누적되고 Good 버전은 매번 0으로 돌아오는 것을 반복 확인한다 |

---

## 2. 제출물

```text
sd50_threadexit/src/threadexit.h
sd50_threadexit/src/threadexit.c
sd50_threadexit/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

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
> Bad는 스레드를 회수하지 않으므로, 테스트 함수가 반환한 뒤에도 워커 스레드가 계속 실행 중일 수 있다. 결과를 담을 변수가 지역 스택 변수라면 함수가 끝난 뒤 워커가 그 자리에 늦게 쓰기를 시도하면서 이미 사라진 스택 메모리에 접근하는 **또 다른 버그**([SD47](%5BSD%5D%20SD47.%20스택%20변수%20주소%20리턴%20—%20힙%20할당%20반환으로%20치환.md)과 같은 종류)가 생길 수 있다. 그래서 `g_result_bad`는 프로세스가 끝날 때까지 유효한 전역 변수로 뒀다 — Bad 자체의 문제(미회수)와 그로 인한 2차 문제(댕글링 접근)를 뒤섞지 않기 위해서다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_leaves_thread_unreaped` 통과 | 35 | ☐ |
| `test_good_reaps_thread` 통과(카운트 + 결과값 둘 다) | 45 | ☐ |
| 목표 시간 내 | 20 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "메인 스레드가 곧 종료되니 상관없다"고 판단 | 짧게 끝나는 프로그램에서는 우연히 문제가 안 드러나지만, 장시간 도는 서버 프로세스에서 요청마다 스레드를 생성하면 미회수 스레드가 계속 쌓여 결국 스레드 생성 자체가 실패하는 지점에 도달한다 |
| `pthread_join`과 `pthread_detach`를 동시에 호출 | 이미 detach된 스레드를 join하려고 하면 정의되지 않은 동작이다. 하나의 스레드에는 join과 detach 중 **정확히 하나만** 적용해야 한다 |
| 결과를 기다릴 필요가 없다는 이유로 아예 아무 것도 안 함(Bad) | "기다릴 필요가 없다"는 "회수할 필요가 없다"가 아니다. 결과가 필요 없다면 `pthread_detach`로 명시적으로 "이 스레드는 알아서 회수된다"고 선언해야 한다 |

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
> **눈여겨볼 점**: `spawn_worker_bad`와 `spawn_worker_good`은 `pthread_create` 호출까지 완전히 동일하다. 차이는 그다음 **`pthread_join` 한 줄의 유무**뿐이다 — 스레드를 "만드는 것"과 "책임지고 회수하는 것"은 별개의 결정이라는 걸 보여준다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (join으로 회수) |  |  |  |
| 2 |  | B (detach로 회수) |  |  |  |
| 3 |  | C (반복 생성 루프) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD49. 스택 주소 해제](%5BSD%5D%20SD49.%20코드정확성%20스택%20주소%20해제%20—%20malloc%20포인터만%20해제로%20치환.md)
- Part 5(코드 오류) 9개 중 8개 완료 — [다음: SD51. 무한 자원 할당](%5BSD%5D%20SD51.%20무한%20자원%20할당%20—%20상한%20및%20풀로%20치환.md)
