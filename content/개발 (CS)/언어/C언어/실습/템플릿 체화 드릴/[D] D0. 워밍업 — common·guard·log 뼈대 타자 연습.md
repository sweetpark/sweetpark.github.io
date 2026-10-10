---
title: "D0. 워밍업 — common·guard·log 뼈대 타자 연습"
tags: 
created: 2026-09-21
modified: 2026-10-10
---

# D0. 워밍업 — `common.h` · `guard.h` · `log.h` 백지 타자

> **쓰는 템플릿**: [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md)
> **목표 시간**: 1회차 20분 / 2회차 12분 / **3회차 8분**
> **하루 시작할 때 매일 친다.** 이것만 손에 붙으면 나머지 드릴이 절반으로 줄어든다.

---

## 0. 이 드릴로 체화할 것

| 손이 기억해야 하는 것 | 왜 |
| :--- | :--- |
| `typedef enum { RET_OK = 0, ... } ret_t;` **성공 0, 실패 전부 음수** | `if (ret != RET_OK)` 한 줄로 모든 실패를 잡으려고 |
| 매크로는 **무조건** `do { ... } while (0)` | `if (x) CHK_PTR(p); else ...` 가 깨지지 않게 |
| `#_p` (스트링화) 로 **변수 이름을 로그에** 찍는다 | 어느 인자가 NULL 인지 로그만 보고 안다 |
| `SAFE_FREE` 는 `free` 뒤에 **`= NULL`** | double free 를 구조적으로 불가능하게 |
| `#ifndef X / #define X / #endif` 인클루드 가드 | 헤더 중복 포함 |

---

## 1. 미션

`~/cdrill/d0_warmup/src/` 에 **헤더 3개 + `main.c`** 를 만들고 빌드한다.
**정식판을 그대로 재현하는 게 아니라, 아래 "최소 합격 목록"이 들어있으면 통과다.**

### 최소 합격 목록

```text
common.h   ret_t (최소 5종) / ret_str()
log.h      LOG_ERR, LOG_INF  (레벨 전역 g_log_level, do-while(0))
guard.h    CHK_PTR / CHK_RANGE / CHK_RET
           CHK_PTR_GOTO / CHK_RET_GOTO / CHK_COND_GOTO
           SAFE_FREE / SAFE_FCLOSE / SAFE_CLOSE
main.c     위 매크로를 전부 한 번씩 실제로 호출해서 동작 확인
```

### 회차별 변형

| 회차 | 변형 | 볼 수 있는 것 |
| :--- | :--- | :--- |
| **A (1회차)** | 그대로 친다 (복붙 금지, **보고 손으로**) | 1번 문서 전체 |
| **B (2회차)** | `CHK_STR` + `SAFE_CPY` 추가 | 위 "최소 합격 목록"만 |
| **C (3회차)** | **백지.** 추가로 `CHK_NOT_NEG(_fd)` 를 직접 설계 | 아무것도 안 봄 |

---

## 1-1. 작업 준비 — 폴더 · gitignore · 포맷터

```bash
mkdir -p ~/cdrill/d0_warmup/src ~/cdrill/build && cd ~/cdrill
git init
printf 'tags\ncscope.*\nbuild/\n*.o\n' > .gitignore    # ★ tags 는 생성물이라 커밋하지 않는다
```

`\` (줄 잇기) 정렬이 가장 번거로우니 **손으로 맞추지 않는다.** `.clang-format` 한 장으로 해결한다.

```bash
printf 'BasedOnStyle: LLVM\nIndentWidth: 4\nColumnLimit: 80\nAlignEscapedNewlines: Left\nUseTab: Never\n' > ~/cdrill/.clang-format
```

| 하고 싶은 것 | vim 에서 |
| :--- | :--- |
| 헤더 전체 정렬 (`\` 포함) | `:%!clang-format` |
| 매크로 하나만 | `V` 로 매크로 줄 선택 → `:!clang-format` |
| `\` 를 먼저 다 쓰고 나중에 맞추기 | 줄 끝에 `\` 만 대충 붙이고 위 명령 실행 |
| 줄 끝 `\` 뒤 공백 에러 | `:%s/\\\s\+$/\\/` (`\` 뒤에 공백이 있으면 매크로가 깨진다) |

> [!TIP] 타이핑 순서
> 매크로 본문을 **먼저 `\` 없이** 한 덩어리로 쓰고, 다 쓴 뒤 `:%!clang-format` 으로 `\` 를 자동으로 붙이고 정렬한다.
> (clang-format 은 이미 `\` 로 이어진 매크로의 `\` 를 정렬해 준다. `\` 없이 줄바꿈만 한 매크로는 안 이어주므로, 이어 붙일 때만 `\` 를 직접 친다.)

---

## 1-2. 주석 뼈대 — 보고 직접 타이핑

> **사용법**: 아래 뼈대를 `d0_warmup/src/` 의 각 파일에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.** 막히면 `man` / `K` 로 찾고, 그래도 막히면 정답지(1번 문서)를 연다.
> `[ ]` 는 다 쓰면 `x` 로 바꾼다. 남은 항목은 `grep -n '\[ \]' *.h` 로 모아 볼 수 있다.

### common.h

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

### log.h

```c
/* log.h — 최소 로그
 *
 * [필요한 것 → 헤더]
 *  - fprintf, stderr ............... <stdio.h>
 *  - time, localtime_r, strftime ... <time.h>   (localtime_r 이 왜 _r 인지 man 으로 확인)
 */

