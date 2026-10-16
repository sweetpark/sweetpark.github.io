---
title: "SD57. 오용 문자열 관리 — 크기 인자 동반과 멀티바이트 경계 인식으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD57. 오용: 문자열 관리 — 크기 인자 동반과 멀티바이트 경계 인식으로 치환

> **원본 항목**: [Part 7. API 오용 — 4. 오용: 문자열 관리](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%207.%20API%20오용.md#4-오용-문자열-관리-cwe-251) `CWE-251`
> **repo 폴더**: `sd57_mbstr/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> 가이드 원문의 `_mbscpy`/`_mbscpy_s`는 MSVC 전용 함수라 이 환경(gcc/glibc)에는 아예 존재하지 않는다.
> 이 드릴은 같은 교훈("크기 인자 없는 복사 금지")을 `strcpy`로 재현하면서, **거기서 한 걸음 더 나아가** — 크기를 제한해도 멀티바이트(UTF-8) 문자 중간을 잘라버리면 여전히 결함이라는 걸 실제 인코딩으로 확인한다.

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
- strcpy(dst, src);                              /* 크기 인자 자체가 없음 -- _mbscpy와 동일한 결함 */
+ size_t copy_len = /* dst_size-1과 strlen(src) 중 작은 값 */;
+ while (copy_len > 0 && ((unsigned char)src[copy_len] & 0xC0) == 0x80) {
+     copy_len--;                                  /* 자르는 지점이 멀티바이트 문자 중간이면 물러남 */
+ }
+ memcpy(dst, src, copy_len);
+ dst[copy_len] = '\0';
```

멀티바이트 문자열은 "글자 수 ≠ 바이트 수"다.
크기만 맞춘 단순 절단은 문자 하나를 반으로 쪼개 깨진 바이트 시퀀스를 남길 수 있다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 사용자 이름 복사 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 문자열 연결(`_mbscat` 상당)로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 3바이트·4바이트 UTF-8 문자로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 사용자 이름 복사

사용자 이름 문자열을 고정 크기 버퍼에 복사한다.
- 대상 버퍼 크기를 넘는 입력은 안전하게 잘라야 한다.
- 자를 때 UTF-8 문자 중간에서 끊어 깨진 바이트가 남아서는 안 된다.

**함수**

```c
void mb_copy_bad(char *dst, const char *src);
int  mb_copy_good(char *dst, size_t dst_size, const char *src);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `src`(외부 입력 문자열) | 사용자 입력 | 크기 인자가 아예 없는 복사 함수(`_mbscpy`/`strcpy`)로 그대로 흘러가는 지점 |

#### 공격 입력표

| 입력 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 대상 버퍼보다 훨씬 긴 입력 | **버퍼 오버플로우로 크래시**(`expect_crash`가 감지) | 함수 시그니처 자체에 크기 인자가 없어 안전하게 쓸 방법이 없다 |
| `"caf\xC3\xA9"`(UTF-8 "café", 5바이트)를 5바이트 버퍼(널 포함 4글자)에 복사(Good) | **`"caf"`로 정확히 잘림**(깨진 바이트 없음) | 자르는 지점이 `é`(0xC3 0xA9)의 연속 바이트 한가운데임을 감지하고 문자 시작 지점까지 물러난다 |

### 1-B. 변형 B — 문자열 연결(`_mbscat` 상당)로 변형

두 문자열을 이어 붙이는 함수로 바꿔, 이어 붙인 결과가 대상 버퍼를 넘지 않으면서도 멀티바이트 경계를 지키는지 확인한다

### 1-C. 변형 C — 3바이트·4바이트 UTF-8 문자로 확장

한글(3바이트, 예: `"가"` = `0xEA 0xB0 0x80`)이나 이모지(4바이트)로 테스트 입력을 바꿔, 연속 바이트 판별 로직(`0xC0` 마스크)이 바이트 길이와 무관하게 똑같이 작동하는지 확인한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `mb_copy_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void mb_copy_bad(char *dst, const char *src)
{
    /* 1. strcpy(dst, src)   ← 크기 인자가 없다 */
}

int mb_copy_good(char *dst, size_t dst_size, const char *src)
{
    /* [ ] 1. 지역변수
     *        size_t len = strlen(src), copy_len */

    /* [ ] 2. dst_size == 0 이면 → return -1 */

    /* [ ] 3. 복사할 길이
     *        copy_len = (len < dst_size - 1) ? len : dst_size - 1 */

    /* [ ] 4. 멀티바이트 경계 뒤로 물러난다 (복사 **전에**)
     *        copy_len > 0 이고 ((unsigned char)src[copy_len] & 0xC0) == 0x80 인 동안
     *            copy_len-- */

    /* [ ] 5. memcpy(dst, src, copy_len) */

    /* [ ] 6. dst[copy_len] = '\0' */

    /* [ ] 7. return 0 */
}
```

### 2-B. `mb_copy_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int mb_copy_good(char *dst, size_t dst_size, const char *src)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. dst_size == 0 이면 → return -1 */

    /* [ ] 3. 복사할 길이 */

    /* [ ] 4. 멀티바이트 경계 뒤로 물러난다 (복사 **전에**) */

    /* [ ] 5. memcpy(dst, src, copy_len) */

    /* [ ] 6. dst[copy_len] = '\0' */

    /* [ ] 7. return 0 */
}
```

### 2-C. `mb_copy_good` — Level 3 (3회차, 백지)

```c
int mb_copy_good(char *dst, size_t dst_size, const char *src)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - UTF-8 연속 바이트는 `10xxxxxx` (`& 0xC0 == 0x80`)
     *   - 자른 뒤 고치는 게 아니라 **안전한 지점을 먼저 찾고** 자른다
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
sd57_mbstr/src/mbstr.h
sd57_mbstr/src/mbstr.c
sd57_mbstr/test/test.c
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
#include <sys/wait.h>
#include <unistd.h>
#include "mbstr.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static int expect_crash(void (*fn)(void))
{
    pid_t pid = fork();
    if (pid == 0) { fn(); _exit(0); }
    int status = 0;
    waitpid(pid, &status, 0);
    if (WIFSIGNALED(status)) return 1;
    if (WIFEXITED(status) && WEXITSTATUS(status) != 0) return 1;
    return 0;
}

