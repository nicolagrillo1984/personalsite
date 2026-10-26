// Nicola Grillo — live tech & AI news (client-side, no backend)
// Static sites can't run a server-side cron job, so this pulls the latest
// headlines straight from each outlet's RSS feed through a read-only proxy
// (r.jina.ai) that returns clean, parseable text with full CORS support,
// then grabs a short real excerpt from each article itself. Everything is
// cached in localStorage for an hour so repeat visits are instant and the
// outlets aren't hit on every page load. If a source is unreachable the
// page still works — it just shows fewer cards, or a plain link fallback.
(function () {
  "use strict";

  var grid = document.querySelector("[data-news-grid]");
  if (!grid) return;

  var FEEDS = [
    { url: "https://techcrunch.com/category/artificial-intelligence/feed/", name: "TechCrunch" },
    { url: "https://www.technologyreview.com/feed/", name: "MIT Technology Review" },
    { url: "https://feeds.arstechnica.com/arstechnica/index", name: "Ars Technica" }
  ];
  var READER = "https://r.jina.ai/";
  var CACHE_KEY = "ng-news-cache-v3";
  var CACHE_TTL = 60 * 60 * 1000; // 1h
  var MAX_ITEMS = 6;
  var FETCH_TIMEOUT = 12000;

  var lang = document.documentElement.lang === "en" ? "en" : "it";
  var STR = {
    it: {
      readOn: "Leggi su",
      loadError: "Non è stato possibile caricare le ultime notizie in questo momento. Visita direttamente le fonti:",
      justNow: "adesso",
      hoursAgo: function (h) { return h + (h === 1 ? " ora fa" : " ore fa"); },
      daysAgo: function (d) { return d + (d === 1 ? " giorno fa" : " giorni fa"); }
    },
    en: {
      readOn: "Read on",
      loadError: "Couldn't load the latest news right now. Visit the sources directly:",
      justNow: "just now",
      hoursAgo: function (h) { return h + "h ago"; },
      daysAgo: function (d) { return d + "d ago"; }
    }
  }[lang];

  function timeAgo(date) {
    var diffMs = Date.now() - date.getTime();
    var h = Math.floor(diffMs / 3600000);
    if (h < 1) return STR.justNow;
    if (h < 24) return STR.hoursAgo(h);
    return STR.daysAgo(Math.floor(h / 24));
  }

  function escapeHtml(s) {
    return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fetchText(url) {
    var controller = ("AbortController" in window) ? new AbortController() : null;
    var timer = controller && setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT);
    return fetch(READER + url, { cache: "no-store", signal: controller && controller.signal })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("bad status " + res.status);
        return res.text();
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
  }

  // Parses the "### [title](link)\n\n[link](link)\ndate" list Jina Reader
  // produces when it renders an RSS feed.
  function parseFeedList(text, sourceName) {
    var items = [];
    var re = /###\s*\[([^\]]+)\]\(([^)]+)\)\s*\n\n\[[^\]]*\]\([^)]*\)\s*\n([^\n]+)/g;
    var m;
    while ((m = re.exec(text)) && items.length < 4) {
      var dateStr = m[3].trim();
      var date = new Date(dateStr);
      items.push({
        title: m[1].trim(),
        link: m[2].trim(),
        date: isNaN(date.getTime()) ? new Date() : date,
        source: sourceName
      });
    }
    return items;
  }

  // Pulls a short, real excerpt from the article's own extracted text.
  function parseExcerpt(text) {
    var marker = "Markdown Content:";
    var idx = text.indexOf(marker);
    var body = idx >= 0 ? text.slice(idx + marker.length) : text;
    var lines = body.split("\n").map(function (l) { return l.trim(); });
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line) continue;
      if (/^(!\[|#|={2,}|-{2,}|\[Image)/.test(line)) continue;
      var plain = line
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_`#>]/g, "")
        .trim();
      if (plain.length > 40) {
        return plain.length > 150 ? plain.slice(0, 150).replace(/\s+\S*$/, "") + "…" : plain;
      }
    }
    return "";
  }

  function fetchFeedItems(feed) {
    return fetchText(feed.url)
      .then(function (text) { return parseFeedList(text, feed.name); })
      .catch(function () { return []; });
  }

  function withExcerpt(item) {
    return fetchText(item.link)
      .then(function (text) {
        item.excerpt = parseExcerpt(text);
        return item;
      })
      .catch(function () {
        item.excerpt = "";
        return item;
      });
  }

  function render(items) {
    if (!items.length) { renderFallback(); return; }
    grid.innerHTML = items.map(function (it) {
      var excerptHtml = it.excerpt ? "<p>" + escapeHtml(it.excerpt) + "</p>" : "<p>&nbsp;</p>";
      return (
        '<article class="news-card">' +
        '<div class="news-meta"><span class="news-source">' + escapeHtml(it.source) + "</span>" +
        '<span class="news-date">' + timeAgo(it.date) + "</span></div>" +
        "<h3>" + escapeHtml(it.title) + "</h3>" +
        excerptHtml +
        '<a class="news-link" href="' + it.link + '" target="_blank" rel="noopener noreferrer">' +
        STR.readOn + " " + escapeHtml(it.source) +
        ' <svg viewBox="0 0 16 16" fill="none"><path d="M4 12 12 4M6 4h6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>' +
        "</article>"
      );
    }).join("");
  }

  function renderFallback() {
    var links = FEEDS.map(function (f) {
      var host = f.url.replace(/^https?:\/\//, "").split("/")[0];
      return '<a href="https://' + host + '" target="_blank" rel="noopener">' + f.name + " ↗</a>";
    }).join(" · ");
    grid.innerHTML = '<p class="news-fallback">' + STR.loadError + " " + links + "</p>";
  }

  function fromCache() {
    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && Date.now() - cached.ts < CACHE_TTL && cached.items && cached.items.length) {
        return cached.items.map(function (it) { it.date = new Date(it.date); return it; });
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function toCache(items) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: items })); } catch (e) { /* ignore */ }
  }

  var cached = fromCache();
  if (cached) {
    render(cached);
    return;
  }

  Promise.all(FEEDS.map(fetchFeedItems))
    .then(function (results) {
      var all = [].concat.apply([], results);
      all.sort(function (a, b) { return b.date - a.date; });
      return all.slice(0, MAX_ITEMS);
    })
    .then(function (top) {
      if (!top.length) { renderFallback(); return; }
      Promise.all(top.map(withExcerpt)).then(function (withExcerpts) {
        toCache(withExcerpts);
        render(withExcerpts);
      });
    })
    .catch(renderFallback);
})();
