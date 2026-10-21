---
title: "D9. 종합 — 요구사항 한 장을 동작하는 데몬으로"
description: "요구사항 한 장을 동작하는 데몬으로 완성하며 D0~D8 드릴을 종합하는 D9 최종 드릴입니다."
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D9. 종합 — 요구사항 한 장을 동작하는 데몬으로

> **쓰는 템플릿**: 1 ~ 6번 전부
>
> **목표 시간**: 1회차 이틀(실작업 6h) / 2회차 4h / **3회차 2h**
>
> D0~D8 을 **각 3회차까지 끝낸 뒤**에 한다.
> 여기서 막히면 막힌 드릴로 되돌아간다.
> 그게 이 드릴의 용도다.

> [!NOTE] 이 드릴의 문서 구성 (D0~D9 공통)
> ① **요구사항서** — 무엇을 만드나, 표로 확정한다.
> ② **pseudo code 템플릿** — 보고 치는 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 이게 통과하면 끝이다.
> ④ 자주 하는 실수
> ⑤ 회고 — D9 는 모범답안이 없다.
> 앞 드릴 결과를 **가져다 쓰는 것**이 답이기 때문이다.
>
> 변형 A/B/C 는 같은 일을 다른 소재로 다시 하는 것이고, 각 변형마다 ①②③이 준비되어 있다.

---

## 0. 합격의 정의

> **요구사항 한 장을 받아, 설계서와 동작하는 데몬과 시험을 혼자서 끝까지 만든다.**

"C를 안다"가 아니라 **"혼자 끝까지 간다"** 가 기준이다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** 세션 상태 관리 데몬 | ① 요구사항서<br>② pseudo code **전체** | 1. 표 3장과 C 판단표를 채운다.<br>2. 설계서를 그린다 (D6).<br>3. 부품을 이식하고 **새 코드(`session.c`, `handler.c`)만** 만든다.<br>4. ③ 단위 시험 → 인수 시험을 통과시킨다. |
| **2회차** | **B** 과금 집계기 | ① 요구사항서<br>② pseudo code 의 **번호와 제목만** (Level 2) | 1. 저널 시험(`test_journal`)부터 통과시킨다.<br>2. 인수 시험을 통과시킨다. |
| **3회차** | **C** 프로토콜 릴레이 | ① 요구사항서만 | 1. ③ 시험을 **먼저 읽는다.**<br>2. 백지에서 만든다. |

> 1회차에 막히면 같은 변형을 한 번 더 한다.
> 3회차를 통과하면 A 를 백지로 다시 한다.

---

## 1. 요구사항서

### 1-A. 변형 A — 세션 상태 관리 데몬

> [!QUOTE] 요구사항서 (전문)
> **세션 등록·갱신·해제 요청을 받아 상태를 관리하고, 응답 없는 세션을 자동 만료시키는 상주 프로세스.**
>
> **1) 프로토콜**
> - 전송: UDP. 메시지는 **D4 의 12바이트 고정 헤더 + D5 의 TLV body + 체크섬 2바이트**.
> - `Type`: `1=REGISTER`, `2=UPDATE`, `3=DEREGISTER`, `4=HEARTBEAT`, `17~20`=각 응답(`요청+16`).
> - body IE: `0x01 SessionId(4,M)` · `0x02 Cause(1, 응답만 M)` · `0x10 UeName(0~32,O)` · `0x20 Timestamp(8,O)` · `0x40 Ttl(2,O, 초)`.
> - 모르는 IEI 는 **건너뛰고 응답에 그대로 echo**.
>
> **2) 동작**
> - `REGISTER`: 세션을 `ACTIVE` 로 생성.
>   이미 있으면 **갱신**하고 `Cause=1(ALREADY_EXIST)`.
> - `UPDATE` / `HEARTBEAT`: 만료 시각을 `now + ttl` 로 연장.
>   없는 세션이면 `Cause=4(NOT_FOUND)`.
> - `DEREGISTER`: 세션 제거.
>   없으면 `Cause=4`.
> - `ttl` 기본 30초, 범위 5~3600.
> - **만료 감시**: 1초마다 순회해 만료된 세션을 `CLOSING` → 1초 뒤 제거.
>   만료 시 로그 1줄.
> - 동시 세션 최대 **10,000**.
>   초과 시 `Cause=6(NO_RESOURCE)`.
> - 세션 조회는 **해시 테이블**(버킷 1024, `session_id % 1024`).
>
> **3) 운영**
> - 설정 파일: `listen_port`, `worker_num`(1~64), `log_level`, `session_max`, `default_ttl`.
> - `SIGHUP`: `log_level`, `default_ttl` 만 재적재.
> - `SIGTERM`/`SIGINT`: **graceful shutdown** — 수신 중단 → 큐 소진 → 스레드 종료 → 자원 해제.
>   최대 5초.
> - 1초마다 통계 로그: `active=N expired=N rx=N tx=N drop=N`.
> - **어떤 입력에도 프로세스가 죽지 않는다.**
>
> **4) 성능 (참고선)**
> - 단일 노드에서 **초당 10,000 메시지** 처리 시 CPU 1코어 이하, 메모리 증가 없음(30분 연속).

> [!WARNING] D4 의 `Type` 은 **5비트(0~31)** 라서 `129` 가 들어가지 않는다
> 그래서 이 드릴에서는 **응답 = 요청 + 16** (`17 ~ 20`)으로 정한다.
> D5 확장의 "`msg_type >= 128` 이면 응답" 판정은 여기서 **`type >= 16` 이면 응답**으로 바꿔 쓴다.

**C 판단표 — 코딩 전에 채운다 (이 요구사항에서 union 이 필요한가?)**

| 필드 | 조건 | 패턴 | 결론 |
| :--- | :--- | :--- | :--- |
| `Cause` (0x02) | **응답(Type ≥ 17)이면 M**, 요청에 실려 오면 무시 | 독립 C | `has_cause` + **TLV 순회가 끝난 뒤** 한 곳에서 검사 (D5 확장) |
| `Ttl` (0x40) | REGISTER/UPDATE/HEARTBEAT 에서만 의미, DEREGISTER 에서는 무시 | O (Type 별로 쓰임만 다름) | `has_ttl` + 없으면 `default_ttl` |
| 요청 body / 응답 body | **같은 IE 집합의 부분집합** | **포함 관계** | **union 불필요.** 하나의 `msg_body_t` + `has_` |

> [!IMPORTANT] "union 을 쓰고 싶어지면 먼저 멈추고 두 가지를 묻는다"
> ① **동시에 올 수 있나?**
>    올 수 있으면 union ✗.
> ② **서로 배타인가, 아니면 포함 관계인가?**
>    포함이면 `has_` 로 충분하다.
>
> 이 요구사항은 **union 이 필요 없다.**
> 필요 없는 곳에 union 을 넣지 않는 것도 이 드릴의 채점 대상이다.

**새로 만드는 코드 — 모듈 API (A)**

| 파일 | 함수 | 요구사항 |
| :--- | :--- | :--- |
| `session.c` | `int sstore_create(size_t session_max, sstore_t **out)` | 버킷 1024 개짜리 해시 테이블.<br>**실패하면 `*out = NULL`.** |
| | `void sstore_destroy(sstore_t *st)` | NULL 안전.<br>체인의 모든 노드를 해제한다. |
| | `int sstore_register(sstore_t *st, uint32_t id, uint32_t ttl, time_t now, bool *existed)` | 없으면 `ACTIVE` 로 만들고 `*existed = false`.<br>**이미 있으면 갱신**하고 `*existed = true` (`CLOSING` 이었어도 `ACTIVE` 로 되살린다).<br>**꽉 찼고 새 세션이면 `RET_TOO_SMALL`.** |
| | `int sstore_touch(sstore_t *st, uint32_t id, uint32_t ttl, time_t now)` | `ACTIVE` 만 연장한다.<br>없거나 `CLOSING` 이면 `RET_NOT_FOUND`. |
| | `int sstore_remove(sstore_t *st, uint32_t id)` | 없으면 `RET_NOT_FOUND`. |
| | `int sstore_sweep(sstore_t *st, time_t now, size_t *to_closing, size_t *removed)` | `expire_at <= now` 인 `ACTIVE` → `CLOSING`(`closing_at = now + 1`).<br>`closing_at <= now` 인 `CLOSING` → 제거.<br>각 개수를 돌려준다. |
| | `size_t sstore_active(...)` / `size_t sstore_total(...)` | `ACTIVE` 개수 / `ACTIVE + CLOSING` 개수 (정원은 total 기준) |
| | `int sstore_state(const sstore_t *st, uint32_t id, sess_state_t *out)` | 없으면 `RET_NOT_FOUND` |
| `handler.c` | `int handle_msg(sstore_t *st, uint8_t type, const msg_body_t *in, uint32_t default_ttl, time_t now, uint8_t *rsp_type, uint8_t *cause)` | 비즈니스 결과는 `*cause` 로 돌려주고 반환은 `RET_OK`.<br>`*rsp_type = type + 16`.<br>`has_ttl` 가 없으면 `default_ttl`, **범위 밖(5 미만, 3600 초과)이면 `RET_BAD_FORMAT`**.<br>모르는 `type` 은 `RET_NOT_SUPPORTED`.<br>`SessionId` 가 없으면 `RET_INVALID_ARG`. |
| `stats.c` | `stats_t` (`rx` / `tx` / `drop` / `expired` 원자 카운터), `int stats_format(const stats_t *s, size_t active, char *buf, size_t n)` | `"active=3 expired=1 rx=10 tx=8 drop=2"` 형식.<br>모자라면 `RET_TOO_SMALL`. |

`msg_body_t` 에는 D5 결과에 **`has_ttl` / `ttl`** 을 추가한다.
`sess_state_t` 는 `SS_NONE = 0` / `SS_ACTIVE` / `SS_CLOSING` 이다.

**`Cause` 값**

| 값 | 이름 | 언제 |
| :--- | :--- | :--- |
| 0 | OK | 정상 |
| 1 | ALREADY_EXIST | `REGISTER` 인데 이미 있음 |
| 4 | NOT_FOUND | `UPDATE` / `HEARTBEAT` / `DEREGISTER` 인데 없음 |
| 6 | NO_RESOURCE | 정원 초과 |

**로그 계약 — 시험이 이 문자열을 `grep` 한다**

| 시점 | 레벨 | 형식 |
| :--- | :--- | :--- |
| 기동 완료 | INF | `started: port=<n> worker=<n>` |
| 만료 | INF | `expired session=<id>` |
| 1초마다 통계 | INF | `active=<n> expired=<n> rx=<n> tx=<n> drop=<n>` |
| 종료 시 마지막 통계 | INF | 위와 같은 형식 (**한 번 더**) |
| 파싱 실패 · 쓰레기 | WRN | `drop: <사유>` |

종료 코드는 D7 과 같다 (0 정상 / 1 설정 / 2 소켓 / 3 스레드).

**산출물 — 세 묶음**

