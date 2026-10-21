---
title: "SD56. 작업 디렉터리 변경 없는 chroot Jail 생성 — chdir 동반으로 치환"
description: "시큐어코딩 SD56 작업 디렉터리 변경 없는 chroot Jail 생성 (CWE-243): 취약한 코드를 chdir 동반 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD56. 작업 디렉터리 변경 없는 chroot Jail 생성 — chdir 동반으로 치환

> **원본 항목**: [Part 7. API 오용 — 3. 작업 디렉터리 변경 없는 chroot Jail 생성](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%207.%20API%20오용.md#3-작업-디렉터리-변경-없는-chroot-jail-생성-cwe-243) `CWE-243`
> **repo 폴더**: `sd56_chrootjail/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> 실제 `chroot()`는 `CAP_SYS_CHROOT` 권한(보통 root)이 있어야 호출할 수 있어 일반 사용자 환경(WSL2 등)에서는 테스트가 실패한다.
> 이 드릴은 **실제 파일**을 놓고 "상대 경로 해석의 기준점(작업 디렉터리)이 어디인가"만 바꿔, `chroot()`+`chdir("/")` 짝의 효과를 권한 없이 재현한다.

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
  chroot("/var/ftproot");         /* 작업 디렉터리는 그대로 */
+ chdir("/");                     /* 새 루트 밑으로 변경 */
  fgets(filename, sizeof(filename), network);
  localfile = fopen(filename, "r");
```

`chroot()`는 절반의 격리다.
`chdir("/")`가 없으면 작업 디렉터리는 여전히 jail 밖 어딘가를 가리키고 있어, 상대 경로가 그 옛 위치를 기준으로 해석돼 jail 밖으로 빠져나간다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** FTP 서버의 파일 열기 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** `chroot`/`chdir` 반환값 검사 추가 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** root 권한이 있는 환경에서 실제 `chroot()` 검증 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — FTP 서버의 파일 열기

클라이언트가 지정한 파일명을 jail 디렉터리 안에서만 열어야 한다.
- jail 설정 이후 상대 경로로 jail 밖 파일에 접근할 수 없어야 한다.

**함수**

```c
int resolve_in_jail_bad(const char *stale_cwd, const char *user_path, char *out, size_t out_size);
int resolve_in_jail_good(const char *jail_root, const char *user_path, char *out, size_t out_size);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| 작업 디렉터리(상대 경로 해석 기준점) | `chroot()` 이후 남겨진(또는 새로 설정된) cwd | 클라이언트가 보낸 상대 경로(`filename`)를 그 기준점으로 풀어내는 지점 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `chroot()` 후 `chdir` 없이 상대 경로 `"etc_shadow_like"` 요청 | **jail 밖의 비밀 파일 내용을 그대로 읽어냄** | 작업 디렉터리가 여전히 jail 밖(`chroot` 이전 위치)이라, 상대 경로가 그 위치를 기준으로 풀린다 |
| 같은 상황(Good) | 같은 이름의 파일을 jail 밖에서 찾지 못해 실패 | `chdir("/")`로 작업 디렉터리 자체가 jail 루트로 옮겨져, 상대 경로의 기준점이 jail 안으로 바뀐다 |
| jail 안의 정상 파일 요청(Good) | 정상적으로 읽음 | jail 루트를 기준으로 한 상대 경로이므로 올바르게 해석된다 |

### 1-B. 변형 B — `chroot`/`chdir` 반환값 검사 추가

두 시스템 호출 모두 실패할 수 있다(권한 부족 등).
반환값을 검사해 실패 시 서비스를 시작하지 않도록 만든다(가이드 원문의 "반환값 검사 포함"을 직접 구현)

### 1-C. 변형 C — root 권한이 있는 환경에서 실제 `chroot()` 검증

`sudo`로 실행할 수 있다면, 실제 `chroot("/tmp/실습용jail")` + `chdir("/")`를 호출한 뒤 `fopen("../../etc/passwd", "r")`이 정말로 실패하는지 직접 확인해본다(이 노트의 자동화된 테스트와는 별개로, 진짜 커널 격리를 눈으로 보는 경험이다)

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `resolve_in_jail_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int resolve_in_jail_bad(const char *stale_cwd, const char *user_path,
                        char *out, size_t out_size)
{
    /* 1. snprintf(out, out_size, "%s/%s", stale_cwd, user_path)
     *    ← chdir("/") 를 안 해서 jail 밖의 옛 작업 디렉터리가 기준
     * 2. access(out, F_OK) == 0 이면 0, 아니면 -1 */
}

int resolve_in_jail_good(const char *jail_root, const char *user_path,
                         char *out, size_t out_size)
{
    /* [ ] 1. 기준점을 jail 루트로 확정한다
     *        (실제 코드에서는 chroot(...) 직후 chdir("/")) */

    /* [ ] 2. snprintf(out, out_size, "%s/%s", jail_root, user_path)
     *        잘렸으면 (>= out_size) → return -1 */

    /* [ ] 3. return access(out, F_OK) == 0 ? 0 : -1 */
}
```

### 2-B. `resolve_in_jail_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int resolve_in_jail_good(const char *jail_root, const char *user_path,
                         char *out, size_t out_size)
{
    /* [ ] 1. 기준점을 jail 루트로 확정한다 */

    /* [ ] 2. snprintf(out, out_size, "%s/%s", jail_root, user_path) */

    /* [ ] 3. return access(out, F_OK) == 0 ? 0 : -1 */
}
```

### 2-C. `resolve_in_jail_good` — Level 3 (3회차, 백지)

```c
int resolve_in_jail_good(const char *jail_root, const char *user_path,
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `chroot` 는 절반의 격리다 — `chdir("/")` 가 짝
     *   - 상대 경로가 **무엇을 기준으로** 풀리는가
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
sd56_chrootjail/src/chrootjail.h
sd56_chrootjail/src/chrootjail.c
sd56_chrootjail/test/test.c
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
#include <unistd.h>
#include <sys/stat.h>
#include <limits.h>
#include "chrootjail.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static char g_base[] = "/tmp/sd56_XXXXXX";
static char g_jail_root[PATH_MAX];
static char g_outside_secret[PATH_MAX];
static char g_inside_public[PATH_MAX + 16];

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

static void setup(void)
{
    if (mkdtemp(g_base) == NULL) { perror("mkdtemp"); exit(1); }
    snprintf(g_jail_root, sizeof(g_jail_root), "%s/ftproot", g_base);
    snprintf(g_outside_secret, sizeof(g_outside_secret), "%s/etc_shadow_like", g_base);
    snprintf(g_inside_public, sizeof(g_inside_public), "%s/public.txt", g_jail_root);

    mkdir(g_jail_root, 0700);
    write_file(g_outside_secret, "TOP-SECRET-SHADOW");
    write_file(g_inside_public, "public data");
}

static void teardown(void)
{
    unlink(g_outside_secret);
    unlink(g_inside_public);
    rmdir(g_jail_root);
    rmdir(g_base);
}

static void test_bad_escapes_jail(void)
{
    char out[PATH_MAX], content[128];
    T_TRUE(resolve_in_jail_bad(g_base, "etc_shadow_like", out, sizeof(out)) == 0,
        "Bad는 chdir(\"/\")을 안 해 여전히 jail 밖 작업 디렉터리를 기준으로 상대 경로를 찾아야 한다(취약점 재현)");
    read_file(out, content, sizeof(content));
    T_TRUE(strcmp(content, "TOP-SECRET-SHADOW") == 0,
        "그 결과 jail 밖의 비밀 파일 내용을 그대로 읽어낼 수 있어야 한다");
}

static void test_good_blocks_escape(void)
{
    char out[PATH_MAX];
    T_TRUE(resolve_in_jail_good(g_jail_root, "etc_shadow_like", out, sizeof(out)) == -1,
        "Good은 chdir(\"/\")로 기준점이 jail 루트 자신으로 바뀌어 같은 상대 경로로는 jail 밖 파일을 찾지 못해야 한다");
}

static void test_good_normal(void)
{
    char out[PATH_MAX], content[128];
    T_TRUE(resolve_in_jail_good(g_jail_root, "public.txt", out, sizeof(out)) == 0,
        "Good도 jail 안의 정상 파일은 그대로 찾아야 한다");
    read_file(out, content, sizeof(content));
    T_TRUE(strcmp(content, "public data") == 0, "jail 안 파일의 내용이 정확해야 한다");
}

int main(void)
{
    setup();
    test_bad_escapes_jail();
    test_good_blocks_escape();
    test_good_normal();
    teardown();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] 이 드릴이 진짜 `chroot()`를 부르지 않는 이유
> `chroot()`는 커널이 프로세스의 "/"가 무엇을 가리키는지 자체를 바꾸는 특권 연산이라 `CAP_SYS_CHROOT`(대개 root)가 필요하다.
> 일반 사용자로 돌리는 자동화 테스트가 매번 실패하면 드릴로서 의미가 없으므로, 이 노트는 "작업 디렉터리(상대 경로 해석 기준점)가 jail 안인가 밖인가"라는 **결과적으로 같은 문제**를 실제 파일로 재현한다.
> 진짜 커널 격리(`..`로도 절대 못 나가는 것)까지 확인하려면 변형 C처럼 `sudo` 환경에서 실제 `chroot()`를 직접 호출해봐야 한다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — `chroot`/`chdir` 반환값 검사 추가**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `chroot` / `chdir` 가 권한 부족으로 실패 | 실패를 무시하고 서비스 시작 | 반환값 검사 → 서비스 시작 안 함 |
| 권한 있음 | 정상 | 정상 |

**변형 C — root 권한이 있는 환경에서 실제 `chroot()` 검증**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| root 권한으로 실제 `chroot` + `chdir`, 그리고 `../` 로 열기 | jail 밖으로 빠져나간다 | jail 안에서만 열린다 |
| jail 안의 파일 | 열림 | 열림 |

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
make D=sd56_chrootjail V=main SRC="sd56_chrootjail/src/chrootjail.c sd56_chrootjail/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd56_chrootjail/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd56_chrootjail/src/chrootjail.c sd56_chrootjail/test/test.c \
>     -pthread -o build/sd56_chrootjail_main
> ./build/sd56_chrootjail_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `chdir("/")`를 `chroot()` **이전에** 호출 | 순서가 바뀌면 아무 효과가 없다.<br>`chroot()`로 새 루트를 지정한 **직후** 바로 `chdir("/")`를 호출해야, 그 "/"가 새 루트를 가리키는 상태에서 작업 디렉터리가 옮겨진다 |
| `chroot()`만 있으면 격리가 끝난다고 생각 | 이 항목 전체가 "chroot는 절반의 격리"라는 걸 보여준다.<br>jail이 완전하려면 chdir 짝, 반환값 검사, 파일 권한 최소화(변형 B, [SD21](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD21.%20중요한%20자원에%20대한%20잘못된%20권한허용%20—%20최소%20권한%20umask로%20치환.md))까지 함께 필요하다 |
| SD06(경로 조작)에서 배운 `realpath` 접두어 검사를 이 항목에도 그대로 적용하면 끝이라고 생각 | 이 항목의 핵심은 경로 문자열 검증이 아니라 **작업 디렉터리 자체의 위치**다.<br>`chdir("/")` 없이는 아무리 정교하게 문자열을 검증해도 기준점 자체가 jail 밖이라는 근본 문제가 남는다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `chrootjail.h` / `chrootjail.c`
> ```c
> #ifndef CHROOTJAIL_H
> #define CHROOTJAIL_H
> #include <stddef.h>
> int resolve_in_jail_bad(const char *stale_cwd, const char *user_path, char *out, size_t out_size);
> int resolve_in_jail_good(const char *jail_root, const char *user_path, char *out, size_t out_size);
> #endif
> ```
> ```c
> #include <stdio.h>
> #include <unistd.h>
> #include "chrootjail.h"
>
> int resolve_in_jail_bad(const char *stale_cwd, const char *user_path, char *out, size_t out_size)
> {
>     /* chroot() 이후에도 chdir("/")를 안 해서, 여전히 원래(jail 밖) 작업 디렉터리 기준으로 해석 */
>     if (snprintf(out, out_size, "%s/%s", stale_cwd, user_path) >= (int)out_size) return -1;
>     return access(out, F_OK) == 0 ? 0 : -1;
> }
>
> int resolve_in_jail_good(const char *jail_root, const char *user_path, char *out, size_t out_size)
> {
>     /* chroot() 직후 chdir("/")까지 해서, 새 루트 자신이 상대 경로의 기준점이 됨 */
>     if (snprintf(out, out_size, "%s/%s", jail_root, user_path) >= (int)out_size) return -1;
>     return access(out, F_OK) == 0 ? 0 : -1;
> }
> ```
>
> **눈여겨볼 점**: 두 함수는 `snprintf`의 첫 번째 인자(`stale_cwd` vs `jail_root`)만 다르다.
> 실제 `chroot()`+`chdir("/")` 짝이 하는 일도 본질적으로 이것과 같다 — **"상대 경로가 무엇을 기준으로 풀리는가"**를 jail 루트 자신으로 확정 짓는 것.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD55. 위험하다고 알려진 함수 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD55.%20위험하다고%20알려진%20함수%20사용%20—%20fork%20치환으로%20치환.md)
- [다음: SD57. 문자열 관리 오용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD57.%20오용%20문자열%20관리%20—%20크기%20인자%20동반과%20멀티바이트%20경계%20인식으로%20치환.md)
