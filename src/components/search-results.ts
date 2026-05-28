import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

export type ThemeMode = "dark" | "light" | "system";

export interface ThemeDefinition {
  name: string;
  label: string;
  colors: {
    background: string;
    surface: string;
    surfaceBorder: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryHover: string;
    accent: string;
    error: string;
    errorBg: string;
    inputBg: string;
    inputBorder: string;
    inputFocus: string;
    tagBg: string;
    tagText: string;
    link: string;
    divider: string;
    placeholder: string;
    shadow: string;
  };
}

export const themes: Record<string, ThemeDefinition> = {
  dark: {
    name: "dark",
    label: "Dark",
    colors: {
      background: "#0d1117",
      surface: "#161b22",
      surfaceBorder: "#30363d",
      text: "#c9d1d9",
      textSecondary: "#8b949e",
      textMuted: "#484f58",
      primary: "#58a6ff",
      primaryHover: "#79b8ff",
      accent: "#3fb950",
      error: "#f85149",
      errorBg: "#f8514914",
      inputBg: "#0d1117",
      inputBorder: "#30363d",
      inputFocus: "#58a6ff",
      tagBg: "#21262d",
      tagText: "#484f58",
      link: "#58a6ff",
      divider: "#21262d",
      placeholder: "#484f58",
      shadow: "#01040940"
    }
  },
  light: {
    name: "light",
    label: "Light",
    colors: {
      background: "#ffffff",
      surface: "#f6f8fa",
      surfaceBorder: "#d0d7de",
      text: "#1f2328",
      textSecondary: "#656d76",
      textMuted: "#8c959f",
      primary: "#0969da",
      primaryHover: "#0550ae",
      accent: "#1a7f37",
      error: "#cf222e",
      errorBg: "#ffccd5",
      inputBg: "#ffffff",
      inputBorder: "#d0d7de",
      inputFocus: "#0969da",
      tagBg: "#eff1f3",
      tagText: "#656d76",
      link: "#0969da",
      divider: "#d0d7de",
      placeholder: "#8c959f",
      shadow: "#0104091a"
    }
  },
  slate: {
    name: "slate",
    label: "Slate",
    colors: {
      background: "#0f172a",
      surface: "#1e293b",
      surfaceBorder: "#334155",
      text: "#e2e8f0",
      textSecondary: "#94a3b8",
      textMuted: "#475569",
      primary: "#818cf8",
      primaryHover: "#a5b4fc",
      accent: "#34d399",
      error: "#f87171",
      errorBg: "#f8717120",
      inputBg: "#0f172a",
      inputBorder: "#334155",
      inputFocus: "#818cf8",
      tagBg: "#1e293b",
      tagText: "#64748b",
      link: "#818cf8",
      divider: "#1e293b",
      placeholder: "#475569",
      shadow: "#00000050"
    }
  },
  ocean: {
    name: "ocean",
    label: "Ocean",
    colors: {
      background: "#0a192f",
      surface: "#112240",
      surfaceBorder: "#233554",
      text: "#ccd6f6",
      textSecondary: "#8892b0",
      textMuted: "#495670",
      primary: "#64ffda",
      primaryHover: "#80ffeb",
      accent: "#64ffda",
      error: "#ff6b6b",
      errorBg: "#ff6b6b20",
      inputBg: "#0a192f",
      inputBorder: "#233554",
      inputFocus: "#64ffda",
      tagBg: "#112240",
      tagText: "#495670",
      link: "#64ffda",
      divider: "#112240",
      placeholder: "#495670",
      shadow: "#00000060"
    }
  }
};

export interface SearXNGResult {
  title: string;
  url: string;
  img_src?: string;
  content?: string;
  engine?: string;
  parsed_url?: string[];
  score?: number;
}

export interface SearchResultsData {
  query: string;
  results: SearXNGResult[];
  aiOverview?: string;
  aiOverviewError?: string;
  aiOverviewLoading?: boolean;
  categories?: string[];
}

@customElement("search-results")
export class SearchResults extends LitElement {
  @property({ type: Object })
  data: SearchResultsData = { query: "", results: [] };

