---
title: "D3. 자원 잡는 함수 — goto CLEANUP·create·destroy"
description: "goto CLEANUP, create, destroy 쌍으로 실패 경로의 자원 누수를 막는 방법을 체화하는 D3 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D3. 자원 잡는 함수 — `goto CLEANUP` · create · destroy

> **쓰는 템플릿**: [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md) 5-2 · 5-3 절
>
> **목표 시간**: 1회차 45분 / 2회차 30분 / **3회차 20분**
>
> **누수는 "언젠가" 가 아니라 "항상 실패 경로에서" 난다.**
> 이 드릴은 실패 경로만 집중적으로 친다.

> [!NOTE] 이 드릴의 문서 구성 (D0~D9 공통)
> ① **요구사항서** — 무엇을 만드나, 표로 확정한다.
> ② **pseudo code 템플릿** — 보고 치는 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 이게 통과하면 끝이다.
> ④ 자주 하는 실수
> ⑤ 모범답안 — 맨 뒤에 접어 둔다.
>
> 변형 A/B/C 는 **문제가 바뀌는 게 아니라 같은 모양을 다른 소재로 다시 치는 것**이다.
> 각 변형마다 ①②③이 모두 준비되어 있다.

---

## 0. 이 드릴로 체화할 것

```c
int f(const in_t *in, out_t *out)
{
    int   ret = RET_FAIL;        /* ① 실패가 기본값. 성공은 맨 끝에서만 덮어쓴다 */
    char *buf = NULL;            /* ② 포인터는 전부 NULL, fd 는 -1 로 선언 */
    FILE *fp  = NULL;
    int   fd  = -1;

    CHK_PTR(in);                 /* ③ 자원 잡기 전 → 즉시 return (goto 아님) */
    CHK_PTR(out);
    memset(out, 0x00, sizeof(*out));

    buf = calloc(1, N);
    CHK_ALLOC_GOTO(buf, ret, CLEANUP);  /* ④ 첫 자원을 잡은 뒤부터는 전부 goto (할당 실패는 NO_MEM) */

    ret = RET_OK;                /* ⑤ 끝까지 왔을 때만 성공 */
CLEANUP:
    SAFE_FCLOSE(fp);             /* ⑥ 잡은 역순 */
    SAFE_FREE(buf);
    SAFE_CLOSE(fd);
    if (ret != RET_OK) memset(out, 0x00, sizeof(*out));   /* ⑦ 실패면 출력을 비운다 */
    return ret;
}
```

**①②⑤⑥이 한 세트다.** 하나만 빠져도 누수 아니면 double free 가 된다.

### 소유권 규칙 — create / destroy

| 상황 | 누가 해제하나 |
| :--- | :--- |
| `_create()` 가 `RET_OK` | **호출부**가 `_destroy()` 해야 한다 |
| `_create()` 가 실패 | **내부에서 전부 정리하고** `*out_obj = NULL` 로 둔다. 호출부는 아무것도 안 한다 |
| `_destroy(NULL)` | **합법이어야 한다.** 아무 일도 안 하고 리턴 |
| `_destroy()` 를 두 번 | 호출부가 포인터를 NULL 로 만들게 **`_destroy(obj_t **)`** 로 받는 것도 방법 |

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 설정 파일 로더 | ① 요구사항서<br>② pseudo code **전체** | 1. pseudo 를 한 줄씩 코드로 바꾼다.<br>2. ③ 테스트와 실패 주입을 실행한다. |
| **2회차** | **B** 세션 컨텍스트 생성기 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. 번호만 보고 쓴다.<br>2. ③ 테스트와 실패 주입을 실행한다. |
| **3회차** | **C** 두 파일 병합기 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 친다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 설정 파일 로더

> [!QUOTE] 요구사항서 (발췌)
> `key=value` 형식 설정 파일을 읽어 설정 객체를 만든다.
> - 한 줄 최대 **255자**.
>   `#` 로 시작하는 줄과 빈 줄은 **무시**.
> - `key` 는 최대 31자, `value` 는 최대 127자.
>   앞뒤 공백은 **제거**.
> - 같은 key 가 두 번 나오면 **나중 것이 이긴다**.
> - 항목 개수 상한은 **없다** (동적 확장).
> - **필수 키**: `listen_port`(1~65535), `worker_num`(1~64).
>   없으면 로딩 실패.
> - 파일이 없으면 `RET_IO_ERROR`, 형식 위반은 `RET_BAD_FORMAT`, 할당 실패는 `RET_NO_MEM`.
> - 조회 API: `cfg_get_str(cfg, key, &out)` / `cfg_get_int(cfg, key, &out)`.

### 미션

1. `cfg_create(const char *path, cfg_t **out_cfg)` — **소유권을 넘기는 생성 함수**.
2. `cfg_destroy(cfg_t *cfg)` — `NULL` 안전.
3. 항목 배열을 **2배씩 확장**(`realloc`)하되, **realloc 실패 시 원본을 잃지 않게**.
4. `cfg_get_int()` 는 숫자가 아니면 `RET_BAD_FORMAT`.

**함수**

| 함수 | 요구사항 |
| :--- | :--- |
| `int cfg_create(const char *path, cfg_t **out_cfg)` | 파일을 읽어 객체를 만든다.<br>**실패하면 `*out_cfg` 는 NULL** 이다. |
| `void cfg_destroy(cfg_t *cfg)` | NULL 을 받아도 안전하다. |
| `int cfg_get_str(const cfg_t *cfg, const char *key, const char **out)` | 없는 키는 `RET_NOT_FOUND` |
| `int cfg_get_int(const cfg_t *cfg, const char *key, int *out)` | 없는 키는 `RET_NOT_FOUND`, 숫자가 아니면 `RET_BAD_FORMAT` |

**에러 코드 규칙 (A)**

