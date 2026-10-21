---
title: "SD28. 취약한 암호화 알고리즘 사용 — 식별자 화이트리스트 검증으로 치환"
description: "시큐어코딩 SD28 취약한 암호화 알고리즘 사용 (CWE-327): 취약한 코드를 식별자 화이트리스트 검증 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD28. 취약한 암호화 알고리즘 사용 — 식별자 화이트리스트 검증으로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 9. 취약한 암호화 알고리즘 사용](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#9-취약한-암호화-알고리즘-사용-cwe-327) `CWE-327`
> **repo 폴더**: `sd28_cipherchoice/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**

> [!IMPORTANT] 여기서부터(SD28~35)는 OpenSSL 없이 "선택 로직"만 검증한다
> 실제 암호화 연산은 하지 않는다.
> 학습 환경(WSL2/macOS)에 OpenSSL 개발 헤더가 없을 수 있어서, 이 계열은 **"이 코드가 올바른 알고리즘·키 길이·난수원을 선택하는가"** 를 문자열/상수 비교로 검증하는 데 집중한다.
> 실무에서 OpenSSL이 있다면 같은 골격에 `EVP_*` 호출만 얹으면 된다.

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
- int is_allowed_cipher_bad(const char *cipher_name) { (void)cipher_name; return 1; }
+ /* 블랙리스트로 위험 알고리즘 차단 + 화이트리스트에 없으면 기본 거부 */
+ for (BANNED 목록과 일치하면) return 0;
+ for (ALLOWED 목록과 일치하면) return 1;
+ return 0;
```

base64는 암호화가 아니라 인코딩이다.
DES·3DES·RC4·MD5·SHA-1은 신규 사용 금지 — 검증필 모듈의 AES·ARIA·SEED만 쓴다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 암호화 알고리즘 선택 게이트 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 해시 알고리즘 전용 게이트 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 버전 접미사까지 검사 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 암호화 알고리즘 선택 게이트

암호화에 사용할 알고리즘 식별자 문자열을 검사해 허용 여부를 판정한다.
- `AES-*`, `ARIA-*`, `SEED-*` 계열만 허용한다.
- `DES`, `3DES`, `RC4`, `MD5`, `SHA1` 은 명시적으로 금지한다.

**함수**

```c
int is_allowed_cipher_bad(const char *cipher_name);
int is_allowed_cipher_good(const char *cipher_name);
```

#### 공격 입력표

| 알고리즘 식별자 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `AES-256-GCM` (정상) | 허용 | 정상 동작 |
| `DES-ECB` | **허용됨(취약)** | 검사 자체가 없다 |
| `MD5` | **허용됨(취약)** | 해시 무결성용 알고리즘도 그냥 통과 |

### 1-B. 변형 B — 해시 알고리즘 전용 게이트

암호화가 아니라 무결성 검증용 해시(SHA-256 이상만 허용, MD5/SHA-1 금지)로 변형

### 1-C. 변형 C — 버전 접미사까지 검사

`"AES-128"` 처럼 모드가 빠진 식별자(ECB 모드가 기본값으로 깔릴 위험)까지 걸러내도록 정규식 대신 문자열 파싱으로 모드 부분을 분리해 검사

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `is_allowed_cipher_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int is_allowed_cipher_bad(const char *cipher_name)
{
    /* 1. (void)cipher_name
     * 2. return 1   ← 무엇이든 허용 */
}

int is_allowed_cipher_good(const char *cipher_name)
{
    /* [ ] 1. 목록 두 개
     *        BANNED  = { "DES-ECB", "3DES", "RC4", "MD5", "SHA1" }
     *        ALLOWED = { "AES-128-CBC", "AES-256-GCM", "ARIA-128-CBC", "SEED-CBC" } */

    /* [ ] 2. BANNED 를 먼저 순회한다
     *        strcmp(cipher_name, BANNED[i]) == 0 → return 0 */

    /* [ ] 3. ALLOWED 를 순회한다
     *        strcmp(cipher_name, ALLOWED[i]) == 0 → return 1 */

    /* [ ] 4. 둘 다 아니면 → return 0   (모르면 거부) */
}
```

### 2-B. `is_allowed_cipher_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int is_allowed_cipher_good(const char *cipher_name)
{
    /* [ ] 1. 목록 두 개 */

    /* [ ] 2. BANNED 를 먼저 순회한다 */

    /* [ ] 3. ALLOWED 를 순회한다 */

    /* [ ] 4. 둘 다 아니면 → return 0   (모르면 거부) */
}
```

### 2-C. `is_allowed_cipher_good` — Level 3 (3회차, 백지)

```c
int is_allowed_cipher_good(const char *cipher_name)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 배열 길이는 `sizeof(A) / sizeof(A[0])`
     *   - 기본값은 거부
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
sd28_cipherchoice/src/cipher_check.h
sd28_cipherchoice/src/cipher_check.c
sd28_cipherchoice/test/test.c
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
#include "cipher_check.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(is_allowed_cipher_bad("DES-ECB") == 1,
        "Bad는 DES-ECB 같은 취약 알고리즘도 그대로 허용해야 한다(취약점 재현)");
    T_TRUE(is_allowed_cipher_bad("MD5") == 1, "Bad는 MD5도 허용해야 한다");
}