  @property({ type: String })
  theme: string = "dark";

  @property({ type: String })
  themeMode: ThemeMode = "dark";

  @state()
  private showThemePicker: boolean = false;

  private get currentTheme() {
    return themes[this.theme] || themes.dark;
  }

  private get colors() {
    return this.currentTheme.colors;
  }

  private get resolvedTheme() {
    if (this.themeMode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return this.themeMode;
  }

  private get resolvedColors() {
    return themes[this.resolvedTheme].colors;
  }

  static styles = css`
    :host {
      --bg: var(--colors-background);
      --surface: var(--colors-surface);
      --surface-border: var(--colors-surface-border);
      --text: var(--colors-text);
      --text-secondary: var(--colors-text-secondary);
      --text-muted: var(--colors-text-muted);
      --primary: var(--colors-primary);
      --primary-hover: var(--colors-primary-hover);
      --accent: var(--colors-accent);
      --error: var(--colors-error);
      --error-bg: var(--colors-error-bg);
      --input-bg: var(--colors-input-bg);
      --input-border: var(--colors-input-border);
      --input-focus: var(--colors-input-focus);
      --tag-bg: var(--colors-tag-bg);
      --tag-text: var(--colors-tag-text);
      --link: var(--colors-link);
      --divider: var(--colors-divider);
      --placeholder: var(--colors-placeholder);
      --shadow: var(--colors-shadow);

      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      display: block;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .header {
      background: var(--surface);
      border-bottom: 1px solid var(--surface-border);
      padding: 16px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-inner {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
    }

    .search-form {
      flex: 1;
      max-width: 640px;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 10px 40px 10px 16px;
      border: 1px solid var(--input-border);
      border-radius: 8px;
      background: var(--input-bg);
      color: var(--text);
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--input-focus);
      box-shadow: 0 0 0 3px var(--input-focus)22;
    }

    .search-input::placeholder {
      color: var(--placeholder);
    }

    .theme-toggle {
      background: none;
      border: 1px solid var(--surface-border);
      color: var(--text-secondary);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }

    .theme-toggle:hover {
      color: var(--text);
      border-color: var(--text-secondary);
    }

    .theme-picker {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 8px;
      display: flex;
      gap: 4px;
      box-shadow: 0 8px 24px var(--shadow);
      z-index: 200;
    }

    .theme-option {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .theme-option:hover {
      transform: scale(1.15);
    }

    .theme-option.active {
      border-color: var(--primary);
    }

    .theme-option[data-theme="dark"] { background: #0d1117; border: 1px solid #30363d; }
    .theme-option[data-theme="light"] { background: #ffffff; border: 1px solid #d0d7de; }
    .theme-option[data-theme="slate"] { background: #0f172a; border: 1px solid #334155; }
    .theme-option[data-theme="ocean"] { background: #0a192f; border: 1px solid #233554; }

    .content {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px;
    }

    .ai-overview {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }

    .ai-overview-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ai-overview-label::before {
      content: "\2726";
      font-size: 14px;
    }

    .ai-overview.error {
      border-color: var(--error);
      background: var(--error-bg);
    }

    .ai-overview.error .ai-overview-label {
      color: var(--error);
    }

    .ai-overview.error .ai-overview-label::before {
      content: "\26A0";
    }

    .ai-overview p {
      font-size: 15px;
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .ai-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
    }

    .spinner {
      flex-shrink: 0;
    }

    .spinner circle {
      stroke-dasharray: 31.4;
      stroke-dashoffset: 10;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); transform-origin: 12 12; }
    }

    .results-count {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }

    .result {
      padding: 20px 0;
      border-bottom: 1px solid var(--divider);
    }

    .result:last-child {
      border-bottom: none;
    }

    .result-url {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .result-title {
      font-size: 18px;
      margin-bottom: 6px;
    }

    .result-title a {
      color: var(--link);
      text-decoration: none;
    }

    .result-title a:hover {
      text-decoration: underline;
    }

    .result-snippet {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .result-engine {
      font-size: 11px;
      color: var(--tag-text);
      background: var(--tag-bg);
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-block;
      margin-top: 8px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 24px;
      color: var(--text-muted);
    }

    .empty-state h2 {
      font-size: 20px;
      margin-bottom: 8px;
      color: var(--text-secondary);
    }

    .search-btn {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: var(--primary);
      border: none;
      color: var(--bg);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    @media (max-width: 640px) {
      .header-inner { flex-wrap: wrap; }
      .search-form { order: 2; max-width: 100%; }
      .content { padding: 16px; }
    }
  `;

  render() {
    const { query, results, aiOverview, aiOverviewError, aiOverviewLoading } = this.data;

    return html`
      <header class="header">
        <div class="header-inner">
          <span class="logo" @click=${() => this.reset()}>Aetherium Search</span>
          <form class="search-form" @submit=${this.onSubmit} @reset=${this.reset}>
            <input
              type="search"
              class="search-input"
              name="q"
              placeholder="Search the web..."
              value="${query}"
              autofocus
            />
            <button type="submit" class="search-btn">\u2192</button>
          </form>
          <div style="position: relative;">
            <button class="theme-toggle" @click=${() => (this.showThemePicker = !this.showThemePicker)}>
              ${this.theme}
            </button>
            ${this.showThemePicker
              ? html`
                  <div class="theme-picker">
                    ${Object.values(themes).map(
                  (t) => html`
                        <div
                          class="theme-option ${this.theme === t.name ? "active" : ""}"
                          data-theme="${t.name}"
                          @click=${() => this.setTheme(t.name)}
                          title="${t.label}"
                        ></div>
                      `
                )}
                  </div>
                `
              : ""}
          </div>
        </div>
      </header>

      <main class="content">
        ${aiOverviewLoading && !aiOverview && !aiOverviewError
        ? html`
            <section class="ai-overview">
              <div class="ai-overview-label">Generating AI Overview</div>
              <p class="ai-loading">
                <svg class="spinner" viewBox="0 0 24 24" width="16" height="16">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Analyzing search results...
              </p>
            </section>
          `
        : ""}

        ${aiOverview
        ? html`
            <section class="ai-overview">
              <div class="ai-overview-label">AI Overview</div>
              <p>${aiOverview}</p>
            </section>
          `
        : ""}

        ${aiOverviewError
        ? html`
            <section class="ai-overview error">
              <div class="ai-overview-label">AI Overview unavailable</div>
              <p>${aiOverviewError}</p>
            </section>
          `
        : ""}

        <div class="results-count">
          ${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"
        </div>

        ${results.length === 0 && !aiOverviewError
        ? html`
            <div class="empty-state">
              <h2>No results found</h2>
              <p>Try different keywords or check your spelling.</p>
            </div>
          `
        : ""}

        ${results.map(
      (result) => html`
            <article class="result">
              <div class="result-url">
                ${result.parsed_url ? result.parsed_url.join(" > ") : result.url}
              </div>
              <h3 class="result-title">
                <a href="${result.url}" target="_blank" rel="noopener noreferrer">${result.title}</a>
              </h3>
              ${result.content
        ? html`<p class="result-snippet">${result.content}</p>`
        : ""}
              ${result.engine
        ? html`<span class="result-engine">${result.engine}</span>`
        : ""}
            </article>
          `
    )}
      </main>
    `;
  }

  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const q = (form.querySelector('[name="q"]') as HTMLInputElement).value.trim();
    if (q) {
      window.location.href = `/search?q=${encodeURIComponent(q)}`;
    }
  }

  reset() {
    window.location.href = "/";
  }

  setTheme(name: string) {
    this.theme = name;
    this.showThemePicker = false;
    document.cookie = `aetherium-theme=${name}; path=/; max-age=31536000`;
  }

  connectedCallback() {
    super.connectedCallback();
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("aetherium-theme="));
    if (cookie) {
      const themeName = cookie.split("=")[1];
      if (themes[themeName]) {
        this.theme = themeName;
      }
    }
  }
}
