---
title: "D1. 자원 없는 함수 — 가드·단일출구·시험 3개"
description: "malloc이나 파일 없이 가드와 단일 출구, 시험 3개로 구성하는 C 함수의 기본 모양을 체화하는 D1 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D1. 자원 없는 함수 — 가드 · 단일출구 · 시험 3개

> **쓰는 템플릿**: [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md) 5-1 절
>
> **목표 시간**: 1회차 30분 / 2회차 18분 / **3회차 12분**
>
> 실무 함수의 **80%가 이 모양**이다.
> `malloc` 도 파일도 없다.
> 그래서 제일 먼저 체화한다.

> [!NOTE] 이 드릴의 문서 구성 (D1~D9 공통)
> ① **요구사항서** — 무엇을 만드나, 표로 확정한다.
> ② **pseudo code 템플릿** — 보고 치는 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 이게 통과하면 끝이다.
> ④ 자주 하는 실수
> ⑤ 모범답안 — 맨 뒤에 접어 둔다.
>
> 변형 A/B/C 는 **문제가 바뀌는 게 아니라 같은 함수 모양을 다른 소재로 다시 치는 것**이다.
> 각 변형마다 ①②③이 모두 준비되어 있다.

---

## 0. 이 드릴로 체화할 것

```c
int f(const in_t *in, out_t *out)
{
    CHK_PTR(in);                          /* ① 인자 검사 = 첫 줄 */
    CHK_PTR(out);
    CHK_RANGE(in->x, MIN, MAX);

    memset(out, 0x00, sizeof(*out));      /* ② 출력은 항상 초기화부터 */

    /* ③ 여기서만 생각한다 */

    return RET_OK;                        /* ④ 성공은 맨 끝 한 곳 */
}
```

**이 네 줄의 순서가 흔들리지 않는 게 목표다.**
로직이 틀린 건 괜찮다.
순서가 틀리면 실패다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** MSISDN 정규화 | ① 요구사항서<br>② pseudo code **전체** | 1. pseudo 를 한 줄씩 코드로 바꾼다.<br>2. ③ 테스트를 실행한다. |
| **2회차** | **B** IMSI 분해 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. 번호만 보고 쓴다.<br>2. ③ 테스트를 실행한다. |
| **3회차** | **C** 타임스탬프 검증 | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 친다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — MSISDN 정규화

가입자가 입력한 전화번호 문자열을 **E.164 숫자열**로 정규화한다.

**함수**: `int msisdn_normalize(const msisdn_req_t *in, msisdn_rsp_t *out);`

**입력 `msisdn_req_t`**

| 필드 | 타입 | 필수 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `in_raw` | `char[32]` | O | 최대 31자, 허용 문자 `0-9` `-` ` ` `+` | 널 종단을 믿지 않는다 |
| `def_cc` | `uint16_t` | O | 1 ~ 999 | 기본 국가코드 |

**출력 `msisdn_rsp_t`**

| 필드 | 타입 | 항상 채워짐 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `e164` | `char[16]` | 성공 시만 | 숫자만, `+` 없음, 최대 15자 | `+1` 필수 |
| `nsn` | `char[16]` | 성공 시만 | 국내번호 | |
| `cc` | `uint16_t` | 성공 시만 | `def_cc` 와 같다 | |
| `len` | `uint8_t` | 성공 시만 | `e164` 길이 | |

**규칙**

1. `-` 와 공백은 **무시**한다.
2. `+` 는 **맨 앞에만** 올 수 있다.
   중간에 있으면 `RET_BAD_FORMAT` 이다.
3. `+` 로 시작하면 뒤의 숫자가 `def_cc` 로 시작해야 한다.
   다르면 **미지원**이다 (단일 국가 서비스).
4. `+` 없이 `0` 으로 시작하면 **선행 `0` 을 떼고** 국가코드를 붙인다.
   예) `"010-1234-5678"`, `def_cc=82` → `"821012345678"`
5. 결과 숫자열이 **15자를 넘으면** 규격 위반이다.
6. **실패하면 `out` 은 전부 0** 이다.
   쓰레기를 남기지 않는다.

**에러**

