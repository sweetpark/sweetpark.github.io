---
title: "SD30. 충분하지 못한 키 길이 사용 — 최소 길이 상수 검증으로 치환"
description: "시큐어코딩 SD30 충분하지 못한 키 길이 사용 (CWE-310): 취약한 코드를 최소 길이 상수 검증 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD30. 충분하지 못한 키 길이 사용 — 최소 길이 상수 검증으로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 11. 충분하지 못한 키 길이 사용](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#11-충분하지-못한-키-길이-사용-cwe-310) `CWE-310`
> **repo 폴더**: `sd30_keylen/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 8분 / 2회차 5분 / **3회차 3분**
> Part 2-3에서 가장 짧은 드릴 — 검사 로직 자체는 한 줄이지만, "그 한 줄이 왜 빠지기 쉬운가"를 체감하는 게 목적이다.

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
- int validate_key_length_bad(int key_bits) { (void)key_bits; return 1; }
+ int validate_key_length_good(int key_bits) { return key_bits >= MIN_SYMMETRIC_KEY_BITS; }
```

알고리즘이 안전해도 키가 짧으면 무의미하다.
대칭키 128비트 이상, RSA 2048비트 이상이 하한선이다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 대칭키 길이 검증 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** RSA 키 길이 검증 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 알고리즘별 최소 기준표 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 대칭키 길이 검증

암호화에 쓸 대칭키의 비트 수를 검증한다.
128비트 미만은 거부한다.

**함수**

```c
int validate_key_length_bad(int key_bits);
int validate_key_length_good(int key_bits);
```

#### 공격 입력표

| `key_bits` | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 256 (정상) | 통과 | 충분한 길이 |
| 56(DES 수준) | **통과(취약)** | 검사 자체가 없다 |

### 1-B. 변형 B — RSA 키 길이 검증

최소 기준을 2048로, 3072 이상이면 "권장" 등급까지 반환하는 3단계(거부/최소/권장) 함수로 확장

### 1-C. 변형 C — 알고리즘별 최소 기준표

SD28의 화이트리스트와 결합해, 알고리즘 이름에 따라 다른 최소 키 길이를 요구하는 테이블 기반 검증으로 발전

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `validate_key_length_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int validate_key_length_bad(int key_bits)
{
    /* 1. (void)key_bits
     * 2. return 1   ← 길이가 얼마든 허용 */
}

int validate_key_length_good(int key_bits)
{
    /* [ ] 1. 이름 있는 상수
     *        #define MIN_SYMMETRIC_KEY_BITS 128 */

    /* [ ] 2. return key_bits >= MIN_SYMMETRIC_KEY_BITS */
}
```

### 2-B. `validate_key_length_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int validate_key_length_good(int key_bits)
{
    /* [ ] 1. 이름 있는 상수 */

    /* [ ] 2. return key_bits >= MIN_SYMMETRIC_KEY_BITS */
}
```

### 2-C. `validate_key_length_good` — Level 3 (3회차, 백지)

```c
int validate_key_length_good(int key_bits)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 매직 넘버 대신 상수 이름
     *   - 경계값 127 / 128
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
sd30_keylen/src/key_length.h
sd30_keylen/src/key_length.c
sd30_keylen/test/test.c
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
#include "key_length.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    T_TRUE(validate_key_length_bad(56) == 1,
        "Bad는 DES 수준의 56비트 키도 그대로 통과시켜야 한다(취약점 재현)");
    T_TRUE(validate_key_length_bad(0) == 1, "Bad는 0비트도 통과시킨다");
}

static void test_good_blocks_short_key(void)
{
    T_TRUE(validate_key_length_good(56) == 0, "Good은 56비트 키를 거부해야 한다");
    T_TRUE(validate_key_length_good(64) == 0, "Good은 64비트 키도 거부해야 한다");
}

static void test_good_normal(void)
{
    T_TRUE(validate_key_length_good(128) == 1, "Good은 128비트 키는 통과시켜야 한다(경계값)");
    T_TRUE(validate_key_length_good(256) == 1, "Good은 256비트 키도 통과시켜야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_blocks_short_key();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — RSA 키 길이 검증**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| RSA `1024` | 허용 | 거부 (최소 2048) |
| RSA `3072` | 허용 | 허용 (권장 등급) |

**변형 C — 알고리즘별 최소 기준표**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `"AES-256"` 에 `128` 비트 | 허용 | 알고리즘별 최소 기준표에서 거부 |
| `"AES-128"` 에 `128` 비트 | 허용 | 허용 |

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
make D=sd30_keylen V=main SRC="sd30_keylen/src/key_length.c sd30_keylen/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd30_keylen/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd30_keylen/src/key_length.c sd30_keylen/test/test.c \
>     -pthread -o build/sd30_keylen_main
> ./build/sd30_keylen_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `key_bits > MIN` 으로 써서 정확히 128을 거부 | 경계값 처리 실수다.<br>"128비트 이상"이므로 `>=` 가 맞다 |
| 이 검사를 알고리즘 선택(SD28) 로직과 분리하지 않고 하나로 뭉침 | 알고리즘 종류와 키 길이는 서로 다른 축의 검증이다.<br>함수를 분리해야 SD30 변형 C(알고리즘별 기준표)로 자연스럽게 확장된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `key_length.h` / `key_length.c`
> ```c
> #ifndef KEY_LENGTH_H
> #define KEY_LENGTH_H
> int validate_key_length_bad(int key_bits);
> int validate_key_length_good(int key_bits);
> #endif
> ```
> ```c
> #include "key_length.h"
> #define MIN_SYMMETRIC_KEY_BITS 128
>
> int validate_key_length_bad(int key_bits) { (void)key_bits; return 1; }
> int validate_key_length_good(int key_bits) { return key_bits >= MIN_SYMMETRIC_KEY_BITS; }
> ```
>
> **눈여겨볼 점**: `MIN_SYMMETRIC_KEY_BITS` 가 매직 넘버(128)가 아니라 **이름 있는 상수**다.
> 기준이 나중에 바뀌어도(예: 256으로 상향) 이 한 줄만 고치면 된다 — SD17의 "이름 있는 상수" 원칙이 여기서도 반복된다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD29. 사용자 중요정보 평문 저장](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD29.%20사용자%20중요정보%20평문%20저장%28또는%20전송%29%20—%20전송%20전%20변환으로%20치환.md)
- [다음: SD31. 적절하지 않은 난수 값](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD31.%20적절하지%20않은%20난수%20값의%20사용%20—%20커널%20CSPRNG로%20치환.md)
