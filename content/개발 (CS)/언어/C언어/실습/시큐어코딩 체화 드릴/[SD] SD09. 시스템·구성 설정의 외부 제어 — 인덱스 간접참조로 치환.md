---
title: "SD09. 시스템 또는 구성 설정의 외부 제어 — 인덱스 간접참조로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD09. 시스템 또는 구성 설정의 외부 제어 — 인덱스 간접참조로 치환

> **원본 항목**: [Part 1-2. 외부제어·우회 계열 — 9. 시스템 또는 구성 설정의 외부 제어](../../시큐어코딩가이드/Part%201.%20입력데이터%20검증%20및%20표현/%5B시큐어코딩%5D%201-2.%20외부제어·우회%20계열.md#9-시스템-또는-구성-설정의-외부-제어-cwe-15) `CWE-15`
> **repo 폴더**: `sd09_sysconfig/` (`make D=sd09_sysconfig T=main`)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> mock 불필요 — "설정값을 결정하는 함수"만 떼어서 검증한다. SD02(자원 삽입)와 자매 항목이지만 치환 방식이 다르다는 걸 확인한다.

---

## 0. 이 드릴로 체화할 것

```diff
- return atoi(portStr);                              /* 외부 문자열을 그대로 설정값으로 */
+ if (index < 0 || index >= PORT_TABLE_SIZE) return -1;
+ return PORT_TABLE[index];                            /* 외부에서는 "인덱스"만 받는다 */
```

SD02가 "범위 검사"였다면 이 항목은 **"값 자체를 아예 외부에서 못 받게" 하는 간접 참조(indirection)** 다 — 외부는 `0`, `1`, `2` 같은 선택지 번호만 알고, 실제 값(포트 21, 2121, 8021)은 내부 테이블에만 존재한다.

---

## 1. 취약 시나리오 — 변형 A: FTP 서비스 포트 결정

> [!QUOTE] 요구사항서 (발췌)
> 서비스가 사용할 FTP 포트를 결정한다.
> - 허용되는 포트는 미리 정의한 3개(기본 `21`, 대체1 `2121`, 대체2 `8021`)뿐이다.
> - 외부에서는 "몇 번째 대체 포트를 쓸지" 인덱스만 전달받아야 한다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `portStr` | 외부(명령줄 인자/설정 요청) | 서비스 포트 설정값 |

### 공격 입력표

| 입력 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `"21"` (정상) | 21 | 정상 동작 |
| `"22"` | **22** | SSH 등 이미 쓰이는 포트와 충돌시켜 서비스 거부(DoS)를 유발할 수 있다 |
| `"0"` | **0** | 예약 포트(0)를 그대로 받아 시스템이 예기치 않게 동작할 수 있다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | FTP 포트 결정 | 위 내용 |
| **B (2회차)** | **호스트 ID 설정** | PDF 원문의 `sethostid()` 사례처럼, 문자열이 아니라 정수 하나를 통째로 시스템 설정 함수에 넘기는 대신 미리 정의한 상수(`0xC0A80101` 등) 중 하나를 인덱스로 선택하도록 변경 |
| **C (3회차)** | **테이블 크기를 런타임에 바꿔야 하는 상황** | 포트 후보가 설정 파일에서 동적으로 로드되는 경우, "로드된 테이블도 여전히 서버 내부 자원이고 외부는 인덱스만 받는다"는 원칙이 유지되는지 확인 |

---

## 2. 제출물

```text
sd09_sysconfig/src/service_port.h
sd09_sysconfig/src/service_port.c
sd09_sysconfig/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

```c
#include <stdio.h>
#include "service_port.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(resolve_service_port_bad("22") == 22,
        "Bad는 외부 입력을 그대로 서비스 포트로 써서 임의 포트를 지정할 수 있어야 한다(취약점 재현)");
    T_TRUE(resolve_service_port_bad("0") == 0, "0번 포트 같은 비정상 값도 그대로 통과");
}

