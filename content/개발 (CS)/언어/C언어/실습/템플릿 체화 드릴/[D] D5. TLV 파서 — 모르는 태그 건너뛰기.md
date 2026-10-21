---
title: "D5. TLV 파서 — 모르는 태그 건너뛰기"
description: "모르는 태그를 건너뛰며 TLV(Tag-Length-Value) 가변 구조를 파싱하는 D5 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D5. TLV 파서 — 모르는 태그 건너뛰기

> **쓰는 템플릿**: [3. 바이트 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md) 4장(TLV)
>
> **목표 시간**: 1회차 60분 / 2회차 38분 / **3회차 25분** (확장 포함 **38분**)
>
> **D4 를 통과한 다음에 한다.**
> 고정 헤더를 못 뜯으면 가변 구조는 못 뜯는다.

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

| 반사 | 규칙 |
| :--- | :--- |
| 순회 | `while (off < end)` — **남은 길이로 돈다.** 개수로 돌지 않는다 |
| 매 IE 마다 | `NEED(2)` → T,L 읽기 → **`NEED(L)`** → V 읽기. **검사 두 번** |
| 모르는 T | **에러가 아니다.** `off += L` 로 건너뛴다 (전방 호환) |
| 중복 T | 규격이 정한 대로. 안 정했으면 **첫 번째 채택 + WRN 로그** |
| `L = 0` | **합법이다.** 길이 0짜리 IE 를 크래시 없이 넘겨야 한다 |
| **조건부 필수** | **순서가 보장되지 않으므로 순회 도중에는 판정 못 한다.** 순회가 **끝난 뒤 한 곳**에서 검사 |
| **IE 마다 값 타입이 다르다** | `kind` 를 태그로 한 **tagged union** — 읽기 전에 태그 확인, **모르는 IEI 는 `RAW` arm** |

> [!IMPORTANT] TLV 파서의 존재 이유는 "모르는 걸 만나도 안 죽는 것"
> 규격은 계속 늘어난다.
> **내가 모르는 IE 하나에 전체 메시지를 버리면** 상대 장비가 버전업하는 순간 서비스가 멈춘다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 세션 메시지 body (T1/L1) | ① 요구사항서<br>② pseudo code **전체** | 1. pseudo 를 한 줄씩 코드로 바꾼다.<br>2. ③ 테스트(정상·경계·자르기)를 실행한다. |
| **2회차** | **B** TLV16 + 조건부 필수 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. 판단표를 채운다.<br>2. 번호만 보고 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** NAS 스타일 + IE 값 union | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 친다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 세션 메시지 body

> [!QUOTE] 규격서 (발췌)
> 메시지 body 는 **TLV 목록**이다.
> 순서는 보장되지 않는다.
>
> ```text
> T(1) │ L(1) │ V(L bytes)
> L = 0xFF 이면 확장 길이: 뒤이어 2바이트(BE)가 실제 길이
> ```
>
> | IEI | 이름 | P | 길이 | 값 |
> | :--- | :--- | :--- | :--- | :--- |
> | `0x01` | SessionId | **M** | 4 | uint32 BE |
> | `0x02` | Cause | **M** | 1 | uint8 (0~63) |
> | `0x10` | UeName | O | 0~32 | UTF-8, 널 없음 |
> | `0x20` | Timestamp | O | 8 | uint64 BE (epoch ms) |
> | `0x30` | Nested | O | 가변 | **내부가 또 TLV** (깊이 1까지만) |
> | 그 외 | (미지원) | — | 가변 | **건너뛰되 원문 보존** |
>
> - 필수 IE 가 없으면 `RET_BAD_FORMAT`.
> - 같은 IEI 가 두 번 오면 **첫 번째를 채택**하고 경고 로그.
> - 모르는 IEI 는 **최대 8개까지 원문(T·L·V 전체)을 보관**해, 응답 생성 시 **그대로 되돌려 보낸다.**
> - IE 가 버퍼 경계를 넘어가면 `RET_BAD_FORMAT`.

### 미션

```c
int  tlv_parse (const uint8_t *buf, size_t len, msg_body_t *out);
int  tlv_build (const msg_body_t *in, uint8_t *buf, size_t buf_len, size_t *out_len);
```

1. 순회 골격을 **`while` 한 개**로.
   IE 마다 `case` 로 분기.
2. 모르는 IEI 는 `out->unknown[]` 에 **T·L·V 통째로** 보관 (8개 초과분은 버리고 WRN).
3. `tlv_build` 는 **알려진 IE → 모르는 IE 원문** 순으로 다시 쌓는다.
4. **왕복**: `parse(build(x)) == x` (모르는 IE 포함).

**구조체 `msg_body_t` (A)**

| 필드 | 타입 | 비고 |
| :--- | :--- | :--- |
| `session_id` / `has_session_id` | `uint32_t` / `bool` | M |
| `cause` / `has_cause` | `uint8_t` / `bool` | M |
| `name` / `has_name` | `char[33]` / `bool` | O, **널 종단은 내가 붙인다** |
| `ts_ms` / `has_ts` | `uint64_t` / `bool` | O |
| `unknown[8]` / `unknown_num` | `{ uint8_t iei; uint16_t len; uint8_t val[128]; }` | 모르는 IE 보관 (128 바이트 초과 또는 9번째부터는 **버리고 WRN**) |

**에러 코드 규칙 (A)**

| 상황 | 리턴코드 | 로그 |
| :--- | :--- | :--- |
| `buf` / `out` 이 NULL | `RET_INVALID_ARG` | 가드가 남긴다 |
| IE 가 버퍼 경계를 넘음 (T·L 자리 부족, 확장 길이 자리 부족, V 가 L 보다 짧음) | `RET_BAD_FORMAT` | O |
| IE 의 길이가 규격과 다름 (`SessionId` L≠4, `Cause` L≠1, `UeName` L>32, `Timestamp` L≠8) | `RET_BAD_FORMAT` | O |
| `Cause` 가 63 초과 | `RET_BAD_FORMAT` | O |
| `Nested` 안에 `Nested` (깊이 2) | `RET_BAD_FORMAT` | O |
| 필수 IE(`SessionId`, `Cause`) 누락 | `RET_BAD_FORMAT` | O (**순회가 끝난 뒤**) |
| 모르는 IEI | **`RET_OK`** (보관, 못 하면 WRN) | WRN |
| 중복 IEI | **`RET_OK`**, 첫 번째 채택 | WRN |

**함수와 규칙**

```c
int tlv_parse(const uint8_t *buf, size_t len, msg_body_t *out);
int tlv_build(const msg_body_t *in, uint8_t *buf, size_t buf_len, size_t *out_len);
```

1. `tlv_parse` 는 순회를 **`while` 한 개**로, IE 마다 `switch` 로 분기한다.
2. `tlv_build` 는 **`SessionId` → `Cause` → `UeName`(있으면) → `Timestamp`(있으면) → 모르는 IE 원문** 순으로 쌓는다.
   버퍼가 모자라면 `RET_TOO_SMALL` 이고 `*out_len` 은 0 이다.
3. `Nested`(0x30) 의 V 는 또 TLV 목록이다 (깊이 1까지만).
   내부 IE 도 같은 규칙으로 파싱해서 **같은 `out` 에 합친다.**
4. **왕복**: `parse(build(x))` 는 `x` 와 같다 (모르는 IE 포함).
5. 입력 `buf` 는 NULL 종단이 아니고, 길이 필드를 믿을 수 없다.

### 1-B. 변형 B — TLV16 + 조건부 필수

`T` 와 `L` 이 각각 **2바이트 BE** 이다 (확장 길이 규칙이 사라지고, 헤더가 4바이트가 된다).
그리고 `tlv16_parse` 는 이제 **메시지 Type 을 받는다** (`type < 128` 요청, `type >= 128` 응답).