static void call_bad(void)
{
    char dst[8];
    mb_copy_bad(dst, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
}

static void test_bad_is_vulnerable(void)
{
    T_TRUE(expect_crash(call_bad) == 1,
        "Bad는 크기 인자가 없어 대상 버퍼보다 긴 입력에서 크래시해야 한다(취약점 재현)");
}

static void test_good_respects_utf8_boundary(void)
{
    char dst[5];   /* "caf" + '\0' 까지만 들어가는 크기 -- é(0xC3 0xA9)는 중간에 걸림 */
    T_TRUE(mb_copy_good(dst, sizeof(dst), "caf\xC3\xA9") == 0, "Good은 항상 성공해야 한다(잘라서라도 완료)");
    T_TRUE(strcmp(dst, "caf") == 0,
        "Good은 멀티바이트 문자 중간에서 자르지 않고 문자 경계까지 물러나야 한다(잘린 é 바이트가 남으면 안 됨)");
}

static void test_good_normal(void)
{
    char dst[16];
    T_TRUE(mb_copy_good(dst, sizeof(dst), "hi") == 0, "정상 크기 입력은 성공해야 한다");
    T_TRUE(strcmp(dst, "hi") == 0, "짧은 입력은 그대로 복사돼야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_respects_utf8_boundary();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] UTF-8 연속 바이트를 어떻게 알아보는가
> UTF-8은 첫 바이트의 상위 비트 패턴으로 문자의 전체 길이를 알 수 있게 설계됐다.
> **연속 바이트**(문자의 두 번째 바이트 이후)는 항상 `10xxxxxx` 형태(`& 0xC0 == 0x80`)다.
> `mb_copy_good`은 자르는 지점의 바이트가 이 패턴이면 "문자 중간"이라고 판단해 한 바이트씩 물러난다 — 첫 바이트(`0xC3`처럼 `& 0xC0 == 0xC0`)에 도달하면 그게 문자의 시작이므로 멈춘다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 문자열 연결(`_mbscat` 상당)로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 두 문자열 이어 붙이기 (`_mbscat` 상당) | 버퍼 초과 + 문자 중간 절단 | 합친 길이 검사 + 경계 보정 |
| 합쳐도 들어가는 길이 | 정상 | 정상 |

**변형 C — 3바이트·4바이트 UTF-8 문자로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 한글 3바이트 `"가"` = `0xEA 0xB0 0x80`, 이모지 4바이트 | 중간에서 끊어 깨진 바이트가 남는다 | 문자 경계까지 물러나서 끊는다 |
| ASCII | 정상 | 정상 |

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
make D=sd57_mbstr V=main SRC="sd57_mbstr/src/mbstr.c sd57_mbstr/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd57_mbstr/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd57_mbstr/src/mbstr.c sd57_mbstr/test/test.c \
>     -pthread -o build/sd57_mbstr_main
> ./build/sd57_mbstr_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 크기만 제한하고(`strncpy`) 멀티바이트 경계는 신경 안 씀 | [SD11](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD11.%20스택%20버퍼%20오버플로우%20—%20길이%20검사%20후%20strncpy로%20치환.md)에서 배운 `strncpy` 치환은 **바이트 단위**로만 안전하다.<br>텍스트가 UTF-8이라면 그 바이트 경계가 문자 경계와 일치하지 않을 수 있다는 게 이 항목의 추가 교훈이다 |
| 연속 바이트 판별에서 `0x80`이 아니라 `0xFF`로 마스킹 | UTF-8 연속 바이트의 상위 2비트만 `10`으로 고정돼 있다(`0xC0` 마스크로 상위 2비트만 추출).<br>`0xFF`로 전체 바이트를 비교하면 조건이 절대 참이 되지 않아 로직이 무력화된다 |
| 잘린 결과가 "글자 수 기준으로 몇 개인지"까지 신경 씀 | 이 항목은 "깨진 바이트를 안 남기는 것"이 목표지, "정확히 N글자로 자르는 것"이 목표가 아니다.<br>문자 경계에서 멈추기만 하면 결과 문자열의 길이는 상황에 따라 한두 바이트 짧아질 수 있고 그건 정상이다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `mbstr.h` / `mbstr.c`
> ```c
> #ifndef MBSTR_H
> #define MBSTR_H
> #include <stddef.h>
> void mb_copy_bad(char *dst, const char *src);
> int  mb_copy_good(char *dst, size_t dst_size, const char *src);
> #endif
> ```
> ```c
> #include <string.h>
> #include "mbstr.h"
>
> void mb_copy_bad(char *dst, const char *src)
> {
>     strcpy(dst, src);                  /* 크기 인자 자체가 없음 -- _mbscpy와 동일한 결함 */
> }
>
> int mb_copy_good(char *dst, size_t dst_size, const char *src)
> {
>     size_t len = strlen(src);
>     size_t copy_len;
>
>     if (dst_size == 0) return -1;
>     copy_len = (len < dst_size - 1) ? len : dst_size - 1;
>
>     while (copy_len > 0 && ((unsigned char)src[copy_len] & 0xC0) == 0x80) {
>         copy_len--;
>     }
>
>     memcpy(dst, src, copy_len);
>     dst[copy_len] = '\0';
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `mb_copy_good`의 절단 로직은 자른 뒤 **점검하는 게 아니라, 자르는 지점 자체를 미리 검사**한다(`while` 루프가 `memcpy` 이전에 끝난다).
> "일단 자르고 나중에 고치는" 순서가 아니라 "안전한 지점을 먼저 찾고 그 다음에 자르는" 순서라는 걸 기억한다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD56. chroot Jail 작업디렉터리](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD56.%20작업%20디렉터리%20변경%20없는%20chroot%20Jail%20생성%20—%20chdir%20동반으로%20치환.md)
- [다음: SD58. 다중 스레드 getlogin() 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD58.%20다중%20스레드%20프로그램에서%20getlogin%28%29%20사용%20—%20getlogin_r로%20치환.md)
