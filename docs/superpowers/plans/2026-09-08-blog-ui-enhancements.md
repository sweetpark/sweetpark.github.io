# 블로그 UI 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sweetpark.github.io(Quartz 기반 블로그)에 카드형 글 목록, 읽는시간 한글화, 인기 태그, Prev/Next 네비게이션, Giscus 댓글, About 페이지를 추가해 "제대로된 블로그"에 가까운 UX를 만든다.

**Architecture:** 이 Quartz 배포는 `quartz.config.yaml`의 `layout:` 선언을 통해서만 컴포넌트를 배치할 수 있고, 그 컴포넌트는 반드시 `@quartz-community/*` 형태로 설치된 외부 플러그인이어야 한다(내부적으로 `componentRegistry`에 등록됨). `quartz/components/*.tsx`에 새 파일을 만들어도 플러그인으로 배포하지 않는 한 레이아웃에 연결할 방법이 없다. 따라서 이 저장소는 이미 "인기있는 글" 기능(`quartz/components/Head.tsx`)에서 쓴 패턴 — `<head>`에 인라인 스크립트를 심어 `DOMContentLoaded`/`nav`(SPA 재탐색) 이벤트마다 실행하고, `content/index.md`에 심어둔 placeholder `<div id="...">`나 기존 컴포넌트가 렌더링한 고정 HTML 구조(`.recent-notes`, `.content-meta`, `.page-footer`)를 DOM에서 찾아 후처리하는 방식 — 을 그대로 따른다. 새로 발견한 사실: `@quartz-community/content-meta`는 이미 `showReadingTime` 기본값이 켜져 있어 "N min read"가 이미 빌드되고 있다 (영어 미번역 상태) — 새로 만드는 게 아니라 한글화만 하면 된다.

**Tech Stack:** Quartz v5(Preact 기반 SSR), TypeScript, SCSS, Vanilla JS(클라이언트 후처리 스크립트), GitHub CLI(`gh`, Giscus용 Discussions API 호출)

**테스트 전략에 대한 메모:** 이 저장소의 기존 클라이언트 보강 로직(`Head.tsx`의 IIFE)은 별도 모듈로 분리돼 있지 않고 `dangerouslySetInnerHTML` 문자열로 각 페이지 `<head>`에 인라인 삽입된다. 이 패턴을 그대로 따르는 이상 `npm test`(tsx --test)로 이 로직을 유닛 테스트할 수 없다 — 기존 코드도 테스트되어 있지 않다. 대신 각 태스크는 "빌드 → 생성된 `public/*.html` 또는 `public/static/*.json`에서 기대하는 문자열이 있는지 grep으로 확인" 하는 빌드 통합 검증으로 대체한다. 이는 정적 사이트 생성기 특성상 실질적으로 동등한 검증이다.

---

## 사전 확인

- [ ] **Step 1: 저장소 상태 확인**

```bash
cd /Users/wooyeong/0.study/9.blog/sweetpark.github.io
git status
```

Expected: `nothing to commit, working tree clean` (다른 미완료 변경사항이 없어야 다음 태스크들이 깨끗하게 diff됨)

---

## Task 1: 카드형 글 목록 (홈 "최근 글" 카드화)

**Files:**
- Modify: `quartz/components/Head.tsx:139-148` (상수 추가), `Head.tsx:361-365` (초기화 함수에 호출 추가)
- Modify: `quartz/styles/custom.scss` (끝에 카드 스타일 추가)

**배경:** `@quartz-community/recent-notes`는 HTML 구조가 고정돼 있어(`.recent-notes > .recent-ul > .recent-li`) 커스텀 렌더 함수를 넣을 수 없다. 카테고리 아이콘/그라데이션은 각 `.recent-li` 안의 링크 href에서 최상위 폴더 slug를 읽어 클라이언트에서 배지를 주입하는 방식으로 구현한다.

실제 카테고리 slug (public/index.html에서 확인한 실제 href 기준):
| 폴더 slug | 표시명 | 아이콘 |
|---|---|---|
| `개발-(cs)` | 개발 (CS) | 💻 |
| `프레임워크` | 프레임워크 | 🔧 |
| `개발-실무` | 개발 실무 | 🛠️ |
| `프로젝트` | 프로젝트 | 🚀 |
| `코딩테스트` | 코딩테스트 | 🧩 |
| `자격증` | 자격증 | 📜 |
| `ai-도구` | AI 도구 | 🤖 |