```text
T(2, BE) │ L(2, BE) │ V(L bytes)
```

| IEI | 이름 | P | 조건 |
| :--- | :--- | :---: | :--- |
| `0x0001` | SessionId | **M** | — |
| `0x0002` | Cause | **C** | **응답이면 M.** 요청에 실려 오면 **무시**하고 경고 |
| `0x0010` / `0x0020` | UeName / Timestamp | O | — |
| 그 외 | (미지원) | — | 건너뛰되 보관 |

값은 A 와 같다 (`SessionId` = u32, `Cause` = u8, `UeName` = 0~32자 문자열, `Timestamp` = u64).
IE 는 **순서가 보장되지 않는다.**

**함수**: `int tlv16_parse(const uint8_t *buf, size_t len, uint8_t msg_type, msg_body_t *out);`

**규칙**

1. `Cause` 조건은 **순회가 끝난 뒤 한 곳**에서 검사한다.
   순회 도중에 "Cause 가 아직 안 왔네" 로 반려하면 뒤에 오는 정상 메시지를 오탐한다.
2. 응답(`type >= 128`)인데 `Cause` 가 없으면 `RET_BAD_FORMAT`.
3. 요청(`type < 128`)에 `Cause` 가 실려 오면 **무시**하고 `has_cause = false` 로 만든 뒤 WRN.
4. `SessionId` 는 어느 쪽이든 필수다.
5. A 의 에러 코드 규칙(경계 초과, 길이 불일치, 모르는 IEI, 중복)을 그대로 따른다.
   `V` 가 `L` 보다 짧으면 `RET_BAD_FORMAT` 이다.

**판단표 — 코드 전에 채운다**

| 필드 | 조건 | 다른 것과 동시에? | 패턴 | 표현 |
| :--- | :--- | :--- | :--- | :--- |
| `Cause` |  |  |  |  |
| IE 값 (`SessionId` / `Cause` / `UeName` / `Timestamp` / RAW) |  |  |  |  |

### 1-C. 변형 C — NAS 스타일 + IE 값 tagged union

IEI 가 **반 옥텟(4비트)** 인 형식이 섞이고, **TV / TLV / LV 세 형식이 공존**한다.
포맷은 **IEI 값으로 판별**한다 (`g_iei_tbl` 에 `format` 열을 추가).
IE 값은 **`kind` 를 태그로 한 tagged union** 이다.

**메시지 모양**

```text
[LV]  L(1) │ V(L)                        ← 메시지 맨 앞의 필수 요소 1개 (이름, IEI 없음)
[IE]* 이어지는 선택 IE 들 (순서 무관, 최대 16개까지 담는다)
```

| IEI | 형식 | 이름 | kind | 길이 |
| :--- | :--- | :--- | :--- | :--- |
| (없음) | **LV** | Name | `IE_STR` | 0 ~ 32 |
| `0x01` | **TLV** | SessionId | `IE_U32` | 4 |
| `0x02` | **TV** | Cause | `IE_U8` | V 1옥텟 고정 (IEI 1 + V 1 = 2옥텟) |
| `0x10` | **TLV** | UeName | `IE_STR` | 0 ~ 32 |
| `0x20` | **TLV** | Timestamp | `IE_U64` | 8 |
| `0xB` | **반 옥텟 (HALF)** | Priority | `IE_U8` | 옥텟의 **상위 4비트가 IEI, 하위 4비트가 값** (0 ~ 15) |
| 그 외 | **TLV 로 가정** | (미지원) | `IE_RAW` | 최대 128 |

**함수와 구조체**

```c
typedef enum { IE_NONE = 0, IE_U8, IE_U32, IE_U64, IE_STR, IE_RAW, IE_END } ie_kind_t;

typedef struct {
    uint8_t   iei;                 /* LV 는 0, 반 옥텟은 0x0B */
    ie_kind_t kind;                /* ★ 태그 */
    union { uint8_t u8; uint32_t u32; uint64_t u64; char str[33];
            struct { uint16_t len; uint8_t val[128]; } raw; } v;
} ie_t;

typedef struct { ie_t ies[16]; uint8_t ie_num; } nas_msg_t;

int ie_decode(uint8_t iei, const uint8_t *v, size_t l, ie_t *out);   /* 표 구동 */
int ie_get_u32(const ie_t *ie, uint32_t *out);                       /* 태그가 다르면 RET_INVALID_ARG */
int nas_parse(const uint8_t *buf, size_t len, nas_msg_t *out);
```

**규칙**

1. 옥텟의 상위 4비트가 `0xB` 이면 **반 옥텟 IE** 다 (표의 전체 IEI 중에 상위 4비트가 `0xB` 인 것은 없다).
2. 그 외에는 옥텟을 IEI 로 보고 **`g_iei_tbl` 에서 형식을 찾는다.**
   TV 는 고정 길이를 읽고, TLV 는 L 을 읽는다.
3. 표에 없는 IEI 는 **TLV 로 가정**하고 `IE_RAW` arm 에 원문을 보관한다 (전방 호환).
4. `ie_decode` 는 **먼저 `memset(out, 0)`** 하고, 길이가 표의 `[len_min, len_max]` 밖이면 `RET_BAD_FORMAT`.
   문자열 arm 은 **널 종단을 붙인다.**
5. **getter 로만 읽는다.** 태그가 다르면 `RET_INVALID_ARG`.
6. 결과 `ies[0]` 은 항상 LV 이름이고, 이어서 IE 가 **나타난 순서대로** 쌓인다.

**에러 코드 규칙 (C)**

| 상황 | 리턴코드 |
| :--- | :--- |
| 인자가 NULL | `RET_INVALID_ARG` |
| 입력이 비어 LV 가 없음, LV·TV·TLV 가 경계를 넘음, 길이가 표와 다름 | `RET_BAD_FORMAT` |
| IE 가 16개를 넘어 담을 수 없음 | `RET_TOO_SMALL` |
| 모르는 IEI | `RET_OK` (`IE_RAW`) |

> [!DANGER] union 의 arm 을 **태그 확인 없이** 읽지 말 것
> `ie->v.u32` 를 읽는데 `kind` 가 `IE_STR` 이면 문자열 바이트를 정수로 해석한다.
> 에러도 경고도 없이 **쓰레기 값**이 나온다.
> 읽기는 항상 `ie_get_u32(const ie_t *, uint32_t *)` 같은 **getter** 로 한다.

**판단표 — 코드 전에 채운다**

| 필드 | 조건 | 다른 것과 동시에? | 패턴 | 표현 |
| :--- | :--- | :--- | :--- | :--- |
| IE 값 (`u8` / `u32` / `u64` / `str` / `raw`) |  |  |  |  |

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 `d5_tlv/src/*.h` / `*.c` 에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안의 해당 단계만 본다.

### 2-A. `tlv.h` / `tlv.c` — Level 1 (1회차, 전부 본다)

