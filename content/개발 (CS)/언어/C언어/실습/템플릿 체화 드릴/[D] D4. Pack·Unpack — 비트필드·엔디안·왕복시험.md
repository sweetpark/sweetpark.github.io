---
title: "D4. Pack·Unpack — 비트필드·엔디안·왕복시험"
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D4. Pack / Unpack — 비트필드 · 엔디안 · 왕복시험

> **쓰는 템플릿**: [3. 바이트 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md)
>
> **목표 시간**: 1회차 60분 / 2회차 38분 / **3회차(확장 포함) 40분**
>
> 규격서에 **비트 그림**이 나오는 순간 이 드릴이다.
> D8(3GPP)의 전제 조건이다.

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
| 구조체를 그대로 `memcpy` | **절대 금지.** 패딩·엔디안·타입 크기 셋 다 플랫폼마다 다르다 |
| 쓰기 전 | **항상 공간 검사부터.** `NEED(n)` → 모자라면 `RET_TOO_SMALL` |
| 읽기 전 | **항상 남은 길이 검사부터.** 길이 필드를 믿지 않는다 |
| 커서 | `size_t off = 0;` 하나로 전진. 필드마다 `off += n` |
| 검증 | **pack → unpack 왕복이 원본과 같아야** 끝난 것 |

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 자체 메시지 헤더 | ① 요구사항서<br>② pseudo code **전체** | 1. pseudo 를 한 줄씩 코드로 바꾼다.<br>2. ③ 테스트(왕복·바이트 정확도·자르기)를 실행한다. |
| **2회차** | **B** 필드 재배치 헤더 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. 번호만 보고 쓴다.<br>2. ③ 테스트를 실행한다. |
| **3회차** | **C** 버전 2종 + Type 별 payload | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 친다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 자체 메시지 헤더

> [!QUOTE] 규격서 (발췌) — 고정 헤더 12바이트 + payload + 체크섬 2바이트
> ```text
> 옥텟  7 6 5 4 3 2 1 0   (비트 번호, MSB=7)
> ──────────────────────────────────────────────────────────
>  0    │Ver(3) │ Type(5)         │   Ver 0~7, Type 0~31
>  1    │ Flags(8)                │   b0=URG b1=ACK b2=FRAG b3=ENC, b4~b7 예비
>  2-3  │ PayloadLen (16, BE)     │   0 ~ 1400
>  4-7  │ SessionId  (32, BE)     │
>  8-10 │ Sequence   (24, BE)     │   0 ~ 16,777,215
>  11   │Prio(4)│ Reserved(4)     │   Prio 0~15, Reserved 는 0 고정
> ──────────────────────────────────────────────────────────
>  12.. │ Payload (PayloadLen 바이트)
>  끝   │ Checksum (16, BE)       │   헤더+payload 전체의 인터넷 체크섬
> ```
> - 모든 다바이트 정수는 **네트워크 바이트 순서(BE)**.
> - `Reserved` 가 0이 아니면 **`RET_BAD_FORMAT`**.
> - `Flags` 의 **모르는 비트(b4~b7)는 지우지 말고 그대로 보존**한다.
>   (전방 호환)
> - 수신 시 체크섬 불일치는 **`RET_BAD_FORMAT`**.

### 미션

```c
int msg_pack  (const msg_t *in, uint8_t *buf, size_t buf_len, size_t *out_len);
int msg_unpack(const uint8_t *buf, size_t buf_len, msg_t *out, size_t *consumed);
void hexdump  (const char *tag, const uint8_t *buf, size_t len);
```

1. `rd_u16be` / `wr_u16be` / `rd_u24be` / `wr_u24be` / `rd_u32be` / `wr_u32be` 를 **직접** 구현 (`htons` 금지).
2. 인터넷 체크섬(1의 보수 합)을 직접 구현.
3. `NEED()` 공간검사 매크로를 만들고 **모든 쓰기/읽기 앞에** 건다.
4. **왕복 시험**: 임의 값 1000회 → pack → unpack → 필드 전부 일치.

**구조체 `msg_t` (A)**

| 필드 | 타입 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- |
| `ver` | `uint8_t` | 0 ~ 7 | |
| `type` | `uint8_t` | 0 ~ 31 | |
| `flags` | `uint8_t` | 8비트 전부 | **모르는 비트(b4~b7)도 그대로 보존** |
| `prio` | `uint8_t` | 0 ~ 15 | |
| `session_id` | `uint32_t` | 전체 | |
| `seq` | `uint32_t` | 0 ~ 16,777,215 | 와이어에서는 24비트 |
| `payload_len` | `uint16_t` | 0 ~ 1400 | |
| `payload` | `uint8_t[1400]` | | |

**에러 코드 규칙 (A)**

| 상황 | 리턴코드 |
| :--- | :--- |
| 인자가 NULL | `RET_INVALID_ARG` |
| `pack`: `ver` > 7, `type` > 31, `prio` > 15 | `RET_INVALID_ARG` |
| `pack`: `payload_len` > 1400, `seq` > 0xFFFFFF | `RET_BAD_FORMAT` |
| `pack`: 출력 버퍼가 모자람 / `unpack`: 입력이 짧음 | `RET_TOO_SMALL` (**아무것도 쓰지 않는다**) |
| `unpack`: `Reserved` ≠ 0, `PayloadLen` > 1400, 체크섬 불일치 | `RET_BAD_FORMAT` |

**공통 규칙**

1. 실패하면 `*out_len` / `*consumed` 는 0, `out` 구조체는 전부 0 이다.
2. 체크섬은 **체크섬 자리를 제외한** 헤더 + payload 전체를 대상으로 계산한다.
3. 쓰기는 `NEED(필요한 전체 길이)` 를 **먼저** 하고, 그다음에 쓴다.

### 1-B. 변형 B — 필드 재배치 헤더

A 와 같은 12바이트 헤더인데 **비트 오프셋이 바이트 경계를 맞추지 않는다.**
`Sequence` 가 32비트가 되고, `Prio` 가 `Flags` 안으로 들어간다.

```text
옥텟  7 6 5 4 3 2 1 0   (비트 번호, MSB=7)
──────────────────────────────────────────────────────────
 0    │Ver(3) │ Type(5)         │   Ver 0~7, Type 0~31
 1    │Prio(3)│Rsv(1)│Flags(4)  │   Prio 0~7 (b7~b5), Reserved (b4) 는 0 고정, Flags b3~b0 = ENC FRAG ACK URG
 2-3  │ PayloadLen (16, BE)     │   0 ~ 1400
 4-7  │ SessionId  (32, BE)     │
 8-11 │ Sequence   (32, BE)     │
──────────────────────────────────────────────────────────
 12.. │ Payload (PayloadLen 바이트)
 끝   │ Checksum (16, BE)       │   A 와 같은 인터넷 체크섬
```

**함수**

```c
int msgb_pack  (const msgb_t *in, uint8_t *buf, size_t buf_len, size_t *out_len);
int msgb_unpack(const uint8_t *buf, size_t buf_len, msgb_t *out, size_t *consumed);
```

**구조체 `msgb_t` (B)**