- [ ] **Step 1: Head.tsx에 카테고리 메타/카드 강화 함수 추가**

`quartz/components/Head.tsx`에서 아래 블록을 찾는다:

```typescript
  var POPULAR_CACHE_KEY = "gc_popular_posts_data";
  var POPULAR_TIME_KEY = "gc_popular_posts_time";
  var CACHE_TTL_MS = 60 * 1000; // 1분 (기존 30분)

  function isPageReload() {
```

이 사이에 다음을 삽입 (`CACHE_TTL_MS` 줄과 `function isPageReload()` 사이):

```typescript
  var POPULAR_CACHE_KEY = "gc_popular_posts_data";
  var POPULAR_TIME_KEY = "gc_popular_posts_time";
  var CACHE_TTL_MS = 60 * 1000; // 1분 (기존 30분)

  var CATEGORY_META = {
    "개발-(cs)": { icon: "💻", color: "#4a7fb5" },
    "프레임워크": { icon: "🔧", color: "#5c9e6f" },
    "개발-실무": { icon: "🛠️", color: "#d98c4a" },
    "프로젝트": { icon: "🚀", color: "#8a6fc9" },
    "코딩테스트": { icon: "🧩", color: "#d1555a" },
    "자격증": { icon: "📜", color: "#d1b23a" },
    "ai-도구": { icon: "🤖", color: "#3fada8" }
  };
  var DEFAULT_CATEGORY_META = { icon: "📄", color: "#9a9a9a" };

  function categoryFromHref(href) {
    try {
      var url = new URL(href, location.href);
      var parts = decodeURIComponent(url.pathname).split("/").filter(Boolean);
      return parts[0] || "";
    } catch (e) {
      return "";
    }
  }

  function enhanceRecentNotesCards() {
    var list = document.querySelector(".recent-notes .recent-ul");
    if (!list) return;

    var items = list.querySelectorAll(".recent-li");
    for (var i = 0; i < items.length; i++) {
      var li = items[i];
      var link = li.querySelector(".desc a.internal");
      if (!link) continue;

      var category = categoryFromHref(link.getAttribute("href"));
      var meta = CATEGORY_META[category] || DEFAULT_CATEGORY_META;
      li.setAttribute("data-category", category);

      if (!li.querySelector(".recent-card-icon")) {
        var badge = document.createElement("div");
        badge.className = "recent-card-icon";
        badge.style.background = "linear-gradient(135deg, " + meta.color + "cc, " + meta.color + "55)";
        badge.textContent = meta.icon;
        li.insertBefore(badge, li.firstChild);
      }
    }
  }

  function isPageReload() {
```

- [ ] **Step 2: initPageEnhancements에서 호출 추가**

`quartz/components/Head.tsx`에서 찾는다:

```typescript
  function initPageEnhancements() {
    addGlobalGraphBtn();
    updatePageViews();
    fetchAndRenderPopularPosts();
  }
```

다음으로 교체:

```typescript
  function initPageEnhancements() {
    addGlobalGraphBtn();
    updatePageViews();
    fetchAndRenderPopularPosts();
    enhanceRecentNotesCards();
  }
```

(Task 2~4에서 이 함수에 호출을 계속 추가할 예정이니 매번 같은 자리를 편집한다.)

- [ ] **Step 3: custom.scss에 카드 그리드 스타일 추가**

`quartz/styles/custom.scss` 파일 맨 끝에 추가:

```scss

// =============================================================================
// 최근 글 카드형 레이아웃
// =============================================================================
.recent-notes .recent-ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;

  .recent-li {
    position: relative;
    padding: 1rem;
    border: 1px solid var(--lightgray);
    border-radius: 10px;
    background-color: color-mix(in srgb, var(--light) 96%, var(--dark));
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: var(--gray);
    }

    .recent-card-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 8px;
      font-size: 1.15rem;
      margin-bottom: 0.6rem;
    }

    h3 {
      margin: 0 0 0.3rem 0;
      font-size: 1rem;
    }

    .meta {
      margin: 0 0 0.4rem 0;
      font-size: 0.8rem;
      color: var(--darkgray);
    }

    .tags {
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
  }
}
```