static void test_good_blocks_weak(void)
{
    T_TRUE(is_allowed_cipher_good("DES-ECB") == 0, "Good은 DES-ECB를 거부해야 한다");
    T_TRUE(is_allowed_cipher_good("RC4") == 0, "Good은 RC4를 거부해야 한다");
    T_TRUE(is_allowed_cipher_good("SHA1") == 0, "Good은 SHA1을 거부해야 한다");
}

static void test_good_allows_strong(void)
{
    T_TRUE(is_allowed_cipher_good("AES-256-GCM") == 1, "Good은 AES-256-GCM을 허용해야 한다");
}

static void test_good_default_deny(void)
{
    T_TRUE(is_allowed_cipher_good("SOME-UNKNOWN-CIPHER") == 0,
        "Good은 목록에 없는 미지의 알고리즘도 화이트리스트 원칙상 거부해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_weak();
    test_good_allows_strong();
    test_good_default_deny();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 해시 알고리즘 전용 게이트**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `"MD5"` / `"SHA1"` 해시 게이트 | 허용 | 거부 |
| `"SHA-256"` | 허용 | 허용 |

**변형 C — 버전 접미사까지 검사**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `"AES-128"` (모드 없음) | 허용 | 거부 (ECB 가 깔릴 위험) |
| `"AES-128-CBC"` | 허용 | 허용 |

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
make D=sd28_cipherchoice V=main SRC="sd28_cipherchoice/src/cipher_check.c sd28_cipherchoice/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd28_cipherchoice/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd28_cipherchoice/src/cipher_check.c sd28_cipherchoice/test/test.c \
>     -pthread -o build/sd28_cipherchoice_main
> ./build/sd28_cipherchoice_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 블랙리스트만 만들고 화이트리스트 기본 거부를 빼먹음 | 블랙리스트에 없는 새로운 취약 알고리즘(미래에 깨질 알고리즘)이 그냥 통과한다.<br>반드시 "허용 목록에 있는 것만" 통과시키는 이중 구조로 짠다 |
| 대소문자를 구분해서 `"aes-256-gcm"` 은 놓침 | 실무에서는 대소문자 정규화(대문자로 통일 등)를 먼저 하거나 대소문자 무관 비교를 쓴다 |
| base64 같은 인코딩 식별자를 화이트리스트에 올림 | base64는 암호화가 아니라 인코딩이다 — 애초에 이 목록에 낄 자격이 없다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `cipher_check.h` / `cipher_check.c`
> **헤더 (`cipher_check.h`)**
> ```c
> #ifndef CIPHER_CHECK_H
> #define CIPHER_CHECK_H
> int is_allowed_cipher_bad(const char *cipher_name);
> int is_allowed_cipher_good(const char *cipher_name);
> #endif
> ```
> **구현 (`cipher_check.c`)**
> ```c
> #include <string.h>
> #include <stddef.h>
> #include "cipher_check.h"
>
> int is_allowed_cipher_bad(const char *cipher_name)
> {
>     (void)cipher_name;
>     return 1;
> }
>
> static const char *BANNED[]  = { "DES-ECB", "3DES", "RC4", "MD5", "SHA1" };
> static const char *ALLOWED[] = { "AES-128-CBC", "AES-256-GCM", "ARIA-128-CBC", "SEED-CBC" };
>
> int is_allowed_cipher_good(const char *cipher_name)
> {
>     size_t i;
>     for (i = 0; i < sizeof(BANNED) / sizeof(BANNED[0]); i++)
>         if (strcmp(cipher_name, BANNED[i]) == 0) return 0;
>     for (i = 0; i < sizeof(ALLOWED) / sizeof(ALLOWED[0]); i++)
>         if (strcmp(cipher_name, ALLOWED[i]) == 0) return 1;
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `is_allowed_cipher_good` 은 블랙리스트를 **먼저** 보고, 그다음 화이트리스트를 본다.
> 순서가 바뀌어도 결과는 같지만(둘 다 안 맞으면 결국 `0`), "명백히 위험한 것"을 먼저 걸러낸다는 코드의 의도가 이 순서에 드러난다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD27. 주석문안 주요정보](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD27.%20주석문안에%20포함된%20주요정보%20—%20배포%20전%20자동%20검사로%20치환.md)
- [다음: SD29. 사용자 중요정보 평문 저장](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD29.%20사용자%20중요정보%20평문%20저장%28또는%20전송%29%20—%20전송%20전%20변환으로%20치환.md)