| 묶음 | 내용 |
| :--- | :--- |
| ① 설계서 | `d9/design.md` — 블록도 / sequence(REGISTER 정상·중복·만료 3종) / erDiagram(`session_t`·해시 버킷·통계) / flowchart(`handle_register()` 내부, 종료점마다 Cause) / stateDiagram(`IDLE → ACTIVE → CLOSING → (삭제)`) |
| ② 코드 | `common.h guard.h log.h`(D0) · `cfg`(D3) · `msg`(D4) · `tlv`(D5) · `jobq` · `daemon.c`(D7) 는 **그대로 가져온다.**<br>**새로 만드는 것은 `session.c` / `handler.c` / `stats.c` 뿐이다.** |
| ③ 시험 | 아래 §3 |

> [!TIP] 파일 순서가 곧 드릴 순서다
> 가져다 쓸 수 없으면, 그 드릴을 다시 해야 한다는 신호다.
> 앞 드릴 코드를 **손보지 않고 붙일 수 없다면** 그 드릴의 3회차가 덜 된 것이다.

### 1-B. 변형 B — 과금 집계기

**TCP 수신 + 파일 저널 + 5분 단위 집계 + 재기동 시 저널 복구.**
저널 레코드가 **종류별(START / INTERIM / STOP)** 로 모양이 다르므로 `kind` 태그 union 과 **필드 단위 직렬화**(구조체 통째 `fwrite` 금지)가 핵심이다.

**메시지 (D4 헤더 + D5 TLV, TCP 스트림)**

| Type | 이름 | body IE |
| :--- | :--- | :--- |
| 21 | START | `0x01 SessionId(4)` · `0x20 Timestamp(8)` |
| 22 | INTERIM | `0x01 SessionId(4)` · `0x20 Timestamp(8)` · `0x51 BytesDelta(4)` |
| 23 | STOP | `0x01 SessionId(4)` · `0x20 Timestamp(8)` · `0x50 BytesTotal(8)` · `0x52 Reason(1)` |

**저널 레코드 (바이너리)**

```text
┌────┬────┬──────┬──────────┬──────────┬──────────┐
│'J' │'1' │ kind │ len(BE2) │ payload  │ csum(BE2)│    csum = D4 의 인터넷 체크섬 (magic 부터 payload 끝까지)
└────┴────┴──────┴──────────┴──────────┴──────────┘
kind 1 START   : session_id(u32 BE) + ts_ms(u64 BE)                              → payload 12바이트
kind 2 INTERIM : session_id(u32 BE) + ts_ms(u64 BE) + bytes_delta(u32 BE)        → payload 16바이트
kind 3 STOP    : session_id(u32 BE) + ts_ms(u64 BE) + bytes_total(u64 BE) + reason(u8)   → payload 21바이트
```

`kind` 는 `JK_NONE = 0` / `JK_START = 1` / `JK_INTERIM = 2` / `JK_STOP = 3`, arm 은 `u.start` / `u.interim` / `u.stop` 이고, 필드 이름은 §3-B 시험에 나오는 것(`session_id`, `ts_ms`, `bytes_delta`, `bytes_total`, `reason`)을 쓴다.
`agg_win_t` 는 `starts` / `stops` / `bytes` 를 가진다.

**함수 (B)**

| 함수 | 요구사항 |
| :--- | :--- |
| `int jrec_pack(const jrec_t *in, uint8_t *buf, size_t buf_len, size_t *out_len)` | **필드 단위**로 쓴다.<br>`kind` 가 가리키는 arm 만 쓰고, 안 쓰는 arm 에 쓰레기가 있어도 결과가 같다.<br>모자라면 `RET_TOO_SMALL`, `kind` 가 `NONE` 이면 `RET_INVALID_ARG`. |
| `int jrec_unpack(const uint8_t *buf, size_t buf_len, jrec_t *out, size_t *consumed)` | 길이를 믿지 않는다.<br>`magic` 불일치, `kind` 모름, `len` 이 `kind` 의 길이와 다름, 체크섬 불일치 → `RET_BAD_FORMAT`.<br>입력이 짧으면 `RET_TOO_SMALL`. |
| `int journal_open(const char *path, journal_t **out)` | 파일이 있으면 **앞에서부터 읽어 유효한 레코드까지만 인정**하고, 그 뒤(깨진 꼬리)는 **잘라낸다** (`ftruncate`).<br>**두 번째 인스턴스는 `flock` 으로 거절**한다 (`RET_FAIL`). |
| `int journal_append(journal_t *j, const jrec_t *r)` | 한 레코드를 쓰고 `fflush` + `fsync`.<br>**쓰기 실패는 `RET_IO_ERROR`.** |
| `int journal_replay(const char *path, jrec_cb cb, void *ud, size_t *n_ok, size_t *valid_end)` | 유효한 레코드마다 `cb` 호출.<br>`*n_ok` = 개수, `*valid_end` = 마지막 유효 레코드 **끝 오프셋**. |
| `void agg_init(agg_t *a)` | 전부 0 |
| `int agg_feed(agg_t *a, const jrec_t *r)` | **5분(300,000 ms) 창**에 누적한다: 창 번호 = `ts_ms / 300000`.<br>창별 `starts` / `stops` / `bytes`(INTERIM 의 `bytes_delta` 합 + STOP 의 `bytes_total` 은 **합산하지 않는다**). |
| `int agg_get(const agg_t *a, uint64_t window, agg_win_t *out)` | 없는 창은 `RET_NOT_FOUND` |
| `void journal_close(journal_t *j)` | NULL 안전. |

**규칙**

1. 데몬은 메시지를 받으면 **저널에 먼저 쓰고**, 그다음에 집계에 반영한다 (write-ahead).
2. 재기동하면 저널을 **replay 해서 집계를 복원**하고 로그를 남긴다: `recovered records=<n>`.
3. 창이 닫힐 때(`agg_window_sec` 마다, 기본 300) 로그를 남긴다: `agg window=<n> starts=<n> stops=<n> bytes=<n>`.
4. 쓰기 파일이므로 `fclose` 실패도 결과에 반영한다 (`SAFE_FCLOSE_RET`).
5. 설정 키: `listen_port`, `journal_path`, `agg_window_sec`.
6. 종료 코드: 0 정상 / 1 설정 / 2 소켓 / 3 스레드 / **4 저널 잠금 실패**.

**에러 코드 규칙 (B)**

| 상황 | 리턴코드 |
| :--- | :--- |
| NULL 인자 | `RET_INVALID_ARG` |
| `kind == NONE` 으로 `pack` | `RET_INVALID_ARG` |
| 버퍼 부족 / 입력 짧음 | `RET_TOO_SMALL` |
| 레코드 형식 위반, 체크섬 불일치 | `RET_BAD_FORMAT` |
| 파일 열기·쓰기·`fsync` 실패 | `RET_IO_ERROR` |
| 다른 인스턴스가 잠금 보유 | `RET_FAIL` |

### 1-C. 변형 C — 프로토콜 릴레이

**양방향 TCP 중계 + 요청-응답 매칭(check-in / check-out) + 타임아웃 재전송 1회.**
**payload 는 해석하지 않고 원문을 통과**시킨다 (union 으로 풀지 않는다).

**구성**: `클라이언트 ⇄ 릴레이 ⇄ 업스트림` (릴레이는 업스트림에 **기동 시 연결**한다)

**규칙**

1. 클라이언트가 보낸 D4 메시지는 **헤더 길이와 체크섬만 검증**하고 payload 는 바이트 그대로 업스트림으로 보낸다.
   검증 실패는 **drop + WRN**, 연결은 유지한다.
2. 요청을 보낼 때 **check-in** 한다.
   키는 `(session_id, seq)`.
3. 업스트림이 같은 키의 응답(Type = 요청 + 16)을 보내면 **check-out** 하고 클라이언트에 **그대로 전달**한다.
4. `timeout_ms` 안에 응답이 없으면 업스트림으로 **1회 재전송**한다.
   다시 `timeout_ms` 가 지나도 없으면 클라이언트에게 **timeout 응답**을 보낸다: Type = 요청 + 16, `flags` 의 **b6(0x40) 켬**, payload 비움.
5. 응답이 이미 나간 뒤에 오는 늦은 응답은 **drop + WRN** (`late response`).
6. 슬롯은 **1024개**.
   가득 차면 새 요청을 **drop + WRN** 한다.
7. 설정 키: `listen_port`, `upstream_port`, `timeout_ms`.
8. 업스트림 연결 실패는 **exit 2**.
9. 종료(SIGTERM)는 새 요청을 멈추고, 대기 중인 슬롯은 **timeout 처리 없이 폐기**하고, 5초 안에 exit 0, 누수 0.

콜백 타입은 `typedef int (*rslot_cb)(uint32_t sid, uint32_t seq, const uint8_t *msg, size_t len, void *ud);` 이다.

**함수 (슬롯 부품)**

| 함수 | 요구사항 |
| :--- | :--- |
| `int rslots_create(size_t cap, rslots_t **out)` / `void rslots_destroy(rslots_t *rs)` | **실패하면 `*out = NULL`**, destroy 는 NULL 안전 |
| `int rslot_checkin(rslots_t *rs, uint32_t sid, uint32_t seq, const uint8_t *msg, size_t len, uint64_t now_ms)` | 메시지 **원문을 복사해** 보관한다.<br>같은 키가 있으면 `RET_FAIL`, 가득 차면 `RET_TOO_SMALL`. |
| `int rslot_checkout(rslots_t *rs, uint32_t sid, uint32_t seq)` | 없으면 `RET_NOT_FOUND` (**늦은 응답 판정**) |
| `int rslots_due(rslots_t *rs, uint64_t now_ms, uint64_t timeout_ms, rslot_cb on_retry, rslot_cb on_timeout, void *ud)` | 만료된 슬롯마다: 재전송 전이면 `on_retry` 후 **재전송 표시 + 시각 갱신**, 이미 재전송했으면 `on_timeout` 후 **슬롯 제거**.<br>콜백에는 보관한 원문 `msg` / `len` 이 넘어간다. |

**로그 계약**

| 시점 | 레벨 | 형식 |
| :--- | :--- | :--- |
| 요청 전달 | INF | `relay fwd session=<id> seq=<n>` |
| 응답 전달 | INF | `relay resp session=<id> seq=<n>` |
| 재전송 | INF | `relay retry session=<id> seq=<n>` |
| 만료 응답 | WRN | `relay timeout session=<id> seq=<n>` |
| 늦은 응답 | WRN | `late response session=<id> seq=<n>` |

**에러 코드 규칙 (C)**

| 상황 | 리턴코드 |
| :--- | :--- |
| NULL 인자, `cap == 0` | `RET_INVALID_ARG` |
| 같은 키가 이미 있음 | `RET_FAIL` |
| 슬롯이 가득 참 | `RET_TOO_SMALL` |
| 없는 키를 `checkout` | `RET_NOT_FOUND` |
| 할당 실패 | `RET_NO_MEM` (보관하던 것은 그대로) |

---

## 2. pseudo code 템플릿 — 보고 쳐서 익힌다

> **사용법**
> 아래 pseudo code 를 `d9/src/*.c` 에 **주석만 복사**한다.
> 코드는 주석을 보고 **내가 쓴다.**
> 다 쓰면 `[ ]` 를 `x` 로 바꾼다.
> 이 드릴은 **새 코드만** 친다.
> 나머지는 앞 드릴 결과를 가져온다.

