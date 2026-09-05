---
title: "오픈소스 컨트리뷰션 실전 가이드(이슈 찾기~PR 작성, GlueSQL 사례)"
tags: [학습, 개발-CS, 언어, Rust, GlueSQL, 오픈소스아카데미, 오픈소스기여]
created: 2026-09-05
modified: 2026-09-05
---

# 오픈소스 컨트리뷰션 실전 가이드 (이슈 찾기부터 PR 작성까지, GlueSQL 사례)

> [!NOTE]
> "성장하며 열린" 오픈소스 프로젝트(GlueSQL)에 실제로 기여하면서 관찰한 것들을 정리한 실전 가이드. 일반론이 아니라 GitHub API로 최근 머지된 PR 30여 개를 직접 조회해서 확인한 **관찰된 관례**, 그리고 코드베이스에서 "아직 안 만들어진 것"을 찾는 구체적인 방법을 다룬다.

## 📌 개념

### 기여 항목을 찾는 세 가지 방법

GlueSQL처럼 "성숙해서 닫힌" 프로젝트가 아니라 "성장하며 열린" 프로젝트에서는, 없는 기능 대부분이 "설계상 제외"가 아니라 "아직 안 만든 것"이다. 그래서 아래 방법들이 실제로 잘 통한다.

**1. 오픈된 이슈 확인**

