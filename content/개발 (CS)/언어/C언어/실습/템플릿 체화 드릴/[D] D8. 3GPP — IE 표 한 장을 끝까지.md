---
title: "D8. 3GPP — IE 표 한 장을 끝까지"
description: "3GPP 규격의 IE 표 한 장을 끝까지 구조체와 pack, unpack, 테스트 코드로 구현하는 D8 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-11-11
---

# D8. 3GPP — IE 표 한 장을 끝까지

> **쓰는 템플릿**: [6. 3GPP 규격 → C 코드 변환 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md)

> [!TIP]
> - 이론: 아래 §1 표의 **코드 골격 노트** 해당 절 (링크만 걸고 핵심만 요약했다)
> - 실습: [P045_d8_am](https://github.com/sweetpark/c-playgound/tree/main/drill/P045_d8_am) — `make P045` 로 채점 (요구사항 전문은 폴더의 `problem.md`)

---

## 📌 한눈에 보기

| 항목 | 내용 |
|---|---|
| 체화할 것 | 3GPP IE 표 한 장을 끝까지 |
| 변형 A | 가입자 AM 데이터 조회 (SBI 흉내) |
| 변형 B | 바이너리 IE (D5 연계) |
| 변형 C | 버전 공존 (기능 협상) |
| 실습 문제 | [P045](https://github.com/sweetpark/c-playgound/tree/main/drill/P045_d8_am) (변형 A) |

---

## 1. 이론은 여기 — 코드 골격 노트

| 핵심 요약 | 노트 (절로 바로 이동) |
|---|---|
| 막막함의 정체: 문서 수백 페이지 중 실제로 볼 곳은 네 군데. **Call Flow 먼저, IE 표 나중** | [골격 6 · §0 막막함의 정체](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md#0-막막함의-정체) |
| Release 확인은 필수. 구조체 주석에 `/* R16 신규 */` 처럼 남긴다 | [골격 6 · §1-1 Release 확인은 필수](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md#1-1-release-확인은-필수) |
| `P`(Presence) 칸: M / O / C. C 는 "조건이 맞으면 반드시 있어야 한다" → 없으면 **내가 에러를 낸다** | [골격 6 · §2-1 `P` (Presence) 칸](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md#2-1-p-presence-칸) |
| `Cardinality` 칸: `0..N` 은 운용 상한을 정해 문서에 적는다 (상한이 없으면 취약점) | [골격 6 · §2-2 `Cardinality` 칸](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md#2-2-cardinality-칸) |
| `oneOf` / `anyOf`: **oneOf 만 union**. anyOf 는 둘 다 올 수 있으니 `has_` 로. 원문 단어를 확인 | [골격 6 · §2-4 `oneOf` / `anyOf` / CHOICE — C 가 **여럿**일 때](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md#2-4-oneof--anyof--choice--c-가-여럿일-때) |
| enum 은 `to_str` / `from_str` 를 항상 쌍으로 | [골격 6 · §4 Enum — `to_str` / `from_str` 는 항상 쌍으로](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md#4-enum--to_str--from_str-는-항상-쌍으로) |
| 바이너리 규격: 모르는 IEI 는 건너뛰는 TLV 순회 | [골격 6 · §6-2 TLV 순회 골격 (모르는 IEI 는 건너뛴다)](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md#6-2-tlv-순회-골격-모르는-iei-는-건너뛴다) |
| tagged union (데이터 모델 골격) | [골격 2 · §2-9 배타 C → **tagged union** (판별자 + union)](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md#2-9-배타-c--tagged-union-판별자--union) |

---

## 2. 이 드릴이 노리는 모양

| 반사 | 규칙 |
| :--- | :--- |
| IE 표를 보면 | **5칸만 본다**: 이름 / P(M·C·O) / Cardinality / Type / Description |
| **M** (Mandatory) | 구조체에 그냥 넣고, `validate` 에서 **없으면 실패** |
| **C** (Conditional) | `has_` 플래그 + **조건을 주석으로 규격 문구 그대로** 남긴다 |
| **C 가 여럿** | **원문 단어부터 읽는다.** `oneOf` = **정확히 하나** → tagged union / `anyOf` = **하나 이상** → 각자 `has_` (**union 금지**) |
| **O** (Optional) | `has_` 플래그. 없어도 정상 |
| Cardinality `1..N` | 배열 + 개수. **N 을 `#define` 으로** |
| 모르는 필드 | **버리지 않는다.** 원문 보존 후 응답에 그대로 반영 |
| 에러 | 내 `ret_t` → **HTTP status → cause** 3단 매핑을 **한 함수**에 모은다 |

---

## 3. 주의해야 할 점

1. **`mnc` 를 정수로 저장**
	- `"01"` → `1` → 복원 불가. **사업자가 바뀐다**
1. **`C` 를 `O` 로 취급**
	- 조건 충족인데 필드가 빠진 응답을 정상 처리 → **상호운용 시험 탈락**
1. **모르는 enum 값에 `RET_BAD_FORMAT`**
	- 상대가 Release 를 올리면 **전 메시지 거부** → `UNKNOWN` 으로 받고 통과
1. **`sscanf("%s")` 에 폭 제한 없음**
	- 스택 오버플로. **항상 `%7s` 처럼 폭 지정**
1. **Release 확인 없이 표만 봄**
	- 조건이 달라 구현 전체가 어긋난다
1. **에러 매핑을 호출부마다 작성**
	- 같은 실패가 경로마다 다른 코드로 나간다
1. ****`anyOf` 를 union 으로****
	- 둘째를 파싱하는 순간 첫째가 **에러 없이 지워진다**
1. **`oneOf` 를 `has_` 두 개로 두고 **개수를 안 셈****
	- 둘 다 왔는데 통과 / 하나도 없는데 통과
1. **`oneOf` 에서 **2개가 오면 앞엣것만 채택****
	- 규격 위반 요청이 정상 처리된다
1. **배타 C 의 태그를 **새로 만들어 두 개**로**
	- `accessType` 과 `kind` 가 어긋나는 순간이 온다 → 표에 판별자가 있으면 **재사용**
1. **태그가 `NONE` 인데 응답 생성**
	- 규격 위반 응답이 상대에게 나간다
1. **(B) `oneOf` 를 순회 도중에 판정**
	- IE 순서가 보장되지 않아 **먼저 온 것만 보고 통과**시킨다.
	- 순회가 끝난 뒤 한 곳에서 개수를 센다
1. **(B) TV(`0x10`) 를 TLV 로 읽음**
	- 1옥텟 값을 `L` 로 읽어 **한 칸씩 어긋난다**
1. **(B) `bssid` 6바이트를 문자열처럼 `strcpy`**
	- 널 종단이 없다.
	- 16진수 문자열로 **변환**한다
1. **(C) 비트를 거르지 않고 `negotiated` 를 그대로 사용**
	- 내가 모르는 비트가 켜져 있어도 동작한 척한다.
	- `& 0x03` 으로 먼저 거른다
1. **(C) 구버전에도 `ueIdentity` 를 보냄**
	- 구버전 상대가 **모르는 필드로 거부**한다
1. **(C) 구버전 + `GPSI` 를 `supi` 자리에 넣음**
	- 의미가 다른 값이 흘러간다.
	- 표현할 수 없으면 `RET_NOT_SUPPORTED`

---

## 4. 실습 문제 (GitHub)

- 풀이·채점은 저장소에서: [c-playgound](https://github.com/sweetpark/c-playgound)
	- `make P045` 로 채점, 풀고 난 뒤의 해설은 폴더의 `NOTE.md`
	- 타입·상수가 든 헤더는 문제 폴더에 이미 있고 `solution.c` 의 함수 본문만 채운다

| 문제 | 다루는 이론 | 링크 |
|---|---|---|
| P045 `am` (변형 A) | [§1](#1-이론은-여기--코드-골격-노트) 골격 노트, [§3](#3-주의해야-할-점) | [폴더](https://github.com/sweetpark/c-playgound/tree/main/drill/P045_d8_am) |

---

## 부록. 변형 B / C 요구사항

저장소에는 아직 문제로 옮기지 않았다.

### 변형 B — 바이너리 IE (D5 연계)

같은 데이터를 **IEI + TLV / TV 형식**으로 받는다.
**`oneOf` 는 어느 IEI 가 왔나로 태그를 정한다** (키 이름이 없다).

| IEI | 형식 | 이름 | 값 | P / 조건 |
| :--- | :--- | :--- | :--- | :--- |
| `0x10` | **TV** | accessType | 1옥텟: `1` = 3GPP_ACCESS, `2` = NON_3GPP_ACCESS | **M** |
| `0x11` | TLV | gnbInfo | 6바이트: `gnbId`(u32 BE) + `tac`(u16 BE) | **C**: `accessType == 3GPP` |
| `0x12` | TLV | wlanInfo | `ssid_len`(1) + `ssid` + `bssid`(6바이트).<br>`L == 1 + ssid_len + 6` | **C**: `accessType == NON_3GPP` |
| `0x21` | TLV | supi | 문자열 1 ~ 23자 | **oneOf** (`0x21` / `0x22`) |
| `0x22` | TLV | gpsi | 문자열 1 ~ 23자 | **oneOf** |
| `0x31` | TLV | ueIpv4 | 4바이트 | **anyOf** (`0x31` / `0x32`) |
| `0x32` | TLV | ueIpv6 | 16바이트 | **anyOf** |
| 그 외 | TLV 로 가정 | (미지원) | | **건너뛴다** (전방 호환) |

**함수**: `int ue_ctx_bin_parse(const uint8_t *buf, size_t len, ue_ctx_t *out);`

`ue_ctx_t` 는 `{ access_info_t access; ue_identity_t id; ue_ip_t ip; }` 이다.

**규칙**

1. `0x10` 은 TV 라서 `IEI(1) + 값(1)` 이다 (L 이 없다).
   나머지는 `IEI(1) + L(1) + V` 이다.
2. **IE 마다 길이 일치 검사**를 한다.
   `ueIpv4` L≠4, `gnbInfo` L≠6, `wlanInfo` 가 `1 + ssid_len + 6` 과 다름 → `RET_BAD_FORMAT`.
3. **순서가 보장되지 않으므로** `oneOf` / `anyOf` / 배타 C 검사는 **순회가 끝난 뒤 한 곳**에서 한다.
4. 문자열은 널 종단을 **내가 붙인다.**
   `bssid` 는 `"aa:bb:cc:dd:ee:ff"`, IPv4 는 `"10.0.0.1"`, IPv6 는 `inet_ntop` 형식으로 저장한다.
5. 경계를 넘으면 `RET_BAD_FORMAT`.

**에러 코드 규칙 (B)**

| 상황 | 리턴코드 |
| :--- | :--- |
| `buf` / `out` 이 NULL | `RET_INVALID_ARG` |
| `accessType` 없음, 조건 참인데 `gnbInfo` / `wlanInfo` 없음 | `RET_INVALID_ARG` (→ 400 `MANDATORY_IE_MISSING`) |
| `accessType` 이 1·2 가 아님, `oneOf` 0개·2개, `anyOf` 0개, 길이 불일치, 경계 초과 | `RET_BAD_FORMAT` |
| 반대편 arm 이 같이 옴 | `RET_OK` (**무시 + WRN**) |
| 모르는 IEI | `RET_OK` |

### 변형 C — 버전 공존 (기능 협상)

`supportedFeatures` 의 **비트가 켜져야** 새 필드를 보낸다.
**구버전은 `ueIdentity` 대신 `supi` 만 보낸다** (조건부 arm 허용).

| 비트 | 뜻 | 켜졌을 때 |
| :--- | :--- | :--- |
| 비트 0 (`0x01`) | `ratRestrictions` 지원 | 응답에 `ratRestrictions` 배열을 **포함**한다 (`rat_num > 0` 일 때) |
| 비트 1 (`0x02`) | `ueIdentity` 지원 | 응답에 `ueIdentity` 객체(`{"supi":..}` 또는 `{"gpsi":..}`)를 쓴다 |
| 그 밖의 비트 | 내가 모름 | **끄고** 응답한다 |

**함수**: `int am_rsp_build_v(const am_data_rsp_t *in, uint32_t negotiated, json_t **out);`

**규칙**

1. `negotiated` 는 **`& 0x03` 으로 먼저 걸러서** 쓴다 (모르는 비트는 무시).
2. 비트 0 이 꺼져 있으면 `rat_num` 이 있어도 **`ratRestrictions` 를 보내지 않는다.**
3. 비트 1 이 꺼져 있으면 **최상위 `"supi"` 문자열만** 보내고 `ueIdentity` 는 보내지 않는다.
   이때 `kind == GPSI` 이면 구버전이 표현할 수 없으므로 `RET_NOT_SUPPORTED` 이다.
4. 비트 1 이 켜져 있으면 `ueIdentity` 객체만 보내고 최상위 `"supi"` 는 보내지 않는다.
5. `kind == NONE` 이면 `RET_INVALID_ARG`.
6. 실패하면 `*out` 은 NULL 이다.
7. 공통 필드(`nssai`, `subscribedUeAmbr`, 모르는 키 echo)는 A 의 `am_rsp_build` 와 같다.

**에러 코드 규칙 (C)**

| 상황 | 리턴코드 |
| :--- | :--- |
| `in` / `out` 이 NULL, `kind == NONE` | `RET_INVALID_ARG` |
| 구버전(비트 1 꺼짐)인데 `kind == GPSI` | `RET_NOT_SUPPORTED` |
| 할당 실패 | `RET_NO_MEM` |

---

## 관련 노트

- [6. 3GPP 규격 → C 코드 변환 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%206.%203GPP%20규격%20→%20C%20코드%20변환%20골격.md) — 정답지
- [2. 데이터 모델 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md) — **2-6~2-10: C 와 tagged union**
- [[Lang] strtok_r과 sscanf 문자열 파싱 원리](개발%20%28CS%29/언어/C언어/문자열·파싱/[Lang]%20strtok_r과%20sscanf%20문자열%20파싱%20원리%20및%20&save%20동작%20분석.md)
- [[C] 문자열 비교와 strcasecmp](개발%20%28CS%29/언어/C언어/문자열·파싱/[C]%20문자열%20비교와%20strcasecmp%20—%20strcmp%20차이,%20대소문자%20무시%20및%20컴파일러%20속성%20해독.md)
- [[HTTP] POST & CALLBACK (libcurl HTTP 통신)](개발%20%28CS%29/언어/C언어/네트워크·시스템%20IO/[HTTP]%20POST%20&%20CALLBACK%20%28libcurl%20HTTP%20통신%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [다음: D9. 종합](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D9.%20종합%20—%20요구사항%20한%20장을%20동작하는%20데몬으로.md)