- [ ] **Step 4: 빌드 후 검증**

```bash
cd /Users/wooyeong/0.study/9.blog/sweetpark.github.io
npm run quartz -- build
grep -o 'data-category="ai-도구"' public/index.html | head -1
grep -o 'recent-card-icon' public/index.html | head -1
```

Expected: 두 grep 모두 최소 1줄 출력 (카테고리 속성과 아이콘 배지가 빌드된 HTML에 존재)

- [ ] **Step 5: Commit**

```bash
git add quartz/components/Head.tsx quartz/styles/custom.scss
git commit -m "$(cat <<'EOF'
feat(blog): 홈 최근 글을 카테고리 아이콘 카드 레이아웃으로 개선

recent-notes 플러그인 출력은 고정 HTML이라 클라이언트 스크립트로
카테고리별 그라데이션 아이콘 배지를 주입하고 CSS grid로 카드화했다.
EOF
)"
```

---

## Task 2: 읽는시간 한글화

**Files:**
- Modify: `quartz/components/Head.tsx` (함수 추가 + 호출 등록)

**배경:** `@quartz-community/content-meta`는 `showReadingTime` 기본값이 이미 켜져 있어 `.content-meta` 안에 `<span>9 min read</span>` 형태로 이미 렌더링되고 있다(확인: 빌드된 `public/개발-(cs)/네트워크/...html`). 플러그인 자체의 ko-KR 번역이 영어로 폴백되어 있어(`ko-KR readingTime: ({minutes}) => "${minutes} min read"`, 번역 미완성) 클라이언트에서 텍스트만 치환한다.

- [ ] **Step 1: localizeReadingTime 함수 추가**

`Head.tsx`에서 Task 1 Step 1에서 추가한 `enhanceRecentNotesCards` 함수 바로 뒤, `function isPageReload() {` 앞에 추가:

```typescript
  function localizeReadingTime() {
    var metaEls = document.querySelectorAll(".content-meta");
    for (var i = 0; i < metaEls.length; i++) {
      var spans = metaEls[i].querySelectorAll("span");
      for (var j = 0; j < spans.length; j++) {
        var span = spans[j];
        var m = /^(\d+)\s+min read$/.exec(span.textContent.trim());
        if (m) {
          span.textContent = "🕒 " + m[1] + "분";
        }
      }
    }
  }
```

- [ ] **Step 2: initPageEnhancements에 호출 추가**

```typescript
  function initPageEnhancements() {
    addGlobalGraphBtn();
    updatePageViews();
    fetchAndRenderPopularPosts();
    enhanceRecentNotesCards();
    localizeReadingTime();
  }
```

- [ ] **Step 3: 빌드 후 검증**

```bash
cd /Users/wooyeong/0.study/9.blog/sweetpark.github.io
npm run quartz -- build
grep -o 'localizeReadingTime' "public/개발-(cs)/네트워크/[tcp_ip]-네트워크-과정---핵심-개념-및-특징-정리.html" | head -1
```

Expected: `localizeReadingTime` 출력 (인라인 스크립트가 페이지에 포함됨을 확인). 실제 "🕒 9분" 치환은 브라우저 런타임에만 나타나므로 빌드 산출물 grep으로는 확인 불가 — Step 4에서 로컬 서버로 육안 확인한다.

- [ ] **Step 4: 로컬 서버로 육안 확인**

```bash
npm run quartz -- build --serve
```