| 상황 | 리턴코드 | 로그 |
| :--- | :--- | :--- |
| `in` / `out` 이 NULL, `def_cc` 범위 밖 | `RET_INVALID_ARG` | 가드가 남긴다 |
| 허용되지 않는 문자, `+` 가 중간, 숫자 없음, 15자 초과 | `RET_BAD_FORMAT` | O |
| `+` 뒤 국가번호가 `def_cc` 와 다름 | `RET_NOT_SUPPORTED` | O |

### 1-B. 변형 B — IMSI 분해

15자리 숫자 IMSI 를 `MCC(3)` + `MNC(2 또는 3)` + `MSIN` 으로 분해한다.

**함수**: `int imsi_split(const imsi_req_t *in, imsi_rsp_t *out);`

**입력 `imsi_req_t`**

| 필드 | 타입 | 필수 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `in_raw` | `char[32]` | O | 숫자 **정확히 15자** | 공백·`-` 도 허용하지 않는다 |

**출력 `imsi_rsp_t`**

| 필드 | 타입 | 항상 채워짐 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `mcc` | `char[4]` | 성공 시만 | 3자리 | |
| `mnc` | `char[4]` | 성공 시만 | 2 또는 3자리 | |
| `msin` | `char[11]` | 성공 시만 | `15 - 3 - mnc_len` 자리 (9 또는 10) | |
| `mnc_len` | `uint8_t` | 성공 시만 | 2 또는 3 | |

**규칙**

1. MNC 자릿수는 **MCC 별 표**로 정한다.
   `450` → 2, `440` → 2, `310` → 3, `404` → 3
2. 표에 없는 MCC 는 **미지원**이다.
3. 길이가 15 가 아니거나 숫자가 아닌 문자가 있으면 형식 위반이다.
4. **실패하면 `out` 은 전부 0** 이다.

**에러**

| 상황 | 리턴코드 | 로그 |
| :--- | :--- | :--- |
| `in` / `out` 이 NULL | `RET_INVALID_ARG` | 가드가 남긴다 |
| 길이 ≠ 15, 숫자 외 문자 | `RET_BAD_FORMAT` | O |
| MCC 가 표에 없음 | `RET_NOT_SUPPORTED` | O |

### 1-C. 변형 C — 타임스탬프 검증

`"YYYYMMDDhhmmss"` 14자(UTC)를 검증해 `struct tm` 과 epoch 초로 변환한다.

**함수**: `int ts_parse(const ts_req_t *in, ts_rsp_t *out);`

**입력 `ts_req_t`**

| 필드 | 타입 | 필수 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `in_raw` | `char[32]` | O | 숫자 **정확히 14자** | |

**출력 `ts_rsp_t`**

| 필드 | 타입 | 항상 채워짐 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| `tm` | `struct tm` | 성공 시만 | `tm_year = 연 - 1900`, `tm_mon = 월 - 1` | |
| `epoch` | `int64_t` | 성공 시만 | 0 ≤ epoch < 2^31 | UTC 기준 (`timegm` 쓰지 말고 직접 계산) |

**규칙**

1. 윤년은 4로 나누어떨어지고 100으로 나누어떨어지지 않거나, 400으로 나누어떨어지는 해다.
2. 월별 일수, 시(0~23), 분(0~59), 초(0~59)를 전부 검사한다.
3. **형식 검사가 먼저, 범위 검사가 나중**이다.
   `2100-02-29` 는 존재하지 않는 날짜이므로 형식 위반이다.
4. 유효한 날짜라도 epoch 가 **음수**(1970 이전)이거나 **2^31 이상**(2038-01-19 03:14:08 UTC 부터)이면 미지원이다.
5. **실패하면 `out` 은 전부 0** 이다.

**에러**

| 상황 | 리턴코드 | 로그 |
| :--- | :--- | :--- |
| `in` / `out` 이 NULL | `RET_INVALID_ARG` | 가드가 남긴다 |
| 길이 ≠ 14, 숫자 외 문자, 존재하지 않는 날짜·시각 | `RET_BAD_FORMAT` | O |
| 유효하지만 epoch 가 범위 밖 | `RET_NOT_SUPPORTED` | O |

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 `d1_pure/src/*.c` 에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `msisdn_normalize` — Level 1 (1회차, 전부 본다)