static void test_bad_normal(void)
{
    T_TRUE(resolve_service_port_bad("21") == 21, "정상 포트 문자열도 그대로 반환");
}

static void test_good_blocks_arbitrary_value(void)
{
    T_TRUE(resolve_service_port_good(99) == -1, "Good은 범위 밖 인덱스를 거부해야 한다");
    T_TRUE(resolve_service_port_good(-5) == -1, "음수 인덱스도 거부");
}

static void test_good_normal(void)
{
    T_TRUE(resolve_service_port_good(0) == 21, "인덱스 0은 기본 포트(21)");
    T_TRUE(resolve_service_port_good(1) == 2121, "인덱스 1은 대체 포트(2121)");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_arbitrary_value();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 20 | ☐ |
| `test_good_blocks_arbitrary_value` 통과(범위 밖 + 음수 모두) | 25 | ☐ |
| `test_good_normal` 통과 | 15 | ☐ |
| `resolve_service_port_good` 이 **문자열이 아니라 정수 인덱스**를 받는다 | 25 | ☐ |
| 포트 값 자체는 `static const` 테이블 안에만 있다 | 10 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `resolve_service_port_good` 도 문자열을 받아서 내부에서 `atoi` 후 범위 검사 | SD02와 똑같은 해법이 되어버린다 — 이 항목의 핵심(값 자체를 안 받는 것)을 놓친 것 |
| 테이블 인덱스 범위 검사에서 상한만 확인하고 음수는 빼먹음 | `index`가 `int` 이므로 음수가 들어올 수 있다. `(size_t)index >= SIZE` 로 캐스팅 비교 시 음수가 거대한 값으로 바뀌어 우연히 막히는 경우와, 하한을 명시적으로 검사하는 경우를 구분해서 이해할 것 |
| 테이블에 없는 값을 반환할 때 `0`을 리턴 | 포트 `0`은 그 자체로 유효하지 않은 값일 수 있다 — 에러를 알리는 값(`-1`)과 정상 값(`0`)이 겹치지 않게 설계 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `service_port.h` / `service_port.c`
> **헤더 (`service_port.h`)**
> ```c
> #ifndef SERVICE_PORT_H
> #define SERVICE_PORT_H
> int resolve_service_port_bad(const char *portStr);
> int resolve_service_port_good(int index);
> #endif
> ```
> **구현 (`service_port.c`)**
> ```c
> #include <stdlib.h>
> #include "service_port.h"
>
> int resolve_service_port_bad(const char *portStr)
> {
>     return atoi(portStr);
> }
>
> static const int PORT_TABLE[] = { 21, 2121, 8021 };  /* DEFAULT, ALT1, ALT2 */
> #define PORT_TABLE_SIZE (sizeof(PORT_TABLE)/sizeof(PORT_TABLE[0]))
>
> int resolve_service_port_good(int index)
> {
>     if (index < 0 || (size_t)index >= PORT_TABLE_SIZE) return -1;
>     return PORT_TABLE[index];
> }
> ```
>
> **눈여겨볼 점**: `resolve_service_port_bad` 와 `resolve_service_port_good` 은 **매개변수 타입 자체가 다르다**(`const char *` vs `int`). SD08과 마찬가지로, 이 항목의 방어는 "검증 로직 추가"가 아니라 "함수가 받아들이는 정보의 종류를 바꾸는 것"이다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (FTP 포트) |  |  |  |
| 2 |  | B (호스트 ID) |  |  |  |
| 3 |  | C (동적 테이블) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](README.md)
- [이전: SD08. 보호 메커니즘 우회 가능한 입력값 변조](%5BSD%5D%20SD08.%20보호%20메커니즘%20우회%20가능한%20입력값%20변조%20—%20세션ID만%20신뢰하도록%20치환.md)
- [다음: SD10. 프로세스 제어](%5BSD%5D%20SD10.%20프로세스%20제어%20—%20허용%20명령%20매핑으로%20치환.md)
