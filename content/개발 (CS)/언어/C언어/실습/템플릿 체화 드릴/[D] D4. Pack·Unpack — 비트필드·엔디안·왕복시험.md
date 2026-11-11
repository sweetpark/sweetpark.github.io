---
title: "D4. Pack·Unpack — 비트필드·엔디안·왕복시험"
description: "비트필드, 엔디안, 왕복 시험으로 규격서의 비트 그림을 코드로 옮기는 Pack, Unpack D4 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-11-11
---

# D4. Pack·Unpack — 비트필드·엔디안·왕복시험

> **쓰는 템플릿**: [3. 바이트 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md)

> [!TIP]
> - 이론: 아래 §1 표의 **코드 골격 노트** 해당 절 (링크만 걸고 핵심만 요약했다)
> - 실습: [P042_d4_msg](https://github.com/sweetpark/c-playgound/tree/main/drill/P042_d4_msg) — `make P042` 로 채점 (요구사항 전문은 폴더의 `problem.md`)

---

## 📌 한눈에 보기

| 항목 | 내용 |
|---|---|
| 체화할 것 | Pack / Unpack: 비트필드 · 엔디안 · 왕복 시험 |
| 변형 A | 자체 메시지 헤더 |
| 변형 B | 필드 재배치 헤더 |
| 변형 C | 헤더 버전 2종 공존 + Type 별 payload |
| 실습 문제 | [P042](https://github.com/sweetpark/c-playgound/tree/main/drill/P042_d4_msg) (변형 A) |

---

## 1. 이론은 여기 — 코드 골격 노트

| 핵심 요약 | 노트 (절로 바로 이동) |
|---|---|
| 구조체를 그대로 보내면 안 되는 이유 세 가지: **패딩 · 엔디안 · 타입 크기**. 해답은 필드를 하나씩, 순서를 명시해 버퍼에 넣는 것 | [골격 3 · §0 왜 구조체를 그대로 보내면 안 되는가](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#0-왜-구조체를-그대로-보내면-안-되는가) |
| 엔디안 읽기/쓰기는 바이트로만 접근 (`rd_u16be` 등). 정렬되지 않은 주소에 `uint16_t *` 캐스팅 금지 (ARM 에서 SIGBUS) | [골격 3 · §1 엔디안 읽기/쓰기 — 복붙용 전문](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#1-엔디안-읽기쓰기--복붙용-전문) |
| 시프트 전에 `(uint32_t)` 로 캐스팅해야 하는 이유 (`uint8_t` 는 `int` 로 승격) | [골격 3 · §1-2 `(uint32_t)` 캐스팅이 왜 필요한가](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#1-2-uint32_t-캐스팅이-왜-필요한가) |
| 비트플래그: `SET_FIELD` 는 **먼저 지우고(`&= ~mask`) 넣는다**. 프로토콜에 C 의 비트 필드(`unsigned x : 3;`)를 쓰지 않는다 | [골격 3 · §2 비트플래그 — 복붙용 매크로](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#2-비트플래그--복붙용-매크로) |
| pack / unpack 설계 원칙 네 가지: ① 버퍼 크기를 항상 받는다 ② 쓴/읽은 바이트 수를 돌려준다 ③ 매 필드 전에 공간을 확인한다(`NEED(n)`) ④ 실패하면 `buf` 를 건드리지 않는다 | [골격 3 · §3-1 설계 원칙 네 가지](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#3-1-설계-원칙-네-가지) |
| Pack ↔ Unpack **왕복 시험은 필수** | [골격 3 · §3-5 Pack ↔ Unpack 왕복 시험 (필수)](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#3-5-pack--unpack-왕복-시험-필수) |
| 조건부 필드(C) 와 tagged union 을 pack / unpack 할 때 | [골격 3 · §3-6 조건부 필드(C)와 tagged union 을 pack / unpack 할 때](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#3-6-조건부-필드c와-tagged-union-을-pack--unpack-할-때) |

---

## 2. 이 드릴이 노리는 모양

| 반사 | 규칙 |
| :--- | :--- |
| 구조체를 그대로 `memcpy` | **절대 금지.** 패딩·엔디안·타입 크기 셋 다 플랫폼마다 다르다 |
| 쓰기 전 | **항상 공간 검사부터.** `NEED(n)` → 모자라면 `RET_TOO_SMALL` |
| 읽기 전 | **항상 남은 길이 검사부터.** 길이 필드를 믿지 않는다 |
| 커서 | `size_t off = 0;` 하나로 전진. 필드마다 `off += n` |
| 검증 | **pack → unpack 왕복이 원본과 같아야** 끝난 것 |

---

## 3. 주의해야 할 점

1. **`buf[off] << 24` 에서 `buf` 가 `uint8_t`**
	- `int` 로 승격돼 **부호 비트를 건드린다.** `(uint32_t)buf[off] << 24` 로 캐스팅
1. **`memcmp(&a, &b, sizeof(a))` 로 구조체 비교**
	- **패딩 바이트**가 달라서 무작위로 실패한다. 필드별 비교
1. **길이 필드를 믿고 `memcpy(dst, buf+12, payload_len)`**
	- 악의적/잘린 패킷에서 **버퍼 오버런.** `12 + payload_len <= buf_len` 먼저
1. **`buf_len - off` 를 `size_t` 로 계산했는데 `off > buf_len`**
	- **음수가 거대한 양수로** 돌아 검사 통과. `off <= buf_len` 을 불변식으로 유지
1. **체크섬을 넣기 전에 계산**
	- 체크섬 자리를 0으로 두고 계산해야 수신 측과 맞는다
1. **Reserved 를 그냥 복사**
	- 규격상 0이어야 한다. 보내는 쪽은 **0으로 강제**, 받는 쪽은 **0인지 검사**
1. **`Ver=1` 이 `Ver=2` 의 부분집합인데 union 으로 만듦**
	- 필요 없는 태그·복잡도. **포함 관계는 `has_`** 로 충분하다
1. **union 을 `memcpy(buf, &body, sizeof(body))` 로 payload 에 넣음**
	- 안 쓴 arm 의 **쓰레기가 전송**되고 `PayloadLen` 도 틀린다
1. **`Ver=2` 인데 `has_timestamp` 를 안 보고 `timestamp` 를 씀**
	- 0 으로 초기화된 시각이 나간다 ("안 채운 것" 과 "0" 을 구분 못 함)
1. **payload 길이를 arm 의 `sizeof` 로 계산**
	- 패딩 때문에 **와이어 길이와 다르다.**
	- 규격이 정한 바이트 수를 상수로 쓴다
1. **(B) `prio` 를 `& 0x0F` (4비트) 로 마스킹**
	- 3비트짜리 필드가 `Rsv` 자리(b4)를 침범한다.
	- `& 0x07` 후 `<< 5`
1. **(B) `Rsv`(b4) 를 `flags` 의 일부로 취급**
	- 보존해야 하는 `flags` 비트가 아니라 **0 이어야 하는** 예약 비트다
1. **(B) `seq` 를 24비트로 읽거나 마스킹**
	- 32비트 전체를 `rd_u32be` / `wr_u32be` 로 쓴다
1. **왕복 시험만 있고 기대 바이트 시험이 없음**
	- 쓰는 쪽과 읽는 쪽이 **똑같이 틀리면** 왕복은 통과한다

---

## 4. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P042` 로 채점, 풀고 난 뒤의 해설은 폴더의 `NOTE.md`
	- 타입·상수가 든 헤더는 문제 폴더에 이미 있고 `solution.c` 의 함수 본문만 채운다

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P042 `msg` (변형 A) | [§1](#1-이론은-여기--코드-골격-노트) 골격 노트, [§3](#3-주의해야-할-점) | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P042_d4_msg) |

---

## 부록. 변형 B / C 요구사항

저장소에는 아직 문제로 옮기지 않았다.

### 변형 B — 필드 재배치 헤더

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

### 변형 C — 헤더 버전 2종 공존 + Type 별 payload

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
> | 1 | REGISTER | `ttl` (uint16, BE): **2바이트** |
> | 3 | DEREGISTER | `cause` (uint8): **1바이트** |
> | 그 외 | (미정의) | 없음: `PayloadLen` 은 0 이어야 한다 |

**함수와 규칙 (C)**

5. **판단표**를 먼저 채운다.
   `Timestamp` 와 payload 는 **각각 어떤 패턴인가?**
   - `Timestamp`
	- `Ver == 2` 일 때만 존재한다 (C).
     그런데 **`Ver=1` 은 `Ver=2` 의 부분집합**이다.
     union 이 필요한가?
   - payload
	- `Type` 이 정하고 **동시에 올 수 없다.**
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

## 관련 노트

- [2. 데이터 모델 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md) — **2-8~2-10: C 분류와 tagged union** (확장 미션의 근거)
- [3. 바이트 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md)
- [[C] 엔디안(바이트 순서)과 인터넷 체크섬](개발%20%28CS%29/언어/C언어/비트·바이트·정수/[C]%20엔디안%28바이트%20순서%29과%20인터넷%20체크섬%20—%20LSB·MSB와%20htons를%20직접%20만들어보기.md)
- [[C] 시프트로 여러 필드를 하나의 정수에 조합하기 — 필드 패킹](개발%20%28CS%29/언어/C언어/비트·바이트·정수/[C]%20시프트로%20여러%20필드를%20하나의%20정수에%20조합하기%20—%20필드%20패킹.md)
- [[C] 비트플래그(Bit Flag) 연산](개발%20%28CS%29/언어/C언어/비트·바이트·정수/[C]%20비트플래그%28Bit%20Flag%29%20연산.md)
- [[C] 메모리 정렬(Memory Alignment)과 aligned_alloc](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20메모리%20정렬%28Memory%20Alignment%29과%20aligned_alloc%20—%20CPU%20워드%20경계와%20안전한%20할당%20래퍼.md)
- [다음: D5. TLV 파서](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D5.%20TLV%20파서%20—%20모르는%20태그%20건너뛰기.md)