```c
int msisdn_normalize(const msisdn_req_t *in, msisdn_rsp_t *out)
{
    /* [ ] 1. 지역변수 (전부 선언부에서 초기화)
     *        digits[64], cc_str[8], n / i / cc_len = 0, has_plus = 0, nsn = NULL */

    /* [ ] 2. 가드 (이 순서 그대로)
     *        CHK_PTR(in)
     *        CHK_PTR(out)
     *        CHK_RANGE(in->def_cc, 1, 999) */

    /* [ ] 3. out 과 digits 를 0 으로 초기화 */

    /* [ ] 4. in_raw 를 한 글자씩 본다
     *        루프 상한: i < sizeof(in->in_raw) && in_raw[i] != '\0'   ← 널 종단을 믿지 않는다
     *
     *        - 허용 문자(0-9 - 공백 +)가 아니면
     *            → 로그, RET_BAD_FORMAT
     *        - '+' 이면
     *            i != 0 이면 → 로그, RET_BAD_FORMAT
     *            아니면 has_plus = 1, 다음 글자
     *        - '-' 또는 공백이면
     *            → 건너뛴다
     *        - 숫자이면
     *            digits[n++] = c  (digits 가 가득 차면 RET_BAD_FORMAT)
     *
     *        루프 뒤 n == 0 이면 → 로그, RET_BAD_FORMAT */

    /* [ ] 5. cc_str = def_cc 를 문자열로 (snprintf)
     *        cc_len = 그 길이 */

    /* [ ] 6. nsn 시작 위치를 정한다
     *
     *        has_plus 이면
     *            digits 가 cc_str 로 시작하지 않으면 → 로그, RET_NOT_SUPPORTED
     *            시작하면 nsn = digits + cc_len
     *        digits[0] == '0' 이면
     *            nsn = digits + 1   (선행 0 제거)
     *        이미 cc 로 시작하면
     *            nsn = digits + cc_len
     *        그 외
     *            nsn = digits
     *
     *        nsn 이 빈 문자열이면 → 로그, RET_BAD_FORMAT */

    /* [ ] 7. cc_len + strlen(nsn) > 15 이면 → 로그, RET_BAD_FORMAT */

    /* [ ] 8. out 채우기: cc, len, nsn, e164 (cc_str + nsn)
     *        길이를 검증한 뒤 memcpy 로 복사한다 (strcpy 금지) */

    /* [ ] 9. return RET_OK  ← 성공은 맨 끝 한 곳 */
}
```

### 2-B. `imsi_split` — Level 2 (2회차, 번호와 제목만 본다)

```c
int imsi_split(const imsi_req_t *in, imsi_rsp_t *out)
{
    /* [ ] 1. 지역변수 선언·초기화 */
    /* [ ] 2. 가드 */
    /* [ ] 3. out 0 초기화 */
    /* [ ] 4. 길이 15 검사 + 전부 숫자인지 검사 (루프 상한에 sizeof 를 같이 건다) */
    /* [ ] 5. MCC 3자리를 떼어 MNC 자릿수 표에서 찾기 (없으면 미지원) */
    /* [ ] 6. MNC / MSIN 자르기 */
    /* [ ] 7. out 채우기 (snprintf) */
    /* [ ] 8. return RET_OK */
}
```

Level 1 로 보고 싶으면 2-A 의 4 · 6 번 칸을 이렇게 바꿔 읽는다.

```text
4. 입력 검증
     길이 != 15            → RET_BAD_FORMAT
     숫자가 아닌 문자 있음 → RET_BAD_FORMAT

6. MNC 자릿수
     표 { "450":2, "440":2, "310":3, "404":3 }
     MCC 가 표에 없으면    → RET_NOT_SUPPORTED
     mnc_len = 표 값
     msin 길이 = 15 - 3 - mnc_len
```

### 2-C. `ts_parse` — Level 3 (3회차, 백지)

```c
int ts_parse(const ts_req_t *in, ts_rsp_t *out)
{
    /* 아무것도 안 본다.
     * §1-C 요구사항서만 보고 §0 의 네 줄 모양으로 친다.
     *
     * 막히면 세 가지만 찾아본다.
     *   - 윤년 판정
     *   - 월별 일수 배열
     *   - days_from_civil */
}
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 를 연다.
>    SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 로직이 막히면 **§3 테스트의 기대값**을 먼저 읽는다.
>    요구사항이 애매한 부분은 테스트가 답이다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
d1_pure/src/msisdn.h  imsi.h  ts.h        구조체 2개 + 함수 선언 1개
d1_pure/src/msisdn.c  imsi.c  ts.c        함수 구현
d1_pure/test/test_msisdn.c                변형 A 시험 (3-0 매크로 + 3-A + main)
d1_pure/test/test_imsi.c                  변형 B 시험 (3-0 매크로 + 3-B + main)
d1_pure/test/test_ts.c                    변형 C 시험 (3-0 매크로 + 3-C + main)
```

