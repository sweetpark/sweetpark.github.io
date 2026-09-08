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

    fetchStatsHits(function(map, rawHits) {
      rawHits = rawHits || [];
      var filteredHits = rawHits.filter(function(h) {
        if (!h.path || h.event) return false;
        var p = normalizePath(h.path).toLowerCase();
        if (p === "/" || p === "/index" || p === "/index.html" || p === "/404") return false;
        if (p.indexOf("/tags/") === 0 || p.indexOf("tags/") === 0) return false;
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

  function initPageEnhancements() {
    addGlobalGraphBtn();
    updatePageViews();
    fetchAndRenderPopularPosts();
    enhanceRecentNotesCards();
    localizeReadingTime();
    renderTagCloud();
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
