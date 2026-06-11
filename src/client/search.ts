import type { SearXNGResult } from "./types.js";
import { escapeHtml } from "./ui.js";
import { markdownToHtml } from "./markdown.js";
import { initTheme } from "./ui.js";
import { initAutocomplete } from "./autocomplete.js";

declare global {
  interface Window {
    cancelSse: () => void;
    startResearch: () => void;
    researchMode: boolean;
    researchMaxSources: number;
    currentQuery: string;
    currentResults: SearXNGResult[];
    urlParams: URLSearchParams;
  }
}

const spinnerSvg = `<svg viewBox="0 0 48 48" width="24" height="24" style="overflow:hidden"><circle class="ping-center" cx="24" cy="24" r="4" fill="var(--primary)"/><circle class="ping-ring ping-ring-1" cx="24" cy="24" r="4" fill="none" stroke="var(--primary)" stroke-width="1.5"/><circle class="ping-ring ping-ring-2" cx="24" cy="24" r="4" fill="none" stroke="var(--primary)" stroke-width="1.5"/></svg>`;

function getCookie(name: string): string | null {
  const cookies = document.cookie.split("; ");
  for (const c of cookies) {
    const [key, ...valParts] = c.split("=");
    if (key === name) return valParts.join("=");
  }
  return null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000`;
}

function initColumnToggle(initialCount: number) {
  const columnCounts: number[] = [1, 2, 3];
  let currentIdx = columnCounts.indexOf(initialCount);
  if (currentIdx === -1) currentIdx = 1;

  const toggle = document.getElementById("column-toggle") as HTMLElement | null;
  if (!toggle) return;

  function updateColumns() {
    const count = columnCounts[currentIdx];
    setCookie("aetherium-columns", String(count));
    const grid = document.querySelector(".results-grid") as HTMLElement | null;
    if (grid) {
      grid.classList.remove("columns-2", "columns-3");
      if (count > 1) grid.classList.add(`columns-${count}`);
      grid.setAttribute("data-columns", String(count));
    }
  }

  toggle.addEventListener("click", (e) => {
    currentIdx = (currentIdx + 1) % columnCounts.length;
    updateColumns();
    e.stopPropagation();
  });

  updateColumns();
}

const themeNames = ["gruvbox", "tokyonight", "dark-aero", "paper", "midnight"];

const columnToggleSvg = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="8.5" y="0" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="0" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor"/></svg>`;

const themeDotsHtml = themeNames.map((name) =>
  `<div class="dropdown-item" data-theme="${name}" title="${name}"></div>`
).join("");

function buildHeader(q: string) {
  return `
  <header class="header">
    <div class="header-inner">
      <span class="logo" onclick="window.location.href='/'">Aetherium Search</span>
      <form class="search-form" action="/search" method="GET" id="search-form" autocomplete="off">
        <div style="position: relative;">
          <input type="search" class="search-input" name="q" id="search-input" placeholder="Search the web..." value="${escapeHtml(q)}" autofocus>
          <ul class="autocomplete-dropdown" id="autocomplete-dropdown"></ul>
        </div>
        <button type="submit" class="search-btn">\u2192</button>
      </form>
      <div class="controls">
        <button class="column-toggle" id="column-toggle" title="Toggle columns">
          ${columnToggleSvg}
        </button>
        <div class="dropdown-wrap">
          <button class="theme-toggle">
            \u2699 <span class="theme-name">Theme</span>
          </button>
          <div class="dropdown" id="theme-dropdown">
            ${themeDotsHtml}
          </div>
        </div>
      </div>
    </div>
  </header>`;
}

function buildSidebarLoading() {
  return `
        <div class="ai-overview-label">Generating AI Overview</div>
        <p class="ai-loading">
          <span class="spinner">${spinnerSvg}</span>
          Analyzing...
        </p>
        <button class="ai-cancel" onclick="window.cancelSse()">Cancel</button>`;
}

function buildSidebarError(error: string) {
  return `
        <div class="ai-overview-label">AI Overview unavailable</div>
        <p>${escapeHtml(error)}</p>`;
}

function buildSidebarPlaceholder() {
  return `
        <div class="ai-overview-label">AI Overview</div>
        <p style="color: var(--text-muted); font-size: 13px;">AI overview will appear here when available.</p>`;
}

function buildResultsHtml(results: SearXNGResult[], columnCount: number) {
  if (results.length === 0) {
    return `<div class="empty-state"><h2>No results found</h2><p>Try different keywords or check your spelling.</p></div>`;
  }

  const colClass = columnCount > 1 ? ` columns-${columnCount}` : "";
  let html = `<div class="results-grid${colClass}" data-columns="${columnCount}">`;
  for (const r of results) {
    const urlDisplay = r.parsed_url ? r.parsed_url.join(" \u203A ") : r.url;
    html += `
        <article class="result" data-result="true">
          <div class="result-url">${escapeHtml(urlDisplay)}</div>
          <h3 class="result-title">
            <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a>
          </h3>`;
    if (r.content) {
      html += `<p class="result-snippet">${escapeHtml(r.content)}</p>`;
    }
    const engineTags = (r.engines?.length ? r.engines : r.engine ? [r.engine] : []).map(e => `<span class="result-engine">${escapeHtml(e)}</span>`).join("");
    if (engineTags) {
      html += engineTags;
    }
    html += `
        </article>`;
  }
  html += `</div>`;
  return html;
}

export function renderSearchPage(q: string, results: SearXNGResult[], error?: string, _category?: string, researchMode?: boolean, researchMaxSources?: number) {
  const aiLoading = !error;
  const resultsCountHtml = results.length > 0
    ? `<div class="results-count">${results.length} result${results.length !== 1 ? "s" : ""} for "${escapeHtml(q)}"</div>`
    : "";
  const storedCols = getCookie("aetherium-columns");
  const columnCount = storedCols && ["1", "2", "3"].includes(storedCols) ? parseInt(storedCols) : 2;
  const resultsHtml = buildResultsHtml(results, columnCount);

  const overviewContent = error ? buildSidebarError(error) : aiLoading ? buildSidebarLoading() : buildSidebarPlaceholder();

  document.title = `${escapeHtml(q)} - Aetherium Search`;
  window.currentQuery = q;
  window.currentResults = results;
  window.researchMode = !!researchMode;
  window.researchMaxSources = researchMaxSources ?? 6;
  window.urlParams = new URLSearchParams(window.location.search);
  document.body.innerHTML = `
  ${buildHeader(q)}
  <main class="content">
    <div class="content-layout">
      <aside class="content-sidebar">
        <div class="sidebar-content">
          <div id="thinking-block" class="thinking-block" style="display: none;">
            <button class="thinking-toggle" onclick="this.classList.toggle('open'); this.nextElementSibling.classList.toggle('open');">
              <span class="thinking-toggle-label">Thinking</span>
            </button>
            <div class="thinking-content"></div>
          </div>
          <div class="sidebar-answer" id="ai-overview">
            ${overviewContent}
          </div>
        </div>
      </aside>
      <div class="content-main">
        ${resultsCountHtml}
        ${resultsHtml}
      </div>
    </div>
  </main>`;
  initTheme();
  initAutocomplete(true);
  initColumnToggle(columnCount);
}

export function renderHome() {
  const storedCols = getCookie("aetherium-columns");
  const columnCount = storedCols && ["1", "2", "3"].includes(storedCols) ? parseInt(storedCols) : 2;

  document.title = "Aetherium Search";
  document.body.innerHTML = `
  <div class="home">
    <div class="home-header">
      <h1><span>Aetherium</span> Search</h1>
      <div class="controls">
        <button class="column-toggle" id="column-toggle" title="Toggle columns">
          ${columnToggleSvg}
        </button>
        <div class="dropdown-wrap">
          <button class="theme-toggle">
            \u2699 <span class="theme-name">Theme</span>
          </button>
          <div class="dropdown" id="theme-dropdown">
            ${themeDotsHtml}
          </div>
        </div>
      </div>
    </div>
    <form action="/search" method="GET" id="home-search-form" autocomplete="off">
      <div style="position: relative; flex: 1;">
        <input type="search" id="home-search-input" name="q" placeholder="Search the web..." autofocus>
        <ul class="autocomplete-dropdown" id="home-autocomplete-dropdown"></ul>
      </div>
      <button type="submit">&#8594;</button>
    </form>
  </div>`;
  initTheme();
  initAutocomplete(false);
  initColumnToggle(columnCount);
}

export function initSSE(urlParams: URLSearchParams, scrapedContentId?: string, isResearch?: boolean) {
  const q = urlParams.get("q")!;
  const parts: string[] = [];
  for (const [key, value] of urlParams.entries()) {
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  let url = isResearch
    ? `/research/stream?${parts.join("&")}`
    : `/search/stream?${parts.join("&")}`;
  if (scrapedContentId) {
    url += `&scrapedContentId=${encodeURIComponent(scrapedContentId)}`;
  }

  let sseSource: EventSource | null = null;
  let sseSessionId: string | null = null;

  window.cancelSse = function () {
    cancelled = true;
    if (sseSessionId) {
      fetch("/search/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: sseSessionId }) }).catch(() => {});
    }
    if (sseSource) {
      sseSource.close();
      sseSource = null;
    }
    const overview = document.getElementById("ai-overview");
    if (overview) {
      overview.className = "sidebar-answer";
      overview.innerHTML = '<div class="ai-overview-label">AI Overview</div><p style="color: var(--text-muted); font-size: 13px;">Cancelled.</p>';
    }
    const thinking = document.getElementById("thinking-block");
    if (thinking) thinking.style.display = "none";
  };

  const aiOverview = document.getElementById("ai-overview");
  const thinkingBlock = document.getElementById("thinking-block");

  let incrementalText: HTMLElement | null = null;
  let incrementalRawText = "";
  let isStreaming = false;
  let scrollTarget = 0;
  let cancelled = false;
  let overviewCount = 0;

  sseSource = new EventSource(url);

  sseSource.addEventListener("session", (e: MessageEvent) => {
    sseSessionId = e.data;
  });

  sseSource.addEventListener("incremental", (e: MessageEvent) => {
    try {
      if (!aiOverview) return;
      if (!isStreaming) {
        isStreaming = true;
        aiOverview.className = "sidebar-answer";
        if (!isResearch) {
          aiOverview.innerHTML = '<div class="ai-overview-label">AI Overview</div>';
        } else {
          // Research mode: remove research spinner + button, keep existing content
          const spinner = aiOverview.querySelector(".research-spinner");
          if (spinner) spinner.remove();
          const btn = aiOverview.querySelector(".research-btn");
          if (btn) btn.remove();
        }
        const container = document.createElement("p");
        container.className = "sidebar-answer-text";
        container.style.cssText = "font-size:14px;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap;margin-bottom:12px;";
        aiOverview.appendChild(container);
        incrementalText = container;
      }

      if (incrementalText) {
        incrementalRawText += e.data;
        if (!scrollTarget) scrollTarget = incrementalText.scrollHeight;
        else incrementalText.scrollTop = scrollTarget;
        incrementalText.innerHTML = markdownToHtml(incrementalRawText);
      }
    } catch (err) {
      console.error("SSE incremental parse error:", err);
    }
  });

  sseSource.addEventListener("thinking", (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      if (thinkingBlock) {
        thinkingBlock.style.display = "block";
        const content = thinkingBlock.querySelector(".thinking-content");
        if (content) content.textContent = data.thinking;
      }
    } catch (err) {
      console.error("SSE thinking parse error:", err);
    }
  });

  sseSource.addEventListener("research-update", () => {
    if (!isResearch || !aiOverview) return;
    const thinking = document.getElementById("thinking-block");
    if (thinking) {
      thinking.style.display = "none";
      const toggle = thinking.querySelector(".thinking-toggle");
      if (toggle) toggle.classList.remove("open");
      const tc = thinking.querySelector(".thinking-content");
      if (tc) tc.classList.remove("open");
    }
    aiOverview.innerHTML = '<div class="ai-overview-label">Enhancing Overview...</div>';
    isStreaming = false;
    incrementalText = null;
    incrementalRawText = "";
    scrollTarget = 0;
  });

  sseSource.addEventListener("overview", () => {
    overviewCount++;
    try {
      if (thinkingBlock) {
        const toggle = thinkingBlock.querySelector(".thinking-toggle");
        if (toggle) toggle.classList.remove("open");
        const tc = thinkingBlock.querySelector(".thinking-content");
        if (tc) tc.classList.remove("open");
      }
    } catch (err) {
      console.error("SSE overview error:", err);
    }
    // Research complete: reset label
    if (isResearch) {
      const btn = aiOverview?.querySelector(".research-btn");
      if (btn) btn.remove();
      const label = aiOverview?.querySelector(".ai-overview-label");
      if (label) label.textContent = "AI Overview";
    }
    if (!isResearch && window.researchMode && aiOverview) {
      const btn = document.createElement("button");
      btn.className = "research-btn";
      btn.textContent = "Research";
      btn.onclick = window.startResearch;
      aiOverview.appendChild(btn);
    }
    queueMicrotask(() => { if (sseSource) { cancelled = true; sseSource.close(); sseSource = null; } });
  });

  sseSource.addEventListener("error", () => {
    if (cancelled || !sseSource || sseSource.readyState === EventSource.CLOSED) return;
    if (aiOverview && overviewCount === 0) {
      aiOverview.className = "sidebar-answer error";
      aiOverview.innerHTML = '<div class="ai-overview-label">AI Overview unavailable</div><p>AI overview unavailable</p>';
    }
    isStreaming = false;
    incrementalText = null;
    if (sseSource) { sseSource.close(); sseSource = null; }
  });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const result = target.closest("[data-result]");
    if (result && sseSource) {
      cancelled = true;
      sseSource.close();
      sseSource = null;
    }
  }, true);

  window.addEventListener("beforeunload", () => {
    if (sseSource) { cancelled = true; sseSource.close(); }
  });
}

window.startResearch = async function () {
  if (!window.currentResults || window.currentResults.length === 0) return;

  const overview = document.getElementById("ai-overview");
  if (overview) {
    const researchBtn = overview.querySelector(".research-btn");
    if (researchBtn) researchBtn.remove();
    overview.querySelector(".ai-overview-label").textContent = "Researching...";
    const spinner = document.createElement("p");
    spinner.className = "ai-loading research-spinner";
    spinner.innerHTML = `<span class="spinner">${spinnerSvg}</span> Analyzing sources...`;
    overview.appendChild(spinner);
  }

  const params = new URLSearchParams(window.location.search);
  initSSE(params, undefined, true);
};