브라우저에서 아무 글 페이지(예: `/개발-(cs)/네트워크/...`)를 열어 제목 아래 메타 영역에 "🕒 N분"이 보이는지 확인 후 서버 종료(Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add quartz/components/Head.tsx
git commit -m "$(cat <<'EOF'
feat(blog): 읽는시간 표시를 한글로 로컬라이즈

content-meta 플러그인의 ko-KR 읽는시간 번역이 영어로 폴백되어 있어
클라이언트에서 "N min read"를 "🕒 N분"으로 치환한다.
EOF
)"
```

---

## Task 3: 인기 태그 (태그클라우드)

**Files:**
- Modify: `quartz/components/Head.tsx` (contentIndex fetch 캐시 + 집계 + 렌더 함수)
- Modify: `content/index.md` (placeholder div 추가)
- Modify: `quartz/styles/custom.scss` (태그 pill 스타일)

**배경:** `@quartz-community/content-index` 플러그인이 빌드 시 `static/contentIndex.json`을 생성한다 (슬러그 → `{slug, filePath, title, links, tags, content}` 맵, 1086개 엔트리 확인됨). 사이트가 도메인 루트에 배포되므로 `/static/contentIndex.json` 절대경로로 어떤 페이지에서든 접근 가능하다.

- [ ] **Step 1: contentIndex 캐시 fetch 함수 추가**

`Head.tsx`의 `localizeReadingTime` 함수 뒤에 추가:

```typescript
  var CONTENT_INDEX_CACHE_KEY = "quartz_content_index_data";
  var CONTENT_INDEX_TIME_KEY = "quartz_content_index_time";
  var CONTENT_INDEX_TTL_MS = 5 * 60 * 1000; // 5분

  var pendingContentIndexFetch = null;
  function fetchContentIndex(callback) {
    try {
      var time = localStorage.getItem(CONTENT_INDEX_TIME_KEY);
      var data = localStorage.getItem(CONTENT_INDEX_CACHE_KEY);
      if (time && data && (Date.now() - parseInt(time, 10) < CONTENT_INDEX_TTL_MS)) {
        callback(JSON.parse(data));
        return;
      }
    } catch (e) {}

    if (pendingContentIndexFetch) {
      pendingContentIndexFetch.then(callback);
      return;
    }

    pendingContentIndexFetch = fetch("/static/contentIndex.json")
      .then(function(res) {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
      })
      .then(function(data) {
        pendingContentIndexFetch = null;
        try {
          localStorage.setItem(CONTENT_INDEX_CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CONTENT_INDEX_TIME_KEY, Date.now().toString());
        } catch (e) {}
        callback(data);
        return data;
      })
      .catch(function() {
        pendingContentIndexFetch = null;
        callback({});
      });
  }
```

- [ ] **Step 2: 태그 집계 + 렌더 함수 추가**

바로 뒤에 추가:

```typescript
  function computeTagFrequency(indexData) {
    var freq = {};
    var slugs = Object.keys(indexData);
    for (var i = 0; i < slugs.length; i++) {
      var tags = indexData[slugs[i]].tags || [];
      for (var j = 0; j < tags.length; j++) {
        freq[tags[j]] = (freq[tags[j]] || 0) + 1;
      }
    }
    return freq;
  }

  function renderTagCloudHtml(freq, container) {
    var entries = Object.keys(freq).map(function(tag) {
      return { tag: tag, count: freq[tag] };
    });
    entries.sort(function(a, b) { return b.count - a.count; });
    var top = entries.slice(0, 20);

    if (top.length === 0) {
      container.innerHTML = '<div class="tag-cloud-empty">아직 태그가 없습니다.</div>';
      return;
    }

    var maxCount = top[0].count;
    var minCount = top[top.length - 1].count;
    var html = "";
    for (var i = 0; i < top.length; i++) {
      var item = top[i];
      var ratio = maxCount === minCount ? 1 : (item.count - minCount) / (maxCount - minCount);
      var tier = Math.min(4, Math.floor(ratio * 5));
      html += '<a class="tag-pill tag-pill-' + tier + '" href="./tags/' + item.tag + '">' +
        "#" + item.tag + ' <span class="tag-pill-count">' + item.count + "</span></a>";
    }
    container.innerHTML = html;
  }

  function renderTagCloud() {
    var container = document.getElementById("tag-cloud");
    if (!container) return;

    fetchContentIndex(function(data) {
      var freq = computeTagFrequency(data);
      renderTagCloudHtml(freq, container);
    });
  }