```c
/* tlv.h */
/* [ ] 1. IEI 상수, NAME_LEN_MAX 32, UNKNOWN_NUM_MAX 8, UNKNOWN_VAL_MAX 128 */
/* [ ] 2. unknown_ie_t / msg_body_t (§1-A 표) */
/* [ ] 3. 선언: tlv_parse / tlv_build */

/* tlv.c */
/* [ ] 1. NEED(n) 매크로 — D4 와 모양은 같지만 모자라면 RET_BAD_FORMAT
 *        (입력이 모자란 것은 '규격 위반' 이다.  D4 의 NEED 는 TOO_SMALL) */

/* [ ] 2. keep_unknown(out, t, v, l)
 *        unknown_num >= 8 이거나 l > 128 이면 WRN 로그 후 return (버리되 죽지 않는다)
 *        아니면 슬롯에 iei / len / val 을 복사 (l == 0 이면 memcpy 안 함) */

/* [ ] 3. static int parse_ies(buf, len, out, depth)       ← Nested 를 위해 depth 를 받는다
 *        while (off < len)
 *            NEED(2);  t = buf[off++];  l = buf[off++];             ← 검사 ①
 *            l == 0xFF 이면 NEED(2) 후 rd_u16be 로 확장 길이
 *            NEED(l);                                              ← 검사 ② (제일 중요)
 *            switch (t)
 *                SessionId : l != 4 → BAD_FORMAT / 처음이면 저장, 아니면 WRN (첫 번째 채택)
 *                Cause     : l != 1 → BAD_FORMAT / > 63 → BAD_FORMAT
 *                UeName    : l > 32 → BAD_FORMAT / memcpy 후 name[l] = '\0'
 *                Timestamp : l != 8 → BAD_FORMAT / 상위 4 + 하위 4 바이트
 *                Nested    : depth >= 1 이면 BAD_FORMAT, 아니면 parse_ies(..., depth + 1)
 *                default   : keep_unknown   (에러 아님)
 *            off += l;                                             ← 전진은 루프 끝 한 곳 */

/* [ ] 4. int tlv_parse(buf, len, out)
 *        가드 → memset(out) → parse_ies(.., 0)
 *        순회가 끝난 뒤 필수 IE 검사 (SessionId, Cause 없으면 BAD_FORMAT) */

/* [ ] 5. int tlv_build(in, buf, buf_len, out_len)
 *        가드 / *out_len = 0
 *        ROOM(n) 매크로: 모자라면 RET_TOO_SMALL
 *        SessionId → Cause → UeName(has_name) → Timestamp(has_ts) → unknown[] 원문 순으로 쓴다
 *        길이가 254 이하면 L 1바이트 (A 의 build 는 확장 길이를 쓰지 않는다)
 *        *out_len = off, return RET_OK */
```

### 2-B. `tlv16.c` — Level 2 (2회차, 번호와 제목만 본다)

```c
/* tlv16.c  (tlv.h 의 msg_body_t 를 그대로 쓴다) */
/* [ ] 1. NEED 와 keep_unknown 은 A 의 것을 재사용 (같은 헤더로 올리거나 복사) */
/* [ ] 2. 순회: NEED(4) → T = rd_u16be, L = rd_u16be → NEED(L) → switch (T) → off += L */
/* [ ] 3. IE 별 길이 일치 검사 (A 와 같다) */
/* [ ] 4. 순회가 끝난 뒤 한 곳에서 조건 검사
 *        SessionId 필수
 *        msg_type >= 128 이면 Cause 필수, 아니면 Cause 가 왔어도 무시 (WRN, has_cause = false) */
```

### 2-C. `nas.c` — Level 3 (3회차, 백지)

```c
/* 아무것도 안 본다.
 * §1-C 요구사항서와 §3-C 테스트만 보고 만든다.
 *
 * 막히면 세 가지만 찾아본다.
 *   - 표 구동 디코딩 (g_iei_tbl 한 곳에서 {iei, format, kind, 길이 범위} 를 찾는다)
 *   - union 잔재를 막는 memset 의 위치 (ie_decode 맨 앞)
 *   - 문자열 arm 의 널 종단 (dst[l] = '\0') */
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 로 SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 로직이 막히면 **§3 테스트의 기대 바이트**를 손으로 따라가 본다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

### 2-D. 순회 골격 — 이 모양이 손에 남아야 한다

```c
while (off < len) {
    uint8_t  t = 0;
    uint32_t l = 0;

    NEED(2);                       /* ① T + L 자리 */
    t = buf[off++];
    l = buf[off++];

    if (l == 0xFF) {               /* ② 확장 길이 */
        NEED(2);
        l = rd_u16be(buf + off);
        off += 2;
    }

    NEED(l);                       /* ③ V 가 실제로 있나 — 제일 중요 */

    switch (t) {
    case IEI_SESSION_ID: ... break;
    default:                       /* ④ 모르면 건너뛴다. 에러 아님 */
        keep_unknown(out, t, buf + off, l);
        break;
    }
    off += l;                      /* ⑤ 어떤 경우든 L 만큼 전진 */
}
```

> [!DANGER] `off += l;` 을 `case` 안에서 하지 말 것
> 분기마다 전진시키면 **한 군데라도 빼먹는 순간 무한 루프**가 된다.
> 전진은 **루프 끝에서 한 번만.**

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
d5_tlv/src/tlv.h    tlv.c         변형 A (+ 모범답안 확장은 tlv16.c 에서 재사용)
d5_tlv/src/tlv16.c                변형 B
d5_tlv/src/nas.h    nas.c         변형 C
d5_tlv/test/test_tlv.c            변형 A 시험 (3-0 매크로 + 3-A + main)
d5_tlv/test/test_tlv16.c          변형 B 시험 (3-0 매크로 + 3-B + main)
d5_tlv/test/test_nas.c            변형 C 시험 (3-0 매크로 + 3-C + main)
```

> [!IMPORTANT] 시험의 형태 (D1~D9 공통)
> **정상** 한 가지, **경계** 여러 가지, **NULL / 실패** 경로를 확인한다.
> D5 는 여기에 **모르는 IE 건너뛰기**, **길이 거짓말**, **L=0**, **자르기(0 ~ len-1)** 가 붙는다.

### 3-0. 공통 매크로

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "common.h"
#include "log.h"

log_level_t g_log_level = LOG_LV_ERR;

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

#define T_EQ_BYTES(_got, _exp, _n)                                      \
    do {                                                                \
        if (memcmp((_got), (_exp), (_n)) != 0) { g_fail++;              \
            printf("  X %s:%d  bytes differ\n", __func__, __LINE__); } \
    } while (0)
```

### 3-A. 변형 A 시험 — `tlv_parse` / `tlv_build`

```c
#include "tlv.h"

static void test_unknown_ie(void)   /* 모르는 IE 가 있어도 통과해야 한다 */
{
    const uint8_t raw[] = {
        0x01, 0x04, 0x00, 0x00, 0x30, 0x39,   /* SessionId = 12345 */
        0x99, 0x03, 0xAA, 0xBB, 0xCC,         /* 미지원 IEI */
        0x02, 0x01, 0x07,                     /* Cause = 7 */
    };
    msg_body_t b;

    T_EQ_INT(tlv_parse(raw, sizeof(raw), &b), RET_OK);   /* ★ OK 여야 한다 */
    T_EQ_INT(b.session_id, 12345);
    T_EQ_INT(b.cause, 7);
    T_EQ_INT(b.unknown_num, 1);
    T_EQ_INT(b.unknown[0].iei, 0x99);
    T_EQ_INT(b.unknown[0].len, 3);
}

static void test_truncated(void)    /* 길이가 거짓말을 할 때 */
{
    const uint8_t raw[] = { 0x10, 0x20, 0x41, 0x42 };   /* L=32 인데 값은 2바이트 */
    msg_body_t b;

    T_EQ_INT(tlv_parse(raw, sizeof(raw), &b), RET_BAD_FORMAT);
}

static void test_zero_len(void)     /* L=0 은 합법 */
{
    const uint8_t raw[] = {
        0x01, 0x04, 0x00, 0x00, 0x00, 0x01,
        0x10, 0x00,                            /* UeName, 길이 0 */
        0x02, 0x01, 0x00,
    };
    msg_body_t b;

    T_EQ_INT(tlv_parse(raw, sizeof(raw), &b), RET_OK);
    T_EQ_INT(b.has_name, 1);
    T_EQ_INT(b.name[0], '\0');
}

