---
title: "SD24. 하드코드된 패스워드 — 외부 설정 로드로 치환"
description: "시큐어코딩 SD24 하드코드된 패스워드 (CWE-259): 취약한 코드를 외부 설정 로드 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD24. 하드코드된 패스워드 — 외부 설정 로드로 치환

> **원본 항목**: [Part 2-2. 자격증명 관리 계열 — 5. 하드코드된 패스워드](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-2.%20자격증명%20관리%20계열.md#5-하드코드된-패스워드-cwe-259) `CWE-259`
> **repo 폴더**: `sd24_hcpasswd/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> "실행해서 값이 바뀌는지"로 하드코딩 여부를 증명하는 패턴을 쓴다 — 소스를 못 보는 상황에서도 **동작만으로 하드코딩을 의심할 수 있다**는 걸 체감한다.

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
- snprintf(out, out_size, "server=%s;user=%s;pw=%s", server, user, "asdf");   /* 상수 */
+ void db_connect_good(const char *server, const char *user, const char *passwd, ...)
+ snprintf(out, out_size, "server=%s;user=%s;pw=%s", server, user, passwd);   /* 인자로 전달 */
```

패스워드는 함수 인자나 외부 입력으로 전달받도록 설계하고 소스 상수로 두지 않는다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** DB 접속 문자열 조립 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** API 키를 헤더에 싣기 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 설정 파일에서 로드하는 버전으로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — DB 접속 문자열 조립

서버 주소, 사용자명, 패스워드로 DB 접속 문자열을 만든다.
- 패스워드는 절대 소스 코드에 상수로 있으면 안 된다.

**함수**

```c
void db_connect_bad(const char *server, const char *user, char *out, size_t out_size);
void db_connect_good(const char *server, const char *user, const char *passwd, char *out, size_t out_size);
```

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 어떤 서버·사용자로 호출해도 | **`pw=asdf` 로 고정** | 패스워드가 소스에 박혀 있어 절대 안 바뀐다 |

### 1-B. 변형 B — API 키를 헤더에 싣기

`Authorization: Bearer <key>` 헤더 문자열을 만드는 함수로 변형

### 1-C. 변형 C — 설정 파일에서 로드하는 버전으로 확장

`db_connect_good` 이 인자로 패스워드를 직접 받는 대신, "설정 파일 경로"를 받아 그 파일에서 읽어오는 형태(`load_password_from_file`)로 한 단계 더 발전시킨다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `db_connect_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void db_connect_bad(const char *server, const char *user, char *out, size_t out_size)
{
    /* 1. snprintf(out, out_size, "server=%s;user=%s;pw=%s", server, user, "asdf")
     *    ← 패스워드가 소스 상수 */
}

void db_connect_good(const char *server, const char *user, const char *passwd,
                     char *out, size_t out_size)
{
    /* [ ] 1. 매개변수에 passwd 를 **추가**한다
     *        (호출자·설정파일·시크릿 매니저가 책임진다) */

    /* [ ] 2. snprintf(out, out_size, "server=%s;user=%s;pw=%s", server, user, passwd) */
}
```

### 2-B. `db_connect_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void db_connect_good(const char *server, const char *user, const char *passwd,
                     char *out, size_t out_size)
{
    /* [ ] 1. 매개변수에 passwd 를 **추가**한다 */

    /* [ ] 2. snprintf(out, out_size, "server=%s;user=%s;pw=%s", server, user, passwd) */
}
```

### 2-C. `db_connect_good` — Level 3 (3회차, 백지)

```c
void db_connect_good(const char *server, const char *user, const char *passwd,
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 소스에 문자열 상수로 남기지 않는다
     *   - `snprintf` 의 헤더 (`<stdio.h>`)
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
sd24_hcpasswd/src/db_conn.h
sd24_hcpasswd/src/db_conn.c
sd24_hcpasswd/test/test.c
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
#include "db_conn.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char out[128];
    db_connect_bad("db1", "svc", out, sizeof(out));
    T_TRUE(strstr(out, "pw=asdf") != NULL,
        "Bad는 어떤 호출이든 하드코딩된 패스워드(asdf)를 그대로 써야 한다(취약점 재현)");
}

static void test_bad_cannot_be_changed(void)
{
    char out1[128], out2[128];
    db_connect_bad("db1", "svc", out1, sizeof(out1));
    db_connect_bad("db2", "svc", out2, sizeof(out2));
    T_TRUE(strstr(out1, "pw=asdf") != NULL && strstr(out2, "pw=asdf") != NULL,
        "Bad는 서버가 바뀌어도 패스워드를 절대 바꿀 수 없다(고칠 수 없는 백도어)");
}

