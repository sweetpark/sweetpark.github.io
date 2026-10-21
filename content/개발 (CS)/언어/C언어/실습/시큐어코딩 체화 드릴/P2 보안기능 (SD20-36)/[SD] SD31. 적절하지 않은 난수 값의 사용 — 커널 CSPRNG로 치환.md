---
title: "SD31. 적절하지 않은 난수 값의 사용 — 커널 CSPRNG로 치환"
description: "시큐어코딩 SD31 적절하지 않은 난수 값의 사용 (CWE-330): 취약한 코드를 커널 CSPRNG 방식으로 바꾸는 치환을 요구사항서, pseudo code, 테스트 코드로 체화하는 드릴입니다."
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD31. 적절하지 않은 난수 값의 사용 — 커널 CSPRNG로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 12. 적절하지 않은 난수 값의 사용](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#12-적절하지-않은-난수-값의-사용-cwe-330) `CWE-330`
> **repo 폴더**: `sd31_weakrandom/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> Part 2-3에서 유일하게 **실제 동작으로 완전히 재현**되는 드릴이다 — `getrandom()` 이 진짜 예측 불가능한 값을 만드는지 직접 확인한다.

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
- srand(seed); for (...) out[i] = "0123456789abcdef"[rand() % 16];   /* seed만 알면 재현됨 */
+ if (getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw)) return -1;  /* 실패는 반드시 중단 */
+ for (...) sprintf(out + i*2, "%02x", raw[i]);
```

seed를 바꾸는 것으로는 해결되지 않는다.
`rand()` 계열은 보안용이 아니며, 커널 CSPRNG(`getrandom`)로 통째로 교체해야 한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 세션 토큰 생성 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 일회용 비밀번호(OTP) 생성 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 초기화 벡터(IV) 생성 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 세션 토큰 생성

32자 16진수 세션 토큰을 생성한다.
- 토큰은 예측 불가능해야 한다.
- 난수 생성에 실패하면 반드시 에러를 반환해야 한다(약한 값으로 대체 금지).

**함수**

```c
void gen_token_bad(unsigned seed, char *out, size_t out_size);
int gen_token_good(char *out, size_t out_size);
```

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 같은 seed로 두 번 생성 | **완전히 같은 토큰** | `rand()` 는 seed가 같으면 항상 같은 시퀀스를 낸다(예측 가능) |
| 매번 새로 생성(Good) | 매번 다른 토큰 | 커널 CSPRNG는 내부 엔트로피 풀에서 뽑는다 |

### 1-B. 변형 B — 일회용 비밀번호(OTP) 생성

16진수 대신 6자리 숫자 OTP로 변형 — `getrandom` 결과를 숫자 범위로 매핑할 때 모듈로 편향(modulo bias)이 생기지 않게 하는 법까지 고려

### 1-C. 변형 C — 초기화 벡터(IV) 생성

AES-CBC용 16바이트 IV를 만드는 함수로 변형.
IV는 비밀은 아니지만 예측 불가능해야 하는 이유를 설명해본다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `gen_token_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void gen_token_bad(unsigned seed, char *out, size_t out_size)
{
    /* 1. srand(seed)   ← seed 만 알면 재현된다
     * 2. out_size - 1 번: out[i] = "0123456789abcdef"[rand() % 16]
     * 3. out[i] = '\0' */
}

int gen_token_good(char *out, size_t out_size)
{
    /* [ ] 1. 지역변수
     *        unsigned char raw[16], size_t i */

    /* [ ] 2. 버퍼 크기 검사
     *        out_size < sizeof(raw) * 2 + 1 → return -1 */

    /* [ ] 3. 커널 CSPRNG
     *        getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw) → return -1
     *        실패하면 약한 값으로 대체하지 않고 **중단** */

    /* [ ] 4. 16진수로 변환
     *        sprintf(out + i * 2, "%02x", raw[i])  (i = 0 ~ 15) */

    /* [ ] 5. return 0 */
}
```

### 2-B. `gen_token_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int gen_token_good(char *out, size_t out_size)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. 버퍼 크기 검사 */

    /* [ ] 3. 커널 CSPRNG */

    /* [ ] 4. 16진수로 변환 */

    /* [ ] 5. return 0 */
}
```

### 2-C. `gen_token_good` — Level 3 (3회차, 백지)

```c
int gen_token_good(char *out, size_t out_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `getrandom` 의 헤더 (`<sys/random.h>`) 와 `_DEFAULT_SOURCE`
     *   - `seed` 인자가 아예 없다
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
sd31_weakrandom/src/token_gen.h
sd31_weakrandom/src/token_gen.c
sd31_weakrandom/test/test.c
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
#include "token_gen.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char t1[33], t2[33];
    gen_token_bad(1, t1, sizeof(t1));
    gen_token_bad(1, t2, sizeof(t2));
    T_TRUE(strcmp(t1, t2) == 0,
        "Bad는 같은 seed면 항상 같은 토큰을 만들어야 한다(예측 가능함 = 취약점 재현)");
}