static void test_missing_mandatory(void)
{
    const uint8_t no_sid[]   = { 0x02, 0x01, 0x07 };                        /* SessionId 없음 */
    const uint8_t no_cause[] = { 0x01, 0x04, 0x00, 0x00, 0x00, 0x01 };      /* Cause 없음 */
    msg_body_t b;

    T_EQ_INT(tlv_parse(no_sid, sizeof(no_sid), &b), RET_BAD_FORMAT);
    T_EQ_INT(tlv_parse(no_cause, sizeof(no_cause), &b), RET_BAD_FORMAT);
    T_EQ_INT(tlv_parse((const uint8_t *)"", 0, &b), RET_BAD_FORMAT);        /* 빈 입력 */
}

static void test_length_mismatch(void)
{
    const uint8_t sid2[]   = { 0x01, 0x02, 0x00, 0x01,  0x02, 0x01, 0x00 };  /* SessionId L=2 */
    const uint8_t cause64[] = { 0x01, 0x04, 0, 0, 0, 1,  0x02, 0x01, 64 };   /* Cause 범위 초과 */
    msg_body_t b;

    T_EQ_INT(tlv_parse(sid2, sizeof(sid2), &b), RET_BAD_FORMAT);
    T_EQ_INT(tlv_parse(cause64, sizeof(cause64), &b), RET_BAD_FORMAT);
}

static void test_dup_and_overflow(void)
{
    const uint8_t dup[] = { 0x01, 0x04, 0, 0, 0, 1,  0x01, 0x04, 0, 0, 0, 2,  0x02, 0x01, 0x00 };
    uint8_t       raw[6 + 3 + 9 * 3];
    msg_body_t    b;
    size_t        off = 0;
    int           i = 0;

    T_EQ_INT(tlv_parse(dup, sizeof(dup), &b), RET_OK);
    T_EQ_INT(b.session_id, 1);                           /* ★ 첫 번째 채택 */

    memcpy(raw, "\x01\x04\x00\x00\x00\x01\x02\x01\x00", 9);  off = 9;
    for (i = 0; i < 9; i++) { raw[off++] = (uint8_t)(0x90 + i); raw[off++] = 1; raw[off++] = 0; }
    T_EQ_INT(tlv_parse(raw, off, &b), RET_OK);          /* 9개: 8개까지만 보관, 죽지 않는다 */
    T_EQ_INT(b.unknown_num, 8);
}

static void test_ext_len(void)       /* L = 0xFF → 뒤 2바이트가 실제 길이 */
{
    uint8_t    raw[6 + 4 + 300 + 3 + 4 + 128];
    msg_body_t b;
    size_t     off = 0;

    memcpy(raw, "\x01\x04\x00\x00\x00\x01", 6);  off = 6;
    raw[off++] = 0x99; raw[off++] = 0xFF; raw[off++] = 0x01; raw[off++] = 0x2C;   /* 300 */
    memset(raw + off, 0xEE, 300);  off += 300;
    raw[off++] = 0x98; raw[off++] = 0xFF; raw[off++] = 0x00; raw[off++] = 0x80;   /* 128 */
    memset(raw + off, 0xDD, 128);  off += 128;
    raw[off++] = 0x02; raw[off++] = 0x01; raw[off++] = 0x00;

    T_EQ_INT(tlv_parse(raw, off, &b), RET_OK);
    T_EQ_INT(b.has_cause, 1);                            /* ★ 확장 길이를 건너뛴 뒤에도 정렬이 맞다 */
    T_EQ_INT(b.unknown_num, 1);                          /* 300 은 버리고 128 은 보관 */
    T_EQ_INT(b.unknown[0].iei, 0x98);
    T_EQ_INT(b.unknown[0].len, 128);

    {
        const uint8_t cut_ext[] = { 0x99, 0xFF, 0x01 };  /* 확장 길이 자리가 모자람 */
        T_EQ_INT(tlv_parse(cut_ext, sizeof(cut_ext), &b), RET_BAD_FORMAT);
    }
}

static void test_nested(void)
{
    const uint8_t ok[]   = { 0x01, 0x04, 0, 0, 0, 1,  0x30, 0x03, 0x02, 0x01, 0x07 };       /* 내부에 Cause */
    const uint8_t deep[] = { 0x01, 0x04, 0, 0, 0, 1,  0x30, 0x05, 0x30, 0x03, 0x02, 0x01, 0x07 };
    msg_body_t b;

    T_EQ_INT(tlv_parse(ok, sizeof(ok), &b), RET_OK);
    T_EQ_INT(b.cause, 7);
    T_EQ_INT(tlv_parse(deep, sizeof(deep), &b), RET_BAD_FORMAT);   /* 깊이 2 */
}

static void test_cut_all(void)       /* 한 바이트씩 잘라 넣는다 — 크래시가 없어야 한다 */
{
    const uint8_t raw[] = {
        0x01, 0x04, 0x00, 0x00, 0x30, 0x39,
        0x99, 0x03, 0xAA, 0xBB, 0xCC,
        0x10, 0x02, 'a', 'b',
        0x02, 0x01, 0x07,
    };
    msg_body_t b;
    size_t     cut = 0;

    T_EQ_INT(tlv_parse(raw, sizeof(raw), &b), RET_OK);
    for (cut = 0; cut < sizeof(raw); cut++) {
        T_EQ_INT(tlv_parse(raw, cut, &b) != RET_OK, 1);      /* Cause 가 맨 끝이라 어디서 잘라도 실패 */
    }
}

static void test_build_and_roundtrip(void)
{
    msg_body_t    x, y;
    uint8_t       buf[256];
    size_t        n = 0;
    const uint8_t exp[] = { 0x01, 0x04, 0x00, 0x00, 0x00, 0x01,
                            0x02, 0x01, 0x07,
                            0x99, 0x03, 0xAA, 0xBB, 0xCC };

    memset(&x, 0x00, sizeof(x));
    x.session_id = 1;  x.has_session_id = true;
    x.cause = 7;       x.has_cause = true;
    x.unknown[0].iei = 0x99;  x.unknown[0].len = 3;
    x.unknown[0].val[0] = 0xAA;  x.unknown[0].val[1] = 0xBB;  x.unknown[0].val[2] = 0xCC;
    x.unknown_num = 1;

    T_EQ_INT(tlv_build(&x, buf, sizeof(buf), &n), RET_OK);
    T_EQ_INT(n, sizeof(exp));
    T_EQ_BYTES(buf, exp, sizeof(exp));                       /* ★ 알려진 IE → 모르는 IE 순서, 바이트 정확도 */

    T_EQ_INT(tlv_build(&x, buf, sizeof(exp) - 1, &n), RET_TOO_SMALL);    /* 한 칸 모자람 */
    T_EQ_INT(n, 0);

    T_EQ_INT(tlv_build(&x, buf, sizeof(buf), &n), RET_OK);
    T_EQ_INT(tlv_parse(buf, n, &y), RET_OK);                 /* 왕복 */
    T_EQ_INT(y.session_id, 1);
    T_EQ_INT(y.cause, 7);
    T_EQ_INT(y.unknown_num, 1);
    T_EQ_INT(y.unknown[0].iei, 0x99);
    T_EQ_BYTES(y.unknown[0].val, x.unknown[0].val, 3);
}

static void test_null(void)
{
    const uint8_t raw[] = { 0x01, 0x04, 0, 0, 0, 1,  0x02, 0x01, 0x00 };
    msg_body_t    b;
    uint8_t       buf[16];
    size_t        n = 0;

    T_EQ_INT(tlv_parse(NULL, 9, &b), RET_INVALID_ARG);
    T_EQ_INT(tlv_parse(raw, sizeof(raw), NULL), RET_INVALID_ARG);
    T_EQ_INT(tlv_build(NULL, buf, sizeof(buf), &n), RET_INVALID_ARG);
    T_EQ_INT(tlv_build(&b, NULL, sizeof(buf), &n), RET_INVALID_ARG);
    T_EQ_INT(tlv_build(&b, buf, sizeof(buf), NULL), RET_INVALID_ARG);
}