- GitHub Issues에서 `good first issue` / `help wanted` 라벨을 먼저 본다.
- 공식 미구현 백로그성 이슈([gluesql#1684](https://github.com/gluesql/gluesql/issues/1684))처럼, ✅/⚠️/❌ 상태 표기와 "기여 환영"이 명시된 트래킹 이슈가 있다면 착수 후보를 고를 때 가장 먼저 확인할 곳이다.
- 이슈는 두 갈래로 나뉜다: **메인테이너가 먼저 문제를 정의해둔 이슈**(스코프가 이미 정해져 있어 착수가 쉬움) vs **기여자가 스스로 문제를 발굴해 여는 이슈**(아래 3번 방법으로 직접 찾은 문제).
- 착수 전 담당자가 있는지 확인하고 착수 의사를 댓글로 남긴다 — 중복 작업을 막기 위한 최소한의 예의다.

**2. Contributing 가이드 / PR 실전 절차**

일반적인 5단계 흐름:

1. 이슈 담당 확인
2. 브랜치 생성 — upstream을 최신으로 맞춘 뒤 분기
   ```bash
   git fetch upstream main
   git switch main
   git merge --ff-only upstream/main
   git push origin main
   git switch -c fix/short-description   # 소문자/하이픈/슬래시
   ```
3. **현재 동작 재현** — 고치기 전에 관련 테스트나 최소 재현 코드로 지금 어떻게 동작하는지 먼저 확인
4. 기존 패턴 준수 — 유사한 기능·테스트 스타일을 먼저 검색해서 따라감
5. 테스트 확대 — 가장 단순한 구현(예: 메모리 기반 스토리지)부터 시작해 점진적으로 검증 범위를 넓힘

PR 제출 전 체크리스트: 이슈 범위 안인가 / 새 동작·오류 경로에 테스트가 있는가 / lint·format·diff 검증이 전부 통과하는가 / 브랜치가 upstream/main 최신을 포함하는가 / PR 본문에 이유와 검증 내용을 적었는가.

**이슈 없이 바로 PR해도 되는 경우도 있다.** 실제로 조사해보면(머지된 최근 PR들을 확인) "이슈 먼저 → PR"이 강제 관례는 아닌 프로젝트가 많다. 스코프가 명확하고 자기 완결적인 수정(버그 픽스류)은 바로 PR, 새 아티팩트/설계 판단이 들어가는 변경은 이슈로 먼저 합의하는 쪽이 안전하다.

**3. 소스코드 내 "미구현 지도" 찾기**

`todo!()`/`unimplemented!()` 매크로가 아예 없는 프로젝트도 많다 — GlueSQL이 그렇다. 대신 미구현이 두 가지 다른 방식으로 코드에 표현되어 있었다.

- **"파싱은 되지만 아직 거절하는 기능"**: `*NotSupported`/`Unsupported*` 계열 에러 variant가 100곳 넘게 있었다. 예: `SelectDistinctOnNotSupported`, `TryCastNotSupported` 등.
  ```bash
  # 미지원 기능 목록을 코드에서 직접 뽑아보기
  grep -n "NotSupported\|Unsupported" core/src/translate/error.rs
  ```
  이런 지점이 좋은 이유: 범위가 한 기능으로 명확하고, 기존 유사 기능의 처리 경로를 그대로 템플릿 삼아 따라 쓸 수 있다.
- **"확장 지점이 기본값(미지원)으로 남아있는 곳"**: 트레이트 기본 메서드가 "not supported"를 반환하도록 되어 있는데, 구현체(예: 특정 스토리지 백엔드)마다 어떤 확장 트레이트를 실제로 구현했는지가 다르다.
  ```bash
  grep -rE "impl (StoreMut|AlterTable|IndexMut|Transaction) for" storages/<name>/src/
  ```
  주의: `impl` 블록이 있어도 그 안 일부 메서드는 기본값(미지원)을 그대로 둘 수 있다 — 실제 구현 여부는 메서드 본문을 직접 열어봐야 확실하다.

에러 이름 패턴으로 성격/난이도를 가늠할 수도 있다.

| 패턴 | 의미 | 기여 관점 |
|------|------|-----------|
| `*NotSupported` | 아직 지원하지 않는 기능 요청 | 구현하면 되는 백로그 |
| `Unreachable*` | "앞 단계에서 걸러졌어야 하는 상태" | 방어 코드 — 재현되면 그 자체가 버그 리포트감 |
| `Conflict*` | 여러 컴포넌트 간 상태 불일치 | 일반적인 사용 경로로는 재현 어려움 — 내부 API를 직접 호출해 비정상 상태를 만들어야 테스트 가능 |

### PR/이슈 작성법 — GitHub API로 직접 확인한 관례

일반적인 컨벤션을 그대로 따르기보다, 대상 프로젝트에서 최근 머지된 PR을 직접 조회해서 실제 관례를 확인하는 게 훨씬 신뢰도가 높다. GlueSQL의 경우 최근 머지 PR 30개를 GitHub API로 확인한 결과:

- **`feat:`/`fix:`/`refactor:` 같은 타입 접두사를 붙이지 않는다.** 거의 전부 접두사 없이 동사원형으로 시작하는 평서문 한 줄이었다. 예: `Add PostgreSQL-style regex operators`, `Reject unsupported CREATE INDEX options during translation`, `Fix schema dependency scanning for ORDER BY expressions`.
- GitHub 라벨로 PR을 분류하는 관례도 없었다.
- "이게 기능 추가인지 버그 수정인지"는 접두사가 아니라 **동사 선택**(Add=기능 추가, Fix/Reject=버그 수정, Refactor/Rename=구조 개선)과 **본문 요약의 첫 문장**으로 드러내면 된다.

**이슈 작성 스타일은 성격에 따라 갈렸다.**

1. **버그 리포트형** — 가장 흔함. `Description` → 재현 가능한 최소 SQL/코드 블록 → `Expected Behavior`(되도록 기존 유사 패턴과의 일관성으로 근거를 댐) → `Actual Behavior` → 관련 코드 위치. 핵심은 **재현 코드를 그대로 붙여넣을 수 있게 쓰는 것**이다.
2. **제안/기능형** — 설계 판단이 필요한 변경. `Description`(현재 상태) → `Motivation`(왜 문제인가, 여러 항목으로 나열) → `Proposed Direction`(제안 코드 포함) → `Acceptance Criteria`(체크리스트). 핵심은 **제안 코드까지 미리 스케치해서** 메인테이너가 "이 방향이 맞다/아니다"만 빠르게 판단할 수 있게 만드는 것.
3. **심화 조사형** — 문제를 깊이 파고든 경우. `Summary` → `Current behavior`(코드 인용 + 재현 시나리오 + 실제 로그) → `Expected behavior` → `Why this matters` → `Possible direction`(단계별 해결 방향) → `Scope`(표로 in-scope/out-of-scope 명시).

**PR 본문은 Summary + (Changes) + Test plan 구조가 공통적으로 잘 통했다.**

1. **Summary**: 왜(문제/동기) → 무엇을(핵심 변경) → 필요하면 왜 이 방식을 택했는지(대안과 트레이드오프)까지.
2. **Changes**(선택): 파일별로 무엇을 바꿨는지 한 줄씩. 작은 PR이면 생략하고 diff로 충분.
3. **Test plan**: 체크박스(`- [x]`) 목록으로, **실제로 실행한 명령어 + 결과(통과 개수 등)**를 그대로 적는다. "잘 됩니다" 같은 뭉뚱그린 서술 대신 재현 가능한 형태로.
4. 맨 아래 `Fixes #NNN` 또는 `Closes #NNN`.

**`Fixes`/`Closes`/`Resolves` + `#이슈번호`를 PR 본문에 쓰면, 그 PR이 머지되는 순간 해당 이슈가 자동으로 닫힌다.** 대소문자 구분 없음, 복수 이슈도 나열 가능. 자동 종료 없이 그냥 참조만 걸고 싶으면 이 키워드 없이 `#N`만 쓰면 된다(연결은 되지만 닫히지 않음).

### 스코프를 판단하는 법 — "예시가 전부는 아니다"

이슈나 트래킹 문서에 나열된 예시 목록을 곧이곧대로 "이게 전부"라고 받아들이지 않는 게 중요하다. 실제로 같은 파일 안에서 동일한 문제 패턴을 다시 검색(`grep`)해서, 이슈 본문엔 없던 추가 대상을 찾아 같은 브랜치에서 함께 처리한 경험이 있다. "닫힌 집합을 문자열로 표현한다"처럼 **패턴 자체로 검색**하는 게, variant 이름을 하나하나 아는 것보다 누락을 줄이는 데 신뢰도가 높다.

반대로, 스코프를 넓히는 것과 무한정 손대는 것은 다르다. 자기 완결적인 수정과 설계 판단이 필요한 변경을 구분해서, 후자는 별도 이슈로 먼저 합의하는 편이 안전하다.

## 🔗 참고

- [GlueSQL GitHub](https://github.com/gluesql/gluesql)
- [(Rust) file-storage 원자적 쓰기 설계와 모듈 분리(GlueSQL #2016) - 핵심 개념 및 특징 정리]([Rust]%20file-storage%20원자적%20쓰기%20설계와%20모듈%20분리%28GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 위 방법으로 실제 기여 항목을 찾아 적용한 사례
- [(Rust) CREATE TABLE 옵션 거부(early-return 검증, GlueSQL #1972) - 핵심 개념 및 특징 정리]([Rust]%20CREATE%20TABLE%20옵션%20거부%28early-return%20검증,%20GlueSQL%20PR%201972%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 버그 리포트형 이슈 + Summary/Test plan형 PR의 실제 예
- [(Rust) TranslateError Enum 타입화(strum·thiserror, GlueSQL #1975) - 핵심 개념 및 특징 정리]([Rust]%20TranslateError%20Enum%20타입화%28strum·thiserror,%20GlueSQL%20Issue%201975%29%20-%20핵심%20개념%20및%20특징%20정리.md) — 제안/기능형 이슈 + 스코프를 넓혀 처리한 실제 예