```

- [ ] **Step 3: initPageEnhancements에 호출 추가**

```typescript
  function initPageEnhancements() {
    addGlobalGraphBtn();
    updatePageViews();
    fetchAndRenderPopularPosts();
    enhanceRecentNotesCards();
    localizeReadingTime();
    renderTagCloud();
  }
```

- [ ] **Step 4: content/index.md에 placeholder 추가**

`content/index.md`에서 카테고리 목록과 마지막 안내 문구 사이(`- [AI 도구](AI%20도구) — ...` 줄과 `왼쪽 탐색기에서...` 줄 사이)에 추가:

```markdown
- [AI 도구](AI%20도구) — AI 도구 활용법과 에이전트 설정

## 🏷️ 인기 태그

<div id="tag-cloud" class="tag-cloud">
  <div class="tag-cloud-loading">태그를 불러오는 중입니다...</div>
</div>

왼쪽 탐색기에서 폴더별로 둘러보시거나, 검색으로 원하는 주제를 찾아보세요.
```

- [ ] **Step 5: custom.scss에 태그 pill 스타일 추가**

`quartz/styles/custom.scss` 끝에 추가:

```scss

// =============================================================================
// 인기 태그 (태그클라우드)
// =============================================================================
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0 2rem 0;

  .tag-cloud-empty,
  .tag-cloud-loading {
    color: var(--darkgray);
    font-size: 0.9rem;
  }

  .tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background-color: var(--lightgray);
    color: var(--darkgray);
    text-decoration: none;
    transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;

    &:hover {
      background-color: var(--highlight);
      color: var(--secondary);
      transform: translateY(-1px);
    }

    .tag-pill-count {
      font-size: 0.7rem;
      opacity: 0.7;
    }

    &.tag-pill-4 { font-size: 1.05rem; font-weight: 700; color: var(--secondary); }
    &.tag-pill-3 { font-size: 0.98rem; font-weight: 600; }
    &.tag-pill-2 { font-size: 0.92rem; }
    &.tag-pill-1 { font-size: 0.86rem; }
    &.tag-pill-0 { font-size: 0.8rem; opacity: 0.85; }
  }
}
```

- [ ] **Step 6: 빌드 후 검증**

```bash
cd /Users/wooyeong/0.study/9.blog/sweetpark.github.io
npm run quartz -- build
test -f public/static/contentIndex.json && echo "contentIndex.json exists"
grep -o 'id="tag-cloud"' public/index.html | head -1
```

Expected: `contentIndex.json exists` 출력, `id="tag-cloud"` 출력 (실제 태그 pill은 런타임 렌더링이므로 Task 2와 동일하게 `npm run quartz -- build --serve`로 육안 확인)

- [ ] **Step 7: Commit**

```bash
git add quartz/components/Head.tsx content/index.md quartz/styles/custom.scss
git commit -m "$(cat <<'EOF'
feat(blog): 홈에 인기 태그(태그클라우드) 섹션 추가