/* [ ] 1. 인클루드 가드: LOG_H */
/* [ ] 2. 로그 레벨 enum (log_level_t): ERR < WRN < INF < DBG  (값 0부터) */
/* [ ] 3. 전역 레벨 변수 선언
 *        - 'extern' 만 쓴다 (실체는 main.c 에 딱 하나)  ← 이유를 한 줄로 적어본다 */
/* [ ] 4. LOG_PRINT(레벨, 태그, 포맷, ...) 공통 매크로
 *        - 전체를 do { } while (0) 로 감싼다
 *        - 현재 레벨보다 낮은 로그는 출력하지 않는다 (if 를 매크로 안에서)
 *        - 시각 문자열 "YYYY-MM-DD HH:MM:SS" (버퍼 20바이트)
 *        - stderr 로 "[시각][태그] 메시지\n"
 *        - 가변 인자가 0개여도 컴파일돼야 한다 → ##__VA_ARGS__ (왜? 앞 쉼표 제거)
 *        - 매크로 인자 이름은 _ 로 시작 (_lv, _fmt ...) : 지역변수와 안 겹치게 */
/* [ ] 5. LOG_ERR / LOG_WRN / LOG_INF / LOG_DBG  4개
 *        - LOG_PRINT 에 레벨과 태그 문자열만 바꿔 넘기는 한 줄짜리 */
```

### guard.h

```c
/* guard.h — 가드 매크로
 *
 * [필요한 것]
 *  - common.h : RET_ 코드, ret_str
 *  - log.h    : LOG_ERR
 *  - close()  : <unistd.h>  ← SAFE_CLOSE 에 필요 (man 2 close 로 확인)
 *
 * [공통 규칙]  모든 매크로에 적용
 *  - do { } while (0) 로 감싼다. 정의 끝에 ';' 를 붙이지 않는다
 *  - 인자는 쓸 때마다 ( ) 로 감싼다
 *  - 인자를 두 번 평가하지 않는다 (함수 호출이 들어와도 한 번만 실행)
 *  - 로그에 "인자 이름" 과 __func__, __LINE__ 을 같이 찍는다 (# 연산자)
 */

/* [ ] 1. 인클루드 가드: GUARD_H */
/* [ ] 2. #include 3종 */

/* ── 즉시 return 판 (자원을 잡기 전) ── */
/* [ ] 3. CHK_PTR(_p)        : NULL 이면 로그 + RET_INVALID_ARG 리턴 */
/* [ ] 4. CHK_RANGE(_v,_min,_max) : 범위 밖이면 로그(이름·값·범위) + RET_INVALID_ARG
 *                                  값은 (int) 캐스팅 후 %d 로 */
/* [ ] 5. CHK_RET(_expr)     : _expr 의 결과가 RET_OK 가 아니면 로그 + 그 값 그대로 리턴
 *                              (지역변수 하나에 담아 한 번만 평가) */

/* ── goto 판 (자원을 잡은 후) — 함수 안에 'int ret' 가 있다고 가정 ── */
/* [ ] 6. CHK_PTR_GOTO(_p,_label)          : NULL → ret 세팅, 로그, goto */
/* [ ] 7. CHK_RET_GOTO(_expr,_label)       : ret = _expr; 실패면 로그, goto */
/* [ ] 8. CHK_COND_GOTO(_cond,_ret,_label) : 조건이 거짓이면 ret = _ret, 로그, goto */

/* ── 해제 판 ── */
/* [ ] 9.  SAFE_FREE(_p)     : NULL 아니면 free 후 NULL 대입 */
/* [ ] 10. SAFE_FCLOSE(_fp)  : NULL 아니면 fclose 후 NULL 대입 */
/* [ ] 11. SAFE_CLOSE(_fd)   : 0 이상이면 close 후 -1 대입  (fd 는 '-1' 이 무효값) */