| 상황 | 리턴코드 | 로그 |
| :--- | :--- | :--- |
| `path` / `out_cfg` 가 NULL | `RET_INVALID_ARG` | 가드가 남긴다 |
| 파일을 열 수 없음 | `RET_IO_ERROR` | O (`LOG_ERRNO`) |
| `=` 없는 줄, 빈 key, key 32자 이상, value 128자 이상, 필수 키 범위 위반 | `RET_BAD_FORMAT` | O |
| 필수 키(`listen_port`, `worker_num`)가 없음 | `RET_NOT_FOUND` | O |
| 할당 실패 (객체, 줄 버퍼, 항목 배열) | `RET_NO_MEM` | O |

### 1-B. 변형 B — 세션 컨텍스트 생성기

객체 안에 **동적 자원 3개**(버퍼 / 문자열 배열 / mutex)를 잡는다.
중간에 실패하면 **잡은 것만 역순으로** 해제하는 것이 핵심이다.

**함수**

| 함수 | 요구사항 |
| :--- | :--- |
| `int sess_create(const sess_cfg_t *cfg, sess_t **out)` | 세션을 만든다.<br>**실패하면 `*out` 은 NULL**, 내부에서 전부 정리한다. |
| `void sess_destroy(sess_t *s)` | NULL 안전.<br>mutex 를 먼저 `destroy` 한 뒤 나머지를 해제한다. |
| `const char *sess_name(const sess_t *s, uint8_t i)` | `i` 번째 이름.<br>범위 밖이면 NULL |
| `uint32_t sess_buf_size(const sess_t *s)` | 버퍼 크기 |
| `int sess_lock(sess_t *s)` / `int sess_unlock(sess_t *s)` | mutex 잠금 / 해제 |

**입력 `sess_cfg_t`**

| 필드 | 타입 | 필수 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `buf_size` | `uint32_t` | O | 1 ~ 65536 | 버퍼 크기 |
| `name_cnt` | `uint8_t` | O | 0 ~ 16 | 이름 개수 |
| `names` | `const char *[16]` | O | `name_cnt` 개는 NULL 이 아니어야 한다 | **깊은 복사**한다 |

**규칙**

1. 할당 순서는 `객체 → 버퍼 → 이름 배열(+각 문자열) → mutex` 이다.
2. 어느 단계에서 실패해도 **그때까지 잡은 것만** 해제한다.
3. 이름은 `strdup` 으로 복사한다 (원본을 바꿔도 세션은 안 변한다).
4. `name_cnt == 0` 이면 이름 배열을 할당하지 않는다.

**에러 코드 규칙 (B)**

| 상황 | 리턴코드 |
| :--- | :--- |
| `cfg` / `out` 이 NULL, `buf_size` 범위 밖, `name_cnt > 16`, 이름이 NULL | `RET_INVALID_ARG` |
| 할당 실패 | `RET_NO_MEM` |
| `pthread_mutex_init` 실패 | `RET_FAIL` |

### 1-C. 변형 C — 두 파일 병합기

`fd` 2개 + `FILE*` 1개 + 버퍼 1개, **자원 4종**이 섞인다.
`fd` 는 `-1`, `FILE*` 와 포인터는 `NULL` 로 초기화해야 `SAFE_*` 가 안전하다는 것을 손으로 익힌다.

**함수**: `int merge_files(const char *a, const char *b, const char *dst, size_t *out_bytes);`

**규칙**

1. `a` 를 읽고, 이어서 `b` 를 읽어서 `dst` 에 **이어 쓴다** (4096바이트 버퍼로 반복).
2. `a` / `b` 는 `open(O_RDONLY)`, `dst` 는 `fopen("w")` 로 연다.
3. 성공하면 `*out_bytes` 에 쓴 바이트 수를 넣는다.
   **실패하면 `*out_bytes = 0`** 이다.
4. **실패하면 `dst` 파일을 지운다** (반쯤 쓴 파일이 남지 않는다).
5. `dst` 는 쓰기 파일이므로 **`fclose` 실패도** 결과에 반영한다 (`SAFE_FCLOSE_RET`).
6. `dst` 가 `a` 또는 `b` 와 **같은 경로**면 거절한다.

**에러 코드 규칙 (C)**

| 상황 | 리턴코드 | 로그 |
| :--- | :--- | :--- |
| 인자가 NULL, `dst` 가 `a` / `b` 와 같은 경로 | `RET_INVALID_ARG` | 가드가 남긴다 |
| 파일을 열 수 없음, 읽기·쓰기·`fclose` 실패 | `RET_IO_ERROR` | O (`LOG_ERRNO`) |
| 버퍼 할당 실패 | `RET_NO_MEM` | O |

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 `d3_resource/src/*.c` 에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `cfg.c` — Level 1 (1회차, 전부 본다)

