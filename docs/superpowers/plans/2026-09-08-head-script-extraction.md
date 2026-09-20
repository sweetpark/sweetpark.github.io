# Head.tsx Script Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the ~450-line untyped vanilla-JS IIFE embedded in `quartz/components/Head.tsx` via `dangerouslySetInnerHTML` into a typed, type-checked TypeScript module, without changing runtime behavior.

**Architecture:** Quartz already has a build-time mechanism for exactly this: any file named `*.inline.ts` gets picked up by a custom esbuild plugin (`inline-script-loader` in `quartz/cli/handlers.js:364-396`) that transpiles + bundles + minifies it and inlines the result as a string via `import x from "./foo.inline"`. This is how `spa.inline.ts` and `popover.inline.ts` already work (consumed in `quartz/plugins/emitters/componentResources.ts`). We will follow the exact same convention used there: a plain, testable `.ts` module with named exports (`head-enhancements.ts`, mirroring `scripts/util.ts`), plus a thin `.inline.ts` entry point that only wires up DOM event listeners (mirroring `spa.inline.ts`). Head.tsx will import the compiled string and wrap it in the same `(function () { ... })();` IIFE it uses today, so the script keeps executing at the exact same point in `<head>`, with the exact same global-scope isolation.

**Tech Stack:** TypeScript, Preact/JSX (Quartz components), esbuild (existing `inline-script-loader` plugin — no changes needed there), `@quartz-community/types` for `ContentIndex`/`ContentDetails`/`FullSlug`.

---

## Key facts gathered during investigation

- `quartz/components/Head.tsx:108-567` contains a single `<script dangerouslySetInnerHTML>` whose `__html` is one big template literal: `(function() { ... })();`.
- `globals.d.ts` (repo root) and `node_modules/@quartz-community/types/globals.d.ts` already declare `const fetchData: Promise<ContentIndex>` and `interface Window { addCleanup(...); spaNavigate?(...) }` globally, so no new ambient types are needed.
- `ContentIndex`, `ContentDetails`, `FullSlug` types come from the `@quartz-community/types` npm package (already a direct dependency, see `package.json:121`). `FullSlug = string & {...}`, so normal string methods work on it without casts.
- The `.inline.ts` esbuild loader (`quartz/cli/handlers.js:367-393`) does: read file as text → strip a leading `export default`/`export` (legacy, not needed by us) → re-bundle with `esbuild.build({ loader: "ts", bundle: true, minify: true, platform: "browser", format: "esm" })` → return the resulting text via esbuild's `loader: "text"`. Because there are no top-level exports left after bundling (no `export` statements in the entry file), the output is just minified top-level JS statements — **not** wrapped in an IIFE by the loader itself.
- Because tsc doesn't know about this esbuild loader, every existing consumer imports with `// @ts-ignore` right above the import (see `componentResources.ts:5,7`). We'll do the same in `Head.tsx`.
- `search.test.ts` explicitly avoids importing from `search.inline.ts` ("Inline the encoder function from search.inline.ts for testing") — `.inline.ts` files are entry points with side effects at module scope (`document.addEventListener(...)` at top level), not meant to be imported by tests or other modules. This is why we split pure logic into a plain `head-enhancements.ts` module (importable, side-effect-free) and keep `head-enhancements.inline.ts` as a thin wiring-only entry point — matching the existing `util.ts` / `spa.inline.ts` / `popover.inline.ts` split.
- Confirmed via `npx quartz build` (took ~70s, produced 2411 files in `public/`) that the build works fully offline in this repo (`cdnCaching: true` in `quartz.config.yaml` means the Google Fonts network fetch in `componentResources.ts` is skipped).
- Prettier config: no semicolons, `printWidth: 100`, 2-space indent, trailing commas everywhere (`.prettierrc`).
- `tsconfig.json` has `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` — but TS does not flag unused `catch (e) {}` bindings under `noUnusedLocals` (confirmed: `spa.inline.ts` already has `catch (e) {}` and passes `npm run check`), so we keep that style rather than switching to optional catch binding.

## Byte-diff caveat (read before Task 3)