int main(void)
{
    test_unknown_ie();
    test_truncated();
    test_zero_len();
    test_missing_mandatory();
    test_length_mismatch();
    test_dup_and_overflow();
    test_ext_len();
    test_nested();
    test_cut_all();
    test_build_and_roundtrip();
    test_null();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B. 변형 B 시험 — `tlv16_parse`

`main()` 은 3-A 와 같은 모양이다.
IE 는 `T(2) L(2) V` 이다.
예) `SessionId = 1` → `00 01 00 04 00 00 00 01`

```c
#define SID1    0x00, 0x01, 0x00, 0x04, 0x00, 0x00, 0x00, 0x01         /* SessionId = 1 */
#define CAUSE7  0x00, 0x02, 0x00, 0x01, 0x07                           /* Cause = 7 */

static void test_cause_by_type(void)
{
    const uint8_t no_cause[]   = { SID1 };
    const uint8_t with_cause[] = { SID1, CAUSE7 };
    msg_body_t b;

    T_EQ_INT(tlv16_parse(no_cause,   sizeof(no_cause),   1,   &b), RET_OK);           /* 요청: Cause 없어도 정상 */
    T_EQ_INT(tlv16_parse(no_cause,   sizeof(no_cause),   129, &b), RET_BAD_FORMAT);    /* 응답: 조건 참인데 없다 */
    T_EQ_INT(tlv16_parse(with_cause, sizeof(with_cause), 129, &b), RET_OK);
    T_EQ_INT(b.cause, 7);
    T_EQ_INT(tlv16_parse(with_cause, sizeof(with_cause), 1,   &b), RET_OK);            /* 요청에 왔다: 정책대로 무시 */
    T_EQ_INT(b.has_cause, 0);

    T_EQ_INT(tlv16_parse(with_cause, sizeof(with_cause), 127, &b), RET_OK);            /* 경계: 127 은 요청 */
    T_EQ_INT(b.has_cause, 0);
    T_EQ_INT(tlv16_parse(no_cause,   sizeof(no_cause),   128, &b), RET_BAD_FORMAT);    /* 경계: 128 은 응답 */
}

static void test_order_independent(void)
{
    /* Cause 가 SessionId 보다 앞에 와도 통과해야 한다 — 순회 도중 판정이면 여기서 오탐 */
    const uint8_t raw[] = { CAUSE7, SID1 };
    msg_body_t b;

    T_EQ_INT(tlv16_parse(raw, sizeof(raw), 129, &b), RET_OK);
    T_EQ_INT(b.cause, 7);
    T_EQ_INT(b.session_id, 1);
}

static void test_unknown_and_zero(void)
{
    const uint8_t raw[] = { SID1,
                            0x00, 0x99, 0x00, 0x03, 0xAA, 0xBB, 0xCC,    /* 미지원 */
                            0x00, 0x10, 0x00, 0x00 };                    /* UeName, L=0 */
    msg_body_t b;

    T_EQ_INT(tlv16_parse(raw, sizeof(raw), 1, &b), RET_OK);
    T_EQ_INT(b.unknown_num, 1);
    T_EQ_INT(b.has_name, 1);
    T_EQ_INT(b.name[0], '\0');
}

static void test_edge_and_cut(void)
{
    const uint8_t liar[]  = { SID1, 0x00, 0x10, 0x00, 0x20, 'a', 'b' };      /* L=32 인데 2바이트 */
    const uint8_t short_h[] = { SID1, 0x00, 0x10, 0x00 };                    /* L 자리가 모자람 */
    const uint8_t sid_l2[] = { 0x00, 0x01, 0x00, 0x02, 0x00, 0x01 };         /* SessionId L=2 */
    const uint8_t full[]  = { SID1, CAUSE7 };
    msg_body_t b;
    size_t     cut = 0;

    T_EQ_INT(tlv16_parse(liar, sizeof(liar), 1, &b), RET_BAD_FORMAT);
    T_EQ_INT(tlv16_parse(short_h, sizeof(short_h), 1, &b), RET_BAD_FORMAT);
    T_EQ_INT(tlv16_parse(sid_l2, sizeof(sid_l2), 1, &b), RET_BAD_FORMAT);

    for (cut = 0; cut < 8; cut++) {                                          /* SessionId(8바이트)가 완성되기 전 */
        T_EQ_INT(tlv16_parse(full, cut, 129, &b) != RET_OK, 1);
    }
    for (cut = 0; cut <= sizeof(full); cut++) {                              /* 어디서 잘라도 크래시 없음 */
        int ret = tlv16_parse(full, cut, 129, &b);
        T_EQ_INT(ret == RET_OK || ret == RET_BAD_FORMAT, 1);
    }
}

static void test_null(void)
{
    const uint8_t raw[] = { SID1 };
    msg_body_t b;

    T_EQ_INT(tlv16_parse(NULL, 8, 1, &b), RET_INVALID_ARG);
    T_EQ_INT(tlv16_parse(raw, sizeof(raw), 1, NULL), RET_INVALID_ARG);
}
```

### 3-C. 변형 C 시험 — `nas_parse` / `ie_decode`

`main()` 은 3-A 와 같은 모양이다.