```c
/* cfg.c */
/* [ ] 1. 상수와 구조체
 *        CFG_KEY_MAX 31 / CFG_VAL_MAX 127 / CFG_LINE_MAX 255
 *        cfg_item_t { key[+1], val[+1] }
 *        struct cfg_s { items, num, cap }     (헤더에는 typedef 만 노출 = 불투명) */

/* [ ] 2. static char *trim(char *s) — 앞뒤 공백 제거 (제자리) */

/* [ ] 3. static int cfg_put(cfg_t *cfg, const char *key, const char *val)
 *        가드 3개
 *        이미 있는 key 면 val 만 덮어쓴다 (나중 것이 이긴다)
 *        num == cap 이면 확장
 *            new_cap = (cap == 0) ? 8 : cap * 2
 *            tmp = realloc(items, ...)     ← tmp 로 받는다
 *            NULL 이면 RET_NO_MEM (원본은 그대로)
 *            성공했을 때만 items / cap 갱신
 *        새 항목은 snprintf 로 복사, num++ */

/* [ ] 4. cfg_get_str / cfg_get_int
 *        가드 → 항목 순회 → 없으면 RET_NOT_FOUND
 *        get_int 는 strtol + endptr + errno(ERANGE) 로 검사, 숫자가 아니면 RET_BAD_FORMAT */

/* [ ] 5. int cfg_create(const char *path, cfg_t **out_cfg)
 *        ① int ret = RET_FAIL
 *        ② cfg / fp / line 을 NULL 로 선언
 *        ③ CHK_PTR(path), CHK_PTR(out_cfg)  → 즉시 return
 *           *out_cfg = NULL
 *        ④ cfg = CALLOC(...)               → CHK_ALLOC_GOTO
 *           line = CALLOC(...)             → CHK_ALLOC_GOTO
 *           fp = fopen(path, "r")          → 실패면 LOG_ERRNO, CHK_COND_GOTO(IO_ERROR)
 *        ⑤ fgets 루프
 *           개행 제거 → trim → 빈 줄 / '#' 줄은 건너뛴다
 *           '=' 가 없으면 BAD_FORMAT
 *           key / val 을 trim, 길이 검사 (key 빈 문자열 / 31 초과 / val 127 초과 → BAD_FORMAT)
 *           CHK_RET_GOTO(cfg_put(...))
 *        ⑥ 필수 키: listen_port(1~65535), worker_num(1~64)
 *           없으면 NOT_FOUND, 범위 밖이면 BAD_FORMAT
 *        ⑦ 소유권 이전
 *           *out_cfg = cfg;
 *           cfg      = NULL;               ← 이 한 줄이 심장
 *           ret      = RET_OK;
 *        ⑧ CLEANUP (잡은 역순)
 *           SAFE_FCLOSE(fp) → SAFE_FREE(line) → cfg_destroy(cfg)
 *           return ret */

/* [ ] 6. void cfg_destroy(cfg_t *cfg)
 *        NULL 이면 return / items 해제 / 객체 자체도 free */
```

### 2-B. `sess.c` — Level 2 (2회차, 번호와 제목만 본다)

```c
/* sess.c */
/* [ ] 1. struct sess_s { buf, buf_size, names, name_cnt, mu } */
/* [ ] 2. sess_destroy — NULL 안전, mutex destroy → 이름 해제(안쪽부터) → 이름 배열 → 버퍼 → 객체 */
/* [ ] 3. sess_create ① ~ ⑧
 *        ① ret = RET_FAIL   ② 포인터 NULL   ③ 가드 / *out = NULL
 *        ④ 객체 → 버퍼 → 이름 배열 + 각 이름(XSTRDUP) → mutex(MUTEX_INIT)
 *        ⑤ 소유권 이전 (*out = s; s = NULL;)
 *        ⑥ CLEANUP: sess_destroy(s)  ← 부분적으로 만든 것도 한 함수로 정리 */
/* [ ] 4. sess_name / sess_buf_size / sess_lock / sess_unlock */
```

### 2-C. `merge.c` — Level 3 (3회차, 백지)

```c
/* 아무것도 안 본다.
 * §1-C 요구사항서만 보고 §0 의 모양(①~⑦)으로 친다.
 *
 * 막히면 세 가지만 찾아본다.
 *   - fd 는 -1, FILE* 는 NULL 로 선언하는 이유
 *   - 쓰기 파일의 fclose 실패를 반영하는 매크로 (SAFE_FCLOSE_RET)
 *   - 실패했을 때 dst 를 지우는 위치 (CLEANUP 안, ret != RET_OK 일 때) */
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 로 SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 로직이 막히면 **§3 테스트의 기대값**을 먼저 읽는다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
d3_resource/src/cfg.h    cfg.c            변형 A
d3_resource/src/sess.h   sess.c           변형 B
d3_resource/src/merge.h  merge.c          변형 C
d3_resource/src/test_alloc.h              할당 가로채기 (3-0)
d3_resource/test/test_cfg.c               변형 A 시험 (3-0 매크로 + 3-A + main)
d3_resource/test/test_sess.c              변형 B 시험 (3-0 매크로 + 3-B + main)
d3_resource/test/test_merge.c             변형 C 시험 (3-0 매크로 + 3-C + main)
```

> [!IMPORTANT] 이 드릴의 진짜 시험은 **실패 주입(Fault Injection)** 이다
> 정상 동작은 쉽다.
> **N번째 `malloc` 이 실패했을 때 누수가 0인지**를 봐야 한다.
>
> 시험은 **정상 / 경계 / NULL** 세 가지에 **실패 주입**이 더해진다.

### 3-0. 공통 매크로와 할당 가로채기

```c
/* 시험 파일 공통 머리 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "common.h"
#include "log.h"

log_level_t g_log_level = LOG_LV_ERR;      /* 실패 주입 때 로그가 쏟아지지 않게 */
int g_alloc_fail_at = -1;
int g_alloc_count   = 0;

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
```

```c
/* test_alloc.h — 시험 빌드(-DUNIT_TEST)에서만 할당·초기화를 가로챈다 */
#ifndef TEST_ALLOC_H
#define TEST_ALLOC_H

#include <errno.h>
#include <pthread.h>
#include <stdlib.h>
#include <string.h>

extern int g_alloc_fail_at;     /* -1: 항상 성공, k: k번째 호출을 실패시킴 */
extern int g_alloc_count;

static inline int t_should_fail(void)
{
    int fail = (g_alloc_fail_at >= 0 && g_alloc_count == g_alloc_fail_at);

    g_alloc_count++;
    return fail;                                    /* 이번 호출만 실패 */
}

static inline void *t_calloc(size_t n, size_t sz) { return t_should_fail() ? NULL : calloc(n, sz); }
static inline char  *t_strdup(const char *s)      { return t_should_fail() ? NULL : strdup(s); }
static inline int    t_mutex_init(pthread_mutex_t *m)
{
    return t_should_fail() ? EAGAIN : pthread_mutex_init(m, NULL);
}

#ifdef UNIT_TEST
#  define CALLOC(_n, _sz)  t_calloc((_n), (_sz))
#  define XSTRDUP(_s)      t_strdup(_s)
#  define MUTEX_INIT(_m)   t_mutex_init(_m)
#else
#  define CALLOC(_n, _sz)  calloc((_n), (_sz))
#  define XSTRDUP(_s)      strdup(_s)
#  define MUTEX_INIT(_m)   pthread_mutex_init((_m), NULL)
#endif

#endif /* TEST_ALLOC_H */
```