| 필드 | 타입 | 범위 / 형식 | 비고 |
| :--- | :--- | :--- | :--- |
| `ver` / `type` | `uint8_t` | 0~7 / 0~31 | |
| `prio` | `uint8_t` | 0 ~ 7 | 옥텟 1 의 b7~b5 |
| `flags` | `uint8_t` | 0 ~ 0x0F | 옥텟 1 의 b3~b0 |
| `session_id` / `seq` | `uint32_t` | 전체 | `seq` 도 32비트 |
| `payload_len` / `payload` | | 0~1400 / `uint8_t[1400]` | |

**에러 코드 규칙 (B)**

| 상황 | 리턴코드 |
| :--- | :--- |
| 인자가 NULL, `ver` > 7, `type` > 31, `prio` > 7, `flags` > 0x0F | `RET_INVALID_ARG` |
| `pack`: `payload_len` > 1400 | `RET_BAD_FORMAT` |
| 버퍼가 모자람 / 입력이 짧음 | `RET_TOO_SMALL` |
| `unpack`: `Rsv`(b4) ≠ 0, `PayloadLen` > 1400, 체크섬 불일치 | `RET_BAD_FORMAT` |

### 1-C. 변형 C — 헤더 버전 2종 공존 + Type 별 payload

A 의 헤더에 **버전 분기**와 **payload 종류 분기**를 더한다.
(`Ver=1` 은 12바이트, `Ver=2` 는 뒤에 `Timestamp(64,BE)` 8바이트 추가.)
`Timestamp` 는 C (`Ver == 2`), payload 는 `Type` 이 정하는 **배타 → tagged union** 이다.

> [!QUOTE] 규격서 (2차 개정)
> **헤더 버전**: `Ver=1` 은 12바이트.
> **`Ver=2` 이면** 12바이트 뒤에 `Timestamp`(uint64, BE, epoch ms) 8바이트가 붙는다.
> `PayloadLen` 은 **Timestamp 를 제외한** payload 길이다.
>
> **payload 는 `Type` 에 따라 모양이 다르다** (한 메시지에 **하나만** 온다)
>
> | Type | 이름 | payload |
> | :--- | :--- | :--- |
> | 1 | REGISTER | `ttl` (uint16, BE) — **2바이트** |
> | 3 | DEREGISTER | `cause` (uint8) — **1바이트** |
> | 그 외 | (미정의) | 없음 — `PayloadLen` 은 0 이어야 한다 |

**함수와 규칙 (C)**

5. **판단표**를 먼저 채운다.
   `Timestamp` 와 payload 는 **각각 어떤 패턴인가?**
   - `Timestamp` — `Ver == 2` 일 때만 존재한다 (C).
     그런데 **`Ver=1` 은 `Ver=2` 의 부분집합**이다.
     union 이 필요한가?
   - payload — `Type` 이 정하고 **동시에 올 수 없다.**
     판별자가 이미 있는가?
6. `msg_t` 에 `has_timestamp` + `timestamp` 를 추가하고 `msg_pack` / `msg_unpack` 이 **`Ver` 로 갈라** 쓰고 읽는다.
   `Ver == 2` 인데 `has_timestamp` 가 거짓이면 `RET_INVALID_ARG`.
   `Ver != 2` 인데 `has_timestamp` 가 참이면 **무시하고 12바이트로 보낸다** (정책).
   `Ver == 2` 로 선언했는데 입력이 짧으면 `RET_TOO_SMALL`.
7. **body 코덱**을 따로 만든다 (`msg_pack` 은 그대로 둔다).
   상수는 `MSG_REGISTER`(1), `MSG_DEREGISTER`(3), 그 외는 payload 없음이다.
   ```c
   int body_pack  (uint8_t type, const body_t *in, uint8_t *pl, size_t pl_cap, uint16_t *pl_len);
   int body_unpack(uint8_t type, const uint8_t *pl, size_t pl_len, body_t *out);
   ```
   `body_t` 는 **`type` 을 태그로 쓰는 tagged union.** pack 은 **`switch (type)` 으로 해당 arm 만 필드 단위로** 쓴다.

> [!DANGER] union 을 통째로 `memcpy` 해서 payload 에 넣지 말 것
> 안 쓰는 arm 자리의 바이트는 **쓰레기**이고, arm 크기도 플랫폼마다 다를 수 있다.
> 그래서 이 드릴의 핵심 시험은 **"안 쓰는 arm 에 쓰레기를 채워도 pack 결과가 같다"** 이다.

### 판단표 — 채우고 시작한다

| 필드 | 조건 | 다른 것과 동시에? | 패턴 | 표현 |
| :--- | :--- | :--- | :--- | :--- |
| `timestamp` |  |  |  |  |
| payload (`ttl` / `cause`) |  |  |  |  |

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 `d4_pack/src/*.h` / `*.c` 에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `be.h` / `msg.h` / `msg.c` — Level 1 (1회차, 전부 본다)

```c
/* be.h — 엔디안은 바이트 단위로 직접 (htons 금지) */
/* [ ] 1. 가드 BE_H, <stdint.h> */
/* [ ] 2. rd_u16be / rd_u24be / rd_u32be : static inline, 각 바이트를 (uint32_t) 로 올려서 시프트 */
/* [ ] 3. wr_u16be / wr_u24be / wr_u32be : v >> 8k 를 (uint8_t) 로 잘라 b[0] 부터 */
/* [ ] 4. (C 에서) rd_u64be / wr_u64be */

/* msg.h */
/* [ ] 1. 상수: HDR_LEN 12 / CSUM_LEN 2 / PAYLOAD_MAX 1400 */
/* [ ] 2. msg_t (§1-A 표) */
/* [ ] 3. 선언: inet_csum, msg_pack, msg_unpack, hexdump */

/* msg.c */
/* [ ] 1. inet_csum(b, len)
 *        2바이트씩 BE 로 더한다 (uint32_t 누적)
 *        홀수 바이트가 남으면 (uint32_t)b[i] << 8 을 더한다
 *        while (sum >> 16) 으로 접는다
 *        ~sum & 0xFFFF 를 돌려준다 */

/* [ ] 2. NEED(n) 매크로
 *        (size_t)n > buf_len - off 이면 로그 + return RET_TOO_SMALL
 *        (off <= buf_len 이 불변식이라 뺄셈이 안전하다) */

/* [ ] 3. msg_pack(in, buf, buf_len, out_len)
 *        가드: in / buf / out_len
 *        범위: ver > 7, type > 31, prio > 15 → INVALID_ARG
 *              payload_len > 1400, seq > 0xFFFFFF → BAD_FORMAT
 *        *out_len = 0
 *        NEED(HDR_LEN + payload_len + CSUM_LEN)     ← 한 번에 전체 공간 확보
 *        옥텟 0   : ((ver & 7) << 5) | (type & 0x1F)
 *        옥텟 1   : flags (모르는 비트도 그대로)
 *        옥텟 2-3 : wr_u16be(payload_len)
 *        옥텟 4-7 : wr_u32be(session_id)
 *        옥텟 8-10: wr_u24be(seq)
 *        옥텟 11  : (prio & 0x0F) << 4              ← Reserved 는 0 강제
 *        payload 를 복사
 *        체크섬: wr_u16be(buf + off, inet_csum(buf, off))
 *        *out_len = off, return RET_OK */

/* [ ] 4. msg_unpack(buf, buf_len, out, consumed)
 *        가드 / out 전부 0 / *consumed = 0
 *        NEED(HDR_LEN)                                ← 헤더부터
 *        ver, type, flags, plen, session_id, seq, prio 를 꺼낸다 (시프트 후 마스킹)
 *        Reserved (옥텟 11 의 하위 4비트) 가 0 이 아니면 BAD_FORMAT
 *        plen > 1400 이면 BAD_FORMAT                  ← 길이 필드 자체를 의심
 *        NEED(plen + CSUM_LEN)                        ← 실제로 그만큼 있나
 *        payload 복사
 *        체크섬 비교 (rx != calc 이면 BAD_FORMAT)
 *        *consumed = off, return RET_OK */
```

