import type { SearXNGResult } from "./types.js";
import { escapeHtml } from "./ui.js";
import { markdownToHtml } from "./markdown.js";
import { initTheme } from "./ui.js";
import { initAutocomplete } from "./autocomplete.js";

declare global {
  interface Window {
    cancelSse: () => void;
  }
}

const spinnerSvg = `<svg viewBox="0 0 48 48" width="24" height="24" style="overflow:hidden"><circle class="ping-center" cx="24" cy="24" r="4" fill="var(--primary)"/><circle class="ping-ring ping-ring-1" cx="24" cy="24" r="4" fill="none" stroke="var(--primary)" stroke-width="1.5"/><circle class="ping-ring ping-ring-2" cx="24" cy="24" r="4" fill="none" stroke="var(--primary)" stroke-width="1.5"/></svg>`;

const themeNames = ["gruvbox", "tokyonight", "dark-aero"];

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
        <div class="sidebar-loading">
          <span class="spinner">${spinnerSvg}</span>
          Analyzing...
        </div>
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

function buildSidebarLoadingMobile() {
  return `
        <div class="ai-overview-label">Generating AI Overview</div>
        <p class="ai-loading">
          <span class="spinner">${spinnerSvg}</span>
          Analyzing search results...
        </p>
        <button class="ai-cancel" onclick="window.cancelSse()">Cancel</div>
        <div class="sidebar-answer" id="mobile-sidebar-answer"></div>`;
}

function buildSidebarErrorMobile(error: string) {
  return `
        <div class="ai-overview-label">AI Overview unavailable</div>
        <p>${escapeHtml(error)}</p>`;
}

function buildSidebarPlaceholderMobile() {
  return `
        <div class="ai-overview-label">AI Overview</div>
        <p style="color: var(--text-muted); font-size: 13px;">AI overview will appear here when available.</p>`;
}

function buildResultsHtml(results: SearXNGResult[]) {
  if (results.length === 0) {
    return `<div class="empty-state"><h2>No results found</h2><p>Try different keywords or check your spelling.</p></div>`;
  }

  let html = "";
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
    if (r.engine) {
      html += `<span class="result-engine">${escapeHtml(r.engine)}</span>`;
    }
    html += `
        </article>`;
  }
  return html;
}

export function renderSearchPage(q: string, results: SearXNGResult[], error?: string, _category?: string) {
  const aiLoading = !error;
  const resultsCountHtml = results.length > 0
    ? `<div class="results-count">${results.length} result${results.length !== 1 ? "s" : ""} for "${escapeHtml(q)}"</div>`
    : "";
  const resultsHtml = buildResultsHtml(results);

  const sidebarContent = error ? buildSidebarError(error) : aiLoading ? buildSidebarLoading() : buildSidebarPlaceholder();
  const mobileContent = error ? buildSidebarErrorMobile(error) : aiLoading ? buildSidebarLoadingMobile() : buildSidebarPlaceholderMobile();

  document.title = `${escapeHtml(q)} - Aetherium Search`;
  document.body.innerHTML = `
  ${buildHeader(q)}
  <main class="content">
    <section class="ai-overview sidebar-empty" id="ai-overview-placeholder">${mobileContent}</section>
    <div class="content-layout">
      <div class="content-main">
        ${resultsCountHtml}
        ${resultsHtml}
      </div>
      <aside class="content-sidebar">
        <div class="sidebar-content">
          <div id="thinking-block" class="thinking-block" style="display: none;">
            <button class="thinking-toggle" onclick="this.classList.toggle('open'); this.nextElementSibling.classList.toggle('open');">
              <span class="thinking-toggle-label">Thinking</span>
            </button>
            <div class="thinking-content"></div>
          </div>
          <div class="sidebar-answer" id="sidebar-answer">
            ${sidebarContent}
          </div>
        </div>
      </aside>
    </div>
  </main>`;
  initTheme();
  initAutocomplete(true);
}

