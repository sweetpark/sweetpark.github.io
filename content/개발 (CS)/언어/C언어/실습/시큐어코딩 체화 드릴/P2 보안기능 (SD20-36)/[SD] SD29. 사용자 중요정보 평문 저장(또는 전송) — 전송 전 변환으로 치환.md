---
title: "SD29. 사용자 중요정보 평문 저장(또는 전송) — 전송 전 변환으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD29. 사용자 중요정보 평문 저장(또는 전송) — 전송 전 변환으로 치환

> **원본 항목**: [Part 2-3. 암호화 계열 — 10. 사용자 중요정보 평문 저장(또는 전송)](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%202.%20보안기능/[시큐어코딩]%202-3.%20암호화%20계열.md#10-사용자-중요정보-평문-저장또는-전송-cwe-311) `CWE-311`
> **repo 폴더**: `sd29_plaintextstore/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 12분 / 2회차 7분 / **3회차 5분**

> [!WARNING] 이 드릴의 `xor_mask`는 실제 암호화가 아니다
> XOR 마스킹은 "저장/전송되는 값이 원본과 달라야 한다"는 **구조**만 보여주는 자리표시자다.
> 실무에서는 SD28에서 고른 검증된 알고리즘(AES-GCM 등)으로 교체한다.

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
- strncpy(out, pw, out_size - 1); out[out_size-1] = '\0';   /* 그대로 전송/저장 */
+ xor_mask(pw, out, out_size);                               /* 원본과 다른 값으로 변환 후 전송/저장 */
```

"내부망이라 괜찮다"는 없다.
저장할 때뿐 아니라 통신채널을 지날 때도 암호화해야 한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 인증 패킷 조립 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 로그 기록 시 마스킹 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 주민등록번호 등 개인정보로 확장 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 인증 패킷 조립

로그인 패킷에 실을 패스워드 필드를 준비한다.
- 패킷에 담기는 값은 원본 패스워드와 달라야 한다.
- 정당한 수신자는 원본을 복원할 수 있어야 한다(암호화는 은닉이지 파기가 아니다).

**함수**

```c
void prepare_for_send_bad(const char *pw, char *out, size_t out_size);
void prepare_for_send_good(const char *pw, char *out, size_t out_size);
void undo_mask(const char *masked, char *out, size_t out_size);
```

#### 공격 입력표

| 값 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `mypassword123` | **패킷에 그대로 실림** | 스니핑 한 번으로 그대로 노출 |

### 1-B. 변형 B — 로그 기록 시 마스킹

디버그 로그에 패스워드 필드를 남길 때도 같은 원리 적용 — 단, 로그는 "복원 불필요"이므로 되돌릴 수 없는 마스킹(`****`)으로 바꿔도 됨을 비교해본다

### 1-C. 변형 C — 주민등록번호 등 개인정보로 확장

여러 필드(주민번호, 카드번호)를 한 번에 마스킹하는 구조체 단위 변환 함수로 확장

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `prepare_for_send_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void prepare_for_send_bad(const char *pw, char *out, size_t out_size)
{
    /* 1. strncpy(out, pw, out_size - 1)
     * 2. out[out_size - 1] = '\0'   ← 원본 그대로 전송/저장 */
}

void prepare_for_send_good(const char *pw, char *out, size_t out_size)
{
    /* [ ] 1. xor_mask(in, out, out_size) 를 먼저 만든다
     *        i + 1 < out_size 이고 in[i] 가 있는 동안
     *            out[i] = in[i] ^ 0x5A
     *        out[i] = '\0' */

    /* [ ] 2. xor_mask(pw, out, out_size) 호출 */
}

void undo_mask(const char *masked, char *out, size_t out_size)
{
    /* [ ] 3. xor_mask(masked, out, out_size)   ← XOR 은 대칭이라 같은 함수로 복원 */
}
```

### 2-B. `prepare_for_send_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void prepare_for_send_good(const char *pw, char *out, size_t out_size)
{
    /* [ ] 1. xor_mask(in, out, out_size) 를 먼저 만든다 */

    /* [ ] 2. xor_mask(pw, out, out_size) 호출 */
}

void undo_mask(const char *masked, char *out, size_t out_size)
{
    /* [ ] 3. xor_mask(masked, out, out_size)   ← XOR 은 대칭이라 같은 함수로 복원 */
}
```

### 2-C. `prepare_for_send_good` — Level 3 (3회차, 백지)

```c
void prepare_for_send_good(const char *pw, char *out, size_t out_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `char` 와 `0x5A` 의 XOR 결과를 `(char)` 로 캐스팅
     *   - 복원이 되는지 `undo_mask` 로 시험
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
sd29_plaintextstore/src/secure_transmit.h
sd29_plaintextstore/src/secure_transmit.c
sd29_plaintextstore/test/test.c
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
#include "secure_transmit.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char out[64];
    prepare_for_send_bad("mypassword123", out, sizeof(out));
    T_TRUE(strcmp(out, "mypassword123") == 0,
        "Bad는 전송/저장 직전에도 원본 패스워드가 그대로 노출되어야 한다(취약점 재현)");
}

static void test_good_hides_plaintext(void)
{
    char out[64];
    prepare_for_send_good("mypassword123", out, sizeof(out));
    T_TRUE(strcmp(out, "mypassword123") != 0,
        "Good은 전송/저장되는 값이 원본과 달라야 한다(평문 노출 없음)");
}

static void test_good_is_reversible_by_the_right_party(void)
{
    char masked[64], restored[64];
    prepare_for_send_good("mypassword123", masked, sizeof(masked));
    undo_mask(masked, restored, sizeof(restored));
    T_TRUE(strcmp(restored, "mypassword123") == 0,
        "정당한 수신자는 원본을 복원할 수 있어야 한다(암호화의 목적은 은닉이지 손실이 아님)");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_good_hides_plaintext();
    test_good_is_reversible_by_the_right_party();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 로그 기록 시 마스킹**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 로그에 패스워드를 남길 때 | 평문이 남는다 | `****` 로 마스킹 (복원 불필요) |
| 패스워드 필드가 없는 로그 | 그대로 | 그대로 |

**변형 C — 주민등록번호 등 개인정보로 확장**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 주민번호·카드번호 구조체 | 평문 전송 | 필드별로 변환 |
| 민감하지 않은 필드 | 그대로 | 그대로 |

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
make D=sd29_plaintextstore V=main SRC="sd29_plaintextstore/src/secure_transmit.c sd29_plaintextstore/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd29_plaintextstore/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd29_plaintextstore/src/secure_transmit.c sd29_plaintextstore/test/test.c \
>     -pthread -o build/sd29_plaintextstore_main
> ./build/sd29_plaintextstore_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "복원 불가능한 변환"(단방향 해시)을 인증 패킷에 적용 | 로그인 패킷은 서버가 원본과 대조해야 하므로 **양방향(암호화)** 이어야 한다.<br>단방향(해시)은 SD32~33(저장용)과 다른 용도다 — 용도별로 방식이 다르다는 걸 구분한다 |
| `test_good_hides_plaintext` 만 확인하고 복원 테스트를 생략 | "숨기기만 하고 다시 못 꺼내면" 암호화가 아니라 그냥 데이터 파괴다.<br>두 시험이 한 쌍이어야 의미가 있다 |
| 이 드릴의 `xor_mask` 를 실전 코드에 그대로 가져다 씀 | 이 드릴은 원리 시연용이다.<br>실전에서는 반드시 SD28의 화이트리스트를 통과한 검증된 알고리즘을 쓴다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `secure_transmit.h` / `secure_transmit.c`
> **헤더 (`secure_transmit.h`)**
> ```c
> #ifndef SECURE_TRANSMIT_H
> #define SECURE_TRANSMIT_H
> #include <stddef.h>
> void prepare_for_send_bad(const char *pw, char *out, size_t out_size);
> void prepare_for_send_good(const char *pw, char *out, size_t out_size);
> void undo_mask(const char *masked, char *out, size_t out_size);
> #endif
> ```
> **구현 (`secure_transmit.c`)**
> ```c
> #include <string.h>
> #include "secure_transmit.h"
>
> void prepare_for_send_bad(const char *pw, char *out, size_t out_size)
> {
>     strncpy(out, pw, out_size - 1);
>     out[out_size - 1] = '\0';
> }
>
> static void xor_mask(const char *in, char *out, size_t out_size)
> {
>     size_t i;
>     for (i = 0; i + 1 < out_size && in[i]; i++) out[i] = (char)(in[i] ^ 0x5A);
>     out[i] = '\0';
> }
>
> void prepare_for_send_good(const char *pw, char *out, size_t out_size)
> {
>     xor_mask(pw, out, out_size);
> }
>
> void undo_mask(const char *masked, char *out, size_t out_size)
> {
>     xor_mask(masked, out, out_size);   /* XOR은 대칭이라 같은 함수로 복원된다 */
> }
> ```
>
> **눈여겨볼 점**: `undo_mask` 가 `xor_mask` 를 **한 번 더 호출하는 것만으로 원복**된다 — XOR의 대칭성 때문이다.
> 실전 암호화(AES 등)에서는 암호화/복호화 함수가 분리되지만, "변환 후 저장·전송, 필요할 때 역변환"이라는 골격 자체는 동일하다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD28. 취약한 암호화 알고리즘 사용](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD28.%20취약한%20암호화%20알고리즘%20사용%20—%20식별자%20화이트리스트%20검증으로%20치환.md)
- [다음: SD30. 충분하지 못한 키 길이](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P2%20보안기능%20%28SD20-36%29/[SD]%20SD30.%20충분하지%20못한%20키%20길이%20사용%20—%20최소%20길이%20상수%20검증으로%20치환.md)
