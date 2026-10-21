---
title: "SD21. 중요한 자원에 대한 잘못된 권한허용 — 최소 권한 umask로 치환"
description: "시큐어코딩 SD21 중요한 자원에 대한 잘못된 권한허용 (CWE-732): 취약한 코드를 최소 권한 umask 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD21. 중요한 자원에 대한 잘못된 권한허용 — 최소 권한 umask로 치환

> **원본 항목**: [Part 2-1. 인가·권한 계열 — 2. 중요한 자원에 대한 잘못된 권한허용](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-1.%20인가·권한%20계열.md#2-중요한-자원에-대한-잘못된-권한허용-cwe-732) `CWE-732`
> **repo 폴더**: `sd21_umask/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> mock 없이 **실제 파일**을 만들고 `stat()` 으로 진짜 권한 비트를 확인한다 — 이 계열에서 몇 안 되게 "파일시스템에 직접 흔적을 남기는" 드릴이다.

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
- umask(0);                                  /* 모두 읽고 쓰기 허용 */
+ umask(077);                                /* 소유자만 */
  int fd = open(path, O_WRONLY|O_CREAT|O_TRUNC, 0666);
```

`umask(0)` 은 "누구나 읽고 쓰라"는 선언이다.
파일 권한은 항상 최소 권한(`077`)으로 시작한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 설정 파일 생성 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 디렉터리 생성 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 이미 존재하는 파일의 권한 강화 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 설정 파일 생성

설정 파일을 생성할 때 파일 권한을 설정한다.
- 소유자만 읽고 쓸 수 있어야 한다(`0600`).

**함수**

```c
int create_file_bad(const char *path);
int create_file_good(const char *path);
```

#### 공격 입력표

| umask 설정 | 실제 생성 권한(`open(..., 0666)` 기준) | 위험 |
| :--- | :--- | :--- |
| `umask(0)` | **`0666`(rw-rw-rw-)** | 같은 시스템의 다른 계정이나 침투한 저권한 프로세스가 읽고 쓸 수 있다 |
| `umask(077)` | `0600`(rw-------) | 소유자만 접근 가능 |

### 1-B. 변형 B — 디렉터리 생성

`mkdir()` 에도 같은 원리가 적용된다 — 디렉터리는 실행 비트(`x`)가 있어야 그 안에 들어갈 수 있다는 점까지 고려해 권한 값을 정한다

### 1-C. 변형 C — 이미 존재하는 파일의 권한 강화

새로 만들 때뿐 아니라, 이미 잘못된 권한으로 존재하는 파일을 `chmod()` 로 사후에 교정하는 함수를 추가로 짜본다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `create_file_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int create_file_bad(const char *path)
{
    /* 1. old = umask(0)   ← 모두 허용
     * 2. fd = open(path, O_WRONLY|O_CREAT|O_TRUNC, 0666)
     * 3. umask(old)
     * 4. 실패면 -1, 성공이면 close 후 get_file_mode(path) */
}

int create_file_good(const char *path)
{
    /* [ ] 1. 이전 umask 를 저장하고 최소 권한으로 바꾼다
     *        mode_t old = umask(077) */

    /* [ ] 2. fd = open(path, O_WRONLY|O_CREAT|O_TRUNC, 0666)
     *        mode 인자는 Bad 와 똑같다 (실제 권한 = mode & ~umask) */

    /* [ ] 3. umask(old)   ← 즉시 복원 */

    /* [ ] 4. fd < 0 이면 → return -1 */

    /* [ ] 5. close(fd) */

    /* [ ] 6. return get_file_mode(path)
     *        stat 의 st_mode & 0777, 실패면 -1 */
}
```

### 2-B. `create_file_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int create_file_good(const char *path)
{
    /* [ ] 1. 이전 umask 를 저장하고 최소 권한으로 바꾼다 */

    /* [ ] 2. fd = open(path, O_WRONLY|O_CREAT|O_TRUNC, 0666) */

    /* [ ] 3. umask(old)   ← 즉시 복원 */

    /* [ ] 4. fd < 0 이면 → return -1 */

    /* [ ] 5. close(fd) */

    /* [ ] 6. return get_file_mode(path) */
}
```

### 2-C. `create_file_good` — Level 3 (3회차, 백지)

```c
int create_file_good(const char *path)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 최종 권한 = `mode & ~umask`
     *   - `umask` 의 반환값은 이전 값이다
     *   - `stat` / `open` 의 헤더 (`<sys/stat.h>`, `<fcntl.h>`)
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
sd21_umask/src/file_perm.h
sd21_umask/src/file_perm.c
sd21_umask/test/test.c
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
#include <unistd.h>
#include "file_perm.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    int mode = create_file_bad("/tmp/sd21_bad.txt");
    T_TRUE(mode == 0666, "Bad는 소유자 외에도 읽고 쓸 수 있는 권한(0666)으로 생성해야 한다(취약점 재현)");
    unlink("/tmp/sd21_bad.txt");
}

