---
title: "[오픈소스] PR 본문 작성 템플릿과 컨벤션(GlueSQL 실전 사례)"
tags: [학습, 오픈소스, 오픈소스아카데미, PR, GitHub, 협업, GlueSQL, 템플릿]
created: 2026-09-20
modified: 2026-09-20
---

# PR 본문 작성 템플릿과 컨벤션 (GlueSQL 실전 사례)

> [!NOTE]
> 한국어로 먼저 쓰고 영어로 옮기는 워크플로를 전제로 정리한 문서. **한국어 초안 템플릿 → 영어 대응 표현 → 실제 제출 사례** 순서.
> 근거는 두 가지: ① GlueSQL 저장소에 머지된 타인의 PR(#2001, #2012, #2013), ② 내가 직접 작성한 PR(#1972, #1980 머지 / #2016 클로즈).

## 📌 개념

### 대전제 — 템플릿 파일이 없는 저장소가 많다

GlueSQL에는 `.github/PULL_REQUEST_TEMPLATE.md`가 **없음**. `CONTRIBUTING.md`도 없음. 이런 저장소에서는 **최근 머지된 PR 본문을 읽고 관행을 역추적**하는 게 유일한 방법.

```bash
# 저장소 관행 파악용 명령
gh pr list --repo <owner>/<repo> --state merged --limit 5 --json number,title,body

# 내가 과거에 쓴 PR 다시 보기
gh pr list --repo <owner>/<repo> --author <myname> --state all --limit 20 --json number,title,state,body

# 템플릿 파일 존재 여부
find .github -iname "*pull_request*"
```

> [!TIP]
> 템플릿이 없다고 아무렇게나 쓰면 리뷰어가 맥락을 재구성하느라 리뷰가 느려짐. 관행을 따르는 것 자체가 리뷰 비용을 낮추는 기여.

### PR 본문이 답해야 하는 4가지 질문

형식이 무엇이든 리뷰어의 머릿속 질문은 동일함.

| 질문 | 대응 섹션 |
| --- | --- |
| 뭐가 문제였나? | Summary 앞부분 (증상 + 원인) |
| 뭘 바꿨나? | Summary 불릿 / Changes |
| 왜 이 범위인가? (왜 더/덜 안 했나) | Scope note / Known limitations |
| 정말 동작하나? | Test plan / Testing |

3번을 빼먹는 경우가 많은데, **리뷰어가 가장 궁금해하는 지점**이라 명시하면 왕복이 크게 줄어듦.

## 🧩 한국어 초안 템플릿

### 기본형 (버그 수정 / 소규모 기능)

```markdown
**Summary**

<한 문단: 현재 코드가 무엇을 잘못하고 있는지 + 왜 문제인지>
<한 문단: 이 PR이 무엇을 바꾸는지>

**Changes**

- `경로/파일.rs`: <무엇을 어떻게>
- `경로/테스트.rs`: <어떤 케이스를 추가/수정>

**Test plan**

- [x] `cargo test -p ...` — N개 통과
- [x] `cargo clippy --all-targets -- -D warnings` — 클린
- [x] `cargo fmt --all -- --check`

Closes #<이슈번호>
```

### 확장형 (범위 판단이 필요한 경우)

```markdown
**Summary**

<문제 설명>

**Scope note:** <왜 A는 건드리지 않았는지. 별건으로 분리한 이유>

**Changes**

- ...

**Known limitations**

- <이 PR로도 남는 구멍 + 후속 계획>

**Test plan**

- [x] ...

Closes #<이슈번호>
```

> [!IMPORTANT]
> `Closes #N` / `Fixes #N`을 본문에 쓰면 머지 시 이슈가 **자동으로 닫힘**. 이슈를 닫으면 안 되는 경우(부분 해결)는 `Related to #N`을 씀 — GlueSQL #2028이 이 형태.

## 🌐 한국어 → 영어 대응 표현

직역하면 어색해지는 표현 위주로 정리.

| 한국어 | 영어 (권장) | 비고 |
| --- | --- | --- |
| ~하는 문제를 수정 | Fix an issue where ~ | `Fix the problem that`보다 자연스러움 |
| 조용히 무시되고 있었음 | were silently ignored | 실제 #1972에서 사용 |
| 명확한 에러를 던지도록 변경 | now surface a clear error instead of silently ignoring them | |
| 기존 패턴을 따름 | following the same pattern as the existing `X` | |
| ~는 의도적으로 건드리지 않음 | `X` is intentionally left untouched | 실제 #2016에서 사용 |
| 별건으로 분리했음 | out of scope for this PR — tracked separately | |
| 후속 PR로 추적 중 | tracked as a planned follow-up PR | |
| 기존 동작은 동일함 | `Display` output is byte-for-byte unchanged | 구체적으로 쓸수록 신뢰도↑ |
| 의존성 추가 없음 | no new crates were added | |
| 대표성이 있음 | this one backend's pass is representative of all of them | 전체를 못 돌렸을 때의 정당화 |

### 제목 규칙

- **명령형 + 대문자 시작 + 마침표 없음**
- `Add`, `Fix`, `Remove`, `Reject`, `Use`, `Plan`, `Deprecate`로 시작
- 70자 이내

| ❌ | ⭕ |
| --- | --- |
| `fixed a bug in glue.rs` | `Plan each statement right before executing it` |
| `Reject TEMPORARY/LIKE/CLONE options.` | `Reject TEMPORARY/LIKE/CLONE options on CREATE TABLE` |
| `translate error refactoring` | `Use typed enums for unsupported SQL options in translate errors` |

## 📊 GlueSQL 저장소의 두 가지 스타일

### 스타일 A — 저장소 다수파 (`##` + 불릿)

머지된 타인 PR(#2001, #2012, #2013)의 공통형.

```markdown
## Summary
- 동사로 시작하는 불릿 3~5개

## Testing
- 실제로 돌린 명령어

Closes #2009
```

- 배경 설명이 필요하면 `## Context` 추가 (#2012가 RFC 링크를 이렇게 붙임)
- 린트가 클린하지 않으면 **그 사실과 이유를 명시**하는 게 관행 (#2001이 pre-existing 실패를 그렇게 적음)

### 스타일 B — 내가 쓴 형태 (`**볼드**` + 산문 + 체크박스)

#1972, #1980에서 사용. **둘 다 머지됨** → 이 저장소에서 통함.

```markdown
**Summary**

<산문 문단>

**Changes**

- ...

**Test plan**

- [x] `명령어` — 결과
```

| | 스타일 A | 스타일 B (내 것) |
| --- | --- | --- |
| 헤더 | `## Summary` | `**Summary**` |
| Summary 형식 | 불릿 | **산문 문단** |
| 테스트 섹션명 | `## Testing` | `**Test plan**` |
| 체크박스 | 없음 | `- [x]` 사용 |

> [!NOTE]
> 둘 다 머지된 전례가 있으므로 **어느 쪽이든 무방**. 다만 한 PR 안에서는 일관되게. 산문형(B)은 "왜"를 길게 설명해야 하는 PR에, 불릿형(A)은 변경이 나열 가능한 PR에 유리.

## ✅ 내 PR 실제 사례 3건 복기

### #1972 — `Reject TEMPORARY/LIKE/CLONE options on CREATE TABLE` (MERGED)

- **구조**: `**Summary**`(불릿 3개) / `**Changes**`(파일별) / `**Test plan**`(체크박스 4개) / `Fixes #1973`
- **잘한 점**: `Changes`를 **파일 경로 단위**로 쪼개서 리뷰어가 diff와 1:1 대조 가능
- **잘한 점**: "기존 `UnsupportedInsertOption`/`UnsupportedUpdateOption`과 같은 패턴을 따름" — 새 컨벤션을 만든 게 아니라는 신호

### #1980 — `Use typed enums for unsupported SQL options in translate errors` (MERGED)

- **구조**: `**Summary**`(산문 + 변환 목록 7개) / `**Test plan**`(체크박스 5개) / `Closes #1975`
- **핵심 포인트 — 범위 확장의 정당화**:
  > "The issue only listed the first 5 as examples. `UnsupportedCreateTableOption` and `UnsupportedJoinConstraint` have the exact same closed-set-of-strings pattern, so I included them too rather than leaving inconsistent holdouts."

  이슈가 시킨 것보다 더 했을 때 **왜 그게 맞는지 먼저 설명**. 이게 없으면 리뷰어가 "왜 범위를 넘었냐"고 물음.
- **핵심 포인트 — 설계 선택의 근거**: `Serialize`를 derive 대신 `collect_str` 위임으로 구현한 이유를 "문자열이 두 군데로 갈라져 실제로 회귀가 났었다"는 **개발 중 겪은 사실**로 뒷받침
- **핵심 포인트 — 전체를 못 돌렸을 때**: 13개 스토리지 중 1개만 돌리고 "`translate()`가 스토리지를 건드리기 전에 실행되므로 이 하나가 전체를 대표한다"고 **논리로 커버**

### #2016 — `Write file-storage row data atomically...` (CLOSED, 미머지)

- **구조**: `## Summary` / `## Changes` / `## Known limitations` / `## Test plan`
- **잘한 점**: `Scope note`로 `delete_data`를 왜 안 건드렸는지 명시 (단일 `unlink`는 이미 원자적)
- **잘한 점**: `Known limitations`에 남은 크래시 윈도우를 **스스로 먼저 공개**
- **교훈**: 본문 품질과 머지 여부는 별개. 클로즈 사유는 본문이 아니라 **범위·설계 합의** 문제였음 → 큰 변경은 **PR 전에 이슈에서 방향 합의**를 먼저 받는 게 나음

> [!WARNING]
> `Known limitations`를 쓸 때는 반드시 **후속 계획과 함께** 적을 것. 한계만 나열하면 "미완성 PR"로 읽히고, 후속이 붙으면 "범위를 통제한 PR"로 읽힘.

## 🔁 제출 전 체크리스트

- [ ] 제목이 명령형·대문자 시작·마침표 없음·70자 이내인가
- [ ] Summary 첫 문단이 **증상과 원인**을 말하는가 (해결책부터 쓰지 않았는가)
- [ ] 범위를 넘거나 줄였다면 그 이유를 적었는가
- [ ] Test plan의 명령어를 **실제로 돌렸는가** (결과 숫자까지 적으면 좋음)
- [ ] `fmt` / `clippy` 결과를 적었는가 (클린하지 않으면 사유도)
- [ ] `Closes #N`이 있는가 (부분 해결이면 `Related to #N`)
- [ ] **커밋에 무관한 파일이 섞이지 않았는가** — 로컬 도구 설정(`.claude/`, `.mcp.json`, `graft/`, 에디터 설정)은 제외
- [ ] 브랜치가 최신 `main` 기준인가

> [!WARNING]
> `git add -A` / `git add .`는 로컬 도구 설정을 통째로 끌고 들어감. **파일명을 명시해서 스테이징**할 것.
> ```bash
> git add core/src/glue.rs pkg/rust/tests/glue.rs   # ⭕
> git add -A                                          # ❌
> ```

## 🔗 참고

- [GlueSQL PR #1972](https://github.com/gluesql/gluesql/pull/1972) — 내 첫 머지 PR, 파일별 Changes 구조
- [GlueSQL PR #1980](https://github.com/gluesql/gluesql/pull/1980) — 범위 확장·설계 선택 정당화 사례
- [GlueSQL PR #2016](https://github.com/gluesql/gluesql/pull/2016) — Scope note / Known limitations 사례 (클로즈)
- [GlueSQL PR #2001](https://github.com/gluesql/gluesql/pull/2001) — 저장소 다수파 스타일 + 린트 실패 명시 사례
- [GitHub Docs — Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)

## 관련 문서

- [(Rust) 오픈소스 컨트리뷰션 실전 가이드(이슈 찾기부터 PR 작성까지, GlueSQL 사례)](GlueSQL/2.%20[Rust]%20오픈소스%20컨트리뷰션%20실전%20가이드%28이슈%20찾기부터%20PR%20작성까지,%20GlueSQL%20사례%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) 오픈소스 PR 리뷰 대응기(CodeRabbit, GlueSQL #2016)](GlueSQL/7.%20[Rust]%20오픈소스%20PR%20리뷰%20대응기%28CodeRabbit,%20GlueSQL%20PR%202016%29%20-%20핵심%20개념%20및%20특징%20정리.md)
- [(Rust) Glue::execute 배치 planning 수정 계획(GlueSQL #2009)](GlueSQL/11.%20[Rust]%20Glue%20execute%20배치%20planning%20수정%20계획%28소유권·제네릭경계,%20GlueSQL%20Issue%202009%29%20-%20핵심%20개념%20및%20특징%20정리.md)