### 3-A. 변형 A 시험 — `cfg_*`

```c
#include "cfg.h"

static void write_file(const char *path, const char *text)
{
    FILE *fp = fopen(path, "w");

    if (fp == NULL) { g_fail++; printf("  X cannot write %s\n", path); return; }
    fputs(text, fp);
    fclose(fp);
}

static void test_normal(void)
{
    cfg_t      *cfg = NULL;
    const char *s   = NULL;
    int         n   = 0;

    write_file("build/t_ok.cfg",
               "# comment\n"
               "\n"
               "listen_port = 8080\n"
               "worker_num=4\n"
               "  name =  foo  \n");

    T_EQ_INT(cfg_create("build/t_ok.cfg", &cfg), RET_OK);
    T_EQ_INT(cfg_get_int(cfg, "listen_port", &n), RET_OK);
    T_EQ_INT(n, 8080);
    T_EQ_INT(cfg_get_str(cfg, "name", &s), RET_OK);
    T_EQ_STR(s, "foo");                                   /* 앞뒤 공백 제거 */
    T_EQ_INT(cfg_get_str(cfg, "nothing", &s), RET_NOT_FOUND);
    cfg_destroy(cfg);
}

static void test_edge(void)
{
    cfg_t *cfg = NULL;
    int    n   = 0;
    char   big[64 * 1024];
    size_t off = 0;
    int    i   = 0;

    write_file("build/t_dup.cfg", "listen_port=1\nworker_num=4\nworker_num=8\n");
    T_EQ_INT(cfg_create("build/t_dup.cfg", &cfg), RET_OK);
    T_EQ_INT(cfg_get_int(cfg, "worker_num", &n), RET_OK);
    T_EQ_INT(n, 8);                                       /* 나중 것이 이긴다 */
    cfg_destroy(cfg);

    write_file("build/t_p1.cfg", "listen_port=65535\nworker_num=64\n");
    T_EQ_INT(cfg_create("build/t_p1.cfg", &cfg), RET_OK); /* 상한 */
    cfg_destroy(cfg);

    write_file("build/t_p2.cfg", "listen_port=65536\nworker_num=4\n");
    T_EQ_INT(cfg_create("build/t_p2.cfg", &cfg), RET_BAD_FORMAT);   /* 한 칸 초과 */
    T_EQ_INT(cfg == NULL, 1);                             /* ★ 실패하면 NULL */

    write_file("build/t_p3.cfg", "listen_port=0\nworker_num=4\n");
    T_EQ_INT(cfg_create("build/t_p3.cfg", &cfg), RET_BAD_FORMAT);   /* 한 칸 아래 */

    write_file("build/t_p4.cfg", "listen_port=80\nworker_num=65\n");
    T_EQ_INT(cfg_create("build/t_p4.cfg", &cfg), RET_BAD_FORMAT);

    write_file("build/t_p5.cfg", "listen_port=abc\nworker_num=4\n");
    T_EQ_INT(cfg_create("build/t_p5.cfg", &cfg), RET_BAD_FORMAT);   /* 숫자 아님 */

    write_file("build/t_p6.cfg", "worker_num=4\n");
    T_EQ_INT(cfg_create("build/t_p6.cfg", &cfg), RET_NOT_FOUND);    /* 필수 키 없음 */

    write_file("build/t_p7.cfg", "listen_port 8080\nworker_num=4\n");
    T_EQ_INT(cfg_create("build/t_p7.cfg", &cfg), RET_BAD_FORMAT);   /* '=' 없음 */

    write_file("build/t_p8.cfg", "=1\nlisten_port=80\nworker_num=4\n");
    T_EQ_INT(cfg_create("build/t_p8.cfg", &cfg), RET_BAD_FORMAT);   /* 빈 key */

    T_EQ_INT(cfg_create("build/no_such.cfg", &cfg), RET_IO_ERROR);  /* 파일 없음 */
    T_EQ_INT(cfg == NULL, 1);

    /* 항목 300개: 8 → 16 → ... → 512 로 확장되는 경로(realloc)를 탄다 */
    off += (size_t)snprintf(big + off, sizeof(big) - off, "listen_port=80\nworker_num=4\n");
    for (i = 0; i < 300; i++) {
        off += (size_t)snprintf(big + off, sizeof(big) - off, "key%d=%d\n", i, i);
    }
    write_file("build/t_big.cfg", big);
    T_EQ_INT(cfg_create("build/t_big.cfg", &cfg), RET_OK);
    {
        const char *s = NULL;
        T_EQ_INT(cfg_get_str(cfg, "key299", &s), RET_OK);
        T_EQ_STR(s, "299");
    }
    cfg_destroy(cfg);
}

static void test_null(void)
{
    cfg_t *cfg = NULL;

    T_EQ_INT(cfg_create(NULL, &cfg), RET_INVALID_ARG);
    T_EQ_INT(cfg_create("build/t_ok.cfg", NULL), RET_INVALID_ARG);
    cfg_destroy(NULL);                                    /* 죽지 않으면 통과 */
}

/* 0번째부터 20번째 할당까지 하나씩 실패시켜 본다 */
static void test_alloc_fail_all(void)
{
    int k = 0;

    for (k = 0; k < 20; k++) {
        cfg_t *cfg = NULL;
        int    ret = 0;

        g_alloc_fail_at = k;
        g_alloc_count   = 0;

        ret = cfg_create("build/t_ok.cfg", &cfg);

        if (ret != RET_OK) T_EQ_INT(cfg == NULL, 1);      /* 실패했으면 cfg 는 반드시 NULL */
        cfg_destroy(cfg);                                 /* 성공했으면 여기서 해제 */
    }
    g_alloc_fail_at = -1;
}

int main(void)
{
    test_normal();
    test_edge();
    test_null();
    test_alloc_fail_all();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

**ASan 리포트에 `LEAK` 가 한 줄이라도 나오면 0점이다.**
이 루프를 통과하면 그 함수는 실무에 나가도 된다.

### 3-B. 변형 B 시험 — `sess_*`

`main()` 은 3-A 와 같은 모양이다 (`test_alloc_fail_all` 포함).

```c
#include "sess.h"

