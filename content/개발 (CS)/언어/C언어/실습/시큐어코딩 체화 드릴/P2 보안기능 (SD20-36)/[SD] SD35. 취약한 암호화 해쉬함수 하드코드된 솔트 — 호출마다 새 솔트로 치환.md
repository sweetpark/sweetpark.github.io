---
title: "SD35. 취약한 암호화 해쉬함수 하드코드된 솔트 — 호출마다 새 솔트로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD35. 취약한 암호화 해쉬함수: 하드코드된 솔트 — 호출마다 새 솔트로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 16. 취약한 암호화 해쉬함수: 하드코드된 솔트](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#16-취약한-암호화-해쉬함수-하드코드된-솔트-cwe-326) `CWE-326`
> **repo 폴더**: `sd35_hcsalt/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 2-3 마지막 드릴이자 암호화 계열의 마지막이다.
> SD33(솔트 없음)과 SD26(하드코드된 키)이 만나는 지점 — **"솔트 자체가 SD26처럼 상수로 박혀 있으면"** SD33에서 배운 방어가 전부 무력화된다는 걸 확인한다.

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
- unsigned get_salt_bad(void) { return 0xC0FFEE; }             /* 항상 같은 솔트 */
+ if (getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw)) return -1;
+ memcpy(out_salt, raw, sizeof(unsigned));                      /* 호출마다 새 솔트 */
```

솔트는 비밀이 아니라 "매번 달라야 하는 값"이다.
고정된 순간 솔트로서의 존재 이유가 사라진다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 신규 계정 생성 시 솔트 발급 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** SD33·SD26과 전부 결합 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 솔트 크기를 16바이트(128비트)로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 신규 계정 생성 시 솔트 발급

새 계정을 만들 때마다 그 계정 전용 솔트를 발급한다.
- 솔트는 매번 달라야 한다.

**함수**

```c
unsigned get_salt_bad(void);
int get_salt_good(unsigned *out_salt);
```

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 계정 100개를 연달아 생성 | **전부 같은 솔트(`0xC0FFEE`)** | SD33의 솔트 방어가 사실상 무효화된다 — 모든 계정이 같은 솔트를 쓰면 그 솔트 하나로 만든 레인보우 테이블이 전체 계정에 통한다 |
| 같은 상황(Good) | 계정마다 다른 솔트 | SD31의 `getrandom` 을 그대로 재사용 |

### 1-B. 변형 B — SD33·SD26과 전부 결합

"계정 생성 시 새 솔트 발급(SD35) → 그 솔트로 패스워드 해시(SD33) → 결과를 저장(SD32)"까지 하나의 함수 체인으로 완성 — Part 2-3 전체를 관통하는 최종 통합 드릴

### 1-C. 변형 C — 솔트 크기를 16바이트(128비트)로 확장

`unsigned`(보통 4바이트) 대신 `unsigned char[16]` 배열로 바꿔 실전 수준의 솔트 크기를 다룬다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `get_salt_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
unsigned get_salt_bad(void)
{
    /* 1. return 0xC0FFEE   ← 항상 같은 솔트 */
}

int get_salt_good(unsigned *out_salt)
{
    /* [ ] 1. 지역변수
     *        unsigned char raw[sizeof(unsigned)] */

    /* [ ] 2. getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw) → return -1 */

    /* [ ] 3. memcpy(out_salt, raw, sizeof(unsigned)) */

    /* [ ] 4. return 0 */
}
```

### 2-B. `get_salt_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int get_salt_good(unsigned *out_salt)
{
    /* [ ] 1. 지역변수 */

    /* [ ] 2. getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw) → return -1 */

    /* [ ] 3. memcpy(out_salt, raw, sizeof(unsigned)) */

    /* [ ] 4. return 0 */
}
```

### 2-C. `get_salt_good` — Level 3 (3회차, 백지)

```c
int get_salt_good(unsigned *out_salt)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - SD31 의 `gen_token_good` 과 거의 같다
     *   - 솔트는 비밀이 아니라 **매번 달라야 하는 값**
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
sd35_hcsalt/src/salt_gen.h
sd35_hcsalt/src/salt_gen.c
sd35_hcsalt/test/test.c
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
#include "salt_gen.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    unsigned s1 = get_salt_bad();
    unsigned s2 = get_salt_bad();
    T_TRUE(s1 == s2,
        "Bad는 언제 호출해도 완전히 같은 솔트를 반환해야 한다(레인보우테이블 재사용 가능 = 취약점 재현)");
}

