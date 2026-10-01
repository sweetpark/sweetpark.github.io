---
title: "SD03. 크로스사이트 스크립트(XSS) — 출력 직전 HTML 이스케이프로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD03. 크로스사이트 스크립트(XSS) — 출력 직전 HTML 이스케이프로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 3. 크로스사이트 스크립트(XSS)](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#3-크로스사이트-스크립트xss-cwe-79) `CWE-79`
> **repo 폴더**: `sd03_xss/` (`make D=sd03_xss T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> mock 불필요 — "HTML을 만드는 함수"의 출력 문자열을 직접 검사한다.

---

## 0. 이 드릴로 체화할 것

```diff
- snprintf(out, out_size, "<FONT...>%s</FONT>", title);       /* 그대로 삽입 */
+ escape_html(title, escaped, sizeof(escaped));                /* < > & " 를 엔티티로 */
+ snprintf(out, out_size, "<FONT...>%s</FONT>", escaped);
```

**입력을 저장할 때가 아니라 화면에 그릴 때** 이스케이프한다는 원칙을 그대로 함수 경계로 옮긴다 — `render_*` 함수 안에서 처리한다.

---

## 1. 취약 시나리오 — 변형 A: 게시글 제목 렌더링

> [!QUOTE] 요구사항서 (발췌)
> 게시글 제목 문자열을 `<FONT SIZE=+1><STRONG>...</STRONG></FONT>` HTML로 감싸 렌더링한다.
> - `<`, `>`, `&`, `"` 네 문자는 각각 `&lt;`, `&gt;`, `&amp;`, `&quot;` 로 치환한다.
> - 그 외 문자는 그대로 통과시킨다.

### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `title` | 외부(게시글 작성 폼) | HTML 출력 스트림 |

### 공격 입력표

| 입력 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `Hello World` (정상) | 그대로 출력 | 정상 동작 |
| `<script>alert(1)</script>` | **`<script>` 태그가 그대로 살아남는다** | 열람자 브라우저에서 스크립트가 실행된다 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 게시글 제목 렌더링 | 위 내용 |
| **B (2회차)** | **댓글 본문 렌더링** | 개행문자(`\n`)를 `<br>` 로 바꿔야 하는 요구사항이 추가된다 — 이스케이프 순서(개행 치환을 먼저 할지, HTML 이스케이프를 먼저 할지)를 스스로 판단해본다 |
| **C (3회차)** | **속성값 렌더링** | `<a href="%s">` 의 `href` 값을 이스케이프. 작은따옴표(`'`)도 이스케이프 대상에 추가해야 하는 이유를 확인 |

---

## 2. 제출물

```text
sd03_xss/src/html_escape.h
sd03_xss/src/html_escape.c
sd03_xss/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

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

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 — Bad가 실제로 뚫린다 | 20 | ☐ |
| `test_good_blocks_xss` 통과 — 태그가 이스케이프된다 | 25 | ☐ |
| `test_good_normal` 통과 — 평범한 텍스트는 안 바뀐다 | 15 | ☐ |
| `<`,`>`,`&`,`"` **네 문자 전부** 이스케이프한다 | 25 | ☐ |
| 버퍼 경계(`out_size`)를 넘지 않는다(자르더라도 크래시 없음) | 10 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `&` 를 가장 나중에 치환 | `<` 를 `&lt;` 로 바꾼 뒤 `&` 를 다시 치환하면 `&lt;` 의 `&` 까지 `&amp;lt;` 로 이중 치환된다. **`&` 를 가장 먼저** 치환해야 한다 |
| 이스케이프를 **저장 시점**에 함 | 요구사항에 따라 원문을 그대로 저장해야 하는 경우(수정 화면에 다시 보여줘야 할 때)가 있다. 이스케이프는 화면에 낼 때(렌더링 시점)가 원칙 |
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
> **눈여겨볼 점**: `switch` 문의 case 순서가 아니라 **각 case가 독립적으로 처리되므로 순서 문제(이중 치환)가 애초에 생기지 않는다** — 원본 문자를 한 번만 훑으며 그 자리에서 바로 치환 문자열을 내보내기 때문이다. `str_replace` 를 반복 호출하는 방식으로 짰다면 `&` 이중 치환 함정에 빠지기 쉽다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (제목) |  |  |  |
| 2 |  | B (댓글, 개행) |  |  |  |
| 3 |  | C (속성값) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD02. 자원 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD02.%20자원%20삽입%20—%20화이트리스트%20범위%20검사로%20치환.md)
- [다음: SD04. OS 명령어 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD04.%20OS%20명령어%20삽입%20—%20위험%20문자%20검사로%20치환.md)