```c
static void test_normal(void)
{
    const uint8_t raw[] = {
        0x02, 'a', 'b',                         /* LV: Name = "ab" */
        0x01, 0x04, 0x00, 0x00, 0x30, 0x39,     /* TLV: SessionId = 12345 */
        0x02, 0x07,                             /* TV : Cause = 7 */
        0xB5,                                   /* 반 옥텟: IEI=0xB, 값=5 */
        0x99, 0x03, 0xAA, 0xBB, 0xCC,           /* 모르는 IEI → TLV 로 가정 → RAW */
    };
    nas_msg_t m;
    uint32_t  v = 0;

    T_EQ_INT(nas_parse(raw, sizeof(raw), &m), RET_OK);
    T_EQ_INT(m.ie_num, 5);

    T_EQ_INT(m.ies[0].kind, IE_STR);   T_EQ_STR(m.ies[0].v.str, "ab");
    T_EQ_INT(m.ies[1].kind, IE_U32);   T_EQ_INT(ie_get_u32(&m.ies[1], &v), RET_OK);  T_EQ_INT(v, 12345);
    T_EQ_INT(m.ies[2].kind, IE_U8);    T_EQ_INT(m.ies[2].iei, 0x02);   T_EQ_INT(m.ies[2].v.u8, 7);
    T_EQ_INT(m.ies[3].kind, IE_U8);    T_EQ_INT(m.ies[3].iei, 0x0B);   T_EQ_INT(m.ies[3].v.u8, 5);
    T_EQ_INT(m.ies[4].kind, IE_RAW);   T_EQ_INT(m.ies[4].v.raw.len, 3);
}

static void test_edge(void)
{
    nas_msg_t m;
    uint8_t   raw[200];
    size_t    off = 0, i = 0;

    {   const uint8_t e[] = { 0x00 };                                           /* LV 길이 0: 합법 */
        T_EQ_INT(nas_parse(e, sizeof(e), &m), RET_OK);
        T_EQ_INT(m.ie_num, 1);
        T_EQ_STR(m.ies[0].v.str, ""); }
    T_EQ_INT(nas_parse((const uint8_t *)"", 0, &m), RET_BAD_FORMAT);            /* LV 가 없다 */
    {   const uint8_t e[] = { 0x05, 'a', 'b' };                                 /* LV 가 경계를 넘음 */
        T_EQ_INT(nas_parse(e, sizeof(e), &m), RET_BAD_FORMAT); }
    {   uint8_t e[40];  memset(e, 'x', sizeof(e));  e[0] = 33;                  /* LV 33자 */
        T_EQ_INT(nas_parse(e, 34, &m), RET_BAD_FORMAT); }
    {   const uint8_t e[] = { 0x00, 0x02 };                                     /* TV 의 V 가 없다 */
        T_EQ_INT(nas_parse(e, sizeof(e), &m), RET_BAD_FORMAT); }
    {   const uint8_t e[] = { 0x00, 0x01, 0x02, 0x00, 0x01 };                   /* SessionId L=2 */
        T_EQ_INT(nas_parse(e, sizeof(e), &m), RET_BAD_FORMAT); }
    {   const uint8_t e[] = { 0x00, 0x10, 0x05, 'a' };                          /* TLV 가 경계를 넘음 */
        T_EQ_INT(nas_parse(e, sizeof(e), &m), RET_BAD_FORMAT); }
    {   const uint8_t e[] = { 0x00, 0xBF, 0xB0 };                               /* 반 옥텟 경계: 15 와 0 */
        T_EQ_INT(nas_parse(e, sizeof(e), &m), RET_OK);
        T_EQ_INT(m.ies[1].v.u8, 15);  T_EQ_INT(m.ies[2].v.u8, 0); }

    raw[off++] = 0x00;                                                          /* IE 17개 → 담을 수 없다 */
    for (i = 0; i < 17; i++) raw[off++] = 0xB1;
    T_EQ_INT(nas_parse(raw, off, &m), RET_TOO_SMALL);                          /* LV 1 + IE 17 = 18 */
}

static void test_ie_union(void)
{
    const uint8_t sid[]  = { 0x00, 0x00, 0x30, 0x39 };
    const uint8_t name[] = { 'a', 'b' };                 /* 널 없음 */
    const uint8_t raw[]  = { 0xAA, 0xBB };
    ie_t     ie;
    uint32_t v = 0;

    T_EQ_INT(ie_decode(0x01, sid, 4, &ie), RET_OK);
    T_EQ_INT(ie_get_u32(&ie, &v), RET_OK);  T_EQ_INT((int)v, 12345);

    T_EQ_INT(ie_decode(0x10, name, 2, &ie), RET_OK);
    T_EQ_INT(ie_get_u32(&ie, &v), RET_INVALID_ARG);      /* ★ 태그가 다르면 읽기를 거부한다 */
    T_EQ_STR(ie.v.str, "ab");                            /* 문자열 arm 은 널 종단이 붙어 있다 */

    memset(&ie, 0xAA, sizeof(ie));                       /* ★ 잔재 시험: 쓰레기를 채운 뒤 decode */
    T_EQ_INT(ie_decode(0x20, (const uint8_t[]){0,0,0,0,0,0,0,1}, 8, &ie), RET_OK);
    T_EQ_INT(ie.v.u64 == 1, 1);

    T_EQ_INT(ie_decode(0x99, raw, 2, &ie), RET_OK);      /* 모르는 IEI -> 실패가 아니라 RAW arm */
    T_EQ_INT(ie.kind, IE_RAW);
    T_EQ_INT(ie.v.raw.len, 2);

    T_EQ_INT(ie_decode(0x01, sid, 3, &ie), RET_BAD_FORMAT);   /* 길이가 표와 다르다 */
    T_EQ_INT(ie_decode(0x01, sid, 4, NULL), RET_INVALID_ARG);
}

static void test_cut_all(void)
{
    const uint8_t raw[] = { 0x02, 'a', 'b',  0x01, 0x04, 0, 0, 0x30, 0x39,  0x02, 0x07,  0xB5,  0x99, 0x03, 1, 2, 3 };
    nas_msg_t m;
    size_t    cut = 0;

    for (cut = 0; cut <= sizeof(raw); cut++) {           /* 어디서 잘라도 크래시 없음 */
        int ret = nas_parse(raw, cut, &m);
        T_EQ_INT(ret == RET_OK || ret == RET_BAD_FORMAT, 1);
    }
}

static void test_null(void)
{
    const uint8_t raw[] = { 0x00 };
    nas_msg_t m;

    T_EQ_INT(nas_parse(NULL, 1, &m), RET_INVALID_ARG);
    T_EQ_INT(nas_parse(raw, sizeof(raw), NULL), RET_INVALID_ARG);
}
```

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [README 의 공통 Makefile](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 을 `~/cdrill/Makefile` 로 쓴다.

```bash
make D=d5_tlv V=tlv                                    # 변형 A
make D=d5_tlv V=tlv16 \
     SRC="d5_tlv/src/tlv.c d5_tlv/src/tlv16.c d5_tlv/test/test_tlv16.c"   # 변형 B
make D=d5_tlv V=nas                                    # 변형 C
```

* 마지막 줄이 **`PASS`** 이고 경고 0, 새니타이저 리포트 0 이면 통과다.
* 자르기 시험에서 ASan 이 오버런을 잡으면 `NEED(l)` 이 빠진 곳이 있는 것이다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g \
>     -Icommon -Id5_tlv/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d5_tlv/src/tlv.c d5_tlv/test/test_tlv.c \
>     -o build/d5_tlv_tlv
> ./build/d5_tlv_tlv
> ```
>
> 변형 B 는 `tlv.c tlv16.c test_tlv16.c`, 변형 C 는 `nas.c test_nas.c` 를 쓴다.

---

## 4. 자주 하는 실수

| 실수 | 증상 |
| :--- | :--- |
| `NEED(l)` 없이 `memcpy(dst, buf+off, l)` | **원격 버퍼 오버런.** TLV 파서 취약점의 99% |
| 모르는 IEI 에서 `return RET_BAD_FORMAT` | 상대가 버전업하면 **전체 메시지 거부** |
| `l` 을 `uint8_t` 로 받고 확장 길이 대입 | 0xFF 확장 시 **잘린다.** `uint32_t` 로 받는다 |
| 값 길이 검사를 안 하고 고정 필드로 복사 | `SessionId` 가 `L=2` 로 오면 4바이트를 읽는다. **IE 마다 길이 일치 검사** |
| 문자열 IE 를 그대로 `char[]` 에 복사 | **널 종단이 없다.** `L` 만큼 복사 후 `dst[l] = '\0'` |
| 중첩 TLV 를 재귀로만 처리 | 악의적 중첩으로 **스택 폭발.** 깊이 상한을 인자로 넘긴다 |
| 조건부 필수를 **순회 도중**에 판정 | IE 순서가 보장되지 않아 **정상 메시지를 오탐**한다. 순회 후 한 곳에서 |
| 요청에 `Cause` 가 왔다고 반려 | 규격은 "무시" 다. 전방 호환 원칙(모르는 건 버리지 않는다)과 같은 방향으로 관대하게 |
| union 을 **태그 확인 없이** 읽음 | 문자열 바이트를 정수로 해석한 쓰레기 값. getter 로만 읽기 |
| 문자열 arm 에 널 종단 없음 | `IE_STR` 를 `printf` 하면 뒤 메모리까지 출력. **`L` 만큼 복사 후 `dst[l] = '\0'`** |
| 표에 없는 IEI 를 디코딩 실패로 처리 | 상대가 버전업하면 전체 거부.<br>**`IE_RAW` arm 으로 받아 보존** |
| (B) `T` / `L` 을 1바이트씩 읽음 | TLV16 은 둘 다 2바이트 BE 다.<br>`rd_u16be` 로 읽고 헤더 4바이트를 `NEED(4)` 로 확인한다 |
| (C) 반 옥텟 IE 를 1옥텟 TV 로 처리 | 상위 4비트가 IEI, 하위 4비트가 값이다.<br>`octet >> 4` 와 `octet & 0x0F` |
| (C) LV 의 L 을 `NEED` 없이 믿음 | 첫 요소부터 경계를 넘을 수 있다.<br>`NEED(1)` → `NEED(l)` |
| (C) `ie_decode` 가 `memset` 없이 arm 을 채움 | 이전 IE 의 바이트가 섞여 **가끔 이상한 값**이 나온다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — `tlv_parse`
> ```c
> #define IEI_SESSION_ID  0x01
> #define IEI_CAUSE       0x02
> #define IEI_UE_NAME     0x10
> #define IEI_TIMESTAMP   0x20
> #define IEI_NESTED      0x30
>
> #define NAME_LEN_MAX      32
> #define UNKNOWN_NUM_MAX    8
> #define UNKNOWN_VAL_MAX  128
>
> typedef struct {
>     uint8_t  iei;
>     uint16_t len;
>     uint8_t  val[UNKNOWN_VAL_MAX];
> } unknown_ie_t;
>
> typedef struct {
>     uint32_t     session_id;          /* M */
>     uint8_t      cause;               /* M */
>     bool         has_session_id;      /*   수신 여부 추적용 */
>     bool         has_cause;
>
>     bool         has_name;
>     char         name[NAME_LEN_MAX + 1];
>     bool         has_ts;
>     uint64_t     ts_ms;
>
>     unknown_ie_t unknown[UNKNOWN_NUM_MAX];
>     uint8_t      unknown_num;
> } msg_body_t;
>
> static void keep_unknown(msg_body_t *out, uint8_t t, const uint8_t *v, uint32_t l)
> {
>     unknown_ie_t *u = NULL;
>
>     if (out->unknown_num >= UNKNOWN_NUM_MAX || l > UNKNOWN_VAL_MAX) {
>         LOG_WRN("drop unknown IEI=0x%02X len=%u", t, l);   /* 버리되 죽지 않는다 */
>         return;
>     }
>     u = &out->unknown[out->unknown_num++];
>     u->iei = t;
>     u->len = (uint16_t)l;
>     if (l > 0) memcpy(u->val, v, l);
> }
>
> /* D5 의 NEED: 입력이 모자란 것은 '규격 위반' 이므로 BAD_FORMAT 이다 (D4 의 NEED 는 TOO_SMALL) */
> #define NEED(_n)                                                        \
>     do {                                                                \
>         if ((size_t)(_n) > buf_len - off) {                             \
>             LOG_ERR("need %zu but %zu left (%s/%d)",                    \
>                     (size_t)(_n), buf_len - off, __func__, __LINE__);   \
>             return RET_BAD_FORMAT;                                      \
>         }                                                               \
>     } while (0)
>
> #define DUP_CHK(_has, _name)                                            \
>     do {                                                                \
>         if (_has) { LOG_WRN("dup IE %s, keep first", _name); break; }   \
>     } while (0)
>
> /* Nested 를 위해 depth 를 받는다. memset 과 필수 IE 검사는 바깥(tlv_parse)이 한다 */
> static int parse_ies(const uint8_t *buf, size_t buf_len, msg_body_t *out, int depth)
> {
>     size_t off = 0;
>
>     while (off < buf_len) {
>         uint8_t  t = 0;
>         uint32_t l = 0;
>
>         NEED(2);                                   /* ① T + L */
>         t = buf[off++];
>         l = buf[off++];
>
>         if (l == 0xFF) {                           /* ② 확장 길이 */
>             NEED(2);
>             l = rd_u16be(buf + off);
>             off += 2;
>         }
>
>         NEED(l);                                   /* ③ V 실재 확인 */
>
>         switch (t) {
>         case IEI_SESSION_ID:
>             if (l != 4) { LOG_ERR("sessionId len=%u", l); return RET_BAD_FORMAT; }
>             if (!out->has_session_id) {
>                 out->session_id     = rd_u32be(buf + off);
>                 out->has_session_id = true;
>             } else DUP_CHK(true, "SessionId");
>             break;
>
>         case IEI_CAUSE:
>             if (l != 1) return RET_BAD_FORMAT;
>             if (buf[off] > 63) { LOG_ERR("cause=%u", buf[off]); return RET_BAD_FORMAT; }
>             if (!out->has_cause) { out->cause = buf[off]; out->has_cause = true; }
>             break;
>
>         case IEI_UE_NAME:
>             if (l > NAME_LEN_MAX) return RET_BAD_FORMAT;
>             if (!out->has_name) {
>                 if (l > 0) memcpy(out->name, buf + off, l);
>                 out->name[l] = '\0';               /* ★ 널 종단은 내가 붙인다 */
>                 out->has_name = true;
>             }
>             break;
>
>         case IEI_TIMESTAMP:
>             if (l != 8) return RET_BAD_FORMAT;
>             if (!out->has_ts) {
>                 out->ts_ms = ((uint64_t)rd_u32be(buf + off) << 32)
>                            |  (uint64_t)rd_u32be(buf + off + 4);
>                 out->has_ts = true;
>             }
>             break;
>
>         case IEI_NESTED:
>             /* 깊이 1까지만: Nested 안의 Nested 는 BAD_FORMAT */
>             if (depth >= 1) { LOG_ERR("nested depth %d", depth + 1); return RET_BAD_FORMAT; }
>             CHK_RET(parse_ies(buf + off, l, out, depth + 1));
>             break;
>
>         default:                                   /* ④ 모르는 것은 보존 후 통과 */
>             keep_unknown(out, t, buf + off, l);
>             break;
>         }
>
>         off += l;                                  /* ⑤ 전진은 여기 한 곳 */
>     }
>     return RET_OK;
> }
>
> int tlv_parse(const uint8_t *buf, size_t buf_len, msg_body_t *out)
> {
>     CHK_PTR(buf);
>     CHK_PTR(out);
>     memset(out, 0x00, sizeof(*out));
>
>     CHK_RET(parse_ies(buf, buf_len, out, 0));
>
>     /* 필수 IE 검사는 순회가 끝난 뒤에 (순서 보장이 없으므로) */
>     if (!out->has_session_id) { LOG_ERR("missing SessionId"); return RET_BAD_FORMAT; }
>     if (!out->has_cause)      { LOG_ERR("missing Cause");     return RET_BAD_FORMAT; }
>
>     return RET_OK;
> }
> ```
>
> **눈여겨볼 점 4가지**
> 1. **필수 IE 검사는 루프 밖**에서 한다.
>    순서가 보장되지 않으므로 중간에 판단할 수 없다.
> 2. IE 마다 **길이 일치 검사**(`l != 4`)를 먼저 한다.
>    이게 없으면 고정 폭 읽기가 그대로 오버런이다.
> 3. 문자열은 `memcpy` 후 **내가 `'\0'` 을 붙인다.** 송신측 널 종단을 믿지 않는다.
> 4. `keep_unknown` 은 **버려도 `RET_OK`** 다.
>    보존 실패는 서비스 중단 사유가 아니다.

> [!success]- `tlv.h` 머리 · include · `tlv_build` — 위 `tlv_parse` 와 한 파일로 묶는 나머지
> 위 상수·구조체(`IEI_*` ~ `msg_body_t`)는 `tlv.h` 에 두고, 아래를 덧붙인다.
> ```c
> /* tlv.h 맨 위 / 맨 아래 */
> #ifndef TLV_H
> #define TLV_H
> #include <stdbool.h>
> #include <stddef.h>
> #include <stdint.h>
> /* …상수 · unknown_ie_t · msg_body_t… */
> int tlv_parse(const uint8_t *buf, size_t buf_len, msg_body_t *out);
> int tlv_build(const msg_body_t *in, uint8_t *buf, size_t buf_len, size_t *out_len);
> #endif
>
> /* tlv.c 맨 위 — rd_u*be 는 D4 의 be.h */
> #include "common.h"
> #include "log.h"
> #include "guard.h"
> #include "be.h"
> #include "tlv.h"
>
> /* tlv.c 맨 아래 */
> #define ROOM(_n)                                                        \
>     do {                                                                \
>         if ((size_t)(_n) > buf_len - off) return RET_TOO_SMALL;         \
>     } while (0)
>
> int tlv_build(const msg_body_t *in, uint8_t *buf, size_t buf_len, size_t *out_len)
> {
>     size_t off = 0;
>     int    i   = 0;
>
>     CHK_PTR(in);
>     CHK_PTR(buf);
>     CHK_PTR(out_len);
>     *out_len = 0;
>
>     ROOM(2 + 4);                                   /* SessionId */
>     buf[off++] = IEI_SESSION_ID;  buf[off++] = 4;
>     wr_u32be(buf + off, in->session_id);  off += 4;
>
>     ROOM(2 + 1);                                   /* Cause */
>     buf[off++] = IEI_CAUSE;  buf[off++] = 1;  buf[off++] = in->cause;
>
>     if (in->has_name) {
>         size_t n = strnlen(in->name, sizeof(in->name));
>         ROOM(2 + n);
>         buf[off++] = IEI_UE_NAME;  buf[off++] = (uint8_t)n;
>         memcpy(buf + off, in->name, n);  off += n;
>     }
>     if (in->has_ts) {
>         ROOM(2 + 8);
>         buf[off++] = IEI_TIMESTAMP;  buf[off++] = 8;
>         wr_u32be(buf + off,     (uint32_t)(in->ts_ms >> 32));
>         wr_u32be(buf + off + 4, (uint32_t)(in->ts_ms));
>         off += 8;
>     }
>     for (i = 0; i < in->unknown_num; i++) {        /* 모르는 IE 는 원문 그대로 */
>         const unknown_ie_t *u = &in->unknown[i];
>         ROOM(2 + (size_t)u->len);                  /* len <= 128 이라 L 은 1바이트 */
>         buf[off++] = u->iei;  buf[off++] = (uint8_t)u->len;
>         if (u->len > 0) memcpy(buf + off, u->val, u->len);
>         off += u->len;
>     }
>
>     *out_len = off;
>     return RET_OK;
> }
> ```

> [!success]- 확장 — 판단표 정답, `Cause` 조건, IE 테이블 구동 union
>
> | 필드 | 조건 | 다른 것과 동시에? | 패턴 | 표현 |
> | :--- | :--- | :--- | :--- | :--- |
> | `Cause` | `msg_type >= 128` 이면 M | — (단독 C) | ① 독립 C | `has_cause` + **순회 후** 조건 검사 |
> | IE 값 | **IEI 가 정한다** | **아니오** (IE 하나에 값 하나) | ② 배타 | tagged union, **태그 `kind` 신설** (IEI → kind 는 표로) |
>
> `Cause` 는 union 이 아니다 — **다른 필드와 배타 관계가 없고** 단지 "언제 필수인가" 의 문제다.
> IE 값은 arm 이 서로 다른 타입이라 union 이 자연스럽다.
>
> ```c
> /* ── 조건부 필수: 순회가 끝난 뒤 한 곳 ─────────────────────── */
> /* while (off < len) { ... 순회 ... }  ← 여기까지는 IE 를 담기만 한다 */
>
> if (msg_type >= 128) {                              /* C: 응답이면 Cause 필수 */
>     if (!out->has_cause) { LOG_ERR("Cause required in response"); return RET_BAD_FORMAT; }
> } else if (out->has_cause) {
>     LOG_WRN("Cause ignored in request");            /* 정책: 무시 */
>     out->has_cause = false;
> }
> if (!out->has_session_id) return RET_BAD_FORMAT;    /* M */
> ```
>
> ```c
> /* ── IE 값 tagged union + 테이블 구동 ─────────────────────── */
> typedef enum { IE_NONE = 0, IE_U8, IE_U32, IE_U64, IE_STR, IE_RAW, IE_END } ie_kind_t;
>
> typedef struct {
>     uint8_t     iei;
>     ie_kind_t   kind;                               /* ★ 태그 */
>     union {
>         uint8_t   u8;
>         uint32_t  u32;
>         uint64_t  u64;
>         char      str[NAME_LEN_MAX + 1];
>         struct { uint16_t len; uint8_t val[UNKNOWN_VAL_MAX]; } raw;
>     } v;
> } ie_t;
>
> typedef struct { uint8_t iei; ie_kind_t kind; uint16_t len_min, len_max; } iei_desc_t;
>
> static const iei_desc_t g_iei_tbl[] = {
>     { 0x01, IE_U32, 4, 4  },   { 0x02, IE_U8,  1, 1 },
>     { 0x10, IE_STR, 0, NAME_LEN_MAX },
>     { 0x20, IE_U64, 8, 8  },
> };
>
> int ie_decode(uint8_t iei, const uint8_t *v, size_t l, ie_t *out)
> {
>     const iei_desc_t *d = NULL;
>     size_t i = 0;
>
>     CHK_PTR(out);
>     memset(out, 0x00, sizeof(*out));                /* ★ 이전 arm 잔재 제거 */
>     out->iei = iei;
>
>     for (i = 0; i < sizeof(g_iei_tbl) / sizeof(g_iei_tbl[0]); i++) {
>         if (g_iei_tbl[i].iei == iei) { d = &g_iei_tbl[i]; break; }
>     }
>
>     if (d == NULL) {                                /* 모르는 IEI: 에러가 아니라 RAW arm */
>         if (l > UNKNOWN_VAL_MAX) return RET_TOO_SMALL;
>         out->kind = IE_RAW;
>         out->v.raw.len = (uint16_t)l;
>         memcpy(out->v.raw.val, v, l);
>         return RET_OK;
>     }
>     if (l < d->len_min || l > d->len_max) return RET_BAD_FORMAT;   /* ★ IE 마다 길이 일치 검사 */
>
>     switch (d->kind) {
>     case IE_U8:  out->v.u8  = v[0];              break;
>     case IE_U32: out->v.u32 = rd_u32be(v);       break;
>     case IE_U64: out->v.u64 = rd_u64be(v);       break;
>     case IE_STR: memcpy(out->v.str, v, l);  out->v.str[l] = '\0';  break;   /* ★ 널 종단 */
>     default:     return RET_BAD_FORMAT;
>     }
>     out->kind = d->kind;                            /* ★ 채운 뒤 태그 */
>     return RET_OK;
> }
>
> int ie_get_u32(const ie_t *ie, uint32_t *out)       /* 태그가 다르면 거부 */
> {
>     CHK_PTR(ie);  CHK_PTR(out);
>     if (ie->kind != IE_U32) return RET_INVALID_ARG;
>     *out = ie->v.u32;
>     return RET_OK;
> }
> ```
>
> **눈여겨볼 점 3가지**
> 1. 조건 검사가 **`while` 밖**이다.
>    `while` 안에서는 IE 를 담기만 한다 — 순서 무관 시험 ②가 이걸 잡는다.
> 2. 모르는 IEI 가 **`IE_RAW` arm** 이다.
>    "전방 호환" 이 union 의 한 칸으로 자연스럽게 들어온다.
> 3. `raw.val` 이 크면 union 전체가 커진다.
>    RAW 의 상한(`UNKNOWN_VAL_MAX`)을 정하는 이유다.

---

## 관련 노트

- [2. 데이터 모델 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md) — **2-8~2-10: C 분류와 tagged union** (확장 미션의 근거)
- [3. 바이트 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md)
- [6. 3GPP 규격 → C 코드 변환 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md) — 6장 IEI·TLV
- [[C] 가변 길이 구조체(Struct Hack)와 필러 필드](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20가변%20길이%20구조체%28Struct%20Hack%29와%20필러%20필드%20—%20헤더%20뒤에%20매달리는%20가변%20payload.md)
- [다음: D6. 설계 산출물](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D6.%20설계%20산출물%20—%20표를%20Mermaid%205종으로.md)