static void test_good_blocks_wide_perm(void)
{
    int mode = create_file_good("/tmp/sd21_good.txt");
    T_TRUE(mode == 0600, "Good은 소유자만 읽고 쓸 수 있는 권한(0600)으로 생성해야 한다");
    unlink("/tmp/sd21_good.txt");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_wide_perm();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!WARNING] 반드시 `/tmp` 안에서 테스트할 것(WSL2 사용자)
> `/mnt/c/...`(윈도우 드라이브 마운트)는 9p 파일시스템이라 유닉스 권한 비트가 온전히 반영되지 않을 수 있다.
> 이 드릴은 **WSL 네이티브 경로(`/tmp`, 또는 `~`)** 에서 파일을 만들어야 `stat()` 결과가 정확하다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 디렉터리 생성**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `mkdir(path, 0777)` 후 모드 조회 | `0777` | `0700` |
| `x` 비트 확인 | 있음 | 소유자만 있음 |

**변형 C — 이미 존재하는 파일의 권한 강화**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 이미 `0666` 인 파일에 교정 함수 | 그대로 `0666` | `chmod` 로 `0600` |
| 없는 파일 | -1 | -1 |

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
make D=sd21_umask V=main SRC="sd21_umask/src/file_perm.c sd21_umask/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd21_umask/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd21_umask/src/file_perm.c sd21_umask/test/test.c \
>     -pthread -o build/sd21_umask_main
> ./build/sd21_umask_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `umask()` 호출 후 원래 값으로 되돌리지 않음 | `umask` 는 **프로세스 전역 상태**다.<br>한 번 바꾸면 이후 다른 파일 생성에도 계속 영향을 준다.<br>함수 안에서 바꿨다면 함수 안에서 반드시 복원한다 |
| `open()` 의 `mode` 인자를 `0600` 으로 미리 낮춰놓고 `umask` 효과를 확인 안 함 | 이 드릴의 핵심은 "umask가 최종 권한을 어떻게 깎아내는지"다.<br>`mode` 인자는 항상 넉넉하게(`0666`) 주고 umask로 실제 결과가 달라지는 걸 관찰해야 의미가 있다 |
| WSL의 `/mnt/c` 경로에서 테스트해서 권한이 항상 이상하게 나옴 | 위 경고 참고 — 네이티브 리눅스 파일시스템에서 테스트한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `file_perm.h` / `file_perm.c`
> **헤더 (`file_perm.h`)**
> ```c
> #ifndef FILE_PERM_H
> #define FILE_PERM_H
> int create_file_bad(const char *path);
> int create_file_good(const char *path);
> #endif
> ```
> **구현 (`file_perm.c`)**
> ```c
> #include <sys/types.h>
> #include <sys/stat.h>
> #include <fcntl.h>
> #include <unistd.h>
> #include "file_perm.h"
>
> static int get_file_mode(const char *path)
> {
>     struct stat st;
>     if (stat(path, &st) != 0) return -1;
>     return (int)(st.st_mode & 0777);
> }
>
> int create_file_bad(const char *path)
> {
>     mode_t old = umask(0);
>     int fd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0666);
>     umask(old);
>     if (fd < 0) return -1;
>     close(fd);
>     return get_file_mode(path);
> }
>
> int create_file_good(const char *path)
> {
>     mode_t old = umask(077);
>     int fd = open(path, O_WRONLY | O_CREAT | O_TRUNC, 0666);
>     umask(old);
>     if (fd < 0) return -1;
>     close(fd);
>     return get_file_mode(path);
> }
> ```
>
> **눈여겨볼 점**: `open()` 에 넘긴 `mode` 인자(`0666`)는 **양쪽 함수가 완전히 동일**하다.
> 실제 파일 권한을 가른 것은 오직 그 앞에 있었던 `umask()` 한 줄뿐이다 — 최종 권한은 `mode & ~umask` 로 계산된다는 사실이 이 드릴의 전부다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD20. 부적절한 인가](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD20.%20부적절한%20인가%20—%20세션%20식별자%20대조로%20치환.md)
- [다음: SD22. 잘못된 권한 부여](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD22.%20잘못된%20권한%20부여%20—%20그룹별%20UID%20테이블로%20치환.md)
