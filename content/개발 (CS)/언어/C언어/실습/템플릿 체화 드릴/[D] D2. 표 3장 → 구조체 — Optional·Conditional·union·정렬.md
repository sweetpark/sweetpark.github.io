---
title: "D2. 표 3장 → 구조체 — Optional·Conditional·union·정렬"
description: "규격서의 표 3장을 구조체로 옮기며 Optional, Conditional, union, 멤버 정렬을 다루는 D2 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D2. 표 3장 → 구조체 — Optional · Conditional · union · 정렬

> **쓰는 템플릿**: [2. 데이터 모델 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md)
>
> **목표 시간**: 1회차 60분 / 2회차 35분 / **3회차 22분**
>
> 여기서 구조체를 잘못 짜면 **D4(pack) · D8(3GPP) 에서 전부 되돌아온다.**
> 가장 비용이 큰 단계다.

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

| 반사적으로 나와야 하는 것 | 규칙 |
| :--- | :--- |
| Optional 필드 | **`bool has_xxx;` 를 값 바로 위에** 붙인다 |
| 문자열 | `char name[NAME_LEN + 1];` — **`+1` 없이 쓰면 틀린 것** |
| enum | `XXX_UNKNOWN = 0` 으로 시작, `XXX_END` 로 끝. `to_str`/`from_str` **쌍으로** |
| 배열 | `type arr[MAX]; uint8_t arr_num;` — **개수 필드는 배열 바로 아래** |
| 구조체마다 | `_init()` · `_validate()` · (동적이면) `_free()` 3종 세트 |
| **P = C (조건부)** | `has_` + **조건식을 함수로**. 조건 참인데 없으면 **에러**, 거짓인데 왔으면 **정한 정책대로** |
| **배타 C 여러 개** | **tagged union** — 태그 확인 후 읽기, 쓸 때는 태그 → `memset` → 대입 |
| **멤버 순서** | 다 짠 뒤 **정렬 큰 것 → 작은 것** (8 → 4 → 2 → 1), **`char[]` 는 맨 끝**. `sizeof` 로 확인 |

> [!IMPORTANT] "0이 들어온 건가, 안 온 건가"
> Optional 을 `has_` 없이 값만 두면 **이 질문에 답할 수 없다.**
> `ambr_ul = 0` 이 "0 kbps 제한"인지 "규격에 없어서 안 왔다"인지 구분이 안 되는 순간, 그 구조체는 못 쓴다.

> [!IMPORTANT] **C 를 O 로 옮겨 적으면 검사가 통째로 빠진다**
> O 는 "없어도 정상"이라 `validate` 가 아무것도 안 한다.
> C 는 **"어떤 경우엔 없으면 안 된다."**
> 표를 옮겨 적을 때 **조건 열**을 만들지 않으면, 이 차이가 코드에 도달하지 못한다.

> [!IMPORTANT] 순서는 **두 번에 나눠서** 잡는다
> **1차**: 규격서 표 순서대로 (뜻을 놓치지 않으려고).
> `has_` 는 값 바로 위.
> **2차**: 다 짠 뒤 **정렬 기준으로 재배치.** 이때 `has_` 는 1바이트 그룹으로 모은다.
> 1차에서 바로 정렬까지 하려 들면 필드를 빠뜨린다.
> **먼저 맞게, 그다음 작게.**
> → 규칙 전체는 [데이터 모델 골격 4장](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md)

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 가입자 프로파일<br>(확장 포함) | ① 요구사항서<br>② pseudo code **전체** | 1. C 판단표와 오프셋 손 계산표를 **먼저** 채운다.<br>2. pseudo 를 한 줄씩 코드로 바꾼다.<br>3. ③ 테스트를 실행한다. |
| **2회차** | **B** 과금 정책 레코드<br>(비트마스크 12필드) | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. 판단표를 채운다.<br>2. 번호만 보고 쓴다.<br>3. ③ 테스트를 실행한다. |
| **3회차** | **C** 로그 질의 결과<br>(동적 배열) | ① 요구사항서만 | 1. ③ 테스트를 **먼저 읽는다.**<br>2. 백지에서 친다. |

> 1회차에 막히면 같은 변형을 한 번 더 친다.
> 3회차를 통과하면 A 를 백지로 다시 친다.

---

## 1. 요구사항서

### 1-A. 변형 A — 가입자 프로파일 레코드

> [!QUOTE] 요구사항서 (발췌)
> 가입자 프로파일 조회 응답을 담을 자료구조를 설계한다.
>
> | # | 필드 | 타입 | P | 값 범위 / 형식 | 설명 |
> | :--- | :--- | :--- | :--- | :--- | :--- |
> | 1 | `supi` | string | **M** | 숫자 15자 이하 | 가입자 식별자 |
> | 2 | `nickname` | string | O | UTF-8 31바이트 이하 | 표시 이름 |
> | 3 | `ratType` | enum | O | `NR` / `EUTRA` / `WLAN` | 접속 무선 종류 |
> | 4 | `ambrUl` | integer | O | 0 ~ 4,000,000 (kbps) | 상향 최대 대역 |
> | 5 | `ambrDl` | integer | O | 0 ~ 4,000,000 (kbps) | 하향 최대 대역 |
> | 6 | `allowedNssai` | array | **M** | **1 ~ 8개** | 허용 슬라이스 목록 |
> | 6-1 | └ `sst` | integer | **M** | 0 ~ 255 | 슬라이스 종류 |
> | 6-2 | └ `sd` | string | O | 6자리 16진수 | 슬라이스 구분자 |
> | 7 | `suspended` | boolean | **M** | 기본값 `false` | 정지 여부 |
> | 8 | `lastSeen` | integer | O | UNIX epoch (초) | 마지막 접속 시각 |

### 미션

1. `subs_type.h` — 위 표를 구조체로.
   **Optional 은 전부 `has_` 플래그.**
2. `rat_type_t` enum + `rat_type_to_str()` / `rat_type_from_str()` **쌍**.
3. `subs_profile_init(subs_profile_t *p)` — 안전한 초기 상태로.
4. `subs_profile_validate(const subs_profile_t *p)` — 표의 범위를 **전부** 검사.
   위반 시 어느 필드인지 로그.
5. `subs_profile_dump(const subs_profile_t *p)` — Optional 은 **없으면 `-` 로** 출력.
6. **정렬** — 코드를 치기 **전에** 아래 2장의 "오프셋 손 계산표"로 1차 구조체의 `sizeof` 를 **예측**하고, 다 친 뒤 `sizeof`/`offsetof` 를 찍어 **맞는지 확인.** 그다음 멤버를 재배치해 패딩을 줄이고 `_Static_assert` 로 크기를 고정.

### 확장 요구사항 — **조건부(C) 필드** (같은 레코드에 이어서 붙인다)

> [!QUOTE] 요구사항서 (2차 개정 — 필드 9~12 추가)
>
> | # | 필드 | 타입 | **P** | **조건 (P = C 일 때)** | 값 범위 / 형식 |
> | :--- | :--- | :--- | :---: | :--- | :--- |
> | 9 | `chargingMethod` | enum | **M** | — | `PREPAID` / `POSTPAID` |
> | 10 | `prepaidInfo` | object | **C** | `chargingMethod == PREPAID` | 아래 10-1 |
> | 10-1 | └ `balance` | integer | **M** | — | 0 ~ 40억 (원) |
> | 11 | `postpaidInfo` | object | **C** | `chargingMethod == POSTPAID` | 아래 11-1, 11-2 |
> | 11-1 | └ `billingDay` | integer | **M** | — | 1 ~ 28 (일) |
> | 11-2 | └ `invoiceEmails` | array | O | — | **0 ~ 3개**, 각 63바이트 이하 |
> | 12 | `suspendCause` | string | **C** | `suspended == true` | 63바이트 이하 |

여기 C 가 **세 개**인데 **성격이 다르다.** 먼저 그것부터 가른다.

### 미션 (이어서)

7. **C 판단표**부터 채운다 (코드 치기 전).
   세 C 를 **독립 / 배타 / 묶음 / 최소하나** 중 무엇인지 분류.
8. `suspend_cause` — **C 가 하나뿐**인 경우.
   `has_` + 조건 검사.
   "조건 거짓인데 값이 왔다" 의 **정책을 정하고 한 줄 근거를 적는다.**
9. `prepaid` / `postpaid` — **배타 C**.
   `charging_method` 를 **태그로 재사용**하는 tagged union.
   `subs_profile_get_postpaid()` / `subs_profile_set_postpaid()` **쌍**을 만들고, **구조체 바깥에서 `info` 를 직접 건드리는 코드가 없게** 한다.
10. 확장 때문에 **6번의 `_Static_assert` 가 깨진다.** 새 `sizeof` 를 다시 **예측 → 실측 → 갱신**.
    (깨지는 게 정상이다.
    그게 `_Static_assert` 를 박아 둔 이유다.)

> [!IMPORTANT] `prepaidInfo` 는 값이 **한 개**, `postpaidInfo` 는 **여러 개**다
> 이 둘을 union 에 나란히 넣을 수 있는 이유는 **각자를 자기 구조체로 감쌌기** 때문이다.
> 감싸고 나면 union 입장에선 둘 다 "구조체 하나" 라 똑같이 다룬다.
> **배열의 개수 필드(`email_cnt`)도 그 구조체 안에** 넣는다 — union 밖에 두면 태그가 바뀔 때 엉뚱한 개수를 본다.

### C 판단표 — 채우고 시작한다