### 2-A. Level 1 (1회차, 전부 본다)

```c
/* session.c */
/* [ ] 1. 구조체
 *        session_t { id, state, expire_at, closing_at, next }       ← 해시 체인용 next
 *        struct sstore_s { buckets[1024], max, total, active }
 *        버킷 = id % 1024 */
/* [ ] 2. sstore_create: 가드 → 객체 → (실패 주입 대비) CALLOC → 소유권 이전 */
/* [ ] 3. find(st, id, &prev)    ← 삭제를 위해 앞 노드를 같이 돌려주는 내부 함수 */
/* [ ] 4. sstore_register
 *        있으면: ttl 로 expire_at 갱신, CLOSING 이면 ACTIVE 로 되살림(active++), existed = true
 *        없으면: total >= max 이면 RET_TOO_SMALL
 *                노드 할당 (NO_MEM), 체인 앞에 연결, active++, total++, existed = false */
/* [ ] 5. sstore_touch: 없거나 CLOSING 이면 NOT_FOUND, 아니면 expire_at 갱신 */
/* [ ] 6. sstore_remove: find → 체인에서 떼고 → 상태에 따라 카운터 감소 → free */
/* [ ] 7. sstore_sweep: 모든 버킷을 순회 (순회 중 삭제를 안전하게)
 *        ACTIVE && expire_at <= now → CLOSING, closing_at = now + 1, active--, to_closing++
 *        CLOSING && closing_at <= now → 제거, total--, removed++ */
/* [ ] 8. sstore_destroy: 모든 버킷의 체인을 해제 (NULL 안전) */

/* handler.c */
/* [ ] 1. handle_msg
 *        가드 (st, in, rsp_type, cause)
 *        has_session_id 가 없으면 INVALID_ARG
 *        ttl = in->has_ttl ? in->ttl : default_ttl     ← 범위 5~3600 밖이면 BAD_FORMAT
 *        switch (type)
 *          1 REGISTER   : sstore_register → NO_RESOURCE(6) / ALREADY_EXIST(1) / OK(0)
 *          2 UPDATE
 *          4 HEARTBEAT  : sstore_touch → NOT_FOUND(4) / OK(0)
 *          3 DEREGISTER : sstore_remove → NOT_FOUND(4) / OK(0)      ← ttl 는 무시 (범위 검사도 안 한다)
 *          default      : RET_NOT_SUPPORTED
 *        *rsp_type = type + 16 */

/* stats.c */
/* [ ] 1. stats_t: atomic_ulong rx, tx, drop, expired */
/* [ ] 2. stats_format: snprintf 반환값으로 잘림 감지 → RET_TOO_SMALL */

/* daemon.c (D7 에서 가져온 뼈대에 끼운다) */
/* [ ] 1. recv_one: msg_unpack → tlv_parse → 실패면 drop++ + WRN "drop: ..." / 성공이면 rx++ → 큐
 * [ ] 2. worker_main: 큐에서 꺼내 handle_msg → 응답 build → 송신 → tx++
 *                     (응답 body: SessionId + Cause + 모르는 IE echo)
 * [ ] 3. watcher_main: 1초마다 cond_timedwait → sstore_sweep → expired 개수만큼 "expired session=" 로그
 *                      (락 안에서 I/O 하지 않도록 id 목록만 모으고 락 밖에서 로그)
 * [ ] 4. 통계 스레드(또는 watcher 가 겸함): 1초마다 stats_format 로그, 종료 때 한 번 더 */
```

### 2-B. Level 2 (2회차, 번호와 제목만 본다)

```c
/* journal.c */
/* [ ] 1. jrec_t { kind; union { start, interim, stop } u }     ← 태그 = kind, 안 쓰는 arm 은 건드리지 않는다 */
/* [ ] 2. jrec_pack: kind 로 갈라 필드 단위로 쓰기 → 체크섬 */
/* [ ] 3. jrec_unpack: magic / kind / len(kind 별 고정 길이) / 체크섬 검증 → 필드 단위로 읽기 */
/* [ ] 4. journal_replay: 파일을 읽으며 jrec_unpack 반복, 첫 실패 지점에서 멈춤 (valid_end) */
/* [ ] 5. journal_open: replay → valid_end 로 ftruncate → 잠금(flock) → append 모드 */
/* [ ] 6. journal_append: pack → fwrite → fflush → fsync, 쓰기 실패는 IO_ERROR (SAFE_FCLOSE_RET) */
/* [ ] 7. agg_feed / agg_get: 창 = ts_ms / 300000, INTERIM 만 bytes 합산 */
/* [ ] 8. daemon: write-ahead 순서 (journal_append → agg_feed), 재기동 시 replay 로 복원 */
```

### 2-C. Level 3 (3회차, 백지)

```c
/* 아무것도 안 본다.
 * §1-C 요구사항서와 §3-C 시험만 보고 만든다.
 *
 * 막히면 세 가지만 찾아본다.
 *   - 슬롯 테이블에서 순회 중 삭제를 안전하게 하는 법
 *   - check-in / check-out 을 한 뮤텍스로 보호하는 법 (D7 변형 C)
 *   - payload 를 해석하지 않고 헤더 길이만으로 프레임을 자르는 법 (D7 변형 B) */
```

### 2-D. 진행 계획 (1회차 기준)

| 구간 | 시간 | 하는 일 | 끝났다는 신호 |
| :--- | :--- | :--- | :--- |
| ① 표 3장 | 30분 | 메시지별 입력·출력·에러 표 | 에러 표에 Cause 6종이 다 있다 |
| ② 설계서 | 45분 | D6 그대로 | `check.sh` 가 `PASS` |
| ③ 부품 이식 | 30분 | D0·D3·D4·D5·D7 결과 복사 + 빌드 | 빈 `main` 이 뜨고 종료된다 |
| ④ 세션 저장소 | 60분 | 해시 테이블 + `session_t` + 만료 필드 | `test_session` PASS |
| ⑤ 핸들러 4종 | 90분 | `handle_msg` | `test_handler` PASS, 시나리오 1~3 통과 |
| ⑥ 만료 감시 | 45분 | 감시 스레드 + `CLOSING` 전이 | 시나리오 4 통과 |
| ⑦ 강건성 | 60분 | 자르기·쓰레기·정원초과·실패주입 | 시나리오 5~7 통과 |
| ⑧ 부하·정리 | 60분 | 30분 부하 + 회고 작성 | 시나리오 8 통과 |

> [!WARNING] ③에서 이식이 안 되면 멈추고 돌아간다
> 앞 드릴 코드를 **손보지 않고 붙일 수 없다면** 그 드릴의 3회차가 덜 된 것이다.
> 여기서 새로 짜기 시작하면 이 드릴은 종합이 아니라 그냥 큰 숙제가 된다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

시험은 **세 층**이다.

| 계층 | 내용 | 도구 |
| :--- | :--- | :--- |
| 단위 | 함수마다 정상 / 경계 / NULL | C (`test_*.c`) |
| 왕복·자르기 | `pack → unpack`, `build → parse` (모르는 IE 포함), 수신 버퍼를 0 ~ len-1 로 자르기 | D4 · D5 시험을 그대로 재사용 |
| 실패 주입 | `malloc` N번째 실패 → 누수 0 | D3 의 `test_alloc.h` |
| **C 조건** | 요청에 `Cause` 가 와도 통과 / **응답에 `Cause` 없으면 반려** / `Cause` 가 `SessionId` 보다 **앞에 와도** 통과 | D5 확장 시험 재사용 |
| 시나리오 | 인수 시험 8종 (A) / 저널 복구 시나리오 (B) / 릴레이 시나리오 (C) | 셸 · python |
| 설계서 | 그림이 합격 기준을 지켰나 | D6 의 `check.sh` |

```text
d9/src/*                         앞 드릴 결과 + session.c handler.c stats.c (A) / journal.c agg.c (B) / rslots.c relay.c (C)
d9/test/test_session.c           변형 A: 세션 저장소 단위 시험
d9/test/test_handler.c           변형 A: 핸들러 + 통계 단위 시험
d9/test/accept.sh                변형 A: 인수 시험 1~7
d9/test/soak.sh  soak_load.py    변형 A: 인수 시험 8 (30분 부하)
d9/test/test_journal.c           변형 B: 저널·집계 단위 시험
d9/test/accept_b.sh              변형 B: 복구 시나리오
d9/test/test_rslots.c            변형 C: 슬롯 단위 시험
d9/test/relay_check.py           변형 C: 릴레이 시나리오
d9/design.md                     설계서 (D6)
```

> [!IMPORTANT] 순서는 **단위 → 시나리오** 다
> 저장소·핸들러가 틀린 채로 데몬 시나리오를 돌리면 어디가 틀렸는지 알 수 없다.
> 단위 시험이 PASS 가 된 **뒤에** 시나리오를 돌린다.

### 3-0. 공통 매크로

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "common.h"
#include "log.h"

log_level_t g_log_level = LOG_LV_ERR;
int g_alloc_fail_at = -1;                /* D3 의 test_alloc.h 를 쓰는 시험만 */
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

#define T_EQ_BYTES(_got, _exp, _n)                                      \
    do {                                                                \
        if (memcmp((_got), (_exp), (_n)) != 0) { g_fail++;              \
            printf("  X %s:%d  bytes differ\n", __func__, __LINE__); }  \
    } while (0)
```

### 3-A. 변형 A 시험

**단위 시험 — `test_session.c`**

```c
#include "session.h"

static void test_basic(void)
{
    sstore_t    *st = NULL;
    bool         existed = true;
    sess_state_t s = SS_NONE;

    T_EQ_INT(sstore_create(10, &st), RET_OK);
    T_EQ_INT(sstore_register(st, 1, 30, 100, &existed), RET_OK);
    T_EQ_INT(existed, 0);                                  /* 새로 만들었다 */
    T_EQ_INT(sstore_register(st, 1, 30, 100, &existed), RET_OK);
    T_EQ_INT(existed, 1);                                  /* 이미 있다 → 갱신 */
    T_EQ_INT(sstore_active(st), 1);                        /* ★ 세션은 1개로 유지 */

    T_EQ_INT(sstore_touch(st, 1, 30, 110), RET_OK);
    T_EQ_INT(sstore_touch(st, 2, 30, 110), RET_NOT_FOUND);
    T_EQ_INT(sstore_state(st, 1, &s), RET_OK);
    T_EQ_INT(s, SS_ACTIVE);

    T_EQ_INT(sstore_remove(st, 1), RET_OK);
    T_EQ_INT(sstore_remove(st, 1), RET_NOT_FOUND);
    T_EQ_INT(sstore_active(st), 0);
    T_EQ_INT(sstore_total(st), 0);
    sstore_destroy(st);
}