> [!IMPORTANT] 시험 3개의 형태는 고정이다 (D1~D9 공통)
> **정상**은 대표 입력 1개다.
> **경계**는 최대·최소·한 칸 넘김, 그리고 에러 표의 행마다 1개씩이다.
> **NULL**은 인자를 하나씩 NULL 로 넣는다.
>
> 그리고 **실패한 호출 뒤에는 `out` 이 0** 인지 확인한다.
> §0 의 ② 를 시험으로 고정하는 것이다.

### 3-0. 공통 매크로

```c
#include <stdio.h>
#include <string.h>
#include "common.h"
#include "log.h"

log_level_t g_log_level = LOG_LV_ERR;   /* log.h 의 extern 정의. 시험 파일마다 한 번 */
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

### 3-A. 변형 A 시험 — `msisdn_normalize`

```c
#include "msisdn.h"

static void test_normal(void)      /* 1) 정상: 대표 입력 1개 */
{
    msisdn_req_t in  = { .in_raw = "010-1234-5678", .def_cc = 82 };
    msisdn_rsp_t out;

    T_EQ_INT(msisdn_normalize(&in, &out), RET_OK);
    T_EQ_STR(out.e164, "821012345678");
    T_EQ_STR(out.nsn,  "1012345678");
    T_EQ_INT(out.cc, 82);
    T_EQ_INT(out.len, 12);
}

static void test_edge(void)        /* 2) 경계: 에러 표의 행마다 1개 */
{
    msisdn_req_t in  = { .in_raw = "+8210123456789012", .def_cc = 82 };
    msisdn_rsp_t out;

    memset(&out, 0xFF, sizeof(out));
    T_EQ_INT(msisdn_normalize(&in, &out), RET_BAD_FORMAT);  /* 15자 초과 */
    T_EQ_INT(out.e164[0], 0);                               /* ★ 실패하면 out 은 0 */
    T_EQ_INT(out.cc, 0);

    snprintf(in.in_raw, sizeof(in.in_raw), "01-0-1234-5678");
    T_EQ_INT(msisdn_normalize(&in, &out), RET_OK);          /* '-' 는 전부 무시 */

    snprintf(in.in_raw, sizeof(in.in_raw), "010+12345678");
    T_EQ_INT(msisdn_normalize(&in, &out), RET_BAD_FORMAT);  /* '+' 가 중간 */

    snprintf(in.in_raw, sizeof(in.in_raw), "010-12ab-5678");
    T_EQ_INT(msisdn_normalize(&in, &out), RET_BAD_FORMAT);  /* 허용되지 않는 문자 */

    snprintf(in.in_raw, sizeof(in.in_raw), "---");
    T_EQ_INT(msisdn_normalize(&in, &out), RET_BAD_FORMAT);  /* 숫자 없음 */

    snprintf(in.in_raw, sizeof(in.in_raw), "+8112345678");
    T_EQ_INT(msisdn_normalize(&in, &out), RET_NOT_SUPPORTED); /* 다른 국가 */
}

static void test_null(void)        /* 3) NULL: 인자 하나씩 + def_cc 범위 */
{
    msisdn_req_t in  = { .in_raw = "01012345678", .def_cc = 82 };
    msisdn_rsp_t out;

    T_EQ_INT(msisdn_normalize(NULL, &out), RET_INVALID_ARG);
    T_EQ_INT(msisdn_normalize(&in, NULL), RET_INVALID_ARG);
    T_EQ_INT(msisdn_normalize(NULL, NULL), RET_INVALID_ARG);

    in.def_cc = 0;
    T_EQ_INT(msisdn_normalize(&in, &out), RET_INVALID_ARG);
    in.def_cc = 1000;
    T_EQ_INT(msisdn_normalize(&in, &out), RET_INVALID_ARG);
}

