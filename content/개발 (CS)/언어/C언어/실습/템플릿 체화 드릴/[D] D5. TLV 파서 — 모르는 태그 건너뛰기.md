---
title: "D5. TLV 파서 — 모르는 태그 건너뛰기"
description: "모르는 태그를 건너뛰며 TLV(Tag-Length-Value) 가변 구조를 파싱하는 D5 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-11-11
---

# D5. TLV 파서 — 모르는 태그 건너뛰기

> **쓰는 템플릿**: [3. 바이트 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md) 4장(TLV)

> [!TIP]
> - 이론: 아래 §1 표의 **코드 골격 노트** 해당 절 (링크만 걸고 핵심만 요약했다)
> - 실습: [P043_d5_tlv](https://github.com/sweetpark/c-playgound/tree/main/drill/P043_d5_tlv) — `make P043` 로 채점 (요구사항 전문은 폴더의 `problem.md`)

---

## 📌 한눈에 보기

| 항목 | 내용 |
|---|---|
| 체화할 것 | TLV 파서: 모르는 태그 건너뛰기 |
| 변형 A | 세션 메시지 body |
| 변형 B | TLV16 + 조건부 필수 |
| 변형 C | NAS 스타일 + IE 값 tagged union |
| 실습 문제 | [P043](https://github.com/sweetpark/c-playgound/tree/main/drill/P043_d5_tlv) (변형 A) |

---

## 1. 이론은 여기 — 코드 골격 노트

| 핵심 요약 | 노트 (절로 바로 이동) |
|---|---|
| TLV 파싱 골격: 모르는 TLV 는 **에러가 아니라 건너뛰기**(forward compatibility). `off = vstart + vlen` 을 잊으면 무한 루프이므로 **항상 `vlen` 만큼 전진** | [골격 3 · §4 TLV — 가변 구조 파싱 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#4-tlv--가변-구조-파싱-골격) |
| pack / unpack 설계 원칙: 버퍼 크기를 받고, 매 필드 전에 공간을 확인한다 | [골격 3 · §3-1 설계 원칙 네 가지](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#3-1-설계-원칙-네-가지) |
| 조건부 필드(C) 와 tagged union 의 pack / unpack | [골격 3 · §3-6 조건부 필드(C)와 tagged union 을 pack / unpack 할 때](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#3-6-조건부-필드c와-tagged-union-을-pack--unpack-할-때) |
| 왕복 시험 | [골격 3 · §3-5 Pack ↔ Unpack 왕복 시험 (필수)](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md#3-5-pack--unpack-왕복-시험-필수) |
| TLV 순회 골격: 모르는 IEI 는 건너뛴다 | [골격 6 · §6-2 TLV 순회 골격 (모르는 IEI 는 건너뛴다)](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md#6-2-tlv-순회-골격-모르는-iei-는-건너뛴다) |

---

## 2. 이 드릴이 노리는 모양

| 반사 | 규칙 |
| :--- | :--- |
| 순회 | `while (off < end)`: **남은 길이로 돈다.** 개수로 돌지 않는다 |
| 매 IE 마다 | `NEED(2)` → T,L 읽기 → **`NEED(L)`** → V 읽기. **검사 두 번** |
| 모르는 T | **에러가 아니다.** `off += L` 로 건너뛴다 (전방 호환) |
| 중복 T | 규격이 정한 대로. 안 정했으면 **첫 번째 채택 + WRN 로그** |
| `L = 0` | **합법이다.** 길이 0짜리 IE 를 크래시 없이 넘겨야 한다 |
| **조건부 필수** | **순서가 보장되지 않으므로 순회 도중에는 판정 못 한다.** 순회가 **끝난 뒤 한 곳**에서 검사 |
| **IE 마다 값 타입이 다르다** | `kind` 를 태그로 한 **tagged union**: 읽기 전에 태그 확인, **모르는 IEI 는 `RAW` arm** |

> [!IMPORTANT] TLV 파서의 존재 이유는 "모르는 걸 만나도 안 죽는 것"
> 규격은 계속 늘어난다.
> **내가 모르는 IE 하나에 전체 메시지를 버리면** 상대 장비가 버전업하는 순간 서비스가 멈춘다.

---

## 3. 주의해야 할 점

1. **`NEED(l)` 없이 `memcpy(dst, buf+off, l)`**
	- **원격 버퍼 오버런.** TLV 파서 취약점의 99%
1. **모르는 IEI 에서 `return RET_BAD_FORMAT`**
	- 상대가 버전업하면 **전체 메시지 거부**
1. **`l` 을 `uint8_t` 로 받고 확장 길이 대입**
	- 0xFF 확장 시 **잘린다.** `uint32_t` 로 받는다
1. **값 길이 검사를 안 하고 고정 필드로 복사**
	- `SessionId` 가 `L=2` 로 오면 4바이트를 읽는다. **IE 마다 길이 일치 검사**
1. **문자열 IE 를 그대로 `char[]` 에 복사**
	- **널 종단이 없다.** `L` 만큼 복사 후 `dst[l] = '\0'`
1. **중첩 TLV 를 재귀로만 처리**
	- 악의적 중첩으로 **스택 폭발.** 깊이 상한을 인자로 넘긴다
1. **조건부 필수를 **순회 도중**에 판정**
	- IE 순서가 보장되지 않아 **정상 메시지를 오탐**한다. 순회 후 한 곳에서
1. **요청에 `Cause` 가 왔다고 반려**
	- 규격은 "무시" 다. 전방 호환 원칙(모르는 건 버리지 않는다)과 같은 방향으로 관대하게
1. **union 을 **태그 확인 없이** 읽음**
	- 문자열 바이트를 정수로 해석한 쓰레기 값. getter 로만 읽기
1. **문자열 arm 에 널 종단 없음**
	- `IE_STR` 를 `printf` 하면 뒤 메모리까지 출력. **`L` 만큼 복사 후 `dst[l] = '\0'`**
1. **표에 없는 IEI 를 디코딩 실패로 처리**
	- 상대가 버전업하면 전체 거부.
	- **`IE_RAW` arm 으로 받아 보존**
1. **(B) `T` / `L` 을 1바이트씩 읽음**
	- TLV16 은 둘 다 2바이트 BE 다.
	- `rd_u16be` 로 읽고 헤더 4바이트를 `NEED(4)` 로 확인한다
1. **(C) 반 옥텟 IE 를 1옥텟 TV 로 처리**
	- 상위 4비트가 IEI, 하위 4비트가 값이다.
	- `octet >> 4` 와 `octet & 0x0F`
1. **(C) LV 의 L 을 `NEED` 없이 믿음**
	- 첫 요소부터 경계를 넘을 수 있다.
	- `NEED(1)` → `NEED(l)`
1. **(C) `ie_decode` 가 `memset` 없이 arm 을 채움**
	- 이전 IE 의 바이트가 섞여 **가끔 이상한 값**이 나온다

---

## 4. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P043` 로 채점, 풀고 난 뒤의 해설은 폴더의 `NOTE.md`
	- 타입·상수가 든 헤더는 문제 폴더에 이미 있고 `solution.c` 의 함수 본문만 채운다

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P043 `tlv` (변형 A) | [§1](#1-이론은-여기--코드-골격-노트) 골격 노트, [§3](#3-주의해야-할-점) | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P043_d5_tlv) |

---

## 부록. 변형 B / C 요구사항

저장소에는 아직 문제로 옮기지 않았다.

### 변형 B — TLV16 + 조건부 필수

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

**판단표: 코드 전에 채운다**

| 필드 | 조건 | 다른 것과 동시에? | 패턴 | 표현 |
| :--- | :--- | :--- | :--- | :--- |
| `Cause` |  |  |  |  |
| IE 값 (`SessionId` / `Cause` / `UeName` / `Timestamp` / RAW) |  |  |  |  |

### 변형 C — NAS 스타일 + IE 값 tagged union

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

**판단표: 코드 전에 채운다**

| 필드 | 조건 | 다른 것과 동시에? | 패턴 | 표현 |
| :--- | :--- | :--- | :--- | :--- |
| IE 값 (`u8` / `u32` / `u64` / `str` / `raw`) |  |  |  |  |

---

## 관련 노트

- [2. 데이터 모델 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md) — **2-8~2-10: C 분류와 tagged union** (확장 미션의 근거)
- [3. 바이트 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%203.%20바이트%20골격%20—%20비트플래그·엔디안·Pack·Unpack.md)
- [6. 3GPP 규격 → C 코드 변환 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md) — 6장 IEI·TLV
- [[C] 가변 길이 구조체(Struct Hack)와 필러 필드](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20가변%20길이%20구조체%28Struct%20Hack%29와%20필러%20필드%20—%20헤더%20뒤에%20매달리는%20가변%20payload.md)
- [다음: D6. 설계 산출물](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D6.%20설계%20산출물%20—%20표를%20Mermaid%205종으로.md)
