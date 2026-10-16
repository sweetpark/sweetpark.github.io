---
title: "D6. 설계 산출물 — 표를 Mermaid 5종으로"
tags: 
created: 2026-09-21
modified: 2026-10-16
---

# D6. 설계 산출물 — 표를 Mermaid 5종으로

> **쓰는 템플릿**: [5. 설계 산출물 Mermaid 치트시트](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%205.%20설계%20산출물%20Mermaid%20치트시트.md)
>
> **목표 시간**: 1회차 30분 / 2회차 20분 / **3회차 15분** (확장 포함 **20분**)
>
> **코드를 치는 드릴이 아니다.**
> 앞 드릴에서 짠 것을 **남이 읽을 수 있는 그림**으로 만드는 드릴이다.

> [!NOTE] 이 드릴의 문서 구성 (D0~D9 공통)
> ① **요구사항서** — 무엇을 그리나, 그림마다 합격 기준을 표로 확정한다.
> ② **pseudo code 템플릿** — 빈칸이 있는 mermaid 뼈대이고, 회차마다 가린다.
> ③ **테스트 코드** — 그림이 합격 기준을 지켰는지 검사하는 스크립트(`check.sh`)다.
> ④ 자주 하는 실수
> ⑤ 모범답안 — 맨 뒤에 접어 둔다.
>
> D6 은 코드를 치는 드릴이 아니라서 **"코드"가 mermaid 이고 "테스트"가 합격 기준 검사 스크립트**다.
> 변형 A/B/C 는 같은 일을 다른 소재로 다시 하는 것이다.

---

## 0. 왜 이걸 드릴로 하나

설계서를 요구받았을 때 막히는 이유는 그림 실력이 아니라 **"무엇을 몇 장 그려야 하는지 모르는 것"** 이다.
답은 정해져 있다.
**네 장.**

| 순서 | 종류 | 답하는 질문 | 재료 |
| :--- | :--- | :--- | :--- |
| ① | **블록도** | 이 모듈이 **어디에** 붙나 | 시스템 구성 |
| ② | **sequenceDiagram** | 누가 누구를 **언제** 부르나 | Call Flow |
| ③ | **erDiagram** | 데이터가 **어떻게 생겼나** | D2 의 구조체 |
| ④ | **flowchart** | 함수 하나가 **어떻게 흐르나** | D1·D3 의 함수 |
| (⑤) | **stateDiagram-v2** | 상태가 있으면 **언제 바뀌나** | 세션·타이머가 있을 때만 |

**⑤는 상태가 있을 때만.** 없는데 그리면 오히려 읽는 사람이 헷갈린다.

### 회차별 진행

| 회차 | 변형 | 보는 것 | 순서 |
| :--- | :--- | :--- | :--- |
| **1회차** | **A** D1 + D2 산출물화 | ① 요구사항서<br>② mermaid 뼈대 **전체** | 1. 뼈대의 `%% [ ]` 를 보고 그림을 완성한다.<br>2. ③ `check.sh` 를 실행한다. |
| **2회차** | **B** D4 + D5 산출물화 | ① 요구사항서<br>② 뼈대의 **번호와 제목만** (Level 2) | 1. 번호만 보고 그린다.<br>2. ③ `check.sh` 를 실행한다. |
| **3회차** | **C** D7 산출물화 + 상태도 | ① 요구사항서만 | 1. ③ `check.sh` 의 항목을 **먼저 읽는다.**<br>2. 백지에서 그린다. |

> 1회차에 막히면 같은 변형을 한 번 더 한다.
> 3회차를 통과하면 A 를 백지로 다시 그린다.

---

## 1. 요구사항서

### 1-A. 변형 A — D1 + D2 산출물화

앞 드릴의 결과를 **설계서 한 장**(`d6_design/design_a.md`)으로 만든다.

1. **블록도**: `가입자 관리 모듈` 이 프로세스 안에서 어디에 있는지.
   입력은 요청 큐, 출력은 DB 와 응답이다.
