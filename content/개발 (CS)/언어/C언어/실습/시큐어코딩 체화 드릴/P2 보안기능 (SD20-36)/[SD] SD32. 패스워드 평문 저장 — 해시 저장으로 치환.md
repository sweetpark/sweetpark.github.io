---
title: "SD32. 패스워드 평문 저장 — 해시 저장으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD32. 패스워드 평문 저장 — 해시 저장으로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 13. 패스워드 평문 저장](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#13-패스워드-평문-저장-cwe-256) `CWE-256`
> **repo 폴더**: `sd32_pwplain/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**
> SD29와 헷갈리기 쉽다 — SD29는 "전송 중" 노출, 이 항목은 **"저장된 상태"** 자체가 평문인가를 다룬다.
> 저장 형식을 아예 다른 타입(`unsigned` 해시값)으로 바꿔서 "구조적으로 평문일 수 없게" 만드는 방식을 쓴다.

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
- void save_password_bad(const char *pw, char *stored, size_t size) { strncpy(stored, pw, ...); }
- int verify_password_bad(const char *stored, const char *input) { return strcmp(stored, input) == 0; }
+ void save_password_good(const char *pw, unsigned *stored) { *stored = toy_hash(pw); }
+ int verify_password_good(unsigned stored, const char *input) { return toy_hash(input) == stored; }
```

패스워드는 암호화해서 저장하거나, 인증 목적이면 복호화 가능한 암호화 대신 **일방향 해시**로 저장한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 설정 파일 인증 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 비밀번호 변경 시 이전 값과 비교 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** SD33(솔트)과 결합 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 설정 파일 인증

설정 파일에 저장된 값과 사용자가 입력한 패스워드를 대조해 인증한다.
- 저장된 값 자체에서 원본 패스워드를 알 수 없어야 한다.

**함수**

```c
unsigned toy_hash(const char *s);
void save_password_bad(const char *pw, char *stored, size_t size);
int verify_password_bad(const char *stored, const char *input);
void save_password_good(const char *pw, unsigned *stored);
int verify_password_good(unsigned stored, const char *input);
```

#### 공격 입력표

| 저장 방식 | 저장된 값에서 원본 패스워드를 알 수 있는가 | 위험 |
| :--- | :--- | :--- |
| 평문(Bad) | **그대로 보인다** | 설정 파일 하나만 유출되면 패스워드 전체 노출 |
| 해시(Good) | 알 수 없다(단방향) | 유출돼도 원본 복원 불가 |

### 1-B. 변형 B — 비밀번호 변경 시 이전 값과 비교

"새 비밀번호가 이전 3개와 달라야 한다"는 요구사항을 해시값만 비교해서 구현(평문 이력을 남기지 않고도 정책을 지킬 수 있음을 보여줌)

### 1-C. 변형 C — SD33(솔트)과 결합

이 드릴의 `toy_hash` 를 SD33의 솔트 방식과 합쳐, 최종적으로 "솔트+해시" 저장 형태를 완성

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `save_password_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void save_password_bad(const char *pw, char *stored, size_t size)
{
    /* 1. strncpy(stored, pw, size - 1) 후 널 종료   ← 평문 저장 */
}

int verify_password_bad(const char *stored, const char *input)
{
    /* 1. return strcmp(stored, input) == 0 */
}

void save_password_good(const char *pw, unsigned *stored)
{
    /* [ ] 1. toy_hash(s) 를 먼저 만든다
     *        h = 5381
     *        s 의 글자마다 h = h * 33 + (unsigned char)c
     *        return h */

    /* [ ] 2. *stored = toy_hash(pw) */
}

int verify_password_good(unsigned stored, const char *input)
{
    /* [ ] 3. 입력을 다시 해시해서 비교한다
     *        return toy_hash(input) == stored
     *        (저장값을 복호화하지 않는다) */
}
```

### 2-B. `save_password_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void save_password_good(const char *pw, unsigned *stored)
{
    /* [ ] 1. toy_hash(s) 를 먼저 만든다 */

    /* [ ] 2. *stored = toy_hash(pw) */
}

int verify_password_good(unsigned stored, const char *input)
{
    /* [ ] 3. 입력을 다시 해시해서 비교한다 */
}
```

### 2-C. `save_password_good` — Level 3 (3회차, 백지)

```c
void save_password_good(const char *pw, unsigned *stored)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 해시는 입력을 **다시 계산**해서 비교한다
     *   - `unsigned char` 캐스팅
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
sd32_pwplain/src/pw_store.h
sd32_pwplain/src/pw_store.c
sd32_pwplain/test/test.c
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
#include "pw_store.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char stored[32];
    save_password_bad("hunter2", stored, sizeof(stored));
    T_TRUE(strcmp(stored, "hunter2") == 0,
        "Bad는 저장된 값 자체가 원본 패스워드와 완전히 같아야 한다(평문 저장 재현)");
}

