---
title: "SD40. 오류 메시지를 통한 정보 노출 — 일반 메시지 응답으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD40. 오류 메시지를 통한 정보 노출 — 일반 메시지 응답으로 치환

> **원본 항목**: [Part 4. 에러 처리 — 1. 오류 메시지 통한 정보 노출](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%204.%20에러%20처리.md#1-오류-메시지-통한-정보-노출-cwe-209) `CWE-209`
> **repo 폴더**: `sd40_errmsg/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 4(에러 처리)의 첫 드릴이다.
> mock 없이 **문자열 비교만으로 완전히 재현**된다 — "사용자에게 보이는 채널"과 "내부 로그 채널"을 분리하는 것 자체가 방어다.

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
- snprintf(user_msg, size, "Error: %s", detail);       /* 상세 정보를 사용자에게 그대로 노출 */
+ snprintf(user_msg, size, "요청 처리 중 오류가 발생했습니다.");   /* 사용자에게는 고정된 일반 메시지 */
+ snprintf(log_msg,  size, "[internal] %s", detail);              /* 상세 정보는 로그로만 */
```

상세 에러는 없애는 게 아니라 **채널을 분리**하는 것이다.
사용자에게는 단일하고 무의미한 메시지, 운영자에게는(로그를 통해) 그대로.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 설정 파일 로드 실패 메시지 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** DB 연결 실패 메시지로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 오류 코드 매핑 테이블 추가 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 설정 파일 로드 실패 메시지

설정 파일 로드에 실패하면 사용자에게 오류를 알린다.
- 사용자에게 보이는 메시지에 서버 내부 경로·환경변수 값이 포함되어서는 안 된다.
- 운영자가 원인을 진단할 수 있도록 상세 정보는 어딘가에 남아야 한다.

**함수**

```c
void report_error_bad(const char *detail, char *user_msg, size_t user_msg_size);
void report_error_good(const char *detail, char *user_msg, size_t user_msg_size, char *log_msg, size_t log_msg_size);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `detail`(환경변수·내부 경로가 섞인 상세 실패 사유) | 내부 로직(`getenv` 등) | 사용자에게 그대로 노출되는 응답 메시지 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 내부 경로가 섞인 실패 사유 발생 | **사용자 메시지에 경로가 그대로 노출** | `snprintf`가 `detail`을 아무 필터링 없이 그대로 사용자 채널에 집어넣는다 |
| 같은 상황(Good) | **사용자에게는 고정 문구만, 로그에는 전체 상세** | 두 개의 출력 버퍼(사용자용/로그용)를 애초에 분리해서 만든다 |

### 1-B. 변형 B — DB 연결 실패 메시지로 변형

`detail`을 "host=10.0.0.5 user=admin ..." 같은 DB 접속 문자열로 바꿔, 노출 시 피해가 더 큰 시나리오를 체감한다

### 1-C. 변형 C — 오류 코드 매핑 테이블 추가

`detail`을 그대로 로그에 남기는 대신, 내부 오류를 `E1001` 같은 코드로 매핑해 사용자에게는 코드만, 로그에는 코드+상세를 함께 남기는 구조로 확장

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `report_error_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void report_error_bad(const char *detail, char *user_msg, size_t user_msg_size)
{
    /* 1. snprintf(user_msg, user_msg_size, "Error: %s", detail)   ← 상세 정보를 그대로 노출 */
}

void report_error_good(const char *detail, char *user_msg, size_t user_msg_size,
                       char *log_msg, size_t log_msg_size)
{
    /* [ ] 1. 매개변수에 log_msg, log_msg_size 를 **추가**한다
     *        (출력 채널이 둘로 분리된다) */

    /* [ ] 2. 사용자 메시지는 고정 문자열
     *        snprintf(user_msg, user_msg_size, "%s", "요청 처리 중 오류가 발생했습니다.") */

    /* [ ] 3. 상세 정보는 로그로만
     *        snprintf(log_msg, log_msg_size, "[internal] %s", detail) */
}
```

### 2-B. `report_error_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void report_error_good(const char *detail, char *user_msg, size_t user_msg_size,
                       char *log_msg, size_t log_msg_size)
{
    /* [ ] 1. 매개변수에 log_msg, log_msg_size 를 **추가**한다 */

    /* [ ] 2. 사용자 메시지는 고정 문자열 */

    /* [ ] 3. 상세 정보는 로그로만 */
}
```

### 2-C. `report_error_good` — Level 3 (3회차, 백지)

```c
void report_error_good(const char *detail, char *user_msg, size_t user_msg_size,
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 상세 에러를 없애는 게 아니라 **채널을 분리**한다
     *   - `"%s"` 로 고정 문자열을 넘긴다
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
sd40_errmsg/src/errmsg.h
sd40_errmsg/src/errmsg.c
sd40_errmsg/test/test.c
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

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — DB 연결 실패 메시지로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `detail = "host=10.0.0.5 user=admin ..."` | 접속 문자열이 사용자에게 노출 | 사용자에게는 일반 메시지, 상세는 로그 |
| 정상 호출 | 상세 노출 | 일반 메시지 |

**변형 C — 오류 코드 매핑 테이블 추가**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 내부 오류를 `E1001` 코드로 매핑 | 원문 그대로 | 사용자에게는 코드만, 로그에는 코드+상세 |
| 모르는 오류 | 원문 그대로 | 일반 메시지 |

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
make D=sd40_errmsg V=main SRC="sd40_errmsg/src/errmsg.c sd40_errmsg/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd40_errmsg/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd40_errmsg/src/errmsg.c sd40_errmsg/test/test.c \
>     -pthread -o build/sd40_errmsg_main
> ./build/sd40_errmsg_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "정보 노출을 막는다"를 "로그도 지운다"로 오해 | 상세 정보를 아예 안 남기면 운영자가 실제 장애를 진단할 수 없다.<br>막아야 할 건 **사용자에게 보이는 채널**이지 정보 자체가 아니다 |
| 사용자 메시지 안에 일부만 가림(예: 경로 앞부분만 마스킹) | 부분 마스킹은 나머지 조각으로도 시스템 구조를 추론할 여지를 남긴다.<br>아예 무관한 고정 문구로 완전히 치환하는 게 안전하다 |
| 로그 버퍼와 사용자 버퍼를 같은 변수 하나로 재사용 | 한 버퍼를 순서대로 다른 용도로 덮어쓰면, 나중에 코드가 수정될 때 사용자에게 로그용 내용이 실수로 노출되기 쉽다.<br>처음부터 별개의 버퍼(채널)로 분리해야 한다 |

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
> **눈여겨볼 점**: `report_error_good`의 매개변수가 `report_error_bad`보다 **2개 더 많다**(`log_msg`, `log_msg_size`).
> 함수 시그니처 자체가 "출력 채널이 두 개로 분리되어 있다"고 선언하는 셈이다 — 안전한 설계는 종종 매개변수 개수의 증가로 드러난다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD39. 심볼릭명 매핑 오류](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD39.%20심볼릭명이%20정확한%20대상에%20매핑되어%20있지%20않음%20—%20mkstemp로%20치환.md)
- [다음: SD41. 오류상황 대응 부재](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD41.%20오류상황%20대응%20부재%20—%20실제%20조치%20동반으로%20치환.md)
