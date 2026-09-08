# 블로그 UI 개선 설계

## 배경

sweetpark.github.io는 Quartz 기반 Obsidian 퍼블리싱 사이트로, 현재 위키/디지털가든에 가까운 UI(좌측 Explorer, 우측 Graph/Backlinks/TOC)를 갖추고 있다. 홈에는 이미 커스텀으로 구현된 "인기있는 글"(goatcounter 연동, `content/index.md` + `quartz/components/Head.tsx`)이 있다.

목표는 "제대로된 블로그"처럼 보이도록 콘텐츠 발견성과 읽기 경험을 개선하는 것. 아래 6개 기능을 이번 스펙 범위로 한다.

## 범위

1. 카드형 글 목록 (홈 "최근 글" 섹션)
2. 읽는시간 표시
3. 인기 태그(태그클라우드)
4. Prev/Next 네비게이션
5. Giscus 댓글 활성화
6. About 페이지

## 1. 카드형 글 목록

**현황**: 홈의 "최근 글"은 `@quartz-community/recent-notes` 플러그인이 렌더링하는 단순 텍스트 리스트(제목+태그).

**변경**: recent-notes 출력을 카드 그리드로 스타일링. 각 카드는:
- 카테고리 기반 그라데이션 배경 + 이모지 아이콘 플레이스홀더 (실제 썸네일 이미지 없음 — 553개 글 전수 확인, `image`/`thumbnail` frontmatter나 인라인 이미지 없음)
- 제목, 설명(`@quartz-community/description` 플러그인이 이미 추출), 날짜, 태그(최대 3개 표시)

카테고리 → 색상/아이콘 매핑 (7개 최상위 폴더 기준):
| 카테고리 | 색상 | 아이콘 |
|---|---|---|
| 개발 (CS) | 파랑 계열 | 💻 |
| 프레임워크 | 초록 계열 | 🔧 |
| 개발 실무 | 주황 계열 | 🛠️ |
| 프로젝트 | 보라 계열 | 🚀 |
| 코딩테스트 | 빨강 계열 | 🧩 |
| 자격증 | 노랑 계열 | 📜 |
| AI 도구 | 청록 계열 | 🤖 |

카테고리는 글 경로의 최상위 폴더명으로 판별. 매핑에 없는 경우(최상위 폴더 밖의 글) 기본 회색+📄로 폴백.

**구현 방식**: `recent-notes` 플러그인이 자체 렌더링 로직을 제공하므로, 플러그인 옵션으로 커스텀 렌더러 주입이 안 되면 컴포넌트를 감싸는 wrapper 컴포넌트를 새로 만들거나 CSS만으로 카드화(리스트 구조를 grid-template-columns로 배치 + 아이콘은 CSS `::before`/data attribute로 폴더명 기반 매핑)한다. 정확한 구현 경로는 계획 단계에서 `recent-notes` 플러그인 소스를 확인 후 결정.

## 2. 읽는시간 표시

**계산 방식**: 본문 글자수 기준, 분당 500자(한글 관례치)로 나눠 분 단위 반올림. 최소 1분 표시.

**표시 위치**: 글 상단, `@quartz-community/content-meta` 컴포넌트가 날짜를 표시하는 자리 옆에 "🕒 N분" 추가.

**구현**: 빌드타임에 마크다운 본문 텍스트 길이를 계산하는 신규 컴포넌트(또는 content-meta 확장) 필요. 정확히는 content-meta 플러그인을 감쌀지, 별도 컴포넌트로 병렬 배치할지 계획 단계에서 결정.

## 3. 인기 태그 (태그클라우드)

**배치**: 홈에서 "카테고리" 섹션과 "최근 글" 섹션 사이.

**로직**: 전체 콘텐츠의 태그 사용 빈도를 집계해 상위 20개를 추출. 빈도에 비례해 폰트 크기를 3~5단계로 차등 표시(pill/badge 형태). 클릭 시 해당 태그 페이지(`@quartz-community/tag-page`)로 이동.

**데이터 소스**: `@quartz-community/content-index` 플러그인이 이미 사이트 전체 인덱스를 생성하므로 여기서 태그 빈도를 뽑아낼 수 있는지 확인. 안 되면 빌드타임에 별도 집계 스크립트 필요.

## 4. Prev/Next 네비게이션

**기준**: 같은 폴더(카테고리) 내에서 파일명/제목 알파벳순으로 이전글/다음글 결정. 시리즈 개념이 폴더 구조로 이미 표현되어 있으므로 별도 frontmatter 필드 불필요.

**배치**: 백링크(backlinks, 우측 사이드바)는 그대로 유지. Prev/Next는 별도 컴포넌트로 `afterBody` 위치, 백링크 아래에 추가.

**폴더 내 글이 1개뿐이거나 첫/마지막 글인 경우**: 해당 방향 링크 숨김(비활성화 아님, 아예 렌더링 안 함).

## 5. Giscus 댓글

**현황**: `quartz.config.yaml`에 `@quartz-community/comments` 플러그인이 `provider: giscus`로 이미 정의돼 있으나 `enabled: false`.

**변경**:
- `enabled: true`로 전환
- `options`에 giscus repo, repo-id, category, category-id 채움 (giscus.app에서 발급 필요 — **사용자가 직접 GitHub repo의 Discussions 기능을 켜고 giscus.app에서 값을 발급받아야 함**, 에이전트가 대신 할 수 없는 부분)
- layout 위치는 기존 설정대로 `afterBody`, priority 10 유지

**의존성**: 이 항목은 사용자의 GitHub repo 설정(Discussions 활성화, giscus app 설치)이 선행되어야 완료 가능. 계획에는 "설정값 입력 자리 마련 + 안내"까지만 포함하고, 실제 ID 발급은 사용자 액션으로 남긴다.

## 6. About 페이지

**신규 파일**: `content/About.md`

**내용 구성** (사용자 추가 정보 필요 — 계획 단계 또는 구현 중 확인):
- 필자 소개 (이름/닉네임, 통신사 5G Core 개발 부서 근무 — 기존 메모리 기반)
- 블로그 목적 (이미 index.md에 있는 "차근차근, 정확하게" 문구 재사용 가능)
- 연락처/링크 (GitHub 등, 사용자 확인 필요)

네비게이션에 노출할지(예: 헤더/footer 링크) 여부도 계획 단계에서 결정.

## 아키텍처 메모

- 모든 신규 컴포넌트는 Quartz TSX 컴포넌트 패턴(`quartz/components/*.tsx`)을 따르고 `registry.ts`에 등록
- 스타일은 기존 `quartz/styles/custom.scss`에 이어서 추가 (신규 scss 파일 분리는 파일이 과도하게 커질 경우에만 고려)
- 카드/태그클라우드/prev-next는 모두 빌드타임 정적 데이터로 처리 (런타임 API 호출 없음) — "인기있는 글"만 예외적으로 goatcounter 런타임 fetch를 쓰는 기존 패턴 유지, 신규 기능은 이 패턴을 따르지 않음

## 테스트/검증

- `npx quartz build` 로컬 빌드 성공 확인
- 로컬 서버(`npx quartz build --serve`)로 홈/글 상세 페이지에서 6개 기능 육안 확인
- 다크모드/라이트모드 양쪽에서 카드·태그클라우드 색상 대비 확인
- 모바일 너비(예: 375px)에서 카드 그리드 반응형 확인

## 비고

- Giscus 댓글의 실제 활성화(Discussions 켜기, ID 발급)는 사용자 액션 필요 — 구현 계획에서 별도 단계로 명시
- About 페이지 문구는 사용자 확인 후 확정