static void test_good_produces_fresh_salt(void)
{
    unsigned s1 = 0, s2 = 0, s3 = 0;
    T_TRUE(get_salt_good(&s1) == 0, "첫 번째 호출은 성공해야 한다");
    T_TRUE(get_salt_good(&s2) == 0, "두 번째 호출도 성공해야 한다");
    T_TRUE(get_salt_good(&s3) == 0, "세 번째 호출도 성공해야 한다");
    T_TRUE(!(s1 == s2 && s2 == s3),
        "Good은 호출마다 매번 새 솔트를 만들어야 한다(세 값이 전부 같을 확률은 무시 가능)");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_produces_fresh_salt();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — SD33·SD26과 전부 결합**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 계정 생성 → 솔트 → 해시 → 저장 | 고정 솔트 | 계정마다 다른 솔트로 해시 |
| 두 계정의 같은 비밀번호 | 같은 해시 | 다른 해시 |

**변형 C — 솔트 크기를 16바이트(128비트)로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `unsigned char salt[16]` | 4바이트 고정 | 16바이트 난수 |
| 연속 두 번 호출 | 같은 값 | 서로 다르다 |

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
make D=sd35_hcsalt V=main SRC="sd35_hcsalt/src/salt_gen.c sd35_hcsalt/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd35_hcsalt/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd35_hcsalt/src/salt_gen.c sd35_hcsalt/test/test.c \
>     -pthread -o build/sd35_hcsalt_main
> ./build/sd35_hcsalt_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "솔트 하드코딩"과 "키 하드코딩"(SD26)을 같은 문제로 뭉뚱그림 | 키는 비밀이라 저장소에서 안전하게 보관해야 하지만, 솔트는 **비밀이 아니라 매번 새로 만들어야 하는 값**이다.<br>대응 방식이 다르다(SD26=키 저장소 조회, SD35=매번 신규 생성) |
| 솔트를 `rand()` 로 생성(SD31 이전 방식으로 회귀) | 솔트도 예측 가능하면 사전 계산 공격의 여지가 생긴다.<br>SD31에서 이미 확립한 `getrandom` 패턴을 그대로 가져온다 |
| Part 2-3을 여기서 끝내고 SD32·33·35를 하나로 잇는 변형 B를 건너뜀 | 실전에서는 이 세 항목이 **한 함수 안에서 동시에** 지켜져야 한다.<br>따로따로는 이해했지만 합쳐서 짜보지 않으면 실무에서 순서를 놓치기 쉽다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `salt_gen.h` / `salt_gen.c`
> ```c
> #ifndef SALT_GEN_H
> #define SALT_GEN_H
> unsigned get_salt_bad(void);
> int get_salt_good(unsigned *out_salt);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <string.h>
> #include <sys/random.h>
> #include "salt_gen.h"
>
> unsigned get_salt_bad(void)
> {
>     return 0xC0FFEE;
> }
>
> int get_salt_good(unsigned *out_salt)
> {
>     unsigned char raw[sizeof(unsigned)];
>     if (getrandom(raw, sizeof(raw), 0) != (ssize_t)sizeof(raw)) return -1;
>     memcpy(out_salt, raw, sizeof(unsigned));
>     return 0;
> }
> ```
>
> **눈여겨볼 점**: `get_salt_good` 의 구현이 [SD31](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD31.%20적절하지%20않은%20난수%20값의%20사용%20—%20커널%20CSPRNG로%20치환.md)의 `gen_token_good` 과 거의 동일하다 — **난수가 필요한 모든 곳(토큰·솔트·IV)은 결국 같은 CSPRNG 호출로 귀결된다.** Part 2-3에서 배운 여러 항목이 결국 "믿을 수 있는 난수원 하나"로 수렴한다는 걸 확인하며 이 계열을 마친다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD34. 부적절한 RSA 패딩](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD34.%20취약한%20암호화%20적절하지%20못한%20RSA%20패딩%20—%20OAEP%20패딩%20강제로%20치환.md)
- Part 2-3 암호화 계열 8개 완료 — [다음: SD36. 같은 포트번호의 다중 연결](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD36.%20같은%20포트번호의%20다중%20연결%20—%20SO_REUSEPORT%20신중%20사용으로%20치환.md)