The `.inline.ts` loader minifies its output; the current `Head.tsx` script is embedded **unminified**. A raw byte diff of `public/index.html` before/after will therefore show large textual differences even with zero behavior change — this is expected and is *not* a regression. Task 3's verification step accounts for this by diffing *stable literal substrings* (Korean UI strings, CSS class names, URLs, object keys) that a minifier does not rename, rather than the whole minified blob.

---

## File Structure

- **Create:** `quartz/components/scripts/head-enhancements.ts` — typed, side-effect-free module with named exports for every function currently in the IIFE. Importable and independently testable later (no DOM side effects at import time).
- **Create:** `quartz/components/scripts/head-enhancements.inline.ts` — thin entry point (mirrors `spa.inline.ts`): imports `initPageEnhancements`/`isPageReload`/the two cache-key constants from the module above, and performs the exact same two top-level statements the original script did (cache invalidation on reload, then readyState-gated init + `nav` listener registration), in the same order.
- **Modify:** `quartz/components/Head.tsx:1-6` (imports) and `:108-567` (script block) — replace the giant template literal with an import of the compiled inline script, wrapped in the same `(function () { ... })();` isolation the original had.

---

### Task 1: Create the typed `head-enhancements.ts` module

**Files:**
- Create: `quartz/components/scripts/head-enhancements.ts`

- [ ] **Step 1: Write the file**