int main(void)
{
    test_normal();
    test_edge();
    test_null();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B. 변형 B 시험 — `imsi_split`

`main()` 은 3-A 와 같은 모양이다.

```c
#include "imsi.h"

static void test_normal(void)
{
    imsi_req_t in  = { .in_raw = "450051234567890" };   /* MCC 450 → MNC 2자리 */
    imsi_rsp_t out;

    T_EQ_INT(imsi_split(&in, &out), RET_OK);
    T_EQ_STR(out.mcc,  "450");
    T_EQ_STR(out.mnc,  "05");
    T_EQ_STR(out.msin, "1234567890");
    T_EQ_INT(out.mnc_len, 2);

    snprintf(in.in_raw, sizeof(in.in_raw), "310260123456789");   /* MCC 310 → MNC 3자리 */
    T_EQ_INT(imsi_split(&in, &out), RET_OK);
    T_EQ_STR(out.mcc,  "310");
    T_EQ_STR(out.mnc,  "260");
    T_EQ_STR(out.msin, "123456789");
    T_EQ_INT(out.mnc_len, 3);
}

static void test_edge(void)
{
    imsi_req_t in  = { .in_raw = "45005123456789" };      /* 14자: 한 칸 모자람 */
    imsi_rsp_t out;

    memset(&out, 0xFF, sizeof(out));
    T_EQ_INT(imsi_split(&in, &out), RET_BAD_FORMAT);
    T_EQ_INT(out.mcc[0], 0);                              /* ★ 실패하면 out 은 0 */
    T_EQ_INT(out.mnc_len, 0);

    snprintf(in.in_raw, sizeof(in.in_raw), "4500512345678901");  /* 16자: 한 칸 넘침 */
    T_EQ_INT(imsi_split(&in, &out), RET_BAD_FORMAT);

    snprintf(in.in_raw, sizeof(in.in_raw), "45005123456789A");   /* 숫자 아님 */
    T_EQ_INT(imsi_split(&in, &out), RET_BAD_FORMAT);

    snprintf(in.in_raw, sizeof(in.in_raw), "450-05-1234567890"); /* 구분자 불허 */
    T_EQ_INT(imsi_split(&in, &out), RET_BAD_FORMAT);

    snprintf(in.in_raw, sizeof(in.in_raw), "999011234567890");   /* 표에 없는 MCC */
    T_EQ_INT(imsi_split(&in, &out), RET_NOT_SUPPORTED);
}

static void test_null(void)
{
    imsi_req_t in = { .in_raw = "450051234567890" };
    imsi_rsp_t out;

    T_EQ_INT(imsi_split(NULL, &out), RET_INVALID_ARG);
    T_EQ_INT(imsi_split(&in, NULL), RET_INVALID_ARG);
    T_EQ_INT(imsi_split(NULL, NULL), RET_INVALID_ARG);
}
```

### 3-C. 변형 C 시험 — `ts_parse`

`main()` 은 3-A 와 같은 모양이다.

```c
#include "ts.h"

static void test_normal(void)
{
    ts_req_t in  = { .in_raw = "20240229123045" };      /* 윤년 2/29 */
    ts_rsp_t out;

    T_EQ_INT(ts_parse(&in, &out), RET_OK);
    T_EQ_INT(out.tm.tm_year, 124);                      /* 2024 - 1900 */
    T_EQ_INT(out.tm.tm_mon,  1);                        /* 2월 = 1 */
    T_EQ_INT(out.tm.tm_mday, 29);
    T_EQ_INT(out.tm.tm_hour, 12);
    T_EQ_INT(out.epoch, 1709209845LL);
}

static void test_edge(void)
{
    ts_req_t in = { .in_raw = "19700101000000" };
    ts_rsp_t out;

    T_EQ_INT(ts_parse(&in, &out), RET_OK);              /* 하한: epoch 0 */
    T_EQ_INT(out.epoch, 0);

    snprintf(in.in_raw, sizeof(in.in_raw), "20380119031407");
    T_EQ_INT(ts_parse(&in, &out), RET_OK);              /* 상한 직전: 2^31 - 1 */
    T_EQ_INT(out.epoch, 2147483647LL);

    memset(&out, 0xFF, sizeof(out));
    snprintf(in.in_raw, sizeof(in.in_raw), "20380119031408");
    T_EQ_INT(ts_parse(&in, &out), RET_NOT_SUPPORTED);   /* 한 칸 넘김: 2^31 */
    T_EQ_INT(out.epoch, 0);                             /* ★ 실패하면 out 은 0 */
    T_EQ_INT(out.tm.tm_year, 0);

    snprintf(in.in_raw, sizeof(in.in_raw), "19691231235959");
    T_EQ_INT(ts_parse(&in, &out), RET_NOT_SUPPORTED);   /* 음수 epoch */

    snprintf(in.in_raw, sizeof(in.in_raw), "20230229000000");
    T_EQ_INT(ts_parse(&in, &out), RET_BAD_FORMAT);      /* 평년 2/29 */

    snprintf(in.in_raw, sizeof(in.in_raw), "21000229000000");
    T_EQ_INT(ts_parse(&in, &out), RET_BAD_FORMAT);      /* 100의 배수는 평년 (형식이 먼저) */

    snprintf(in.in_raw, sizeof(in.in_raw), "20240431000000");
    T_EQ_INT(ts_parse(&in, &out), RET_BAD_FORMAT);      /* 4월 31일 */

    snprintf(in.in_raw, sizeof(in.in_raw), "20241301000000");
    T_EQ_INT(ts_parse(&in, &out), RET_BAD_FORMAT);      /* 13월 */

    snprintf(in.in_raw, sizeof(in.in_raw), "20240101240000");
    T_EQ_INT(ts_parse(&in, &out), RET_BAD_FORMAT);      /* 24시 */

    snprintf(in.in_raw, sizeof(in.in_raw), "2024010100000");
    T_EQ_INT(ts_parse(&in, &out), RET_BAD_FORMAT);      /* 13자 */

    snprintf(in.in_raw, sizeof(in.in_raw), "2024-01-01 00:");
    T_EQ_INT(ts_parse(&in, &out), RET_BAD_FORMAT);      /* 숫자 아님 */
}

static void test_null(void)
{
    ts_req_t in = { .in_raw = "20240101000000" };
    ts_rsp_t out;

    T_EQ_INT(ts_parse(NULL, &out), RET_INVALID_ARG);
    T_EQ_INT(ts_parse(&in, NULL), RET_INVALID_ARG);
    T_EQ_INT(ts_parse(NULL, NULL), RET_INVALID_ARG);
}
```

> [!TIP] 시험을 먼저 읽으면 요구사항의 빈틈이 보인다
> `test_edge()` 를 읽다가 "어? 이 경우는 뭘 리턴하지?" 가 나오면 **그게 에러 표에서 놓친 행이다.**
> 나만의 경계 입력을 1개씩 더 추가해 본다.

### 3-1. 빌드와 실행 (Makefile, gcc)

`~/cdrill/Makefile` 에 아래 내용을 둔다 (D1~D9 공통, [README](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 와 같다).
recipe 줄(`$(CC)`, `@mkdir` 등)은 **반드시 탭**으로 들여쓴다.

```makefile
# ~/cdrill/Makefile
# 사용법:  make D=d1_pure V=msisdn
#   파일이 여러 개일 때:  make D=d4_pack V=msgx SRC="d4_pack/src/msg.c d4_pack/src/body.c d4_pack/test/test_msgx.c"
#   데몬(빌드만):         make D=d7_daemon V=daemon SRC="$(ls d7_daemon/src/*.c)" build/d7_daemon_daemon
#   외부 라이브러리:      make ... LDLIBS="-pthread -ljansson"
CC       := gcc
CFLAGS   := -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST -Icommon -I$(D)/src
SAN      := -fsanitize=address,undefined -fno-omit-frame-pointer
LDLIBS   ?= -pthread

D        ?= d1_pure
V        ?= main
SRC      ?= $(D)/src/$(V).c $(D)/test/test_$(V).c
BIN      := build/$(D)_$(V)

all: run

build:
	@mkdir -p build

$(BIN): build $(SRC)
	$(CC) $(CFLAGS) $(SAN) $(SRC) $(LDLIBS) -o $(BIN)

run: $(BIN)
	@echo "── run ──────────────────────────────"
	@./$(BIN)

# 위생 검사: 경고 0 + 새니타이저 0 이어야 통과
check: $(BIN)
	@./$(BIN) && echo "PASS" || (echo "FAIL"; exit 1)

clean:
	rm -rf build

.PHONY: all run check clean build
```

변형별 실행 명령이다.

```bash
make D=d1_pure V=msisdn      # 변형 A
make D=d1_pure V=imsi        # 변형 B
make D=d1_pure V=ts          # 변형 C
```

* 마지막 줄이 **`PASS`** 이고 경고 0, 새니타이저 리포트 0 이면 통과다.
* `-Werror` 때문에 컴파일이 안 되면 테스트 이전에 코드를 고친다.
  경고도 실패다.
* `-pedantic` 은 넣지 않았다.
  gcc 는 `-pedantic` 에서 `LOG_INF("hello")` 처럼 가변 인자가 0개인 호출을 경고로 처리해 `-Werror` 와 만나면 빌드가 깨진다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g \
>     -Icommon -Id1_pure/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d1_pure/src/msisdn.c d1_pure/test/test_msisdn.c \
>     -o build/d1_pure_msisdn
> ./build/d1_pure_msisdn
> ```
>
> 변형 B, C 는 `msisdn` 을 `imsi`, `ts` 로 바꾼다.

---

## 4. 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| `out` 을 초기화 안 하고 중간에 실패 | 호출부가 **쓰레기 값을 읽는다.**<br>실패해도 `out` 은 "빈 값"이어야 한다.<br>테스트의 `0xFF` 검사가 잡는다. |
| `char buf[15]` 에 15자 결과를 담음 | **`+1`** 을 잊었다.<br>문자열은 **항상 `MAX+1`** 이다. |
| 문자 검사에 `isdigit(c)` 를 그냥 씀 | `char` 가 음수일 때 UB 다.<br>`isdigit((unsigned char)c)` 로 캐스팅한다. |
| 길이 검사를 `strlen` 결과로만 함 | 입력이 널 종단이 아닐 수 있다.<br>루프 상한에 `sizeof` 를 같이 건다. |
| 실패인데 `RET_FAIL` 하나로 뭉뚱그림 | 로그만 보고 원인을 못 찾는다.<br>**에러 표의 행 = 리턴코드 1개** 로 맞춘다. |
| (C) 범위 검사를 형식 검사보다 먼저 함 | `21000229000000` 이 `NOT_SUPPORTED` 로 나온다.<br>**존재하는 날짜인지가 먼저**다. |
| (C) `tm_year` / `tm_mon` 을 그대로 대입 | `tm_year` 는 `연 - 1900`, `tm_mon` 은 `월 - 1` 이다. |
| (C) epoch 를 `int` / 32비트 `time_t` 로 계산 | 2038 경계에서 오버플로한다.<br>`int64_t` 로 계산하고 마지막에 범위만 비교한다. |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `msisdn.h` / `msisdn.c`
> **헤더 (`msisdn.h`)**
> ```c
> #define MSISDN_LEN_MAX  15
>
> typedef struct {
>     char     in_raw[32];                 /* 입력 원문 (널 포함 32) */
>     uint16_t def_cc;                     /* 기본 국가코드 1~999 */
> } msisdn_req_t;
>
> typedef struct {
>     char     e164[MSISDN_LEN_MAX + 1];   /* 숫자만, '+' 없음.  +1 필수 */
>     char     nsn [MSISDN_LEN_MAX + 1];
>     uint16_t cc;
>     uint8_t  len;
> } msisdn_rsp_t;
>
> int msisdn_normalize(const msisdn_req_t *in, msisdn_rsp_t *out);
> ```
>
> **구현 (`msisdn.c`)**
> ```c
> #include "common.h"
> #include "log.h"
> #include "guard.h"
> #include "msisdn.h"
>
> static int is_allowed_char(char c)
> {
>     return (c >= '0' && c <= '9') || c == '-' || c == ' ' || c == '+';
> }
>
> int msisdn_normalize(const msisdn_req_t *in, msisdn_rsp_t *out)
> {
>     char        digits[64];
>     char        cc_str[8];
>     size_t      n = 0, i = 0, cc_len = 0;
>     int         has_plus = 0;
>     const char *nsn = NULL;
>
>     CHK_PTR(in);
>     CHK_PTR(out);
>     CHK_RANGE(in->def_cc, 1, 999);
>
>     memset(out, 0x00, sizeof(*out));
>     memset(digits, 0x00, sizeof(digits));
>
>     /* 1) 허용 문자 검사 + 숫자만 추출 */
>     for (i = 0; i < sizeof(in->in_raw) && in->in_raw[i] != '\0'; i++) {
>         char c = in->in_raw[i];
>
>         if (!is_allowed_char(c)) {
>             LOG_ERR("bad char 0x%02X at %zu", (unsigned char)c, i);
>             return RET_BAD_FORMAT;
>         }
>         if (c == '+') {
>             if (i != 0) {                       /* 맨 앞에만 허용 */
>                 LOG_ERR("'+' at %zu (must be head)", i);
>                 return RET_BAD_FORMAT;
>             }
>             has_plus = 1;
>             continue;
>         }
>         if (c == '-' || c == ' ') continue;     /* 구분자는 무시 */
>
>         if (n >= sizeof(digits) - 1) return RET_BAD_FORMAT;
>         digits[n++] = c;
>     }
>     if (n == 0) { LOG_ERR("no digit"); return RET_BAD_FORMAT; }
>
>     /* 2) 국가코드 분리 */
>     cc_len = (size_t)snprintf(cc_str, sizeof(cc_str), "%u", in->def_cc);
>
>     if (has_plus) {
>         if (strncmp(digits, cc_str, cc_len) != 0) {
>             LOG_ERR("foreign cc: %s (def=%s)", digits, cc_str);
>             return RET_NOT_SUPPORTED;           /* 단일 국가 서비스 */
>         }
>         nsn = digits + cc_len;
>     } else if (digits[0] == '0') {
>         nsn = digits + 1;                       /* 선행 0 제거 */
>     } else if (n > cc_len && strncmp(digits, cc_str, cc_len) == 0) {
>         nsn = digits + cc_len;                  /* 이미 82... 로 시작 */
>     } else {
>         nsn = digits;
>     }
>     if (nsn[0] == '\0') { LOG_ERR("empty nsn"); return RET_BAD_FORMAT; }
>
>     /* 3) 조립 + 길이 검증 */
>     if (cc_len + strlen(nsn) > MSISDN_LEN_MAX) {
>         LOG_ERR("e164 too long: %zu", cc_len + strlen(nsn));
>         return RET_BAD_FORMAT;
>     }
>
>     out->cc  = in->def_cc;
>     out->len = (uint8_t)(cc_len + strlen(nsn));
>     memcpy(out->nsn,  nsn,    strlen(nsn));   /* 길이는 위에서 검증했고, out 은 memset 0 → 널 종단 */
>     memcpy(out->e164, cc_str, cc_len);
>     memcpy(out->e164 + cc_len, nsn, strlen(nsn));
>
>     return RET_OK;
> }
> ```
>
> **눈여겨볼 점 5가지**
> 1. 실패 경로가 전부 **가드 또는 명시적 `return RET_XXX`** 이다.
>    뒷정리할 자원이 없으니 `goto` 를 쓰지 않는다.
> 2. 루프 상한이 `i < sizeof(in->in_raw)` 이다.
>    **널 종단을 믿지 않는다.**
> 3. 길이를 검증한 뒤에만 `memcpy` 로 복사한다.
>    `strcpy` 는 한 번도 안 나온다.
>    `snprintf("%s")` 로 쓰면 gcc 가 "잘릴 수 있음" 경고를 내고 `-Werror` 에서 빌드가 깨진다.
> 4. 에러 표가 3행이면 리턴코드도 3종으로 나뉜다.
>    (`INVALID_ARG` / `BAD_FORMAT` / `NOT_SUPPORTED`)
> 5. `out` 은 `memset` 직후 **성공 경로에서만** 채운다.
>    실패 시 0 이 유지되어 테스트의 `0xFF` 검사를 통과한다.

---

## 관련 노트

- [1. 기본 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%201.%20기본%20골격%20—%20리턴코드·가드매크로·단일출구%20cleanup.md)
- [[C] 문자열 배열 재대입과 복사 — strncpy·snprintf·sscanf 비교](개발%20%28CS%29/언어/C언어/문자열·파싱/[C]%20문자열%20배열%20재대입과%20복사%20—%20strncpy·snprintf·sscanf%20비교.md)
- [[C] 실무 C 코드 관례와 UB 함정 정리](개발%20%28CS%29/언어/C언어/설계%20패턴·코드%20관례/[C]%20실무%20C%20코드%20관례와%20UB%20함정%20정리.md)
- [다음: D2. 표 3장 → 구조체](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D2.%20표%203장%20→%20구조체%20—%20Optional·Conditional·union·정렬.md)
