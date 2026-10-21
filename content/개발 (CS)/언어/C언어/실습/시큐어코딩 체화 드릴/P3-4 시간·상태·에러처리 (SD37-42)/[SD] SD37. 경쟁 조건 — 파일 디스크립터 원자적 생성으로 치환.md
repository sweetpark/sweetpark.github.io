---
title: "SD37. 경쟁 조건 — 파일 디스크립터 원자적 생성으로 치환"
description: "시큐어코딩 SD37 경쟁 조건 (CWE-367): 취약한 코드를 파일 디스크립터 원자적 생성 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD37. 경쟁 조건: 검사시점과 사용시점(TOCTOU) — 파일 디스크립터 원자적 생성으로 치환

> **원본 항목**: [Part 3. 시간 및 상태 — 1. 경쟁 조건: 검사시점과 사용시점(TOCTOU)](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%203.%20시간%20및%20상태.md#1-경쟁-조건-검사시점과-사용시점toctou-cwe-367) `CWE-367`
> **repo 폴더**: `sd37_toctou/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 3의 첫 드릴이자 이 계열은 실제 타이밍 경쟁(멀티스레드 레이스)을 재현하지 않는다 — 대신 **"이름이 검사 시점 이후 다른 대상을 가리키면 어떻게 되는가"**를 심볼릭 링크로 결정론적으로 재현한다.
> 실제 공격도 결국 이 구조를 이용한다.

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
- if (!access(file, W_OK))              /* 검사 시점(TOC) — "이름"으로 검사 */
-     f = fopen(file, "w+");             /* 사용 시점(TOU) — 같은 "이름"을 다시 연다 */
+ int fd = open(file_name, O_WRONLY|O_CREAT|O_EXCL, S_IRWXU);  /* 생성과 검사가 한 시스템 콜 안에서 원자적 */
+ if (fd == -1) { /* 이미 존재하면(심볼릭 링크 포함) 무조건 실패 */ }
```

이름으로 검사하고 이름으로 다시 여는 것 자체가 결함이다.
그 사이에 이름이 가리키는 대상이 바뀔 수 있기 때문이다.
`O_CREAT|O_EXCL`은 "이미 뭔가 있으면 절대 열지 않는다"를 커널이 원자적으로 보장한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 업로드 임시 파일 생성 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 잔액 차감 로직으로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 디렉터리 재귀 탐색 중 심볼릭 링크 차단 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 업로드 임시 파일 생성

사용자별 업로드 임시 파일을 생성해 내용을 기록한다.
- 같은 이름의 파일(또는 링크)이 이미 있으면 절대 덮어써서는 안 된다.
- "새로 만드는 것"과 "그것이 진짜 새 파일인지 확인하는 것"은 분리되어서는 안 된다.

**함수**

```c
int file_operation_bad(const char *path, const char *content);
int file_operation_good(const char *path, const char *content);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `path` (파일 이름) | 호출자가 넘긴 경로 | `access()` 로 검사한 뒤 `fopen()` 이 다시 해석하는 대상 — 그 사이 이름의 실체가 바뀌어도 알 방법이 없다 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 검사 시점에는 정상 파일을 가리키던 이름이, 사용 시점에는 다른 파일(심볼릭 링크)을 가리킴 | **링크가 가리키는 대상이 그대로 덮어써진다** | `access()`가 "쓰기 가능"을 확인한 건 이름일 뿐, `fopen()`이 실제로 여는 순간 그 이름이 무엇을 가리키는지는 다시 확인하지 않는다 |
| 같은 상황(Good) | **생성 자체가 실패**(`EEXIST`) | `O_CREAT\ | O_EXCL`은 그 이름에 이미 뭔가(파일이든 링크든) 있으면 절대 열지 않는다 |

### 1-B. 변형 B — 잔액 차감 로직으로 변형

"SELECT로 잔액 확인 후 UPDATE" 패턴을 흉내내는 두 카운터 함수를 만들어, 확인과 갱신 사이에 값이 바뀌면 잔액이 음수가 될 수 있음을 구조로 보여준다(가이드 보충 설명의 ③ 업무 로직 경쟁)

### 1-C. 변형 C — 디렉터리 재귀 탐색 중 심볼릭 링크 차단

`lstat()`으로 대상이 심볼릭 링크인지 먼저 확인하고, 링크면 따라가지 않고 건너뛰는 탐색 함수로 변형

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `file_operation_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int file_operation_bad(const char *path, const char *content)
{
    /* 1. access(path, W_OK) != 0 이면 return -1     ← 검사 시점(TOC)
     * 2. f = fopen(path, "w+")                       ← 사용 시점(TOU), 같은 "이름" 을 다시 연다
     * 3. fputs(content, f), fclose(f), return 0 */
}

int file_operation_good(const char *path, const char *content)
{
    /* [ ] 1. 생성과 존재 확인을 **한 번에**
     *        fd = open(path, O_WRONLY | O_CREAT | O_EXCL, S_IRUSR | S_IWUSR)
     *        fd == -1 이면 → return -1   (이미 있으면 심볼릭 링크여도 무조건 실패) */

    /* [ ] 2. fchmod(fd, S_IRUSR | S_IWUSR)
     *        실패 → close(fd), return -1 */

    /* [ ] 3. f = fdopen(fd, "w")
     *        실패 → close(fd), return -1 */

    /* [ ] 4. fputs(content, f), fclose(f) */

    /* [ ] 5. return 0 */
}
```

### 2-B. `file_operation_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int file_operation_good(const char *path, const char *content)
{
    /* [ ] 1. 생성과 존재 확인을 **한 번에** */

    /* [ ] 2. fchmod(fd, S_IRUSR | S_IWUSR) */

    /* [ ] 3. f = fdopen(fd, "w") */

    /* [ ] 4. fputs(content, f), fclose(f) */

    /* [ ] 5. return 0 */
}
```

### 2-C. `file_operation_good` — Level 3 (3회차, 백지)

```c
int file_operation_good(const char *path, const char *content)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `O_EXCL` 은 `O_CREAT` 와 같이 쓴다
     *   - `fdopen` 이 실패하면 fd 는 호출자가 닫는다
     *   - 검사 로직을 강화하는 게 아니라 **틈을 없앤다**
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
sd37_toctou/src/toctou.h
sd37_toctou/src/toctou.c
sd37_toctou/test/test.c
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
#include <limits.h>
#include "toctou.h"

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
    char base[] = "/tmp/sd37_XXXXXX";
    char target[PATH_MAX], link[PATH_MAX], fresh[PATH_MAX];
    char content[128];

    if (mkdtemp(base) == NULL) { perror("mkdtemp"); return 1; }
    snprintf(target, sizeof(target), "%s/victim_target", base);
    snprintf(link,   sizeof(link),   "%s/toctou_link", base);
    snprintf(fresh,  sizeof(fresh),  "%s/fresh_report", base);

    write_file(target, "ORIGINAL");
    symlink(target, link);   /* 검사 시점에는 정상 파일을 가리키던 이름 */

    T_TRUE(file_operation_bad(link, "HACKED") == 0, "Bad는 심볼릭 링크를 따라 정상적으로 '성공'해야 한다");
    read_file(target, content, sizeof(content));
    T_TRUE(strcmp(content, "HACKED") == 0,
        "Bad는 이름만 보고 fopen 했으므로, 링크 뒤에 있던 victim_target이 그대로 덮어써져야 한다(취약점 재현)");

    write_file(target, "ORIGINAL");   /* 다음 검증을 위해 복원 */

    T_TRUE(file_operation_good(link, "HACKED2") == -1,
        "Good은 O_CREAT|O_EXCL이므로 이미 존재하는 이름(심볼릭 링크 포함)에는 실패해야 한다");
    read_file(target, content, sizeof(content));
    T_TRUE(strcmp(content, "ORIGINAL") == 0,
        "Good이 거부했다면 victim_target 내용은 전혀 바뀌지 않아야 한다");

    T_TRUE(file_operation_good(fresh, "FRESH") == 0, "Good은 완전히 새 경로에는 정상적으로 성공해야 한다");
    read_file(fresh, content, sizeof(content));
    T_TRUE(strcmp(content, "FRESH") == 0, "새로 만든 파일에는 내용이 정확히 써져야 한다");

    unlink(link); unlink(target); unlink(fresh); rmdir(base);

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] 이 테스트가 "진짜 레이스"가 아닌 이유
> 실제 TOCTOU 공격은 검사와 사용 사이의 아주 좁은 시간창을 노려 이름의 실체를 바꿔치기한다(타이밍 의존적).
> 이 드릴은 그 시간창을 인위적으로 넓혀서 — 애초에 심볼릭 링크를 미리 걸어두고 — **"이름 기반 재해석이 실제로 무엇을 따라가는가"**라는 구조적 결함만 결정론적으로 재현한다.
> 실전에서는 이 구조 위에 타이밍이 더해질 뿐이다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 잔액 차감 로직으로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 두 카운터 함수: 잔액 확인 후 차감 | 확인과 차감 사이에 값이 바뀌면 음수 | 한 함수 안에서 원자적으로 확인+차감 |
| 정상 차감 | 정상 | 정상 |