static void test_normal(void)
{
    sess_cfg_t cfg;
    sess_t    *s = NULL;
    char       a[] = "alpha";

    memset(&cfg, 0x00, sizeof(cfg));
    cfg.buf_size = 1024;
    cfg.name_cnt = 2;
    cfg.names[0] = a;
    cfg.names[1] = "beta";

    T_EQ_INT(sess_create(&cfg, &s), RET_OK);
    T_EQ_INT(sess_buf_size(s), 1024);
    T_EQ_STR(sess_name(s, 0), "alpha");
    T_EQ_STR(sess_name(s, 1), "beta");
    T_EQ_INT(sess_name(s, 2) == NULL, 1);                 /* 범위 밖 */

    a[0] = 'Z';                                           /* ★ 깊은 복사 */
    T_EQ_STR(sess_name(s, 0), "alpha");

    T_EQ_INT(sess_lock(s), RET_OK);
    T_EQ_INT(sess_unlock(s), RET_OK);
    sess_destroy(s);
}

static void test_edge(void)
{
    sess_cfg_t cfg;
    sess_t    *s = NULL;
    int        i = 0;

    memset(&cfg, 0x00, sizeof(cfg));
    cfg.buf_size = 1;
    T_EQ_INT(sess_create(&cfg, &s), RET_OK);              /* 하한, 이름 0개 */
    T_EQ_INT(sess_name(s, 0) == NULL, 1);
    sess_destroy(s);  s = NULL;

    cfg.buf_size = 65536;
    T_EQ_INT(sess_create(&cfg, &s), RET_OK);              /* 상한 */
    sess_destroy(s);  s = NULL;

    cfg.buf_size = 0;
    T_EQ_INT(sess_create(&cfg, &s), RET_INVALID_ARG);     /* 한 칸 아래 */
    T_EQ_INT(s == NULL, 1);                               /* ★ 실패하면 NULL */
    cfg.buf_size = 65537;
    T_EQ_INT(sess_create(&cfg, &s), RET_INVALID_ARG);     /* 한 칸 위 */

    cfg.buf_size = 16;
    cfg.name_cnt = 16;
    for (i = 0; i < 16; i++) cfg.names[i] = "n";
    T_EQ_INT(sess_create(&cfg, &s), RET_OK);              /* 이름 16개 */
    sess_destroy(s);  s = NULL;

    cfg.name_cnt = 17;
    T_EQ_INT(sess_create(&cfg, &s), RET_INVALID_ARG);     /* 17개 */

    cfg.name_cnt = 2;
    cfg.names[0] = "ok";  cfg.names[1] = NULL;
    T_EQ_INT(sess_create(&cfg, &s), RET_INVALID_ARG);     /* 이름 NULL */
    T_EQ_INT(s == NULL, 1);
}

static void test_null(void)
{
    sess_cfg_t cfg;
    sess_t    *s = NULL;

    memset(&cfg, 0x00, sizeof(cfg));
    cfg.buf_size = 16;

    T_EQ_INT(sess_create(NULL, &s), RET_INVALID_ARG);
    T_EQ_INT(sess_create(&cfg, NULL), RET_INVALID_ARG);
    T_EQ_INT(sess_name(NULL, 0) == NULL, 1);
    sess_destroy(NULL);                                   /* 죽지 않으면 통과 */
}

/* 객체 → 버퍼 → 이름 배열 → 이름 4개 → mutex : 8번째 호출까지 하나씩 실패시킨다 */
static void test_alloc_fail_all(void)
{
    int k = 0;

    for (k = 0; k < 12; k++) {
        sess_cfg_t cfg;
        sess_t    *s = NULL;
        int        ret = 0;

        memset(&cfg, 0x00, sizeof(cfg));
        cfg.buf_size = 64;
        cfg.name_cnt = 4;
        cfg.names[0] = "a"; cfg.names[1] = "b"; cfg.names[2] = "c"; cfg.names[3] = "d";

        g_alloc_fail_at = k;
        g_alloc_count   = 0;

        ret = sess_create(&cfg, &s);
        if (ret != RET_OK) T_EQ_INT(s == NULL, 1);
        sess_destroy(s);
    }
    g_alloc_fail_at = -1;
}
```

### 3-C. 변형 C 시험 — `merge_files`

`main()` 은 3-A 와 같은 모양이다 (`test_alloc_fail_all` 포함).

```c
#include <sys/stat.h>
#include "merge.h"

/* write_file() 은 3-A 의 것을 그대로 쓴다 */

static int file_exists(const char *path)
{
    struct stat st;
    return stat(path, &st) == 0;
}

static void test_normal(void)
{
    char   got[64] = {0};
    size_t bytes = 99;
    FILE  *fp = NULL;

    write_file("build/m_a.txt", "AAA");
    write_file("build/m_b.txt", "BBB");

    T_EQ_INT(merge_files("build/m_a.txt", "build/m_b.txt", "build/m_out.txt", &bytes), RET_OK);
    T_EQ_INT(bytes, 6);
    fp = fopen("build/m_out.txt", "r");
    T_EQ_INT(fp != NULL, 1);
    if (fp) { fread(got, 1, sizeof(got) - 1, fp); fclose(fp); }
    T_EQ_STR(got, "AAABBB");
}