2. **sequenceDiagram**: 요청 수신 → 정규화(D1) → 검증(D2) → 저장 → 응답.
   **실패 경로와 타임아웃을 포함**한다.
3. **erDiagram**: `subs_profile_t` + `snssai_t` 관계 (1:N, 1~8).
4. **flowchart**: `msisdn_normalize()` 내부 흐름.
   **에러 리턴이 전부 보여야 한다.**

설계서 파일의 모양은 이렇다.
각 그림은 `## 제목` 아래에 ` ```mermaid ` 코드 블록 하나다.

```text
d6_design/design_a.md
  ## ① 블록도           ```mermaid  flowchart LR  ...```
  ## ② Call Flow        ```mermaid  sequenceDiagram ...```
  ## ③ ERD              ```mermaid  erDiagram ...```
  ## ④ msisdn_normalize ```mermaid  flowchart TD ...```
```

### 확장 — D2 확장본의 ERD (C 와 union 이 들어간다)

5. **erDiagram (확장)**: D2 의 `subs_profile_t` 확장본 — `suspend_cause` (C), `charging_method` 태그 + `prepaid_info` / `postpaid_info` (배타 union) 를 **치트시트 4-3b 관례**로 그린다.
   - `charging_method` 에 **`TAG`**, arm 은 **엔티티 둘 + 라벨 `charging_method=PREPAID` / `POSTPAID`**
   - `postpaid_info` 의 **배열 개수(`email_cnt`) 는 arm 엔티티 안**에
   - `suspend_cause` 는 **`"C: suspended==true"`** 코멘트.
     **union 이 아니므로 `TAG` 를 붙이지 않는다**

### 1-B. 변형 B — D4 + D5 산출물화

`d6_design/design_b.md` 에 **pack/unpack 흐름 + TLV 구조 + 메시지 왕복**을 그린다.

| # | 그림 | 대상 | 반드시 보여야 하는 것 |
| :--- | :--- | :--- | :--- |
| 1 | **블록도** (`flowchart LR`) | 송신 모듈 / 와이어 / 수신 모듈 | 경계, 데이터 방향, `msg_pack` · `msg_unpack` 의 위치 |
| 2 | **sequenceDiagram** | 메시지 왕복 | `alt` 로 **`RET_TOO_SMALL` / `RET_BAD_FORMAT`(체크섬) / `RET_OK`**, 재전송 **타임아웃** |
| 3 | **erDiagram** | `msg_body_t` + 모르는 IE 보관 | `1:N` 상한 `"0~8"`, Optional 표시(`has_`), (확장) IE 값 **`TAG`(kind)** + arm 엔티티 |
| 4 | **flowchart** (`flowchart TD`) | `msg_unpack()` 내부 | `NEED` 가 걸리는 **세 지점**, Reserved, 체크섬, **모든 종료점에 리턴코드** |

식별자(`msg_pack`, `msg_unpack`, `RET_*`)는 D4 / D5 코드에 있는 이름을 **그대로** 쓴다.

### 1-C. 변형 C — D7 산출물화 + 상태도

`d6_design/design_c.md` 에 **데몬 기동/종료**와 **세션 상태**를 그린다.
**상태가 있으므로 ⑤ 상태도가 추가**된다.

| # | 그림 | 대상 | 반드시 보여야 하는 것 |
| :--- | :--- | :--- | :--- |
| 1 | **블록도** (`flowchart LR`) | 데몬 프로세스 | 시그널 스레드 / 수신 스레드 / 워커 N / 큐, 외부(소켓), 경계 |
| 2 | **sequenceDiagram** | 기동 → 처리 → `SIGTERM` → 종료 | `alt` 정상 종료 / 설정 없음 / 포트 사용 중, 종료 시 **큐 drain**, 종료 **타임아웃** |
| 3 | **erDiagram** | 세션 컨텍스트 + 큐 항목 | 키, 상한, Optional 표시 |
| 4 | **flowchart** (`flowchart TD`) | 워커 루프 또는 종료 절차 | 모든 종료점에 리턴코드 |
| 5 | **stateDiagram-v2** | 세션 FSM `IDLE → ACTIVE → CLOSING → IDLE` | `[*]` 초기, **모든 전이에 트리거**, 종료 상태 |

식별자는 D7 코드의 함수·상수 이름을 **그대로** 쓴다.

### 1-D. 합격 기준 — 그림마다 딱 3개씩

| 종류 | 반드시 있어야 하는 것 |
| :--- | :--- |
| **블록도** | 경계(내 모듈 / 남의 모듈) · 데이터 방향 화살표 · 외부 의존(DB·소켓) |
| **sequence** | **실패 경로**(`alt` / `opt`) · **타임아웃** · 응답 코드 |
| **ERD** | 키 표시 · **1:N 의 N 상한**(`"1~8"`) · Optional 표시 · **(확장) C 조건 코멘트 · union `TAG` + arm 엔티티** |
| **flowchart** | 진입 가드 · **모든 종료점에 리턴코드** · 분기 조건 문구 |
| **state** | 초기 상태(`[*]`) · **모든 전이에 트리거** · 종료 상태 |

> [!IMPORTANT] flowchart 의 종료 노드에 리턴코드가 없으면 0점
> `"실패"` 라고만 쓰인 그림은 코드로 옮길 수 없다.
> **`RET_BAD_FORMAT`** 처럼 **실제 코드에 있는 이름**을 쓴다.
> 그림과 코드에서 **같은 이름을 쓰는 것**이 이 드릴의 진짜 목적이다.

---

## 2. pseudo code 템플릿 — 보고 그려서 익힌다

> **사용법**
> 아래 뼈대를 `d6_design/design_*.md` 에 **복사**하고, `%% [ ]` 주석을 보고 **내가 채운다.**
> 다 채우면 `[ ]` 를 `x` 로 바꾼다.
> 막히면 §5 모범답안의 해당 그림만 본다.

### 2-A. 변형 A — Level 1 (1회차, 전부 본다)

````text
## ① 블록도
```mermaid
flowchart LR
    %% [ ] 1. subgraph EXT["외부"] 에 Client, DB (원통 모양은 [( )])
    %% [ ] 2. subgraph PROC["subs_svc 프로세스"] 에 요청 큐 → worker → msisdn_normalize → subs_profile_validate → db_upsert
    %% [ ] 3. 화살표에 데이터 이름 (요청 / SQL / 응답) — 방향이 보이게
    %% [ ] 4. 내 모듈(D1, D2)에 style 로 색을 입힌다