**변형 C — 디렉터리 재귀 탐색 중 심볼릭 링크 차단**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `lstat` 으로 심볼릭 링크 확인 | 링크를 따라간다 | 링크면 건너뛴다 |
| 일반 파일 | 탐색 | 탐색 |

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
make D=sd37_toctou V=main SRC="sd37_toctou/src/toctou.c sd37_toctou/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd37_toctou/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd37_toctou/src/toctou.c sd37_toctou/test/test.c \
>     -pthread -o build/sd37_toctou_main
> ./build/sd37_toctou_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `access()`를 아예 없애기만 하고 `fopen()`은 그대로 둠 | 검사를 없애도 `fopen(path, "w+")` 자체가 여전히 이름 기반이라 링크를 그대로 따라간다.<br>핵심은 검사 제거가 아니라 **생성·검사를 한 시스템 콜로 합치는 것**(`O_CREAT\ | O_EXCL`)이다 |
| `O_EXCL` 없이 `O_CREAT`만 사용 | `O_CREAT`만 있으면 파일이 이미 있어도 그냥 열려버린다(덮어쓰기 성공).<br>`O_EXCL`이 있어야 "이미 있으면 실패"가 보장된다 |
| `chmod(path, ...)`로 권한을 나중에 바꿈 | 파일을 연 뒤 이름으로 다시 `chmod`하면 그 사이에 또 이름이 바뀔 수 있다.<br>이미 연 파일 디스크립터에 대해 `fchmod(fd, ...)`를 써야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `toctou.h` / `toctou.c`
> ```c
> #ifndef TOCTOU_H
> #define TOCTOU_H
> int file_operation_bad(const char *path, const char *content);
> int file_operation_good(const char *path, const char *content);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <fcntl.h>
> #include <unistd.h>
> #include <stdio.h>
> #include <sys/stat.h>
> #include "toctou.h"
>
> int file_operation_bad(const char *path, const char *content)
> {
>     FILE *f;
>     if (access(path, W_OK) != 0) return -1;      /* 검사 시점(TOC) */
>     f = fopen(path, "w+");                        /* 사용 시점(TOU) -- 그 사이 이름이 다른 대상을 가리켜도 그대로 따라감 */
>     if (!f) return -1;
>     fputs(content, f);
>     fclose(f);
>     return 0;
> }
>
> int file_operation_good(const char *path, const char *content)
> {
>     int fd = open(path, O_WRONLY | O_CREAT | O_EXCL, S_IRUSR | S_IWUSR); /* 생성.검사 원자적 */
>     FILE *f;
>     if (fd == -1) return -1;
>     if (fchmod(fd, S_IRUSR | S_IWUSR) == -1) { close(fd); return -1; }
>     f = fdopen(fd, "w");
>     if (!f) { close(fd); return -1; }
>     fputs(content, f);
>     fclose(f);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `file_operation_bad`는 시스템 콜을 **두 번**(`access` → `fopen`) 나눠 부른다.
> 그 사이가 곧 경쟁 구간이다.
> `file_operation_good`은 생성·존재확인을 `open()` **한 번**으로 합쳐서, "그 사이"라는 시간 자체를 없애버린다.
> TOCTOU 방어의 본질은 검사 로직 강화가 아니라 **검사와 사용 사이의 틈을 시스템 콜 차원에서 없애는 것**이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD36. 같은 포트번호의 다중 연결](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD36.%20같은%20포트번호의%20다중%20연결%20—%20SO_REUSEPORT%20신중%20사용으로%20치환.md)
- [다음: SD38. 제어되지 않은 재귀](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD38.%20제대로%20제어되지%20않은%20재귀%20—%20깊이%20제한%20동반으로%20치환.md)