static void test_capacity(void)
{
    sstore_t *st = NULL;
    bool      existed = false;
    uint32_t  i = 0;

    T_EQ_INT(sstore_create(10, &st), RET_OK);
    for (i = 1; i <= 10; i++) T_EQ_INT(sstore_register(st, i, 30, 100, &existed), RET_OK);
    T_EQ_INT(sstore_register(st, 11, 30, 100, &existed), RET_TOO_SMALL);   /* 한 칸 초과 */
    T_EQ_INT(sstore_register(st, 5, 30, 100, &existed), RET_OK);           /* 이미 있는 세션의 갱신은 통과 */
    T_EQ_INT(existed, 1);
    T_EQ_INT(sstore_remove(st, 3), RET_OK);
    T_EQ_INT(sstore_register(st, 11, 30, 100, &existed), RET_OK);          /* 자리가 나면 다시 받는다 */
    T_EQ_INT(sstore_total(st), 10);
    sstore_destroy(st);
}

static void test_collision(void)                           /* 같은 버킷 (id % 1024) */
{
    sstore_t    *st = NULL;
    bool         existed = false;
    sess_state_t s = SS_NONE;

    T_EQ_INT(sstore_create(100, &st), RET_OK);
    sstore_register(st, 1, 30, 100, &existed);
    sstore_register(st, 1025, 30, 100, &existed);
    sstore_register(st, 2049, 30, 100, &existed);

    T_EQ_INT(sstore_remove(st, 1025), RET_OK);             /* ★ 체인 가운데를 지운다 */
    T_EQ_INT(sstore_state(st, 1, &s), RET_OK);
    T_EQ_INT(sstore_state(st, 2049, &s), RET_OK);
    T_EQ_INT(sstore_state(st, 1025, &s), RET_NOT_FOUND);
    T_EQ_INT(sstore_remove(st, 2049), RET_OK);             /* 체인 머리(가장 나중에 넣은 것) 삭제 */
    T_EQ_INT(sstore_remove(st, 1), RET_OK);                /* 마지막 하나 */
    sstore_destroy(st);
}

static void test_sweep(void)
{
    sstore_t    *st = NULL;
    bool         existed = false;
    size_t       closing = 0, removed = 0;
    sess_state_t s = SS_NONE;

    T_EQ_INT(sstore_create(100, &st), RET_OK);
    sstore_register(st, 1, 5, 100, &existed);              /* expire_at = 105 */
    sstore_register(st, 2, 50, 100, &existed);

    T_EQ_INT(sstore_sweep(st, 104, &closing, &removed), RET_OK);
    T_EQ_INT(closing, 0);  T_EQ_INT(removed, 0);           /* 한 칸 전 */
    T_EQ_INT(sstore_sweep(st, 105, &closing, &removed), RET_OK);
    T_EQ_INT(closing, 1);  T_EQ_INT(removed, 0);           /* 정확히 만료 시각 */
    T_EQ_INT(sstore_state(st, 1, &s), RET_OK);
    T_EQ_INT(s, SS_CLOSING);
    T_EQ_INT(sstore_active(st), 1);
    T_EQ_INT(sstore_total(st), 2);                         /* 정원은 CLOSING 도 센다 */

    T_EQ_INT(sstore_touch(st, 1, 30, 105), RET_NOT_FOUND); /* CLOSING 은 연장되지 않는다 */
    T_EQ_INT(sstore_sweep(st, 105, &closing, &removed), RET_OK);
    T_EQ_INT(removed, 0);                                  /* closing_at = 106 */
    T_EQ_INT(sstore_sweep(st, 106, &closing, &removed), RET_OK);
    T_EQ_INT(removed, 1);
    T_EQ_INT(sstore_state(st, 1, &s), RET_NOT_FOUND);

    sstore_register(st, 3, 5, 200, &existed);              /* CLOSING 을 REGISTER 로 되살린다 */
    sstore_sweep(st, 205, &closing, &removed);
    T_EQ_INT(sstore_register(st, 3, 30, 205, &existed), RET_OK);
    T_EQ_INT(existed, 1);
    T_EQ_INT(sstore_state(st, 3, &s), RET_OK);
    T_EQ_INT(s, SS_ACTIVE);
    sstore_destroy(st);
}

static void test_null(void)
{
    sstore_t *st = NULL;
    bool      e = false;
    size_t    a = 0, b = 0;

    T_EQ_INT(sstore_create(0, &st), RET_INVALID_ARG);
    T_EQ_INT(st == NULL, 1);                               /* ★ 실패하면 NULL */
    T_EQ_INT(sstore_create(10, NULL), RET_INVALID_ARG);
    T_EQ_INT(sstore_register(NULL, 1, 30, 0, &e), RET_INVALID_ARG);
    T_EQ_INT(sstore_touch(NULL, 1, 30, 0), RET_INVALID_ARG);
    T_EQ_INT(sstore_remove(NULL, 1), RET_INVALID_ARG);
    T_EQ_INT(sstore_sweep(NULL, 0, &a, &b), RET_INVALID_ARG);
    sstore_destroy(NULL);                                  /* 죽지 않으면 통과 */
}

/* 실패 주입: 객체 → 노드 하나씩 할당하는 경로에서 N번째가 실패해도 누수가 없다 */
static void test_alloc_fail_all(void)
{
    int k = 0;

    for (k = 0; k < 12; k++) {
        sstore_t *st = NULL;
        bool      e = false;
        int       i = 0;

        g_alloc_fail_at = k;
        g_alloc_count   = 0;
        if (sstore_create(8, &st) == RET_OK) {
            for (i = 1; i <= 5; i++) {
                int ret = sstore_register(st, (uint32_t)i, 30, 100, &e);
                T_EQ_INT(ret == RET_OK || ret == RET_NO_MEM, 1);
            }
        }
        sstore_destroy(st);                                 /* NULL 이어도 안전 */
    }
    g_alloc_fail_at = -1;
}