| 필드 | 조건 | 다른 C 와 **동시에** 올 수 있나 | 패턴 | 표현 |
| :--- | :--- | :--- | :--- | :--- |
| `suspend_cause` |  |  |  |  |
| `prepaid_info` |  |  |  |  |
| `postpaid_info` |  |  |  |  |

> [!DANGER] 여기서 union 을 잘못 고르면 **에러 없이 데이터가 지워진다**
> union 멤버는 같은 메모리를 겹쳐 쓴다.
> **동시에 올 수 있는 필드**를 union 에 넣으면
> 둘째를 채우는 순간 첫째가 조용히 망가진다.
> 컴파일도 되고 경고도 없다.
> **"정확히 하나만 존재한다"** 고 규격이 보장할 때만 union 이다.
> → 분류 기준 전체는 [데이터 모델 골격 2-8](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md)

**에러 코드 규칙 (A)**

| 상황 | 리턴코드 | 로그 |
| :--- | :--- | :--- |
| `p` 가 NULL | `RET_INVALID_ARG` | 가드가 남긴다 |
| 표의 범위·개수 위반 (`nssai_num` 0 / 9, `ambr` 초과 등) | `RET_BAD_FORMAT` | O (어느 필드인지) |
| 조건 참인데 C 필드가 없음 (`suspended` 인데 `suspend_cause` 없음) | `RET_INVALID_ARG` | O |
| `from_str` 에 NULL | `RET_INVALID_ARG` | 가드가 남긴다 |
| `from_str` 에 모르는 문자열 | `RET_OK` + `RAT_UNKNOWN` | WRN (규격에 값이 추가돼도 죽지 않게) |

### 1-B. 변형 B — 과금 정책 레코드

`has_` 12개를 **비트마스크 하나**로 바꾸고, C 가 3갈래로 배타인데 **판별자가 표에 없는** 경우를 다룬다.

| # | 필드 | 타입 | P | 값 범위 / 형식 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `policy_id` | integer | **M** | 1 이상 |
| 2 | `name` | string | O | 31바이트 이하 |
| 3 | `desc` | string | O | 63바이트 이하 |
| 4 | `priority` | integer | O | 0 ~ 15 |
| 5 | `qci` | integer | O | 1 ~ 9 |
| 6 | `mbr_ul` / `mbr_dl` | integer | O | 0 ~ 10,000,000 (kbps) |
| 7 | `gbr_ul` / `gbr_dl` | integer | O | 0 ~ 10,000,000 (kbps) |
| 8 | `valid_from` / `valid_to` | integer | O | UNIX epoch.<br>둘 다 있으면 `valid_to >= valid_from` |
| 9 | `cap_kb` | integer | O | 0 ~ 40억 (KB) |
| 10 | `roaming` | boolean | O | |
| 11 | `kind` | enum | **M** | `FLAT` / `USAGE` / `TIERED` (**표에 없으므로 새로 만든다**) |
| 12 | `flat` | object | **C** | `kind == FLAT`: `fee`(0 ~ 40억) |
| 13 | `usage` | object | **C** | `kind == USAGE`: `unit_price`(0 ~ 40억), `unit_kb`(**1 이상**) |
| 14 | `tiered` | object | **C** | `kind == TIERED`: `tier_cnt`(1 ~ 4), `tiers[]`: `up_to_kb` **오름차순**, `price` |

**함수와 규칙**

1. 선택 필드(`#2 ~ #10`, 12개)는 `uint32_t present` 의 비트로 표현한다.
   비트 이름은 `PB_NAME` / `PB_DESC` / `PB_PRIORITY` ... 로 enum 에 둔다 (매직넘버 금지).
2. `PB_HAS(p, bit)` 로 존재 여부를 읽는다.
3. `kind` 는 4B 이므로 `present` 와 **같은 4B 그룹**에 둔다.
4. `policy_init(p)`, `policy_validate(p)` 를 만든다.
5. `policy_set_flat(p, fee)`, `policy_set_usage(p, price, unit_kb)`, `policy_set_tiered(p, tiers, n)` 와 getter 3개를 **쌍**으로 만든다.
   getter 는 태그가 다르면 NULL 을 돌려준다.
6. `validate` 는 **`present` 비트가 켜진 필드만** 검사한다.
   `kind` 가 정해지지 않았으면 (M 인데 안 채워짐) 반려한다.

**에러 코드 규칙 (B)**

| 상황 | 리턴코드 |
| :--- | :--- |
| NULL 인자 | `RET_INVALID_ARG` |
| `set_tiered` 의 `n` 이 0 또는 4 초과, `set_usage` 의 `unit_kb == 0` | `RET_INVALID_ARG` |
| 범위 위반 (`priority`, `qci`, `valid_to < valid_from`, 오름차순 위반 등), `kind` 미지정 | `RET_BAD_FORMAT` |

### 1-C. 변형 C — 로그 질의 결과

결과 행의 개수에 **상한이 없고**, union arm 안에 **포인터**가 들어간다.
`_free()` 를 `switch (tag)` 로 갈라서 해제하는 것이 핵심이다.

| # | 필드 | 타입 | P | 값 범위 / 형식 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `kind` | enum | **M** | `NONE` / `ROWS` / `COUNT` / `ERROR` |
| 2 | `rows` | object | **C** | `kind == ROWS`: `char **rows`, `uint32_t row_cnt`.<br>**0 ~ 수만 건, 상한 없음** |
| 3 | `count` | object | **C** | `kind == COUNT`: `uint64_t total` |
| 4 | `error` | object | **C** | `kind == ERROR`: `int32_t code`, `char msg[64]` |

**함수와 규칙**

1. 구조체 `qres_t` 는 `kind` 와 `union u { qr_rows_t rows; qr_count_t count; qr_error_t error; }` 로 이루어진다.
2. union 이 **포인터(8B)** 를 품으므로 **union 을 맨 위, `kind` 를 그 아래**에 둔다.
3. `qres_init(q)`: 전부 0, `kind = QR_NONE`.
4. `qres_set_rows(q, src, n)`: 문자열을 **깊은 복사**한다.
   `n == 0` 이면 `rows = NULL`, `row_cnt = 0` 으로 두고 `malloc(0)` 을 하지 않는다.
5. `qres_set_count(q, total)`, `qres_set_error(q, code, msg)`: `msg` 는 63자까지 복사하고 널 종단한다 (`NULL` 이면 빈 문자열).
6. set 은 **이전 arm 을 먼저 해제**한다 (누수 없음).
7. getter 3개는 태그가 다르면 NULL 이다.
8. `qres_free(q)`: `switch (tag)` 로 갈라서 해제한다.
   해제 뒤 `memset(&q->u, 0)` + `kind = QR_NONE`.
   NULL 을 받아도, 두 번 불러도 안전하다.

**에러 코드 규칙 (C)**

| 상황 | 리턴코드 |
| :--- | :--- |
| `q` 가 NULL, `src` 가 NULL 인데 `n > 0` | `RET_INVALID_ARG` |
| 할당 실패 | `RET_NO_MEM` (실패하면 `kind = QR_NONE`, 누수 없음) |

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 변형별로 아래 pseudo code 를 `d2_model/src/*.h` / `*.c` 에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안(A)의 해당 단계만 본다.

### 2-A. `subs_type.h` / `subs_type.c` — Level 1 (1회차, 전부 본다)

```c
/* subs_type.h */
/* [ ] 1. 인클루드 가드 SUBS_TYPE_H, include: <stdbool.h> <stdint.h> <time.h> */
/* [ ] 2. 상수: SUPI_LEN_MAX 15 / NICKNAME_LEN_MAX 31 / SD_LEN 6 / NSSAI_NUM_MAX 8 / AMBR_KBPS_MAX 4000000 */
/* [ ] 3. rat_type_t: RAT_UNKNOWN = 0 ... RAT_END   + to_str / from_str 선언 */
/* [ ] 4. snssai_t: sst(M), has_sd + sd[SD_LEN + 1]   (has_ 는 값 바로 위) */
/* [ ] 5. (1차) subs_profile_t — 규격서 표 순서대로
 *        M : supi[+1], suspended
 *        O : nickname, rat_type, ambr_ul, ambr_dl, last_seen   → 각각 has_ 를 값 바로 위
 *        배열 : nssai[8] + nssai_num (개수는 배열 바로 아래)
 *        time_t 는 64비트 (int 금지) */
/* [ ] 6. (손 계산) 오프셋 표를 채우고 예측 sizeof 를 적는다.  ← 코드로 찍기 전에 */
/* [ ] 7. (2차) 재배치
 *        8B (time_t) → 4B (uint32_t, enum) → 1B (bool, has_ 를 한곳에) → char[] / 정렬 1 구조체
 *        짝이 떨어진 has_ 는 그룹 주석에 "어느 값의 것인지" 적는다
 *        _Static_assert(sizeof(subs_profile_t) == 예측값) */
/* [ ] 8. 확장 (C 필드)
 *        charge_method_t (UNKNOWN = 0 / PREPAID / POSTPAID / END)   ← 태그
 *        prepaid_info_t { balance }
 *        postpaid_info_t { billing_day, email_cnt, emails[3][64] }  ← 개수는 이 안에
 *        union info { prepaid; postpaid; }
 *        has_suspend_cause + suspend_cause[64]                      ← union 에 넣지 않는다 (독립 C)
 *        새 sizeof 를 다시 예측 → 실측 → _Static_assert 갱신 */
/* [ ] 9. 함수 선언: init / validate / dump / get_prepaid / get_postpaid / set_prepaid_balance / set_postpaid */

/* subs_type.c */
/* [ ] 1. g_rat_str[RAT_END] — 지정 초기화자 ([RAT_NR] = "NR" ...) */
/* [ ] 2. rat_type_to_str: 범위 밖이면 "UNKNOWN" */
/* [ ] 3. rat_type_from_str
 *        가드(s, out) → *out = RAT_UNKNOWN → 표 순회
 *        못 찾아도 에러가 아니다: WRN 로그 후 RET_OK */
/* [ ] 4. subs_profile_init: NULL 이면 return / memset / 기본값(suspended = false) 명시 */
/* [ ] 5. V_FAIL(fmt, ...) 지역 매크로: LOG_ERR 후 RET_BAD_FORMAT 리턴 */
/* [ ] 6. subs_profile_validate (위에서 아래로)
 *        supi      : 1~15자, 숫자만
 *        nssai_num : 1~8, sd 가 있으면 정확히 6자
 *        O 필드    : has_ 가 켜진 것만 범위 검사
 *        C suspend_cause : suspended 이면 has_ + 비어 있지 않음 (없으면 RET_INVALID_ARG)
 *                          아니면서 값이 왔으면 정책 선택 + 근거 주석
 *        charging_method : switch (태그) — default 는 UNKNOWN 을 반려, 가리키는 arm 만 검사 */
/* [ ] 7. subs_profile_dump: O 필드는 없으면 "-" */
/* [ ] 8. set_* : ① 태그 대입 → ② memset(&info) → ③ arm 채우기      (이 순서)
 *        get_* : 태그가 다르면 NULL */
```

