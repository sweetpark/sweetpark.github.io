---
title: "SD02. 자원 삽입 — 화이트리스트 범위 검사로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD02. 자원 삽입 — 화이트리스트 범위 검사로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 2. 자원 삽입](../../시큐어코딩가이드/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#2-자원-삽입-cwe-99) `CWE-99`
> **repo 폴더**: `sd02_resinj/` (`make D=sd02_resinj T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> 이 항목은 mock이 필요 없다 — 소켓을 실제로 열지 않고 "포트 번호를 결정하는 함수"만 떼어서 검증한다.

---

## 0. 이 드릴로 체화할 것

```diff
- return atoi(env_val);                              /* 검증 없이 그대로 포트로 사용 */
+ int port = atoi(env_val);
+ if (port < PORT_MIN || port > PORT_MAX) return PORT_DEFAULT;  /* 범위 밖이면 기본값 */
+ return port;
```

자원 식별자(포트·파일명·핸들)는 "값"으로 받지 말고 "허용된 범위/목록 안의 값인가"로 받는다.

---

## 1. 취약 시나리오 — 변형 A: 서비스 포트 결정

> [!QUOTE] 요구사항서 (발췌)
> 환경변수 문자열(`env_val`)을 받아 서비스가 리슨할 포트 번호를 결정한다.
> - 허용 포트는 `3000`~`3003` 4개뿐이다.
> - 범위를 벗어나면 기본값 `3000` 을 쓴다(연결 실패 대신 안전한 기본값으로 대체).

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `env_val` | 외부(환경변수) | 소켓 `bind()` 포트 인자 |

### 공격 입력표

| 입력 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `"3002"` (정상) | 3002 | 정상 동작 |
| `"22"` | **22** | SSH 등 다른 서비스 포트를 그대로 점유하려 든다 |
| `"99999"` | **99999** | `uint16_t` 범위(0~65535)를 넘어 소켓 바인딩 시 오동작·크래시 소지 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 서비스 포트 결정 | 위 내용 |
| **B (2회차)** | **로그 레벨 결정** | 환경변수로 로그 레벨 문자열(`"debug"`,`"info"`,`"error"` 등)을 받되, 화이트리스트에 없으면 `"info"` 로 강제. 값 자체가 아니라 "허용된 문자열 집합"으로 판단하는 연습 |
| **C (3회차)** | **워커 스레드 수 결정** | 환경변수 정수값이 `1~16` 범위 밖이면 기본값 `4` 로 대체. 정수 파싱 실패(`atoi` 가 0을 반환하는 비정상 문자열)까지 구분해서 처리 |

---

## 2. 제출물

```text
sd02_resinj/src/port_guard.h
sd02_resinj/src/port_guard.c
sd02_resinj/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "port_guard.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_accepts_dangerous_port(void)
{
    T_TRUE(parse_port_bad("22") == 22, "Bad는 SSH 포트도 그대로 받아들여야 한다(취약점 재현)");
    T_TRUE(parse_port_bad("99999") == 99999, "Bad는 유효 범위 밖 포트도 그대로 반환");
}

static void test_bad_normal(void)
{
    T_TRUE(parse_port_bad("3002") == 3002, "정상 포트는 그대로 반환");
}

static void test_good_rejects_out_of_range(void)
{
    T_TRUE(parse_port_good("22") == 3000, "Good은 범위 밖이면 기본값(3000)으로 대체");
    T_TRUE(parse_port_good("99999") == 3000, "Good은 65535 초과도 기본값으로 대체");
}

static void test_good_allows_normal(void)
{
    T_TRUE(parse_port_good("3002") == 3002, "Good도 허용 범위 안 값은 그대로 통과");
}

int main(void)
{
    test_bad_accepts_dangerous_port();
    test_bad_normal();
    test_good_rejects_out_of_range();
    test_good_allows_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_accepts_dangerous_port` 통과 — Bad가 실제로 임의 포트를 받는다 | 20 | ☐ |
| `test_good_rejects_out_of_range` 통과 | 25 | ☐ |
| `test_good_allows_normal` 통과(과잉 차단 없음) | 15 | ☐ |
| 범위 검사가 **하한과 상한 모두** 있다(`< MIN`, `> MAX`) | 20 | ☐ |
| 기본값이 허용 범위 **안**의 값이다 | 10 | ☐ |
| 경고 0 | 5 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 상한만 검사하고 하한(음수)은 빼먹음 | `atoi("-1")` 은 `-1` 을 반환한다. 포트로 쓰이면 정수 변환 시 예기치 않은 값이 된다 |
| 기본값을 범위 밖 값(예: `0`)으로 잡음 | "안전한 기본값"이 아니라 새로운 결함이 된다 |
| `atoi` 실패(비숫자 문자열)와 "범위 밖"을 구분하지 않음 | 변형 C에서는 이 둘을 구분해야 한다 — `atoi("abc")` 는 `0` 을 반환하므로 "파싱 실패"인지 "값이 0"인지 알 수 없다(`strtol` + `endptr` 검사로 개선 가능) |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `port_guard.h` / `port_guard.c`
> **헤더 (`port_guard.h`)**
> ```c
> #ifndef PORT_GUARD_H
> #define PORT_GUARD_H
> int parse_port_bad(const char *env_val);
> int parse_port_good(const char *env_val);
> #endif
> ```
> **구현 (`port_guard.c`)**
> ```c
> #include <stdlib.h>
> #include "port_guard.h"
>
> #define PORT_MIN     3000
> #define PORT_MAX     3003
> #define PORT_DEFAULT 3000
>
> int parse_port_bad(const char *env_val)
> {
>     return atoi(env_val);
> }
>
> int parse_port_good(const char *env_val)
> {
>     int port = atoi(env_val);
>     if (port < PORT_MIN || port > PORT_MAX) return PORT_DEFAULT;
>     return port;
> }
> ```
>
> **눈여겨볼 점**: 검증 로직이 `parse_port_bad` 안에는 아예 없다 — "검증을 깜빡한 것"이 아니라 "검증이라는 단계 자체가 빠진 것"이다. 이 항목의 치환은 코드를 고치는 게 아니라 **단계를 추가하는 것**이다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (포트) |  |  |  |
| 2 |  | B (로그 레벨) |  |  |  |
| 3 |  | C (스레드 수) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD01. SQL 삽입]([SD]%20SD01.%20SQL%20삽입%20—%20인자화된%20질의문으로%20치환.md)
- [다음: SD03. 크로스사이트 스크립트]([SD]%20SD03.%20크로스사이트%20스크립트%20—%20출력%20직전%20HTML%20이스케이프로%20치환.md)
