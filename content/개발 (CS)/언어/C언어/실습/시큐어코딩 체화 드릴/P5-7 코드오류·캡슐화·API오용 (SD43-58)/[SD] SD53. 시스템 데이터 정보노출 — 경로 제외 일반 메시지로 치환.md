---
title: "SD53. 시스템 데이터 정보노출 — 경로 제외 일반 메시지로 치환"
tags: 
created: 2026-09-28
modified: 2026-10-16
---

# SD53. 시스템 데이터 정보노출 — 경로 제외 일반 메시지로 치환

> **원본 항목**: [Part 6. 캡슐화 — 2. 시스템 데이터 정보노출](개발%20%28CS%29/언어/C언어/시큐어코딩/[시큐어코딩]%20Part%206.%20캡슐화.md#2-시스템-데이터-정보노출-cwe-497) `CWE-497`
> **repo 폴더**: `sd53_sysdata/` (빌드·실행은 §3-1)
> **목표 시간**: 1회차 10분 / 2회차 6분 / **3회차 4분**
> Part 6(캡슐화)의 마지막 드릴이다.
> [SD40](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD40.%20오류%20메시지를%20통한%20정보%20노출%20—%20일반%20메시지%20응답으로%20치환.md)과 원인은 같지만("같은 원인의 다른 표현" — 가이드 원문), 이 드릴은 경로·환경변수뿐 아니라 **메모리 주소**까지 시스템 데이터로 다뤄 범위를 넓힌다.

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
  char* path = getenv("PATH");
- fprintf(stderr, "cannot find exe on path %s\n", path);   /* 경로 정보 그대로 노출 */
+ fprintf(stderr, "cannot find exe on path \n");            /* 내부 경로 제외한 일반 메시지 */
```

에러 메시지는 "사용자용(일반화)"과 "운영자용(상세 로그)"을 물리적으로 분리한다.
이 드릴에서는 [SD40](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD40.%20오류%20메시지를%20통한%20정보%20노출%20—%20일반%20메시지%20응답으로%20치환.md)처럼 로그 채널을 따로 두는 대신, 가이드 원문처럼 **아예 그 부분만 메시지에서 생략**하는 더 단순한 치환도 함께 익힌다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 실행 파일 탐색 실패 + 메모리 할당 실패 | ① 요구사항서<br>② pseudo code **전체** | 1. Bad 를 그대로 쳐서 취약점을 관찰한다.<br>2. Good pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 스택 트레이스/함수 이름 노출로 변형 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. Bad 를 치고 취약점을 확인한다.<br>2. 번호만 보고 Good 을 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 프로세스 ID·호스트명 노출로 변형 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 Bad 부터 Good 까지 재현한다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 실행 파일 탐색 실패 + 메모리 할당 실패

실행 파일을 찾지 못하거나 메모리 할당에 실패하면 오류 메시지를 남긴다.
- 오류 메시지에 `PATH` 환경변수나 메모리 주소 같은 시스템 내부 데이터가 포함되어서는 안 된다.

**함수**

```c
void report_exe_not_found_bad(const char *path_env, char *out, size_t out_size);
void report_exe_not_found_good(const char *path_env, char *out, size_t out_size);
void report_alloc_failure_bad(void *ptr, char *out, size_t out_size);
void report_alloc_failure_good(void *ptr, char *out, size_t out_size);
```

#### 신뢰 경계

| 값 | 출처 | 검증 없이 흘러가는 곳 |
| :--- | :--- | :--- |
| `PATH` 환경변수 값 | `getenv("PATH")` | 화면(stderr)에 그대로 찍히는 오류 메시지 |
| 실패한 할당의 포인터 값 | `malloc()` 실패 시점의 인자 | 오류 메시지에 `%p`로 그대로 찍히는 지점 |

#### 공격 입력표

| 상황 | Bad 결과 | 이유 |
| :--- | :--- | :--- |
| 실행 파일 탐색 실패 | **`PATH` 값이 메시지에 그대로 노출** | `%s`로 경로 문자열을 그대로 끼워 넣는다 |
| 메모리 할당 실패 | **메모리 주소가 16진수로 노출**(`0x...`) | `%p`로 포인터 값을 그대로 찍는다 — 공격자가 ASLR을 우회하는 데 쓸 수 있는 메모리 배치 정보다 |
| 같은 상황(Good, 둘 다) | 경로·주소 정보 전혀 없이 일반 메시지만 | 값 자체를 메시지 포맷에서 뺀다 |

### 1-B. 변형 B — 스택 트레이스/함수 이름 노출로 변형

예외 발생 시 `__func__`나 `__FILE__:__LINE__`을 사용자 메시지에 그대로 포함하는 함수를 만들어, 코드 구조 자체가 노출되는 사례까지 확장한다

### 1-C. 변형 C — 프로세스 ID·호스트명 노출로 변형

`getpid()`나 `gethostname()` 결과를 오류 메시지에 넣는 함수로 바꿔, "시스템 데이터"의 범위가 경로·주소를 넘어선다는 걸 확인한다

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 소스 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `report_exe_not_found_good` — Level 1 (1회차, 전부 본다)

먼저 Bad 를 그대로 쳐서 §3 의 `test_bad_is_vulnerable` 이 통과하는지(= 실제로 뚫리는지) 확인한다.
그다음 Good 을 쓴다.

```c
void report_exe_not_found_bad(const char *path_env, char *out, size_t out_size)
{
    /* 1. snprintf(out, out_size, "cannot find exe on path %s\n", path_env)   ← 경로 노출 */
}

void report_alloc_failure_bad(void *ptr, char *out, size_t out_size)
{
    /* 1. snprintf(out, out_size, "malloc failed at address %p\n", ptr)   ← 주소 노출 */
}

void report_exe_not_found_good(const char *path_env, char *out, size_t out_size)
{
    /* [ ] 1. (void)path_env   ← 값을 메시지 조합에 **들이지 않는다** */

    /* [ ] 2. snprintf(out, out_size, "cannot find exe on path \n") */
}

void report_alloc_failure_good(void *ptr, char *out, size_t out_size)
{
    /* [ ] 3. (void)ptr */

    /* [ ] 4. snprintf(out, out_size, "malloc failed\n") */
}
```

### 2-B. `report_exe_not_found_good` — Level 2 (2회차, 번호와 제목만 본다)

```c
void report_exe_not_found_good(const char *path_env, char *out, size_t out_size)
{
    /* [ ] 1. (void)path_env   ← 값을 메시지 조합에 **들이지 않는다** */

    /* [ ] 2. snprintf(out, out_size, "cannot find exe on path \n") */
}

void report_alloc_failure_good(void *ptr, char *out, size_t out_size)
{
    /* [ ] 3. (void)ptr */

    /* [ ] 4. snprintf(out, out_size, "malloc failed\n") */
}
```

### 2-C. `report_exe_not_found_good` — Level 3 (3회차, 백지)

```c
void report_exe_not_found_good(const char *path_env, char *out, size_t out_size)
{
    /* 아무것도 안 본다.
     * §1 요구사항서와 §0 의 치환 규칙만 보고 친다.
     *
     * 막히면 아래만 찾아본다.
     *   - 가리는 게 아니라 **애초에 쓰지 않는다**
     *   - `(void)` 로 미사용 인자 경고 제거
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
sd53_sysdata/src/sysdata.h
sd53_sysdata/src/sysdata.c
sd53_sysdata/test/test.c
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
#include "sysdata.h"

static int g_fail = 0;
#define T_TRUE(cond, msg) \
    do { if (!(cond)) { g_fail++; \
        printf("  X %s:%d %s\n", __func__, __LINE__, msg); } } while (0)

static void test_bad_leaks_path(void)
{
    char out[256];
    report_exe_not_found_bad("/usr/bin:/home/user/.secret_bin", out, sizeof(out));
    T_TRUE(strstr(out, "/home/user/.secret_bin") != NULL,
        "Bad는 PATH 환경변수를 오류 메시지에 그대로 노출해야 한다(취약점 재현)");
}

static void test_good_hides_path(void)
{
    char out[256];
    report_exe_not_found_good("/usr/bin:/home/user/.secret_bin", out, sizeof(out));
    T_TRUE(strstr(out, "/home/user/.secret_bin") == NULL,
        "Good은 오류 메시지에서 내부 경로를 완전히 생략해야 한다");
    T_TRUE(strstr(out, "cannot find exe on path") != NULL,
        "Good도 사용자에게 무엇이 실패했는지는 알려야 한다(경로만 뺀다)");
}

static void test_bad_leaks_address(void)
{
    char out[256];
    void *fake_ptr = (void *)0x55d3a1b2c000UL;
    report_alloc_failure_bad(fake_ptr, out, sizeof(out));
    T_TRUE(strstr(out, "0x") != NULL,
        "Bad는 메모리 주소를 16진수로 그대로 노출해야 한다(ASLR/메모리 배치 정보 유출 재현)");
}

static void test_good_hides_address(void)
{
    char out[256];
    void *fake_ptr = (void *)0x55d3a1b2c000UL;
    report_alloc_failure_good(fake_ptr, out, sizeof(out));
    T_TRUE(strstr(out, "0x") == NULL,
        "Good은 오류 메시지에 메모리 주소를 절대 포함하면 안 된다");
}

int main(void)
{
    test_bad_leaks_path();
    test_good_hides_path();
    test_bad_leaks_address();
    test_good_hides_address();
    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B · 3-C. 변형 B / C 시험

3-A 와 **같은 4종 구조**에서 호출 함수와 입력만 바꾼다.

**변형 B — 스택 트레이스/함수 이름 노출로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `__FILE__:__LINE__` 를 사용자 메시지에 포함 | 코드 구조가 노출 | 고정 일반 메시지 |
| 정상 호출 | 정상 | 정상 |

**변형 C — 프로세스 ID·호스트명 노출로 변형**

| 입력 | Bad | Good |
| :--- | :--- | :--- |
| `getpid()` / `gethostname()` 을 메시지에 포함 | 프로세스·호스트 정보가 노출 | 고정 일반 메시지 |
| 정상 호출 | 정상 | 정상 |

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
make D=sd53_sysdata V=main SRC="sd53_sysdata/src/sysdata.c sd53_sysdata/test/test.c"
```

* 마지막 줄이 **`PASS`** 이고 경고 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Isd53_sysdata/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     sd53_sysdata/src/sysdata.c sd53_sysdata/test/test.c \
>     -pthread -o build/sd53_sysdata_main
> ./build/sd53_sysdata_main
> ```

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| 경로만 신경 쓰고 메모리 주소·PID·호스트명 등은 "시스템 데이터"로 인식 못 함 | CWE-497은 "시스템 데이터" 전반을 다룬다.<br>파일 경로 말고도 프로세스 내부 상태를 드러내는 값(주소, PID, 스레드 ID, 커널 버전 등)은 전부 후속 공격에 쓰일 수 있는 정찰 정보다 |
| "디버그 로그에만 남기면 되니까 그냥 다 찍자"는 태도로 사용자 메시지와 로그를 구분 안 함 | [SD40](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P3-4%20시간·상태·에러처리%20%28SD37-42%29/[SD]%20SD40.%20오류%20메시지를%20통한%20정보%20노출%20—%20일반%20메시지%20응답으로%20치환.md)에서 다룬 채널 분리 원칙이 여기도 그대로 적용된다.<br>"어딘가에 남긴다"와 "사용자 화면에 안 보인다"는 별개의 요구사항이다 |
| `%p` 포맷 자체를 문제라고 생각 | 포맷 지정자가 문제가 아니라, **그 값이 흘러가는 목적지(사용자 화면)가 문제**다.<br>같은 `%p` 출력이라도 접근 통제된 내부 디버그 로그에만 남는다면 이 항목의 위반이 아니다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `sysdata.h` / `sysdata.c`
> ```c
> #ifndef SYSDATA_H
> #define SYSDATA_H
> #include <stddef.h>
> void report_exe_not_found_bad(const char *path_env, char *out, size_t out_size);
> void report_exe_not_found_good(const char *path_env, char *out, size_t out_size);
> void report_alloc_failure_bad(void *ptr, char *out, size_t out_size);
> void report_alloc_failure_good(void *ptr, char *out, size_t out_size);
> #endif
> ```
> ```c
> #include <stdio.h>
> #include "sysdata.h"
>
> void report_exe_not_found_bad(const char *path_env, char *out, size_t out_size)
> {
>     snprintf(out, out_size, "cannot find exe on path %s\n", path_env);
> }
>
> void report_exe_not_found_good(const char *path_env, char *out, size_t out_size)
> {
>     (void)path_env;
>     snprintf(out, out_size, "cannot find exe on path \n");
> }
>
> void report_alloc_failure_bad(void *ptr, char *out, size_t out_size)
> {
>     snprintf(out, out_size, "malloc failed at address %p\n", ptr);
> }
>
> void report_alloc_failure_good(void *ptr, char *out, size_t out_size)
> {
>     (void)ptr;
>     snprintf(out, out_size, "malloc failed\n");
> }
> ```
>
> **눈여겨볼 점**: Good 쪽 두 함수 모두 인자로 받은 값(`path_env`, `ptr`)을 **아예 쓰지 않는다**(`(void)`로 명시적으로 버림).
> 가장 안전한 정보 노출 방지는 "가리기"가 아니라 **"애초에 그 값을 메시지 조합 과정에 들이지 않는 것"**임을 시그니처가 그대로 보여준다.

---

## 관련 노트

- [시큐어코딩 체화 드릴 목록](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/README.md)
- [이전: SD52. 남은 디버그 코드](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD52.%20남은%20디버그%20코드%20—%20빌드%20매크로%20제거로%20치환.md)
- Part 6(캡슐화) 2개 완료 — [다음: SD54. DNS lookup 의존 보안결정](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P5-7%20코드오류·캡슐화·API오용%20%28SD43-58%29/[SD]%20SD54.%20DNS%20lookup에%20의존한%20보안결정%20—%20IP%20화이트리스트로%20치환.md)