static void test_edge(void)
{
    size_t bytes = 99;
    int    i = 0;
    char  *big = (char *)malloc(100 * 1000 + 1);

    memset(big, 'x', 100 * 1000);  big[100 * 1000] = '\0';
    write_file("build/m_big.txt", big);
    free(big);
    write_file("build/m_empty.txt", "");

    T_EQ_INT(merge_files("build/m_empty.txt", "build/m_empty.txt", "build/m_o1.txt", &bytes), RET_OK);
    T_EQ_INT(bytes, 0);                                   /* 둘 다 빈 파일 */

    T_EQ_INT(merge_files("build/m_big.txt", "build/m_big.txt", "build/m_o2.txt", &bytes), RET_OK);
    T_EQ_INT(bytes, 200 * 1000);                          /* 4096 보다 훨씬 큼: 반복 경로 */

    bytes = 99;
    T_EQ_INT(merge_files("build/no_a.txt", "build/m_b.txt", "build/m_o3.txt", &bytes), RET_IO_ERROR);
    T_EQ_INT(bytes, 0);                                   /* ★ 실패하면 0 */
    T_EQ_INT(file_exists("build/m_o3.txt"), 0);

    T_EQ_INT(merge_files("build/m_a.txt", "build/no_b.txt", "build/m_o4.txt", &bytes), RET_IO_ERROR);
    T_EQ_INT(file_exists("build/m_o4.txt"), 0);           /* ★ 반쯤 쓴 dst 를 지운다 */

    T_EQ_INT(merge_files("build/m_a.txt", "build/m_b.txt", "build/no_dir/o.txt", &bytes), RET_IO_ERROR);

    T_EQ_INT(merge_files("build/m_a.txt", "build/m_b.txt", "build/m_a.txt", &bytes), RET_INVALID_ARG);
    T_EQ_INT(merge_files("build/m_a.txt", "build/m_b.txt", "build/m_b.txt", &bytes), RET_INVALID_ARG);

    /* ★ fd 누수 시험: 실패를 3000번 해도 이후의 정상 호출이 성공해야 한다 (fd 한도 1024) */
    for (i = 0; i < 3000; i++) {
        merge_files("build/m_a.txt", "build/no_b.txt", "build/m_o5.txt", &bytes);
    }
    T_EQ_INT(merge_files("build/m_a.txt", "build/m_b.txt", "build/m_o6.txt", &bytes), RET_OK);
}

static void test_null(void)
{
    size_t bytes = 0;

    T_EQ_INT(merge_files(NULL, "b", "d", &bytes), RET_INVALID_ARG);
    T_EQ_INT(merge_files("a", NULL, "d", &bytes), RET_INVALID_ARG);
    T_EQ_INT(merge_files("a", "b", NULL, &bytes), RET_INVALID_ARG);
    T_EQ_INT(merge_files("a", "b", "d", NULL), RET_INVALID_ARG);
}

/* 버퍼(4096) 할당을 실패시킨다 → NO_MEM, fd 와 dst 도 정리되어야 한다 */
static void test_alloc_fail_all(void)
{
    int    k = 0;
    size_t bytes = 0;

    for (k = 0; k < 4; k++) {
        int ret = 0;

        g_alloc_fail_at = k;
        g_alloc_count   = 0;
        ret = merge_files("build/m_a.txt", "build/m_b.txt", "build/m_o7.txt", &bytes);
        if (ret != RET_OK) T_EQ_INT(bytes, 0);
    }
    g_alloc_fail_at = -1;
}
```

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [README 의 공통 Makefile](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 을 `~/cdrill/Makefile` 로 쓴다.
`-DUNIT_TEST` 와 `-pthread` 가 이미 들어 있다.

```bash
make D=d3_resource V=cfg         # 변형 A
make D=d3_resource V=sess        # 변형 B
make D=d3_resource V=merge       # 변형 C
```

* 마지막 줄이 **`PASS`** 이고 경고 0, 새니타이저(`LEAK` 포함) 리포트 0 이면 통과다.
* 실패 주입 루프에서 ASan 이 `LeakSanitizer: detected memory leaks` 를 내면 그 경로의 `goto CLEANUP` 이 빠진 것이다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Id3_resource/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d3_resource/src/cfg.c d3_resource/test/test_cfg.c \
>     -pthread -o build/d3_resource_cfg
> ./build/d3_resource_cfg
> ```
>
> 변형 B, C 는 `cfg` 를 `sess`, `merge` 로 바꾼다.

---

## 4. 자주 하는 실수