```ts
import type { ContentDetails, ContentIndex, FullSlug } from "@quartz-community/types"

type CategoryMeta = { icon: string; color: string }

const CATEGORY_META: Record<string, CategoryMeta> = {
  "개발-(cs)": { icon: "💻", color: "#4a7fb5" },
  "프레임워크": { icon: "🔧", color: "#5c9e6f" },
  "개발-실무": { icon: "🛠️", color: "#d98c4a" },
  "프로젝트": { icon: "🚀", color: "#8a6fc9" },
  "코딩테스트": { icon: "🧩", color: "#d1555a" },
  "자격증": { icon: "📜", color: "#d1b23a" },
  "ai-도구": { icon: "🤖", color: "#3fada8" },
  "도메인": { icon: "🌐", color: "#5aa5c0" },
}
const DEFAULT_CATEGORY_META: CategoryMeta = { icon: "📄", color: "#9a9a9a" }

const GC_HOST = "sweetpark.goatcounter.com"
const GC_TOKEN = "1amers33u00l37dt2f1uioim723p8ovxsyzfdb5lgyiqagmivc"

export const HITS_MAP_KEY = "gc_hits_map"
export const HITS_TIME_KEY = "gc_hits_map_time"
const HITS_TTL_MS = 60 * 1000 // 1분 (기존 15분)

export const POPULAR_CACHE_KEY = "gc_popular_posts_data"
export const POPULAR_TIME_KEY = "gc_popular_posts_time"
const CACHE_TTL_MS = 60 * 1000 // 1분 (기존 30분)

export function addGlobalGraphBtn(): void {
  const toolbar = document.querySelector(".sidebar.left .flex-component")
  if (!toolbar || toolbar.querySelector(".toolbar-graph-btn")) return

  const wrapper = document.createElement("div")
  wrapper.style.cssText =
    "flex-grow: 0; flex-shrink: 1; flex-basis: auto; order: 0; align-self: center; justify-self: center;"

  const btn = document.createElement("button")
  btn.className = "toolbar-graph-btn"
  btn.setAttribute("aria-label", "전체 그래프 뷰 (Cmd+G)")
  btn.setAttribute("title", "전체 그래프 뷰 (단축키: Cmd+G)")
  btn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 55" fill="currentColor"><path d="M49,0c-3.309,0-6,2.691-6,6c0,1.035,0.263,2.009,0.726,2.86l-9.829,9.829C32.542,17.634,30.846,17,29,17s-3.542,0.634-4.898,1.688l-7.669-7.669C16.785,10.424,17,9.74,17,9c0-2.206-1.794-4-4-4S9,6.794,9,9s1.794,4,4,4c0.74,0,1.424-0.215,2.019-0.567l7.669,7.669C21.634,21.458,21,23.154,21,25s0.634,3.542,1.688,4.897L10.024,42.562C8.958,41.595,7.549,41,6,41c-3.309,0-6,2.691-6,6s2.691,6,6,6s6-2.691,6-6c0-1.035-0.263-2.009-0.726-2.86l12.829-12.829c1.106,0.86,2.44,1.436,3.898,1.619v10.16c-2.833,0.478-5,2.942-5,5.91c0,3.309,2.691,6,6,6s6-2.691,6-6c0-2.967-2.167-5.431-5-5.91v-10.16c1.458-0.183,2.792-0.759,3.898-1.619l7.669,7.669C41.215,39.576,41,40.26,41,41c0,2.206,1.794,4,4,4s4-1.794,4-4s-1.794-4-4-4c-0.74,0-1.424,0.215-2.019,0.567l-7.669-7.669C36.366,28.542,37,26.846,37,25s-0.634-3.542-1.688-4.897l9.665-9.665C46.042,11.405,47.451,12,49,12c3.309,0,6-2.691,6-6S52.309,0,49,0z M11,9c0-1.103,0.897-2,2-2s2,0.897,2,2s-0.897,2-2,2S11,10.103,11,9z M6,51c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S8.206,51,6,51z M33,49c0,2.206-1.794,4-4,4s-4-1.794-4-4s1.794-4,4-4S33,46.794,33,49z M29,31c-3.309,0-6-2.691-6-6s2.691-6,6-6s6,2.691,6,6S32.309,31,29,31z M47,41c0,1.103-0.897,2-2,2s-2-0.897-2-2s0.897-2,2-2S47,39.897,47,41z M49,10c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S51.206,10,49,10z"/></svg>'

  btn.addEventListener("click", (e) => {
    e.stopPropagation()
    const existingIcon = document.querySelector(".graph .global-graph-icon")
    if (existingIcon && existingIcon !== btn) {
      ;(existingIcon as HTMLElement).click()
      return
    }
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "g", metaKey: true, bubbles: true }))
  })

  wrapper.appendChild(btn)
  toolbar.appendChild(wrapper)
}

export function categoryFromHref(href: string | null): string {
  try {
    const url = new URL(String(href), location.href)
    const parts = decodeURIComponent(url.pathname).split("/").filter(Boolean)
    return parts[0] || ""
  } catch (e) {
    return ""
  }
}

export function enhanceRecentNotesCards(): void {
  const list = document.querySelector(".recent-notes .recent-ul")
  if (!list) return

  const items = list.querySelectorAll(".recent-li")
  for (let i = 0; i < items.length; i++) {
    const li = items[i]
    const link = li.querySelector(".desc a.internal")
    if (!link) continue

    const category = categoryFromHref(link.getAttribute("href"))
    const meta = CATEGORY_META[category] || DEFAULT_CATEGORY_META
    li.setAttribute("data-category", category)

    if (!li.querySelector(".recent-card-icon")) {
      const badge = document.createElement("div")
      badge.className = "recent-card-icon"
      badge.style.background = `linear-gradient(135deg, ${meta.color}cc, ${meta.color}55)`
      badge.textContent = meta.icon
      li.insertBefore(badge, li.firstChild)
    }
  }
}

export function localizeReadingTime(): void {
  const metaEls = document.querySelectorAll(".content-meta")
  for (let i = 0; i < metaEls.length; i++) {
    const spans = metaEls[i].querySelectorAll("span")
    for (let j = 0; j < spans.length; j++) {
      const span = spans[j]
      const m = /^(\d+)\s+min read$/.exec(span.textContent?.trim() ?? "")
      if (m) {
        span.textContent = `🕒 ${m[1]}분`
      }
    }
  }
}

export function computeTagFrequency(indexData: ContentIndex): Record<string, number> {
  const freq: Record<string, number> = {}
  const slugs = Object.keys(indexData) as FullSlug[]
  for (let i = 0; i < slugs.length; i++) {
    const tags = indexData[slugs[i]].tags || []
    for (let j = 0; j < tags.length; j++) {
      freq[tags[j]] = (freq[tags[j]] || 0) + 1
    }
  }
  return freq
}

export function renderTagCloudHtml(freq: Record<string, number>, container: HTMLElement): void {
  const entries = Object.keys(freq).map((tag) => ({ tag, count: freq[tag] }))
  entries.sort((a, b) => b.count - a.count)
  const top = entries.slice(0, 20)

  if (top.length === 0) {
    container.innerHTML = '<div class="tag-cloud-empty">아직 태그가 없습니다.</div>'
    return
  }

  const maxCount = top[0].count
  const minCount = top[top.length - 1].count
  let html = ""
  for (let i = 0; i < top.length; i++) {
    const item = top[i]
    const ratio = maxCount === minCount ? 1 : (item.count - minCount) / (maxCount - minCount)
    const tier = Math.min(4, Math.floor(ratio * 5))
    html +=
      `<a class="tag-pill tag-pill-${tier}" href="./tags/${item.tag}">` +
      `#${item.tag} <span class="tag-pill-count">${item.count}</span></a>`
  }
  container.innerHTML = html
}