### 2-B. `policy.h` / `policy.c` — Level 2 (2회차, 번호와 제목만 본다)

```c
/* policy.h */
/* [ ] 1. 가드 / include */
/* [ ] 2. 비트 enum: PB_NAME = 1u << 0 ... (12개) + PB_HAS(p, bit) 매크로 */
/* [ ] 3. policy_kind_t: PK_NONE = 0 / FLAT / USAGE / TIERED / END   ← 새로 만든 태그 */
/* [ ] 4. arm 구조체 3개 (tiered 는 tier_cnt + tiers[4] 를 안에 가둔다) */
/* [ ] 5. policy_t: 8B 그룹 → 4B 그룹 (present 와 kind 를 나란히) → 1B → char[] */
/* [ ] 6. _Static_assert 로 크기 고정 */
/* [ ] 7. 함수 선언: init / validate / set_flat / set_usage / set_tiered / get_flat / get_usage / get_tiered */

/* policy.c */
/* [ ] 1. policy_init */
/* [ ] 2. validate: present 비트가 켜진 필드만 / valid_to >= valid_from / switch(kind) default 반려 */
/* [ ] 3. set_* 3개: 인자 검사 → 태그 → memset(&u) → 채우기 */
/* [ ] 4. get_* 3개: 태그가 다르면 NULL */
```

### 2-C. `qres.h` / `qres.c` — Level 3 (3회차, 백지)

```c
/* 아무것도 안 본다.
 * §1-C 요구사항서만 보고 만든다.
 *
 * 막히면 세 가지만 찾아본다.
 *   - union 에 포인터가 들어갈 때 정렬 (맨 위에 두는 이유)
 *   - 문자열 배열 깊은 복사와 해제 순서 (안쪽 → 바깥)
 *   - 태그를 보고 갈라서 해제하는 switch */
```

> [!TIP] 막혔을 때 찾는 순서
> 1. 컴파일 에러가 나면 에러 문구를 본다.
>    `unknown type name` / `implicit declaration` 이면 include 누락이다.
> 2. `man 3 <함수>` 로 SYNOPSIS 맨 위의 `#include` 를 확인한다.
> 3. 로직이 막히면 **§3 테스트의 기대값**을 먼저 읽는다.
> 4. 그래도 안 되면 모범답안의 해당 단계 **하나만** 본다.

### 2-D. 코드 치기 전에 채우는 판

아래 표들은 **코드를 치기 전에** 손으로 채운다.
(C 판단표는 §1-A 에 있다.)

### 판단표 — 배열을 고정으로 할까 동적으로 할까

| 질문 | 예 | 아니오 |
| :--- | :--- | :--- |
| 규격에 **상한이 명시**돼 있나? | → **고정배열** | 아래로 |
| 상한이 있는데 **최악치가 크고**(수천 이상) 평소엔 몇 개뿐인가? | → 동적 | → 고정배열 |
| 개수 상한 자체가 없나? | → **동적 (`_free()` 필수)** | → 고정배열 |

**변형 A는 "1~8개" 라고 규격에 적혀 있다 → 고정배열.** 고민할 것이 없다.

### union 판 — 배타 C 를 만났을 때

| 질문 | 예 | 아니오 |
| :--- | :--- | :--- |
| C 필드들이 **동시에** 존재할 수 있나? | → **union ✗** (각자 `has_`) | 아래로 |
| 어느 것인지 알려 주는 **판별자 필드**가 이미 있나? | → 그걸 **태그로 재사용** | → `kind` enum 을 **새로 만든다** |
| arm 하나만 **유독 큰가**? (나머지의 수십 배) | → 그 arm 만 **포인터**로 빼고 태그 볼 때 할당 | → 그냥 union |

### 타입 고르는 판

| 규격의 값 범위 | C 타입 |
| :--- | :--- |
| 0 ~ 255 | `uint8_t` |
| 0 ~ 65535 | `uint16_t` |
| 0 ~ 40억 | `uint32_t` |
| 시각(epoch) | **`time_t` (64비트)** — `int` 로 받으면 2038년에 터진다 |
| 문자열 N자 | `char x[N + 1]` |
| 참/거짓 | `bool` (`<stdbool.h>`) |

### 정렬 판 — 타입별 정렬과 손 계산표

| 타입 | 크기 = 정렬 (LP64) |
| :--- | :--- |
| `bool`, `uint8_t`, `char`, **`char[N]`** | 1 |
| `uint16_t` | 2 |
| `uint32_t`, enum | 4 |
| `time_t`, `uint64_t`, **포인터** | 8 |
| 중첩 `struct` | 안에서 **가장 큰 정렬** (`snssai_t` 는 전부 1바이트 계열이라 **1**) |

**규칙**: 멤버 오프셋 = `이전 끝` 을 **자기 정렬의 배수로 올린 값.** 마지막에 구조체 전체를 **최대 정렬의 배수**로 올린다.

**오프셋 손 계산표** — 1차(표 순서) 구조체를 위에서부터 채운다.
**코드 치기 전에 `sizeof` 를 적어 둔다.**

| 멤버 | 크기 | 정렬 | 오프셋 | 끝 | 앞 패딩 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supi` |  |  | 0 |  |  |
| ⋮ |  |  |  |  |  |
| (꼬리) |  |  |  |  |  |
| **예측 `sizeof`** |  |  |  |  | **합계** |

> [!TIP] 예측이 틀렸다면 그게 **가장 좋은 학습 지점**이다
> 틀린 이유는 거의 둘 중 하나다.
> ① **`char[N]` 을 N바이트 정렬이라고 착각** (정렬은 1).
> ② **꼬리 패딩을 빼먹음** (구조체 전체를 최대 정렬 배수로 올린다).
> 어느 쪽이었는지 메모해 둔다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

```text
d2_model/src/subs_type.h  subs_type.c     변형 A
d2_model/src/policy.h     policy.c        변형 B
d2_model/src/qres.h       qres.c          변형 C
d2_model/test/test_subs_type.c            변형 A 시험 (3-0 매크로 + 3-A + main)
d2_model/test/test_policy.c               변형 B 시험 (3-0 매크로 + 3-B + main)
d2_model/test/test_qres.c                 변형 C 시험 (3-0 매크로 + 3-C + main)
```

> [!IMPORTANT] 시험의 형태 (D1~D9 공통)
> **정상** 한 가지, **경계** 여러 가지, **NULL / 실패** 경로를 확인한다.
> D2 는 여기에 **레이아웃(정렬)** 과 **조건부(C)** 와 **union** 시험이 붙는다.

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

`g_log_level` 정의는 위 매크로 블록에 이미 들어 있다 (시험 파일마다 한 번, D0 참고).
`LOG_WRN` · `LOG_INF` 를 쓰는 순간 이 정의가 없으면 링크 에러(`undefined reference to g_log_level`)가 난다.

### 3-A. 변형 A 시험 — 시험 ①~⑥ + enum 왕복

시험 ①~③ 은 정상 / 경계 / NULL 이고, ④ 레이아웃, ⑤ 조건부(C), ⑥ tagged union, ⑦ enum 왕복이 이어진다.

### 시험 ①~③ — 정상 / 경계 / NULL

```c
static void test_normal(void)   /* 필수만 채운 최소 레코드가 통과해야 한다 */
{
    subs_profile_t p;
    subs_profile_init(&p);
    snprintf(p.supi, sizeof(p.supi), "450081234567890");
    p.nssai_num       = 1;
    p.nssai[0].sst    = 1;
    subs_profile_set_prepaid_balance(&p, 0);     /* chargingMethod 는 M — 안 정하면 반려된다 */
    T_EQ_INT(subs_profile_validate(&p), RET_OK);
}

static void test_edge(void)     /* 경계: 배열 0개 / 9개 / 범위 초과 */
{
    subs_profile_t p;
    subs_profile_init(&p);
    snprintf(p.supi, sizeof(p.supi), "450081234567890");
    subs_profile_set_prepaid_balance(&p, 0);

    p.nssai_num = 0;                    /* 규격상 최소 1개 */
    T_EQ_INT(subs_profile_validate(&p), RET_BAD_FORMAT);

    p.nssai_num = 9;                    /* 규격상 최대 8개 */
    T_EQ_INT(subs_profile_validate(&p), RET_BAD_FORMAT);

    p.nssai_num = 1; p.nssai[0].sst = 255;
    p.has_ambr_ul = true; p.ambr_ul = 4000001;   /* 상한 한 칸 초과 */
    T_EQ_INT(subs_profile_validate(&p), RET_BAD_FORMAT);
}