| 실수 | 증상 |
| :--- | :--- |
| `p = realloc(p, n)` | realloc 실패 시 **원본 포인터를 잃어버린다** → 확정 누수. `tmp` 로 받고 성공했을 때만 대입 |
| `CLEANUP` 앞에서 `return ret;` 을 추가로 함 | 그 경로만 해제를 건너뛴다. **출구는 하나** |
| 해제 순서를 잡은 순서대로 | 버퍼를 먼저 free 하고 그 버퍼를 쓰는 `fclose` 후처리를 하면 use-after-free |
| `_destroy()` 안에서 멤버만 free 하고 객체 자체를 안 함 | 객체 크기만큼 매번 샌다 |
| 성공했는데 `ret` 을 안 바꿈 | `RET_FAIL` 로 시작했으니 **정상인데 실패로 리턴**된다. 제일 흔한 자책골 |
| `goto CLEANUP` 이 변수 선언을 건너뜀 | `-Wjump-misses-init` / C++ 에서는 컴파일 에러.<br>**선언은 전부 함수 맨 위** |
| (B) `CLEANUP` 이 mutex 를 `init` 도 안 한 채 `destroy` 함 | 정의되지 않은 동작.<br>`sess_destroy` 가 "init 됐는지"를 알 수 있게 mutex 를 **포인터로 두고 NULL 로 구분**한다 |
| (B) 이름 배열은 해제하고 안쪽 문자열은 안 함 | 이름 개수만큼 샌다.<br>**안쪽 → 바깥** 순서로 해제한다 |
| (C) 쓰기 파일을 `SAFE_FCLOSE` 로 닫음 | 디스크 가득 참 같은 쓰기 오류가 `fclose` 에서 드러나는데 **성공으로 보고**한다.<br>`SAFE_FCLOSE_RET` |
| (C) 실패 경로에서 `dst` 를 안 지움 | 반쯤 쓴 파일이 남아 다음 실행이 그걸 읽는다 |
| (C) `fd` 를 `0` 으로 초기화 | `0` 은 표준입력이다. `SAFE_CLOSE` 가 stdin 을 닫아 버린다.<br>**`-1`** 로 초기화한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `cfg.c` 핵심부
> ```c
> #define CFG_KEY_MAX    31
> #define CFG_VAL_MAX    127
> #define CFG_LINE_MAX   255
>
> typedef struct { char key[CFG_KEY_MAX + 1]; char val[CFG_VAL_MAX + 1]; } cfg_item_t;
>
> struct cfg_s {                       /* 불투명: 헤더에는 typedef 만 노출 */
>     cfg_item_t *items;
>     size_t      num;
>     size_t      cap;
> };
>
> /* ── 항목 추가: 중복 키는 덮어쓰기, 모자라면 2배 확장 ───────── */
> static int cfg_put(cfg_t *cfg, const char *key, const char *val)
> {
>     size_t      i   = 0;
>     cfg_item_t *tmp = NULL;
>
>     CHK_PTR(cfg); CHK_PTR(key); CHK_PTR(val);
>
>     for (i = 0; i < cfg->num; i++) {                 /* 나중 것이 이긴다 */
>         if (strcmp(cfg->items[i].key, key) == 0) {
>             snprintf(cfg->items[i].val, sizeof(cfg->items[i].val), "%s", val);
>             return RET_OK;
>         }
>     }
>
>     if (cfg->num == cfg->cap) {
>         size_t new_cap = (cfg->cap == 0) ? 8 : cfg->cap * 2;
>
>         tmp = realloc(cfg->items, new_cap * sizeof(*tmp));   /* ★ tmp 로 받는다 */
>         if (tmp == NULL) {                                   /*   원본은 그대로 살아있다 */
>             LOG_ERR("realloc %zu failed", new_cap);
>             return RET_NO_MEM;
>         }
>         cfg->items = tmp;
>         cfg->cap   = new_cap;
>     }
>
>     snprintf(cfg->items[cfg->num].key, CFG_KEY_MAX + 1, "%s", key);
>     snprintf(cfg->items[cfg->num].val, CFG_VAL_MAX + 1, "%s", val);
>     cfg->num++;
>     return RET_OK;
> }
>
> /* ── 생성: 소유권을 호출부로 넘긴다 ─────────────────────────── */
> int cfg_create(const char *path, cfg_t **out_cfg)
> {
>     int    ret  = RET_FAIL;          /* ① */
>     cfg_t *cfg  = NULL;              /* ② */
>     FILE  *fp   = NULL;
>     char  *line = NULL;
>
>     CHK_PTR(path);                   /* ③ 자원 잡기 전 → 즉시 return */
>     CHK_PTR(out_cfg);
>     *out_cfg = NULL;                 /*    실패해도 호출부가 쓰레기를 안 보게 */
>
>     cfg = CALLOC(1, sizeof(*cfg));   /* ④ 여기부터 goto */
>     CHK_ALLOC_GOTO(cfg, ret, CLEANUP);
>
>     line = CALLOC(1, CFG_LINE_MAX + 2);
>     CHK_ALLOC_GOTO(line, ret, CLEANUP);
>
>     fp = fopen(path, "r");
>     CHK_COND_GOTO(fp != NULL, RET_IO_ERROR, ret, CLEANUP);
>
>     while (fgets(line, CFG_LINE_MAX + 2, fp) != NULL) {
>         char *eq = NULL, *key = NULL, *val = NULL;
>
>         line[strcspn(line, "\r\n")] = '\0';          /* 개행 제거 */
>         key = trim(line);
>         if (key[0] == '\0' || key[0] == '#') continue;   /* 빈 줄 / 주석 */
>
>         eq = strchr(key, '=');
>         CHK_COND_GOTO(eq != NULL, RET_BAD_FORMAT, ret, CLEANUP);
>
>         *eq = '\0';
>         val = trim(eq + 1);
>         key = trim(key);
>
>         CHK_COND_GOTO(key[0] != '\0', RET_BAD_FORMAT, ret, CLEANUP);
>         CHK_COND_GOTO(strlen(key) <= CFG_KEY_MAX, RET_BAD_FORMAT, ret, CLEANUP);
>         CHK_COND_GOTO(strlen(val) <= CFG_VAL_MAX, RET_BAD_FORMAT, ret, CLEANUP);
>
>         CHK_RET_GOTO(cfg_put(cfg, key, val), ret, CLEANUP);
>     }
>
>     /* 필수 키 검사 */
>     {
>         int port = 0, worker = 0;
>         CHK_RET_GOTO(cfg_get_int(cfg, "listen_port", &port), ret, CLEANUP);
>         CHK_RET_GOTO(cfg_get_int(cfg, "worker_num",  &worker), ret, CLEANUP);
>         CHK_COND_GOTO(port   >= 1 && port   <= 65535, RET_BAD_FORMAT, ret, CLEANUP);
>         CHK_COND_GOTO(worker >= 1 && worker <= 64,    RET_BAD_FORMAT, ret, CLEANUP);
>     }
>
>     *out_cfg = cfg;                  /* ★ 소유권 이전 */
>     cfg      = NULL;                 /* ★ 아래 CLEANUP 이 해제하지 않도록 끊는다 */
>     ret      = RET_OK;               /* ⑤ */
>
> CLEANUP:                             /* ⑥ 잡은 역순 */
>     SAFE_FCLOSE(fp);
>     SAFE_FREE(line);
>     cfg_destroy(cfg);                /*   성공 시엔 NULL 이므로 아무 일도 안 한다 */
>     return ret;
> }
>
> void cfg_destroy(cfg_t *cfg)
> {
>     if (cfg == NULL) return;         /* ★ NULL 안전 */
>     SAFE_FREE(cfg->items);
>     free(cfg);                       /*   객체 자체도 반드시 */
> }
> ```
>
> **눈여겨볼 점 4가지**
> 1. **`cfg = NULL;` 한 줄이 이 함수의 심장이다.** 성공 경로에서 소유권을 넘긴 뒤 로컬 포인터를 끊어야, 같은 `CLEANUP` 라벨을 성공·실패가 같이 쓸 수 있다.
> 2. `realloc` 은 **`tmp` 로 받는다.** 바로 대입하면 실패 시 원본을 잃는다.
> 3. `cfg_destroy` 를 `CLEANUP` 에서 쓰니 **부분적으로 만들어진 객체도 한 함수로 정리**된다.
>    해제 코드를 두 군데 쓰지 않는다.
> 4. `new_cap * sizeof(*tmp)` 에 곱셈 오버플로우 검사가 없다 — **의도적으로 괜찮다.** `new_cap`은 파일 안 줄 수만큼만 1→8→16→32… 로 내부에서 2배씩 늘어나는 값이라, 외부 입력이 곱셈에 직접 실리는 SD17류 시나리오와 다르다(`SIZE_MAX` 근처까지 가려면 그전에 파일 읽기가 끝난다).
>    **`count`가 파일·네트워크·프로토콜 필드처럼 외부에서 그대로 들어오는 경우**라면 이 가정이 깨지므로, [SD17. 정수 오버플로우](개발%20%28CS%29/언어/C언어/실습/시큐어코딩%20체화%20드릴/P1%20입력데이터%20검증%20%28SD01-19%29/[SD]%20SD17.%20정수%20오버플로우%20—%20연산%20전%20오버플로우%20검사로%20치환.md)처럼 직접 검사하거나 [[C] 개수 필드 + 포인터의 포인터](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md) 5-2절의 `calloc`으로 바꿔야 한다.