export function renderTagCloud(): void {
  const container = document.getElementById("tag-cloud")
  if (!container) return
  if (typeof fetchData === "undefined") return

  fetchData
    .then((data) => {
      const freq = computeTagFrequency(data)
      renderTagCloudHtml(freq, container)
    })
    .catch(() => {
      container.innerHTML = '<div class="tag-cloud-empty">태그를 불러오지 못했습니다.</div>'
    })
}

export function currentSlugFromLocation(): string {
  const segments = decodeURIComponent(location.pathname).split("/").filter(Boolean)
  return segments.join("/")
}

export function isEligibleForPrevNext(slug: string): boolean {
  if (!slug) return false
  if (slug.indexOf("tags/") === 0) return false
  if (slug === "404") return false
  return true
}

export type PrevNextResult = {
  prev: ContentDetails | null
  next: ContentDetails | null
}

export function findPrevNext(indexData: ContentIndex, currentSlug: string): PrevNextResult | null {
  const currentEntry = indexData[currentSlug as FullSlug]
  if (!currentEntry) return null

  const parts = currentSlug.split("/")
  parts.pop()
  const parentFolder = parts.join("/")

  const siblings = Object.keys(indexData)
    .map((slug) => indexData[slug as FullSlug])
    .filter((entry) => {
      if (entry.slug === "index" || entry.slug.slice(-6) === "/index") return false
      const entryParts = entry.slug.split("/")
      entryParts.pop()
      return entryParts.join("/") === parentFolder
    })
    .sort((a, b) => (a.title || "").localeCompare(b.title || "", "ko"))

  let idx = -1
  for (let i = 0; i < siblings.length; i++) {
    if (siblings[i].slug === currentSlug) {
      idx = i
      break
    }
  }
  if (idx === -1 || siblings.length <= 1) return null

  return {
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx < siblings.length - 1 ? siblings[idx + 1] : null,
  }
}

export function renderPrevNextNav(result: PrevNextResult): HTMLElement {
  const prevHtml = result.prev
    ? `<a class="prev-next-link prev-link" href="/${result.prev.slug}">` +
      `<span class="prev-next-label">← 이전 글</span>` +
      `<span class="prev-next-title">${result.prev.title}</span></a>`
    : '<span class="prev-next-link prev-next-empty"></span>'
  const nextHtml = result.next
    ? `<a class="prev-next-link next-link" href="/${result.next.slug}">` +
      `<span class="prev-next-label">다음 글 →</span>` +
      `<span class="prev-next-title">${result.next.title}</span></a>`
    : '<span class="prev-next-link prev-next-empty"></span>'

  const nav = document.createElement("nav")
  nav.className = "prev-next-nav"
  nav.innerHTML = prevHtml + nextHtml
  return nav
}

