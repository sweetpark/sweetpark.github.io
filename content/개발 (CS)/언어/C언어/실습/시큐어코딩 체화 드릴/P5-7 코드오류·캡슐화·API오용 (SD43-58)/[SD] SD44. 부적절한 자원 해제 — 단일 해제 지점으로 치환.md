---
title: "SD44. 부적절한 자원 해제 — 단일 해제 지점으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD44. 부적절한 자원 해제 — 단일 해제 지점으로 치환

> **원본 항목**: [Part 5. 코드 오류 — 2. 부적절한 자원 해제](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#2-부적절한-자원-해제-cwe-404) `CWE-404`
> **repo 폴더**: `sd44_resleak/` (`make D=sd44_resleak T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> 실제 DB 핸들(`SQLAllocHandle`) 대신, "몇 개가 지금 할당돼 있는가"를 직접 셀 수 있는 작은 핸들 풀을 만들어 자원 누수를 **숫자로 정확히** 증명한다.

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

자원 해제는 "정상 경로"가 아니라 "에러 경로"에서 빠진다. 할당한 모든 자원은, 성공하든 실패하든 **모든 코드 경로**에서 짝을 이뤄 반환돼야 한다.

---

## 1. 취약 시나리오 — 변형 A: 두 단계 핸들 할당

> [!QUOTE] 요구사항서 (발췌)
> 작업을 위해 핸들 두 개(env, connection)를 순서대로 할당한다.
> - 중간에 어떤 이유로 실패하더라도, 이미 할당한 핸들은 반드시 반환해야 한다.
> - 풀은 유한하다 — 반환하지 않으면 다음 요청이 실패한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `simulate_late_failure`(늦은 실패 여부) | 호출자/외부 조건 | 이미 할당된 핸들을 반환할지 그냥 종료할지를 가르는 분기 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 두 핸들을 할당한 뒤 늦게 실패 | **핸들 2개가 반환되지 않고 그대로 누수**(`handles_in_use() == 2`) | 에러 경로에 `free_handle` 호출이 아예 없다 |
| 같은 상황(Good) | **핸들 사용량이 0으로 복귀** | 에러 경로에서도 할당 역순으로 반환한다 |
| 정상 종료(둘 다) | 핸들 사용량 0 | 정상 경로는 원래도 반환 로직이 있어 문제없다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 두 단계 핸들 할당 | 위 내용 |
| **B (2회차)** | **`goto cleanup` 단일 해제 지점으로 리팩터링** | 여러 개의 `free_handle` 호출을 함수 끝의 `cleanup:` 레이블 하나로 모아, 어떤 실패 지점에서도 같은 정리 코드를 한 번만 거치도록 바꾼다 |
| **C (3회차)** | **핸들 3단계로 확장** | env → connection → statement 3단계로 늘려, 각 단계에서 실패할 때마다 "그 이전까지 할당된 것만" 정확히 반환하는지 확인한다 |

---

## 2. 제출물

```text
sd44_resleak/src/resleak.h
sd44_resleak/src/resleak.c
sd44_resleak/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

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

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_leaks_on_failure` 통과(누수 2개 정확히 확인) | 30 | ☐ |
| `test_good_releases_on_failure` 통과(누수 0) | 40 | ☐ |
| 정상 경로 테스트 둘 다 통과 | 20 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `con_hd`만 반환하고 `env_hd`는 빼먹음 | 나중에 할당한 자원부터 먼저 반환해야 한다는 원칙(역순 반환)을 지키지 않으면 중간에 하나를 빼먹기 쉽다. 항상 "가장 최근 할당 → 가장 오래된 할당" 순서로 정리한다 |
| 실패 지점마다 반환 코드를 매번 다르게 작성 | 실패 지점이 늘어날수록 각 지점에서 "지금까지 뭘 할당했는지"를 따로 추적해야 해서 실수하기 쉽다. 변형 B의 `goto cleanup` 패턴이 바로 이 문제를 해결한다 |
| 이미 반환한 핸들을 또 반환(중복 해제) | `free_handle`을 실수로 두 번 부르면 실제 자원(파일 디스크립터·DB 핸들)에서는 다른 코드가 이미 재사용 중인 자원을 엉뚱하게 반환하는 사고로 이어질 수 있다. 반환한 핸들 변수는 즉시 -1 등 무효값으로 표시하는 습관을 들인다 |

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
> **눈여겨볼 점**: `process_bad`와 `process_good`은 각 실패 지점 **직전까지 완전히 동일**하다. 차이는 오직 실패가 확정된 순간 `free_handle`을 호출하느냐다. "무엇을 할당했는가"가 아니라 "실패했을 때 그것들을 되돌리는가"가 이 항목의 전부다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (두 단계 할당) |  |  |  |
| 2 |  | B (goto cleanup) |  |  |  |
| 3 |  | C (3단계 확장) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD43. 널 포인터 역참조](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD43.%20널%20포인터%20역참조%20—%20반환값%20검사%20후%20사용으로%20치환.md)
- [다음: SD45. 부호→무부호 변환 오류](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD45.%20부호%20정수를%20무부호%20정수로%20타입%20변환%20오류%20—%20안전한%20에러값으로%20치환.md)
