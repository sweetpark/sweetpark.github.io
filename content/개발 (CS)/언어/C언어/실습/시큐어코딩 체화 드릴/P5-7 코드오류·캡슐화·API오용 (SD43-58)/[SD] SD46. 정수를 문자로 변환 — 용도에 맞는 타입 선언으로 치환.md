---
title: "SD46. 정수를 문자로 변환 — 용도에 맞는 타입 선언으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD46. 정수를 문자로 변환 — 용도에 맞는 타입 선언으로 치환

> **원본 항목**: [Part 5. 코드 오류 — 4. 정수를 문자로 변환](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%205.%20코드%20오류.md#4-정수를-문자로-변환-cwe-398) `CWE-398`
> **repo 폴더**: `sd46_int2char/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> [SD18](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD18.%20의도하지%20않은%20부호%20확장%20—%20원본%20타입으로%20직접%20검사하도록%20치환.md)과 같은 계열의 문제(구현정의 잘림)지만 크래시가 아니라 **"값이 조용히 손상된다"**는 데 초점을 둔다.
> ASan/UBSan은 이 잘림 자체를 잡아주지 않는다 — 타입 설계로만 막을 수 있다.

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
- typedef struct { char offsets_bad[MAX_LINES]; } doc_bad_t;   /* 오프셋을 char 배열에 */
- doc->offsets_bad[line] = (char)offset;                        /* 255 초과 시 잘림 */
+ typedef struct { int  offsets_good[MAX_LINES]; } doc_good_t;  /* 용도에 맞는 int 배열 */
+ doc->offsets_good[line] = offset;
```

`char`는 "문자 하나"를 담을 때만 쓴다.
오프셋·카운터·길이처럼 "숫자"를 담아야 한다면, 그 숫자가 실제로 가질 수 있는 범위를 담을 수 있는 타입(`int` 등)을 선언해야 한다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 문서 줄 오프셋 저장 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 네트워크 패킷 카운터로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** `short`로 한 단계만 키워서 "고친 척"하기 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 문서 줄 오프셋 저장

문서의 각 줄이 시작하는 바이트 오프셋을 저장한다.
- 오프셋은 파일 크기에 따라 255를 훨씬 넘을 수 있다.
- 저장한 오프셋은 나중에 그대로 정확히 읽혀야 한다.

**함수**

```c
void store_offset_bad(doc_bad_t *doc, int line, int offset);
int  load_offset_bad(doc_bad_t *doc, int line);
void store_offset_good(doc_good_t *doc, int line, int offset);
int  load_offset_good(doc_good_t *doc, int line);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `offset`(4바이트 정수 오프셋) | 문서 파싱 결과 | 1바이트 `char` 배열 원소에 대입되는 지점 |

#### 공격 입력표

| 입력(`offset`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `1000`(255 초과) | **`232`로 저장됨**(`1000 % 256`) | `char`는 1바이트라 상위 비트가 그냥 잘려나간다 |
| `100`(255 이하) | `100`(정상) | 저장 가능한 범위 안이라 우연히 문제가 안 드러난다 |
| `1000`(Good) | `1000`(정확) | `int` 배열이라 애초에 잘릴 여지가 없다 |

### 1-B. 변형 B — 네트워크 패킷 카운터로 변형

`char packet_count`처럼 8비트로 패킷 수를 세다가 256개째부터 `0`으로 돌아가 카운터가 리셋되는 시나리오로 바꿔본다(실무에서 자주 나오는 변형)

### 1-C. 변형 C — `short`로 한 단계만 키워서 "고친 척"하기

`char`를 `short`(보통 2바이트, 최대 32767)로만 바꾼 버전을 만들어, 값이 `100000`처럼 더 커지면 여전히 잘린다는 걸 확인한다 — "타입을 조금 키우는 것"과 "용도에 맞는 타입을 쓰는 것"은 다르다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `f` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
typedef struct { char offsets_bad[MAX_LINES]; } doc_bad_t;

void store_offset_bad(doc_bad_t *doc, int line, int offset)
{
    /* 1. doc->offsets_bad[line] = (char)offset   ← 255 초과 시 잘린다 */
}

int load_offset_bad(doc_bad_t *doc, int line)
{
    /* 1. return (int)(unsigned char)doc->offsets_bad[line] */
}

typedef struct { int offsets_good[MAX_LINES]; } doc_good_t;

void store_offset_good(doc_good_t *doc, int line, int offset)
{
    /* [ ] 1. 구조체 정의의 원소 타입을 char → int 로 바꾼다
     *        MAX_LINES 4 */

    /* [ ] 2. doc->offsets_good[line] = offset   ← 대입문은 똑같다 */
}

int load_offset_good(doc_good_t *doc, int line)
{
    /* [ ] 3. return doc->offsets_good[line] */
}
```

### 2-B. `f` — Level 2 (2회차, 번호와 제목만 본다)

```c
typedef struct { int offsets_good[MAX_LINES]; } doc_good_t;

void store_offset_good(doc_good_t *doc, int line, int offset)
{
    /* [ ] 1. 구조체 정의의 원소 타입을 char → int 로 바꾼다 */

    /* [ ] 2. doc->offsets_good[line] = offset   ← 대입문은 똑같다 */
}

int load_offset_good(doc_good_t *doc, int line)
{
    /* [ ] 3. return doc->offsets_good[line] */
}
```

### 2-C. `f` — Level 3 (3회차, 백지)

```c
typedef struct { int offsets_good[MAX_LINES]; } doc_good_t;
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `char` 는 "문자 하나" 일 때만 쓴다
     *   - 문제는 로직이 아니라 **선언**
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
sd46_int2char/src/int2char.h
sd46_int2char/src/int2char.c
sd46_int2char/test/test.c
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
#include "int2char.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_truncates(void)
{
    doc_bad_t doc;
    memset(&doc, 0, sizeof(doc));
    int big_offset = 1000;   /* char 범위(255)를 훨씬 초과 */

    store_offset_bad(&doc, 0, big_offset);
    int got = load_offset_bad(&doc, 0);

    T_TRUE(got != big_offset,
        "Bad는 char 배열에 저장하면서 1000이 잘려 원래 값과 달라져야 한다(취약점 재현)");
    T_TRUE(got == (big_offset % 256),
        "Bad에서 손실된 값은 하위 8비트(모듈로 256)만 남아야 한다");
}

static void test_bad_normal_small_value(void)
{
    doc_bad_t doc;
    memset(&doc, 0, sizeof(doc));
    store_offset_bad(&doc, 0, 100);
    T_TRUE(load_offset_bad(&doc, 0) == 100, "255 이하 값은 Bad에서도 그대로 보존돼야 한다");
}

static void test_good_preserves_value(void)
{
    doc_good_t doc;
    memset(&doc, 0, sizeof(doc));
    int big_offset = 1000;

    store_offset_good(&doc, 0, big_offset);
    int got = load_offset_good(&doc, 0);

    T_TRUE(got == big_offset, "Good은 int 배열에 저장하므로 값이 그대로 보존돼야 한다");
}

int main(void)
{
    test_bad_truncates();
    test_bad_normal_small_value();
    test_good_preserves_value();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] 왜 ASan/UBSan이 이 잘림을 안 잡아주는가
> `int`를 `char`에 대입하는 것은 표준이 명시적으로 허용하는 **구현정의(implementation-defined)** 동작이지, 정의되지 않은 동작(UB)이 아니다.
> UBSan은 "정의되지 않은 동작"만 감시하므로 이 잘림은 통과시킨다.
> [SD18](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD18.%20의도하지%20않은%20부호%20확장%20—%20원본%20타입으로%20직접%20검사하도록%20치환.md)에서 확인한 것과 정확히 같은 이유다 — **타입 선택은 새니타이저가 대신해줄 수 없는, 설계자의 책임**이다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 네트워크 패킷 카운터로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `char packet_count` 로 256 개째 | 0 으로 돌아가 카운터가 리셋 | `int` 카운터는 계속 증가 |
| 255 개 | 255 | 255 |

**변형 C — `short`로 한 단계만 키워서 "고친 척"하기**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `short` 로만 키운 버전, 값 `100000` | 여전히 잘린다 | `int` 는 그대로 `100000` |
| 값 `300` | 정상 | 정상 |

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
make D=sd46_int2char V=main SRC="sd46_int2char/src/int2char.c sd46_int2char/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd46_int2char/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd46_int2char/src/int2char.c sd46_int2char/test/test.c \
>     -pthread -o build/sd46_int2char_main
> ./build/sd46_int2char_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 저장 전에 `if (offset > 255) offset = 255;`로 값을 깎아서 "고쳤다"고 생각 | 값을 조작해서 저장하면 원래 오프셋이 영구히 손실된다.<br>요구사항은 "오프셋이 그대로 읽혀야 한다"이지 "잘려도 괜찮다"가 아니다.<br>저장소 타입 자체를 바꾸는 것이 유일한 근본 해결책이다 |
| `signed char`와 `unsigned char`의 차이를 신경 안 씀 | 플랫폼에 따라 평범한 `char`가 부호 있는지 없는지가 다르다(구현정의).<br>이 드릴의 `load_offset_bad`가 `(unsigned char)`로 캐스팅한 이유가 바로 이 차이를 일관되게 다루기 위해서다 |
| "255 이하 값만 쓰니까 안전하다"고 지금 상태만 보고 판단 | 지금은 255 이하만 들어와도, 문서가 커지거나 입력 소스가 바뀌면 언제든 초과 값이 들어올 수 있다.<br>타입은 "지금 들어오는 값"이 아니라 "논리적으로 가질 수 있는 값의 범위"에 맞춰 선언해야 한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `int2char.h` / `int2char.c`
> ```c
> #ifndef INT2CHAR_H
> #define INT2CHAR_H
> #define MAX_LINES 4
> typedef struct { char offsets_bad[MAX_LINES]; } doc_bad_t;
> typedef struct { int  offsets_good[MAX_LINES]; } doc_good_t;
> void store_offset_bad(doc_bad_t *doc, int line, int offset);
> int  load_offset_bad(doc_bad_t *doc, int line);
> void store_offset_good(doc_good_t *doc, int line, int offset);
> int  load_offset_good(doc_good_t *doc, int line);
> #endif
> ```
> ```c
> #include "int2char.h"
>
> void store_offset_bad(doc_bad_t *doc, int line, int offset)
> {
>     doc->offsets_bad[line] = (char)offset;      /* 255 초과 시 잘림 */
> }
>
> int load_offset_bad(doc_bad_t *doc, int line)
> {
>     return (int)(unsigned char)doc->offsets_bad[line];
> }
>
> void store_offset_good(doc_good_t *doc, int line, int offset)
> {
>     doc->offsets_good[line] = offset;            /* 용도에 맞는 타입이라 잘림 없음 */
> }
>
> int load_offset_good(doc_good_t *doc, int line)
> {
>     return doc->offsets_good[line];
> }
> ```
>
> **눈여겨볼 점**: `store_offset_bad`와 `store_offset_good`의 대입문(`doc->offsets_X[line] = ...`) 자체는 문법적으로 거의 똑같다.
> 차이는 오직 **구조체 정의에서 배열의 원소 타입**(`char` vs `int`) 하나다.
> 이 항목 전체가 "코드 로직"이 아니라 "선언"의 문제라는 걸 보여준다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD45. 부호→무부호 변환 오류](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD45.%20부호%20정수를%20무부호%20정수로%20타입%20변환%20오류%20—%20안전한%20에러값으로%20치환.md)
- [다음: SD47. 스택 변수 주소 리턴](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD47.%20스택%20변수%20주소%20리턴%20—%20힙%20할당%20반환으로%20치환.md)