static void test_null(void)
{
    T_EQ_INT(subs_profile_validate(NULL), RET_INVALID_ARG);
    T_EQ_INT(rat_type_from_str(NULL, NULL), RET_INVALID_ARG);
}
```

### 시험 ④ — 레이아웃 (정렬)

```c
#include <stddef.h>                    /* offsetof */
#include <stdalign.h>                  /* alignof (C11) */

#define FSZ(_t, _m)   sizeof(((_t *)0)->_m)

static void test_layout(void)
{
    /* 멤버 크기 합. 멤버를 추가하면 여기도 같이 늘려야 한다 -> 그래서 이 시험이 필요하다 */
    size_t sum = FSZ(subs_profile_t, supi)      + FSZ(subs_profile_t, suspended)
               + FSZ(subs_profile_t, has_nickname) + FSZ(subs_profile_t, nickname)
               + FSZ(subs_profile_t, has_rat_type) + FSZ(subs_profile_t, rat_type)
               + FSZ(subs_profile_t, has_ambr_ul)  + FSZ(subs_profile_t, ambr_ul)
               + FSZ(subs_profile_t, has_ambr_dl)  + FSZ(subs_profile_t, ambr_dl)
               + FSZ(subs_profile_t, has_last_seen)+ FSZ(subs_profile_t, last_seen)
               + FSZ(subs_profile_t, nssai)        + FSZ(subs_profile_t, nssai_num)
               + FSZ(subs_profile_t, has_suspend_cause) + FSZ(subs_profile_t, suspend_cause)
               + FSZ(subs_profile_t, charging_method)   + FSZ(subs_profile_t, info);   /* 확장 필드 */
    size_t pad = sizeof(subs_profile_t) - sum;

    /* 구멍이 하나도 없으면 남는 패딩은 꼬리 패딩뿐이고, 꼬리 패딩은 반드시 정렬값보다 작다 */
    T_EQ_INT(pad < alignof(subs_profile_t), 1);

    /* 큰 것부터 놓였는지: 8B 멤버가 맨 앞 */
    T_EQ_INT((int)offsetof(subs_profile_t, last_seen), 0);
}
```

> [!NOTE] 이 시험은 **재배치 후**에 통과해야 한다
> 1차(표 순서) 구조체에서는 `pad` 가 21이라 **일부러 실패**한다.
> 실패하는 걸 먼저 눈으로 보고 재배치한다.

### 시험 ⑤ — 조건부(C) 필드

```c
static void test_conditional(void)
{
    subs_profile_t p;

    subs_profile_init(&p);
    snprintf(p.supi, sizeof(p.supi), "450081234567890");
    p.nssai_num = 1; p.nssai[0].sst = 1;
    subs_profile_set_prepaid_balance(&p, 1000);      /* charging_method = PREPAID */

    /* ① 조건 참(suspended=true)인데 cause 가 없다 -> 반려 */
    p.suspended = true;
    p.has_suspend_cause = false;
    T_EQ_INT(subs_profile_validate(&p), RET_INVALID_ARG);

    /* ② 조건 참 + cause 있음 -> 통과 */
    p.has_suspend_cause = true;
    snprintf(p.suspend_cause, sizeof(p.suspend_cause), "OVERDUE");
    T_EQ_INT(subs_profile_validate(&p), RET_OK);

    /* ③ 조건 거짓(suspended=false)인데 cause 가 왔다 -> 내가 정한 정책대로.
     *    거절이면 RET_INVALID_ARG, 무시+경고면 RET_OK. 둘 중 하나로 고정되어 있으면 된다 */
    p.suspended = false;
    T_EQ_INT(subs_profile_validate(&p), RET_OK);     /* 무시 정책을 골랐을 때 */
}
```

### 시험 ⑥ — tagged union (제일 잘 틀리는 곳)

```c
static void test_union(void)
{
    subs_profile_t p;
    const postpaid_info_t *pp = NULL;

    subs_profile_init(&p);

    /* ① 태그가 NONE/PREPAID 인데 postpaid 를 읽으려 하면 NULL 이어야 한다.
     *    여기서 쓰레기 포인터가 나오면 getter 가 태그를 안 보고 있다는 뜻 */
    T_EQ_INT(subs_profile_get_postpaid(&p) == NULL, 1);

    /* ② POSTPAID 로 채운다 */
    {
        postpaid_info_t in;
        memset(&in, 0x00, sizeof(in));
        in.billing_day = 25;
        in.email_cnt   = 2;
        snprintf(in.emails[0], sizeof(in.emails[0]), "a@x.com");
        snprintf(in.emails[1], sizeof(in.emails[1]), "b@x.com");
        T_EQ_INT(subs_profile_set_postpaid(&p, &in), RET_OK);
    }
    pp = subs_profile_get_postpaid(&p);
    T_EQ_INT(pp != NULL, 1);
    T_EQ_INT(pp->billing_day, 25);
    T_EQ_INT(pp->email_cnt, 2);

    /* ③ ★ 잔재 시험: PREPAID 로 바꾸면 postpaid 는 더 이상 안 보여야 하고,
     *    prepaid 쪽에 이전 바이트가 섞여 들어오면 안 된다.
     *    set 함수가 union 을 memset 하지 않으면 여기서 balance 가 쓰레기가 된다 */
    T_EQ_INT(subs_profile_set_prepaid_balance(&p, 0), RET_OK);
    T_EQ_INT(subs_profile_get_postpaid(&p) == NULL, 1);
    T_EQ_INT(subs_profile_get_prepaid(&p)->balance, 0);

    /* ④ 태그가 가리키는 쪽만 validate 가 본다 — postpaid 범위를 어겨도 PREPAID 면 통과 */
    snprintf(p.supi, sizeof(p.supi), "450081234567890");
    p.nssai_num = 1; p.nssai[0].sst = 1;
    T_EQ_INT(subs_profile_validate(&p), RET_OK);
}
```

> [!TIP] ③ 이 이 드릴 전체에서 **가장 중요한 한 줄**이다
> `set` 함수에서 `memset(&p->info, 0, sizeof(p->info))` 를 빼먹어도
> **대부분의 시험은 통과한다.** ③ 처럼 **작은 멤버로 갈아탄 뒤** 읽어봐야 드러난다.
> 실무에서 이 버그는 "가끔 잔액이 이상한 값" 으로 나타나고, 재현이 안 된다.

### 시험 ⑦ — enum 왕복

```c
static void test_enum(void)
{
    int i = 0;

    /* to_str -> from_str 이 제자리로 돌아와야 한다. UNKNOWN 은 포함, END 는 제외 */
    for (i = RAT_UNKNOWN; i < RAT_END; i++) {
        rat_type_t back = RAT_UNKNOWN;
        T_EQ_INT(rat_type_from_str(rat_type_to_str((rat_type_t)i), &back), RET_OK);
        T_EQ_INT(back, i);
    }

    {
        rat_type_t out = RAT_NR;
        T_EQ_INT(rat_type_from_str("6G", &out), RET_OK);   /* 모르는 값은 에러가 아니다 */
        T_EQ_INT(out, RAT_UNKNOWN);
    }
}

