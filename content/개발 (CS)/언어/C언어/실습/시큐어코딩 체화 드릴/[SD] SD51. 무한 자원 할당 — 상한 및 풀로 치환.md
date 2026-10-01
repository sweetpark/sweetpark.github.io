---
title: "SD51. 무한 자원 할당 — 상한 및 풀로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD51. 무한 자원 할당 — 상한 및 풀로 치환

> **원본 항목**: [Part 5. 코드 오류 — 9. 무한 자원 할당](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/[시큐어코딩]%20Part%205.%20코드%20오류.md#9-무한-자원-할당-cwe-770) `CWE-770`
> **repo 폴더**: `sd51_unbounded/` (`make D=sd51_unbounded T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 5(코드 오류)의 마지막 드릴이다. 실제 `accept()`/`pthread_create()` 대신, "지금 활성 연결이 몇 개인가"를 정수 하나로 추적해 **상한의 유무가 결과에 미치는 영향**을 요청 10개로 직접 관찰한다.

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

"요청당 무제한 할당"은 공격자에게 준 무료 DoS 버튼이다. 메시지 길이든 연결 수든 스레드 수든, 요청 하나가 만들 수 있는 자원에는 항상 상한이 있어야 한다.

---

## 1. 취약 시나리오 — 변형 A: 동시 접속 수 제한

> [!QUOTE] 요구사항서 (발췌)
> 서버는 동시에 여러 클라이언트의 접속을 받아들인다.
> - 동시 활성 연결 수에는 상한이 있어야 한다.
> - 상한을 넘는 요청은 거부해야 한다(서비스 자체는 계속 동작해야 한다).

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 연결 요청 횟수 | 외부(클라이언트) | 요청마다 무조건 자원을 늘리는 카운터 증가 지점 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 연결 요청 10회 | **활성 연결 10개 전부 생성**(상한 없음) | 요청 횟수만큼 그대로 자원이 늘어난다 — 공격자가 소수의 요청만으로도 자원을 무한정 소진시킬 수 있다 |
| 같은 상황(Good) | **`POOL_MAX`(4)개까지만 수락, 나머지 6개는 거부** | 상한에 도달하면 이후 요청은 실패로 응답하고 자원을 늘리지 않는다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 동시 접속 수 제한 | 위 내용 |
| **B (2회차)** | **메시지 길이 상한으로 변형** | 가이드 원문의 또 다른 축인 "요청 메시지 길이"에 상한을 두는 함수로 바꿔본다. `unsigned` 길이 인자에 `MAX_MSG_LEN` 상수 검사를 추가하는 형태 |
| **C (3회차)** | **연결 반환(release)까지 포함한 전체 수명주기로 확장** | `release_connection()`을 추가해, 상한에 걸려 거부됐던 요청도 기존 연결이 반환되면 다시 수락될 수 있게 만든다 — 단순 거부가 아니라 진짜 "풀(pool)"처럼 재사용되는 구조를 완성한다 |

---

## 2. 제출물

```text
sd51_unbounded/src/unbounded.h
sd51_unbounded/src/unbounded.c
sd51_unbounded/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

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

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_unbounded` 통과(정확히 10개까지 쌓임을 확인) | 30 | ☐ |
| `test_good_caps_at_pool_max` 통과(수락 4 / 거부 6 정확히 확인) | 50 | ☐ |
| 목표 시간 내 | 20 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 상한을 두되 거부 시 아무 값도 반환하지 않음 | 호출자가 성공했는지 거부됐는지 모르면 [SD41](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD41.%20오류상황%20대응%20부재%20—%20실제%20조치%20동반으로%20치환.md)의 "오류상황 대응 부재"로 이어진다. 상한 검사는 반드시 명확한 실패 반환과 짝을 이뤄야 한다 |
| 상한 값을 코드 여기저기에 매직 넘버로 흩어놓음 | `POOL_MAX`처럼 이름 붙인 상수 하나로 관리해야 나중에 정책이 바뀔 때(운영 중 튜닝) 한 곳만 고치면 된다 |
| "상한을 두면 정상 사용자도 거부당할 수 있다"는 이유로 상한을 아예 안 둠 | 상한이 없으면 정상 사용자 전원이 서비스 자체를 못 쓰게 되는 결과(DoS)로 이어진다. 상한은 "일부 요청의 불편"과 "전체 서비스 마비" 중 전자를 선택하는 것이다 |

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
> **눈여겨볼 점**: `handle_connection_good`은 `handle_connection_bad`보다 딱 **한 줄**(`if (g_active >= POOL_MAX) return -1;`) 앞서 나온다. Part 5(코드 오류) 9개 항목 중 상당수가 이렇게 "몇 줄 안 되는 차이"로 갈렸다는 걸 되짚어보면, 코드 오류 계열의 본질은 복잡한 로직이 아니라 **빠뜨리기 쉬운 한두 줄**에 있다는 걸 알 수 있다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (동시 접속 수 제한) |  |  |  |
| 2 |  | B (메시지 길이 상한) |  |  |  |
| 3 |  | C (반환·재사용 풀) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD50. 스레드 조기 종료](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD50.%20코드정확성%20스레드%20조기%20종료%20—%20join%20또는%20detach%20명시로%20치환.md)
- Part 5(코드 오류) 9개 완료 — [다음: SD52. 남은 디버그 코드](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD52.%20남은%20디버그%20코드%20—%20빌드%20매크로%20제거로%20치환.md)
