---
title: "SD27. 주석문안에 포함된 주요정보 — 배포 전 자동 검사로 치환"
tags: 
created: 2026-09-28
modified: 2026-09-28
---

# SD27. 주석문안에 포함된 주요정보 — 배포 전 자동 검사로 치환

> **원본 항목**: [Part 2-2. 자격증명 관리 계열 — 8. 주석문안에 포함된 패스워드 등 시스템 주요정보](개발%20%28CS%29/언어/C언어/시큐어코딩가이드/Part%202.%20보안기능/[시큐어코딩]%202-2.%20자격증명%20관리%20계열.md#8-주석문안에-포함된-패스워드-등-시스템-주요정보-cwe-615) `CWE-615`
> **repo 폴더**: `sd27_commentleak/` (`make D=sd27_commentleak T=main`)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 2-2 마지막 드릴. 이번엔 Bad/Good이 "같은 기능의 두 구현"이 아니라 **"배포 전 검사기가 있는가 없는가"** 다 — 다른 각도의 치환 패턴을 익힌다.

---

## 0. 이 드릴로 체화할 것

```diff
- int release_ok_bad(const char *source_code) { (void)source_code; return 1; }  /* 검사 안 함 */
+ int release_ok_good(const char *source_code) {
+     return find_secret_in_comments(source_code) == 0;   /* 주석을 스캔해서 위험 키워드 검사 */
+ }
```

주석에 적어둔 패스워드·계정·키·접속 URL은 배포 전 반드시 제거한다 — 사람이 눈으로 확인하는 대신 **자동 검사(grep, 정적분석)** 로 강제한다.

---

## 1. 취약 시나리오 — 변형 A: 배포 파이프라인의 릴리스 게이트

> [!QUOTE] 요구사항서 (발췌)
> 소스 코드 문자열을 입력받아, 블록 주석(`/* ... */`) 안에 `password`, `secret`, `apikey` 같은 위험 키워드가 있으면 배포를 막는다.
> - 대소문자를 구분하지 않는다.

### 공격 입력표

| 소스 코드 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 주석에 `default password is "abracadabra"` 포함 | **배포 승인(1)** | 검사 자체를 안 한다 |
| 정상 주석만 있음 | 배포 승인(1) | 위험 요소 없음 |

### 회차별 변형

| 회차 | 변형 | 요구사항 |
| :--- | :--- | :--- |
| **A (1회차)** | 블록 주석(`/* */`) 검사 | 위 내용 |
| **B (2회차)** | **한 줄 주석(`//`)도 검사 대상에 추가** | C99/C++ 스타일 한 줄 주석까지 스캔하도록 `find_secret_in_comments` 를 확장 |
| **C (3회차)** | **키워드 목록을 파일에서 로드** | 하드코딩된 키워드 배열 대신, 팀이 관리하는 금지어 목록을 외부에서 주입받는 구조로 바꾼다(이 드릴 시리즈 전체를 관통하는 "화이트/블랙리스트는 외부화"의 마지막 반복) |

---

## 2. 제출물

```text
sd27_commentleak/src/release_check.h
sd27_commentleak/src/release_check.c
sd27_commentleak/test/test.c
```

### 시험 코드 — 이 형태를 고정한다

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
> `/* ... /* ... */ ... */` 처럼 **블록 주석을 중첩**해서 설명하면 `-Wcomment` 경고(이 프로젝트에서는 `-Werror` 로 에러)가 난다. 주석 예시를 문서화할 때는 `/*` 를 다시 쓰지 말고 "블록주석"처럼 말로 풀어 쓴다.

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `test_bad_is_vulnerable` 통과 | 25 | ☐ |
| `test_good_blocks_leak` 통과 | 35 | ☐ |
| `test_good_normal` 통과(정상 주석은 통과, 과잉 차단 없음) | 25 | ☐ |
| 대소문자 무관 검사(`strcasestr`)를 사용했다 | 10 | ☐ |
| 목표 시간 내 | 5 | ☐ |

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `strstr` (대소문자 구분)로 검사 | `Password`, `PASSWORD` 처럼 대문자가 섞이면 놓친다. 이 항목은 대소문자 무관이 요구사항이다 |
| 주석 구간을 못 찾고 소스 전체에서 키워드를 검색 | 함수 이름에 `password` 가 들어간 정상 코드(`verifyAuth`, `checkPassword` 등)까지 전부 걸려서 과잉 차단된다. **주석 구간만** 잘라서 검사해야 한다 |
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
> **눈여겨볼 점**: `release_ok_bad` 는 `source_code` 를 **아예 읽지 않는다**(`(void)` 캐스팅으로 버림). 이 항목의 "취약점"은 잘못된 로직이 아니라 **검사 단계 자체의 부재**다 — SD09(외부 제어)에서 본 "단계 자체를 빠뜨리는" 패턴이 여기서도 반복된다.

---

## 6. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A (블록 주석) |  |  |  |
| 2 |  | B (한 줄 주석) |  |  |  |
| 3 |  | C (외부 키워드 목록) |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD26. 하드코드된 암호화 키](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD26.%20하드코드된%20암호화%20키%20—%20키%20저장소%20주입으로%20치환.md)
- Part 2-2 자격증명 관리 계열 4개 완료 — [다음: SD28. 취약한 암호화 알고리즘 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/[SD]%20SD28.%20취약한%20암호화%20알고리즘%20사용%20—%20식별자%20화이트리스트%20검증으로%20치환.md)
