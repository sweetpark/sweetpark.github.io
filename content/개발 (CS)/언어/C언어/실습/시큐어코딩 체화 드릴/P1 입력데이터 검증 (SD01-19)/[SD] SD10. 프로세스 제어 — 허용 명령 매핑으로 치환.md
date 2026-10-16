---
title: "SD10. 프로세스 제어 — 허용 명령 매핑으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD10. 프로세스 제어 — 허용 명령 매핑으로 치환

> **원본 항목**: [Part 1-2. 외부제어·우회 계열 — 10. 프로세스 제어](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-2.%20외부제어·우회%20계열.md#10-프로세스-제어-cwe-114) `CWE-114`
> **repo 폴더**: `sd10_proccontrol/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 15분 / 2회차 9분 / **3회차 6분**
> SD04(OS 명령어 삽입)와 비슷해 보이지만 다르다 — SD04는 "인자"가 오염됐고, 이 항목은 **"실행될 명령/프로그램 이름 자체"** 가 오염된다.
> 방어도 위험 문자 검사가 아니라 **허용 명령 매핑**이다.

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
- snprintf(out, out_size, "%s %s", op, documentName);              /* op 자체가 실행 프로그램명이 됨 */
+ for (매핑 테이블에서 op와 일치하는 항목을 찾는다) {
+     snprintf(out, out_size, "%s %s", 매핑된_고정_명령어, documentName);
+ }
+ /* 매핑에 없으면 거부 */
```

SD04는 `strpbrk` 로 "위험한 문자가 섞였는가"를 봤다.
이 항목은 문자 하나하나가 아니라 **"이 값 자체가 우리가 허락한 명령인가"** 를 통째로 확인한다 — 블랙리스트가 아니라 화이트리스트 매핑.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 문서 변환 명령 조립 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 이미지 리사이즈 명령 조립 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 매핑 테이블을 설정 파일에서 로드 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 문서 변환 명령 조립

요청 파라미터(`op`)와 문서 이름(`documentName`)으로 변환 명령을 조립한다.
- 허용되는 변환은 `DocToHtml`, `DocToPdf` 두 가지뿐이다.
- `op` 값 자체가 그대로 실행 프로그램명이 되어서는 안 되고, 반드시 내부에 정의된 실제 명령어로 치환되어야 한다.

**함수**

```c
int build_convert_command_bad(const char *op, const char *documentName, char *out, size_t out_size);
int build_convert_command_good(const char *op, const char *documentName, char *out, size_t out_size);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `op` | 외부(요청 파라미터) | `system()` 에 전달될 명령어의 **프로그램 이름 부분** |

#### 공격 입력표

| 입력(`op`) | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `"DocToHtml"` (정상) | `"DocToHtml report.doc"` | 정상 동작(단, `op` 값이 그대로 실행 프로그램명이 되므로 근본적으로 취약한 설계다) |
| `"rm -rf /tmp/x; echo pwned"` | **`"rm -rf /tmp/x; echo pwned report.doc"`** | `op` 자체가 임의의 명령으로 대체될 수 있다 |

### 1-B. 변형 B — 이미지 리사이즈 명령 조립

`op` 값이 `{"thumbnail","preview"}` 로 바뀌고, 매핑된 명령에 추가 옵션(`-resize 100x100`)까지 고정으로 붙는 경우

### 1-C. 변형 C — 매핑 테이블을 설정 파일에서 로드

허용 명령 목록을 하드코딩 대신 신뢰할 수 있는 설정 파일에서 읽어오되, "그래도 외부 요청은 여전히 이 테이블의 key(op)만 지정할 뿐 value(실제 명령어)는 알 수도 바꿀 수도 없다"는 원칙이 유지되는지 확인

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `build_convert_command_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int build_convert_command_bad(const char *op, const char *documentName,
                              char *out, size_t out_size)
{
    /* 1. snprintf(out, out_size, "%s %s", op, documentName)
     *    ← op 자체가 실행 프로그램명이 된다
     * 2. 잘렸으면 -1, 아니면 0 */
}

int build_convert_command_good(const char *op, const char *documentName,
                               char *out, size_t out_size)
{
    /* [ ] 1. 매핑 테이블
     *        { "DocToHtml" → "convertDocToHtml", "DocToPdf" → "convertDocToPdf" }
     *        op_map_t { const char *op; const char *command; } */

    /* [ ] 2. op 와 일치하는 항목을 찾는다
     *        strcmp(op, OP_TABLE[i].op) == 0 */

    /* [ ] 3. 찾았으면 **매핑된 command** 로 조립
     *        snprintf(out, out_size, "%s %s", OP_TABLE[i].command, documentName)
     *        잘렸으면 -1, 아니면 0 */

    /* [ ] 4. 못 찾았으면 → return -1 */
}
```

### 2-B. `build_convert_command_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int build_convert_command_good(const char *op, const char *documentName,
                               char *out, size_t out_size)
{
    /* [ ] 1. 매핑 테이블 */

    /* [ ] 2. op 와 일치하는 항목을 찾는다 */

    /* [ ] 3. 찾았으면 **매핑된 command** 로 조립 */

    /* [ ] 4. 못 찾았으면 → return -1 */
}
```

### 2-C. `build_convert_command_good` — Level 3 (3회차, 백지)

```c
int build_convert_command_good(const char *op, const char *documentName,
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `op` 는 키일 뿐 실행되는 값은 항상 테이블 안의 상수
     *   - `snprintf` 반환값으로 잘림 확인
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
sd10_proccontrol/src/doc_convert.h
sd10_proccontrol/src/doc_convert.c
sd10_proccontrol/test/test.c
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
#include "doc_convert.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_is_vulnerable(void)
{
    char buf[128];
    T_TRUE(build_convert_command_bad("rm -rf /tmp/x; echo pwned", "report.doc",
        buf, sizeof(buf)) == 0, "Bad는 조립 자체는 항상 성공해야 한다");
    T_TRUE(strstr(buf, "pwned") != NULL,
        "Bad는 op 문자열이 그대로 명령어가 되어 임의 명령이 섞여 들어가야 한다(취약점 재현)");
}

static void test_bad_normal(void)
{
    char buf[128];
    build_convert_command_bad("DocToHtml", "report.doc", buf, sizeof(buf));
    T_TRUE(strcmp(buf, "DocToHtml report.doc") == 0, "정상 op도 그대로 조립된다");
}

static void test_good_blocks_arbitrary_op(void)
{
    char buf[128];
    T_TRUE(build_convert_command_good("rm -rf /tmp/x; echo pwned", "report.doc",
        buf, sizeof(buf)) == -1, "Good은 매핑에 없는 op를 거부해야 한다");
}

static void test_good_normal(void)
{
    char buf[128];
    T_TRUE(build_convert_command_good("DocToHtml", "report.doc", buf, sizeof(buf)) == 0,
        "매핑에 있는 op는 통과해야 한다");
    T_TRUE(strcmp(buf, "convertDocToHtml report.doc") == 0,
        "실행되는 명령은 사용자 입력이 아니라 매핑된 고정 문자열이어야 한다");
}

int main(void)
{
    test_bad_is_vulnerable();
    test_bad_normal();
    test_good_blocks_arbitrary_op();
    test_good_normal();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!TIP] `test_good_normal` 이 이 드릴의 핵심 확인 지점이다
> 단순히 `op == "DocToHtml"` 이면 통과시키는 게 아니라, **결과 문자열이 `op` 원본이 아니라 매핑된 값(`convertDocToHtml`)으로 바뀌어 있는지**까지 확인한다.
> 이 값이 같으면(우연히 `op`와 매핑 값이 동일하면) SD04의 블랙리스트 방식과 착각하기 쉽다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 이미지 리사이즈 명령 조립**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `op = "thumbnail"` | `thumbnail` 이 그대로 명령 이름 | 고정 옵션이 붙은 `convertThumb -resize 100x100` |
| `op = "rm"` | `rm` 실행 | -1 |

**변형 C — 매핑 테이블을 설정 파일에서 로드**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 설정 파일에 없는 `op` | 그대로 실행 | -1 |
| 설정 파일에 있는 `op` | 정상 | 정상 |

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
make D=sd10_proccontrol V=main SRC="sd10_proccontrol/src/doc_convert.c sd10_proccontrol/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd10_proccontrol/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd10_proccontrol/src/doc_convert.c sd10_proccontrol/test/test.c \
>     -pthread -o build/sd10_proccontrol_main
> ./build/sd10_proccontrol_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `op` 값을 위험 문자 검사(`strpbrk`)로만 거르고 그대로 조립 | SD04의 방식을 그대로 재사용한 것 — 이 항목은 "명령 자체"가 오염되므로 문자 단위 필터로는 `op="malicious_binary"`처럼 셸 메타문자 없이도 임의 프로그램을 실행시키는 공격을 못 막는다 |
| 매핑 테이블에 없는 `op` 에 대해 기본 명령을 실행 | "모르면 거부"가 원칙이다.<br>모르는 값에 기본 동작을 주면 그 자체가 새로운 화이트리스트 우회 경로가 된다 |
| 매핑을 `strcmp` 대신 `strstr`(부분 일치)로 검사 | `"DocToHtml; rm -rf /"` 가 `"DocToHtml"` 을 부분 문자열로 포함한다는 이유로 통과해버릴 수 있다 — 반드시 완전 일치 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `doc_convert.h` / `doc_convert.c`
> **헤더 (`doc_convert.h`)**
> ```c
> #ifndef DOC_CONVERT_H
> #define DOC_CONVERT_H
> #include <stddef.h>
> int build_convert_command_bad(const char *op, const char *documentName, char *out, size_t out_size);
> int build_convert_command_good(const char *op, const char *documentName, char *out, size_t out_size);
> #endif
> ```
> **구현 (`doc_convert.c`)**
> ```c
> #include <stdio.h>
> #include <string.h>
> #include "doc_convert.h"
>
> int build_convert_command_bad(const char *op, const char *documentName, char *out, size_t out_size)
> {
>     int n = snprintf(out, out_size, "%s %s", op, documentName);
>     return (n >= 0 && (size_t)n < out_size) ? 0 : -1;
> }
>
> typedef struct { const char *op; const char *command; } op_map_t;
> static const op_map_t OP_TABLE[] = {
>     { "DocToHtml", "convertDocToHtml" },
>     { "DocToPdf",  "convertDocToPdf"  },
> };
> #define OP_TABLE_SIZE (sizeof(OP_TABLE)/sizeof(OP_TABLE[0]))
>
> int build_convert_command_good(const char *op, const char *documentName, char *out, size_t out_size)
> {
>     size_t i;
>     for (i = 0; i < OP_TABLE_SIZE; i++) {
>         if (strcmp(op, OP_TABLE[i].op) == 0) {
>             int n = snprintf(out, out_size, "%s %s", OP_TABLE[i].command, documentName);
>             return (n >= 0 && (size_t)n < out_size) ? 0 : -1;
>         }
>     }
>     return -1;
> }
> ```
>
> **눈여겨볼 점**: 최종적으로 `system()`(또는 mock)에 넘어가는 문자열의 **첫 단어가 사용자 입력에서 온 적이 없다** — `OP_TABLE[i].command` 는 100% 코드 내부 상수다.
> `op` 는 "테이블의 키를 고르는 이름표" 역할만 하고, 실행되는 값에는 전혀 관여하지 않는다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD09. 시스템·구성 설정 외부 제어](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD09.%20시스템·구성%20설정의%20외부%20제어%20—%20인덱스%20간접참조로%20치환.md)
- Part 1-2 외부제어·우회 계열 3개 완료 — 다음은 [1-3. 메모리 경계 계열](개발%20%28CS%29/언어/C언어/시큐어코딩/Part%201.%20입력데이터%20검증%20및%20표현/[시큐어코딩]%201-3.%20메모리%20경계%20계열.md) 대응 드릴(SD11~SD16)