static void test_good_uses_provided_password(void)
{
    char out[128];
    db_connect_good("db1", "svc", "s3cr3t!", out, sizeof(out));
    T_TRUE(strstr(out, "pw=s3cr3t!") != NULL, "Good은 전달받은 패스워드를 그대로 사용해야 한다");
}

static void test_good_changes_with_input(void)
{
    char out1[128], out2[128];
    db_connect_good("db1", "svc", "pw-one", out1, sizeof(out1));
    db_connect_good("db1", "svc", "pw-two", out2, sizeof(out2));
    T_TRUE(strcmp(out1, out2) != 0,
        "Good은 패스워드를 바꿔 부르면 결과도 달라져야 한다(교체 가능함을 증명)");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_cannot_be_changed();
    test_good_uses_provided_password();
    test_good_changes_with_input();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!TIP] "교체 가능함을 증명"하는 시험 패턴
> 이 계열(SD24~26)은 크래시가 없다.
> 대신 **같은 함수를 다른 값으로 두 번 불러서 결과가 달라지는지** 확인하는 것으로 "하드코딩되지 않았다"를 증명한다.
> Bad는 몇 번을 다르게 불러도 결과가 똑같아야 "재현 성공"이다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — API 키를 헤더에 싣기**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `Authorization: Bearer <key>` 헤더 조립 | 키가 상수 | 키를 인자로 받아 조립 |
| 키 `abc123` | 상수와 같은 값이 나온다 | 인자와 같은 값이 나온다 |

**변형 C — 설정 파일에서 로드하는 버전으로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 설정 파일 경로를 받아 읽는 `load_password` | 소스에 상수 | 파일의 값을 사용 |
| 없는 파일 | 상수로 접속 | 실패 반환 |

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
make D=sd24_hcpasswd V=main SRC="sd24_hcpasswd/src/db_conn.c sd24_hcpasswd/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd24_hcpasswd/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd24_hcpasswd/src/db_conn.c sd24_hcpasswd/test/test.c \
>     -pthread -o build/sd24_hcpasswd_main
> ./build/sd24_hcpasswd_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| Good에서도 기본값(`"default_pw"` 등)을 상수로 둠 | "기본값"이라는 이름표만 붙였을 뿐 여전히 하드코딩이다.<br>인자가 없으면 실패하도록 설계한다 |
| 두 번째 시험(`test_bad_cannot_be_changed`)을 생략 | 한 번만 호출해서는 "우연히 그 값이었다"와 "항상 그 값이다"를 구분할 수 없다.<br>서로 다른 조건으로 최소 두 번 호출해서 비교하는 게 이 계열 검증의 핵심이다 |
| `strstr` 대신 `strcmp` 로 전체 문자열을 비교 | 접속 문자열에 서버·사용자 정보가 함께 있어 완전 일치 비교가 깨지기 쉽다.<br>확인하려는 부분 문자열만 `strstr` 로 검사한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `db_conn.h` / `db_conn.c`
> **헤더 (`db_conn.h`)**
> ```c
> #ifndef DB_CONN_H
> #define DB_CONN_H
> #include <stddef.h>
> void db_connect_bad(const char *server, const char *user, char *out, size_t out_size);
> void db_connect_good(const char *server, const char *user, const char *passwd, char *out, size_t out_size);
> #endif
> ```
> **구현 (`db_conn.c`)**
> ```c
> #include <stdio.h>
> #include "db_conn.h"
>
> void db_connect_bad(const char *server, const char *user, char *out, size_t out_size)
> {
>     snprintf(out, out_size, "server=%s;user=%s;pw=%s", server, user, "asdf");
> }
>
> void db_connect_good(const char *server, const char *user, const char *passwd, char *out, size_t out_size)
> {
>     snprintf(out, out_size, "server=%s;user=%s;pw=%s", server, user, passwd);
> }
> ```
>
> **눈여겨볼 점**: 두 함수의 **매개변수 개수가 다르다**(4개 vs 5개).
> `passwd` 라는 매개변수 하나가 추가된 것이, 실무에서는 "이 값을 호출자(궁극적으로는 설정파일·시크릿 매니저)가 책임진다"는 계약으로 이어진다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD23. 최소 권한 적용 위배](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD23.%20최소%20권한%20적용%20위배%20—%20즉시%20권한%20복귀로%20치환.md)
- [다음: SD25. 하드코드된 사용자 계정](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD25.%20하드코드된%20사용자%20계정%20—%20계정명도%20외부%20전달로%20치환.md)
