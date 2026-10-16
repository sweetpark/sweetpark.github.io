---
title: "SD55. 위험하다고 알려진 함수 사용 — fork 치환으로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD55. 위험하다고 알려진 함수 사용 — fork 치환으로 치환

> **원본 항목**: [Part 7. API 오용 — 2. 위험하다고 알려진 함수 사용](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%207.%20API%20오용.md#2-위험하다고-알려진-함수-사용-cwe-242) `CWE-242`
> **repo 폴더**: `sd55_dangerfunc/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> 가이드 원문의 `gets()`는 이미 C11 표준과 최신 glibc에서 **완전히 제거**돼 이 프로젝트 환경에서는 아예 호출 자체가 불가능하다 — 그 사실 자체가 "위험 함수는 감싸지 말고 금지·치환하라"는 이 항목의 교훈을 가장 강력하게 보여준다.
> 그래서 이 드릴은 원문의 두 번째 예시, **실제로 호출 가능한 `vfork()`**로 같은 교훈을 재현한다.

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
  int shared_var = 100;
- pid_t pid = vfork();       /* 자식이 부모 공간을 빌려 씀 */
+ pid_t pid = fork();        /* 부모와 별도 공간 사용 */
  if (pid == 0) {
      shared_var = 999;
      _exit(0);
  }
  waitpid(pid, NULL, 0);
  return shared_var;
```

"고칠 수 없는 함수"는 감싸지 말고 목록으로 금지하고 치환한다.
`vfork()`는 입력값을 아무리 검증해도 위험한 채로 남는다 — 함수 **자체의 계약**(자식이 부모의 주소 공간을 그대로 빌려 쓴다)이 문제이기 때문이다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 자식 프로세스에서 값 계산 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** `gets()` 금지를 문서로 재현 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 위험 함수 목록을 코드에 강제하기 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 자식 프로세스에서 값 계산

별도 프로세스에서 값을 계산한 뒤 부모는 자신의 상태를 그대로 유지해야 한다.
- 자식 프로세스의 작업이 부모의 메모리에 영향을 줘서는 안 된다.

**함수**

```c
int demonstrate_vfork_bad(void);
int demonstrate_fork_good(void);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| (해당 없음) | — | `vfork()` 함수 자체의 계약(주소 공간 공유)이 결함이다 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| `vfork()`로 자식 생성 후 자식이 스택 변수 수정 | **부모의 값까지 `999`로 바뀜**(취약점 재현) | `vfork()`는 `exec`/`_exit` 전까지 자식이 부모와 **같은 주소 공간**을 쓴다고 명세돼 있다 |
| 같은 상황(Good, `fork()`) | 부모 값은 `100`으로 그대로 유지 | `fork()`는 자식에게 독립된(Copy-on-Write) 주소 공간을 준다 |

### 1-B. 변형 B — `gets()` 금지를 문서로 재현

실제 호출은 불가능하므로, 대신 "왜 안 되는가"를 `fgets()`와 비교하는 표(크기 인자 유무)로 정리하고, 컴파일러가 `gets`를 만나면 어떤 에러/경고를 내는지 직접 `gets(buf);` 한 줄만 넣어 컴파일해보고 에러 메시지를 기록한다

### 1-C. 변형 C — 위험 함수 목록을 코드에 강제하기

[부록 — 위험함수 치환표](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20부록%20—%20위험함수%20치환표·암호화%20기준표·PQC%20전환.md)에서 3개를 골라, `#pragma GCC poison`(clang도 지원)으로 해당 함수들을 소스에서 아예 못 쓰게 막는 헤더를 만들어본다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `demonstrate_fork_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
int demonstrate_vfork_bad(void)
{
    /* 1. int shared_var = 100
     * 2. pid = vfork()   ← 자식이 부모의 주소 공간을 빌려 쓴다
     * 3. pid == 0 이면 shared_var = 999, _exit(0)
     * 4. waitpid(pid, NULL, 0)
     * 5. return shared_var   ← 부모 값이 999 로 오염 */
}

int demonstrate_fork_good(void)
{
    /* [ ] 1. int shared_var = 100 */

    /* [ ] 2. pid = fork()   ← vfork 대신 이 한 단어만 바뀐다 */

    /* [ ] 3. pid == 0 이면 (자식)
     *        shared_var = 999   ← 자식만의 복사본
     *        _exit(0) */

    /* [ ] 4. waitpid(pid, NULL, 0) */

    /* [ ] 5. return shared_var   ← 부모 값은 그대로 100 */
}
```

### 2-B. `demonstrate_fork_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
int demonstrate_fork_good(void)
{
    /* [ ] 1. int shared_var = 100 */

    /* [ ] 2. pid = fork()   ← vfork 대신 이 한 단어만 바뀐다 */

    /* [ ] 3. pid == 0 이면 (자식) */

    /* [ ] 4. waitpid(pid, NULL, 0) */

    /* [ ] 5. return shared_var   ← 부모 값은 그대로 100 */
}
```

### 2-C. `demonstrate_fork_good` — Level 3 (3회차, 백지)

```c
int demonstrate_fork_good(void)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - `vfork` 의 계약 자체가 문제 (입력 검증으로는 못 막는다)
     *   - 자식은 `exit` 이 아니라 `_exit`
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
sd55_dangerfunc/src/dangerfunc.h
sd55_dangerfunc/src/dangerfunc.c
sd55_dangerfunc/test/test.c
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
#include "dangerfunc.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_vfork_corrupts_parent(void)
{
    int r = demonstrate_vfork_bad();
    T_TRUE(r == 999,
        "vfork는 자식이 부모와 주소 공간을 공유해 부모의 스택 변수까지 바꿔버려야 한다(취약점 재현)");
}

static void test_good_fork_isolates_parent(void)
{
    int r = demonstrate_fork_good();
    T_TRUE(r == 100,
        "fork는 자식이 독립된 복사본에서 동작해 부모 값이 그대로 보존돼야 한다");
}

int main(void)
{
    test_bad_vfork_corrupts_parent();
    test_good_fork_isolates_parent();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

> [!NOTE] `gets()`가 이 프로젝트에서 왜 아예 호출 불가능한가
> `gets()`는 크기 인자를 받을 방법이 원천적으로 없는 시그니처(`char *gets(char *s)`) 때문에 C11 표준에서 완전히 삭제됐고, 최신 glibc(이 환경 포함)는 링크 심볼조차 제공하지 않는다.
> "위험 함수는 고쳐 쓰지 말고 치환하라"는 이 항목의 원칙을 언어와 표준 라이브러리 차원에서 이미 실현한 사례다.

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — `gets()` 금지를 문서로 재현**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `gets()` 를 `fgets()` 와 비교 | 크기 인자가 없다 | 크기 인자를 받는다 |
| 짧은 입력 | 정상 | 정상 |

**변형 C — 위험 함수 목록을 코드에 강제하기**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| 위험 함수 목록 (`gets`, `strcpy`, `vfork` ...) 을 코드에 강제 | 목록이 없다 | 목록에 있으면 빌드/검사 실패 |
| 목록에 없는 함수 | 통과 | 통과 |

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
make D=sd55_dangerfunc V=main SRC="sd55_dangerfunc/src/dangerfunc.c sd55_dangerfunc/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd55_dangerfunc/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd55_dangerfunc/src/dangerfunc.c sd55_dangerfunc/test/test.c \
>     -pthread -o build/sd55_dangerfunc_main
> ./build/sd55_dangerfunc_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| "자식에서 부모 변수를 안 건드리면 vfork도 안전하다"고 생각 | 이론적으로는 맞지만, 그 규칙을 지키는 걸 컴파일러도 리뷰어도 강제할 수 없다.<br>"조심해서 쓰면 안전한 함수"는 결국 언젠가 실수로 위반된다 — 그래서 애초에 금지 목록에 올린다 |
| `vfork()`를 `fork()`로 바꾸면 성능이 크게 나빠진다고 걱정 | 현대 리눅스의 `fork()`는 Copy-on-Write로 구현돼 있어 실제 메모리 복사가 거의 일어나지 않는다.<br>`vfork()`가 필요한 성능상의 이유는 대부분의 애플리케이션 코드에는 해당하지 않는다 |
| 위험 함수 목록을 "예전에 취약했던 함수들"로만 이해 | `gets()`처럼 아예 표준에서 삭제된 사례도 있듯, 이 목록은 고정된 게 아니라 계속 갱신된다.<br>새 프로젝트를 시작할 때마다 [위험함수 치환표](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20부록%20—%20위험함수%20치환표·암호화%20기준표·PQC%20전환.md)를 다시 확인하는 습관이 필요하다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `dangerfunc.h` / `dangerfunc.c`
> ```c
> #ifndef DANGERFUNC_H
> #define DANGERFUNC_H
> int demonstrate_vfork_bad(void);
> int demonstrate_fork_good(void);
> #endif
> ```
> ```c
> #define _DEFAULT_SOURCE
> #include <unistd.h>
> #include <sys/wait.h>
> #include "dangerfunc.h"
>
> int demonstrate_vfork_bad(void)
> {
>     int shared_var = 100;
>     pid_t pid = vfork();
>     if (pid == 0) {
>         shared_var = 999;      /* 자식이 부모의 스택 변수를 직접 변경 -- 부모 공간을 빌려 씀 */
>         _exit(0);
>     }
>     waitpid(pid, NULL, 0);
>     return shared_var;          /* vfork 이후 부모 값이 오염됨 */
> }
>
> int demonstrate_fork_good(void)
> {
>     int shared_var = 100;
>     pid_t pid = fork();
>     if (pid == 0) {
>         shared_var = 999;       /* 자식만의 독립된 복사본을 변경 -- 부모는 영향 없음 */
>         _exit(0);
>     }
>     waitpid(pid, NULL, 0);
>     return shared_var;           /* 부모 값은 그대로 100 */
> }
> ```
>
> **눈여겨볼 점**: 두 함수는 `vfork()` ↔ `fork()` **한 단어**만 다르다.
> 이 항목의 핵심은 "복잡한 재작성"이 아니라 **"위험 함수 이름을 안전한 대안으로 바꿔 부르는 것"** 그 자체가 치환의 전부인 경우가 많다는 것이다 — 대신 그 한 단어를 놓치면 안 된다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD54. DNS lookup에 의존한 보안결정](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD54.%20DNS%20lookup에%20의존한%20보안결정%20—%20IP%20화이트리스트로%20치환.md)
- [다음: SD56. chroot Jail 작업디렉터리](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD56.%20작업%20디렉터리%20변경%20없는%20chroot%20Jail%20생성%20—%20chdir%20동반으로%20치환.md)