export function renderPrevNext(): void {
  const slug = currentSlugFromLocation()
  if (!isEligibleForPrevNext(slug)) return

  const footer = document.querySelector(".page-footer")
  if (!footer || footer.querySelector(".prev-next-nav")) return
  if (typeof fetchData === "undefined") return

  fetchData
    .then((data) => {
      const result = findPrevNext(data, slug)
      if (!result || (!result.prev && !result.next)) return
      footer.insertBefore(renderPrevNextNav(result), footer.firstChild)
    })
    .catch(() => {})
}

export function isPageReload(): boolean {
  try {
    const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")
    if (nav && nav.length > 0) return (nav[0] as PerformanceNavigationTiming).type === "reload"
    return performance.navigation != null && performance.navigation.type === 1
  } catch (e) {
    return false
  }
}

export function normalizePath(p: string | null | undefined): string {
  if (!p) return ""
  try {
    p = decodeURIComponent(p)
  } catch (e) {}
  p = p.trim()
  while (p.length > 1 && p.endsWith("/")) {
    p = p.slice(0, -1)
  }
  return p || "/"
}

export type GoatCounterHit = {
  path: string
  count?: number
  title?: string
  event?: boolean
}

export function getHitsMapFromCache(): Record<string, number> | null {
  try {
    const time = localStorage.getItem(HITS_TIME_KEY)
    const data = localStorage.getItem(HITS_MAP_KEY)
    if (time && data && Date.now() - parseInt(time, 10) < HITS_TTL_MS) {
      return JSON.parse(data)
    }
  } catch (e) {}
  return null
}

export function saveHitsMap(hits: GoatCounterHit[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (let i = 0; i < hits.length; i++) {
    const h = hits[i]
    if (h && h.path) {
      map[normalizePath(h.path)] = Number(h.count || 0)
      map[h.path] = Number(h.count || 0)
    }
  }
  try {
    localStorage.setItem(HITS_MAP_KEY, JSON.stringify(map))
    localStorage.setItem(HITS_TIME_KEY, Date.now().toString())
  } catch (e) {}
  return map
}

type HitsFetchResult = { map: Record<string, number>; rawHits: GoatCounterHit[] }

let pendingHitsFetch: Promise<HitsFetchResult> | null = null

export function fetchStatsHits(
  callback?: (map: Record<string, number>, rawHits?: GoatCounterHit[]) => void,
): void {
  const cached = getHitsMapFromCache()
  if (cached) {
    if (callback) callback(cached)
    return
  }

  if (pendingHitsFetch) {
    pendingHitsFetch.then((res) => {
      if (callback) callback(res.map, res.rawHits)
    })
    return
  }

  const apiUrl = `https://${GC_HOST}/api/v0/stats/hits?limit=500`
  pendingHitsFetch = fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${GC_TOKEN}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Status ${res.status}`)
      return res.json()
    })
    .then((data) => {
      const rawHits: GoatCounterHit[] = data.hits || []
      const map = saveHitsMap(rawHits)
      pendingHitsFetch = null
      if (callback) callback(map, rawHits)
      return { map, rawHits }
    })
    .catch(() => {
      pendingHitsFetch = null
      if (callback) callback(cached || {}, [])
      return { map: cached || {}, rawHits: [] }
    })
}

export function updatePageViews(): void {
  const contentMeta = document.querySelector(".content-meta")
  if (!contentMeta) return

  let viewsBadge = contentMeta.querySelector(".page-views") as HTMLElement | null
  if (!viewsBadge) {
    viewsBadge = document.createElement("span")
    viewsBadge.className = "page-views"
    viewsBadge.title = "페이지 조회수"
    viewsBadge.innerHTML = '👀 <span class="gc-view-count">-</span>회'
    contentMeta.appendChild(viewsBadge)
  }

  const countSpan = viewsBadge.querySelector(".gc-view-count")
  const currentNorm = normalizePath(location.pathname)

  function applyCount(map: Record<string, number>): boolean {
    if (!countSpan) return false
    const count = map[currentNorm] !== undefined ? map[currentNorm] : map[location.pathname]
    if (count !== undefined) {
      countSpan.textContent = Number(count).toLocaleString()
      return true
    }
    return false
  }

  const cached = getHitsMapFromCache()
  if (cached && applyCount(cached)) {
    return
  }

  fetchStatsHits((map) => {
    if (!applyCount(map)) {
      if (countSpan && countSpan.textContent === "-") {
        countSpan.textContent = "0"
      }
      const countUrl = `https://${GC_HOST}/counter/${encodeURIComponent(decodeURIComponent(location.pathname))}.json`
      fetch(countUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`Status ${res.status}`)
          return res.json()
        })
        .then((data) => {
          if (countSpan && data.count) {
            countSpan.textContent = data.count
          }
        })
        .catch(() => {})
    }
  })
}

