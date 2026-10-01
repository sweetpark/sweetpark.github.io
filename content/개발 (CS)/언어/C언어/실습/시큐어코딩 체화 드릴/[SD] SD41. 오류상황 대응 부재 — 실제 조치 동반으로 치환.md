---
title: "SD41. 오류상황 대응 부재 — 실제 조치 동반으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD41. 오류상황 대응 부재 — 실제 조치 동반으로 치환

> **원본 항목**: [Part 4. 에러 처리 — 2. 오류상황 대응 부재](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/[시큐어코딩]%20Part%204.%20에러%20처리.md#2-오류상황-대응-부재-cwe-390) `CWE-390`
> **repo 폴더**: `sd41_erract/` (`make D=sd41_erract T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> "검사는 했지만 아무 조치가 없는" 빈 오류 처리 블록을 재현한다 — 실패를 **감지**하는 것과 실패에 **대응**하는 것은 완전히 다른 일이라는 걸 상태 변화로 직접 확인한다.

---

## 0. 이 드릴로 체화할 것

```diff
  if (rc != 0) {
-     /* do nothing */              /* 검사는 하지만 아무 조치도 없음 */
+     return -1;                     /* 실제 조치: 즉시 중단하고 실패를 알림 */
  }
```

빈 `if` 블록은 "검사했다"가 아니라 "오류를 은폐했다"는 뜻이다. 검사 뒤에는 반드시 로그·복구·중단 중 하나의 **실제 조치**가 있어야 한다.

---

## 1. 취약 시나리오 — 변형 A: 잔액 차감 트랜잭션

> [!QUOTE] 요구사항서 (발췌)
> 요청을 처리하기 전에 사전 검증 단계를 거친다.
> - 사전 검증이 실패하면 잔액 차감이 절대 일어나서는 안 된다.
> - 실패 시 호출자는 반드시 실패를 알 수 있어야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 사전 검증 결과(`rc`) | 내부 검증 로직 | `if (rc != 0)` 블록이 비어 있어 검증 결과와 무관하게 다음 로직(잔액 차감)이 그대로 실행된다 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 사전 검증 실패(`rc = -1`) | **잔액이 그대로 차감되고 함수는 성공(0)을 반환** | `if` 블록이 비어 있어 실패를 감지만 하고 아무 것도 막지 않는다 — 심지어 반환값도 거짓으로 성공을 알린다 |
| 같은 상황(Good) | **잔액은 그대로, 함수는 실패(-1)를 반환** | 실패를 감지한 즉시 `return -1`로 이후 로직 실행 자체를 막는다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 잔액 차감 트랜잭션 | 위 내용 |
| **B (2회차)** | **파일 쓰기 실패로 변형** | 가이드 원문처럼 `fputs`류 함수의 반환값을 검사하는 형태로 바꿔, "쓰기 실패 감지 후 아무 조치 없음" 대 "실패 로그 남기고 중단"을 비교한다 |
| **C (3회차)** | **재시도(retry) 로직 추가** | Good을 한 단계 발전시켜, 실패 시 즉시 중단하는 대신 최대 3회까지 재시도한 뒤에도 실패하면 그때 중단하는 함수로 확장한다 |

---

## 2. 제출물

```text
sd41_erract/src/erract.h
sd41_erract/src/erract.c
sd41_erract/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

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

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_hides_failure` 통과(반환값 거짓 성공 + 상태 오염 둘 다) | 35 | ☐ |
| `test_good_reports_failure` 통과(실패 반환 + 상태 불변 둘 다) | 40 | ☐ |
| `test_good_normal_path` 통과 | 15 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `if (rc != 0) { }` 를 지우기만 하고 끝냄 | 블록을 지워도 다음 줄(`*out_balance -= 100`)이 여전히 무조건 실행된다. 핵심은 "블록을 없애는 것"이 아니라 "블록 안에 `return`/중단을 넣어 이후 코드 실행을 막는 것"이다 |
| 로그만 남기고 `return`을 빼먹음 | "감지했다는 흔적"을 남기는 것과 "실행 흐름을 실제로 바꾸는 것"은 다르다. 로그를 찍어도 다음 줄이 계속 실행되면 상태 오염은 똑같이 일어난다 |
| Bad의 반환값이 왜 `0`(성공)인지 이해 못 함 | 이 항목의 핵심 위험은 단순히 "차감이 일어난다"가 아니라, **호출자마저 실패를 모른 채 성공으로 착각한다**는 것이다. 이중 은폐(상태 오염 + 거짓 성공 보고)라는 점을 놓치기 쉽다 |

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
> **눈여겨볼 점**: 두 함수의 차이는 `if` 블록 안의 **단 한 줄**(`/* do nothing */` vs `return -1;`)뿐이다. 겉보기엔 사소해 보이지만, 그 한 줄의 유무가 "실패가 다음 로직 실행을 막는가"를 완전히 가른다. 코드 리뷰에서 빈 오류 처리 블록을 그냥 지나치기 쉬운 이유가 바로 이 시각적 사소함이다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (잔액 차감) |  |  |  |
| 2 |  | B (파일 쓰기 실패) |  |  |  |
| 3 |  | C (재시도 로직) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD40. 오류 메시지를 통한 정보 노출](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD40.%20오류%20메시지를%20통한%20정보%20노출%20—%20일반%20메시지%20응답으로%20치환.md)
- [다음: SD42. 적절하지 않은 예외처리](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD42.%20적절하지%20않은%20예외처리%20—%20반환값%20검사%20동반으로%20치환.md)
