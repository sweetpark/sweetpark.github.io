---
title: "SD27. 주석문안에 포함된 주요정보 — 배포 전 자동 검사로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD27. 주석문안에 포함된 주요정보 — 배포 전 자동 검사로 치환

> **원본 항목**: [Part 2-2. 자격증명 관리 계열 — 8. 주석문안에 포함된 패스워드 등 시스템 주요정보](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-2.%20자격증명%20관리%20계열.md#8-주석문안에-포함된-패스워드-등-시스템-주요정보-cwe-615) `CWE-615`
> **repo 폴더**: `sd27_commentleak/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 2-2 마지막 드릴.
> 이번엔 Bad/Good이 "같은 기능의 두 구현"이 아니라 **"배포 전 검사기가 있는가 없는가"** 다 — 다른 각도의 치환 패턴을 익힌다.

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
- int release_ok_bad(const char *source_code) { (void)source_code; return 1; }  /* 검사 안 함 */
+ int release_ok_good(const char *source_code) {
+     return find_secret_in_comments(source_code) == 0;   /* 주석을 스캔해서 위험 키워드 검사 */
+ }
```

주석에 적어둔 패스워드·계정·키·접속 URL은 배포 전 반드시 제거한다 — 사람이 눈으로 확인하는 대신 **자동 검사(grep, 정적분석)** 로 강제한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 배포 파이프라인의 릴리스 게이트 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 한 줄 주석(`//`)도 검사 대상에 추가 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 키워드 목록을 파일에서 로드 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 배포 파이프라인의 릴리스 게이트

소스 코드 문자열을 입력받아, 블록 주석(`/* ... */`) 안에 `password`, `secret`, `apikey` 같은 위험 키워드가 있으면 배포를 막는다.
- 대소문자를 구분하지 않는다.

**함수**

```c
int find_secret_in_comments(const char *source_code);
int release_ok_bad(const char *source_code);
int release_ok_good(const char *source_code);
```

#### 공격 입력표

| 소스 코드 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 주석에 `default password is "abracadabra"` 포함 | **배포 승인(1)** | 검사 자체를 안 한다 |
| 정상 주석만 있음 | 배포 승인(1) | 위험 요소 없음 |

### 1-B. 변형 B — 한 줄 주석(`//`)도 검사 대상에 추가

C99/C++ 스타일 한 줄 주석까지 스캔하도록 `find_secret_in_comments` 를 확장

### 1-C. 변형 C — 키워드 목록을 파일에서 로드

하드코딩된 키워드 배열 대신, 팀이 관리하는 금지어 목록을 외부에서 주입받는 구조로 바꾼다(이 드릴 시리즈 전체를 관통하는 "화이트/블랙리스트는 외부화"의 마지막 반복)

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `release_ok_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int release_ok_bad(const char *source_code)
{
    /* 1. (void)source_code
     * 2. return 1   ← 검사 단계 자체가 없다 */
}

int release_ok_good(const char *source_code)
{
    /* [ ] 1. find_secret_in_comments(source_code) 를 먼저 만든다
     *        "/*" 부터 "*/" 까지 블록 주석을 하나씩 찾는다
     *        각 주석을 buf[512] 에 복사한다 (길이 상한, 널 종료)
     *        KEYWORDS 중 하나라도 strcasestr 로 찾으면 → return 1
     *        끝까지 없으면 → return 0
     *        KEYWORDS: password, passwd, secret, apikey, api_key */

    /* [ ] 2. return find_secret_in_comments(source_code) == 0 */
}
```

### 2-B. `release_ok_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int release_ok_good(const char *source_code)
{
    /* [ ] 1. find_secret_in_comments(source_code) 를 먼저 만든다 */

    /* [ ] 2. return find_secret_in_comments(source_code) == 0 */
}
```

### 2-C. `release_ok_good` — Level 3 (3회차, 백지)

```c
int release_ok_good(const char *source_code)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `strcasestr` 의 feature macro (`_DEFAULT_SOURCE`)
     *   - 닫히지 않은 주석 (`*/` 가 없을 때)
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
sd27_commentleak/src/release_check.h
sd27_commentleak/src/release_check.c
sd27_commentleak/test/test.c
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
#include "release_check.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static const char *g_leaky_source =
    "#include <stdio.h>\n"
    "/* default password is \"abracadabra\" */\n"
    "int verifyAuth(char *ipasswd) { return 0; }\n";

static const char *g_clean_source =
    "#include <stdio.h>\n"
    "/* verifies the user's credentials */\n"
    "int verifyAuth(char *ipasswd) { return 0; }\n";

static void test_bad_is_vulnerable(void)
{
    T_TRUE(release_ok_bad(g_leaky_source) == 1,
        "Bad는 주석에 패스워드가 있어도 배포를 그대로 승인해야 한다(취약점 재현)");
}

static void test_good_blocks_leak(void)
{
    T_TRUE(release_ok_good(g_leaky_source) == 0,
        "Good은 주석에 위험 키워드가 있으면 배포를 막아야 한다");
}

static void test_good_normal(void)
{
    T_TRUE(release_ok_good(g_clean_source) == 1,
        "Good은 위험 키워드가 없는 정상 소스는 배포를 승인해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_leak();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!WARNING] 헤더 파일 안에서 예시 주석을 쓸 때 주의
> `/* ... /* ... */ ... */` 처럼 **블록 주석을 중첩**해서 설명하면 `-Wcomment` 경고(이 프로젝트에서는 `-Werror` 로 에러)가 난다.
> 주석 예시를 문서화할 때는 `/*` 를 다시 쓰지 말고 "블록주석"처럼 말로 풀어 쓴다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 한 줄 주석(`//`)도 검사 대상에 추가**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `// password=...` 한 줄 주석 | 배포 통과 | `//` 도 스캔해서 차단 |
| 키워드 없는 주석 | 통과 | 통과 |

**변형 C — 키워드 목록을 파일에서 로드**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 외부에서 주입한 금지어 목록의 단어 | 검사하지 않음 | 목록 기준으로 차단 |
| 목록에 없는 단어 | 통과 | 통과 |

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
make D=sd27_commentleak V=main SRC="sd27_commentleak/src/release_check.c sd27_commentleak/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd27_commentleak/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd27_commentleak/src/release_check.c sd27_commentleak/test/test.c \
>     -pthread -o build/sd27_commentleak_main
> ./build/sd27_commentleak_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `strstr` (대소문자 구분)로 검사 | `Password`, `PASSWORD` 처럼 대문자가 섞이면 놓친다.<br>이 항목은 대소문자 무관이 요구사항이다 |
| 주석 구간을 못 찾고 소스 전체에서 키워드를 검색 | 함수 이름에 `password` 가 들어간 정상 코드(`verifyAuth`, `checkPassword` 등)까지 전부 걸려서 과잉 차단된다.<br>**주석 구간만** 잘라서 검사해야 한다 |
| `/* ` 뒤에 `*/` 가 없는 미종료 주석 처리 안 함 | 이 드릴의 파서는 `end` 가 `NULL` 이면 문자열 끝까지를 주석으로 간주해야 한다(모범답안의 `len = end ? ... : strlen(p)` 부분) |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `release_check.h` / `release_check.c`
> **헤더 (`release_check.h`)**
> ```c
> #ifndef RELEASE_CHECK_H
> #define RELEASE_CHECK_H
> int find_secret_in_comments(const char *source_code);
> int release_ok_bad(const char *source_code);
> int release_ok_good(const char *source_code);
> #endif
> ```
> **구현 (`release_check.c`)**
> ```c
> #define _DEFAULT_SOURCE
> #include <string.h>
> #include <stddef.h>
> #include "release_check.h"
>
> static const char *KEYWORDS[] = { "password", "passwd", "secret", "apikey", "api_key" };
> #define KEYWORD_COUNT (sizeof(KEYWORDS) / sizeof(KEYWORDS[0]))
>
> int find_secret_in_comments(const char *source_code)
> {
>     const char *p = source_code;
>     while ((p = strstr(p, "/*")) != NULL) {
>         const char *end = strstr(p, "*/");
>         size_t len = end ? (size_t)(end - p) : strlen(p);
>         size_t i;
>         char buf[512];
>         if (len >= sizeof(buf)) len = sizeof(buf) - 1;
>         memcpy(buf, p, len);
>         buf[len] = '\0';
>         for (i = 0; i < KEYWORD_COUNT; i++)
>             if (strcasestr(buf, KEYWORDS[i]) != NULL) return 1;
>         p = end ? end + 2 : p + 2;
>     }
>     return 0;
> }
>
> int release_ok_bad(const char *source_code) { (void)source_code; return 1; }
> int release_ok_good(const char *source_code) { return find_secret_in_comments(source_code) == 0; }
> ```
>
> **눈여겨볼 점**: `release_ok_bad` 는 `source_code` 를 **아예 읽지 않는다**(`(void)` 캐스팅으로 버림).
> 이 항목의 "취약점"은 잘못된 로직이 아니라 **검사 단계 자체의 부재**다 — SD09(외부 제어)에서 본 "단계 자체를 빠뜨리는" 패턴이 여기서도 반복된다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD26. 하드코드된 암호화 키](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD26.%20하드코드된%20암호화%20키%20—%20키%20저장소%20주입으로%20치환.md)
- Part 2-2 자격증명 관리 계열 4개 완료 — [다음: SD28. 취약한 암호화 알고리즘 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD28.%20취약한%20암호화%20알고리즘%20사용%20—%20식별자%20화이트리스트%20검증으로%20치환.md)