int main(void)
{
    test_normal();
    test_edge();
    test_null();
    test_layout();
    test_conditional();
    test_union();
    test_enum();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

### 3-B. 변형 B 시험 — `policy_*`

`main()` 은 3-A 와 같은 모양이다.

```c
static void test_normal(void)
{
    policy_t p;
    const flat_t *f = NULL;

    policy_init(&p);
    p.policy_id = 1;
    T_EQ_INT(policy_set_flat(&p, 1000), RET_OK);
    T_EQ_INT(policy_validate(&p), RET_OK);
    f = policy_get_flat(&p);
    T_EQ_INT(f != NULL, 1);
    T_EQ_INT(f->fee, 1000);
    T_EQ_INT(PB_HAS(&p, PB_NAME), 0);                  /* 아무것도 안 켰다 */
}

static void test_edge(void)
{
    policy_t p;
    tier_t   t[4] = { {100, 10}, {200, 20}, {300, 30}, {400, 40} };

    policy_init(&p);
    p.policy_id = 1;
    policy_set_flat(&p, 0);

    p.present |= PB_PRIORITY;  p.priority = 15;
    T_EQ_INT(policy_validate(&p), RET_OK);             /* 상한 */
    p.priority = 16;
    T_EQ_INT(policy_validate(&p), RET_BAD_FORMAT);     /* 한 칸 초과 */

    p.present &= ~PB_PRIORITY;
    T_EQ_INT(policy_validate(&p), RET_OK);             /* ★ 안 온 필드는 검사하지 않는다 */

    p.present |= PB_QCI;
    p.qci = 0;   T_EQ_INT(policy_validate(&p), RET_BAD_FORMAT);
    p.qci = 1;   T_EQ_INT(policy_validate(&p), RET_OK);
    p.qci = 9;   T_EQ_INT(policy_validate(&p), RET_OK);
    p.qci = 10;  T_EQ_INT(policy_validate(&p), RET_BAD_FORMAT);
    p.present &= ~PB_QCI;

    p.present |= PB_VALID_FROM | PB_VALID_TO;
    p.valid_from = 200;  p.valid_to = 100;
    T_EQ_INT(policy_validate(&p), RET_BAD_FORMAT);     /* to < from */
    p.valid_to = 200;
    T_EQ_INT(policy_validate(&p), RET_OK);             /* 같으면 통과 */

    T_EQ_INT(policy_set_tiered(&p, t, 0), RET_INVALID_ARG);
    T_EQ_INT(policy_set_tiered(&p, t, 5), RET_INVALID_ARG);
    T_EQ_INT(policy_set_tiered(&p, t, 4), RET_OK);
    T_EQ_INT(policy_validate(&p), RET_OK);
    t[2].up_to_kb = 50;                                /* 오름차순 위반 */
    T_EQ_INT(policy_set_tiered(&p, t, 4), RET_OK);     /* set 은 저장만 한다 */
    T_EQ_INT(policy_validate(&p), RET_BAD_FORMAT);     /* 판정은 validate */

    T_EQ_INT(policy_set_usage(&p, 5, 0), RET_INVALID_ARG);   /* unit_kb == 0 */

    policy_init(&p);                                   /* kind 를 안 정한 레코드 */
    p.policy_id = 1;
    T_EQ_INT(policy_validate(&p), RET_BAD_FORMAT);     /* M 인데 안 채워짐 */
}

static void test_null(void)
{
    policy_t p;
    tier_t   t[1] = { {1, 1} };

    policy_init(&p);
    T_EQ_INT(policy_validate(NULL), RET_INVALID_ARG);
    T_EQ_INT(policy_set_flat(NULL, 1), RET_INVALID_ARG);
    T_EQ_INT(policy_set_usage(NULL, 1, 1), RET_INVALID_ARG);
    T_EQ_INT(policy_set_tiered(NULL, t, 1), RET_INVALID_ARG);
    T_EQ_INT(policy_set_tiered(&p, NULL, 1), RET_INVALID_ARG);
    T_EQ_INT(policy_get_flat(NULL) == NULL, 1);
}

static void test_union(void)
{
    policy_t p;
    tier_t   t[4] = { {100, 10}, {200, 20}, {300, 30}, {400, 40} };

    policy_init(&p);
    T_EQ_INT(policy_get_flat(&p) == NULL, 1);          /* 태그가 NONE 이면 전부 NULL */
    T_EQ_INT(policy_get_tiered(&p) == NULL, 1);

    policy_set_tiered(&p, t, 4);
    T_EQ_INT(policy_get_tiered(&p)->tier_cnt, 4);
    T_EQ_INT(policy_get_flat(&p) == NULL, 1);          /* 다른 arm 은 안 보인다 */

    policy_set_flat(&p, 0);                            /* ★ 잔재 시험 */
    T_EQ_INT(policy_get_tiered(&p) == NULL, 1);
    T_EQ_INT(policy_get_flat(&p)->fee, 0);             /* 이전 arm 의 바이트가 섞이면 0 이 아니다 */

    policy_set_usage(&p, 7, 1);
    T_EQ_INT(policy_get_usage(&p)->unit_price, 7);
    T_EQ_INT(policy_get_flat(&p) == NULL, 1);
}

static void test_layout(void)
{
    T_EQ_INT((int)offsetof(policy_t, valid_from), 0);  /* 8B 그룹이 맨 위 */
    T_EQ_INT((int)offsetof(policy_t, valid_to), 8);
    T_EQ_INT((int)offsetof(policy_t, kind) - (int)offsetof(policy_t, present), 4);  /* 같은 4B 그룹, 나란히 */
}
```

`test_layout` 은 `<stddef.h>` 가 필요하다.

### 3-C. 변형 C 시험 — `qres_*`

`main()` 은 3-A 와 같은 모양이다.

```c
static void test_normal(void)
{
    qres_t q;
    char   a[] = "alpha";
    const char *src[3] = { a, "beta", "gamma" };
    const qr_rows_t *r = NULL;

    qres_init(&q);
    T_EQ_INT(qres_set_rows(&q, src, 3), RET_OK);
    r = qres_get_rows(&q);
    T_EQ_INT(r != NULL, 1);
    T_EQ_INT(r->row_cnt, 3);
    T_EQ_STR(r->rows[0], "alpha");
    T_EQ_STR(r->rows[2], "gamma");

    a[0] = 'Z';                                        /* ★ 깊은 복사: 원본을 바꿔도 안 변한다 */
    T_EQ_STR(r->rows[0], "alpha");

    qres_free(&q);
    T_EQ_INT(q.kind, QR_NONE);
    T_EQ_INT(qres_get_rows(&q) == NULL, 1);
}

static void test_edge(void)
{
    qres_t q;
    const char *none[1] = { "x" };
    uint32_t i = 0, n = 100000;                        /* 상한 없음: 수만 건 */
    const char **big = (const char **)calloc(n, sizeof(*big));
    char msg[128];
    const qr_error_t *e = NULL;

    qres_init(&q);

    T_EQ_INT(qres_set_rows(&q, none, 0), RET_OK);      /* 0건 */
    T_EQ_INT(qres_get_rows(&q) != NULL, 1);
    T_EQ_INT(qres_get_rows(&q)->row_cnt, 0);
    T_EQ_INT(qres_get_rows(&q)->rows == NULL, 1);      /* malloc(0) 을 하지 않는다 */

    for (i = 0; i < n; i++) big[i] = "row";
    T_EQ_INT(qres_set_rows(&q, big, n), RET_OK);       /* 대량 */
    T_EQ_INT(qres_get_rows(&q)->row_cnt, n);
    T_EQ_INT(qres_set_rows(&q, big, n), RET_OK);       /* 덮어쓰기: 이전 것을 먼저 해제 (누수 없음) */
    free((void *)big);

    T_EQ_INT(qres_set_count(&q, UINT64_MAX), RET_OK);  /* arm 전환: rows 해제 */
    T_EQ_INT(qres_get_rows(&q) == NULL, 1);
    T_EQ_INT(qres_get_count(&q)->total == UINT64_MAX, 1);

    memset(msg, 'x', sizeof(msg) - 1);  msg[sizeof(msg) - 1] = '\0';
    T_EQ_INT(qres_set_error(&q, -5, msg), RET_OK);
    e = qres_get_error(&q);
    T_EQ_INT(e->code, -5);
    T_EQ_INT(strlen(e->msg), 63);                      /* 63자까지, 널 종단 */
    T_EQ_INT(qres_set_error(&q, 1, NULL), RET_OK);
    T_EQ_STR(qres_get_error(&q)->msg, "");

    qres_free(&q);
    qres_free(&q);                                     /* 두 번 불러도 안전 */
    T_EQ_INT(q.kind, QR_NONE);
}

static void test_null(void)
{
    qres_t q;
    const char *src[1] = { "x" };

    qres_init(&q);
    T_EQ_INT(qres_set_rows(NULL, src, 1), RET_INVALID_ARG);
    T_EQ_INT(qres_set_rows(&q, NULL, 1), RET_INVALID_ARG);
    T_EQ_INT(qres_set_rows(&q, NULL, 0), RET_OK);      /* n == 0 이면 src 는 안 본다 */
    T_EQ_INT(qres_set_count(NULL, 1), RET_INVALID_ARG);
    T_EQ_INT(qres_set_error(NULL, 1, "x"), RET_INVALID_ARG);
    T_EQ_INT(qres_get_rows(NULL) == NULL, 1);
    qres_free(NULL);                                   /* 죽지 않으면 통과 */
    qres_free(&q);
}

static void test_layout(void)
{
    T_EQ_INT((int)offsetof(qres_t, u), 0);             /* 포인터를 품은 union 이 맨 위 */
}
```

`test_layout` 은 `<stddef.h>`, `test_edge` 는 `<stdlib.h>` / `<stdint.h>` 가 필요하다.
누수는 Makefile 의 AddressSanitizer(LeakSanitizer)가 종료 시점에 잡는다.

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [README 의 공통 Makefile](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 을 `~/cdrill/Makefile` 로 쓴다.

```bash
make D=d2_model V=subs_type      # 변형 A
make D=d2_model V=policy         # 변형 B
make D=d2_model V=qres           # 변형 C
```

* 마지막 줄이 **`PASS`** 이고 경고 0, 새니타이저 리포트 0 이면 통과다.
* 변형 A 의 `test_layout` 은 **1차(표 순서) 구조체에서 일부러 실패**한다.
  실패하는 것을 눈으로 본 뒤 재배치해서 통과시킨다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g \
>     -Icommon -Id2_model/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d2_model/src/subs_type.c d2_model/test/test_subs_type.c \
>     -o build/d2_model_subs_type
> ./build/d2_model_subs_type
> ```
>
> 변형 B, C 는 `subs_type` 을 `policy`, `qres` 로 바꾼다.

---

## 4. 자주 하는 실수

| 실수 | 결과 |
| :--- | :--- |
| Optional 인데 `has_` 없이 값만 둠 | "안 온 것"과 "0"을 영영 구분 못 한다 |
| `char sd[6]` (16진수 6자리) | **널 자리가 없다.** `sd[7]` 이 맞다 |
| enum 에 `_END` 가 없음 | 배열 크기·순회 상한을 **손으로 적게 되고**, 값 추가할 때 반드시 어긋난다 |
| `time_t` 대신 `int` / `uint32_t` | 2038년 오버플로. 정적분석에서도 바로 지적당한다 |
| 개수 필드가 `int` 이고 음수 검사 없음 | 음수 개수로 루프 → 즉사. `uint8_t` 로 두면 구조적으로 막힌다 |
| `validate` 가 `RET_FAIL` 만 리턴 | 어느 필드가 문제인지 호출부가 모른다 |
| 규격서의 **C 를 O 로** 옮겨 적음 | 필수여야 할 필드가 빠진 요청이 **정상 통과**한다 |
| 동시에 올 수 있는 C 를 union 에 넣음 | 둘째를 채우는 순간 첫째가 **에러 없이 지워진다** |
| 태그 없는 union | 읽는 쪽이 어느 arm 인지 알 방법이 없다 |
| setter 에서 `memset(&info, 0)` 누락 | 이전 arm 의 바이트가 남아 **가끔 이상한 값** — 재현이 안 된다 |
| 배열 `cnt` 를 union **바깥**에 둠 | arm 을 바꿔도 개수가 남아 **엉뚱한 메모리를 루프**한다 |
| union 을 보는 `switch` 에 `default:` 없음 | `UNKNOWN` 태그가 조용히 통과한다 |
| 표 순서 그대로 두고 끝냄 | `has_`(1B) 와 `uint32_t`/`time_t` 가 번갈아 나와 **패딩이 21B** 생긴다 |
| `char supi[16]` 을 **앞에** 두고 8B 멤버를 뒤에 | 앞 멤버가 홀수 크기라 뒤 멤버가 줄줄이 밀린다. `char[]` 는 **끝** |
| 재배치하면서 `has_` 를 값에서 **떨어뜨리고 주석 없이** 둠 | 나중에 짝을 못 찾는다. 그룹 주석으로 관계를 남긴다 |
| `sizeof` 를 안 찍고 "줄었겠지" 하고 넘어감 | 실제로는 그대로일 수 있다. **찍어서 숫자로 확인** |
| 배열 옆 `cnt` 를 정렬 때문에 멀리 떼어냄 | `snssai_t` 는 정렬 1 이라 **`cnt` 를 배열 바로 위에 둬도 패딩이 없다.**<br>떼어낼 이유가 없다 |
| (B) 비트 번호를 숫자로 직접 씀 (`present & 4`) | 어느 필드인지 못 읽는다.<br>`PB_PRIORITY` 같은 이름 있는 enum 으로 쓴다 |
| (B) `present` 를 안 보고 값을 검사함 | 안 온 필드가 0 이라 정상 입력이 반려된다 |
| (C) `free` 가 태그를 안 보고 아무 arm 이나 해제 | 다른 arm 의 정수를 주소로 착각해 크래시한다 |
| (C) set 이 이전 arm 을 안 지우고 덮어씀 | 이전 `rows` 가 통째로 샌다 (ASan 이 종료 시점에 보고) |
| (C) `n == 0` 에서 `malloc(0)` 결과를 NULL 검사 | 구현마다 NULL 이 올 수 있어 정상 입력이 `NO_MEM` 이 된다 |

---

## 5. 모범답안 (변형 A)

> 아래 `subs_type.h` 는 **확장 전(필드 1~8) 기준**이다.
> 확장(9~12)은 `C ①~③` 폴드에 있다.

> [!success]- 다 치고 나서 열 것 — `subs_type.h`
> ```c
> #ifndef SUBS_TYPE_H
> #define SUBS_TYPE_H
>
> #include <stdbool.h>
> #include <stddef.h>                    /* offsetof — _Static_assert 에서 쓴다 */
> #include <stdint.h>
> #include <time.h>
>
> #define SUPI_LEN_MAX      15
> #define NICKNAME_LEN_MAX  31
> #define SD_LEN            6            /* 16진수 6자리 */
> #define NSSAI_NUM_MAX     8
> #define AMBR_KBPS_MAX     4000000
>
> /* ── enum: UNKNOWN 으로 시작, END 로 끝 ───────────────── */
> typedef enum {
>     RAT_UNKNOWN = 0,                   /* 파싱 실패 / 미수신 */
>     RAT_NR,
>     RAT_EUTRA,
>     RAT_WLAN,
>     RAT_END                            /* 개수 = RAT_END */
> } rat_type_t;
>
> const char *rat_type_to_str(rat_type_t v);
> int         rat_type_from_str(const char *s, rat_type_t *out);
>
> /* ── 하위 구조체 ──────────────────────────────────────── */
> typedef struct {
>     uint8_t sst;                       /* M, 0~255 */
>     bool    has_sd;                    /* O */
>     char    sd[SD_LEN + 1];            /*    +1 */
> } snssai_t;
>
> /* ── 본 구조체 ────────────────────────────────────────── */
> typedef struct {
>     /* M */
>     char       supi[SUPI_LEN_MAX + 1];
>     bool       suspended;              /* 기본 false */
>
>     /* O — 값 바로 위에 has_ */
>     bool       has_nickname;
>     char       nickname[NICKNAME_LEN_MAX + 1];
>
>     bool       has_rat_type;
>     rat_type_t rat_type;
>
>     bool       has_ambr_ul;
>     uint32_t   ambr_ul;                /* kbps */
>
>     bool       has_ambr_dl;
>     uint32_t   ambr_dl;
>
>     bool       has_last_seen;
>     time_t     last_seen;              /* 64비트. int 금지 */
>
>     /* 배열 + 개수 (붙여 둔다) */
>     snssai_t   nssai[NSSAI_NUM_MAX];
>     uint8_t    nssai_num;              /* 1~8 */
> } subs_profile_t;
>
> void subs_profile_init(subs_profile_t *p);
> int  subs_profile_validate(const subs_profile_t *p);
> void subs_profile_dump(const subs_profile_t *p);
>
> #endif /* SUBS_TYPE_H */
> ```

> [!success]- `subs_type.c` — init / validate / enum 쌍
> ```c
> #include "common.h"
> #include "log.h"
> #include "guard.h"
> #include "subs_type.h"
>
> /* 인덱스 = enum 값. 순서가 어긋나면 전부 틀어지므로 한 곳에서만 관리한다 */
> static const char *g_rat_str[RAT_END] = {
>     [RAT_UNKNOWN] = "UNKNOWN",
>     [RAT_NR]      = "NR",
>     [RAT_EUTRA]   = "EUTRA",
>     [RAT_WLAN]    = "WLAN",
> };
>
> const char *rat_type_to_str(rat_type_t v)
> {
>     if (v < RAT_UNKNOWN || v >= RAT_END) return "UNKNOWN";
>     return g_rat_str[v];
> }
>
> int rat_type_from_str(const char *s, rat_type_t *out)
> {
>     int i = 0;
>
>     CHK_PTR(s);
>     CHK_PTR(out);
>
>     *out = RAT_UNKNOWN;
>     for (i = RAT_UNKNOWN; i < RAT_END; i++) {
>         if (strcmp(s, g_rat_str[i]) == 0) { *out = (rat_type_t)i; return RET_OK; }
>     }
>     LOG_WRN("unknown ratType: %s", s);   /* 모르는 값은 에러가 아니라 UNKNOWN */
>     return RET_OK;
> }
>
> void subs_profile_init(subs_profile_t *p)
> {
>     if (p == NULL) return;
>     memset(p, 0x00, sizeof(*p));
>     p->suspended = false;                /* 기본값은 memset 후 명시적으로 */
>     p->rat_type  = RAT_UNKNOWN;
> }
>
> #define V_FAIL(_fmt, ...)                                               \
>     do { LOG_ERR("validate: " _fmt, __VA_ARGS__); return RET_BAD_FORMAT; } while (0)
>
> int subs_profile_validate(const subs_profile_t *p)
> {
>     size_t len = 0;
>     int    i   = 0;
>
>     CHK_PTR(p);
>
>     /* 1) supi: M, 1~15자, 숫자만 */
>     len = strnlen(p->supi, sizeof(p->supi));
>     if (len == 0 || len > SUPI_LEN_MAX) V_FAIL("supi len=%zu", len);
>     for (i = 0; p->supi[i] != '\0'; i++) {
>         if (p->supi[i] < '0' || p->supi[i] > '9') V_FAIL("supi[%d] not digit", i);
>     }
>
>     /* 2) nssai: M, 1~8개 */
>     if (p->nssai_num == 0 || p->nssai_num > NSSAI_NUM_MAX)
>         V_FAIL("nssai_num=%u", p->nssai_num);
>
>     for (i = 0; i < (int)p->nssai_num; i++) {
>         if (!p->nssai[i].has_sd) continue;
>         if (strnlen(p->nssai[i].sd, sizeof(p->nssai[i].sd)) != SD_LEN)
>             V_FAIL("nssai[%d].sd len", i);
>     }
>
>     /* 3) Optional 은 has_ 가 켜진 것만 검사한다 */
>     if (p->has_ambr_ul && p->ambr_ul > AMBR_KBPS_MAX) V_FAIL("ambr_ul=%u", p->ambr_ul);
>     if (p->has_ambr_dl && p->ambr_dl > AMBR_KBPS_MAX) V_FAIL("ambr_dl=%u", p->ambr_dl);
>     if (p->has_rat_type && (p->rat_type <= RAT_UNKNOWN || p->rat_type >= RAT_END))
>         V_FAIL("rat_type=%d", (int)p->rat_type);
>     if (p->has_last_seen && p->last_seen < 0) V_FAIL("last_seen=%lld",
>                                                      (long long)p->last_seen);
>
>     return RET_OK;
> }
>
> void subs_profile_dump(const subs_profile_t *p)
> {
>     int i = 0;
>     if (p == NULL) { LOG_INF("profile: (null)"); return; }
>
>     LOG_INF("supi=%s suspended=%s", p->supi, p->suspended ? "Y" : "N");
>     LOG_INF("  nickname=%s", p->has_nickname ? p->nickname : "-");
>     LOG_INF("  rat=%s", p->has_rat_type ? rat_type_to_str(p->rat_type) : "-");
>
>     if (p->has_ambr_ul) LOG_INF("  ambrUl=%u kbps", p->ambr_ul);
>     else                LOG_INF("  ambrUl=-");
>
>     for (i = 0; i < (int)p->nssai_num; i++) {
>         LOG_INF("  nssai[%d] sst=%u sd=%s", i, p->nssai[i].sst,
>                 p->nssai[i].has_sd ? p->nssai[i].sd : "-");
>     }
> }
> ```
>
> **눈여겨볼 점 4가지**
> 1. `g_rat_str` 은 **지정 초기화자(`[RAT_NR] = ...`)** 로 쓴다.
>    나중에 enum 중간에 값을 끼워도 안 깨진다.
> 2. `from_str` 에서 **모르는 문자열은 에러가 아니다.** `UNKNOWN` 으로 두고 `RET_OK` — 규격이 나중에 값을 추가해도 내 코드가 안 죽는다.
> 3. `validate` 는 Optional 을 **`has_` 가 켜진 것만** 검사한다.
>    안 온 필드를 검사하면 정상 입력이 반려된다.
> 4. `V_FAIL` 같은 **지역 매크로 하나**면 검사문이 한 줄로 줄어든다.
>    길어지면 검사를 빼먹게 된다.

> [!success]- 정렬 ① — 오프셋 손 계산표 정답 (위 모범답안 = 1차, 표 순서 그대로)
> LP64 기준 (`time_t` 8B, enum 4B).
> **손으로 계산한 값**이니, 자기 환경에서 `offsetof` 로 꼭 대조한다.
>
> | 멤버 | 크기 | 정렬 | 오프셋 | 끝 | 앞 패딩 |
> | :--- | :--- | :--- | :--- | :--- | :--- |
> | `supi[16]` | 16 | 1 | 0 | 16 | 0 |
> | `suspended` | 1 | 1 | 16 | 17 | 0 |
> | `has_nickname` | 1 | 1 | 17 | 18 | 0 |
> | `nickname[32]` | 32 | 1 | 18 | 50 | 0 |
> | `has_rat_type` | 1 | 1 | 50 | 51 | 0 |
> | `rat_type` | 4 | 4 | **52** | 56 | **1** |
> | `has_ambr_ul` | 1 | 1 | 56 | 57 | 0 |
> | `ambr_ul` | 4 | 4 | **60** | 64 | **3** |
> | `has_ambr_dl` | 1 | 1 | 64 | 65 | 0 |
> | `ambr_dl` | 4 | 4 | **68** | 72 | **3** |
> | `has_last_seen` | 1 | 1 | 72 | 73 | 0 |
> | `last_seen` | 8 | 8 | **80** | 88 | **7** |
> | `nssai[8]` (9B × 8) | 72 | 1 | 88 | 160 | 0 |
> | `nssai_num` | 1 | 1 | 160 | 161 | 0 |
> | **꼬리** (8의 배수로) | | | 161 | **168** | **7** |
>
> **`sizeof` = 168, 패딩 합계 = 1 + 3 + 3 + 7 + 7 = 21B** (실데이터 147B).
> 패딩은 전부 **"`has_`(1B) 바로 뒤에 4B/8B 값이 오는 자리"** 에서 생겼다.
> 그래서 `has_` 를 모으는 게 핵심이다.

> [!success]- 정렬 ② — 재배치한 구조체 (168B → 152B)
> ```c
> typedef struct {
>     /* ── 8B 그룹 ── */
>     time_t     last_seen;              /* O — has_last_seen 과 짝. 64비트라 int 금지 */
>
>     /* ── 4B 그룹 ── */
>     uint32_t   ambr_ul;                /* O — has_ambr_ul */
>     uint32_t   ambr_dl;                /* O — has_ambr_dl */
>     rat_type_t rat_type;               /* O — has_rat_type */
>
>     /* ── 1B 그룹: 여기부터는 전부 정렬 1 이라 순서가 자유롭다 ── */
>     bool       suspended;              /* M, 기본 false */
>     bool       has_nickname;           /* Optional 존재 표시 (has_ 6개를 한곳에) */
>     bool       has_rat_type;
>     bool       has_ambr_ul;
>     bool       has_ambr_dl;
>     bool       has_last_seen;
>
>     /* ── 정렬 1: 문자열 · 하위 구조체 배열은 맨 끝 ── */
>     char       supi[SUPI_LEN_MAX + 1];
>     char       nickname[NICKNAME_LEN_MAX + 1];
>     uint8_t    nssai_num;              /* 정렬 1 이라 배열 바로 위에 둬도 패딩 없음 */
>     snssai_t   nssai[NSSAI_NUM_MAX];
> } subs_profile_t;
>
> /* 누가 멤버를 끼워 넣어 크기가 바뀌면 여기서 빌드가 깨진다.
>  * 152 는 LP64 + 4B enum 기준 — 다른 환경이면 offsetof 로 찍어 본 값으로 바꾼다 */
> _Static_assert(sizeof(subs_profile_t) == 152, "subs_profile_t layout changed");
> _Static_assert(offsetof(subs_profile_t, last_seen) == 0, "8B member must be first");
> ```
>
> | | 1차 (표 순서) | 2차 (정렬 후) |
> | :--- | :--- | :--- |
> | `sizeof` | 168 B | **152 B** |
> | 중간 패딩 | 14 B (4곳) | **0** |
> | 꼬리 패딩 | 7 B | 5 B |
> | 패딩 합 | 21 B | **5 B** |
>
> **눈여겨볼 점**
> 1. 152 가 최선이다.
>    실데이터가 147B 이고 크기는 **8의 배수**여야 하므로 꼬리 5B 는 못 없앤다.
> 2. `has_` 를 값에서 떼어냈으므로 **그룹 주석에 "짝"을 적어 둔다.** 짝이 안 보이면 나중에 한쪽만 바꾸는 사고가 난다.
> 3. `snssai_t` 는 멤버가 전부 1B 계열이라 정렬 1 → 배열 크기가 9의 배수여도 **아무 데나 놓을 수 있다.**
> 4. 이 재배치가 **`memset` 초기화·`validate` 로직에는 영향이 없다.** 멤버 이름이 그대로이기 때문이다.
>    **영향받는 건 구조체를 바이트로 다루는 코드뿐** → 그래서 D4 에서는 `pack` 으로 필드를 하나씩 옮긴다.

> [!success]- 정렬 ③ — 변형 B · C 의 **배치** 힌트
> - **B (비트마스크 12필드)**: `uint32_t present` 를 **맨 위**(4B 그룹)에 둔다.
>   `has_` 가 사라지니 1B 그룹 고민이 없어지고, 나머지는 8 → 4 → 2 → 1 → `char[]` 순으로만 놓으면 **중간 패딩 0** 이 된다.
> - **C (동적 배열)**: `char **rows;` 같은 **포인터(8B)를 맨 위**, 개수는 `uint32_t` 로 4B 그룹, 플래그는 1B 그룹에 둔다.
>   개수를 `size_t` 로 쓰면 32/64비트 환경마다 크기가 달라지므로 **고정 크기 타입**을 쓴다.
>   남는 패딩이 **꼬리에만** 있으면(구멍 0) 정상이다.

> [!success]- C ① — 판단표 정답과 `suspend_cause` (C 가 하나뿐인 경우)
>
> | 필드 | 조건 | 동시에 올 수 있나 | 패턴 | 표현 |
> | :--- | :--- | :--- | :--- | :--- |
> | `suspend_cause` | `suspended == true` | **다른 C 와 무관** | ① 독립 | `has_` + 조건식 |
> | `prepaid_info` | `charging_method == PREPAID` | **아니오** (아래와 배타) | ② 배타 | **tagged union** |
> | `postpaid_info` | `charging_method == POSTPAID` | **아니오** (위와 배타) | ② 배타 | 같은 union 의 다른 arm |
>
> 판단 근거는 한 줄이다.
> **`charging_method` 는 값이 하나**이므로 두 info 가 동시에 유효할 수 없다 → union.
> `suspend_cause` 는 과금 방식과 아무 상관이 없다 → **union 에 넣으면 안 된다.**
>
> ```c
> /* 조건식은 함수로 뽑는다. validate 본문이 조건 문장으로 어지러워지지 않게 */
> static int cond_suspend_cause_required(const subs_profile_t *p)
> {
>     return p->suspended;                       /* 규격: suspended 이면 M */
> }
>
> /* validate 안에서 */
> if (cond_suspend_cause_required(p)) {
>     if (!p->has_suspend_cause) V_FAIL("suspend_cause required when suspended=%d", 1);
>     if (strnlen(p->suspend_cause, sizeof(p->suspend_cause)) == 0)
>         V_FAIL("suspend_cause empty%s", "");
> } else if (p->has_suspend_cause) {
>     /* 정책: 무시 + 경고. 근거 — 상대가 정지 해제를 보내면서 직전 사유를 같이 보내는
>      *       구현이 흔하고, 그걸 반려하면 정상 해제가 막힌다 */
>     LOG_WRN("suspend_cause ignored: not suspended");
> }
> ```
>
> **정책은 둘 중 아무거나 골라도 된다.
> 고르고 근거를 남겼는지**가 채점 대상이다.

> [!success]- C ② — 배타 C 를 tagged union 으로 (`charging_method` 를 태그로 재사용)
> ```c
> /* ── 태그: 이미 M 필드로 있다. 새로 만들 필요 없다 ─────── */
> typedef enum {
>     CHARGE_UNKNOWN = 0,                /* memset(0) = "아직 안 정함" */
>     CHARGE_PREPAID,
>     CHARGE_POSTPAID,
>     CHARGE_END
> } charge_method_t;
>
> /* ── arm 마다 자기 구조체로 감싼다 ───────────────────── */
> typedef struct {                       /* 값이 한 개 */
>     uint32_t balance;                  /* 원 */
> } prepaid_info_t;
>
> typedef struct {                       /* ★ 값이 여러 개 — 배열과 개수를 이 안에 가둔다 */
>     uint8_t  billing_day;              /* 1~28 */
>     uint8_t  email_cnt;                /* 0~3  ← union 밖에 두면 안 된다 */
>     char     emails[INVOICE_EMAIL_NUM_MAX][EMAIL_LEN_MAX + 1];
> } postpaid_info_t;
>
> typedef struct {
>     /* … 앞의 멤버들 … */
>     charge_method_t charging_method;   /* ★ 태그 */
>     union {
>         prepaid_info_t  prepaid;       /* CHARGE_PREPAID 일 때만 유효 */
>         postpaid_info_t postpaid;      /* CHARGE_POSTPAID 일 때만 유효 */
>     } info;
>     /* … */
> } subs_profile_t;
> ```
>
> **getter / setter 쌍 — union 을 직접 건드리는 코드를 이 두 함수 밖으로 내보내지 않는다**
> ```c
> const postpaid_info_t *subs_profile_get_postpaid(const subs_profile_t *p)
> {
>     if (p == NULL || p->charging_method != CHARGE_POSTPAID) return NULL;   /* ★ 태그 확인 */
>     return &p->info.postpaid;
> }
>
> int subs_profile_set_postpaid(subs_profile_t *p, const postpaid_info_t *src)
> {
>     CHK_PTR(p);
>     CHK_PTR(src);
>
>     p->charging_method = CHARGE_POSTPAID;             /* ① 태그 */
>     memset(&p->info, 0x00, sizeof(p->info));          /* ② ★ 이전 arm 잔재 제거 */
>     p->info.postpaid = *src;                          /* ③ 멤버 채우기 */
>     return RET_OK;
> }
>
> /* prepaid 쪽도 똑같은 모양이다 — 시험 ⑤·⑥ 이 이 두 함수를 쓴다 */
> const prepaid_info_t *subs_profile_get_prepaid(const subs_profile_t *p)
> {
>     if (p == NULL || p->charging_method != CHARGE_PREPAID) return NULL;
>     return &p->info.prepaid;
> }
>
> int subs_profile_set_prepaid_balance(subs_profile_t *p, uint32_t balance)
> {
>     CHK_PTR(p);
>
>     p->charging_method = CHARGE_PREPAID;              /* ① 태그 */
>     memset(&p->info, 0x00, sizeof(p->info));          /* ② 지우기 */
>     p->info.prepaid.balance = balance;                /* ③ 채우기 */
>     return RET_OK;
> }
> ```
>
> **validate 는 태그가 가리키는 arm 하나만 본다**
> ```c
> switch (p->charging_method) {
> case CHARGE_PREPAID:
>     /* balance 는 uint32_t 라 범위 검사가 따로 필요 없다 */
>     break;
> case CHARGE_POSTPAID: {
>     const postpaid_info_t *q = &p->info.postpaid;
>     int i = 0;
>     if (q->billing_day < 1 || q->billing_day > 28) V_FAIL("billing_day=%u", q->billing_day);
>     if (q->email_cnt > INVOICE_EMAIL_NUM_MAX)      V_FAIL("email_cnt=%u", q->email_cnt);
>     for (i = 0; i < (int)q->email_cnt; i++) {
>         if (q->emails[i][0] == '\0') V_FAIL("emails[%d] empty", i);
>     }
>     break;
> }
> default:                                   /* CHARGE_UNKNOWN — M 인데 안 정해졌다 */
>     V_FAIL("charging_method=%d", (int)p->charging_method);
> }
> ```
>
> **눈여겨볼 점 4가지**
> 1. **태그를 새로 만들지 않았다.** `charging_method` 가 이미 M 이라 그걸 그대로 쓴다.
>    태그가 둘이면 어긋난다.
> 2. `email_cnt` 가 **`postpaid_info_t` 안**에 있다.
>    union 밖에 두면 PREPAID 로 바꿔도 개수가 남아 루프가 돈다.
> 3. setter 의 **`memset` 순서**(태그 → 지우기 → 채우기)가 시험 ⑥-③ 이 잡는 바로 그 지점이다.
> 4. `default:` 에서 **`CHARGE_UNKNOWN` 을 반려**한다.
>    M 필드인데 안 채워진 것이므로 통과시키면 안 된다.

> [!success]- C ③ — 확장 후 레이아웃 (152B → 416B) 과 깨진 `_Static_assert`
> 손으로 계산한 값이다 (LP64, enum 4B).
> **반드시 `offsetof` 로 대조**한다.
>
> **union 크기부터**
>
> | | 크기 | 정렬 |
> | :--- | :--- | :--- |
> | `prepaid_info_t` | 4 | 4 |
> | `postpaid_info_t` (1 + 1 + 3×64) | 194 | 1 |
> | **`union info`** | **196** (큰 쪽 194 를 정렬 4 의 배수로) | **4** |
>
> **재배치한 구조체** — union 은 정렬 4 이므로 **4B 그룹**에 들어간다
>
> | 멤버 | 크기 | 정렬 | 오프셋 |
> | :--- | :--- | :--- | :--- |
> | `last_seen` | 8 | 8 | 0 |
> | `ambr_ul` / `ambr_dl` / `rat_type` / `charging_method` | 4×4 | 4 | 8 / 12 / 16 / 20 |
> | **`info` (union)** | 196 | 4 | **24** |
> | `suspended` + `has_` 6개 | 7×1 | 1 | 220 ~ 226 |
> | `supi[16]` / `nickname[32]` / `suspend_cause[64]` | 112 | 1 | 227 / 243 / 275 |
> | `nssai_num` | 1 | 1 | 339 |
> | `nssai[8]` (9B × 8) | 72 | 1 | 340 ~ 412 |
> | **꼬리 패딩** (8의 배수로) | **4** | | 412 → **416** |
>
> **`sizeof` = 416, 중간 패딩 0, 꼬리 4B.**
>
> ```c
> /* 확장 전에 박아 둔 이 줄이 빌드를 깨뜨린다 — 그게 목적이다 */
> /* _Static_assert(sizeof(subs_profile_t) == 152, ...);   ← 깨짐 */
> _Static_assert(sizeof(subs_profile_t) == 416, "subs_profile_t layout changed");
> _Static_assert(offsetof(subs_profile_t, last_seen) == 0, "8B member must be first");
> ```
>
> > **여기서 진짜 배울 것**: 레코드 하나가 **152B → 416B** 로 2.7배가 됐다.
> > 늘어난 264B 중
> > **196B 가 union** 이고, 그중 실제로 쓰이는 건 **한 arm 뿐**이다.
> > 이 구조체를 세션 버퍼로 수만 개 잡는다면, `postpaid_info_t` 를 **포인터로 빼고**
> > 태그가 POSTPAID 일 때만 할당하는 쪽을 검토한다 (대신 `free` 를 태그로 갈라야 한다 → 변형 C).

> [!success]- C ④ — 변형 B · C 의 **union** 힌트
> - **B (비트마스크 12필드)**: C 가 **3갈래 배타**인데 **판별자가 표에 없다** → `policy_kind_t kind` enum 을 **새로 만들어** 태그로 쓴다.
>   `kind` 는 4B 이므로 `uint32_t present` 와 같은 4B 그룹에 나란히 둔다.
> - **C (동적 배열)**: union arm 안에 **포인터**가 들어간다.
>   이때 `_free()` 를 **반드시 `switch (tag)` 로 갈라서** 해제한다.
>   태그를 안 보고 아무 arm 의 포인터나 `free` 하면 **다른 arm 의 정수값을 주소로 착각해 크래시**한다.
>   해제 뒤 `memset(&u, 0)` + `tag = NONE` 까지가 한 세트다.

---

## 관련 노트

- [2. 데이터 모델 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md) — **2-6~2-10: C 와 tagged union**, **4장: 정렬과 패딩**
- [[C] API·규격 데이터 모델을 C 구조체로 설계하는 공식](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20API·규격%20데이터%20모델을%20C%20구조체로%20설계하는%20공식%20—%20JSON·YAML을%20정적%20메모리로%20매핑하기.md)
- [[C] 개수 필드 + 포인터의 포인터 — 동적 문자열 배열 만들고 해제하기](개발%20%28CS%29/언어/C언어/메모리·구조체/[C]%20개수%20필드%20+%20포인터의%20포인터%20—%20동적%20문자열%20배열%20만들고%20해제하기.md) — 변형 C
- [[C] 64비트 time_t와 32비트 int 변환](개발%20%28CS%29/언어/C언어/비트·바이트·정수/[C]%2064비트%20time_t와%2032비트%20int%20변환%20—%202038년%20문제와%20Coverity%20정적%20분석%20대응.md)
- [[Lang] Union, Typedef, Struct 구조 및 활용](개발%20%28CS%29/언어/C언어/기초%20문법/[Lang]%20Union,%20Typedef,%20Struct%20구조%20및%20활용.md) — union 문법 기초
- [다음: D3. 자원 잡는 함수](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D3.%20자원%20잡는%20함수%20—%20goto%20CLEANUP·create·destroy.md)