/* [B 회차] CHK_STR(_s) : NULL 또는 빈 문자열이면 INVALID_ARG */
/* [B 회차] SAFE_CPY(_dst,_src) : 항상 널 종단. _dst 는 '배열' 일 때만 맞다 — 왜? */
/* [C 회차] CHK_NOT_NEG(_fd)    : 직접 설계 (음수면 에러. 어떤 ret 을 쓸지는 내가 정한다) */
```

### main.c

```c
/* main.c — 위 매크로를 전부 한 번씩 호출해서 확인
 *
 * [필요한 것]
 *  - common.h / log.h / guard.h  (순서: 내 헤더는 표준 헤더 뒤)
 *  - g_log_level 의 실체 정의 한 곳  ← extern 선언의 짝
 */

/* [ ] 1. g_log_level 정의 (초기값 INF) */
/* [ ] 2. take_ptr(const char *s, int v)   — 즉시 return 판: CHK_PTR, CHK_RANGE 사용 */
/* [ ] 3. take_res(const char *path)       — goto 판
 *        ① ret 은 실패로 시작 ② 포인터 NULL / 이어서 FILE* NULL
 *        ③ 자원 잡기 전 검사는 CHK_PTR
 *        ④ calloc → CHK_PTR_GOTO / fopen → CHK_COND_GOTO(IO_ERROR) / 하위 호출 → CHK_RET_GOTO
 *        ⑤ 끝까지 오면 RET_OK
 *        ⑥ CLEANUP: 잡은 '역순' 으로 SAFE_ 호출, return ret */
/* [ ] 4. main() — case1~4 를 호출하고 LOG_INF 로 ret_str(ret)(ret) 출력 */
```

### 막혔을 때 찾는 순서

```text
1. 컴파일 에러 문구 → "unknown type name" / "implicit declaration" = include 누락
2. man 3 <함수>   (vim 안에서는 커서를 단어에 놓고 K)  → SYNOPSIS 맨 위의 #include
3. 매크로가 이상하면  clang -E src/main.c | less   (전처리 결과를 눈으로 본다)
4. 그래도 안 되면 정답지(1번 문서)의 해당 매크로만 본다 — 전체를 보지 않는다
```

> [!TIP] 사용처 찾기
> 함수/매크로 위에 커서를 두고 `:grep -rnw <Ctrl+R><Ctrl+W> .` → `:copen`. 정의는 `ctags -R .` 후 `Ctrl+]` / `Ctrl+T`.
> `#define` 매크로도 `Ctrl+]` 로 정의를 찾는다 (universal-ctags 는 기본 포함). 헤더의 prototype 까지 태그에 넣으려면 `ctags -R --c-kinds=+p .`.

---

## 2. 검증 — `main.c` 가 해야 하는 것

```c
#include "common.h"
#include "log.h"
#include "guard.h"

log_level_t g_log_level = LOG_LV_INF;   /* ★ extern 선언의 실체는 .c 에 딱 하나 */

/* 즉시 return 판 */
static int take_ptr(const char *s, int v)
{
    CHK_PTR(s);
    CHK_RANGE(v, 0, 100);
    LOG_INF("ok: %s / %d", s, v);
    return RET_OK;
}

/* goto CLEANUP 판 */
static int take_res(const char *path)
{
    int   ret = RET_FAIL;      /* ① 실패가 기본값 */
    char *buf = NULL;
    FILE *fp  = NULL;

    CHK_PTR(path);             /* 자원 잡기 전 → 즉시 return */

    buf = calloc(1, 64);
    CHK_PTR_GOTO(buf, CLEANUP);

    fp = fopen(path, "r");
    CHK_COND_GOTO(fp != NULL, RET_IO_ERROR, CLEANUP);

    CHK_RET_GOTO(take_ptr("inner", 10), CLEANUP);

    ret = RET_OK;              /* ② 끝까지 왔을 때만 성공 */
CLEANUP:
    SAFE_FCLOSE(fp);           /* ③ 잡은 역순 */
    SAFE_FREE(buf);
    return ret;
}

int main(void)
{
    int ret = 0;

    ret = take_ptr(NULL, 10);            /* → INVALID_ARG, 변수명 's' 가 로그에 */
    LOG_INF("case1 = %s(%d)", ret_str(ret), ret);

    ret = take_ptr("hi", 999);           /* → INVALID_ARG, 범위가 로그에 */
    LOG_INF("case2 = %s(%d)", ret_str(ret), ret);

    ret = take_res("/etc/hosts");        /* → OK (없으면 IO_ERROR) */
    LOG_INF("case3 = %s(%d)", ret_str(ret), ret);

    ret = take_res("/no/such/file");     /* → IO_ERROR, 누수 없이 */
    LOG_INF("case4 = %s(%d)", ret_str(ret), ret);

    return 0;
}
```