### 2-B. `msgb.c` — Level 2 (2회차, 번호와 제목만 본다)

```c
/* msgb.h / msgb.c  (be.h, inet_csum 은 A 의 것을 쓴다) */
/* [ ] 1. msgb_t 와 선언 */
/* [ ] 2. msgb_pack: 가드 → 범위 (prio 0~7, flags 0~0x0F) → NEED → 옥텟 0 → 옥텟 1 (prio << 5 | flags) → 나머지 → 체크섬 */
/* [ ] 3. msgb_unpack: 가드 → NEED(12) → 비트 꺼내기 → Rsv(b4) 검사 → plen 검사 → NEED → 체크섬 → consumed */
```

### 2-C. `msg.c` 확장 + `body.c` — Level 3 (3회차, 백지)

```c
/* 아무것도 안 본다.
 * §1-C 요구사항서와 §3-C 테스트만 보고 만든다.
 *
 * 막히면 세 가지만 찾아본다.
 *   - Timestamp 를 has_ 로 두는 이유 (Ver=1 ⊂ Ver=2)
 *   - 와이어 길이를 sizeof 가 아니라 규격 상수로 쓰는 이유
 *   - union 잔재를 막는 memset 의 위치 (body_unpack 맨 앞) */
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 로 SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 로직이 막히면 **§3 테스트의 기대 바이트**를 손으로 따라가 본다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

### 2-D. 비트 꺼내고 넣기 — 손이 기억할 두 줄

```c
/* 넣기: 값을 마스킹한 뒤 시프트해서 OR */
buf[0] = (uint8_t)(((ver & 0x07) << 5) | (type & 0x1F));

/* 꺼내기: 시프트한 뒤 마스킹 */
ver  = (uint8_t)((buf[0] >> 5) & 0x07);
type = (uint8_t)( buf[0]       & 0x1F);
```

> [!WARNING] 마스킹을 시프트 **전에** 한 번, **후에** 한 번
> 넣을 때 `& 0x07` 을 빼먹으면 `ver=9` 같은 잘못된 값이 **옆 필드를 침범한다.**
> 꺼낼 때 `& 0x07` 을 빼먹으면 위쪽 비트가 딸려온다.
> **양쪽 다 필요하다.**

> [!DANGER] `struct { unsigned ver : 3; }` 비트필드로 하지 말 것
> C 표준이 **비트 배치 순서를 정해주지 않는다.** 컴파일러·플랫폼이 바뀌면 규격과 다른 바이트가 나간다.
> 프로토콜에는 **반드시 시프트/마스크**를 쓴다.
> 비트필드는 내부 자료구조에만.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
d4_pack/src/be.h                     엔디안 헬퍼 (static inline)
d4_pack/src/msg.h   msg.c            변형 A (+ 변형 C 확장)
d4_pack/src/body.h  body.c           변형 C 의 body 코덱
d4_pack/src/msgb.h  msgb.c           변형 B
d4_pack/test/test_msg.c              변형 A 시험 (3-0 매크로 + 3-A + main)
d4_pack/test/test_msgb.c             변형 B 시험 (3-0 매크로 + 3-B + main)
d4_pack/test/test_msgx.c             변형 C 시험 (3-0 매크로 + 3-C + main)
```

> [!IMPORTANT] 시험의 형태 (D1~D9 공통)
> **정상** 한 가지, **경계** 여러 가지, **NULL / 실패** 경로를 확인한다.
> D4 는 여기에 **왕복(pack → unpack)**, **바이트 정확도(기대 바이트와 비교)**, **자르기(0 ~ len-1 바이트)** 가 붙는다.
>
> 왕복만으로는 **양쪽이 똑같이 틀린 경우**를 못 잡는다.
> 그래서 규격 그림에서 손으로 계산한 **기대 바이트**와 비교하는 시험이 반드시 필요하다.

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

#define T_EQ_BYTES(_got, _exp, _n)                                      \
    do {                                                                \
        if (memcmp((_got), (_exp), (_n)) != 0) { g_fail++;              \
            printf("  X %s:%d  bytes differ\n", __func__, __LINE__); } \
    } while (0)
```

### 3-A. 변형 A 시험 — 왕복 / 경계 / 자르기 / 바이트 정확도

```c
#include "msg.h"

static void test_roundtrip(void)
{
    int i = 0;

    for (i = 0; i < 1000; i++) {
        msg_t    a, b;
        uint8_t  buf[2048];
        size_t   len = 0, used = 0;

        memset(&a, 0x00, sizeof(a));
        memset(&b, 0x00, sizeof(b));

        do { a.ver = (uint8_t)(rand() % 8); } while (a.ver == 2);   /* Ver=2 는 변형 C 의 확장 */
        a.type        = (uint8_t)(rand() % 32);
        a.flags       = (uint8_t)(rand() % 256);      /* 모르는 비트 포함 */
        a.prio        = (uint8_t)(rand() % 16);
        a.session_id  = (uint32_t)rand();
        a.seq         = (uint32_t)(rand() % 0x1000000);
        a.payload_len = (uint16_t)(rand() % 1401);
        for (size_t k = 0; k < a.payload_len; k++) a.payload[k] = (uint8_t)(rand() % 256);

        T_EQ_INT(msg_pack(&a, buf, sizeof(buf), &len), RET_OK);
        T_EQ_INT(msg_unpack(buf, len, &b, &used), RET_OK);
        T_EQ_INT(used, len);

        /* 구조체 memcmp 금지 — 패딩 때문에 실패한다. 필드별로 비교 */
        T_EQ_INT(b.ver, a.ver);   T_EQ_INT(b.type, a.type);
        T_EQ_INT(b.flags, a.flags);   /* ★ 모르는 비트가 살아있는지 */
        T_EQ_INT(b.prio, a.prio);
        T_EQ_INT(b.session_id, a.session_id);
        T_EQ_INT(b.seq, a.seq);
        T_EQ_INT(b.payload_len, a.payload_len);
        T_EQ_INT(memcmp(b.payload, a.payload, a.payload_len), 0);
    }
}