static void test_bad_normal(void)
{
    char stored[32];
    save_password_bad("hunter2", stored, sizeof(stored));
    T_TRUE(verify_password_bad(stored, "hunter2") == 1, "정상 인증은 통과해야 한다");
    T_TRUE(verify_password_bad(stored, "wrong") == 0, "틀린 패스워드는 실패해야 한다");
}

static void test_good_never_stores_plaintext(void)
{
    unsigned stored;
    save_password_good("hunter2", &stored);
    T_TRUE(stored != 0, "저장된 해시값이 존재해야 한다(타입 자체가 평문일 수 없음을 구조로 보증)");
}

static void test_good_normal(void)
{
    unsigned stored;
    save_password_good("hunter2", &stored);
    T_TRUE(verify_password_good(stored, "hunter2") == 1, "정상 인증은 통과해야 한다");
    T_TRUE(verify_password_good(stored, "wrong") == 0, "틀린 패스워드는 실패해야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_never_stores_plaintext();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!TIP] "타입이 다르다"는 것 자체가 방어다
> `stored` 가 `char[]` 이 아니라 `unsigned` 라는 사실만으로 "여기엔 원본 문자열이 들어갈 수 없다"는 게 컴파일 타임에 보장된다.
> 리뷰어가 코드를 볼 때 **자료형만 보고도** 평문 저장 여부를 의심할 수 있다는 걸 기억한다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 비밀번호 변경 시 이전 값과 비교**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 새 비밀번호가 이전 3개 중 하나와 같음 | 평문 이력이 필요하다 | 해시값만 비교해서 거부 |
| 이전과 다른 새 비밀번호 | 허용 | 허용 |

**변형 C — SD33(솔트)과 결합**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 솔트를 더한 저장 | 솔트 없는 해시 | SD33 방식의 솔트+해시 |
| 같은 비밀번호 두 사용자 | 같은 값 | 서로 다른 값 |

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
make D=sd32_pwplain V=main SRC="sd32_pwplain/src/pw_store.c sd32_pwplain/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd32_pwplain/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd32_pwplain/src/pw_store.c sd32_pwplain/test/test.c \
>     -pthread -o build/sd32_pwplain_main
> ./build/sd32_pwplain_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `toy_hash` 를 실제 프로덕션 해시로 착각 | djb2류 체크섬은 암호학적 해시가 아니다(충돌·역산이 쉽다).<br>이 드릴은 **저장 구조**(평문 vs 해시)의 차이만 보여준다 — 실전은 PBKDF2/bcrypt/scrypt/Argon2 |
| SD29(전송)와 SD32(저장)를 같은 문제로 취급 | 전송은 양방향(복호화 필요), 저장은 단방향(복호화 불필요, 오히려 안 되는 게 낫다)이 원칙이다.<br>이 둘을 같은 함수로 처리하면 안 된다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `pw_store.h` / `pw_store.c`
> ```c
> #ifndef PW_STORE_H
> #define PW_STORE_H
> #include <stddef.h>
> unsigned toy_hash(const char *s);
> void save_password_bad(const char *pw, char *stored, size_t size);
> int verify_password_bad(const char *stored, const char *input);
> void save_password_good(const char *pw, unsigned *stored);
> int verify_password_good(unsigned stored, const char *input);
> #endif
> ```
> ```c
> #include <string.h>
> #include "pw_store.h"
>
> unsigned toy_hash(const char *s)
> {
>     unsigned h = 5381;
>     while (*s) h = ((h << 5) + h) + (unsigned char)(*s++);
>     return h;
> }
>
> void save_password_bad(const char *pw, char *stored, size_t size)
> {
>     strncpy(stored, pw, size - 1);
>     stored[size - 1] = '\0';
> }
>
> int verify_password_bad(const char *stored, const char *input)
> {
>     return strcmp(stored, input) == 0;
> }
>
> void save_password_good(const char *pw, unsigned *stored) { *stored = toy_hash(pw); }
> int verify_password_good(unsigned stored, const char *input) { return toy_hash(input) == stored; }
> ```
>
> **눈여겨볼 점**: `verify_password_good` 은 저장된 값을 **복호화하지 않는다** — 입력을 다시 해시해서 저장된 해시와 비교할 뿐이다.
> "원본을 절대 복원하지 않고도 검증할 수 있다"는 게 단방향 해시의 핵심이다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD31. 적절하지 않은 난수 값](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD31.%20적절하지%20않은%20난수%20값의%20사용%20—%20커널%20CSPRNG로%20치환.md)
- [다음: SD33. 솔트 없는 일방향 해쉬](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD33.%20솔트%20없이%20일방향%20해쉬%20함수%20사용%20—%20사용자별%20난수%20솔트로%20치환.md)