### 통과 조건

```bash
clang -Wall -Wextra -Werror -std=c11 -g -fsanitize=address,undefined d0_warmup/src/main.c -o build/d0
```

* 경고 **0개**
* 새니타이저 리포트 **0건** (특히 `case4` 에서 누수가 없어야 한다)
* `case1` 로그에 **`s is NULL`** 처럼 **인자 이름이 찍혀야** 한다 — 안 찍히면 `#_p` 를 안 쓴 것

> [!WARNING] `-pedantic` 과 `##__VA_ARGS__` 는 충돌한다
> 템플릿의 `LOG_PRINT` 는 `##__VA_ARGS__` (GCC/Clang 확장) 을 쓴다.
> `-pedantic` 을 켜면 clang 이 `-Wgnu-zero-variadic-macro-arguments` 를 내고, `-Werror` 와 만나 **빌드가 깨진다.**
> 셋 중 하나를 고른다.
> 1. `-Wno-gnu-zero-variadic-macro-arguments` 를 추가한다 **(권장, 가장 간단)**
> 2. 이 파일에서만 `-pedantic` 을 뺀다
> 3. 가변인자를 항상 1개 이상 넘기는 규칙으로 쓴다 (`LOG_INF("%s", "start")`)
>
> **이걸 모르고 "내 코드가 틀렸나" 로 20분 날리는 게 1회차의 전형적인 함정이다.**

---

## 3. 자가 채점표 (100점)

| 항목 | 배점 | 체크 |
| :--- | :--- | :--- |
| `ret_t` 5종 이상 + `ret_str()` | 15 | ☐ |
| 모든 매크로가 `do-while(0)` | 20 | ☐ |
| 가드 로그에 `#인자이름` + `__func__` | 15 | ☐ |
| `_GOTO` 계열 3종이 `ret` 을 세팅하고 점프 | 15 | ☐ |
| `SAFE_*` 3종이 해제 후 `NULL`/`-1` 대입 | 15 | ☐ |
| 경고 0 / 새니타이저 0 | 10 | ☐ |
| 목표 시간 내 | 10 | ☐ |

---

## 4. 자주 하는 실수

| 증상 | 원인 | 고치는 법 |
| :--- | :--- | :--- |
| `undefined symbol: g_log_level` | `extern` 만 있고 실체가 없다 | `.c` 파일 **딱 하나**에 `log_level_t g_log_level = LOG_LV_INF;` |
| `CHK_RET_GOTO` 가 "`ret` undeclared" | 매크로가 **바깥의 `ret` 변수를 쓴다** | 함수 맨 위에 `int ret = RET_FAIL;` 을 먼저 선언 |
| 매크로 끝에 `;` 를 붙여서 에러 | `do{}while(0)` **뒤에는** `;` 를 안 붙인다 (호출부에서 붙인다) | 정의 끝은 `while (0)` 로 끝 |
| `CHK_RANGE(v, 0, 100)` 에서 부호 경고 | `size_t` 를 `%d` 로 찍음 | 매크로 안에서 `(int)` 캐스팅 (템플릿이 이미 그렇게 되어있다) |
| `goto CLEANUP` 뒤 "jump bypasses initialization" | 선언을 `goto` **뒤에** 했다 | **모든 지역변수를 함수 맨 위에서** 초기화하며 선언 |

---

## 5. 회차 기록표

| 회차 | 날짜 | 변형 | 걸린 시간 | 점수 | 막힌 지점 한 줄 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 |  | A |  |  |  |
| 2 |  | B |  |  |  |
| 3 |  | C |  |  |  |
| 점검 (D+14) |  | 랜덤 |  |  |  |

---

## 관련 노트

- [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md) — 정답지
- [[C] 매크로를 do-while(0)으로 감싸는 이유](개발%20%28CS%29/언어/C언어/전처리기·링키지·함수%20응용/[C]%20매크로를%20do-while%280%29으로%20감싸는%20이유%20—%20여러%20문장을%20안전한%20하나로%20묶기.md)
- [[C] 가변 인자 함수 — stdarg.h로 나만의 printf 만들기](개발%20%28CS%29/언어/C언어/전처리기·링키지·함수%20응용/[C]%20가변%20인자%20함수%20—%20stdarg.h로%20나만의%20printf%20만들기.md)
- [드릴 목록](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/템플릿%20체화%20드릴%20목록.md)
