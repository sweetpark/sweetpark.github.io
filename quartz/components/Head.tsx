import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some((e) => e.name === "CustomOgImages")
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    const coreStylesheet = css[0]?.content
    const coreScript = js.find(
      (r) => r.loadTime === "beforeDOMReady" && r.contentType === "external",
    )

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {coreStylesheet && <link rel="preload" href={coreStylesheet} as="style" />}
        {coreScript && coreScript.contentType === "external" && (
          <link rel="preload" href={coreScript.src} as="script" />
        )}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="google-site-verification" content="Ge786HI5EClgz40IdlJ4kshz3Si98PXjN_YjYWGghKQ" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  function addGlobalGraphBtn() {
    var toolbar = document.querySelector(".sidebar.left .flex-component");
    if (!toolbar || toolbar.querySelector(".toolbar-graph-btn")) return;

    var wrapper = document.createElement("div");
    wrapper.style.cssText = "flex-grow: 0; flex-shrink: 1; flex-basis: auto; order: 0; align-self: center; justify-self: center;";

    var btn = document.createElement("button");
    btn.className = "toolbar-graph-btn";
    btn.setAttribute("aria-label", "전체 그래프 뷰 (Cmd+G)");
    btn.setAttribute("title", "전체 그래프 뷰 (단축키: Cmd+G)");
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 55" fill="currentColor"><path d="M49,0c-3.309,0-6,2.691-6,6c0,1.035,0.263,2.009,0.726,2.86l-9.829,9.829C32.542,17.634,30.846,17,29,17s-3.542,0.634-4.898,1.688l-7.669-7.669C16.785,10.424,17,9.74,17,9c0-2.206-1.794-4-4-4S9,6.794,9,9s1.794,4,4,4c0.74,0,1.424-0.215,2.019-0.567l7.669,7.669C21.634,21.458,21,23.154,21,25s0.634,3.542,1.688,4.897L10.024,42.562C8.958,41.595,7.549,41,6,41c-3.309,0-6,2.691-6,6s2.691,6,6,6s6-2.691,6-6c0-1.035-0.263-2.009-0.726-2.86l12.829-12.829c1.106,0.86,2.44,1.436,3.898,1.619v10.16c-2.833,0.478-5,2.942-5,5.91c0,3.309,2.691,6,6,6s6-2.691,6-6c0-2.967-2.167-5.431-5-5.91v-10.16c1.458-0.183,2.792-0.759,3.898-1.619l7.669,7.669C41.215,39.576,41,40.26,41,41c0,2.206,1.794,4,4,4s4-1.794,4-4s-1.794-4-4-4c-0.74,0-1.424,0.215-2.019,0.567l-7.669-7.669C36.366,28.542,37,26.846,37,25s-0.634-3.542-1.688-4.897l9.665-9.665C46.042,11.405,47.451,12,49,12c3.309,0,6-2.691,6-6S52.309,0,49,0z M11,9c0-1.103,0.897-2,2-2s2,0.897,2,2s-0.897,2-2,2S11,10.103,11,9z M6,51c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S8.206,51,6,51z M33,49c0,2.206-1.794,4-4,4s-4-1.794-4-4s1.794-4,4-4S33,46.794,33,49z M29,31c-3.309,0-6-2.691-6-6s2.691-6,6-6s6,2.691,6,6S32.309,31,29,31z M47,41c0,1.103-0.897,2-2,2s-2-0.897-2-2s0.897-2,2-2S47,39.897,47,41z M49,10c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S51.206,10,49,10z"/></svg>';

    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      var existingIcon = document.querySelector(".graph .global-graph-icon");
      if (existingIcon && existingIcon !== btn) {
        existingIcon.click();
        return;
      }
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "g", metaKey: true, bubbles: true }));
    });

    wrapper.appendChild(btn);
    toolbar.appendChild(wrapper);
  }

  var GC_HOST = "sweetpark.goatcounter.com";
  var GC_TOKEN = "1amers33u00l37dt2f1uioim723p8ovxsyzfdb5lgyiqagmivc";

  var HITS_MAP_KEY = "gc_hits_map";
  var HITS_TIME_KEY = "gc_hits_map_time";
  var HITS_TTL_MS = 60 * 1000; // 1분 (기존 15분)

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
    "ai-도구": { icon: "🤖", color: "#3fada8" },
    "도메인": { icon: "🌐", color: "#5aa5c0" }
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
    if (typeof fetchData === "undefined") return;

    fetchData.then(function(data) {
      var freq = computeTagFrequency(data);
      renderTagCloudHtml(freq, container);
    }).catch(function() {
      container.innerHTML = '<div class="tag-cloud-empty">태그를 불러오지 못했습니다.</div>';
    });
  }

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
        if (entry.slug === "index" || entry.slug.slice(-6) === "/index") return false;
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
    if (!footer) return;
    if (typeof fetchData === "undefined") return;

    fetchData.then(function(data) {
      // 초기 로드 시 DOMContentLoaded와 "nav" 이벤트가 거의 동시에 발생해
      // renderPrevNext()가 중복 호출될 수 있으므로, 비동기 콜백 안에서
      // (삽입 직전) 다시 한번 중복 여부를 확인해야 경쟁 조건을 막을 수 있다.
      if (footer.querySelector(".prev-next-nav")) return;
      var result = findPrevNext(data, slug);
      if (!result || (!result.prev && !result.next)) return;
      footer.insertBefore(renderPrevNextNav(result), footer.firstChild);
    }).catch(function() {});
  }

  function isPageReload() {
    try {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation");
      if (nav && nav.length > 0) return nav[0].type === "reload";
      return performance.navigation && performance.navigation.type === 1;
    } catch (e) {
      return false;
    }
  }

  // 새로고침(F5) 시 로컬 캐시를 무효화하여 즉시 최신 통계 조회
  if (isPageReload()) {
    try {
      localStorage.removeItem(HITS_TIME_KEY);
      localStorage.removeItem(POPULAR_TIME_KEY);
    } catch(e) {}
  }

  function normalizePath(p) {
    if (!p) return "";
    try {
      p = decodeURIComponent(p);
    } catch(e) {}
    p = p.trim();
    while (p.length > 1 && p.endsWith("/")) {
      p = p.slice(0, -1);
    }
    return p || "/";
  }

  function getHitsMapFromCache() {
    try {
      var time = localStorage.getItem(HITS_TIME_KEY);
      var data = localStorage.getItem(HITS_MAP_KEY);
      if (time && data && (Date.now() - parseInt(time, 10) < HITS_TTL_MS)) {
        return JSON.parse(data);
      }
    } catch(e) {}
    return null;
  }

  function saveHitsMap(hits) {
    var map = {};
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      if (h && h.path) {
        map[normalizePath(h.path)] = Number(h.count || 0);
        map[h.path] = Number(h.count || 0);
      }
    }
    try {
      localStorage.setItem(HITS_MAP_KEY, JSON.stringify(map));
      localStorage.setItem(HITS_TIME_KEY, Date.now().toString());
    } catch(e) {}
    return map;
  }

  var pendingHitsFetch = null;
  function fetchStatsHits(callback) {
    var cached = getHitsMapFromCache();
    if (cached) {
      if (callback) callback(cached);
      return;
    }

    if (pendingHitsFetch) {
      pendingHitsFetch.then(function(res) {
        if (callback) callback(res.map, res.rawHits);
      });
      return;
    }

    var apiUrl = "https://" + GC_HOST + "/api/v0/stats/hits?limit=500";
    pendingHitsFetch = fetch(apiUrl, {
      headers: {
        "Authorization": "Bearer " + GC_TOKEN
      }
    })
      .then(function(res) {
        if (!res.ok) throw new Error("Status " + res.status);
        return res.json();
      })
      .then(function(data) {
        var rawHits = data.hits || [];
        var map = saveHitsMap(rawHits);
        pendingHitsFetch = null;
        if (callback) callback(map, rawHits);
        return { map: map, rawHits: rawHits };
      })
      .catch(function() {
        pendingHitsFetch = null;
        if (callback) callback(cached || {}, []);
        return { map: cached || {}, rawHits: [] };
      });
  }

  function updatePageViews() {
    var contentMeta = document.querySelector(".content-meta");
    if (!contentMeta) return;

    var viewsBadge = contentMeta.querySelector(".page-views");
    if (!viewsBadge) {
      viewsBadge = document.createElement("span");
      viewsBadge.className = "page-views";
      viewsBadge.title = "페이지 조회수";
      viewsBadge.innerHTML = '👀 <span class="gc-view-count">-</span>회';
      contentMeta.appendChild(viewsBadge);
    }

    var countSpan = viewsBadge.querySelector(".gc-view-count");
    var currentNorm = normalizePath(location.pathname);

    function applyCount(map) {
      if (!countSpan) return false;
      var count = map[currentNorm] !== undefined ? map[currentNorm] : map[location.pathname];
      if (count !== undefined) {
        countSpan.textContent = Number(count).toLocaleString();
        return true;
      }
      return false;
    }

    var cached = getHitsMapFromCache();
    if (cached && applyCount(cached)) {
      return;
    }

    fetchStatsHits(function(map) {
      if (!applyCount(map)) {
        if (countSpan && countSpan.textContent === "-") {
          countSpan.textContent = "0";
        }
        var countUrl = "https://" + GC_HOST + "/counter/" + encodeURIComponent(decodeURIComponent(location.pathname)) + ".json";
        fetch(countUrl)
          .then(function(res) {
            if (!res.ok) throw new Error("Status " + res.status);
            return res.json();
          })
          .then(function(data) {
            if (countSpan && data.count) {
              countSpan.textContent = data.count;
            }
          })
          .catch(function() {});
      }
    });
  }

  function renderPopularPostsHtml(hits, container) {
    if (!hits || hits.length === 0) {
      container.innerHTML = '<div class="popular-empty">아직 집계된 조회수 데이터가 없습니다. 방문자가 유입되면 실시간으로 인기 글이 반영됩니다.</div>';
      return;
    }

    var html = '<ul class="popular-ul">';
    for (var i = 0; i < hits.length; i++) {
      var hit = hits[i];
      var rank = i + 1;
      var rankClass = rank <= 3 ? "rank-top rank-" + rank : "rank-" + rank;
      var title = hit.title || decodeURIComponent(hit.path.split("/").pop() || hit.path);
      title = title.replace(" | 차근차근정확하게", "").replace("| 차근차근정확하게", "");

      html += '<li class="popular-li">' +
        '<div class="section">' +
          '<div class="desc">' +
            '<span class="popular-rank ' + rankClass + '">' + rank + '</span>' +
            '<a href="' + hit.path + '" class="internal">' + title + '</a>' +
          '</div>' +
          '<span class="popular-count">🔥 ' + Number(hit.count || 0).toLocaleString() + '회</span>' +
        '</div>' +
      '</li>';
    }
    html += '</ul>';
    container.innerHTML = html;
  }

  function fetchAndRenderPopularPosts() {
    var container = document.getElementById("popular-posts");
    if (!container) return;

    try {
      var cachedTime = localStorage.getItem(POPULAR_TIME_KEY);
      var cachedData = localStorage.getItem(POPULAR_CACHE_KEY);
      if (cachedTime && cachedData && (Date.now() - parseInt(cachedTime, 10) < CACHE_TTL_MS)) {
        var parsed = JSON.parse(cachedData);
        renderPopularPostsHtml(parsed, container);
        return;
      }
    } catch (e) {}

    // 파일명 변경/이동으로 GoatCounter에 남은 옛 경로는 404가 되므로,
    // 현재 사이트(contentIndex)에 실제로 존재하는 slug만 인기 글 후보로 삼는다.
    var existingSlugs = Promise.resolve(null);
    if (typeof fetchData !== "undefined") {
      existingSlugs = fetchData.then(function(data) {
        var set = {};
        Object.keys(data).forEach(function(k) { set[k.toLowerCase()] = true; });
        return set;
      }).catch(function() { return null; });
    }

    Promise.all([new Promise(function(resolve) {
      fetchStatsHits(function(map, rawHits) { resolve(rawHits || []); });
    }), existingSlugs]).then(function(res) {
      var rawHits = res[0];
      var slugSet = res[1];
      var filteredHits = rawHits.filter(function(h) {
        if (!h.path || h.event) return false;
        var p = normalizePath(h.path).toLowerCase();
        if (p === "/" || p === "/index" || p === "/index.html" || p === "/404") return false;
        if (p.indexOf("/tags/") === 0 || p.indexOf("tags/") === 0) return false;
        if (slugSet && !slugSet[p.slice(1)]) return false;
        return true;
      });

      var topHits = filteredHits.slice(0, 6);

      try {
        localStorage.setItem(POPULAR_CACHE_KEY, JSON.stringify(topHits));
        localStorage.setItem(POPULAR_TIME_KEY, Date.now().toString());
      } catch (e) {}

      renderPopularPostsHtml(topHits, container);
    });
  }

  // 탐색기 폴더 옆에 하위 글 개수 "(N)" 표시 (티스토리 카테고리 스타일)
  function updateExplorerCounts() {
    var folders = document.querySelectorAll(".explorer-content .folder-container");
    for (var i = 0; i < folders.length; i++) {
      var container = folders[i];
      var li = container.parentElement;
      var button = container.querySelector(".folder-button");
      if (!li || !button) continue;

      var count = li.querySelectorAll("a.nav-file-title").length;
      var badge = button.querySelector(".folder-count");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "folder-count";
        button.appendChild(badge);
      }
      var text = "(" + count + ")";
      if (badge.textContent !== text) badge.textContent = text;
    }
  }

  var explorerObserver = null;
  function observeExplorer() {
    var target = document.querySelector(".explorer-content");
    if (!target) return;
    if (explorerObserver) explorerObserver.disconnect();
    explorerObserver = new MutationObserver(function() { updateExplorerCounts(); });
    explorerObserver.observe(target, { childList: true, subtree: true });
    updateExplorerCounts();
  }

  // 우측 목차 토글 버튼 (데스크톱: 평소엔 숨기고 아이콘 클릭 시 슬라이드로 표시)
  function setTocOpen(open) {
    document.body.classList.toggle("toc-open", open);
    var btn = document.querySelector(".toc-toggle-btn");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setupTocToggle() {
    var btn = document.querySelector(".toc-toggle-btn");
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "toc-toggle-btn";
      btn.type = "button";
      btn.setAttribute("aria-label", "목차 열기/닫기");
      btn.setAttribute("title", "목차");
      btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
      btn.addEventListener("click", function(e) {
        e.stopPropagation();
        setTocOpen(!document.body.classList.contains("toc-open"));
      });
      document.body.appendChild(btn);

      document.addEventListener("click", function(e) {
        if (!document.body.classList.contains("toc-open")) return;
        var t = e.target;
        if (t && t.closest && (t.closest(".right.sidebar") || t.closest(".toc-toggle-btn"))) return;
        setTocOpen(false);
      });
      document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") setTocOpen(false);
      });
    }

    // 목차가 없는 페이지(홈, 폴더, 태그 등)에서는 버튼 숨김
    var hasToc = !!document.querySelector(".right.sidebar .toc");
    btn.style.display = hasToc ? "" : "none";
    setTocOpen(false);
  }

  // 좌측 사이드바 프로필 카드 (블로그 이름 아래)
  function addProfileCard() {
    var title = document.querySelector(".left.sidebar .page-title");
    if (!title || document.querySelector(".profile-card")) return;

    var card = document.createElement("div");
    card.className = "profile-card";
    card.innerHTML =
      '<img class="profile-avatar" src="https://github.com/sweetpark.png?size=200" alt="sweetpark 프로필" width="100" height="100">' +
      '<div class="profile-name">sweetpark</div>' +
      '<div class="profile-desc">차근차근 정확하게 정리하는 개발 기록</div>' +
      '<a class="profile-link" href="https://github.com/sweetpark" target="_blank" rel="noopener">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>' +
      "<span>GitHub Repo</span></a>";
    title.parentNode.insertBefore(card, title.nextSibling);
  }

  // 글 상단 제목을 배경 배너(히어로) 섹션으로 구성
  function buildPostHero() {
    var header = document.querySelector(".page-header .popover-hint");
    if (!header || header.querySelector(".post-hero")) return;
    var h1 = header.querySelector("h1.article-title");
    var meta = header.querySelector(".content-meta");
    if (!h1 || !meta) return;

    var category = categoryFromHref(location.href);
    var color = (CATEGORY_META[category] || DEFAULT_CATEGORY_META).color;
    var crumbs = header.querySelectorAll(".breadcrumb-element a");
    var categoryName = crumbs.length > 1 ? crumbs[1].textContent : "";

    var hero = document.createElement("section");
    hero.className = "post-hero";
    hero.style.setProperty("--hero-color", color);

    var inner = document.createElement("div");
    inner.className = "post-hero-inner";
    hero.appendChild(inner);
    header.insertBefore(hero, h1);
    inner.appendChild(h1);
    inner.appendChild(meta);

    if (categoryName) {
      var cat = document.createElement("span");
      cat.className = "post-hero-category";
      cat.textContent = categoryName;
      meta.insertBefore(cat, meta.firstChild);
    }
  }

  // 스크롤로 제목 배너가 사라지면 상단에 제목 고정 바 표시
  function getStickyBar() {
    var bar = document.querySelector(".post-sticky-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "post-sticky-bar";
      bar.setAttribute("role", "button");
      bar.setAttribute("tabindex", "0");
      bar.setAttribute("title", "맨 위로");
      bar.innerHTML = '<span class="post-sticky-title"></span>';
      var toTop = function() { window.scrollTo({ top: 0, behavior: "smooth" }); };
      bar.addEventListener("click", toTop);
      bar.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toTop(); }
      });
      document.body.appendChild(bar);
    }
    return bar;
  }

  function updateStickyBar() {
    var bar = document.querySelector(".post-sticky-bar");
    var hero = document.querySelector(".post-hero");
    if (!bar) return;
    if (!hero) {
      bar.classList.remove("visible");
      return;
    }
    var center = document.querySelector(".center");
    if (center) {
      var rect = center.getBoundingClientRect();
      bar.style.left = rect.left + "px";
      bar.style.width = rect.width + "px";
    }
    bar.classList.toggle("visible", hero.getBoundingClientRect().bottom < 0);
  }

  var stickyBarBound = false;
  function setupStickyBar() {
    var hero = document.querySelector(".post-hero");
    var h1 = hero && hero.querySelector("h1.article-title");
    if (!hero || !h1) {
      updateStickyBar();
      return;
    }
    var bar = getStickyBar();
    bar.querySelector(".post-sticky-title").textContent = h1.textContent;
    if (!stickyBarBound) {
      stickyBarBound = true;
      window.addEventListener("scroll", updateStickyBar, { passive: true });
      window.addEventListener("resize", updateStickyBar);
    }
    updateStickyBar();
  }

  function initPageEnhancements() {
    addGlobalGraphBtn();
    addProfileCard();
    buildPostHero();
    setupStickyBar();
    observeExplorer();
    setupTocToggle();
    updatePageViews();
    fetchAndRenderPopularPosts();
    enhanceRecentNotesCards();
    localizeReadingTime();
    renderTagCloud();
    renderPrevNext();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPageEnhancements);
  } else {
    initPageEnhancements();
  }
  document.addEventListener("nav", initPageEnhancements);
})();
`,
          }}
        />
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