static void test_edge(void)
{
    msg_t   m = { .ver = 1, .type = 2, .payload_len = 0 };
    uint8_t buf[16];
    size_t  len = 0;

    /* 버퍼가 1바이트 모자라면 TOO_SMALL — 절대 쓰지 말고 */
    T_EQ_INT(msg_pack(&m, buf, 13, &len), RET_TOO_SMALL);
    T_EQ_INT(msg_pack(&m, buf, 14, &len), RET_OK);   /* 12 + 0 + 2 */

    /* 잘린 수신 버퍼는 전부 BAD_FORMAT/TOO_SMALL, 절대 크래시 아님 */
    for (size_t cut = 0; cut < len; cut++) {
        msg_t  out;
        size_t used = 0;
        int    ret  = msg_unpack(buf, cut, &out, &used);
        T_EQ_INT(ret != RET_OK, 1);
    }

    /* Reserved 오염 */
    buf[11] |= 0x0F;
    { msg_t o; size_t u = 0; T_EQ_INT(msg_unpack(buf, len, &o, &u), RET_BAD_FORMAT); }
}
```

> [!TIP] "한 바이트씩 잘라서 넣어보기" 가 최고의 파서 시험이다
> 위 `for (cut...)` 루프 하나가 **경계 검사 누락을 거의 전부** 잡아낸다.
> 실무 파서 버그의 대부분이 "짧은 패킷이 왔을 때"에서 터진다.

```c
/* ── 엔디안 헬퍼: 바이트 위치까지 확인한다 ─────────────────────────── */
static void test_be(void)
{
    uint8_t b[8] = {0};

    wr_u16be(b, 0x1234);
    T_EQ_INT(b[0], 0x12);  T_EQ_INT(b[1], 0x34);
    T_EQ_INT(rd_u16be(b), 0x1234);

    wr_u24be(b, 0xABCDEF);
    T_EQ_INT(b[0], 0xAB);  T_EQ_INT(b[1], 0xCD);  T_EQ_INT(b[2], 0xEF);
    T_EQ_INT(rd_u24be(b), 0xABCDEF);

    wr_u32be(b, 0x01020304);
    T_EQ_INT(b[0], 0x01);  T_EQ_INT(b[3], 0x04);
    T_EQ_INT(rd_u32be(b), 0x01020304);

    memset(b, 0xFF, sizeof(b));
    T_EQ_INT(rd_u32be(b), 0xFFFFFFFFLL);              /* ★ 부호 확장 방지: (uint32_t) 로 올려서 시프트 */
}

/* ── 체크섬: RFC 1071 의 예제 ────────────────────────────────────── */
static void test_csum(void)
{
    const uint8_t rfc[8] = { 0x00, 0x01, 0xF2, 0x03, 0xF4, 0xF5, 0xF6, 0xF7 };
    const uint8_t odd[1] = { 0x01 };

    T_EQ_INT(inet_csum(rfc, 8), 0x220D);
    T_EQ_INT(inet_csum(odd, 1), 0xFEFF);              /* 홀수 바이트: 0x0100 의 보수 */
}

/* ── 바이트 정확도: 규격 그림에서 손으로 계산한 기대값 ───────────────── */
static void test_vector(void)
{
    msg_t   m;
    uint8_t buf[32];
    size_t  n = 0;
    /* ver=1 type=2 → 0x22 / flags=0x85 / len=0 / session=01020304 / seq=0A0B0C / prio=9 → 0x90
     * 체크섬 = ~(2285+0000+0102+0304+0A0B+0C90) = ~3D26 = C2D9 */
    const uint8_t exp[14] = { 0x22, 0x85, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
                              0x0A, 0x0B, 0x0C, 0x90, 0xC2, 0xD9 };

    memset(&m, 0x00, sizeof(m));
    m.ver = 1;  m.type = 2;  m.flags = 0x85;  m.prio = 9;
    m.session_id = 0x01020304;  m.seq = 0x0A0B0C;

    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_OK);
    T_EQ_INT(n, 14);
    T_EQ_BYTES(buf, exp, 14);                         /* ★ 왕복이 못 잡는 오류를 잡는다 */
}

static void test_errors(void)
{
    msg_t   m, o;
    uint8_t buf[2048];
    size_t  n = 0, u = 0;

    memset(&m, 0x00, sizeof(m));
    m.ver = 1;  m.type = 2;

    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_OK);

    m.ver = 8;   T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_INVALID_ARG);   m.ver = 1;
    m.type = 32; T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_INVALID_ARG);   m.type = 2;
    m.prio = 16; T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_INVALID_ARG);   m.prio = 0;
    m.seq = 0x1000000;       T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_BAD_FORMAT);   m.seq = 0;
    m.payload_len = 1401;    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_BAD_FORMAT);
    T_EQ_INT(n, 0);                                   /* ★ 실패하면 out_len 은 0 */
    m.payload_len = 1400;
    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_OK);                         /* 상한 */

    m.payload_len = 0;
    msg_pack(&m, buf, sizeof(buf), &n);
    buf[n - 1] ^= 0x01;                                                           /* 체크섬 오염 */
    T_EQ_INT(msg_unpack(buf, n, &o, &u), RET_BAD_FORMAT);
    T_EQ_INT(u, 0);

    wr_u16be(buf + 2, 1401);                                                      /* 길이 필드 거짓말 */
    T_EQ_INT(msg_unpack(buf, n, &o, &u), RET_BAD_FORMAT);

    T_EQ_INT(msg_pack(NULL, buf, sizeof(buf), &n), RET_INVALID_ARG);
    T_EQ_INT(msg_pack(&m, NULL, sizeof(buf), &n), RET_INVALID_ARG);
    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), NULL), RET_INVALID_ARG);
    T_EQ_INT(msg_unpack(NULL, 14, &o, &u), RET_INVALID_ARG);
    T_EQ_INT(msg_unpack(buf, 14, NULL, &u), RET_INVALID_ARG);
    T_EQ_INT(msg_unpack(buf, 14, &o, NULL), RET_INVALID_ARG);
}