```

## ② Call Flow
```mermaid
sequenceDiagram
    autonumber
    %% [ ] 1. participant: Client / subs_svc / msisdn_normalize() / DB
    %% [ ] 2. 요청 → normalize 호출
    %% [ ] 3. alt 형식 위반      → RET_BAD_FORMAT → 400
    %%        else 타 국가 번호 → RET_NOT_SUPPORTED → 501
    %%        else 정상          → RET_OK → validate → UPSERT
    %% [ ] 4. 정상 분기 안에 opt 3초 내 응답 없음 → D--xS (timeout) → 504
    %% [ ] 5. 마지막에 DB OK → 200
```

## ③ ERD
```mermaid
erDiagram
    %% [ ] 1. SUBS_PROFILE ||--|{ SNSSAI : "allowedNssai (1~8)"        ← N 상한을 라벨에
    %% [ ] 2. SUBS_PROFILE { 필드마다  타입  이름  "M/O, 범위" }          ← 키는 이름 뒤에 _PK, Optional 은 "O, has_..."
    %% [ ] 3. SNSSAI { sst, sd }
    %% [ ] 4. (확장) 두 번째 erDiagram:
    %%          SUBS_PROFILE ||--o| PREPAID_INFO  : "charging_method=PREPAID"
    %%          SUBS_PROFILE ||--o| POSTPAID_INFO : "charging_method=POSTPAID"
    %%          charging_method 에 "M, TAG"        ← union 의 태그는 한 곳뿐
    %%          suspend_cause 에 "C: suspended==true"   ← 조건 코멘트만 있고 TAG 는 없다
    %%          email_cnt 는 POSTPAID_INFO 안에
```

## ④ msisdn_normalize
```mermaid
flowchart TD
    %% [ ] 1. 진입 ([ ] 둥근 사각)        S([msisdn_normalize 진입])
    %% [ ] 2. 가드 {"in / out NULL?"} → 예: RET_INVALID_ARG
    %% [ ] 3. {"def_cc 1~999?"}       → 아니오: 같은 RET_INVALID_ARG 노드
    %% [ ] 4. 순회: 허용 문자? / '+' 가 맨 앞? / 숫자 1개 이상?  → 아니오/예: RET_BAD_FORMAT
    %% [ ] 5. '+' 있음? → def_cc 로 시작? 아니오: RET_NOT_SUPPORTED
    %% [ ] 6. 선행 0? 에 따라 NSN 만들기 (세 갈래가 한 곳으로 모인다)
    %% [ ] 7. cc+nsn 15자 이하? 아니오: RET_BAD_FORMAT / 예: RET_OK
    %%        종료 노드는 모두 [/"RET_..."/] 모양 (RET_ 로 시작하는 실제 이름)
```
````

### 2-B. 변형 B — Level 2 (2회차, 번호와 제목만 본다)

````text
## ① 블록도          flowchart LR       %% [ ] 송신 / 와이어 / 수신, msg_pack · msg_unpack 위치
## ② 메시지 왕복      sequenceDiagram   %% [ ] pack → 전송 → unpack, alt 3갈래(TOO_SMALL / BAD_FORMAT / OK), opt 재전송 타임아웃
## ③ TLV 구조 ERD    erDiagram         %% [ ] msg_body 1:N unknown_ie "0~8", has_ 표시, (확장) kind TAG + arm 엔티티
## ④ msg_unpack()    flowchart TD      %% [ ] NEED 세 지점, Reserved, 체크섬, 모든 종료점 RET_
````

### 2-C. 변형 C — Level 3 (3회차, 백지)

````text
아무것도 안 본다.
§1-C 요구사항서와 §3 의 check.sh 항목만 보고 그린다.

막히면 세 가지만 찾아본다.
  - stateDiagram-v2 문법 ([*], 전이 라벨)
  - sequenceDiagram 의 alt / opt / D--x
  - 상태 전이를 D7 코드의 어느 함수가 일으키는지
````

> [!TIP] 막혔을 때 찾는 순서
> 1. 렌더가 깨지면 라벨의 `()` `[]` 를 큰따옴표로 감쌌는지 본다.
> 2. 화살표 문법을 치트시트에서 복사한다.
> 3. `check.sh` 의 `X` 줄이 **무엇이 모자란지** 알려 준다.
> 4. 그래도 안 되면 모범답안의 해당 그림 **하나만** 본다.

---

## 3. 테스트 코드 — 이게 통과하면 끝

그림은 눈으로만 보면 **합격 기준을 빼먹기 쉽다.**
그래서 §1-D 의 기준을 **스크립트**로 검사한다.

```text
d6_design/design_a.md  design_b.md  design_c.md     설계서 (내가 그린다)
d6_design/check.sh                                   합격 기준 검사 스크립트 (아래를 그대로 둔다)
```

> [!IMPORTANT] 시험의 형태 (D1~D9 공통)
> **정상**은 합격 기준을 다 지킨 설계서가 `PASS` 가 되는 것이다.
> **경계**는 기준을 하나씩 어겨 보는 것이다 (아래 "일부러 깨뜨려 보기").
> **NULL / 실패**는 파일이 없거나 그림이 하나도 없을 때 스크립트가 **실패하는지** 보는 것이다.

### 3-0. `check.sh`

```bash
#!/usr/bin/env bash
# d6_design/check.sh — 설계서(mermaid) 합격 기준 검사
# 사용법:  bash d6_design/check.sh <설계서.md> <A|B|C> <코드 폴더>...
#   예)    bash d6_design/check.sh d6_design/design_a.md A common d1_pure/src d2_model/src
#   환경변수:  EXT=1  (A 확장: ERD 에 union TAG 와 C 조건 코멘트를 요구)
#              EXTERNAL="db_upsert"  (코드에 없는 외부 이름. 공백으로 구분)

doc="$1"; variant="$2"; shift 2
codes=("$@")
EXTERNAL="${EXTERNAL:-db_upsert}"

fail=0
ok()  { echo "  ok  $1"; }
bad() { echo "  X   $1"; fail=$((fail + 1)); }
chk() { local msg="$1"; shift; if "$@" >/dev/null 2>&1; then ok "$msg"; else bad "$msg"; fi; }

[ -f "$doc" ] || { echo "no such file: $doc"; exit 2; }
[ -n "$variant" ] || { echo "usage: check.sh <doc> <A|B|C> <code dir>..."; exit 2; }

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

# 1) mermaid 블록을 하나씩 파일로 뽑는다
awk -v dir="$tmp" '
    /^```mermaid/ { n++; f = sprintf("%s/m%02d.mmd", dir, n); inb = 1; next }
    /^```/        { inb = 0 }
    inb           { print > f }
' "$doc"

pick() { grep -lE "$1" "$tmp"/*.mmd 2>/dev/null | head -1; }
blk=$(pick '^flowchart LR');       seq=$(pick '^sequenceDiagram')
er=$(pick '^erDiagram');           flow=$(pick '^flowchart TD')
st=$(pick '^stateDiagram-v2')
grep -lE '^erDiagram' "$tmp"/*.mmd 2>/dev/null | xargs cat > "$tmp/er_all.txt" 2>/dev/null

echo "[$variant] 그림 종류"
chk "블록도 (flowchart LR)"          test -n "$blk"
chk "sequenceDiagram"                test -n "$seq"
chk "erDiagram"                      test -n "$er"
chk "flowchart TD (함수 흐름)"       test -n "$flow"
if [ "$variant" = C ]; then chk "stateDiagram-v2 (상태도)" test -n "$st"; fi

echo "[$variant] 그림마다 3개"
if [ -n "$seq" ]; then
    chk "sequence: 실패 경로 (alt)"  grep -qE '^[[:space:]]*alt ' "$seq"
    chk "sequence: 타임아웃"         grep -qiE 'timeout|타임아웃' "$seq"
    chk "sequence: 응답 코드"        grep -qE 'RET_[A-Z_]+|[1-5][0-9][0-9]' "$seq"
fi
if [ -n "$er" ]; then
    chk "ERD: 키 표시 (_PK)"         grep -q '_PK' "$tmp/er_all.txt"
    chk "ERD: 개수 상한 (예 1~8)"    grep -qE '[0-9]+ ?~ ?[0-9]+' "$tmp/er_all.txt"
    chk "ERD: Optional 표시"         grep -q '"O' "$tmp/er_all.txt"
    if [ "${EXT:-0}" = 1 ] || [ "$variant" = B ]; then
        chk "ERD(확장): union TAG"   grep -q 'TAG' "$tmp/er_all.txt"
    fi
    if [ "${EXT:-0}" = 1 ]; then
        chk "ERD(확장): C 조건 코멘트" grep -q 'C:' "$tmp/er_all.txt"
    fi
fi
if [ -n "$flow" ]; then
    all_term_have_ret() { ! grep -oE '\[/"[^"]*"/\]' "$1" | grep -qv 'RET_'; }
    chk "flowchart: 종료 노드가 있다"          grep -qE '\[/"[^"]*"/\]' "$flow"
    chk "flowchart: 모든 종료 노드에 RET_ 코드" all_term_have_ret "$flow"
    n=$(grep -oE '[A-Za-z0-9_]+(\(\[|\[/|\[|\{|\()' "$flow"         | sed -E 's/(\(\[|\[\/|\[|\{|\()$//' | sort -u | wc -l)
    if   [ "$n" -le 15 ]; then ok "flowchart: 노드 ${n}개"
    elif [ "$n" -le 20 ]; then echo "  !   flowchart: 노드 ${n}개 (권장 15 이하)"
    else bad "flowchart: 노드 ${n}개 (20 초과 — 함수를 쪼갤 신호)"; fi
fi
if [ -n "$st" ]; then
    all_trans_labeled() { ! grep -E -- '-->' "$1" | grep -vE '^[[:space:]]*\[\*\]' | grep -qv ':'; }
    chk "state: 초기 상태 [*]"       grep -qE '^[[:space:]]*\[\*\] *-->' "$st"
    chk "state: 종료 상태"           grep -qE -- '--> *\[\*\]' "$st"
    chk "state: 모든 전이에 트리거"  all_trans_labeled "$st"
fi

echo "[$variant] 그림의 이름 == 코드의 식별자"
for r in $(grep -ohE 'RET_[A-Z_]+' "$doc" | sort -u); do
    chk "리턴코드가 코드에 있다: $r" grep -rqw "$r" "${codes[@]}"
done
for f in $(grep -ohE '[a-z][a-z0-9_]+\(\)' "$doc" | tr -d '()' | sort -u); do
    case " $EXTERNAL " in *" $f "*) continue ;; esac
    chk "함수 이름이 코드에 있다: $f" grep -rqw "$f" "${codes[@]}"
done

echo "[$variant] 렌더링"
if command -v mmdc >/dev/null 2>&1; then
    for m in "$tmp"/m*.mmd; do chk "렌더: $(basename "$m")" mmdc -q -i "$m" -o "$m.svg"; done
else
    echo "  --  mmdc 없음: Obsidian 미리보기에서 깨지지 않는지 눈으로 확인"
fi

if [ "$fail" -eq 0 ]; then echo PASS; else echo "FAIL $fail"; exit 1; fi
```

### 3-1. 실행

```bash
bash d6_design/check.sh d6_design/design_a.md A common d1_pure/src d2_model/src            # 변형 A
EXT=1 bash d6_design/check.sh d6_design/design_a.md A common d1_pure/src d2_model/src      # 변형 A (확장 포함)
bash d6_design/check.sh d6_design/design_b.md B common d4_pack/src d5_tlv/src              # 변형 B
bash d6_design/check.sh d6_design/design_c.md C common d7_daemon/src                       # 변형 C
```

* 마지막 줄이 **`PASS`** 이면 통과다.
* `X` 줄은 **무엇이 모자란지** 그대로 알려 준다.
* 렌더 검사는 `mmdc`(mermaid-cli)가 있을 때만 한다.
  없으면 Obsidian 미리보기에서 눈으로 확인한다.

### 3-2. 일부러 깨뜨려 보기 (경계 · 실패)

스크립트가 **정말로 틀린 그림을 걸러내는지** 확인한다.
하나씩 깨뜨리고 `X` 가 나오면 정상이다.

| 깨뜨리는 법 | 기대하는 결과 |
| :--- | :--- |
| flowchart 종료 노드 하나를 `[/"실패"/]` 로 바꾼다 | `X flowchart: 모든 종료 노드에 RET_ 코드` |
| sequence 에서 `alt` 블록을 지운다 | `X sequence: 실패 경로 (alt)` |
| ERD 라벨에서 `1~8` 을 지운다 | `X ERD: 개수 상한` |
| 그림 속 `RET_BAD_FORMAT` 을 `RET_BADFORMAT` 으로 오타 낸다 | `X 리턴코드가 코드에 있다` |
| 존재하지 않는 파일 이름을 넘긴다 | `no such file` 로 종료 (코드 2) |
| mermaid 블록이 하나도 없는 파일을 넘긴다 | 그림 종류 항목이 전부 `X` |

---

## 4. 자주 하는 실수

| 실수 | 고치는 법 |
| :--- | :--- |
| 노드 라벨에 `()` `[]` 를 그냥 씀 → 렌더 깨짐 | 라벨 전체를 **큰따옴표**로 감싼다: `A["do_x()"]` |
| 한글 화살표 라벨에 공백 | `-->|요청 수신|` 은 되지만 특수문자 섞이면 깨진다. 따옴표 사용 |
| 시퀀스가 **정상 경로만** | 설계서로서 쓸모가 없다. `alt`/`opt` 로 실패를 반드시 |
| 플로우차트에 **함수 전체**를 다 그림 | 한 장에 노드 15개 이하가 이상적이다.<br>**20개를 넘으면** 함수를 쪼갤 신호다 |
| 그림의 이름과 코드 이름이 다름 | 리뷰 때 매칭이 안 된다. **복붙할 수 있는 이름**을 쓴다 |
| union 을 그리면서 **`TAG` 표시를 빼먹음** | 관계선만 보여 "셋 다 있을 수 있다" 로 읽힌다 |
| C 조건을 그림에 안 적음 | 코드의 `validate` 조건과 대조할 근거가 없다 |
| (B) ERD 에서 모르는 IE 보관을 `1:1` 로 그림 | 최대 8개이므로 `"0~8"` 상한을 적은 `1:N` 이다 |
| (C) 상태도에 트리거 없는 전이 | `A --> B` 만 있으면 언제 바뀌는지 모른다.<br>`A --> B : start` 처럼 **이벤트**를 적는다 |
| (C) 상태도에 종료 상태가 없음 | 세션이 어떻게 끝나는지 읽을 수 없다.<br>`CLOSING --> [*] : closed` |

> [!TIP] 그림이 안 그려지면 함수 설계가 틀린 것이다
> 노드 20개를 넘거나 화살표가 얽히면 **그림 탓이 아니다.** 그 함수가 너무 많은 일을 한다.
> 이 드릴의 부수 효과: **설계 결함이 코드 치기 전에 보인다.**

---

## 5. 모범답안 (변형 A)

> [!success]- ② Call Flow — 실패와 타임아웃이 들어간 시퀀스
> ```mermaid
> sequenceDiagram
>     autonumber
>     participant C as Client
>     participant S as subs_svc
>     participant N as msisdn_normalize()
>     participant D as DB
>
>     C->>S: ProfileUpsert(raw="010-1234-5678")
>     S->>N: msisdn_normalize(in, out)
>
>     alt 형식 위반
>         N-->>S: RET_BAD_FORMAT
>         S-->>C: 400 Bad Request
>     else 타 국가 번호
>         N-->>S: RET_NOT_SUPPORTED
>         S-->>C: 501 Not Implemented
>     else 정상
>         N-->>S: RET_OK (e164="821012345678")
>         S->>S: subs_profile_validate()
>         S->>D: UPSERT profile
>         opt 3초 내 응답 없음
>             D--xS: (timeout)
>             S-->>C: 504 Gateway Timeout
>         end
>         D-->>S: OK
>         S-->>C: 200 OK
>     end
> ```

> [!success]- ③ ERD — 구조체 그대로
> ```mermaid
> erDiagram
>     SUBS_PROFILE ||--|{ SNSSAI : "allowedNssai (1~8)"
>
>     SUBS_PROFILE {
>         char     supi_PK         "M, 15자 이하"
>         bool     suspended       "M, 기본 false"
>         char     nickname        "O, has_nickname"
>         enum     rat_type        "O, has_rat_type"
>         uint32   ambr_ul         "O, 0~4000000"
>         uint32   ambr_dl         "O, 0~4000000"
>         time_t   last_seen       "O, 64비트"
>         uint8    nssai_num       "M, 1~8"
>     }
>
>     SNSSAI {
>         uint8 sst    "M, 0~255"
>         char  sd     "O, has_sd, 16진수 6자리"
>     }
> ```

> [!success]- ③-b ERD 확장 — C 와 union (D2 확장본)
> ```mermaid
> erDiagram
>     SUBS_PROFILE ||--|{ SNSSAI : "allowedNssai (1~8)"
>     SUBS_PROFILE ||--o| PREPAID_INFO  : "charging_method=PREPAID"
>     SUBS_PROFILE ||--o| POSTPAID_INFO : "charging_method=POSTPAID"
>
>     SUBS_PROFILE {
>         char   supi_PK          "M, 15자 이하"
>         bool   suspended        "M, 기본 false"
>         char   suspend_cause    "C: suspended==true, has_suspend_cause"
>         enum   charging_method  "M, TAG"
>     }
>     PREPAID_INFO {
>         uint32 balance          "M, 0~40억"
>     }
>     POSTPAID_INFO {
>         uint8  billing_day      "M, 1~28"
>         uint8  email_cnt        "0~3 (cnt 는 arm 안)"
>         char   emails           "63자 이하 x 3"
>     }
>     SNSSAI {
>         uint8 sst    "M, 0~255"
>         char  sd     "O, has_sd"
>     }
> ```
>
> **확인할 3가지**: ① `TAG` 는 `charging_method` **한 곳뿐**이다.
> ② `suspend_cause` 는 조건 코멘트만 있고 `TAG` 가 없다 (union 이 아니라는 뜻).
> ③ `email_cnt` 가 SUBS_PROFILE 이 아니라 **POSTPAID_INFO 안**에 있다 — 코드의 구조체 경계와 같다.

> [!success]- ④ flowchart — 종료점마다 리턴코드
> ```mermaid
> flowchart TD
>     S([msisdn_normalize 진입]) --> G{"in / out NULL?"}
>     G -- 예 --> E1[/"RET_INVALID_ARG"/]
>     G -- 아니오 --> R{"def_cc 1~999?"}
>     R -- 아니오 --> E1
>     R -- 예 --> M["memset(out)"]
>
>     M --> L["입력 1문자씩 순회"]
>     L --> C1{"허용 문자?"}
>     C1 -- 아니오 --> E2[/"RET_BAD_FORMAT"/]
>     C1 -- 예 --> C2{"'+' 가 맨 앞이 아님?"}
>     C2 -- 예 --> E2
>     C2 -- 아니오 --> C3{"숫자 1개 이상?"}
>     C3 -- 아니오 --> E2
>
>     C3 -- 예 --> P{"'+' 있음?"}
>     P -- 예 --> F{"def_cc 로 시작?"}
>     F -- 아니오 --> E3[/"RET_NOT_SUPPORTED"/]
>     F -- 예 --> A["NSN = 숫자열 - 국가코드"]
>     P -- 아니오 --> Z{"선행 0?"}
>     Z -- 예 --> A2["NSN = 숫자열 - 선행 0"]
>     Z -- 아니오 --> A3["NSN = 숫자열"]
>
>     A --> LEN{"cc+nsn 15자 이하?"}
>     A2 --> LEN
>     A3 --> LEN
>     LEN -- 아니오 --> E2
>     LEN -- 예 --> OK[/"RET_OK<br/>e164 · nsn · cc 채움"/]
> ```

> [!success]- ① 블록도 — 경계가 보이게
> ```mermaid
> flowchart LR
>     subgraph EXT["외부"]
>         CLI["Client"]
>         DB[("Profile DB")]
>     end
>
>     subgraph PROC["subs_svc 프로세스"]
>         Q["요청 큐"] --> W["worker thread x N"]
>         W --> NRM["msisdn_normalize()<br/>D1"]
>         NRM --> VAL["subs_profile_validate()<br/>D2"]
>         VAL --> DAO["db_upsert()"]
>     end
>
>     CLI -->|요청| Q
>     DAO -->|SQL| DB
>     DAO -->|응답| CLI
>
>     style NRM fill:#e8f4ff,stroke:#3b82f6
>     style VAL fill:#e8f4ff,stroke:#3b82f6
> ```

---

## 관련 노트

- [5. 설계 산출물 Mermaid 치트시트](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%205.%20설계%20산출물%20Mermaid%20치트시트.md) — 복붙 판
- [2. 데이터 모델 골격](개발%20%28CS%29/언어/C언어/코드%20골격/[골격]%202.%20데이터%20모델%20골격%20—%20규격서%20I·O%20표를%20구조체로.md)
- [다음: D7. 데몬 골격](개발%20%28CS%29/언어/C언어/실습/템플릿%20체화%20드릴/[D]%20D7.%20데몬%20—%20시그널·poll·워커큐·graceful%20shutdown.md)