export function renderPopularPostsHtml(hits: GoatCounterHit[], container: HTMLElement): void {
  if (!hits || hits.length === 0) {
    container.innerHTML =
      '<div class="popular-empty">아직 집계된 조회수 데이터가 없습니다. 방문자가 유입되면 실시간으로 인기 글이 반영됩니다.</div>'
    return
  }

  let html = '<ul class="popular-ul">'
  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i]
    const rank = i + 1
    const rankClass = rank <= 3 ? `rank-top rank-${rank}` : `rank-${rank}`
    let title = hit.title || decodeURIComponent(hit.path.split("/").pop() || hit.path)
    title = title.replace(" | 차근차근정확하게", "").replace("| 차근차근정확하게", "")

    html +=
      `<li class="popular-li">` +
      `<div class="section">` +
      `<div class="desc">` +
      `<span class="popular-rank ${rankClass}">${rank}</span>` +
      `<a href="${hit.path}" class="internal">${title}</a>` +
      `</div>` +
      `<span class="popular-count">🔥 ${Number(hit.count || 0).toLocaleString()}회</span>` +
      `</div>` +
      `</li>`
  }
  html += "</ul>"
  container.innerHTML = html
}

export function fetchAndRenderPopularPosts(): void {
  const container = document.getElementById("popular-posts")
  if (!container) return

  try {
    const cachedTime = localStorage.getItem(POPULAR_TIME_KEY)
    const cachedData = localStorage.getItem(POPULAR_CACHE_KEY)
    if (cachedTime && cachedData && Date.now() - parseInt(cachedTime, 10) < CACHE_TTL_MS) {
      const parsed = JSON.parse(cachedData)
      renderPopularPostsHtml(parsed, container)
      return
    }
  } catch (e) {}

  fetchStatsHits((map, rawHits) => {
    rawHits = rawHits || []
    const filteredHits = rawHits.filter((h) => {
      if (!h.path || h.event) return false
      const p = normalizePath(h.path).toLowerCase()
      if (p === "/" || p === "/index" || p === "/index.html" || p === "/404") return false
      if (p.indexOf("/tags/") === 0 || p.indexOf("tags/") === 0) return false
      return true
    })

    const topHits = filteredHits.slice(0, 6)

    try {
      localStorage.setItem(POPULAR_CACHE_KEY, JSON.stringify(topHits))
      localStorage.setItem(POPULAR_TIME_KEY, Date.now().toString())
    } catch (e) {}

    renderPopularPostsHtml(topHits, container)
  })
}

export function initPageEnhancements(): void {
  addGlobalGraphBtn()
  updatePageViews()
  fetchAndRenderPopularPosts()
  enhanceRecentNotesCards()
  localizeReadingTime()
  renderTagCloud()
  renderPrevNext()
}
```

- [ ] **Step 2: Format and typecheck just this file**

Run: `npx prettier --write quartz/components/scripts/head-enhancements.ts && npx tsc --noEmit`
Expected: no errors. If `tsc` reports issues (e.g. a stricter `PerformanceNavigation` deprecation-as-error, or a `FullSlug` cast mismatch), fix the specific line — do not weaken types with `any`.

- [ ] **Step 3: Commit**

```bash
git add quartz/components/scripts/head-enhancements.ts
git commit -m "refactor: extract Head.tsx enhancement logic into typed module"
```

---

### Task 2: Create the thin `.inline.ts` entry point

**Files:**
- Create: `quartz/components/scripts/head-enhancements.inline.ts`

- [ ] **Step 1: Write the file**

This must preserve the *exact* execution order of the original script's two top-level side-effecting statements: (1) the reload-cache-invalidation block, then (2) the readyState-gated init + `nav` listener registration. All the function definitions it depends on are hoisted-equivalent (imported), so only these two statements' relative order matters.

```ts
import { HITS_TIME_KEY, initPageEnhancements, isPageReload, POPULAR_TIME_KEY } from "./head-enhancements"

