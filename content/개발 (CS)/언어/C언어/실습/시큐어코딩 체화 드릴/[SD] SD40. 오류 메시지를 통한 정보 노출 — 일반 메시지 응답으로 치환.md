---
title: "SD40. 오류 메시지를 통한 정보 노출 — 일반 메시지 응답으로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD40. 오류 메시지를 통한 정보 노출 — 일반 메시지 응답으로 치환

> **원본 항목**: [Part 4. 에러 처리 — 1. 오류 메시지 통한 정보 노출](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/[시큐어코딩]%20Part%204.%20에러%20처리.md#1-오류-메시지-통한-정보-노출-cwe-209) `CWE-209`
> **repo 폴더**: `sd40_errmsg/` (`make D=sd40_errmsg T=main`)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 4(에러 처리)의 첫 드릴이다. mock 없이 **문자열 비교만으로 완전히 재현**된다 — "사용자에게 보이는 채널"과 "내부 로그 채널"을 분리하는 것 자체가 방어다.

---

## 0. 이 드릴로 체화할 것

```diff
- snprintf(user_msg, size, "Error: %s", detail);       /* 상세 정보를 사용자에게 그대로 노출 */
+ snprintf(user_msg, size, "요청 처리 중 오류가 발생했습니다.");   /* 사용자에게는 고정된 일반 메시지 */
+ snprintf(log_msg,  size, "[internal] %s", detail);              /* 상세 정보는 로그로만 */
```

상세 에러는 없애는 게 아니라 **채널을 분리**하는 것이다. 사용자에게는 단일하고 무의미한 메시지, 운영자에게는(로그를 통해) 그대로.

---

## 1. 취약 시나리오 — 변형 A: 설정 파일 로드 실패 메시지

> [!QUOTE] 요구사항서 (발췌)
> 설정 파일 로드에 실패하면 사용자에게 오류를 알린다.
> - 사용자에게 보이는 메시지에 서버 내부 경로·환경변수 값이 포함되어서는 안 된다.
> - 운영자가 원인을 진단할 수 있도록 상세 정보는 어딘가에 남아야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `detail`(환경변수·내부 경로가 섞인 상세 실패 사유) | 내부 로직(`getenv` 등) | 사용자에게 그대로 노출되는 응답 메시지 |

### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 내부 경로가 섞인 실패 사유 발생 | **사용자 메시지에 경로가 그대로 노출** | `snprintf`가 `detail`을 아무 필터링 없이 그대로 사용자 채널에 집어넣는다 |
| 같은 상황(Good) | **사용자에게는 고정 문구만, 로그에는 전체 상세** | 두 개의 출력 버퍼(사용자용/로그용)를 애초에 분리해서 만든다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 설정 파일 로드 실패 메시지 | 위 내용 |
| **B (2회차)** | **DB 연결 실패 메시지로 변형** | `detail`을 "host=10.0.0.5 user=admin ..." 같은 DB 접속 문자열로 바꿔, 노출 시 피해가 더 큰 시나리오를 체감한다 |
| **C (3회차)** | **오류 코드 매핑 테이블 추가** | `detail`을 그대로 로그에 남기는 대신, 내부 오류를 `E1001` 같은 코드로 매핑해 사용자에게는 코드만, 로그에는 코드+상세를 함께 남기는 구조로 확장 |

---

## 2. 제출물

```text
sd40_errmsg/src/errmsg.h
sd40_errmsg/src/errmsg.c
sd40_errmsg/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include <string.h>
#include "errmsg.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static const char *g_detail = "/home/appuser/.secret_config (MYPATH=/home/appuser/.secret_config)";

static void test_bad_leaks_detail(void)
{
    char user_msg[256];
    report_error_bad(g_detail, user_msg, sizeof(user_msg));
    T_TRUE(strstr(user_msg, g_detail) != NULL,
        "Bad는 상세 경로를 사용자 메시지에 그대로 노출해야 한다(취약점 재현)");
}

static void test_good_hides_detail_from_user(void)
{
    char user_msg[256], log_msg[256];
    report_error_good(g_detail, user_msg, sizeof(user_msg), log_msg, sizeof(log_msg));
    T_TRUE(strstr(user_msg, g_detail) == NULL,
        "Good은 사용자 메시지에 상세 경로가 절대 섞이면 안 된다");
}

static void test_good_keeps_detail_in_log(void)
{
    char user_msg[256], log_msg[256];
    report_error_good(g_detail, user_msg, sizeof(user_msg), log_msg, sizeof(log_msg));
    T_TRUE(strstr(log_msg, g_detail) != NULL,
        "Good은 로그에는 상세 내용을 그대로 남겨야 한다(운영 디버깅을 위해)");
}

int main(void)
{
    test_bad_leaks_detail();
    test_good_hides_detail_from_user();
    test_good_keeps_detail_in_log();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_leaks_detail` 통과 | 25 | ☐ |
| `test_good_hides_detail_from_user` 통과 — 사용자 메시지에 상세 정보 0% | 40 | ☐ |
| `test_good_keeps_detail_in_log` 통과 — 로그에는 상세 정보 100% | 25 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "정보 노출을 막는다"를 "로그도 지운다"로 오해 | 상세 정보를 아예 안 남기면 운영자가 실제 장애를 진단할 수 없다. 막아야 할 건 **사용자에게 보이는 채널**이지 정보 자체가 아니다 |
| 사용자 메시지 안에 일부만 가림(예: 경로 앞부분만 마스킹) | 부분 마스킹은 나머지 조각으로도 시스템 구조를 추론할 여지를 남긴다. 아예 무관한 고정 문구로 완전히 치환하는 게 안전하다 |
| 로그 버퍼와 사용자 버퍼를 같은 변수 하나로 재사용 | 한 버퍼를 순서대로 다른 용도로 덮어쓰면, 나중에 코드가 수정될 때 사용자에게 로그용 내용이 실수로 노출되기 쉽다. 처음부터 별개의 버퍼(채널)로 분리해야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `errmsg.h` / `errmsg.c`
> ```c
> #ifndef ERRMSG_H
> #define ERRMSG_H
> #include <stddef.h>
> void report_error_bad(const char *detail, char *user_msg, size_t user_msg_size);
> void report_error_good(const char *detail, char *user_msg, size_t user_msg_size,
>                         char *log_msg, size_t log_msg_size);
> #endif
> ```
> ```c
> #include <stdio.h>
> #include "errmsg.h"
>
> void report_error_bad(const char *detail, char *user_msg, size_t user_msg_size)
> {
>     snprintf(user_msg, user_msg_size, "Error: %s", detail);   /* 상세 정보를 그대로 노출 */
> }
>
> void report_error_good(const char *detail, char *user_msg, size_t user_msg_size,
>                         char *log_msg, size_t log_msg_size)
> {
>     snprintf(user_msg, user_msg_size, "%s", "요청 처리 중 오류가 발생했습니다.");
>     snprintf(log_msg, log_msg_size, "[internal] %s", detail);  /* 상세 정보는 로그로만 */
> }
> ```
>
> **눈여겨볼 점**: `report_error_good`의 매개변수가 `report_error_bad`보다 **2개 더 많다**(`log_msg`, `log_msg_size`). 함수 시그니처 자체가 "출력 채널이 두 개로 분리되어 있다"고 선언하는 셈이다 — 안전한 설계는 종종 매개변수 개수의 증가로 드러난다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (설정 파일 로드) |  |  |  |
| 2 |  | B (DB 연결 실패) |  |  |  |
| 3 |  | C (오류 코드 매핑) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD39. 심볼릭명 매핑 오류](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD39.%20심볼릭명이%20정확한%20대상에%20매핑되어%20있지%20않음%20—%20mkstemp로%20치환.md)
- [다음: SD41. 오류상황 대응 부재](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD41.%20오류상황%20대응%20부재%20—%20실제%20조치%20동반으로%20치환.md)
