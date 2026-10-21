---
title: "SD03. 크로스사이트 스크립트(XSS) — 출력 직전 HTML 이스케이프로 치환"
description: "시큐어코딩 SD03 크로스사이트 스크립트 (CWE-79): 취약한 코드를 출력 직전 HTML 이스케이프 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD03. 크로스사이트 스크립트(XSS) — 출력 직전 HTML 이스케이프로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 3. 크로스사이트 스크립트(XSS)](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#3-크로스사이트-스크립트xss-cwe-79) `CWE-79`
> **repo 폴더**: `sd03_xss/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> mock 불필요 — "HTML을 만드는 함수"의 출력 문자열을 직접 검사한다.

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
- snprintf(out, out_size, "<FONT...>%s</FONT>", title);       /* 그대로 삽입 */
+ escape_html(title, escaped, sizeof(escaped));                /* < > & " 를 엔티티로 */
+ snprintf(out, out_size, "<FONT...>%s</FONT>", escaped);
```

**입력을 저장할 때가 아니라 화면에 그릴 때** 이스케이프한다는 원칙을 그대로 함수 경계로 옮긴다 — `render_*` 함수 안에서 처리한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 게시글 제목 렌더링 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 댓글 본문 렌더링 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 속성값 렌더링 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 게시글 제목 렌더링

게시글 제목 문자열을 `<FONT SIZE=+1><STRONG>...</STRONG></FONT>` HTML로 감싸 렌더링한다.
- `<`, `>`, `&`, `"` 네 문자는 각각 `&lt;`, `&gt;`, `&amp;`, `&quot;` 로 치환한다.
- 그 외 문자는 그대로 통과시킨다.

**함수**

```c
void render_title_bad(const char *title, char *out, size_t out_size);
void render_title_good(const char *title, char *out, size_t out_size);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `title` | 외부(게시글 작성 폼) | HTML 출력 스트림 |

#### 공격 입력표

| 입력 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `Hello World` (정상) | 그대로 출력 | 정상 동작 |
| `<script>alert(1)</script>` | **`<script>` 태그가 그대로 살아남는다** | 열람자 브라우저에서 스크립트가 실행된다 |

### 1-B. 변형 B — 댓글 본문 렌더링

개행문자(`\n`)를 `<br>` 로 바꿔야 하는 요구사항이 추가된다 — 이스케이프 순서(개행 치환을 먼저 할지, HTML 이스케이프를 먼저 할지)를 스스로 판단해본다

### 1-C. 변형 C — 속성값 렌더링

`<a href="%s">` 의 `href` 값을 이스케이프.
작은따옴표(`'`)도 이스케이프 대상에 추가해야 하는 이유를 확인

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `render_title_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void render_title_bad(const char *title, char *out, size_t out_size)
{
    /* 1. snprintf(out, out_size, "<FONT SIZE=+1><STRONG>%s</STRONG></FONT>", title)
     *    ← title 을 그대로 삽입 */
}

void render_title_good(const char *title, char *out, size_t out_size)
{
    /* [ ] 1. 지역변수
     *        char escaped[512] */

    /* [ ] 2. escape_html(in, out, out_size) 를 먼저 만든다
     *        in 을 한 글자씩 한 번만 훑는다
     *          '<' → "&lt;"    '>' → "&gt;"
     *          '&' → "&amp;"   '"' → "&quot;"
     *          그 외 → 그대로
     *        치환 문자열을 쓰기 전에 남은 공간을 확인한다 (j + rl >= out_size 이면 중단)
     *        끝에 '\0' */

    /* [ ] 3. escape_html(title, escaped, sizeof(escaped)) */

    /* [ ] 4. snprintf 로 HTML 조립 (title 대신 escaped) */
}
```