int main(void)
{
    test_be();
    test_csum();
    test_vector();
    test_roundtrip();
    test_edge();
    test_errors();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B. 변형 B 시험 — `msgb_*`

`main()` 은 3-A 와 같은 모양이다.
B 의 `buf` 는 `ver=1 type=2 flags=0x05(URG|FRAG) prio=7 session=01020304 seq=AABBCCDD` 를 기준으로 한다.

```c
#include "msgb.h"

static void test_vector(void)
{
    msgb_t  m;
    uint8_t buf[32];
    size_t  n = 0;
    /* 옥텟 0 = 0x22 / 옥텟 1 = (7 << 5) | 0x05 = 0xE5 / len=0 / session / seq=AABBCCDD
     * 체크섬 = ~(22E5+0000+0102+0304+AABB+CCDD) = ~(9E84) = 617B */
    const uint8_t exp[14] = { 0x22, 0xE5, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
                              0xAA, 0xBB, 0xCC, 0xDD, 0x61, 0x7B };

    memset(&m, 0x00, sizeof(m));
    m.ver = 1;  m.type = 2;  m.flags = 0x05;  m.prio = 7;
    m.session_id = 0x01020304;  m.seq = 0xAABBCCDDu;

    T_EQ_INT(msgb_pack(&m, buf, sizeof(buf), &n), RET_OK);
    T_EQ_INT(n, 14);
    T_EQ_BYTES(buf, exp, 14);
}

static void test_roundtrip(void)
{
    int i = 0;

    for (i = 0; i < 1000; i++) {
        msgb_t  a, b;
        uint8_t buf[2048];
        size_t  len = 0, used = 0, k = 0;

        memset(&a, 0x00, sizeof(a));
        memset(&b, 0x00, sizeof(b));
        a.ver = (uint8_t)(rand() % 8);   a.type = (uint8_t)(rand() % 32);
        a.flags = (uint8_t)(rand() % 16); a.prio = (uint8_t)(rand() % 8);
        a.session_id = (uint32_t)rand(); a.seq = ((uint32_t)rand() << 1) ^ (uint32_t)rand();
        a.payload_len = (uint16_t)(rand() % 1401);
        for (k = 0; k < a.payload_len; k++) a.payload[k] = (uint8_t)(rand() % 256);

        T_EQ_INT(msgb_pack(&a, buf, sizeof(buf), &len), RET_OK);
        T_EQ_INT(msgb_unpack(buf, len, &b, &used), RET_OK);
        T_EQ_INT(used, len);
        T_EQ_INT(b.ver, a.ver);       T_EQ_INT(b.type, a.type);
        T_EQ_INT(b.flags, a.flags);   T_EQ_INT(b.prio, a.prio);   /* ★ 같은 옥텟의 두 필드가 안 섞인다 */
        T_EQ_INT(b.session_id, a.session_id);
        T_EQ_INT(b.seq, a.seq);                                   /* 32비트 전체 */
        T_EQ_INT(b.payload_len, a.payload_len);
        T_EQ_BYTES(b.payload, a.payload, a.payload_len);
    }
}

static void test_edge(void)
{
    msgb_t  m, o;
    uint8_t buf[32];
    size_t  n = 0, u = 0, cut = 0;

    memset(&m, 0x00, sizeof(m));
    m.ver = 1;  m.type = 2;

    T_EQ_INT(msgb_pack(&m, buf, 13, &n), RET_TOO_SMALL);      /* 한 칸 모자람 */
    T_EQ_INT(msgb_pack(&m, buf, 14, &n), RET_OK);

    m.prio = 8;   T_EQ_INT(msgb_pack(&m, buf, sizeof(buf), &n), RET_INVALID_ARG);   /* 3비트 초과 */
    m.prio = 7;   T_EQ_INT(msgb_pack(&m, buf, sizeof(buf), &n), RET_OK);
    m.flags = 0x10; T_EQ_INT(msgb_pack(&m, buf, sizeof(buf), &n), RET_INVALID_ARG); /* Rsv 자리 침범 */
    m.flags = 0;

    msgb_pack(&m, buf, sizeof(buf), &n);
    for (cut = 0; cut < n; cut++) {                           /* 자르기 */
        T_EQ_INT(msgb_unpack(buf, cut, &o, &u) != RET_OK, 1);
    }

    buf[1] |= 0x10;                                           /* Rsv(b4) 오염 */
    T_EQ_INT(msgb_unpack(buf, n, &o, &u), RET_BAD_FORMAT);
}

static void test_null(void)
{
    msgb_t  m, o;
    uint8_t buf[32];
    size_t  n = 0;

    memset(&m, 0x00, sizeof(m));
    T_EQ_INT(msgb_pack(NULL, buf, sizeof(buf), &n), RET_INVALID_ARG);
    T_EQ_INT(msgb_pack(&m, NULL, sizeof(buf), &n), RET_INVALID_ARG);
    T_EQ_INT(msgb_pack(&m, buf, sizeof(buf), NULL), RET_INVALID_ARG);
    T_EQ_INT(msgb_unpack(NULL, 14, &o, &n), RET_INVALID_ARG);
}
```

### 3-C. 변형 C 시험 — 버전 2종 + body union

`main()` 은 3-A 와 같은 모양이다.
C 의 `msg_t` 는 `has_timestamp` / `timestamp` 가 추가된 것이고, `be.h` 에 `wr_u64be` / `rd_u64be` 가 있어야 한다.

```c
#include "msg.h"
#include "body.h"

static void test_ver2_timestamp(void)
{
    msg_t   m, b;
    uint8_t buf[64];
    size_t  n = 0, used = 0;

    memset(&m, 0x00, sizeof(m));
    m.ver = 2; m.type = 4; m.has_timestamp = true; m.timestamp = 0x0102030405060708ULL;
    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_OK);
    T_EQ_INT((int)n, 12 + 8 + 2);                    /* 헤더 12 + Timestamp 8 + 체크섬 2 */

    /* ① Ver=2 인데 has_timestamp=false -> 조건 참인데 없다 -> 반려 */
    m.has_timestamp = false;
    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_INVALID_ARG);

    /* ② Ver=1 인데 has_timestamp=true -> 조건 거짓인데 있다 -> 정책 (예: 무시하고 12바이트로 보낸다) */
    m.ver = 1; m.has_timestamp = true;
    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_OK);
    T_EQ_INT((int)n, 12 + 2);

    /* ③ Ver=2 로 선언했는데 12바이트만 왔다 -> 잘림 -> 크래시 없이 반려 */
    m.ver = 2; m.has_timestamp = true;
    msg_pack(&m, buf, sizeof(buf), &n);
    T_EQ_INT(msg_unpack(buf, 12, &b, &used), RET_TOO_SMALL);

    /* ④ 왕복: Timestamp 가 살아 돌아온다 */
    T_EQ_INT(msg_unpack(buf, n, &b, &used), RET_OK);
    T_EQ_INT(b.has_timestamp, 1);
    T_EQ_INT(b.timestamp == 0x0102030405060708ULL, 1);
    T_EQ_INT(used, n);
}

static void test_body_union(void)
{
    body_t  a, b;
    uint8_t p1[8], p2[8];
    uint16_t l1 = 0, l2 = 0;

    /* ⑤ ★ 안 쓰는 arm 에 쓰레기를 채워도 pack 결과가 같아야 한다 */
    memset(&a, 0x00, sizeof(a));  a.u.reg.ttl = 300;
    memset(&b, 0xAA, sizeof(b));  b.u.reg.ttl = 300;     /* 나머지 바이트는 전부 0xAA */
    T_EQ_INT(body_pack(1, &a, p1, sizeof(p1), &l1), RET_OK);
    T_EQ_INT(body_pack(1, &b, p2, sizeof(p2), &l2), RET_OK);
    T_EQ_INT((int)l1, 2);
    T_EQ_INT(l1 == l2 && memcmp(p1, p2, l1) == 0, 1);

    /* ⑥ payload 길이가 arm 이 요구하는 길이와 다르면 반려 (REGISTER 는 정확히 2) */
    T_EQ_INT(body_unpack(1, p1, 1, &b), RET_BAD_FORMAT);
    T_EQ_INT(body_unpack(1, p1, 3, &b), RET_BAD_FORMAT);

    /* ⑦ 미정의 Type 은 payload 가 0 이어야 한다 */
    T_EQ_INT(body_unpack(9, p1, 0, &b), RET_OK);
    T_EQ_INT(body_unpack(9, p1, 1, &b), RET_BAD_FORMAT);
}

/* body 코덱과 msg 코덱을 이어 붙인 끝-끝 시험 */
static void test_end_to_end(void)
{
    msg_t    m, r;
    body_t   in, got;
    uint8_t  buf[64];
    uint16_t pl = 0;
    size_t   n = 0, used = 0;

    memset(&m, 0x00, sizeof(m));
    memset(&in, 0x00, sizeof(in));
    in.u.reg.ttl = 300;

    m.ver = 2;  m.type = MSG_REGISTER;
    m.has_timestamp = true;  m.timestamp = 1700000000123ULL;
    T_EQ_INT(body_pack(m.type, &in, m.payload, sizeof(m.payload), &pl), RET_OK);
    m.payload_len = pl;

    T_EQ_INT(msg_pack(&m, buf, sizeof(buf), &n), RET_OK);
    T_EQ_INT(n, 12 + 8 + 2 + 2);                      /* 헤더 + Timestamp + payload + 체크섬 */
    T_EQ_INT(msg_unpack(buf, n, &r, &used), RET_OK);
    T_EQ_INT(body_unpack(r.type, r.payload, r.payload_len, &got), RET_OK);
    T_EQ_INT(got.u.reg.ttl, 300);
}

static void test_roundtrip_c(void)                    /* Ver=2 를 포함한 1000회 왕복 */
{
    int i = 0;

    for (i = 0; i < 1000; i++) {
        msg_t   a, b;
        uint8_t buf[2048];
        size_t  len = 0, used = 0, k = 0;

        memset(&a, 0x00, sizeof(a));
        a.ver = (uint8_t)(rand() % 3);                /* 0 / 1 / 2 */
        a.type = (uint8_t)(rand() % 32);
        a.flags = (uint8_t)(rand() % 256);
        a.session_id = (uint32_t)rand();
        a.payload_len = (uint16_t)(rand() % 1401);
        for (k = 0; k < a.payload_len; k++) a.payload[k] = (uint8_t)(rand() % 256);
        if (a.ver == 2) { a.has_timestamp = true; a.timestamp = ((uint64_t)rand() << 32) | (uint64_t)rand(); }

        T_EQ_INT(msg_pack(&a, buf, sizeof(buf), &len), RET_OK);
        T_EQ_INT(msg_unpack(buf, len, &b, &used), RET_OK);
        T_EQ_INT(b.has_timestamp, a.has_timestamp);
        T_EQ_INT(b.timestamp == a.timestamp, 1);
        T_EQ_INT(b.payload_len, a.payload_len);
        T_EQ_BYTES(b.payload, a.payload, a.payload_len);
    }
}

int main(void)
{
    test_ver2_timestamp();
    test_body_union();
    test_end_to_end();
    test_roundtrip_c();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [README 의 공통 Makefile](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 을 `~/cdrill/Makefile` 로 쓴다.

```bash
make D=d4_pack V=msg                                   # 변형 A
make D=d4_pack V=msgb                                  # 변형 B
make D=d4_pack V=msgx \
     SRC="d4_pack/src/msg.c d4_pack/src/body.c d4_pack/test/test_msgx.c"   # 변형 C
```

* 마지막 줄이 **`PASS`** 이고 경고 0, 새니타이저 리포트 0 이면 통과다.
* 실패하면 `printf` 로 어느 줄인지, 기대값과 실제값이 나온다.
* 바이트가 다르면 `hexdump()` (§6) 로 `pack` 결과를 찍어 기대 바이트와 눈으로 비교한다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g \
>     -Icommon -Id4_pack/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d4_pack/src/msg.c d4_pack/test/test_msg.c \
>     -o build/d4_pack_msg
> ./build/d4_pack_msg
> ```
>
> 변형 B 는 `msgb`, 변형 C 는 `d4_pack/src/msg.c d4_pack/src/body.c d4_pack/test/test_msgx.c` 를 쓴다.

---

## 4. 자주 하는 실수

| 실수 | 증상 |
| :--- | :--- |
| `buf[off] << 24` 에서 `buf` 가 `uint8_t` | `int` 로 승격돼 **부호 비트를 건드린다.** `(uint32_t)buf[off] << 24` 로 캐스팅 |
| `memcmp(&a, &b, sizeof(a))` 로 구조체 비교 | **패딩 바이트**가 달라서 무작위로 실패한다. 필드별 비교 |
| 길이 필드를 믿고 `memcpy(dst, buf+12, payload_len)` | 악의적/잘린 패킷에서 **버퍼 오버런.** `12 + payload_len <= buf_len` 먼저 |
| `buf_len - off` 를 `size_t` 로 계산했는데 `off > buf_len` | **음수가 거대한 양수로** 돌아 검사 통과. `off <= buf_len` 을 불변식으로 유지 |
| 체크섬을 넣기 전에 계산 | 체크섬 자리를 0으로 두고 계산해야 수신 측과 맞는다 |
| Reserved 를 그냥 복사 | 규격상 0이어야 한다. 보내는 쪽은 **0으로 강제**, 받는 쪽은 **0인지 검사** |
| `Ver=1` 이 `Ver=2` 의 부분집합인데 union 으로 만듦 | 필요 없는 태그·복잡도. **포함 관계는 `has_`** 로 충분하다 |
| union 을 `memcpy(buf, &body, sizeof(body))` 로 payload 에 넣음 | 안 쓴 arm 의 **쓰레기가 전송**되고 `PayloadLen` 도 틀린다 |
| `Ver=2` 인데 `has_timestamp` 를 안 보고 `timestamp` 를 씀 | 0 으로 초기화된 시각이 나간다 ("안 채운 것" 과 "0" 을 구분 못 함) |
| payload 길이를 arm 의 `sizeof` 로 계산 | 패딩 때문에 **와이어 길이와 다르다.**<br>규격이 정한 바이트 수를 상수로 쓴다 |
| (B) `prio` 를 `& 0x0F` (4비트) 로 마스킹 | 3비트짜리 필드가 `Rsv` 자리(b4)를 침범한다.<br>`& 0x07` 후 `<< 5` |
| (B) `Rsv`(b4) 를 `flags` 의 일부로 취급 | 보존해야 하는 `flags` 비트가 아니라 **0 이어야 하는** 예약 비트다 |
| (B) `seq` 를 24비트로 읽거나 마스킹 | 32비트 전체를 `rd_u32be` / `wr_u32be` 로 쓴다 |
| 왕복 시험만 있고 기대 바이트 시험이 없음 | 쓰는 쪽과 읽는 쪽이 **똑같이 틀리면** 왕복은 통과한다 |

---

## 5. 모범답안 (변형 A)

> [!success]- 다 치고 나서 열 것 — 엔디안 + 공간검사 + pack
> ```c
> #define HDR_LEN        12
> #define CSUM_LEN        2
> #define PAYLOAD_MAX  1400
>
> /* ── 엔디안: 바이트 단위로 직접. htons 를 쓰지 않는다 ─────── */
> static inline uint16_t rd_u16be(const uint8_t *b)
> { return (uint16_t)(((uint16_t)b[0] << 8) | (uint16_t)b[1]); }
>
> static inline uint32_t rd_u24be(const uint8_t *b)
> { return ((uint32_t)b[0] << 16) | ((uint32_t)b[1] << 8) | (uint32_t)b[2]; }
>
> static inline uint32_t rd_u32be(const uint8_t *b)
> { return ((uint32_t)b[0] << 24) | ((uint32_t)b[1] << 16)
>        | ((uint32_t)b[2] <<  8) |  (uint32_t)b[3]; }
>
> static inline void wr_u16be(uint8_t *b, uint16_t v)
> { b[0] = (uint8_t)(v >> 8); b[1] = (uint8_t)(v); }
>
> static inline void wr_u24be(uint8_t *b, uint32_t v)
> { b[0] = (uint8_t)(v >> 16); b[1] = (uint8_t)(v >> 8); b[2] = (uint8_t)(v); }
>
> static inline void wr_u32be(uint8_t *b, uint32_t v)
> { b[0] = (uint8_t)(v >> 24); b[1] = (uint8_t)(v >> 16);
>   b[2] = (uint8_t)(v >>  8); b[3] = (uint8_t)(v); }
>
> /* ── 인터넷 체크섬 (1의 보수 합) — static 이 아니다. msg.h 에 선언하고 시험이 직접 부른다 ── */
> uint16_t inet_csum(const uint8_t *b, size_t len)
> {
>     uint32_t sum = 0;
>     size_t   i   = 0;
>
>     for (i = 0; i + 1 < len; i += 2) sum += rd_u16be(b + i);
>     if (i < len) sum += (uint32_t)b[i] << 8;          /* 홀수 바이트 패딩 */
>     while (sum >> 16) sum = (sum & 0xFFFF) + (sum >> 16);
>     return (uint16_t)(~sum & 0xFFFF);
> }
>
> /* ── 공간 검사: 쓰기/읽기 앞에 무조건 ─────────────────────── */
> #define NEED(_n)                                                        \
>     do {                                                                \
>         if ((size_t)(_n) > buf_len - off) {                             \
>             LOG_ERR("need %zu but %zu left (%s/%d)",                    \
>                     (size_t)(_n), buf_len - off, __func__, __LINE__);   \
>             return RET_TOO_SMALL;                                       \
>         }                                                               \
>     } while (0)
>
> int msg_pack(const msg_t *in, uint8_t *buf, size_t buf_len, size_t *out_len)
> {
>     size_t off = 0;
>
>     CHK_PTR(in);
>     CHK_PTR(buf);
>     CHK_PTR(out_len);
>     *out_len = 0;                                 /* ★ 실패하면 0 */
>
>     /* uint8_t 에 '< 0' 비교를 넣지 않는다 (-Wtype-limits 가 -Werror 에서 깨진다) */
>     if (in->ver > 7 || in->type > 31 || in->prio > 15) {
>         LOG_ERR("ver/type/prio out of range (%s/%d)", __func__, __LINE__);
>         return RET_INVALID_ARG;
>     }
>     if (in->payload_len > PAYLOAD_MAX) return RET_BAD_FORMAT;
>     if (in->seq > 0xFFFFFFu)           return RET_BAD_FORMAT;
>
>     NEED(HDR_LEN + in->payload_len + CSUM_LEN);   /* ★ 한 번에 전체 공간 확보 */
>
>     buf[off++] = (uint8_t)(((in->ver & 0x07) << 5) | (in->type & 0x1F));
>     buf[off++] = in->flags;                       /* 모르는 비트도 그대로 */
>     wr_u16be(buf + off, in->payload_len);  off += 2;
>     wr_u32be(buf + off, in->session_id);   off += 4;
>     wr_u24be(buf + off, in->seq);          off += 3;
>     buf[off++] = (uint8_t)((in->prio & 0x0F) << 4);   /* Reserved 는 0 강제 */
>
>     if (in->payload_len > 0) {
>         memcpy(buf + off, in->payload, in->payload_len);
>         off += in->payload_len;
>     }
>
>     wr_u16be(buf + off, inet_csum(buf, off));   off += CSUM_LEN;
>
>     *out_len = off;
>     return RET_OK;
> }
> ```

> [!success]- `msg_unpack` — 길이를 절대 믿지 않는다
> ```c
> int msg_unpack(const uint8_t *buf, size_t buf_len, msg_t *out, size_t *consumed)
> {
>     size_t   off  = 0;
>     uint16_t plen = 0, csum_rx = 0, csum_calc = 0;
>     uint8_t  b11  = 0;
>
>     CHK_PTR(buf);
>     CHK_PTR(out);
>     CHK_PTR(consumed);
>
>     memset(out, 0x00, sizeof(*out));
>     *consumed = 0;
>
>     NEED(HDR_LEN);                                   /* ① 헤더부터 */
>
>     out->ver   = (uint8_t)((buf[0] >> 5) & 0x07);
>     out->type  = (uint8_t)( buf[0]       & 0x1F);
>     out->flags = buf[1];
>     plen       = rd_u16be(buf + 2);
>     out->session_id = rd_u32be(buf + 4);
>     out->seq        = rd_u24be(buf + 8);
>
>     b11 = buf[11];
>     out->prio = (uint8_t)((b11 >> 4) & 0x0F);
>     if ((b11 & 0x0F) != 0) {                         /* ② Reserved 검사 */
>         LOG_ERR("reserved=0x%X", b11 & 0x0F);
>         return RET_BAD_FORMAT;
>     }
>     off = HDR_LEN;
>
>     if (plen > PAYLOAD_MAX) {                        /* ③ 길이 필드 자체를 의심 */
>         LOG_ERR("payload_len=%u > max", plen);
>         return RET_BAD_FORMAT;
>     }
>     NEED((size_t)plen + CSUM_LEN);                   /* ④ 실제로 그만큼 있나 */
>
>     if (plen > 0) memcpy(out->payload, buf + off, plen);
>     out->payload_len = plen;
>     off += plen;
>
>     csum_rx   = rd_u16be(buf + off);
>     csum_calc = inet_csum(buf, off);
>     if (csum_rx != csum_calc) {                      /* ⑤ 무결성 */
>         LOG_ERR("csum rx=0x%04X calc=0x%04X", csum_rx, csum_calc);
>         return RET_BAD_FORMAT;
>     }
>     off += CSUM_LEN;
>
>     *consumed = off;                                 /* ⑥ 몇 바이트 먹었는지 */
>     return RET_OK;
> }
> ```
>
> **눈여겨볼 점 4가지**
> 1. `NEED` 를 **세 번** 건다.
>    헤더 전 / payload+체크섬 전 / (스트림이면 반복 전).
>    한 번으로 뭉치면 잘린 패킷에서 샌다.
> 2. `plen > PAYLOAD_MAX` 검사와 `NEED(plen + 2)` 검사는 **둘 다 필요하다.** 앞은 규격 위반, 뒤는 버퍼 부족 — 원인이 다르다.
> 3. `*consumed` 를 돌려주면 **스트림에서 연속 파싱**이 가능해진다(다음 메시지 시작점).
> 4. `off <= buf_len` 이 항상 참이라 `buf_len - off` 가 **음수로 돌지 않는다.** 이 불변식을 깨지 않게 `off` 는 `NEED` 통과 후에만 증가시킨다.

> [!success]- 확장 — 판단표 정답과 `Ver` 조건, `type` 태그 union (변형 C)
>
> | 필드 | 조건 | 다른 것과 동시에? | 패턴 | 표현 |
> | :--- | :--- | :--- | :--- | :--- |
> | `timestamp` | `Ver == 2` 일 때 | — (단독 C) | ① 독립 C | **`has_timestamp` + 조건 검사.** `Ver=1` ⊂ `Ver=2` 라서 **union 불필요** |
> | payload | `Type` 이 정함 | **아니오** (한 메시지에 하나) | ② 배타 | **tagged union, 태그 = 기존 `type` 필드 재사용** |
>
> 한 줄 결론: **"버전이 달라 필드가 늘어나는 것"은 `has_`, "종류가 달라 모양이 바뀌는 것"은 union.**
>
> ```c
> /* ── 헤더 C: Ver == 2 일 때만 Timestamp ─────────────────────── */
> if (in->ver == 2) {
>     if (!in->has_timestamp) { LOG_ERR("Ver=2 needs timestamp"); return RET_INVALID_ARG; }
>     NEED(8);
>     wr_u64be(buf + off, in->timestamp);  off += 8;
> } else if (in->has_timestamp) {
>     LOG_WRN("timestamp ignored: Ver=%u", in->ver);       /* 정책: 조건 거짓이면 보내지 않는다 */
> }
>
> /* ── body: 태그로 갈라 필드 단위로 ──────────────────────────── */
> typedef struct { uint16_t ttl; }  reg_body_t;
> typedef struct { uint8_t  cause; } dereg_body_t;
> typedef struct {
>     union { reg_body_t reg; dereg_body_t dereg; } u;       /* 태그는 밖의 type — 별도 필드를 만들지 않는다 */
> } body_t;
>
> #define BODY_REG_LEN     2                                 /* ★ 와이어 길이는 규격 상수. sizeof 가 아니다 */
> #define BODY_DEREG_LEN   1
>
> int body_pack(uint8_t type, const body_t *in, uint8_t *pl, size_t pl_cap, uint16_t *pl_len)
> {
>     CHK_PTR(in);  CHK_PTR(pl);  CHK_PTR(pl_len);
>     switch (type) {
>     case MSG_REGISTER:
>         if (pl_cap < BODY_REG_LEN) return RET_TOO_SMALL;
>         wr_u16be(pl, in->u.reg.ttl);                       /* ★ 이 arm 만, 필드 단위로 */
>         *pl_len = BODY_REG_LEN;
>         return RET_OK;
>     case MSG_DEREGISTER:
>         if (pl_cap < BODY_DEREG_LEN) return RET_TOO_SMALL;
>         pl[0] = in->u.dereg.cause;
>         *pl_len = BODY_DEREG_LEN;
>         return RET_OK;
>     default:                                               /* 미정의 Type: payload 없음 */
>         *pl_len = 0;
>         return RET_OK;
>     }
> }
>
> int body_unpack(uint8_t type, const uint8_t *pl, size_t pl_len, body_t *out)
> {
>     CHK_PTR(out);
>     memset(out, 0x00, sizeof(*out));                       /* ★ union 잔재 제거 */
>     switch (type) {
>     case MSG_REGISTER:    if (pl_len != BODY_REG_LEN)   return RET_BAD_FORMAT;
>                           out->u.reg.ttl = rd_u16be(pl);            return RET_OK;
>     case MSG_DEREGISTER:  if (pl_len != BODY_DEREG_LEN) return RET_BAD_FORMAT;
>                           out->u.dereg.cause = pl[0];               return RET_OK;
>     default:              return (pl_len == 0) ? RET_OK : RET_BAD_FORMAT;
>     }
> }
> ```
>
> **눈여겨볼 점 3가지**
> 1. `body_t` 안에 **태그를 두지 않았다.** `type` 이 이미 헤더에 있으므로 그걸 인자로 받는다.
>    태그가 둘이면 어긋난다.
> 2. `case` 마다 **`pl_len != 규격 상수`** 를 본다.
>    길이를 `sizeof(reg_body_t)` 로 잡으면 패딩 때문에 와이어와 달라진다.
> 3. 시험 ④ 가 이 코드의 **유일한 방어선**이다.
>    `memcpy(pl, &in->u, sizeof(in->u))` 로 짜도 정상 값 시험은 다 통과한다.

---

## 6. 부록 — 헥사덤프 (눈으로 보기)

> [!success]- `hexdump` 한 벌 만들어두면 전 드릴에서 쓴다
> ```c
> void hexdump(const char *tag, const uint8_t *buf, size_t len)
> {
>     size_t i = 0, j = 0;
>     char   line[80];
>
>     printf("── %s (%zu bytes) ──\n", tag ? tag : "", len);
>     for (i = 0; i < len; i += 16) {
>         int n = snprintf(line, sizeof(line), "%04zx  ", i);
>
>         for (j = 0; j < 16; j++) {
>             n += (i + j < len)
>                ? snprintf(line + n, sizeof(line) - (size_t)n, "%02X ", buf[i + j])
>                : snprintf(line + n, sizeof(line) - (size_t)n, "   ");
>             if (j == 7) n += snprintf(line + n, sizeof(line) - (size_t)n, " ");
>         }
>         n += snprintf(line + n, sizeof(line) - (size_t)n, " |");
>         for (j = 0; j < 16 && i + j < len; j++) {
>             uint8_t c = buf[i + j];
>             n += snprintf(line + n, sizeof(line) - (size_t)n, "%c",
>                           (c >= 0x20 && c < 0x7F) ? (char)c : '.');
>         }
>         printf("%s|\n", line);
>     }
> }
> ```

---

## 관련 노트

- [2. 데이터 모델 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md) — **2-8~2-10: C 분류와 tagged union** (확장 미션의 근거)
- [3. 바이트 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md)
- [[C] 엔디안(바이트 순서)과 인터넷 체크섬](개발%20%28CS%29/언어/C언어/비트·바이트·정수/[C]%20엔디안%28바이트%20순서%29과%20인터넷%20체크섬%20—%20LSB·MSB와%20htons를%20직접%20만들어보기.md)
- [[C] 시프트로 여러 필드를 하나의 정수에 조합하기 — 필드 패킹](개발%20%28CS%29/언어/C언어/비트·바이트·정수/[C]%20시프트로%20여러%20필드를%20하나의%20정수에%20조합하기%20—%20필드%20패킹.md)
- [[C] 비트플래그(Bit Flag) 연산](개발%20%28CS%29/언어/C언어/비트·바이트·정수/[C]%20비트플래그%28Bit%20Flag%29%20연산.md)
- [[C] 메모리 정렬(Memory Alignment)과 aligned_alloc](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20메모리%20정렬%28Memory%20Alignment%29과%20aligned_alloc%20—%20CPU%20워드%20경계와%20안전한%20할당%20래퍼.md)
- [다음: D5. TLV 파서](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D5.%20TLV%20파서%20—%20모르는%20태그%20건너뛰기.md)
