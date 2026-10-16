---
title: "SD06. 디렉터리 경로 조작 — 절대경로 정규화 검증으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD06. 디렉터리 경로 조작 — 절대경로 정규화 검증으로 치환

> **원본 항목**: [Part 1-1. 삽입 계열 — 6. 디렉터리 경로 조작](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-1.%20삽입%28Injection%29%20계열.md#6-디렉터리-경로-조작-cwe-222336) `CWE-22/23/36`
> **repo 폴더**: `sd06_pathtraversal/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 20분 / 2회차 12분 / **3회차 8분**
> 이 드릴은 mock이 아니라 **실제 파일시스템**(임시 디렉토리)에서 진짜로 sandbox 밖 파일을 읽어낸다 — 여기 계열 중 가장 실감나는 재현이다.

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
- snprintf(out, out_size, "%s/%s", sandbox_root, rName);   /* 문자열 결합만, 정규화 없음 */
+ snprintf(joined, sizeof(joined), "%s/%s", sandbox_root, rName);
+ realpath(sandbox_root, real_sandbox);
+ realpath(joined, real_target);                            /* 절대경로로 정규화 */
+ if (접두어 비교 실패) return -1;                            /* sandbox 밖이면 거부 */
```

경로는 "문자열 조합 후"가 아니라 **"정규화(절대경로 변환) 후"** 검사한다.
`..` 문자열만 걸러내는 방식으로는 인코딩 우회를 못 막는다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 리포트 파일 조회 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 업로드 파일 삭제 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 심볼릭 링크가 섞인 sandbox | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 리포트 파일 조회

`sandbox_root` 디렉터리 안의 파일만 조회를 허용한다.
- 파일명(`rName`)은 사용자가 지정한다.
- `sandbox_root` 밖의 파일에는 어떤 경우에도 접근할 수 없어야 한다.
- 존재하지 않는 파일 요청은 실패로 처리한다.

**함수**

```c
char *resolve_report_path_bad(const char *sandbox_root, const char *rName, char *out, size_t out_size);
int resolve_report_path_good(const char *sandbox_root, const char *rName, char *out, size_t out_size);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `rName` | 외부(요청 파라미터) | 파일 열기 경로 |

#### 공격 입력표

| 입력(`rName`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `report1.txt` (정상) | sandbox 안의 파일 내용 | 정상 동작 |
| `../secret.txt` | **sandbox 밖 `secret.txt` 의 실제 내용을 읽어낸다** | 문자열을 그대로 이어붙여 상위 디렉터리로 빠져나간다 |

### 1-B. 변형 B — 업로드 파일 삭제

`unlink()` 로 sandbox 안의 업로드 파일을 지우는 기능.
"삭제"라서 Bad의 결과가 훨씬 치명적임을 체감

### 1-C. 변형 C — 심볼릭 링크가 섞인 sandbox

sandbox 안에 sandbox 밖을 가리키는 심볼릭 링크가 있을 때도 Good이 막는지 확인(`realpath` 는 심볼릭 링크까지 풀어서 정규화하므로 원래 막혀야 한다 — 직접 링크를 만들어 검증)

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `resolve_report_path_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
char *resolve_report_path_bad(const char *sandbox_root, const char *rName,
                              char *out, size_t out_size)
{
    /* 1. 길이만 확인하고 "%s/%s" 로 문자열을 이어 붙인다   ← 정규화 없음
     * 2. return out */
}

int resolve_report_path_good(const char *sandbox_root, const char *rName,
                             char *out, size_t out_size)
{
    /* [ ] 1. 지역변수
     *        joined[PATH_MAX], real_sandbox[PATH_MAX], real_target[PATH_MAX], sandbox_len */

    /* [ ] 2. 문자열 결합
     *        snprintf 결과 >= sizeof(joined) 이면 → return -1 */

    /* [ ] 3. 정규화
     *        realpath(sandbox_root, real_sandbox) 실패 → return -1
     *        realpath(joined, real_target)        실패 → return -1  (없는 파일도 여기서 걸린다) */

    /* [ ] 4. 접두어 비교
     *        sandbox_len = strlen(real_sandbox)
     *        strncmp(real_target, real_sandbox, sandbox_len) != 0 → return -1
     *        real_target[sandbox_len] 가 '/' 도 '\0' 도 아니면    → return -1  (형제 디렉터리 차단) */

    /* [ ] 5. out_size <= strlen(real_target) 이면 → return -1 */

    /* [ ] 6. snprintf(out, out_size, "%s", real_target) 후 return 0 */
}
```

### 2-B. `resolve_report_path_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int resolve_report_path_good(const char *sandbox_root, const char *rName,
                             char *out, size_t out_size)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. 문자열 결합 */

    /* [ ] 3. 정규화 */

    /* [ ] 4. 접두어 비교 */

    /* [ ] 5. out_size <= strlen(real_target) 이면 → return -1 */

    /* [ ] 6. snprintf(out, out_size, "%s", real_target) 후 return 0 */
}
```

### 2-C. `resolve_report_path_good` — Level 3 (3회차, 백지)

```c
int resolve_report_path_good(const char *sandbox_root, const char *rName,
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `realpath` 의 feature macro (`_DEFAULT_SOURCE`)
     *   - `PATH_MAX` 의 헤더 (`<limits.h>`)
     *   - 형제 디렉터리 `sandbox-evil` 케이스
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
sd06_pathtraversal/src/path_guard.h
sd06_pathtraversal/src/path_guard.c
sd06_pathtraversal/test/test.c
```

> [!IMPORTANT] 시험 구조는 고정이다 (SD01~SD58 공통)
> 1. **Bad 가 실제로 뚫린다.**
>    이 시험이 실패하면 Bad 를 잘못 옮겨 적은 것이다.
> 2. **Bad 도 정상 입력은 처리한다.**
> 3. **Good 이 같은 공격을 막는다.**
> 4. **Good 이 정상 입력까지 막지 않는다.** (과잉 차단 없음)

### 3-A. 변형 A 시험 — 이 형태를 고정한다

```c
#define _DEFAULT_SOURCE
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <unistd.h>
#include <limits.h>
#include "path_guard.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void write_file(const char *path, const char *content)
{
    FILE *f = fopen(path, "w");
    if (f) { fputs(content, f); fclose(f); }
}

static int read_file(const char *path, char *buf, size_t n)
{
    FILE *f = fopen(path, "r");
    size_t r;
    if (!f) return -1;
    r = fread(buf, 1, n - 1, f);
    buf[r] = '\0';
    fclose(f);
    return 0;
}

int main(void)
{
    char base[]    = "/tmp/sd06_XXXXXX";
    char sandbox[PATH_MAX], secret[PATH_MAX], report1[PATH_MAX + 16];
    char bad_path[PATH_MAX], good_path[PATH_MAX];
    char content[128];

    if (mkdtemp(base) == NULL) { perror("mkdtemp"); return 1; }
    snprintf(sandbox, sizeof(sandbox), "%s/sandbox", base);
    snprintf(secret,  sizeof(secret),  "%s/secret.txt", base);       /* sandbox 바깥 */
    snprintf(report1, sizeof(report1), "%s/report1.txt", sandbox);   /* sandbox 안 */

    mkdir(sandbox, 0700);
    write_file(secret,  "TOP-SECRET");
    write_file(report1, "public report");

    if (resolve_report_path_bad(sandbox, "../secret.txt", bad_path, sizeof(bad_path)) != NULL) {
        read_file(bad_path, content, sizeof(content));
        T_TRUE(strcmp(content, "TOP-SECRET") == 0,
            "Bad는 ../secret.txt 로 sandbox 밖 파일을 실제로 읽어내야 한다(취약점 재현)");
    } else {
        g_fail++; printf("  X Bad 경로 조합 자체가 실패함(테스트 설계 오류)\n");
    }

    if (resolve_report_path_bad(sandbox, "report1.txt", bad_path, sizeof(bad_path)) != NULL) {
        read_file(bad_path, content, sizeof(content));
        T_TRUE(strcmp(content, "public report") == 0, "Bad도 정상 파일은 읽어야 한다");
    }

    T_TRUE(resolve_report_path_good(sandbox, "../secret.txt", good_path, sizeof(good_path)) == -1,
        "Good은 sandbox 밖 경로를 거부해야 한다");

    if (resolve_report_path_good(sandbox, "report1.txt", good_path, sizeof(good_path)) == 0) {
        read_file(good_path, content, sizeof(content));
        T_TRUE(strcmp(content, "public report") == 0, "Good도 정상 파일은 읽어야 한다");
    } else {
        g_fail++; printf("  X Good이 정상 파일명까지 막아버림(과잉 차단)\n");
    }

    remove(secret); remove(report1); rmdir(sandbox); rmdir(base);

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 업로드 파일 삭제**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `../outside.txt` (삭제) | sandbox 밖 파일 삭제 | 거부 (-1), 파일 보존 |
| `up1.txt` | 삭제됨 | 삭제됨 |

**변형 C — 심볼릭 링크가 섞인 sandbox**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| sandbox 안의 심볼릭 링크 → 밖 | 링크를 따라 밖으로 나간다 | `realpath` 가 풀어서 거부 (-1) |
| 일반 파일 | 정상 | 정상 |

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
make D=sd06_pathtraversal V=main SRC="sd06_pathtraversal/src/path_guard.c sd06_pathtraversal/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd06_pathtraversal/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd06_pathtraversal/src/path_guard.c sd06_pathtraversal/test/test.c \
>     -pthread -o build/sd06_pathtraversal_main
> ./build/sd06_pathtraversal_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `..` 문자열만 `strstr` 로 검사하고 넘어감 | `%2e%2e%2f`(URL 인코딩)나 `....//` 같은 변형에 뚫린다.<br>반드시 **정규화 후** 비교해야 한다 |
| 접두어 비교만 하고 다음 문자를 안 봄 | `/tmp/sandbox` 와 `/tmp/sandbox2` 는 `strncmp` 접두어 비교로는 구분이 안 된다 — `sandbox2` 도 `sandbox` 로 시작하기 때문이다 |
| `realpath()` 반환값(`NULL`)을 확인 안 함 | 대상 파일이 없으면 `realpath` 가 실패한다.<br>이 실패를 "sandbox 안"으로 오판하면 안 된다 |
| `_DEFAULT_SOURCE` 를 빼먹고 빌드 에러로 몇 분을 허비 | 이 프로젝트 Makefile은 `-std=c11 -pedantic` 이라 POSIX 확장 함수가 기본적으로 숨어 있다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `path_guard.h` / `path_guard.c`
> **헤더 (`path_guard.h`)**
> ```c
> #ifndef PATH_GUARD_H
> #define PATH_GUARD_H
> #include <stddef.h>
> char *resolve_report_path_bad(const char *sandbox_root, const char *rName,
>                                char *out, size_t out_size);
> int resolve_report_path_good(const char *sandbox_root, const char *rName,
>                               char *out, size_t out_size);
> #endif
> ```
> **구현 (`path_guard.c`)**
> ```c
> #define _DEFAULT_SOURCE
> #include <stdio.h>
> #include <string.h>
> #include <stdlib.h>
> #include <limits.h>
> #include "path_guard.h"
>
> char *resolve_report_path_bad(const char *sandbox_root, const char *rName,
>                                char *out, size_t out_size)
> {
>     if (strlen(sandbox_root) + 1 + strlen(rName) + 1 > out_size) return NULL;
>     snprintf(out, out_size, "%s/%s", sandbox_root, rName);
>     return out;
> }
>
> int resolve_report_path_good(const char *sandbox_root, const char *rName,
>                               char *out, size_t out_size)
> {
>     char joined[PATH_MAX];
>     char real_sandbox[PATH_MAX];
>     char real_target[PATH_MAX];
>     size_t sandbox_len;
>
>     if (snprintf(joined, sizeof(joined), "%s/%s", sandbox_root, rName)
>         >= (int)sizeof(joined)) return -1;
>
>     if (realpath(sandbox_root, real_sandbox) == NULL) return -1;
>     if (realpath(joined, real_target) == NULL) return -1;
>
>     sandbox_len = strlen(real_sandbox);
>     if (strncmp(real_target, real_sandbox, sandbox_len) != 0 ||
>         (real_target[sandbox_len] != '/' && real_target[sandbox_len] != '\0')) {
>         return -1;
>     }
>
>     if (out_size <= strlen(real_target)) return -1;
>     snprintf(out, out_size, "%s", real_target);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `real_target[sandbox_len] != '/' && ... != '\0'` 이 한 줄이 이 드릴의 전부다.
> 정규화만 하고 이 검사를 빼먹으면 `/tmp/xxx/sandbox-evil` 같은 형제 디렉터리가 `sandbox` 접두어를 통과해버린다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD05. LDAP 삽입](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD05.%20LDAP%20삽입%20—%20영숫자%20화이트리스트로%20치환.md)
- [다음: SD07. LDAP 처리](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD07.%20LDAP%20처리%20—%20베이스%20DN%20상수%20고정으로%20치환.md)