int main(void)
{
    test_basic();
    test_capacity();
    test_collision();
    test_sweep();
    test_null();
    test_alloc_fail_all();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

**단위 시험 — `test_handler.c`**

```c
#include <pthread.h>
#include <stdatomic.h>
#include "session.h"
#include "handler.h"
#include "stats.h"

static void body(msg_body_t *b, uint32_t sid, int ttl)
{
    memset(b, 0x00, sizeof(*b));
    b->session_id = sid;  b->has_session_id = true;
    if (ttl >= 0) { b->ttl = (uint16_t)ttl;  b->has_ttl = true; }
}

static void test_flow(void)
{
    sstore_t   *st = NULL;
    msg_body_t  b;
    uint8_t     rt = 0, cause = 99;

    T_EQ_INT(sstore_create(10, &st), RET_OK);

    body(&b, 1, -1);
    T_EQ_INT(handle_msg(st, 1, &b, 30, 100, &rt, &cause), RET_OK);       /* REGISTER */
    T_EQ_INT(rt, 17);   T_EQ_INT(cause, 0);
    T_EQ_INT(handle_msg(st, 1, &b, 30, 100, &rt, &cause), RET_OK);       /* 중복 */
    T_EQ_INT(cause, 1);
    T_EQ_INT(sstore_active(st), 1);                                      /* ★ 세션 1개 유지 */

    T_EQ_INT(handle_msg(st, 2, &b, 30, 110, &rt, &cause), RET_OK);       /* UPDATE */
    T_EQ_INT(rt, 18);   T_EQ_INT(cause, 0);
    T_EQ_INT(handle_msg(st, 4, &b, 30, 110, &rt, &cause), RET_OK);       /* HEARTBEAT */
    T_EQ_INT(rt, 20);   T_EQ_INT(cause, 0);

    body(&b, 9, -1);
    T_EQ_INT(handle_msg(st, 2, &b, 30, 110, &rt, &cause), RET_OK);       /* 없는 세션 */
    T_EQ_INT(cause, 4);
    T_EQ_INT(handle_msg(st, 3, &b, 30, 110, &rt, &cause), RET_OK);       /* DEREGISTER: 없음 */
    T_EQ_INT(rt, 19);   T_EQ_INT(cause, 4);

    body(&b, 1, -1);
    T_EQ_INT(handle_msg(st, 3, &b, 30, 110, &rt, &cause), RET_OK);       /* DEREGISTER: 정상 */
    T_EQ_INT(cause, 0);
    T_EQ_INT(sstore_active(st), 0);
    sstore_destroy(st);
}

static void test_ttl_and_limits(void)
{
    sstore_t   *st = NULL;
    msg_body_t  b;
    uint8_t     rt = 0, cause = 0;

    T_EQ_INT(sstore_create(3, &st), RET_OK);

    body(&b, 1, 4);    T_EQ_INT(handle_msg(st, 1, &b, 30, 0, &rt, &cause), RET_BAD_FORMAT);   /* 하한 -1 */
    body(&b, 1, 5);    T_EQ_INT(handle_msg(st, 1, &b, 30, 0, &rt, &cause), RET_OK);           /* 하한 */
    body(&b, 2, 3600); T_EQ_INT(handle_msg(st, 1, &b, 30, 0, &rt, &cause), RET_OK);           /* 상한 */
    body(&b, 3, 3601); T_EQ_INT(handle_msg(st, 1, &b, 30, 0, &rt, &cause), RET_BAD_FORMAT);   /* 상한 +1 */
    body(&b, 3, -1);   T_EQ_INT(handle_msg(st, 1, &b, 2, 0, &rt, &cause), RET_BAD_FORMAT);    /* default_ttl 도 범위 검사 */
    body(&b, 3, 4);    T_EQ_INT(handle_msg(st, 3, &b, 30, 0, &rt, &cause), RET_OK);           /* DEREGISTER 는 ttl 무시 */

    body(&b, 3, -1);   T_EQ_INT(handle_msg(st, 1, &b, 30, 0, &rt, &cause), RET_OK);
    body(&b, 4, -1);                                                                          /* 정원 3: 1, 2, 3 이 찼다 */
    T_EQ_INT(handle_msg(st, 1, &b, 30, 0, &rt, &cause), RET_OK);
    T_EQ_INT(cause, 6);                                                                       /* NO_RESOURCE */
    T_EQ_INT(sstore_total(st), 3);                                                            /* 늘지 않았다 */

    body(&b, 1, -1);
    T_EQ_INT(handle_msg(st, 77, &b, 30, 0, &rt, &cause), RET_NOT_SUPPORTED);                  /* 모르는 Type */
    memset(&b, 0x00, sizeof(b));
    T_EQ_INT(handle_msg(st, 1, &b, 30, 0, &rt, &cause), RET_INVALID_ARG);                     /* SessionId 없음 */
    T_EQ_INT(handle_msg(NULL, 1, &b, 30, 0, &rt, &cause), RET_INVALID_ARG);
    T_EQ_INT(handle_msg(st, 1, NULL, 30, 0, &rt, &cause), RET_INVALID_ARG);
    T_EQ_INT(handle_msg(st, 1, &b, 30, 0, NULL, &cause), RET_INVALID_ARG);
    sstore_destroy(st);
}

static stats_t g_stats;

static void *bump(void *arg)
{
    int i = 0;
    (void)arg;
    for (i = 0; i < 10000; i++) { atomic_fetch_add(&g_stats.rx, 1);  atomic_fetch_add(&g_stats.tx, 1); }
    return NULL;
}

static void test_stats(void)
{
    stats_t   s;
    char      buf[96];
    pthread_t t[4];
    int       i = 0;

    stats_init(&s);
    atomic_store(&s.rx, 10);  atomic_store(&s.tx, 8);
    atomic_store(&s.drop, 2); atomic_store(&s.expired, 1);
    T_EQ_INT(stats_format(&s, 3, buf, sizeof(buf)), RET_OK);
    T_EQ_STR(buf, "active=3 expired=1 rx=10 tx=8 drop=2");
    T_EQ_INT(stats_format(&s, 3, buf, 10), RET_TOO_SMALL);
    T_EQ_INT(stats_format(NULL, 3, buf, sizeof(buf)), RET_INVALID_ARG);

    stats_init(&g_stats);
    for (i = 0; i < 4; i++) pthread_create(&t[i], NULL, bump, NULL);
    for (i = 0; i < 4; i++) pthread_join(t[i], NULL);
    T_EQ_INT(atomic_load(&g_stats.rx), 40000);                            /* ★ 락 없이도 유실 없음 */
    T_EQ_INT(atomic_load(&g_stats.tx), 40000);
}

int main(void)
{
    test_flow();
    test_ttl_and_limits();
    test_stats();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

**인수 시험 1 ~ 7 — `accept.sh`**

| # | 시험 | 방법 | 통과 기준 |
| :--- | :--- | :--- | :--- |
| 1 | 정상 등록·갱신·해제 | 클라이언트 스크립트 | 응답 Cause=0, 응답 Type=요청+16 |
| 2 | 중복 등록 | REGISTER 2회 | 두 번째 `Cause=1`, 세션 1개 유지 |
| 3 | 없는 세션 갱신 | UPDATE | `Cause=4`, 크래시 없음 |
| 4 | **자동 만료** | ttl=5 등록 후 대기 | 5~7초 사이 만료 로그 1줄 |
| 5 | **쓰레기 입력** | 무작위 바이트 1000개 | 전부 drop + WRN, 프로세스 생존 |
| 6 | **정원 초과** | `session_max=100` 으로 101번째 등록 | `Cause=6`, 메모리 증가 없음 |
| 7 | **graceful shutdown** | 부하 중 SIGTERM | 5초 내 exit 0, **누수 0**, **`rx == tx + drop`** (큐 유실 0) |
| 8 | **30분 연속 부하** | 초당 10k | RSS 증가 없음(±1MB) — `soak.sh` |

```bash
#!/usr/bin/env bash
# d9/test/accept.sh — 세션 데몬 인수 시험 1~7
# 사용법:  bash d9/test/accept.sh <데몬 실행파일>
# 필요한 것: bash 5 (EPOCHREALTIME, /dev/udp), timeout, od

BIN="$1"
PORT="${PORT:-19100}"
W="$(mktemp -d)"
trap 'kill $(jobs -p) 2>/dev/null; rm -rf "$W"' EXIT

pass=0; fail=0
check()   { local m="$1"; shift; if "$@"; then echo "  ok  $m"; pass=$((pass+1)); else echo "  X   $m"; fail=$((fail+1)); fi; }
eq()      { [ "$1" = "$2" ]; }
count()   { grep -c "$1" "$W/log" || true; }
no_asan() { ! grep -qE 'AddressSanitizer|LeakSanitizer|runtime error' "$W/log"; }
now_ms()  { local t=${EPOCHREALTIME/./}; echo $(( t / 1000 )); }

# ── D4 메시지를 만든다 (헤더 12 + body + 체크섬 2) ─────────────────
csum() {                                           # 16진수 문자열 → 인터넷 체크섬(4자리 16진수)
    local h="$1" sum=0 i
    (( ${#h} % 4 )) && h="${h}00"
    for ((i = 0; i < ${#h}; i += 4)); do sum=$(( sum + 0x${h:i:4} )); done
    while (( sum >> 16 )); do sum=$(( (sum & 0xFFFF) + (sum >> 16) )); done
    printf '%04x' $(( ~sum & 0xFFFF ))
}
mkmsg() {                                          # mkmsg <type> <session 8hex> <body hex>  → printf 용 \x 문자열
    local type=$1 sid=$2 body=$3 plen=$(( ${#3} / 2 )) all cs
    all="$(printf '%02x' $(( (1 << 5) | type )))00$(printf '%04x' $plen)${sid}00000000${body}"
    cs=$(csum "$all")
    echo "${all}${cs}" | sed 's/../\\x&/g'
}
req() { mkmsg "$1" "$2" "0104$2${3:-}"; }          # req <type> <sid> [추가 IE hex]
TTL5="40020005"

rpc() {                                            # rpc <printf 문자열> → 응답 hex (최대 1초)
    exec 3<>/dev/udp/127.0.0.1/$PORT
    printf "$1" >&3
    timeout 1 dd bs=128 count=1 <&3 2>/dev/null | od -An -v -tx1 | tr -d ' \n'
    exec 3>&-
}
rtype()  { echo $(( 0x${1:0:2} & 31 )); }          # 응답 Type
rcause() { echo "${1:40:2}"; }                     # 응답 body: 0104 <sid 8> 0201 <cause 2>

mkcfg() {                                          # mkcfg <worker> <session_max> <default_ttl>
    printf 'listen_port=%s\nworker_num=%s\nlog_level=INF\nsession_max=%s\ndefault_ttl=%s\n' \
           "$PORT" "${1:-4}" "${2:-10000}" "${3:-30}" > "$W/d.cfg"
}
start()  { "$BIN" "$W/d.cfg" 2> "$W/log" & PID=$!; sleep 0.5; }
wait_exit() {                                      # wait_exit <최대 초> → RC
    local i
    for ((i = 0; i < $1 * 10; i++)); do kill -0 $PID 2>/dev/null || break; sleep 0.1; done
    if kill -0 $PID 2>/dev/null; then RC=timeout; kill -9 $PID; wait $PID 2>/dev/null
    else wait $PID; RC=$?; fi
}
rss_kb() { ps -o rss= -p $PID | tr -d ' '; }

echo "1. 정상 등록·갱신·해제"
mkcfg; start
r=$(rpc "$(req 1 00000001 $TTL5)");  check "REGISTER → Type 17, Cause 0" eq "$(rtype "$r") $(rcause "$r")" "17 00"
r=$(rpc "$(req 2 00000001 $TTL5)");  check "UPDATE → Type 18, Cause 0"   eq "$(rtype "$r") $(rcause "$r")" "18 00"
r=$(rpc "$(req 4 00000001)");        check "HEARTBEAT → Type 20, Cause 0" eq "$(rtype "$r") $(rcause "$r")" "20 00"
r=$(rpc "$(req 3 00000001)");        check "DEREGISTER → Type 19, Cause 0" eq "$(rtype "$r") $(rcause "$r")" "19 00"

echo "2. 중복 등록"
r=$(rpc "$(req 1 00000002 $TTL5)");  check "첫 REGISTER Cause 0" eq "$(rcause "$r")" 00
r=$(rpc "$(req 1 00000002 $TTL5)");  check "두 번째 Cause 1"     eq "$(rcause "$r")" 01

echo "3. 없는 세션 갱신"
r=$(rpc "$(req 2 000000ff)");        check "UPDATE Cause 4" eq "$(rcause "$r")" 04
check "프로세스 생존" kill -0 $PID
kill -TERM $PID; wait_exit 5

echo "4. 자동 만료 (ttl=5)"
mkcfg; start
t0=$(now_ms); rpc "$(req 1 00000010 $TTL5)" >/dev/null
for ((i = 0; i < 100; i++)); do [ "$(count 'expired session=16')" -ge 1 ] && break; sleep 0.1; done
el=$(( $(now_ms) - t0 ))
check "만료 로그 1줄" eq "$(count 'expired session=16')" 1
check "5~7초 사이 (${el}ms)" test "$el" -ge 5000 -a "$el" -le 7500
kill -TERM $PID; wait_exit 5

echo "5. 쓰레기 입력 1000개"
mkcfg; start
for i in $(seq 1 1000); do head -c $((RANDOM % 64)) /dev/urandom > /dev/udp/127.0.0.1/$PORT 2>/dev/null; done
sleep 1.5
check "프로세스 생존" kill -0 $PID
check "drop 이 500 이상 (UDP 손실 여유)" test "$(grep -o 'drop=[0-9]*' "$W/log" | tail -1 | cut -d= -f2)" -ge 500
check "WRN 로그" test "$(count 'WRN')" -ge 1
r=$(rpc "$(req 1 00000020 $TTL5)"); check "이후 정상 요청은 처리됨" eq "$(rcause "$r")" 00
kill -TERM $PID; wait_exit 5

echo "6. 정원 초과 (session_max=100)"
mkcfg 4 100; start
ok=0
for i in $(seq 1 100); do r=$(rpc "$(req 1 $(printf '%08x' $i) $TTL5)"); [ "$(rcause "$r")" = 00 ] && ok=$((ok+1)); done
check "100개까지 Cause 0 ($ok)" eq "$ok" 100
r=$(rpc "$(req 1 000000c9 $TTL5)"); check "101번째 Cause 6" eq "$(rcause "$r")" 06
before=$(rss_kb)
for i in $(seq 1000 2000); do rpc "$(req 1 $(printf '%08x' $i) $TTL5)" >/dev/null; done
after=$(rss_kb)
check "RSS 증가 1MB 이하 (${before}KB → ${after}KB)" test $(( after - before )) -le 1024
kill -TERM $PID; wait_exit 5

echo "7. graceful shutdown (부하 중 SIGTERM)"
mkcfg; start
( for i in $(seq 1 3000); do printf "$(req 1 $(printf '%08x' $i) $TTL5)" > /dev/udp/127.0.0.1/$PORT 2>/dev/null; done ) & LOAD=$!
sleep 0.5; t0=$SECONDS; kill -TERM $PID; wait_exit 5; wait $LOAD 2>/dev/null
last=$(grep -E 'active=[0-9]+ expired=[0-9]+ rx=[0-9]+' "$W/log" | tail -1)
rx=$(echo "$last" | grep -o 'rx=[0-9]*' | cut -d= -f2); tx=$(echo "$last" | grep -o 'tx=[0-9]*' | cut -d= -f2)
dr=$(echo "$last" | grep -o 'drop=[0-9]*' | cut -d= -f2)
check "exit 0" eq "$RC" 0
check "5초 이내" test $((SECONDS - t0)) -le 6
check "rx == tx + drop (큐 유실 0): $rx / $tx / $dr" eq "$rx" "$(( tx + dr ))"
check "ASan 리포트 없음" no_asan

echo "pass=$pass fail=$fail"
if [ "$fail" -eq 0 ]; then echo PASS; else echo "FAIL $fail"; exit 1; fi
```

**인수 시험 8 — 30분 부하 (`soak.sh`, `soak_load.py`)**

```bash
#!/usr/bin/env bash
# d9/test/soak.sh — 30분 연속 부하에서 RSS 가 늘지 않는지 본다
# 사용법:  bash d9/test/soak.sh <데몬 실행파일> [분=30]
BIN="$1"; MIN="${2:-30}"; PORT=19200
W="$(mktemp -d)"; trap 'kill $(jobs -p) 2>/dev/null; rm -rf "$W"' EXIT

printf 'listen_port=%s\nworker_num=4\nlog_level=WRN\nsession_max=10000\ndefault_ttl=30\n' "$PORT" > "$W/d.cfg"
"$BIN" "$W/d.cfg" 2> "$W/log" & PID=$!
sleep 1
python3 "$(dirname "$0")/soak_load.py" "$PORT" $((MIN * 60)) & LOAD=$!

first=""; last=""
for ((m = 1; m <= MIN; m++)); do
    sleep 60
    kill -0 $PID 2>/dev/null || { echo "X 데몬이 죽었다 (${m}분)"; exit 1; }
    rss=$(ps -o rss= -p $PID | tr -d ' ')
    echo "${m}분  RSS=${rss}KB"
    [ "$m" -eq 2 ] && first=$rss                   # 워밍업 2분 뒤를 기준으로 삼는다
    last=$rss
done
wait $LOAD 2>/dev/null
kill -TERM $PID; wait $PID; RC=$?
echo "기준 ${first}KB → 마지막 ${last}KB (exit=$RC)"
[ $(( last - first )) -le 1024 ] && [ "$RC" = 0 ] && echo PASS || { echo FAIL; exit 1; }
```

```python
#!/usr/bin/env python3
# d9/test/soak_load.py — 초당 10,000 메시지 (REGISTER / UPDATE / DEREGISTER / HEARTBEAT 섞어서)
import random, socket, struct, sys, time

def csum(b):
    if len(b) % 2: b += b"\x00"
    s = sum(struct.unpack(">%dH" % (len(b) // 2), b))
    while s >> 16: s = (s & 0xFFFF) + (s >> 16)
    return (~s) & 0xFFFF

def mk(typ, sid, body):
    h = struct.pack(">BBHI", (1 << 5) | typ, 0, len(body), sid) + b"\x00\x00\x00" + b"\x00"
    m = h + body
    return m + struct.pack(">H", csum(m))

port, dur = int(sys.argv[1]), int(sys.argv[2])
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
end = time.time() + dur
while time.time() < end:
    t0 = time.time()
    for _ in range(1000):                            # 100ms 에 1000개 = 초당 10,000
        sid = random.randint(1, 5000)
        body = b"\x01\x04" + struct.pack(">I", sid)
        typ = random.choice((1, 1, 2, 3, 4))
        if typ in (1, 2): body += b"\x40\x02" + struct.pack(">H", 30)
        s.sendto(mk(typ, sid, body), ("127.0.0.1", port))
    dt = time.time() - t0
    if dt < 0.1: time.sleep(0.1 - dt)
```

> [!IMPORTANT] 8번이 진짜 시험이다
> 기능은 대부분 첫날에 된다.
> **30분 돌렸을 때 메모리가 안 늘어나는지**가 실무와 습작을 가른다.
> RSS 가 우상향하면 **해제 경로 하나가 빠진 것**이다.
> 실패 주입 시험(`test_alloc_fail_all`)으로 찾는다.

### 3-B. 변형 B 시험 — 저널·집계

```c
#include <sys/stat.h>
#include "journal.h"
#include "agg.h"

static long fsize(const char *path) { struct stat st; return stat(path, &st) == 0 ? (long)st.st_size : -1; }

static void fill(jrec_t *r, int kind, uint32_t sid, uint64_t ts)      /* 필드 단위 대입 (union 통째 복사 금지) */
{
    r->kind = kind;
    if (kind == JK_START)   { r->u.start.session_id = sid;   r->u.start.ts_ms = ts; }
    if (kind == JK_INTERIM) { r->u.interim.session_id = sid; r->u.interim.ts_ms = ts; r->u.interim.bytes_delta = 1000; }
    if (kind == JK_STOP)    { r->u.stop.session_id = sid;    r->u.stop.ts_ms = ts;
                              r->u.stop.bytes_total = 5000;  r->u.stop.reason = 2; }
}

static void make(jrec_t *r, int kind, uint32_t sid, uint64_t ts)
{
    memset(r, 0x00, sizeof(*r));
    fill(r, kind, sid, ts);
}

static void test_vector(void)                                  /* 바이트 정확도: 손으로 계산한 기대값 */
{
    jrec_t  r;
    uint8_t buf[64];
    size_t  n = 0;
    /* 'J' '1' kind=1 len=0x000C sid=00000001 ts=0102030405060708
     * 체크섬 = ~(4A31+0100+0C00+0000+0101+0203+0405+0607+0800) = ~6C41 = 93BE */
    const uint8_t exp[19] = { 0x4A, 0x31, 0x01, 0x00, 0x0C, 0x00, 0x00, 0x00, 0x01,
                              0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x93, 0xBE };

    make(&r, JK_START, 1, 0x0102030405060708ULL);
    T_EQ_INT(jrec_pack(&r, buf, sizeof(buf), &n), RET_OK);
    T_EQ_INT(n, 19);
    T_EQ_BYTES(buf, exp, 19);
}

static void test_roundtrip(void)
{
    int kind = 0;

    for (kind = JK_START; kind <= JK_STOP; kind++) {
        jrec_t  a, b, g;
        uint8_t p1[64], p2[64];
        size_t  n1 = 0, n2 = 0, used = 0;

        make(&a, kind, 7, 123456789ULL);
        T_EQ_INT(jrec_pack(&a, p1, sizeof(p1), &n1), RET_OK);
        T_EQ_INT(jrec_unpack(p1, n1, &b, &used), RET_OK);
        T_EQ_INT(used, n1);
        T_EQ_INT(b.kind, kind);

        memset(&g, 0xAA, sizeof(g));                           /* ★ 쓰레기로 채운 구조체에서 */
        fill(&g, kind, 7, 123456789ULL);                       /*   kind 의 필드만 대입해도 결과가 같다 */
        T_EQ_INT(jrec_pack(&g, p2, sizeof(p2), &n2), RET_OK);
        T_EQ_INT(n1 == n2 && memcmp(p1, p2, n1) == 0, 1);
    }
}

static void test_unpack_errors(void)
{
    jrec_t  r, o;
    uint8_t buf[64];
    size_t  n = 0, used = 0, cut = 0;

    make(&r, JK_STOP, 1, 1);
    T_EQ_INT(jrec_pack(&r, buf, sizeof(buf), &n), RET_OK);

    for (cut = 0; cut < n; cut++) T_EQ_INT(jrec_unpack(buf, cut, &o, &used), RET_TOO_SMALL);   /* 자르기 */
    buf[n - 1] ^= 0x01;
    T_EQ_INT(jrec_unpack(buf, n, &o, &used), RET_BAD_FORMAT);                                  /* 체크섬 */
    buf[n - 1] ^= 0x01;
    buf[0] = 'X';
    T_EQ_INT(jrec_unpack(buf, n, &o, &used), RET_BAD_FORMAT);                                  /* magic */
    buf[0] = 'J';
    buf[2] = 9;
    T_EQ_INT(jrec_unpack(buf, n, &o, &used), RET_BAD_FORMAT);                                  /* 모르는 kind */
    buf[2] = JK_STOP;  buf[4] = 0x0C;
    T_EQ_INT(jrec_unpack(buf, n, &o, &used), RET_BAD_FORMAT);                                  /* kind 와 len 불일치 */

    memset(&r, 0x00, sizeof(r));                                                                /* kind == NONE */
    T_EQ_INT(jrec_pack(&r, buf, sizeof(buf), &n), RET_INVALID_ARG);
    make(&r, JK_STOP, 1, 1);
    T_EQ_INT(jrec_pack(&r, buf, 10, &n), RET_TOO_SMALL);
    T_EQ_INT(n, 0);
    T_EQ_INT(jrec_pack(NULL, buf, sizeof(buf), &n), RET_INVALID_ARG);
}

static int count_cb(const jrec_t *r, void *ud) { (void)r; (*(size_t *)ud)++; return RET_OK; }

static void test_recovery(void)
{
    const char *path = "build/t_journal.bin";
    journal_t  *j = NULL;
    jrec_t      r;
    uint8_t     buf[64];
    size_t      n = 0, end = 0, good = 0;
    FILE       *fp = NULL;

    remove(path);
    T_EQ_INT(journal_open(path, &j), RET_OK);
    make(&r, JK_START, 1, 1000);    T_EQ_INT(journal_append(j, &r), RET_OK);
    make(&r, JK_INTERIM, 1, 2000);  T_EQ_INT(journal_append(j, &r), RET_OK);
    make(&r, JK_STOP, 1, 3000);     T_EQ_INT(journal_append(j, &r), RET_OK);
    journal_close(j);
    good = (size_t)fsize(path);

    make(&r, JK_START, 2, 4000);                                /* 꼬리에 '반쯤 쓴' 레코드를 붙인다 */
    jrec_pack(&r, buf, sizeof(buf), &n);
    fp = fopen(path, "ab");  fwrite(buf, 1, n / 2, fp);  fclose(fp);
    T_EQ_INT(fsize(path) > (long)good, 1);

    {
        size_t cnt = 0, nok = 0;
        T_EQ_INT(journal_replay(path, count_cb, &cnt, &nok, &end), RET_OK);
        T_EQ_INT(nok, 3);
        T_EQ_INT(cnt, 3);
        T_EQ_INT(end, good);                                    /* ★ 유효한 끝 = 3번째 레코드 끝 */
    }

    T_EQ_INT(journal_open(path, &j), RET_OK);                   /* 재기동: 깨진 꼬리를 잘라낸다 */
    T_EQ_INT(fsize(path), (long)good);
    make(&r, JK_START, 3, 5000);
    T_EQ_INT(journal_append(j, &r), RET_OK);                    /* 이어서 쓴다 */
    journal_close(j);
    {
        size_t cnt = 0, nok = 0;
        journal_replay(path, count_cb, &cnt, &nok, &end);
        T_EQ_INT(nok, 4);
    }
}

static void test_lock_and_null(void)
{
    const char *path = "build/t_journal2.bin";
    journal_t  *a = NULL, *b = NULL;
    jrec_t      r;

    remove(path);
    T_EQ_INT(journal_open(path, &a), RET_OK);
    T_EQ_INT(journal_open(path, &b), RET_FAIL);                 /* ★ 두 번째 인스턴스는 거절 */
    T_EQ_INT(b == NULL, 1);
    journal_close(a);
    T_EQ_INT(journal_open(path, &b), RET_OK);                   /* 닫으면 다시 열 수 있다 */
    journal_close(b);

    T_EQ_INT(journal_open("build/no_dir/x.bin", &a), RET_IO_ERROR);
    T_EQ_INT(a == NULL, 1);
    T_EQ_INT(journal_open(NULL, &a), RET_INVALID_ARG);
    T_EQ_INT(journal_append(NULL, &r), RET_INVALID_ARG);
    journal_close(NULL);
}

static void test_agg(void)
{
    agg_t     a;
    agg_win_t w;
    jrec_t    r;

    agg_init(&a);
    make(&r, JK_START, 1, 299999);                T_EQ_INT(agg_feed(&a, &r), RET_OK);    /* 창 0 의 마지막 ms */
    make(&r, JK_INTERIM, 1, 300000);              T_EQ_INT(agg_feed(&a, &r), RET_OK);    /* 창 1 의 첫 ms */
    make(&r, JK_INTERIM, 1, 300001);              T_EQ_INT(agg_feed(&a, &r), RET_OK);
    make(&r, JK_STOP, 1, 600000);                 T_EQ_INT(agg_feed(&a, &r), RET_OK);    /* 창 2 */

    T_EQ_INT(agg_get(&a, 0, &w), RET_OK);  T_EQ_INT(w.starts, 1);  T_EQ_INT(w.stops, 0);  T_EQ_INT(w.bytes, 0);
    T_EQ_INT(agg_get(&a, 1, &w), RET_OK);  T_EQ_INT(w.starts, 0);  T_EQ_INT(w.bytes, 2000);   /* INTERIM 두 번 */
    T_EQ_INT(agg_get(&a, 2, &w), RET_OK);  T_EQ_INT(w.stops, 1);   T_EQ_INT(w.bytes, 0);      /* STOP 의 total 은 합산하지 않는다 */
    T_EQ_INT(agg_get(&a, 9, &w), RET_NOT_FOUND);
    T_EQ_INT(agg_feed(NULL, &r), RET_INVALID_ARG);
}

int main(void)
{
    test_vector();
    test_roundtrip();
    test_unpack_errors();
    test_recovery();
    test_lock_and_null();
    test_agg();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

**복구 시나리오 — `accept_b.sh` (요약)**

| # | 시나리오 | 방법 | 통과 기준 |
| :--- | :--- | :--- | :--- |
| B-1 | 정상 | START / INTERIM / STOP 3종을 TCP 로 전송 | 저널에 3레코드, 창 로그에 `starts=1 stops=1 bytes=<INTERIM 합>` |
| B-2 | **kill -9 후 재기동** | 100건 전송 → `kill -9` → 재기동 | `recovered records=100`, 집계가 이어진다 |
| B-3 | **저널 꼬리 오염** | 저널 끝에 쓰레기 7바이트를 붙이고 재기동 | `recovered records=<원래 수>`, 파일이 원래 크기로 잘림 |
| B-4 | **중복 기동 거절** | 같은 `journal_path` 로 두 번째 인스턴스 | **exit 4**, 첫 인스턴스는 계속 산다 |
| B-5 | graceful | 부하 중 SIGTERM | exit 0, 누수 0, 마지막 레코드까지 저널에 있다 |

```bash
# B-2 의 핵심 부분
bash d9/test/send_tcp.sh 100 START      # 100건 전송 (D7 의 TCP 클라이언트와 같은 방식)
kill -9 $PID; wait $PID 2>/dev/null
./build/d9_billing "$W/d.cfg" 2> "$W/log2" & PID=$!; sleep 0.5
grep -q 'recovered records=100' "$W/log2" && echo "ok  복구" || echo "X   복구"
```

### 3-C. 변형 C 시험 — 슬롯과 릴레이

**단위 시험 — `test_rslots.c`**

```c
#include "rslots.h"

typedef struct { int retry, timeout; uint32_t last_sid; size_t last_len; } cnt_t;

static int on_retry(uint32_t sid, uint32_t seq, const uint8_t *msg, size_t len, void *ud)
{ cnt_t *c = (cnt_t *)ud; (void)seq; (void)msg; c->retry++; c->last_sid = sid; c->last_len = len; return RET_OK; }
static int on_timeout(uint32_t sid, uint32_t seq, const uint8_t *msg, size_t len, void *ud)
{ cnt_t *c = (cnt_t *)ud; (void)seq; (void)msg; (void)len; c->timeout++; c->last_sid = sid; return RET_OK; }

static void test_basic(void)
{
    rslots_t     *rs = NULL;
    const uint8_t m[5] = { 1, 2, 3, 4, 5 };

    T_EQ_INT(rslots_create(4, &rs), RET_OK);
    T_EQ_INT(rslot_checkin(rs, 1, 10, m, sizeof(m), 1000), RET_OK);
    T_EQ_INT(rslot_checkin(rs, 1, 10, m, sizeof(m), 1000), RET_FAIL);        /* 같은 키 */
    T_EQ_INT(rslot_checkin(rs, 1, 11, m, sizeof(m), 1000), RET_OK);           /* seq 가 다르면 다른 키 */
    T_EQ_INT(rslot_checkout(rs, 1, 10), RET_OK);
    T_EQ_INT(rslot_checkout(rs, 1, 10), RET_NOT_FOUND);                       /* ★ 두 번째는 '늦은 응답' */
    T_EQ_INT(rslot_checkout(rs, 9, 9), RET_NOT_FOUND);
    rslots_destroy(rs);
}

static void test_capacity_and_copy(void)
{
    rslots_t *rs = NULL;
    uint8_t   m[5] = { 1, 2, 3, 4, 5 };
    cnt_t     c;
    uint32_t  i = 0;

    T_EQ_INT(rslots_create(4, &rs), RET_OK);
    for (i = 0; i < 4; i++) T_EQ_INT(rslot_checkin(rs, i, 0, m, sizeof(m), 0), RET_OK);
    T_EQ_INT(rslot_checkin(rs, 99, 0, m, sizeof(m), 0), RET_TOO_SMALL);       /* 한 칸 초과 */
    T_EQ_INT(rslot_checkout(rs, 2, 0), RET_OK);
    T_EQ_INT(rslot_checkin(rs, 99, 0, m, sizeof(m), 0), RET_OK);              /* 자리가 나면 받는다 */

    memset(m, 0xFF, sizeof(m));                                               /* ★ 원문을 복사해 뒀다 */
    memset(&c, 0x00, sizeof(c));
    rslots_due(rs, 1000, 500, on_retry, on_timeout, &c);
    T_EQ_INT(c.retry, 4);
    T_EQ_INT(c.last_len, 5);
    rslots_destroy(rs);
}

static void test_due(void)
{
    rslots_t     *rs = NULL;
    const uint8_t m[3] = { 7, 8, 9 };
    cnt_t         c;

    memset(&c, 0x00, sizeof(c));
    T_EQ_INT(rslots_create(4, &rs), RET_OK);
    rslot_checkin(rs, 1, 1, m, sizeof(m), 1000);

    rslots_due(rs, 1499, 500, on_retry, on_timeout, &c);                      /* 한 칸 전 */
    T_EQ_INT(c.retry, 0);  T_EQ_INT(c.timeout, 0);
    rslots_due(rs, 1500, 500, on_retry, on_timeout, &c);                      /* 정확히 timeout */
    T_EQ_INT(c.retry, 1);  T_EQ_INT(c.timeout, 0);                            /* 첫 만료: 재전송 */
    rslots_due(rs, 1999, 500, on_retry, on_timeout, &c);                      /* 시각이 갱신됐으므로 아직 */
    T_EQ_INT(c.retry, 1);  T_EQ_INT(c.timeout, 0);
    rslots_due(rs, 2000, 500, on_retry, on_timeout, &c);
    T_EQ_INT(c.retry, 1);  T_EQ_INT(c.timeout, 1);                            /* ★ 두 번째 만료: 포기 */
    rslots_due(rs, 9999, 500, on_retry, on_timeout, &c);
    T_EQ_INT(c.timeout, 1);                                                   /* 슬롯이 사라졌다 (한 번만) */
    T_EQ_INT(rslot_checkout(rs, 1, 1), RET_NOT_FOUND);

    rslot_checkin(rs, 2, 2, m, sizeof(m), 5000);
    rslots_due(rs, 5600, 500, on_retry, on_timeout, &c);                      /* 재전송 뒤 */
    T_EQ_INT(rslot_checkout(rs, 2, 2), RET_OK);                               /* 응답이 오면 check-out */
    rslots_due(rs, 9999, 500, on_retry, on_timeout, &c);
    T_EQ_INT(c.timeout, 1);                                                   /* 만료되지 않는다 */
    rslots_destroy(rs);
}

static void test_null(void)
{
    rslots_t     *rs = NULL;
    const uint8_t m[1] = { 0 };

    T_EQ_INT(rslots_create(0, &rs), RET_INVALID_ARG);
    T_EQ_INT(rs == NULL, 1);                                                  /* ★ 실패하면 NULL */
    T_EQ_INT(rslots_create(4, NULL), RET_INVALID_ARG);
    T_EQ_INT(rslot_checkin(NULL, 1, 1, m, 1, 0), RET_INVALID_ARG);
    T_EQ_INT(rslot_checkout(NULL, 1, 1), RET_INVALID_ARG);
    rslots_destroy(NULL);
}

int main(void)
{
    test_basic();
    test_capacity_and_copy();
    test_due();
    test_null();

    printf(g_fail ? "FAIL %d\n" : "PASS\n", g_fail);
    return g_fail ? 1 : 0;
}
```

**릴레이 시나리오 — `relay_check.py`**

```python
#!/usr/bin/env python3
# d9/test/relay_check.py — 프로토콜 릴레이 시나리오 시험
# 사용법:  python3 d9/test/relay_check.py <릴레이 실행파일>
import os, signal, socket, struct, subprocess, sys, tempfile, threading, time

RELAY_PORT, UP_PORT, TIMEOUT_MS = 19300, 19301, 300

def csum(b):
    if len(b) % 2: b += b"\x00"
    s = sum(struct.unpack(">%dH" % (len(b) // 2), b))
    while s >> 16: s = (s & 0xFFFF) + (s >> 16)
    return (~s) & 0xFFFF

def mk(typ, sid, seq, payload=b"", flags=0):
    h = struct.pack(">BBHI", (1 << 5) | typ, flags, len(payload), sid) + seq.to_bytes(3, "big") + b"\x00"
    m = h + payload
    return m + struct.pack(">H", csum(m))

def read_msg(sock, timeout):
    sock.settimeout(timeout)
    buf = b""
    while len(buf) < 12: 
        d = sock.recv(12 - len(buf));  buf += d
        if not d: return None
    total = 12 + struct.unpack(">H", buf[2:4])[0] + 2
    while len(buf) < total:
        d = sock.recv(total - len(buf));  buf += d
        if not d: return None
    return buf

class Upstream(threading.Thread):
    """mode: echo (즉시 응답) / drop_first (같은 요청의 첫 사본은 무시) / silent (응답 없음)"""
    def __init__(self):
        super().__init__(daemon=True)
        self.mode, self.seen, self.recv_count = "echo", set(), 0
        self.srv = socket.socket(); self.srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.srv.bind(("127.0.0.1", UP_PORT)); self.srv.listen(1)
    def run(self):
        conn, _ = self.srv.accept()
        while True:
            try: m = read_msg(conn, 30)
            except Exception: return
            if m is None: return
            self.recv_count += 1
            typ, sid, seq = m[0] & 31, struct.unpack(">I", m[4:8])[0], int.from_bytes(m[8:11], "big")
            key = (sid, seq)
            if self.mode == "silent": continue
            if self.mode == "drop_first" and key not in self.seen:
                self.seen.add(key); continue
            conn.sendall(mk(typ + 16, sid, seq, m[12:-2]))

fails = 0
def check(msg, cond):
    global fails
    print(("  ok  " if cond else "  X   ") + msg)
    if not cond: fails += 1

up = Upstream(); up.start()
work = tempfile.mkdtemp()
cfg = os.path.join(work, "r.cfg")
open(cfg, "w").write("listen_port=%d\nupstream_port=%d\ntimeout_ms=%d\nlog_level=INF\n" % (RELAY_PORT, UP_PORT, TIMEOUT_MS))
log = open(os.path.join(work, "log"), "w")
relay = subprocess.Popen([sys.argv[1], cfg], stderr=log)
time.sleep(0.7)
cl = socket.create_connection(("127.0.0.1", RELAY_PORT))
def logtxt(): log.flush(); return open(os.path.join(work, "log")).read()

print("C-1 정상 중계")
up.mode = "echo"; cl.sendall(mk(1, 100, 1, b"hello"))
r = read_msg(cl, 2)
check("응답 Type = 17, payload 그대로", r is not None and (r[0] & 31) == 17 and r[12:-2] == b"hello")
check("fwd / resp 로그", "relay fwd session=100 seq=1" in logtxt() and "relay resp session=100 seq=1" in logtxt())

print("C-2 payload 원문 통과 (0x00, 0xFF 포함)")
blob = bytes(range(256)) + b"\x00" * 10 + b"\xff" * 10
cl.sendall(mk(1, 101, 2, blob)); r = read_msg(cl, 2)
check("바이트 그대로", r is not None and r[12:-2] == blob)

print("C-3 업스트림이 첫 사본을 놓친다 → 1회 재전송")
up.mode = "drop_first"; cl.sendall(mk(1, 102, 3, b"x")); r = read_msg(cl, 3)
check("재전송 뒤 응답이 온다", r is not None and (r[0] & 31) == 17)
check("retry 로그 정확히 1줄", logtxt().count("relay retry session=102 seq=3") == 1)

print("C-4 업스트림이 침묵 → 2×timeout 뒤 timeout 응답")
up.mode = "silent"; t0 = time.time(); cl.sendall(mk(1, 103, 4, b"y")); r = read_msg(cl, 3); el = time.time() - t0
check("flags b6 가 켜진 응답, payload 비어 있음", r is not None and (r[1] & 0x40) and r[12:-2] == b"")
check("2×timeout 근처 (%.2fs)" % el, 0.5 <= el <= 1.5)
check("retry 1줄 + timeout 1줄", logtxt().count("relay retry session=103") == 1 and logtxt().count("relay timeout session=103") == 1)

print("C-5 깨진 체크섬 → 전달되지 않고 프로세스는 산다")
before = up.recv_count; up.mode = "echo"
bad = bytearray(mk(1, 104, 5, b"z")); bad[-1] ^= 1
cl.sendall(bytes(bad)); time.sleep(0.4)
check("업스트림에 안 갔다", up.recv_count == before)
check("릴레이 생존", relay.poll() is None)
cl.sendall(mk(1, 105, 6, b"ok")); r = read_msg(cl, 2)
check("이후 정상 요청은 통과", r is not None and (r[0] & 31) == 17)

print("C-6 SIGTERM")
t0 = time.time(); relay.send_signal(signal.SIGTERM)
try: rc = relay.wait(6)
except subprocess.TimeoutExpired: relay.kill(); rc = "timeout"
check("exit 0, 5초 이내", rc == 0 and time.time() - t0 <= 5)
check("ASan 리포트 없음", not any(k in logtxt() for k in ("AddressSanitizer", "LeakSanitizer", "runtime error")))

print("FAIL %d" % fails if fails else "PASS")
sys.exit(1 if fails else 0)
```

### 3-D. 설계서 검사

D6 의 `check.sh` 로 설계서를 검사한다.

```bash
bash d6_design/check.sh d9/design.md C common d9/src
```

* 블록도 · sequence · ERD · flowchart · **상태도**가 모두 있어야 한다.
* 그림에 쓴 `RET_*`, 함수 이름이 **코드에 실제로 있어야** 한다.

### 3-1. 빌드와 실행 (Makefile, gcc)

Makefile 은 [README 의 공통 Makefile](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/README.md#공통%20Makefile) 을 `~/cdrill/Makefile` 로 쓴다.
`-DUNIT_TEST` 와 `-pthread` 가 이미 들어 있다.

```bash
# 변형 A — 단위 시험 (먼저)
make D=d9 V=session SRC="d9/src/session.c d9/test/test_session.c"
make D=d9 V=handler SRC="d9/src/session.c d9/src/handler.c d9/src/stats.c d9/src/tlv.c d9/test/test_handler.c"

# 변형 A — 데몬 빌드 → 인수 시험
make D=d9 V=sessiond SRC="$(ls d9/src/*.c)" build/d9_sessiond
bash d9/test/accept.sh build/d9_sessiond                  # 1 ~ 7
bash d9/test/soak.sh   build/d9_sessiond 30               # 8 (30분)

# 변형 B
make D=d9 V=journal SRC="d9/src/journal.c d9/src/agg.c d9/test/test_journal.c"

# 변형 C
make D=d9 V=rslots  SRC="d9/src/rslots.c d9/test/test_rslots.c"
make D=d9 V=relay   SRC="$(ls d9/src/*.c)" build/d9_relay
python3 d9/test/relay_check.py build/d9_relay
```

* 단위 시험의 마지막 줄이 **`PASS`** 이고 경고 0, 새니타이저 리포트 0 이어야 한다.
* 인수 시험은 `ASan` 이 켜진 데몬의 stderr 를 읽으므로 **누수는 `X` 로 나온다.**
* 포트가 겹치면 `PORT=19150 bash d9/test/accept.sh ...` 처럼 바꾼다.

> [!example]- 참고: Makefile 없이 순수 gcc 로 실행
> ```bash
> mkdir -p build
> # 단위 시험 (변형 A: session)
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Id9/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d9/src/session.c d9/test/test_session.c \
>     -pthread -o build/d9_session
> ./build/d9_session
>
> # 데몬
> gcc -Wall -Wextra -Werror -std=c11 -D_POSIX_C_SOURCE=200809L -g -DUNIT_TEST \
>     -Icommon -Id9/src \
>     -fsanitize=address,undefined -fno-omit-frame-pointer \
>     d9/src/*.c -pthread -o build/d9_sessiond
> bash d9/test/accept.sh build/d9_sessiond
> ```
>
> 변형 B, C 는 위 `make` 의 `SRC` 목록을 그대로 쓴다.

---

## 4. 자주 하는 실수

| 실수 | 증상 |
| :--- | :--- |
| 응답 Type 을 `요청 + 128` 로 만듦 | D4 의 `Type` 은 5비트라 **잘려서** 엉뚱한 Type 이 나간다.<br>`요청 + 16` |
| 세션 삭제를 체인 **머리만** 지원 | 같은 버킷의 가운데·꼬리를 지우면 **체인이 끊긴다** (`test_collision` 이 잡는다) |
| `CLOSING` 을 정원에서 뺌 | 만료 직후 정원이 새는 것처럼 보여 **정원이 넘친다** |
| 순회 중 노드를 `free` 한 뒤 `next` 를 읽음 | use-after-free.<br>`next` 를 **먼저** 저장한다 |
| 감시 스레드가 **락을 잡은 채** 로그를 찍음 | 로그 I/O 가 워커를 막는다.<br>만료 id 만 모아서 **락 밖에서** 로그 |
| `rx` / `tx` 를 일반 `unsigned long` 로 증가 | 워커끼리 겹쳐 **유실**된다 (`test_stats` 가 잡는다).<br>`atomic` |
| 종료 때 마지막 통계를 안 찍음 | `rx == tx + drop` 을 확인할 수 없다 |
| 단위 시험 없이 인수 시험부터 | 어디가 틀렸는지 알 수 없다 |
| 앞 드릴 코드를 **다시 짬** | 이 드릴은 종합이 아니라 큰 숙제가 된다.<br>이식이 안 되면 그 드릴로 돌아간다 |
| (B) 집계에 반영한 **뒤에** 저널에 씀 | 중간에 죽으면 집계에는 있고 저널에는 없다 (복구 불가).<br>**저널이 먼저** (write-ahead) |
| (B) `fwrite` 만 하고 `fsync` 를 안 함 | `kill -9` 가 아니라 **전원 장애**에서 레코드를 잃는다 |
| (B) 깨진 꼬리를 자르지 않고 이어 씀 | 새 레코드가 깨진 레코드 뒤에 붙어 **다음 replay 가 거기서 멈춘다** |
| (B) `jrec_t` 를 통째로 `fwrite` | 패딩·엔디안이 파일 포맷에 새어 나온다 |
| (C) 재전송을 **무한** 반복 | 업스트림이 죽으면 슬롯이 영원히 찬다.<br>**1회** 후 포기 |
| (C) payload 를 파싱해서 다시 만듦 | 모르는 바이트가 사라진다.<br>**원문 통과** |
| (C) 늦은 응답을 그냥 클라이언트에 전달 | 이미 timeout 응답을 받은 클라이언트가 **같은 요청의 응답을 두 번** 받는다 |
| (C) check-out 과 `rslots_due` 가 다른 락 | 응답이 도착한 요청을 **만료 처리**한다 |

---

## 5. 회고 — 이걸 써야 다음 사이클이 짧아진다

끝나고 **10분** 안에 아래를 채운다.
길게 쓰지 않는다.

```markdown
## D9-A 회고 (YYYY-MM-DD)

### 어디서 제일 오래 막혔나 (한 줄)
-

### 그건 어느 드릴의 내용이었나
- D_ : 이유 →

### 템플릿을 안 보고 친 비율 (체감 %)
- 1번 골격 __% / 2번 구조체 __% / 3번 바이트 __% / 4번 데몬 __%

### 다음 사이클에서 되돌아갈 드릴
- D_ 를 __회차부터

### 템플릿 문서에 추가하고 싶은 것 (있으면 실제로 반영)
-
```

> [!TIP] 회고의 마지막 줄이 제일 중요하다
> 드릴을 돌다 보면 **템플릿 문서 자체의 빈칸**이 보인다.
> 그때 [c코드 골격](개발%20%28CS%29/언어/C언어/코드%20골격/c코드%20골격%20목록.md) 을 고친다.
> 템플릿이 좋아지면 다음 회차가 또 빨라진다.
> **이게 이 체계의 복리 구간이다.**

---

## 관련 노트

- [c코드 골격 목록](개발%20%28CS%29/언어/C언어/코드%20골격/c코드%20골격%20목록.md) — 1~6번 전부
- [[C] 스레드별 전용 큐와 해시 샤딩](개발%20%28CS%29/언어/C언어/동시성·스레드/[C]%20스레드별%20전용%20큐와%20해시%20샤딩%20—%20락%20경합%20없는%20고성능%20워커%20패턴.md)
- [[C] 비동기 요청-응답의 타임아웃 감시](개발%20%28CS%29/언어/C언어/동시성·스레드/[C]%20비동기%20요청-응답의%20타임아웃%20감시%20—%20Check-in과%20Check-out%20타이머%20패턴.md) — 변형 C
- [[C] 락 없는 카운터 — GCC 원자적 연산 빌트인과 C11 atomic](개발%20%28CS%29/언어/C언어/동시성·스레드/[C]%20락%20없는%20카운터%20—%20GCC%20원자적%20연산%20빌트인과%20C11%20atomic.md) — 통계 카운터
- C언어 시스템 프로그래밍 단계별 실습 가이드 — 개념 기반 실습
- [드릴 목록](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/템플릿%20체화%20드릴%20목록.md)