static void test_bad_normal(void)
{
    char t1[33], t2[33];
    gen_token_bad(1, t1, sizeof(t1));
    gen_token_bad(2, t2, sizeof(t2));
    T_TRUE(strcmp(t1, t2) != 0, "적어도 seed가 다르면 결과도 달라진다(그래도 예측 가능한 건 여전함)");
}

static void test_good_is_unpredictable(void)
{
    char t1[33], t2[33];
    T_TRUE(gen_token_good(t1, sizeof(t1)) == 0, "정상 크기 버퍼는 성공해야 한다");
    T_TRUE(gen_token_good(t2, sizeof(t2)) == 0, "두 번째 호출도 성공해야 한다");
    T_TRUE(strcmp(t1, t2) != 0,
        "Good은 매 호출마다 다른 토큰을 만들어야 한다(진짜 난수원을 쓴다는 증거)");
}

static void test_good_rejects_small_buffer(void)
{
    char tiny[4];
    T_TRUE(gen_token_good(tiny, sizeof(tiny)) == -1, "Good은 버퍼가 너무 작으면 실패로 알려야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_is_unpredictable();
    test_good_rejects_small_buffer();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] macOS에서는 `getrandom` 대신 `arc4random_buf`
> macOS는 `<sys/random.h>` 의 `getrandom()` 대신 `<stdlib.h>` 의 `arc4random_buf(buf, len)` 을 쓴다(반환값이 없고 항상 성공).
> 이 드릴을 macOS에서 풀 때는 `#ifdef __APPLE__` 로 분기하거나, 실패 처리 로직 없이 `arc4random_buf` 만 써도 된다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 일회용 비밀번호(OTP) 생성**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 6자리 OTP, `random % 10` 로 매핑 | 모듈로 편향 | 편향 없는 매핑 (거부 샘플링) |
| 정상 호출 | 6자리 숫자 | 6자리 숫자 |

**변형 C — 초기화 벡터(IV) 생성**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| AES-CBC 용 IV 16바이트 | 예측 가능한 IV | `getrandom` 의 16바이트 |
| 연속 두 번 호출 | 같은 값이 나올 수 있다 | 서로 다르다 |

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
make D=sd31_weakrandom V=main SRC="sd31_weakrandom/src/token_gen.c sd31_weakrandom/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd31_weakrandom/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd31_weakrandom/src/token_gen.c sd31_weakrandom/test/test.c \
>     -pthread -o build/sd31_weakrandom_main
> ./build/sd31_weakrandom_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `srand(time(NULL))` 로 "개선"했다고 착각 | seed가 초 단위 시각이면 하루치 후보가 86400개뿐이라 전수 시도로 재현된다.<br>여전히 `rand()` 계열 자체가 문제다 |
| `getrandom` 실패 시 `rand()` 로 폴백 | "실패하면 약한 값이라도 쓰자"는 대응이 가장 위험하다.<br>실패는 반드시 호출자에게 알리고 중단한다 |
| 반환된 바이트를 `%d` 로 찍어 10진수 토큰을 만듦 | 바이트당 표현 범위가 줄어 엔트로피가 낭비된다.<br>16진수(`%02x`)로 그대로 펼치는 것이 표준적이다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `token_gen.h` / `token_gen.c`
> ```c
> #ifndef TOKEN_GEN_H
> #define TOKEN_GEN_H
> #include <stddef.h>
> void gen_token_bad(unsigned seed, char *out, size_t out_size);
> int gen_token_good(char *out, size_t out_size);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <stdlib.h>
> #include <stdio.h>
> #include <sys/random.h>
> #include "token_gen.h"
>
> void gen_token_bad(unsigned seed, char *out, size_t out_size)
> {
>     size_t i;
>     srand(seed);
>     for (i = 0; i + 1 < out_size; i++)
>         out[i] = "0123456789abcdef"[rand() % 16];
>     out[i] = '\0';
> }
>
> int gen_token_good(char *out, size_t out_size)
> {
>     unsigned char raw[16];
>     size_t i;
>     if (out_size < sizeof(raw) * 2 + 1) return -1;
>     if (getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw)) return -1;
>     for (i = 0; i < sizeof(raw); i++)
>         sprintf(out + i * 2, "%02x", raw[i]);
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `gen_token_bad` 는 `seed` 를 **인자로 받는다** — 즉 함수 시그니처 자체가 "이 값은 재현 가능하다"고 선언하고 있는 셈이다.
> `gen_token_good` 에는 seed 인자가 아예 없다.
> 함수가 무엇을 인자로 받는지가 곧 그 함수의 예측 가능성을 말해준다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD30. 충분하지 못한 키 길이](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD30.%20충분하지%20못한%20키%20길이%20사용%20—%20최소%20길이%20상수%20검증으로%20치환.md)
- [다음: SD32. 패스워드 평문 저장](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD32.%20패스워드%20평문%20저장%20—%20해시%20저장으로%20치환.md)