export function renderHome() {
  document.title = "Aetherium Search";
  document.body.innerHTML = `
  <div class="home">
    <div class="home-header">
      <h1><span>Aetherium</span> Search</h1>
      <div class="dropdown-wrap">
        <button class="theme-toggle">
          \u2699 <span class="theme-name">Theme</span>
        </button>
        <div class="dropdown" id="theme-dropdown">
          ${themeDotsHtml}
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
}

export function initSSE(urlParams: URLSearchParams) {
  const q = urlParams.get("q")!;
  const parts: string[] = [];
  for (const [key, value] of urlParams.entries()) {
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  const url = `/search/stream?${parts.join("&")}`;

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
    const sidebar = document.getElementById("sidebar-answer");
    if (sidebar) {
      sidebar.className = "sidebar-answer";
      sidebar.innerHTML = '<div class="ai-overview-label">AI Overview</div><p style="color: var(--text-muted); font-size: 13px;">Cancelled. Click a result or change your query.</p>';
    }
    const placeholder = document.getElementById("ai-overview-placeholder");
    if (placeholder) {
      placeholder.innerHTML = '<div class="ai-overview-label">AI Overview</div><p style="color: var(--text-muted); font-size: 13px;">Cancelled.</p>';
    }
    const thinking = document.getElementById("thinking-block");
    if (thinking) thinking.style.display = "none";
  };

  const sidebarAnswer = document.getElementById("sidebar-answer");
  const thinkingBlock = document.getElementById("thinking-block");
  const mobileSidebarAnswer = document.getElementById("mobile-sidebar-answer");

  let incrementalText: HTMLElement | null = null;
  let incrementalRawText = "";
  let mobileIncrementalText: HTMLElement | null = null;
  let mobileIncrementalRawText = "";
  let isStreaming = false;
  let scrollTarget = 0;
  let mobileScrollTarget = 0;
  let cancelled = false;

  sseSource = new EventSource(url);

  sseSource.addEventListener("session", (e: MessageEvent) => {
    sseSessionId = e.data;
  });

  sseSource.addEventListener("incremental", (e: MessageEvent) => {
    try {
      if (!sidebarAnswer) return;
      if (!isStreaming) {
        isStreaming = true;
        sidebarAnswer.className = "sidebar-answer";
        sidebarAnswer.innerHTML = '<div class="ai-overview-label">AI Overview</div>';
        const container = document.createElement("p");
        container.className = "sidebar-answer-text";
        container.style.cssText = "font-size:14px;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap;margin-bottom:12px;overflow-y:auto;";
        sidebarAnswer.appendChild(container);
        incrementalText = container;

        if (mobileSidebarAnswer) {
          const mobileContainer = document.createElement("p");
          mobileContainer.style.cssText = "color:var(--text-secondary);font-size:14px;line-height:1.7;white-space:pre-wrap;max-height:200px;overflow-y:auto;";
          mobileSidebarAnswer.appendChild(mobileContainer);
          mobileIncrementalText = mobileContainer;
        }
      }

      if (incrementalText) {
        incrementalRawText += e.data;
        if (!scrollTarget) scrollTarget = incrementalText.scrollHeight;
        else incrementalText.scrollTop = scrollTarget;
        incrementalText.innerHTML = markdownToHtml(incrementalRawText);
      }

      if (isStreaming && mobileIncrementalText) {
        mobileIncrementalRawText += e.data;
        if (!mobileScrollTarget) mobileScrollTarget = mobileIncrementalText.scrollHeight;
        else mobileIncrementalText.scrollTop = mobileScrollTarget;
        mobileIncrementalText.innerHTML = markdownToHtml(mobileIncrementalRawText);
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

  sseSource.addEventListener("overview", () => {
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
    queueMicrotask(() => { if (sseSource) { cancelled = true; sseSource.close(); sseSource = null; } });
  });

  sseSource.addEventListener("error", () => {
    if (cancelled || !sseSource || sseSource.readyState === EventSource.CLOSED) return;
    if (sidebarAnswer) {
      sidebarAnswer.className = "sidebar-answer error";
      sidebarAnswer.innerHTML = '<div class="ai-overview-label">AI Overview unavailable</div><p>AI overview unavailable</p>';
    }
    if (mobileSidebarAnswer) {
      mobileSidebarAnswer.className = "sidebar-answer error";
      mobileSidebarAnswer.innerHTML = '<p>AI overview unavailable</p>';
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