// 새로고침(F5) 시 로컬 캐시를 무효화하여 즉시 최신 통계 조회
if (isPageReload()) {
  try {
    localStorage.removeItem(HITS_TIME_KEY)
    localStorage.removeItem(POPULAR_TIME_KEY)
  } catch (e) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageEnhancements)
} else {
  initPageEnhancements()
}
document.addEventListener("nav", initPageEnhancements)
```

- [ ] **Step 2: Format and typecheck**

Run: `npx prettier --write quartz/components/scripts/head-enhancements.inline.ts && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add quartz/components/scripts/head-enhancements.inline.ts
git commit -m "refactor: add inline entry point for Head.tsx enhancement script"
```

---

### Task 3: Wire it into Head.tsx and verify no behavior change

**Files:**
- Modify: `quartz/components/Head.tsx:1-6` (imports), `:108-567` (script block)

- [ ] **Step 1: Update imports in `Head.tsx`**

At the top of `quartz/components/Head.tsx` (after the existing imports, e.g. after line 6 `import { unescapeHTML } from "../util/escape"`), add:

```ts
// @ts-ignore
import headEnhancementsScript from "./scripts/head-enhancements.inline"
```

This mirrors the exact pattern used in `quartz/plugins/emitters/componentResources.ts:5-8` for `spa.inline`/`popover.inline` — the `@ts-ignore` is required because tsc resolves the import against the real `.ts` file (which has no default export); esbuild's `inline-script-loader` is what actually turns it into a string default-export at build time.

- [ ] **Step 2: Precompute the wrapped IIFE string**

Immediately after the imports (module scope, outside the `Head` component function), add:

```ts
const headEnhancementsIIFE = `(function () {\n${headEnhancementsScript}\n})();`
```

This reproduces the original's `(function() { ... })();` wrapper — required because the compiled module has top-level `const`/`function` declarations that would otherwise leak into the global scope of the classic (non-module) `<script>` tag, colliding with other scripts on the page. The original code had this exact isolation; we must keep it.

- [ ] **Step 3: Replace the script block**

In `quartz/components/Head.tsx`, replace the entire block from:

```tsx
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
```
... (through the end of the giant template literal) ...
```tsx
})();
`,
          }}
        />
```

(currently `Head.tsx:108-567`) with:

```tsx
        <script dangerouslySetInnerHTML={{ __html: headEnhancementsIIFE }} />
```

- [ ] **Step 4: Format and typecheck**

Run: `npm run check`
Expected: `tsc --noEmit` and `prettier . --check` both pass with no errors.

- [ ] **Step 5: Build BEFORE/AFTER comparison**

This step must be done carefully since `git stash` will be used to get a clean "before" build — make sure Task 1/2/3 commits exist first so `git stash` has nothing uncommitted to lose besides step 1-3's own uncommitted edits (there shouldn't be any, since each task commits its own work).

```bash
# Build with the OLD Head.tsx (script block not yet replaced) is already captured
# from the investigation baseline. Re-derive it fresh to be safe:
git stash
npx quartz build
mkdir -p /tmp/head-script-diff
cp public/index.html /tmp/head-script-diff/before.html
git stash pop

npx quartz build
cp public/index.html /tmp/head-script-diff/after.html
```