contentIndex.json의 태그 빈도를 집계해 상위 20개를 크기 차등
pill로 렌더링한다. 카테고리 섹션과 최근 글 섹션 사이에 배치.
EOF
)"
```

---

## Task 4: Prev/Next 네비게이션

**Files:**
- Modify: `quartz/components/Head.tsx` (같은 폴더 형제글 탐색 + 렌더 함수)
- Modify: `quartz/styles/custom.scss` (nav 스타일)

**배경:** "같은 폴더"는 파일이 속한 **직계 상위 폴더**(top-level 카테고리가 아니라 slug의 마지막 세그먼트를 뺀 경로)를 의미한다 — 예: `ai-도구/pg-교육자료/[ai]-1차-...`, `ai-도구/pg-교육자료/[ai]-2차-...`는 같은 폴더(`ai-도구/pg-교육자료`)로 묶여 시리즈처럼 이어진다. 백링크(우측 사이드바)는 그대로 유지하고, Prev/Next는 `.page-footer`(afterBody 슬롯, 모든 페이지에 존재) 맨 앞에 삽입한다.

- [ ] **Step 1: 형제글 탐색 + 렌더 함수 추가**

`Head.tsx`의 `renderTagCloud` 함수 뒤에 추가:

```typescript
  function currentSlugFromLocation() {
    var segments = decodeURIComponent(location.pathname).split("/").filter(Boolean);
    return segments.join("/");
  }

  function isEligibleForPrevNext(slug) {
    if (!slug) return false;
    if (slug.indexOf("tags/") === 0) return false;
    if (slug === "404") return false;
    return true;
  }

  function findPrevNext(indexData, currentSlug) {
    var currentEntry = indexData[currentSlug];
    if (!currentEntry) return null;

    var parts = currentSlug.split("/");
    parts.pop();
    var parentFolder = parts.join("/");

    var siblings = Object.keys(indexData)
      .map(function(slug) { return indexData[slug]; })
      .filter(function(entry) {
        var entryParts = entry.slug.split("/");
        entryParts.pop();
        return entryParts.join("/") === parentFolder;
      })
      .sort(function(a, b) {
        return (a.title || "").localeCompare(b.title || "", "ko");
      });

    var idx = -1;
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i].slug === currentSlug) { idx = i; break; }
    }
    if (idx === -1 || siblings.length <= 1) return null;

    return {
      prev: idx > 0 ? siblings[idx - 1] : null,
      next: idx < siblings.length - 1 ? siblings[idx + 1] : null
    };
  }

  function renderPrevNextNav(result) {
    var prevHtml = result.prev
      ? '<a class="prev-next-link prev-link" href="/' + result.prev.slug + '">' +
          '<span class="prev-next-label">← 이전 글</span>' +
          '<span class="prev-next-title">' + result.prev.title + "</span></a>"
      : '<span class="prev-next-link prev-next-empty"></span>';
    var nextHtml = result.next
      ? '<a class="prev-next-link next-link" href="/' + result.next.slug + '">' +
          '<span class="prev-next-label">다음 글 →</span>' +
          '<span class="prev-next-title">' + result.next.title + "</span></a>"
      : '<span class="prev-next-link prev-next-empty"></span>';

    var nav = document.createElement("nav");
    nav.className = "prev-next-nav";
    nav.innerHTML = prevHtml + nextHtml;
    return nav;
  }

  function renderPrevNext() {
    var slug = currentSlugFromLocation();
    if (!isEligibleForPrevNext(slug)) return;

    var footer = document.querySelector(".page-footer");
    if (!footer || footer.querySelector(".prev-next-nav")) return;

    fetchContentIndex(function(data) {
      var result = findPrevNext(data, slug);
      if (!result || (!result.prev && !result.next)) return;
      footer.insertBefore(renderPrevNextNav(result), footer.firstChild);
    });
  }
```

- [ ] **Step 2: initPageEnhancements에 호출 추가**

```typescript
  function initPageEnhancements() {
    addGlobalGraphBtn();
    updatePageViews();
    fetchAndRenderPopularPosts();
    enhanceRecentNotesCards();
    localizeReadingTime();
    renderTagCloud();
    renderPrevNext();
  }
```

- [ ] **Step 3: custom.scss에 nav 스타일 추가**

```scss

