---
title: "D0. 워밍업 — common·guard·log 뼈대 타자 연습"
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D0. 워밍업 — `common.h` · `log.h` · `safe.h` · `guard.h` 백지 타자

> **쓰는 템플릿**: [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md)
>
> **목표 시간**: 1회차 20분 / 2회차 12분 / **3회차 8분**
>
> **하루 시작할 때 매일 친다.**
> 이것만 손에 붙으면 나머지 드릴이 절반으로 줄어든다.
>
> **기준 헤더**: [`c-playgound/common/`](https://github.com/sweetpark/c-playgound/tree/main/common)
> 이 드릴의 정답은 [종합본 §3](개발%20%28CS%29/언어/C언어/실습/[C]%20종합본%20—%20안전한%20C%20코딩%20체크리스트와%20방어%20매크로.md) 과 같은 헤더다.
> 헤더가 바뀌면 이 노트도 같이 고친다.

> [!NOTE] 이 드릴의 문서 구성 (D0~D9 공통)
> ① **요구사항서** — 무엇을 만드나, 표로 확정한다.
> ② **pseudo code 템플릿** — 보고 치는 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 이게 통과하면 끝이다.
> ④ 자주 하는 실수
>
> D0 은 함수가 아니라 **헤더 4개**를 치는 드릴이라 모범답안 대신 기준 헤더 링크를 쓴다.

---

## 0. 이 드릴로 체화할 것

| 손이 기억해야 하는 것 | 왜 |
| :--- | :--- |
| `typedef enum { RET_OK = 0, ... } ret_t;`<br>**성공 0, 실패 전부 음수** | `if (ret != RET_OK)` 한 줄로 모든 실패를 잡으려고 |
| 매크로는 **무조건** `do { ... } while (0)` | `if (x) CHK_PTR(p); else ...` 가 깨지지 않게 |
| `#_p` (스트링화) 로 **변수 이름을 로그에** 찍는다 | 어느 인자가 NULL 인지 로그만 보고 안다 |
| `SAFE_FREE` 는 `free` 뒤에 **`= NULL`** | double free 를 구조적으로 불가능하게 |
| `#ifndef X / #define X / #endif` 인클루드 가드 | 헤더 중복 포함 |
| 할당 실패는 `CHK_ALLOC*` (`RET_NO_MEM`)<br>인자 NULL 은 `CHK_PTR*` (`RET_INVALID_ARG`) | 로그만 보고 "인자 문제 / 메모리 문제"를 구분하려고 |
| `SAFE_FCLOSE_RET`<br>쓰기 파일은 `fclose` 실패도 `ret` 에 반영 | 쓰기 오류는 `fclose` 에서 드러난다 |
| `LOG_ERRNO` 는 `errno` 를 **먼저 저장**한 뒤 출력 | 로그 안의 `time` / `localtime_r` 이 `errno` 를 덮을 수 있다 |
| `SAFE_CPY` 는 배열 전용<br>포인터를 넘기면 **컴파일 에러** (`IS_ARRAY`) | `sizeof(포인터)=8` 로 조용히 잘리는 사고 방지 |

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 기본 헤더 4개 | ① 요구사항서<br>② pseudo code **전체** | 1. 주석 뼈대를 보고 **손으로** 친다 (복붙 금지).<br>2. ③ 테스트를 실행한다. |
| **2회차** | **B** A + `CHK_STR*` · `CHK_RANGE_GOTO` · `SAFE_CPY` | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. 번호만 보고 쓴다.<br>2. ③ 테스트를 실행한다. |
| **3회차** | **C** B + `CHK_NOT_NEG` 직접 설계 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 친다. |

### 작업 준비 (처음 한 번만)

```bash
mkdir -p ~/cdrill/d0_warmup/src ~/cdrill/d0_warmup/test ~/cdrill/build && cd ~/cdrill
git init
printf 'tags\ncscope.*\nbuild/\n*.o\n' > .gitignore    # ★ tags 는 생성물이라 커밋하지 않는다
```

`\` (줄 잇기) 정렬이 가장 번거로우니 **손으로 맞추지 않는다.**
`.clang-format` 한 장으로 해결한다.

```bash
printf 'BasedOnStyle: LLVM\nIndentWidth: 4\nColumnLimit: 80\nAlignEscapedNewlines: Left\nUseTab: Never\n' > ~/cdrill/.clang-format
```

| 하고 싶은 것 | vim 에서 |
| :--- | :--- |
| 헤더 전체 정렬 (`\` 포함) | `:%!clang-format` |
| 매크로 하나만 | `V` 로 매크로 줄 선택<br>`:!clang-format` |
| `\` 를 먼저 다 쓰고 나중에 맞추기 | 줄 끝에 `\` 만 대충 붙이고 위 명령 실행 |
| 줄 끝 `\` 뒤 공백 에러 | `:%s/\\\s\+$/\\/`<br>(`\` 뒤에 공백이 있으면 매크로가 깨진다) |

> [!TIP] 타이핑 순서
> 매크로 본문을 **먼저 `\` 없이** 한 덩어리로 쓴다.
> 다 쓴 뒤 `:%!clang-format` 으로 `\` 를 자동으로 붙이고 정렬한다.
>
> clang-format 은 이미 `\` 로 이어진 매크로의 `\` 를 정렬해 준다.
> `\` 없이 줄바꿈만 한 매크로는 안 이어주므로, 이어 붙일 때만 `\` 를 직접 친다.

---

## 1. 요구사항서

`d0_warmup/src/` 에 **헤더 4개** 와 시험 대상 `take.c` / `take.h` 를 만든다.

정식판을 그대로 재현하는 게 아니라, 아래 표의 항목이 들어 있고 §3 테스트가 통과하면 합격이다.

`guard.h` 는 `safe.h` 를 include 한다.
그래서 `#include "guard.h"` 하나로 `CHK_*` 와 `SAFE_*` 를 모두 쓴다.

### 1-1. `common.h`

| 항목 | 요구사항 |
| :--- | :--- |
| 인클루드 가드 | `COMMON_H` |
| `ret_t` | 성공은 `RET_OK = 0` 하나, 실패는 전부 음수.<br>최소 5종: `RET_FAIL`(-1) / `RET_INVALID_ARG`(-2) / `RET_NO_MEM`(-3) / `RET_IO_ERROR`(-8) 과 `RET_OK` |
| `ret_str(int)` | 코드를 이름 문자열로 돌려준다.<br>`"OK"` `"FAIL"` `"INVALID_ARG"` `"NO_MEM"` `"IO_ERROR"`<br>모르는 값은 `"UNKNOWN"` |
| 선언 방식 | 헤더에 두므로 `static inline` |

### 1-2. `log.h`

| 항목 | 요구사항 |
| :--- | :--- |
| 레벨 | `log_level_t`: `LOG_LV_ERR < WRN < INF < DBG` (값 0부터) |
| 전역 | `extern log_level_t g_log_level;`<br>실체는 `.c` 한 곳에만 정의한다. |
| `LOG_ERR/WRN/INF/DBG` | `[시각][태그] 메시지` 를 stderr 로 출력한다.<br>현재 레벨보다 낮은 로그는 출력하지 않는다.<br>가변 인자가 0개여도 컴파일된다. |
| `LOG_ERRNO(fmt, ...)` | `errno` 를 **먼저 저장**하고 `메시지: strerror(errno)(errno)` 를 `LOG_ERR` 로 출력한다. |

### 1-3. `safe.h`

| 매크로 | 요구사항 |
| :--- | :--- |
| `SAFE_FREE(p)` | NULL 이 아니면 `free` 후 `p = NULL` |
| `SAFE_FCLOSE(fp)` | NULL 이 아니면 `fclose` 후 `fp = NULL` |
| `SAFE_CLOSE(fd)` | `fd >= 0` 이면 `close` 후 `fd = -1` |
| `SAFE_FCLOSE_RET(fp, rv)` | `SAFE_FCLOSE` 와 같다.<br>추가로 `fclose` 가 실패하고 `rv` 가 아직 `RET_OK` 이면 `rv = RET_IO_ERROR`.<br>이미 실패한 `rv` 는 덮어쓰지 않는다. |
| (B) `IS_ARRAY(a)` | 배열이면 1, 포인터면 0 |
| (B) `SAFE_CPY(dst, src)` | 항상 널 종단이 되는 `snprintf` 복사.<br>`src` 가 NULL 이면 빈 문자열.<br>`dst` 가 포인터면 **컴파일 에러**. |

### 1-4. `guard.h`

모든 매크로는 `do { } while (0)` 이고, 인자는 `( )` 로 감싸며, **인자를 두 번 평가하지 않는다.**
로그에는 인자 이름(`#`)과 `__func__`, `__LINE__` 을 같이 찍는다.

| 매크로 | 조건 | 동작 |
| :--- | :--- | :--- |
| `CHK_PTR(p)` | `p == NULL` | 로그 + `return RET_INVALID_ARG` |
| `CHK_ALLOC(p)` | `p == NULL` | 로그 + `return RET_NO_MEM` |
| `CHK_RANGE(v, min, max)` | 범위 밖 | 로그(이름·값·범위) + `return RET_INVALID_ARG` |
| `CHK_RET(expr)` | `expr != RET_OK` | 로그 + **그 값 그대로** `return` |
| `CHK_PTR_GOTO(p, rv, label)` | `p == NULL` | `rv = RET_INVALID_ARG`, 로그, `goto label` |
| `CHK_ALLOC_GOTO(p, rv, label)` | `p == NULL` | `rv = RET_NO_MEM`, 로그, `goto label` |
| `CHK_RET_GOTO(expr, rv, label)` | `rv = expr` 가 `RET_OK` 가 아님 | 로그, `goto label` |
| `CHK_COND_GOTO(cond, code, rv, label)` | `cond` 가 거짓 | `rv = code`, 로그, `goto label` |
| (B) `CHK_STR(s)` | NULL 또는 빈 문자열 | 로그 + `return RET_INVALID_ARG` |
| (B) `CHK_STR_GOTO(s, rv, label)` | NULL 또는 빈 문자열 | `rv = RET_INVALID_ARG`, 로그, `goto label` |
| (B) `CHK_RANGE_GOTO(v, min, max, rv, label)` | 범위 밖 | `rv = RET_INVALID_ARG`, 로그, `goto label` |
| (C) `CHK_NOT_NEG(fd)` | `fd < 0` | 로그 + `return RET_INVALID_ARG` (직접 설계, 이름은 `CHK_NOT_NEG`) |

### 1-5. 시험 대상 `take.c` / `take.h`

| 함수 | 요구사항 |
| :--- | :--- |
| `int take_ptr(const char *s, int v)` | `s` 가 NULL 이거나 `v` 가 0~100 밖이면 `RET_INVALID_ARG`.<br>통과하면 로그를 남기고 `RET_OK`. |
| `int take_res(const char *path)` | `path` NULL 은 `RET_INVALID_ARG` (즉시 return).<br>64바이트를 `calloc` 하고 `path` 를 읽기로 연다.<br>할당 실패는 `RET_NO_MEM`, 열기 실패는 `RET_IO_ERROR` (원인은 `LOG_ERRNO`).<br>하위 호출 `take_ptr("inner", 10)` 의 실패는 그대로 전파한다.<br>**어느 경로로 나가든 누수가 없다** (`goto CLEANUP` 단일 출구). |

### 1-6. 빌드

* `-Wall -Wextra -Werror -std=c11` 에서 경고 0.
* `localtime_r` 때문에 `-D_POSIX_C_SOURCE=200809L` 이 필요하다.
* `-fsanitize=address,undefined` 리포트 0.

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 아래 뼈대를 `d0_warmup/src/` 의 각 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 막히면 `man` / `K` 로 찾고, 그래도 막히면 정답지(1번 문서)나 기준 헤더를 연다.
>
> `[ ]` 는 다 쓰면 `x` 로 바꾼다.
> 남은 항목은 `grep -n '\[ \]' *.h` 로 모아 볼 수 있다.

### Level 1 — 주석 뼈대 (1회차, 전부 본다)

#### common.h

```c
/* common.h — 프로젝트 공통
 *
 * [필요한 것 → 헤더]  (사용하는 것만 include, 사용처를 옆에 적는다)
 *  - printf, FILE, fopen ............ <stdio.h>
 *  - calloc, free .................. <stdlib.h>
 *  - memset, strlen ................ <string.h>
 *  - uint8_t ... 고정폭 정수 ........ <stdint.h>
 *  - errno, strerror(errno) ........ <errno.h>
 */

/* [ ] 1. 인클루드 가드: COMMON_H  (파일 맨 위 / 맨 아래 주석 포함) */
/* [ ] 2. 위 표의 헤더 include */
/* [ ] 3. 리턴코드 enum (ret_t)
 *        - 성공은 0 하나, 실패는 전부 음수
 *        - 최소 5종: 성공 / 일반실패 / 잘못된 인자 / 메모리 부족 / IO 에러
 *        - 마지막 줄 쉼표, 이름은 RET_ 접두어, typedef 이름은 ret_t */
/* [ ] 4. ret_str(int) — 코드를 문자열로
 *        - 헤더에 두므로 'static inline'  (왜? .c 가 여러 개여도 중복 정의 안 나게)
 *        - switch 의 마지막은 default: "UNKNOWN" */
```

#### log.h

```c
/* log.h — 최소 로그
 *
 * [필요한 것 → 헤더]
 *  - fprintf, stderr ............... <stdio.h>
 *  - strerror ...................... <string.h>
 *  - errno ......................... <errno.h>
 *  - time, localtime_r, strftime ... <time.h>   (localtime_r 이 왜 _r 인지 man 으로 확인)
 *    -std=c11 이면 localtime_r 이 선언되지 않는다 → 빌드에 -D_POSIX_C_SOURCE=200809L
 */

/* [ ] 1. 인클루드 가드: LOG_H */
/* [ ] 2. 로그 레벨 enum (log_level_t): ERR < WRN < INF < DBG  (값 0부터) */
/* [ ] 3. 전역 레벨 변수 선언
 *        - 'extern' 만 쓴다 (실체는 .c 에 딱 하나)
 *        - 이유를 한 줄로 적어본다 */
/* [ ] 4. LOG_PRINT(레벨, 태그, 포맷, ...) 공통 매크로
 *        - 전체를 do { } while (0) 로 감싼다
 *        - 현재 레벨보다 낮은 로그는 출력하지 않는다 (if 를 매크로 안에서)
 *        - 시각 문자열 "YYYY-MM-DD HH:MM:SS" (버퍼 20바이트)
 *        - stderr 로 "[시각][태그] 메시지\n"
 *        - 가변 인자가 0개여도 컴파일돼야 한다 → ##__VA_ARGS__ (왜? 앞 쉼표 제거)
 *        - 매크로 인자 이름은 _ 로 시작 (_lv, _fmt ...) : 지역변수와 안 겹치게 */
/* [ ] 5. LOG_ERR / LOG_WRN / LOG_INF / LOG_DBG  4개
 *        - LOG_PRINT 에 레벨과 태그 문자열만 바꿔 넘기는 한 줄짜리 */
/* [ ] 6. LOG_ERRNO(_fmt, ...) : "메시지: strerror(errno)(errno)" 를 LOG_ERR 로
 *        - 첫 줄에서 int _e = errno; 로 먼저 저장한다
 *          (왜? LOG_PRINT 안의 time/localtime_r 이 errno 를 바꿀 수 있다) */
```

#### safe.h

```c
/* safe.h — 해제 매크로
 *
 * [필요한 것 → 헤더]
 *  - free ........................... <stdlib.h>
 *  - fclose ......................... <stdio.h>
 *  - close .......................... <unistd.h>   (man 2 close 로 확인)
 *  - RET_IO_ERROR ................... common.h
 *
 * [공통 규칙]
 *  - do { } while (0), 정의 끝에 ';' 없음
 *  - 인자는 단순 변수만 (SAFE_FREE(p++) 금지)
 */

/* [ ] 1. 인클루드 가드: SAFE_H, include 는 위 표대로 */
/* [ ] 2. SAFE_FREE(_p)     : NULL 아니면 free 후 NULL 대입 */
/* [ ] 3. SAFE_FCLOSE(_fp)  : NULL 아니면 fclose 후 NULL 대입 */
/* [ ] 4. SAFE_CLOSE(_fd)   : 0 이상이면 close 후 -1 대입  (fd 는 '-1' 이 무효값) */
/* [ ] 5. SAFE_FCLOSE_RET(_fp,_rv) : 쓰기 파일용
 *        - fclose 가 0 이 아니고 _rv 가 아직 RET_OK 일 때만 _rv = RET_IO_ERROR
 *          (왜 '아직 RET_OK 일 때만'? 먼저 난 실패의 원인을 보존하려고)
 *        - 어느 쪽이든 마지막에 _fp = NULL */

/* [B 회차] IS_ARRAY(_a) : __builtin_types_compatible_p + __typeof__ (GCC/Clang 전용) */
/* [B 회차] SAFE_CPY(_dst,_src) : 항상 널 종단 snprintf.
 *          _dst 가 포인터면 컴파일 에러가 나야 한다
 *          (sizeof(char[IS_ARRAY(_dst) ? 1 : -1]) 트릭)
 *          — 왜 포인터면 안 되나? */
```

#### guard.h

```c
/* guard.h — 가드 매크로
 *
 * [필요한 것]
 *  - common.h : RET_ 코드, ret_str
 *  - log.h    : LOG_ERR
 *  - safe.h   : SAFE_*  (guard.h 가 같이 include)
 *
 * [공통 규칙]  모든 매크로에 적용
 *  - do { } while (0) 로 감싼다. 정의 끝에 ';' 를 붙이지 않는다
 *  - 인자는 쓸 때마다 ( ) 로 감싼다
 *  - 인자를 두 번 평가하지 않는다 (함수 호출이 들어와도 한 번만 실행)
 *  - 로그에 "인자 이름" 과 __func__, __LINE__ 을 같이 찍는다 (# 연산자)
 */

/* [ ] 1. 인클루드 가드: GUARD_H */
/* [ ] 2. #include 3종 (common.h / log.h / safe.h) */

/* ── 즉시 return 판 (자원을 잡기 전) ── */
/* [ ] 3. CHK_PTR(_p)        : NULL 이면 로그 + RET_INVALID_ARG 리턴 */
/* [ ] 4. CHK_RANGE(_v,_min,_max) : 범위 밖이면 로그(이름·값·범위) + RET_INVALID_ARG
 *                                  값은 (int) 캐스팅 후 %d 로 */
/* [ ] 5. CHK_RET(_expr)     : _expr 의 결과가 RET_OK 가 아니면 로그 + 그 값 그대로 리턴
 *                              (지역변수 하나에 담아 한 번만 평가) */

/* ── goto 판 (자원을 잡은 후) — 함수 안에 'int ret' 가 있다고 가정 ── */
/* [ ] 6. CHK_PTR_GOTO(_p,_rv,_label)       : NULL → _rv 세팅, 로그, goto */
/* [ ] 7. CHK_RET_GOTO(_expr,_rv,_label)    : _rv = _expr; 실패면 로그, goto */
/* [ ] 8. CHK_COND_GOTO(_cond,_code,_rv,_label) : 조건이 거짓이면 _rv = _code, 로그, goto */

/* ── 할당 판 (할당 실패는 INVALID_ARG 가 아니라 NO_MEM) ── */
/* [ ] 9.  CHK_ALLOC(_p)                  : NULL 이면 로그 + RET_NO_MEM 리턴 */
/* [ ] 10. CHK_ALLOC_GOTO(_p,_rv,_label)  : NULL → _rv = RET_NO_MEM, 로그, goto */

/* ※ 해제 판(SAFE_*)은 safe.h 로 분리했다. guard.h 는 safe.h 를 include 한다. */

/* [B 회차] CHK_STR(_s) / CHK_STR_GOTO(_s,_rv,_label) : NULL 또는 빈 문자열이면 INVALID_ARG */
/* [B 회차] CHK_RANGE_GOTO(_v,_min,_max,_rv,_label)   : 범위 밖이면 로그 + _rv = INVALID_ARG, goto */
/* [C 회차] CHK_NOT_NEG(_fd) : 직접 설계 (음수면 로그 + RET_INVALID_ARG) */
```

#### take.c

```c
/* take.c — 위 매크로를 전부 한 번씩 호출해서 확인
 *
 * [필요한 것]
 *  - common.h / log.h / guard.h  (순서: 내 헤더는 표준 헤더 뒤)
 *  - g_log_level 의 실체는 여기가 아니라 테스트(test_take.c) 에 있다  ← extern 선언의 짝
 */

/* [ ] 1. take_ptr(const char *s, int v)   — 즉시 return 판
 *        - CHK_PTR(s)
 *        - CHK_RANGE(v, 0, 100)
 *        - 통과하면 LOG_INF 후 RET_OK */

/* [ ] 2. take_res(const char *path)       — goto 판
 *        ① ret 은 실패로 시작 (int ret = RET_FAIL)
 *        ② 포인터는 NULL, FILE* 도 NULL 로 선언
 *        ③ 자원 잡기 전 검사는 CHK_PTR (즉시 return)
 *        ④ calloc 뒤에는 CHK_ALLOC_GOTO (NO_MEM)
 *        ⑤ fopen 이 NULL 이면 LOG_ERRNO, 이어서 CHK_COND_GOTO (IO_ERROR)
 *        ⑥ 하위 호출은 CHK_RET_GOTO (take_ptr("inner", 10))
 *        ⑦ 끝까지 오면 ret = RET_OK
 *        ⑧ CLEANUP: 잡은 '역순' 으로 SAFE_ 호출, return ret
 *           (쓰기 파일이면 SAFE_FCLOSE_RET) */
```

### Level 2 — 번호와 제목만 (2회차)

```text
common.h  1 가드 / 2 include / 3 ret_t / 4 ret_str
log.h     1 가드 / 2 레벨 enum / 3 extern 전역 / 4 LOG_PRINT / 5 레벨별 4개 / 6 LOG_ERRNO
safe.h    1 가드 / 2 SAFE_FREE / 3 SAFE_FCLOSE / 4 SAFE_CLOSE / 5 SAFE_FCLOSE_RET
          (B) IS_ARRAY / SAFE_CPY
guard.h   1 가드 / 2 include / 3 CHK_PTR / 4 CHK_RANGE / 5 CHK_RET
          6 CHK_PTR_GOTO / 7 CHK_RET_GOTO / 8 CHK_COND_GOTO / 9 CHK_ALLOC / 10 CHK_ALLOC_GOTO
          (B) CHK_STR / CHK_STR_GOTO / CHK_RANGE_GOTO
take.c    1 take_ptr / 2 take_res (① ~ ⑧)
```

### Level 3 — 백지 (3회차)

```text
아무것도 안 본다.
§1 요구사항서와 §3 테스트만 보고 친다.
(C) CHK_NOT_NEG(_fd) 는 §1-4 의 한 줄 요구사항으로 직접 설계한다.
```

### 막혔을 때 찾는 순서

1. 컴파일 에러 문구를 본다.
   `unknown type name` / `implicit declaration` 이면 include 누락이다.
2. `man 3 <함수>` 를 연다 (vim 안에서는 커서를 단어에 놓고 `K`).
   SYNOPSIS 맨 위의 `#include` 를 확인한다.
3. 매크로가 이상하면 `gcc -E d0_warmup/src/take.c | less` 로 전처리 결과를 눈으로 본다.
4. 그래도 안 되면 정답지(1번 문서)의 해당 매크로만 본다.
   전체를 보지 않는다.

> [!TIP] 사용처 찾기
> 함수/매크로 위에 커서를 두고 `:grep -rnw <Ctrl+R><Ctrl+W> .` 를 실행한 뒤 `:copen` 을 연다.
> 정의는 `ctags -R .` 후 `Ctrl+]` / `Ctrl+T` 로 찾는다.
>
> `#define` 매크로도 `Ctrl+]` 로 정의를 찾는다 (universal-ctags 는 기본 포함).
> 헤더의 prototype 까지 태그에 넣으려면 `ctags -R --c-kinds=+p .` 를 쓴다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
d0_warmup/src/common.h  log.h  safe.h  guard.h     헤더 4개
d0_warmup/src/take.h                              take_ptr / take_res 선언
d0_warmup/src/take.c                              §2 take.c 구현
d0_warmup/test/test_take.c                        아래 시험 (g_log_level 정의 포함)
```

> [!IMPORTANT] 시험의 형태 (D1~D9 공통)
> **정상** 한 가지, **경계** 여러 가지, **NULL / 실패** 경로를 각각 확인한다.
> D0 에서는 이 셋을 매크로 하나하나에 적용한다.
>
> 매크로는 `return` / `goto` 를 호출한 함수 안에서 실행하므로, 시험용 작은 함수(`t_*`)를 만들어 그 반환값을 확인한다.

### 3-0. 공통 매크로와 시험 도우미

```c
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include "common.h"
#include "log.h"
#include "guard.h"
#include "take.h"

log_level_t g_log_level = LOG_LV_INF;   /* ★ extern 선언의 실체는 .c 에 딱 하나 */

static int g_fail = 0;

#define T_EQ_INT(_got, _exp)                                            \
    do {                                                                \
        long long _g = (long long)(_got), _e = (long long)(_exp);       \
        if (_g != _e) { g_fail++;                                       \
            printf("  X %s:%d  got=%lld exp=%lld\n",                    \
                   __func__, __LINE__, _g, _e); }                       \
    } while (0)

#define T_EQ_STR(_got, _exp)                                            \
    do {                                                                \
        if (strcmp((_got), (_exp)) != 0) { g_fail++;                    \
            printf("  X %s:%d  got=\"%s\" exp=\"%s\"\n",                \
                   __func__, __LINE__, (_got), (_exp)); }               \
    } while (0)

static int g_cnt = 0;
static int t_count_fail(void) { g_cnt++; return RET_FAIL; }   /* 호출 횟수 세기용 */
```

### 3-A. 변형 A 시험

```c
static int t_alloc(void *p)        { CHK_ALLOC(p); return RET_OK; }
static int t_if_else(const char *p, int f)
{
    if (f) CHK_PTR(p);             /* do-while(0) 가 아니면 이 else 가 깨진다 */
    else   f = 2;
    return RET_OK;
}
static int t_chk_ret(void)         { CHK_RET(t_count_fail()); return RET_OK; }

static int t_ptr_goto(void *p, int *cleaned)
{
    int ret = RET_FAIL;
    *cleaned = 0;
    CHK_PTR_GOTO(p, ret, CLEANUP);
    ret = RET_OK;
CLEANUP:
    *cleaned = 1;
    return ret;
}
static int t_alloc_goto(void *p)
{
    int ret = RET_FAIL;
    CHK_ALLOC_GOTO(p, ret, CLEANUP);
    ret = RET_OK;
CLEANUP:
    return ret;
}
static int t_ret_goto(void)
{
    int ret = RET_FAIL;
    CHK_RET_GOTO(t_count_fail(), ret, CLEANUP);
    ret = RET_OK;
CLEANUP:
    return ret;
}
static int t_cond_goto(int ok)
{
    int ret = RET_FAIL;
    CHK_COND_GOTO(ok, RET_IO_ERROR, ret, CLEANUP);
    ret = RET_OK;
CLEANUP:
    return ret;
}

static void test_common_log(void)
{
    T_EQ_INT(RET_OK, 0);                              /* 성공은 0 */
    T_EQ_INT(RET_FAIL < 0, 1);                        /* 실패는 전부 음수 */
    T_EQ_INT(RET_INVALID_ARG < 0, 1);
    T_EQ_INT(RET_NO_MEM < 0, 1);
    T_EQ_INT(RET_IO_ERROR < 0, 1);
    T_EQ_STR(ret_str(RET_OK), "OK");
    T_EQ_STR(ret_str(RET_INVALID_ARG), "INVALID_ARG");
    T_EQ_STR(ret_str(RET_NO_MEM), "NO_MEM");
    T_EQ_STR(ret_str(RET_IO_ERROR), "IO_ERROR");
    T_EQ_STR(ret_str(-999), "UNKNOWN");
}

static void test_guard(void)
{
    int x = 0, cleaned = 0;

    T_EQ_INT(t_alloc(NULL), RET_NO_MEM);              /* 할당 실패는 NO_MEM */
    T_EQ_INT(t_alloc(&x), RET_OK);
    T_EQ_INT(t_if_else(NULL, 1), RET_INVALID_ARG);    /* if/else 안에서도 안전 */
    T_EQ_INT(t_if_else(NULL, 0), RET_OK);

    g_cnt = 0;
    T_EQ_INT(t_chk_ret(), RET_FAIL);                  /* 실패 값을 그대로 전달 */
    T_EQ_INT(g_cnt, 1);                               /* ★ 인자는 한 번만 평가 */

    T_EQ_INT(t_ptr_goto(NULL, &cleaned), RET_INVALID_ARG);
    T_EQ_INT(cleaned, 1);                             /* goto 로 CLEANUP 에 도착 */
    T_EQ_INT(t_ptr_goto(&x, &cleaned), RET_OK);

    T_EQ_INT(t_alloc_goto(NULL), RET_NO_MEM);
    T_EQ_INT(t_alloc_goto(&x), RET_OK);

    g_cnt = 0;
    T_EQ_INT(t_ret_goto(), RET_FAIL);
    T_EQ_INT(g_cnt, 1);                               /* ★ 한 번만 평가 */

    T_EQ_INT(t_cond_goto(0), RET_IO_ERROR);           /* 넘긴 코드가 rv 에 들어간다 */
    T_EQ_INT(t_cond_goto(1), RET_OK);
}

static void test_safe(void)
{
    char *p   = calloc(1, 8);
    FILE *fp  = tmpfile();
    int   fd  = open("/dev/null", O_RDONLY);
    int   ret = RET_OK;
    FILE *fp2 = tmpfile();

    SAFE_FREE(p);
    T_EQ_INT(p == NULL, 1);                           /* 해제 후 NULL */
    SAFE_FREE(p);                                     /* 두 번 호출해도 안전 */

    SAFE_FCLOSE(fp);
    T_EQ_INT(fp == NULL, 1);
    SAFE_FCLOSE(fp);

    SAFE_CLOSE(fd);
    T_EQ_INT(fd, -1);                                 /* 무효값은 -1 */
    SAFE_CLOSE(fd);
    T_EQ_INT(fd, -1);

    SAFE_FCLOSE_RET(fp2, ret);
    T_EQ_INT(fp2 == NULL, 1);
    T_EQ_INT(ret, RET_OK);                            /* 성공이면 ret 그대로 */

    fp2 = tmpfile();
    ret = RET_NO_MEM;
    SAFE_FCLOSE_RET(fp2, ret);
    T_EQ_INT(ret, RET_NO_MEM);                        /* ★ 먼저 난 실패는 보존 */
}

static void test_take(void)
{
    T_EQ_INT(take_ptr("hi", 10), RET_OK);             /* 정상 */
    T_EQ_INT(take_ptr("hi", 0), RET_OK);              /* 경계: 하한 */
    T_EQ_INT(take_ptr("hi", 100), RET_OK);            /* 경계: 상한 */
    T_EQ_INT(take_ptr("hi", -1), RET_INVALID_ARG);    /* 한 칸 아래 */
    T_EQ_INT(take_ptr("hi", 101), RET_INVALID_ARG);   /* 한 칸 위 */
    T_EQ_INT(take_ptr(NULL, 10), RET_INVALID_ARG);    /* 로그에 "s is NULL" */

    T_EQ_INT(take_res("/dev/null"), RET_OK);          /* 정상 */
    T_EQ_INT(take_res("/no/such/file"), RET_IO_ERROR);/* 로그에 LOG_ERRNO, 누수 없이 */
    T_EQ_INT(take_res(NULL), RET_INVALID_ARG);        /* 자원 잡기 전 즉시 return */
}

int main(void)
{
    test_common_log();
    test_guard();
    test_safe();
    test_take();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B. 변형 B 추가 시험

3-A 의 `main()` 에 `test_b()` 호출을 한 줄 더한다.

```c
static int t_str(const char *s)        { CHK_STR(s); return RET_OK; }
static int t_str_goto(const char *s)
{
    int ret = RET_FAIL;
    CHK_STR_GOTO(s, ret, CLEANUP);
    ret = RET_OK;
CLEANUP:
    return ret;
}
static int t_range_goto(int v)
{
    int ret = RET_FAIL;
    CHK_RANGE_GOTO(v, 1, 10, ret, CLEANUP);
    ret = RET_OK;
CLEANUP:
    return ret;
}

static void test_b(void)
{
    char buf[4];

    T_EQ_INT(t_str("a"), RET_OK);
    T_EQ_INT(t_str(""), RET_INVALID_ARG);             /* 빈 문자열 */
    T_EQ_INT(t_str(NULL), RET_INVALID_ARG);
    T_EQ_INT(t_str_goto("a"), RET_OK);
    T_EQ_INT(t_str_goto(""), RET_INVALID_ARG);
    T_EQ_INT(t_str_goto(NULL), RET_INVALID_ARG);

    T_EQ_INT(t_range_goto(1), RET_OK);                /* 경계 */
    T_EQ_INT(t_range_goto(10), RET_OK);
    T_EQ_INT(t_range_goto(0), RET_INVALID_ARG);
    T_EQ_INT(t_range_goto(11), RET_INVALID_ARG);

    SAFE_CPY(buf, "abcdef");
    T_EQ_STR(buf, "abc");                             /* 항상 널 종단 (잘림) */
    SAFE_CPY(buf, "ab");
    T_EQ_STR(buf, "ab");
    SAFE_CPY(buf, NULL);
    T_EQ_STR(buf, "");                                /* NULL 은 빈 문자열 */
    T_EQ_INT(IS_ARRAY(buf), 1);
}
```

> [!WARNING] 컴파일 에러를 눈으로 확인한다
> `char *q = buf; SAFE_CPY(q, "x");` 를 한 줄 넣어 보면 **컴파일 에러**가 나야 한다.
> 확인했으면 그 줄은 지운다 (남기면 빌드가 깨진다).

### 3-C. 변형 C 추가 시험

`CHK_NOT_NEG` 는 요구사항서의 한 줄만 보고 직접 만든 것이므로, 아래 시험으로 동작을 확인한다.

```c
static int t_not_neg(int fd)           { CHK_NOT_NEG(fd); return RET_OK; }

static void test_c(void)
{
    T_EQ_INT(t_not_neg(0), RET_OK);                   /* 경계: 0 은 정상 */
    T_EQ_INT(t_not_neg(5), RET_OK);
    T_EQ_INT(t_not_neg(-1), RET_INVALID_ARG);         /* 한 칸 아래 */
    T_EQ_INT(t_not_neg(-100), RET_INVALID_ARG);
}
```

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [README 의 공통 Makefile](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 을 `~/cdrill/Makefile` 로 쓴다.

```bash
make D=d0_warmup V=take
```

* 마지막 줄이 **`PASS`** 이고 경고 0, 새니타이저 리포트 0 이면 통과다.
* stderr 에 아래 로그가 **보여야** 한다 (눈으로 확인).
  * `s is NULL (take_ptr/...)` — 인자 **이름**이 찍힌다.
  * `v(999) out of range [0,100]` 형태의 범위 로그.
  * `fopen(/no/such/file): No such file or directory(2)` — `LOG_ERRNO` 출력.
* 안 찍히면 `#_p` 또는 `LOG_ERRNO` 를 잘못 쓴 것이다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g \
>     -Icommon -Id0_warmup/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d0_warmup/src/take.c d0_warmup/test/test_take.c \
>     -o build/d0_warmup_take
> ./build/d0_warmup_take
> ```

> [!WARNING] `-pedantic` 과 `##__VA_ARGS__` 는 충돌할 수 있다
> 템플릿의 `LOG_PRINT` 는 `##__VA_ARGS__` (GCC/Clang 확장) 을 쓴다.
> `-pedantic` 을 켜면 `LOG_INF("hello")` 처럼 가변 인자가 0개인 호출이 경고가 되고, `-Werror` 와 만나 **빌드가 깨질 수 있다.**
>
> 그래서 공통 Makefile 에는 `-pedantic` 을 넣지 않았다.
> 넣고 싶다면 아래 중 하나를 고른다.
> 1. 이 파일에서만 `-pedantic` 을 뺀다 **(권장, 가장 간단)**
> 2. 가변인자를 항상 1개 이상 넘기는 규칙으로 쓴다 (`LOG_INF("%s", "start")`)
>
> **이걸 모르고 "내 코드가 틀렸나" 로 20분 날리는 게 1회차의 전형적인 함정이다.**

---

## 4. 자주 하는 실수

| 증상 | 원인 | 고치는 법 |
| :--- | :--- | :--- |
| `undefined symbol: g_log_level` | `extern` 만 있고 실체가 없다 | `.c` 파일 **딱 하나**에 `log_level_t g_log_level = LOG_LV_INF;` |
| `CHK_RET_GOTO` 가 "`ret` undeclared" | 호출부가 **넘긴 `ret` 변수가 선언돼 있지 않다**<br>(매크로는 `_rv` 인자로 받을 뿐 선언하지 않는다) | 함수 맨 위에 `int ret = RET_FAIL;` 을 먼저 선언 |
| 매크로 끝에 `;` 를 붙여서 에러 | `do{}while(0)` **뒤에는** `;` 를 안 붙인다<br>(호출부에서 붙인다) | 정의 끝은 `while (0)` 로 끝 |
| `CHK_RANGE(v, 0, 100)` 에서 부호 경고 | `size_t` 를 `%d` 로 찍음 | 매크로 안에서 `(int)` 캐스팅 |
| 할당 실패인데 로그/리턴코드가 `INVALID_ARG` | `calloc` 뒤에 `CHK_PTR_GOTO` 를 썼다 | `CHK_ALLOC_GOTO` (`RET_NO_MEM`) |
| `LOG_ERRNO` 가 엉뚱한 에러를 찍음 | 실패와 로그 사이에 다른 호출(`free`, `close`)이 `errno` 를 덮었다 | 실패 **직후** 바로 `LOG_ERRNO` |
| `localtime_r` 암묵적 선언 / 미선언 에러 | `-std=c11` 만 쓰면 `localtime_r` 이 선언되지 않는다 | `-D_POSIX_C_SOURCE=200809L` |
| `SAFE_CPY(p, s)` 가 컴파일 에러 | `p` 가 포인터 — 의도된 에러 | 배열이면 그대로<br>포인터면 `snprintf(p, size, ...)` 나 `str_copy()` |
| `goto CLEANUP` 뒤 "jump bypasses initialization" | 선언을 `goto` **뒤에** 했다 | **모든 지역변수를 함수 맨 위에서** 초기화하며 선언 |
| 테스트의 `g_cnt` 가 2 가 나옴 | 매크로 안에서 `_expr` 을 두 번 썼다 | `int _r = (_expr);` 로 한 번만 평가 |

---

## 관련 노트

- [종합본 — 안전한 C 코딩 체크리스트와 방어 매크로](개발%20%28CS%29/언어/C언어/실습/[C]%20종합본%20—%20안전한%20C%20코딩%20체크리스트와%20방어%20매크로.md) — 헤더 기준·사고 유형 표
- [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md) — 정답지
- [[C] 매크로를 do-while(0)으로 감싸는 이유](개발%20%28CS%29/언어/C언어/전처리기·링키지·함수%20응용/[C]%20매크로를%20do-while%280%29으로%20감싸는%20이유%20—%20여러%20문장을%20안전한%20하나로%20묶기.md)
- [[C] 가변 인자 함수 — stdarg.h로 나만의 printf 만들기](개발%20%28CS%29/언어/C언어/전처리기·링키지·함수%20응용/[C]%20가변%20인자%20함수%20—%20stdarg.h로%20나만의%20printf%20만들기.md)
- [드릴 목록](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/템플릿%20체화%20드릴%20목록.md)