Run: `node --input-type=module -e "
import fs from 'fs'
const before = fs.readFileSync('/tmp/head-script-diff/before.html', 'utf8')
const after = fs.readFileSync('/tmp/head-script-diff/after.html', 'utf8')
const markers = [
  'sweetpark.goatcounter.com',
  'gc_hits_map',
  'gc_popular_posts_data',
  'recent-card-icon',
  'tag-pill-',
  'prev-next-nav',
  'popular-empty',
  'toolbar-graph-btn',
  '전체 그래프 뷰',
  '아직 태그가 없습니다',
  '아직 집계된 조회수 데이터가 없습니다',
  'M49,0c-3.309,0-6,2.691', // start of the graph-icon SVG path
]
for (const m of markers) {
  const inBefore = before.includes(m)
  const inAfter = after.includes(m)
  console.log((inBefore === inAfter ? 'OK  ' : 'FAIL'), JSON.stringify(m), inBefore, inAfter)
}
"`

Expected: every marker prints `OK` with `true true`. If any marker is `FAIL` or `true false`, a piece of logic or a literal string was lost in the extraction — go back to Task 1 and compare that function against the original in git history (`git show HEAD~3:quartz/components/Head.tsx` before this branch's commits, or the pre-extraction commit) line by line.

Note: a raw full-file diff between `before.html` and `after.html` around the head `<script>` tag is expected to be large (the new script is minified, the old one wasn't) — that alone is not a failure signal. See "Byte-diff caveat" above.

- [ ] **Step 6: Syntax-check the emitted script**

Extract just the new inline script and confirm it's valid, executable JS:

```bash
node -e "
const fs = require('fs')
const html = fs.readFileSync('public/index.html', 'utf8')
const marker = 'sweetpark.goatcounter.com'
const scriptStart = html.lastIndexOf('<script', html.indexOf(marker))
const scriptEnd = html.indexOf('</script>', scriptStart)
const openTagEnd = html.indexOf('>', scriptStart) + 1
fs.writeFileSync('/tmp/head-script-diff/extracted.js', html.slice(openTagEnd, scriptEnd))
"
node --check /tmp/head-script-diff/extracted.js
```

Expected: `node --check` exits with no output (valid syntax).

- [ ] **Step 7: Manual smoke test in a browser**

```bash
npm run docs
```

Open the served site and verify, on at least one content page and the index page:
- The graph toggle button appears in the left sidebar toolbar and clicking it opens the graph view.
- The page-view counter (👀) appears in the content meta area.
- "Popular posts" widget populates on the index page (or shows the empty-state message).
- Recent-notes cards show colored category badges.
- Reading time shows as "🕒 N분" instead of "N min read".
- The tag cloud renders on the index page.
- Prev/next navigation links appear at the bottom of a content page that has siblings.

Stop the dev server (Ctrl+C) once verified.

- [ ] **Step 8: Commit**

```bash
git add quartz/components/Head.tsx
git commit -m "refactor: wire typed head-enhancements module into Head.tsx"
```

---

## Self-Review

**Spec coverage:**
- Investigate build pipeline for typed `.ts` → inlined script string: done in "Key facts gathered" section — the existing `.inline.ts` esbuild loader in `quartz/cli/handlers.js` is reused as-is, no build config changes needed.
- Extract IIFE body into typed module, restore type-checking: Task 1 (pure logic) + Task 2 (wiring entry).
- Eventual testability: `head-enhancements.ts` has no side effects at import time and pure/DOM-manipulation functions are individually exported, so a future `head-enhancements.test.ts` (following the `search.test.ts`/`popover.test.ts` pattern already in the same directory) can import and test them directly — unlike `.inline.ts` files. Writing that test file is out of scope for this plan (not requested) and is a natural follow-up.
- No runtime behavior change: verified via Task 3 Steps 5-7 (marker-based diff, syntax check, manual smoke test).
- `npm run quartz -- build` succeeds: verified during investigation (build already confirmed working offline, ~70s) and re-verified in Task 3 Step 5.
- `npm run check` passes: Task 3 Step 4.

**Placeholder scan:** No TBD/TODO markers; all code blocks are complete, copy-pasteable implementations derived directly from the current `Head.tsx` script content.

**Type consistency:** `PrevNextResult`, `GoatCounterHit`, `CategoryMeta` are defined once in `head-enhancements.ts` and reused consistently; `HITS_TIME_KEY`/`POPULAR_TIME_KEY` are exported constants imported by the inline entry point rather than re-declared as string literals (avoids drift/typos between the two files).