> [!success]- 위 핵심부를 컴파일되게 하는 나머지 — `cfg.h` · include · `trim` · getter
> 아래를 `cfg.c` 맨 위(include·`trim`)와 맨 아래(getter)에 붙이면 §3 의 시험이 그대로 `PASS` 한다.
> ```c
> /* cfg.h */
> #ifndef CFG_H
> #define CFG_H
> typedef struct cfg_s cfg_t;
> int  cfg_create(const char *path, cfg_t **out_cfg);
> void cfg_destroy(cfg_t *cfg);
> int  cfg_get_str(const cfg_t *cfg, const char *key, const char **out);
> int  cfg_get_int(const cfg_t *cfg, const char *key, int *out);
> #endif
>
> /* cfg.c 맨 위 */
> #include <ctype.h>
> #include <limits.h>
> #include "common.h"
> #include "log.h"
> #include "safe.h"
> #include "guard.h"
> #include "test_alloc.h"        /* CALLOC — 실패 주입 */
> #include "cfg.h"
>
> static char *trim(char *s)     /* 앞뒤 공백 제거. 제자리에서 자르고 시작 위치를 돌려준다 */
> {
>     char *e = NULL;
>
>     while (*s != ' ' && isspace((unsigned char)*s)) s++;
>     e = s + strlen(s);
>     while (e > s && isspace((unsigned char)e[-1])) e--;
>     *e = ' ';
>     return s;
> }
>
> /* cfg.c 맨 아래 (struct cfg_s 정의 뒤) */
> int cfg_get_str(const cfg_t *cfg, const char *key, const char **out)
> {
>     size_t i = 0;
>
>     CHK_PTR(cfg);
>     CHK_PTR(key);
>     CHK_PTR(out);
>
>     for (i = 0; i < cfg->num; i++) {
>         if (strcmp(cfg->items[i].key, key) == 0) { *out = cfg->items[i].val; return RET_OK; }
>     }
>     return RET_NOT_FOUND;
> }
>
> int cfg_get_int(const cfg_t *cfg, const char *key, int *out)
> {
>     const char *s   = NULL;
>     char       *end = NULL;
>     long        v   = 0;
>
>     CHK_PTR(out);
>     CHK_RET(cfg_get_str(cfg, key, &s));
>
>     errno = 0;
>     v = strtol(s, &end, 10);
>     if (end == s || *end != ' ' || errno != 0 || v < INT_MIN || v > INT_MAX) {
>         LOG_ERR("%s is not an integer: %s", key, s);
>         return RET_BAD_FORMAT;
>     }
>     *out = (int)v;
>     return RET_OK;
> }
> ```

---

## 관련 노트

- [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md)
- [[C] 불투명 포인터(Opaque Pointer) — 헤더는 선언만, 구현은 숨기기](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20불투명%20포인터%28Opaque%20Pointer%29%20—%20헤더는%20선언만,%20구현은%20숨기기.md)
- [[C] 공개 래퍼(Wrapper)와 내부 코어(Core) 분리 패턴](개발%20%28CS%29/언어/C언어/설계%20패턴·코드%20관례/[C]%20공개%20래퍼%28Wrapper%29와%20내부%20코어%28Core%29%20분리%20패턴%20—%20언더스코어%28__%29%20관행과%20C%20표준%20예약어.md)
- [[C] 개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md)
- [다음: D4. Pack / Unpack](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D4.%20Pack·Unpack%20—%20비트필드·엔디안·왕복시험.md)