### 2-B. `render_title_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void render_title_good(const char *title, char *out, size_t out_size)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. escape_html(in, out, out_size) 를 먼저 만든다 */

    /* [ ] 3. escape_html(title, escaped, sizeof(escaped)) */

    /* [ ] 4. snprintf 로 HTML 조립 (title 대신 escaped) */
}
```

### 2-C. `render_title_good` — Level 3 (3회차, 백지)

```c
void render_title_good(const char *title, char *out, size_t out_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `switch` 로 글자별 치환 문자열 고르기
     *   - 치환 후 길이 = `strlen(rep)`
     *   - `&` 이중 치환 함정 (한 번만 훑는다)
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
sd03_xss/src/html_escape.h
sd03_xss/src/html_escape.c
sd03_xss/test/test.c
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
#include "html_escape.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char out[256];
    render_title_bad("<script>alert(1)</script>", out, sizeof(out));
    T_TRUE(strstr(out, "<script>") != NULL,
        "Bad는 <script> 태그가 그대로 출력에 살아있어야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    char out[256];
    render_title_bad("Hello World", out, sizeof(out));
    T_TRUE(strstr(out, "Hello World") != NULL, "정상 제목은 그대로 출력");
}

static void test_good_blocks_xss(void)
{
    char out[256];
    render_title_good("<script>alert(1)</script>", out, sizeof(out));
    T_TRUE(strstr(out, "<script>") == NULL, "Good은 <script> 태그가 남아있으면 안 된다");
    T_TRUE(strstr(out, "&lt;script&gt;") != NULL, "Good은 이스케이프된 형태로 남아야 한다");
}

static void test_good_normal(void)
{
    char out[256];
    render_title_good("Hello World", out, sizeof(out));
    T_TRUE(strstr(out, "Hello World") != NULL, "Good도 평범한 제목은 그대로 출력");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_xss();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 댓글 본문 렌더링**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `a\nb<script>` | `<script>` 가 그대로 실행됨 | `&lt;script&gt;` + 개행은 `<br>` |
| `hello` | 정상 출력 | 정상 출력 |

**변형 C — 속성값 렌더링**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `" onmouseover="x` | 속성이 깨지고 이벤트 삽입 | `&quot;` 로 치환 |
| `'` 작은따옴표 | 속성이 `'` 로 감싸질 때 탈출됨 | `&#39;` 로 치환 |

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
make D=sd03_xss V=main SRC="sd03_xss/src/html_escape.c sd03_xss/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd03_xss/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd03_xss/src/html_escape.c sd03_xss/test/test.c \
>     -pthread -o build/sd03_xss_main
> ./build/sd03_xss_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `&` 를 가장 나중에 치환 | `<` 를 `&lt;` 로 바꾼 뒤 `&` 를 다시 치환하면 `&lt;` 의 `&` 까지 `&amp;lt;` 로 이중 치환된다.<br>**`&` 를 가장 먼저** 치환해야 한다 |
| 이스케이프를 **저장 시점**에 함 | 요구사항에 따라 원문을 그대로 저장해야 하는 경우(수정 화면에 다시 보여줘야 할 때)가 있다.<br>이스케이프는 화면에 낼 때(렌더링 시점)가 원칙 |
| 치환 결과 버퍼 크기를 원본과 같게 잡음 | `<` 한 글자가 `&lt;` 네 글자가 된다 — 이스케이프 버퍼는 원본보다 넉넉해야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `html_escape.h` / `html_escape.c`
> **헤더 (`html_escape.h`)**
> ```c
> #ifndef HTML_ESCAPE_H
> #define HTML_ESCAPE_H
> #include <stddef.h>
> void render_title_bad(const char *title, char *out, size_t out_size);
> void render_title_good(const char *title, char *out, size_t out_size);
> #endif
> ```
> **구현 (`html_escape.c`)**
> ```c
> #include <stdio.h>
> #include <string.h>
> #include "html_escape.h"
>
> void render_title_bad(const char *title, char *out, size_t out_size)
> {
>     snprintf(out, out_size, "<FONT SIZE=+1><STRONG>%s</STRONG></FONT>", title);
> }
>
> static size_t escape_html(const char *in, char *out, size_t out_size)
> {
>     size_t i, j = 0;
>     for (i = 0; in[i] != '\0'; i++) {
>         const char *rep = NULL;
>         switch (in[i]) {
>             case '<':  rep = "&lt;";   break;
>             case '>':  rep = "&gt;";   break;
>             case '&':  rep = "&amp;";  break;
>             case '"':  rep = "&quot;"; break;
>             default: break;
>         }
>         if (rep != NULL) {
>             size_t rl = strlen(rep);
>             if (j + rl >= out_size) break;
>             memcpy(out + j, rep, rl);
>             j += rl;
>         } else {
>             if (j + 1 >= out_size) break;
>             out[j++] = in[i];
>         }
>     }
>     out[j] = '\0';
>     return j;
> }
>
> void render_title_good(const char *title, char *out, size_t out_size)
> {
>     char escaped[512];
>     escape_html(title, escaped, sizeof(escaped));
>     snprintf(out, out_size, "<FONT SIZE=+1><STRONG>%s</STRONG></FONT>", escaped);
> }
> ```
>
> **눈여겨볼 점**: `switch` 문의 case 순서가 아니라 **각 case가 독립적으로 처리되므로 순서 문제(이중 치환)가 애초에 생기지 않는다** — 원본 문자를 한 번만 훑으며 그 자리에서 바로 치환 문자열을 내보내기 때문이다.
> `str_replace` 를 반복 호출하는 방식으로 짰다면 `&` 이중 치환 함정에 빠지기 쉽다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD02. 자원 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD02.%20자원%20삽입%20—%20화이트리스트%20범위%20검사로%20치환.md)
- [다음: SD04. OS 명령어 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD04.%20OS%20명령어%20삽입%20—%20위험%20문자%20검사로%20치환.md)