// =============================================================================
// Prev/Next 네비게이션
// =============================================================================
.prev-next-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 0 0 1.5rem 0;

  .prev-next-link {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.8rem 1rem;
    border: 1px solid var(--lightgray);
    border-radius: 8px;
    text-decoration: none;
    color: var(--dark);
    transition: border-color 0.15s ease, background-color 0.15s ease;

    &:hover {
      border-color: var(--secondary);
      background-color: var(--highlight);
    }
  }

  .next-link {
    text-align: right;
    align-items: flex-end;
  }

  .prev-next-label {
    font-size: 0.75rem;
    color: var(--darkgray);
  }

  .prev-next-title {
    font-size: 0.9rem;
    font-weight: 600;
  }

  .prev-next-empty {
    visibility: hidden;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: 빌드 후 검증**

```bash
cd /Users/wooyeong/0.study/9.blog/sweetpark.github.io
npm run quartz -- build
grep -o 'renderPrevNext' "public/ai-도구/pg-교육자료/"*.html | head -1
```

Expected: `renderPrevNext` 출력 (스크립트가 포함됨을 확인). `npm run quartz -- build --serve`로 `AI 도구 > PG 교육자료` 폴더의 글 하나를 열어, 백링크가 그대로 있고 그 아래 본문 끝에 이전글/다음글 카드가 보이는지 육안 확인.

- [ ] **Step 5: Commit**

```bash
git add quartz/components/Head.tsx quartz/styles/custom.scss
git commit -m "$(cat <<'EOF'
feat(blog): 같은 폴더 내 이전글/다음글 네비게이션 추가

contentIndex.json에서 같은 상위 폴더의 글을 제목순으로 정렬해
prev/next를 계산하고 page-footer(afterBody) 맨 위에 삽입한다.
백링크는 그대로 유지.
EOF
)"
```

---

## Task 5: Giscus 댓글 활성화

**Files:**
- Modify: `quartz.config.yaml` (comments 플러그인 옵션)

**전제:** `gh auth login` 완료 상태 (사용자 확인됨). GitHub Discussions API로 repo ID와 카테고리 ID를 직접 조회해서 값을 채운다 — giscus.app UI를 거치지 않아도 된다.

- [ ] **Step 1: Discussions 활성화 여부 확인**

```bash
gh api repos/sweetpark/sweetpark.github.io --jq '.has_discussions'
```

- [ ] **Step 2: 비활성 상태면 활성화**

Step 1 결과가 `false`면 실행:

```bash
gh api -X PATCH repos/sweetpark/sweetpark.github.io -f has_discussions=true
gh api repos/sweetpark/sweetpark.github.io --jq '.has_discussions'
```

Expected: `true`

- [ ] **Step 3: 저장소 node ID와 Discussion 카테고리 ID 조회**

```bash
gh api graphql -f query='
query {
  repository(owner: "sweetpark", name: "sweetpark.github.io") {
    id
    discussionCategories(first: 10) {
      nodes { id name }
    }
  }
}'
```

출력에서 `repository.id` 값과, `discussionCategories.nodes` 중 이름이 `Announcements`인 항목의 `id` 값을 확인한다. `Announcements`가 없으면 목록에 있는 첫 번째 카테고리(보통 `General`)를 대신 사용한다.

- [ ] **Step 4: quartz.config.yaml 업데이트**

`quartz.config.yaml`에서 찾는다:

```yaml
  - source: "@quartz-community/comments"
    enabled: false
    options:
      provider: giscus
      options: {}
    layout:
      position: afterBody
      priority: 10
```

Step 3에서 얻은 실제 ID 값으로 교체 (아래는 형식 예시이며, `<REPO_NODE_ID>`와 `<CATEGORY_NODE_ID>`는 Step 3 출력값으로 치환):

```yaml
  - source: "@quartz-community/comments"
    enabled: true
    options:
      provider: giscus
      options:
        repo: "sweetpark/sweetpark.github.io"
        repoId: "<REPO_NODE_ID>"
        category: "Announcements"
        categoryId: "<CATEGORY_NODE_ID>"
        mapping: pathname
        lightTheme: light
        darkTheme: dark
        reactionsEnabled: true
        inputPosition: top
    layout:
      position: afterBody
      priority: 10
```

- [ ] **Step 5: 빌드 후 검증**

```bash
cd /Users/wooyeong/0.study/9.blog/sweetpark.github.io
npm run quartz -- build
grep -o 'giscus' "public/개발-(cs)/네트워크/"*.html | head -1
```

Expected: `giscus` 문자열 출력 (댓글 위젯 스크립트/컨테이너가 빌드된 페이지에 포함됨)

- [ ] **Step 6: Commit**

```bash
git add quartz.config.yaml
git commit -m "$(cat <<'EOF'
feat(blog): Giscus 댓글 활성화

GitHub Discussions를 저장소 데이터 저장소로 사용. repoId/categoryId는
gh api graphql로 직접 조회해 채웠다 (별도 DB 불필요).
EOF
)"
```

---

## Task 6: About 페이지

**Files:**
- Create: `content/About.md`
- Modify: `quartz.config.yaml` (footer 링크 — 현재 Quartz 프로젝트 자체 링크로 남아있는 기본값을 sweetpark 실제 링크로 교체)

**배경:** 현재 `quartz.config.yaml`의 footer 플러그인이 `GitHub: https://github.com/jackyzha0/quartz`, `Discord Community: ...` 같은 Quartz 업스트림 기본값을 그대로 쓰고 있다(커스터마이징 안 됨). About 페이지를 만들면서 이 부분도 sweetpark 본인 링크로 고친다.

- [ ] **Step 1: About.md 생성**

`content/About.md` 생성:

```markdown
---
title: "About"
---

# About

**sweetpark**의 개발 devlog입니다.

공부하고 정리한 내용을 차근차근, 정확하게 기록하는 공간입니다.

- GitHub: [github.com/sweetpark](https://github.com/sweetpark)
```

- [ ] **Step 2: footer 링크를 sweetpark 실제 링크로 교체**

`quartz.config.yaml`에서 찾는다:

```yaml
  - source: "@quartz-community/footer"
    enabled: true
    options:
      links:
        GitHub: https://github.com/jackyzha0/quartz
        Discord Community: https://discord.gg/cRFFHYye7t
    layout:
      position: footer
      priority: 50
```

다음으로 교체:

```yaml
  - source: "@quartz-community/footer"
    enabled: true
    options:
      links:
        About: ./About
        GitHub: https://github.com/sweetpark
    layout:
      position: footer
      priority: 50
```

- [ ] **Step 3: 빌드 후 검증**

```bash
cd /Users/wooyeong/0.study/9.blog/sweetpark.github.io
npm run quartz -- build
test -f public/About.html && echo "About page built"
grep -o 'href="https://github.com/sweetpark"' public/index.html | head -1
```

Expected: `About page built` 출력, GitHub 링크 출력

- [ ] **Step 4: Commit**

```bash
git add content/About.md quartz.config.yaml
git commit -m "$(cat <<'EOF'
feat(blog): About 페이지 추가, footer 링크를 실제 계정으로 교체

footer가 Quartz 업스트림 기본 링크를 그대로 쓰고 있던 것을
sweetpark 본인 GitHub + About 페이지 링크로 교체.
EOF
)"
```

---

## Task 7: 전체 통합 검증

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 클린 빌드**

```bash
cd /Users/wooyeong/0.study/9.blog/sweetpark.github.io
rm -rf public
npm run quartz -- build
```

Expected: 에러 없이 빌드 완료, `public/` 재생성

- [ ] **Step 2: 타입/포맷 체크**

```bash
npm run check
```

Expected: 타입 에러 없음 (prettier 포맷 이슈가 있으면 `npm run format` 실행 후 재확인)

- [ ] **Step 3: 로컬 서버로 6개 기능 육안 확인**

```bash
npm run quartz -- build --serve
```

브라우저에서 다음을 확인:
- 홈: 카드형 최근 글(카테고리 아이콘), 인기 태그 pill, 인기있는 글(기존 기능 정상 유지)
- 글 상세: 상단에 "🕒 N분" 읽는시간, 하단에 백링크(유지) + prev/next 네비게이션 + 댓글창
- 라이트/다크 모드 전환 시 카드·태그 pill·prev/next 대비 확인
- 모바일 너비(개발자도구 375px)에서 카드 그리드/prev-next가 1열로 접히는지 확인
- footer의 About 링크 클릭 → About 페이지 정상 표시

- [ ] **Step 4: 서버 종료 후 최종 상태 확인**

```bash
git log --oneline -8
git status
```

Expected: Task 1~6 커밋 6개(+ Step 1 사전확인 제외)가 보이고, working tree clean

---

## Self-Review 체크리스트 (구현자용)

- [ ] 스펙의 6개 기능이 각각 Task로 매핑되어 있는지 확인 (Task 1~6)
- [ ] 모든 코드 블록에 실제 실행 가능한 완전한 코드가 포함되어 있는지 확인 (TBD/TODO 없음)
- [ ] `initPageEnhancements()`에 새 함수 호출을 추가하는 순서가 Task 1→2→3→4 누적 순서와 일치하는지 확인
- [ ] Giscus repoId/categoryId는 Step 3의 실제 `gh api graphql` 출력값으로 채워야 함 — 플레이스홀더 그대로 커밋하지 않도록 주의
