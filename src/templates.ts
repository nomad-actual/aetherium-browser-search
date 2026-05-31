import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { SearXNGResponse, SearXNGResult } from "./types.js";

export const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0d1117;
  --surface: #161b22;
  --surface-border: #30363d;
  --text: #c9d1d9;
  --text-secondary: #8b949e;
  --text-muted: #484f58;
  --primary: #58a6ff;
  --primary-hover: #79b8ff;
  --accent: #3fb950;
  --error: #f85149;
  --error-bg: #f8514914;
  --input-bg: #0d1117;
  --input-border: #30363d;
  --input-focus: #58a6ff;
  --tag-bg: #21262d;
  --tag-text: #484f58;
  --link: #58a6ff;
  --divider: #21262d;
  --placeholder: #484f58;
  --shadow: #01040940;
}

body {
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
  transition: background 0.3s, color 0.3s;
}

ul {
  white-space-collapse: collapse;
}

@keyframes chunkFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.streaming-chunk {
  display: inline;
  animation: chunkFadeIn 1.2s ease-in-out forwards;
}

.header {
  background: var(--surface);
  border-bottom: 1px solid var(--surface-border);
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.logo:hover {
  color: var(--primary);
}

.search-form {
  flex: 1;
  max-width: 560px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 9px 36px 9px 14px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text);
  font-size: 14px;
  outline: none;
  font-family: inherit;
}

.search-input:focus {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--input-focus) 15%, transparent);
}

.search-input::placeholder {
  color: var(--placeholder);
}

.search-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.search-btn:hover {
  color: var(--text);
  background: var(--surface-border);
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg);
  border: 1px solid var(--input-border);
  border-radius: 0 0 6px 6px;
  margin-top: -1px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 1000;
  display: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  list-style: none;
  padding: 4px 0;
}

.autocomplete-dropdown.visible {
  display: block;
}

.autocomplete-item {
  padding: 8px 14px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.autocomplete-item:hover,
.autocomplete-item.active {
  background: var(--surface-hover);
  color: var(--primary);
}

.autocomplete-item .autocomplete-icon {
  opacity: 0.4;
  flex-shrink: 0;
  font-size: 12px;
}

.autocomplete-item .autocomplete-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controls {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.dropdown-wrap {
  position: relative;
}

.style-toggle,
.theme-toggle {
  background: none;
  border: 1px solid transparent;
  color: var(--text-muted);
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  user-select: none;
}

.style-toggle:hover,
.theme-toggle:hover {
  color: var(--text-secondary);
  border-color: var(--surface-border);
  background: var(--surface);
}

.dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 6px;
  display: none;
  gap: 4px;
  box-shadow: 0 4px 16px var(--shadow);
  z-index: 200;
}
.dropdown.open {
  display: flex;
}

.dropdown-item {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.dropdown-item:hover {
  transform: scale(1.15);
}

.dropdown-item.active {
  border-color: var(--primary);
}

.dropdown-item[data-theme="gruvbox"] { background: #282828; border: 1px solid #504945; }
.dropdown-item[data-theme="tokyonight"] { background: #1a1b26; border: 1px solid #414868; }
.dropdown-item[data-theme="dark-aero"] { background: linear-gradient(135deg, #0a0e17, #1a2a4a); border: 1px solid #5ba0e6; }

.style-dropdown {
  flex-direction: column;
  align-items: stretch;
  padding: 4px;
  gap: 2px;
  min-width: 120px;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border: none;
  background: none;
  width: 100%;
  font-family: inherit;
  text-align: left;
}

.style-option:hover {
  background: var(--surface-border);
  color: var(--text);
}

.style-option.active {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
}

.style-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.style-dot.clean-dot { background: var(--text-muted); }
.style-dot.bold-dot { background: var(--primary); }

.content {
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px 24px 64px;
}

.content-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.content-main {
  max-width: 680px;
  flex-shrink: 0;
}

.content-sidebar {
  width: 600px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
}

.sidebar-content {
  margin-top: 16px;
}

.ai-overview {
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 20px 24px;
  border-left: 3px solid var(--primary);
}

.ai-overview-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-overview-label::before {
  content: "\u2726";
  font-size: 13px;
}

.ai-overview.error {
  border-left-color: var(--error);
  background: var(--error-bg);
}

.ai-overview.error .ai-overview-label {
  color: var(--error);
}

.ai-overview.error .ai-overview-label::before {
  content: "\u26A0";
}

.ai-overview.error .ai-overview-label {
  color: var(--error);
}

.ai-overview p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-top: 0;
  margin-bottom: 3px;
}

.ai-overview h1,
.ai-overview h2,
.ai-overview h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 5px 0 3px 0;
  line-height: 1.3;
}

.ai-overview h1:first-child,
.ai-overview h2:first-child,
.ai-overview h3:first-child {
  margin-top: 0;
}

.ai-overview code {
  background: color-mix(in srgb, var(--text-muted) 12%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  font-size: 12px;
}

.ai-overview pre {
  background: var(--input-bg);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 10px 14px;
  margin: 5px 0;
  overflow-x: auto;
}

.ai-overview pre code {
  background: none;
  padding: 0;
  font-size: 12px;
  line-height: 1.6;
}

.ai-overview blockquote {
  border-left: 3px solid var(--surface-border);
  padding: 4px 0 4px 14px;
  margin: 5px 0;
  color: var(--text-secondary);
}

.ai-overview hr {
  border: none;
  border-top: 1px solid var(--surface-border);
  margin: 5px 0;
}

.ai-overview ul,
.ai-overview ol {
  padding-left: 20px;
  margin: 2px 0;
}

.ai-overview li {
  margin-bottom: 0;
  line-height: 1.4;
  padding: 1px 0;
}

.ai-overview a {
  color: var(--primary);
  text-decoration: none;
}

.ai-overview a:hover {
  text-decoration: underline;
}

.ai-overview img {
  max-width: 100%;
  border-radius: 6px;
  margin: 4px 0;
}

.ai-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
}

.spinner svg {
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

.ai-cancel {
  display: block;
  margin-top: 8px;
  padding: 4px 12px;
  background: none;
  border: 1px solid var(--input-border);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  width: fit-content;
}

.ai-cancel:hover {
  border-color: var(--text-muted);
  color: var(--text);
}

.results-count {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.sidebar-empty {
  display: none;
}

.thinking-block {
  background: color-mix(in srgb, var(--primary) 4%, transparent);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.thinking-toggle {
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: left;
}

.thinking-toggle::before {
  content: "\u25BC";
  font-size: 9px;
  transition: transform 0.2s;
  display: inline-block;
}

.thinking-toggle.open::before {
  transform: rotate(-90deg);
}

.thinking-content {
  display: none;
  padding: 0 16px 12px 16px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.thinking-content.open {
  display: block;
}

.sidebar-answer {
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 20px 24px;
  border-left: 3px solid var(--primary);
}

.sidebar-answer :where(p, ul, ol, h1, h2, h3, h4, h5, h6, blockquote, pre, hr, table, figure) {
  margin-top: 0;
  margin-bottom: 0;
}

.sidebar-answer .ai-overview-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--primary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-answer .ai-overview-label::before {
  content: "\u2726";
  font-size: 13px;
}

.sidebar-answer.error {
  border-left-color: var(--error);
}

.sidebar-answer.error .ai-overview-label {
  color: var(--error);
}

.sidebar-answer.error .ai-overview-label::before {
  content: "\u26A0";
}

.sidebar-answer p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-top: 0;
  margin-bottom: 3px;
}

.sidebar-answer p:last-child {
  margin-bottom: 0;
}

.sidebar-answer h1,
.sidebar-answer h2,
.sidebar-answer h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 5px 0 3px 0;
  line-height: 1.3;
}

.sidebar-answer h1:first-child,
.sidebar-answer h2:first-child,
.sidebar-answer h3:first-child {
  margin-top: 0;
}

.sidebar-answer code {
  background: color-mix(in srgb, var(--text-muted) 12%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  font-size: 12px;
}

.sidebar-answer pre {
  background: var(--input-bg);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 10px 14px;
  margin: 5px 0;
  overflow-x: auto;
}

.sidebar-answer pre code {
  background: none;
  padding: 0;
  font-size: 12px;
  line-height: 1.6;
}

.sidebar-answer blockquote {
  border-left: 3px solid var(--surface-border);
  padding: 4px 0 4px 16px;
  margin: 5px 0;
  color: var(--text-secondary);
}

.sidebar-answer hr {
  border: none;
  border-top: 1px solid var(--surface-border);
  margin: 5px 0;
}

.sidebar-answer ul,
.sidebar-answer ol {
  padding-left: 24px;
  margin: 2px 0;
}

.sidebar-answer li {
  margin-bottom: 0;
  line-height: 1.4;
  padding: 1px 0;
}

.sidebar-answer a {
  color: var(--primary);
  text-decoration: none;
}

.sidebar-answer a:hover {
  text-decoration: underline;
}

.sidebar-answer img {
  max-width: 100%;
  border-radius: 6px;
  margin: 4px 0;
}

.sidebar-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
  padding: 8px 0;
}

.result {
  padding: 16px 0;
  border-bottom: 1px solid var(--divider);
}

.result:last-child {
  border-bottom: none;
}

.result-url {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 4px;
  font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.result-title {
  font-size: 17px;
  margin-bottom: 4px;
  line-height: 1.35;
}

.result-title a {
  color: var(--link);
  text-decoration: none;
}

.result-title a:hover {
  text-decoration: underline;
  color: var(--primary-hover);
}

.result-snippet {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-engine {
  font-size: 10px;
  color: var(--tag-text);
  background: var(--tag-bg);
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
  margin-top: 6px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--text-muted);
}

.empty-state h2 {
  font-size: 16px;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-weight: 500;
}

.empty-state p {
  font-size: 13px;
}

@media (max-width: 960px) {
  .content-sidebar { display: none; }
  .sidebar-empty { display: block; margin-bottom: 24px; }
}

@media (max-width: 640px) {
  .header-inner { flex-wrap: wrap; }
  .search-form { order: 2; max-width: 100%; flex-basis: 100%; }
  .controls { order: 1; margin-left: 0; }
  .content { padding: 16px 16px 48px; }
  .content-sidebar { display: none; }
  .sidebar-empty { display: block; }
}

body[data-theme="dark-aero"] .result {
  background: rgba(20, 30, 50, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(80, 140, 220, 0.15);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

body[data-theme="dark-aero"] .result:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

body[data-theme="dark-aero"] .result-url {
  color: rgba(74, 96, 128, 0.9);
}

body[data-theme="dark-aero"] .result-title a {
  color: #5ba0e6;
}

body[data-theme="dark-aero"] .result-title a:hover {
  color: #7ab8f5;
}

body[data-theme="dark-aero"] .result-snippet {
  color: rgba(143, 168, 200, 0.85);
}

body[data-theme="dark-aero"] .result-engine {
  background: rgba(20, 30, 50, 0.7);
  border: 1px solid rgba(80, 140, 220, 0.2);
  color: #4a6080;
}

body[data-theme="dark-aero"] .ai-overview {
  background: rgba(20, 30, 50, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

body[data-theme="dark-aero"] .sidebar-answer {
  background: rgba(20, 30, 50, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

body[data-theme="dark-aero"] .thinking-block {
  background: rgba(20, 30, 50, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

body[data-theme="dark-aero"] .header {
  background: rgba(20, 30, 50, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3), inset 0 -1px 0 rgba(80, 140, 220, 0.1);
}

body[data-theme="dark-aero"] .dropdown {
  background: rgba(20, 30, 50, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

body[data-theme="dark-aero"] .style-option {
  background: none;
}

body[data-theme="dark-aero"] .style-option:hover {
  background: rgba(80, 140, 220, 0.1);
}

body[data-theme="dark-aero"] .empty-state {
  background: rgba(20, 30, 50, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 80px 24px;
}
`.trim();

const dom = new JSDOM("");
const purify = DOMPurify(dom.window);

export function markdownToHtml(md: string): string {
  if (!md) return "";
  const rawHtml = marked.parse(md, { async: false }) as string;
  return purify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
}

export const THEMES = {
  gruvbox: {
    background: "#282828", surface: "#3c3836", surfaceBorder: "#504945",
    text: "#ebdbb2", textSecondary: "#a89984", textMuted: "#504945",
    primary: "#fabd2f", primaryHover: "#f2cc6f", accent: "#b8bb26",
    error: "#fb4934", errorBg: "#fb493420", inputBg: "#282828",
    inputBorder: "#504945", inputFocus: "#fabd2f", tagBg: "#3c3836",
    tagText: "#504945", link: "#fabd2f", divider: "#3c3836",
    placeholder: "#504945", shadow: "#00000050"
  },
  tokyonight: {
    background: "#1a1b26", surface: "#24283b", surfaceBorder: "#414868",
    text: "#c0caf5", textSecondary: "#a9b1d6", textMuted: "#414868",
    primary: "#7aa2f7", primaryHover: "#9aa5e1", accent: "#9ece6a",
    error: "#f7768e", errorBg: "#f7768e20", inputBg: "#1a1b26",
    inputBorder: "#414868", inputFocus: "#7aa2f7", tagBg: "#24283b",
    tagText: "#414868", link: "#7aa2f7", divider: "#24283b",
    placeholder: "#414868", shadow: "#00000045"
  },
  "dark-aero": {
    background: "#0a0e17", surface: "rgba(20, 30, 50, 0.75)", surfaceBorder: "rgba(80, 140, 220, 0.3)",
    text: "#c8ddf0", textSecondary: "#8fa8c8", textMuted: "#4a6080",
    primary: "#5ba0e6", primaryHover: "#7ab8f5", accent: "#4ade80",
    error: "#f87171", errorBg: "#f8717120", inputBg: "rgba(15, 22, 35, 0.85)",
    inputBorder: "rgba(80, 140, 220, 0.25)", inputFocus: "#5ba0e6", tagBg: "rgba(20, 30, 50, 0.75)",
    tagText: "#4a6080", link: "#5ba0e6", divider: "rgba(20, 30, 50, 0.75)",
    placeholder: "#4a6080", shadow: "#00000040"
  }
};

function applyThemeCSSVars(colors: typeof THEMES.gruvbox): string {
  return [
    `--bg: ${colors.background}`,
    `--surface: ${colors.surface}`,
    `--surface-border: ${colors.surfaceBorder}`,
    `--text: ${colors.text}`,
    `--text-secondary: ${colors.textSecondary}`,
    `--text-muted: ${colors.textMuted}`,
    `--primary: ${colors.primary}`,
    `--primary-hover: ${colors.primaryHover}`,
    `--accent: ${colors.accent}`,
    `--error: ${colors.error}`,
    `--error-bg: ${colors.errorBg}`,
    `--input-bg: ${colors.inputBg}`,
    `--input-border: ${colors.inputBorder}`,
    `--input-focus: ${colors.inputFocus}`,
    `--tag-bg: ${colors.tagBg}`,
    `--tag-text: ${colors.tagText}`,
    `--link: ${colors.link}`,
    `--divider: ${colors.divider}`,
    `--placeholder: ${colors.placeholder}`,
    `--shadow: ${colors.shadow}`
  ].join("; ");
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatSearXNGResults(response: SearXNGResponse): SearXNGResult[] {
  return response.results.map((r) => ({
    title: r.title || "",
    url: r.url || "",
    content: r.content || "",
    img_src: r.img_src,
    engine: r.engine || "",
    engines: r.engines || [],
    parsed_url: r.parsed_url || [],
    score: r.score,
    category: r.category || "general"
  }));
}

export function getSearchParams(query: string, category?: string, engines?: string, language?: string, pageno?: string) {
  return { query, category, engines, language, pageno };
}

export function buildSearchParamsString(opts: { category?: string; engines?: string; language?: string; pageno?: string }): string {
  const parts: string[] = [];
  if (opts.category) parts.push(`category=${encodeURIComponent(opts.category)}`);
  if (opts.engines) parts.push(`engines=${encodeURIComponent(opts.engines)}`);
  if (opts.language) parts.push(`language=${encodeURIComponent(opts.language)}`);
  if (opts.pageno) parts.push(`pageno=${encodeURIComponent(opts.pageno)}`);
  return parts.join("&");
}

export function createHtmlShell(
  q: string,
  results: SearXNGResult[],
  aiOverview: string | undefined,
  aiOverviewError: string | undefined,
  aiOverviewLoading: boolean,
  searchParams: string,
  style?: "clean" | "bold",
  theme?: string,
  category?: string
): string {
  const effectiveTheme = theme || "gruvbox";
  const themeColors = (THEMES as Record<string, typeof THEMES.gruvbox>)[effectiveTheme] || THEMES.gruvbox;
  const themeVars = applyThemeCSSVars(themeColors);
  const effectiveStyle = style || "clean";

 let resultsHtml = "";

  if (results.length > 0) {
    for (const result of results) {
      const urlDisplay = result.parsed_url ? result.parsed_url.join(" \u203A ") : result.url;
      resultsHtml += `
        <article class="result" data-result="true">
          <div class="result-url">${escapeHtml(urlDisplay)}</div>
          <h3 class="result-title">
            <a href="${escapeHtml(result.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.title)}</a>
          </h3>`;
      if (result.content) {
        resultsHtml += `<p class="result-snippet">${escapeHtml(result.content)}</p>`;
      }
      if (result.engine) {
        resultsHtml += `<span class="result-engine">${escapeHtml(result.engine)}</span>`;
      }
      resultsHtml += `
        </article>`;
    }
  }

  let aiSection = "";
 if (aiOverviewLoading && !aiOverview && !aiOverviewError) {
    aiSection = `
        <section class="ai-overview">
          <div class="ai-overview-label">Generating AI Overview</div>
          <p class="ai-loading">
            <span class="spinner">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </span>
            Analyzing search results...
          </p>
          <button class="ai-cancel" onclick="window.cancelSse()">Cancel</button>
        </section>`;
  }

  if (aiOverview) {
    aiSection = `
        <section class="ai-overview">
          <div class="ai-overview-label">AI Overview</div>
          <div class="sidebar-answer">${markdownToHtml(aiOverview)}</div>
        </section>`;
  }

  if (aiOverviewError) {
    aiSection = `
        <section class="ai-overview error">
          <div class="ai-overview-label">AI Overview unavailable</div>
          <p>${escapeHtml(aiOverviewError)}</p>
        </section>`;
  }

  let resultsCountHtml = "";
  if (results.length > 0) {
    resultsCountHtml = `<div class="results-count">${results.length} result${results.length !== 1 ? "s" : ""} for "${escapeHtml(q)}"</div>`;
  }

  let emptyState = "";
  if (results.length === 0 && !aiOverviewError) {
    emptyState = `
        <div class="empty-state">
          <h2>No results found</h2>
          <p>Try different keywords or check your spelling.</p>
        </div>`;
  }

  const fontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`;

  const sseScript = aiOverviewLoading
    ? `<script src="https://cdn.jsdelivr.net/npm/marked@15.0.0/lib/marked.umd.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@4.0.0/dist/purify.cjs.js" defer></script>
<script>
(function() {
  var q = ${JSON.stringify(q)};
  var params = ${JSON.stringify(searchParams)};
  var url = "/search/stream?q=" + encodeURIComponent(q);
  if (params) { url += "&" + params; }

  var sseSource = null;

  window.cancelSse = function() {
    if (sseSource) {
      sseSource.close();
      sseSource = null;
    }
    var sidebar = document.getElementById("sidebar-answer");
    if (sidebar) {
      sidebar.className = "sidebar-answer";
      sidebar.innerHTML = '<div class="ai-overview-label">AI Overview</div><p style="color: var(--text-muted); font-size: 13px;">Cancelled. Click a result or change your query.</p>';
    }
    var placeholder = document.getElementById("ai-overview-placeholder");
    if (placeholder) {
      placeholder.innerHTML = '<div class="ai-overview-label">AI Overview</div><p style="color: var(--text-muted); font-size: 13px;">Cancelled.</p>';
      placeholder.classList.remove("sidebar-empty");
    }
    var thinking = document.getElementById("thinking-block");
    if (thinking) thinking.style.display = "none";
  };

  function markdownToHtml(md) {
    if (!md) return "";
    var rawHtml = marked.parse(md);
    if (typeof DOMPurify === "undefined") return rawHtml;
    return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
  }

  var setupSSE = function() {
    var sidebarAnswer = document.getElementById("sidebar-answer");
    var thinkingBlock = document.getElementById("thinking-block");
    var mobileSidebarAnswer = document.getElementById("mobile-sidebar-answer");
    var incrementalText = null;
    var incrementalRawText = "";
    var mobileIncrementalText = null;
    var mobileIncrementalRawText = "";
    var isStreaming = false;
    var scrollTarget = null;
    var mobileScrollTarget = null;
    sseSource = new EventSource(url);
    sseSource.addEventListener("incremental", function(e) {
      try {
        if (!sidebarAnswer) return;
        if (!isStreaming) {
          isStreaming = true;
          sidebarAnswer.className = "sidebar-answer";
          sidebarAnswer.innerHTML = '<div class="ai-overview-label">AI Overview</div>';
          var container = document.createElement("p");
          container.className = "sidebar-answer-text";
          container.style.cssText = "font-size:14px;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap;margin-bottom:12px;overflow-y:auto;";
          sidebarAnswer.appendChild(container);
          incrementalText = container;
          if (mobileSidebarAnswer) {
            var mobileContainer = document.createElement("p");
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
      } catch(err) {
        console.error("SSE incremental parse error:", err);
      }
    });
    sseSource.addEventListener("thinking", function(e) {
      try {
        var data = JSON.parse(e.data);
        if (thinkingBlock) {
          thinkingBlock.style.display = "block";
          var content = thinkingBlock.querySelector(".thinking-content");
          if (content) content.textContent = data.thinking;
        }
      } catch(err) {
        console.error("SSE thinking parse error:", err);
      }
    });
    sseSource.addEventListener("overview", function(e) {
      try {
        if (thinkingBlock) {
          var toggle = thinkingBlock.querySelector(".thinking-toggle");
          if (toggle) toggle.classList.remove("open");
          var tc = thinkingBlock.querySelector(".thinking-content");
          if (tc) tc.classList.remove("open");
        }
      } catch(err) {
        console.error("SSE overview error:", err);
      }
      queueMicrotask(function() { sseSource.close(); sseSource = null; });
    });
    sseSource.addEventListener("error", function() {
      if (sseSource.readyState === EventSource.CLOSING || sseSource.readyState === EventSource.CLOSED) return;
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
      sseSource.close();
      sseSource = null;
    });
  };

  document.addEventListener("click", function(e) {
    var result = e.target.closest("[data-result]");
    if (result && sseSource) {
      sseSource.close();
      sseSource = null;
    }
  }, true);

  window.addEventListener("beforeunload", function() {
    if (sseSource) sseSource.close();
  });

  setupSSE();
})();
</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(q)} - Aetherium Search</title>
  ${fontsLink}
  <style>${CSS}</style>
  <style>
    body { ${themeVars}; }
  </style>
  <script>
    (function() {
      function getCookie(name) {
        var cookies = document.cookie.split("; ");
        for (var c of cookies) {
          var parts = c.split("=");
          var key = parts[0];
          var val = parts.slice(1).join("=");
          if (key === name) return val;
        }
        return null;
      }
      function setCookie(name, value) {
        document.cookie = name + "=" + value + "; path=/; max-age=31536000";
      }

      var storedTheme = getCookie("aetherium-theme") || "${effectiveTheme}";
      var storedStyle = getCookie("aetherium-style") || "${effectiveStyle}";

      function applyTheme(name) {
        var colors = themes[name] || themes["${effectiveTheme}"];
        var vars = [
          "--bg: "+colors.background,
          "--surface: "+colors.surface,
          "--surface-border: "+colors.surfaceBorder,
          "--text: "+colors.text,
          "--text-secondary: "+colors.textSecondary,
          "--text-muted: "+colors.textMuted,
          "--primary: "+colors.primary,
          "--primary-hover: "+colors.primaryHover,
          "--accent: "+colors.accent,
          "--error: "+colors.error,
          "--error-bg: "+colors.errorBg,
          "--input-bg: "+colors.inputBg,
          "--input-border: "+colors.inputBorder,
          "--input-focus: "+colors.inputFocus,
          "--tag-bg: "+colors.tagBg,
          "--tag-text: "+colors.tagText,
          "--link: "+colors.link,
          "--divider: "+colors.divider,
          "--placeholder: "+colors.placeholder,
          "--shadow: "+colors.shadow
        ].join("; ");
        document.body.style.cssText = vars;
        document.body.setAttribute("data-theme", name);
        setCookie("aetherium-theme", name);
        document.querySelectorAll(".theme-toggle .theme-name")[0].textContent = name.charAt(0).toUpperCase() + name.slice(1);
        updateThemeActive(name);
      }

      function applyStyle(name) {
        document.body.setAttribute("data-style", name);
        setCookie("aetherium-style", name);
        document.querySelectorAll(".style-toggle .style-name")[0].textContent = name.charAt(0).toUpperCase() + name.slice(1);
        updateStyleActive(name);
      }

      function updateThemeActive(name) {
        document.querySelectorAll(".dropdown-item").forEach(function(el) {
          el.classList.toggle("active", el.getAttribute("data-theme") === name);
        });
      }

      function updateStyleActive(name) {
        document.querySelectorAll(".style-option").forEach(function(el) {
          el.classList.toggle("active", el.getAttribute("data-style") === name);
        });
      }

      window.addEventListener("load", function() {
        applyTheme(storedTheme);
        applyStyle(storedStyle);

        document.querySelectorAll(".theme-toggle").forEach(function(btn) {
          btn.addEventListener("click", function(e) {
            var dd = document.getElementById("theme-dropdown");
            if (dd) {
              if (dd.classList.contains("open")) {
                dd.classList.remove("open");
              } else {
                document.querySelectorAll(".dropdown").forEach(function(d) { d.classList.remove("open"); });
                dd.classList.add("open");
              }
            }
            e.stopPropagation();
          });
        });

        document.querySelectorAll(".style-toggle").forEach(function(btn) {
          btn.addEventListener("click", function(e) {
            var dd = document.getElementById("style-dropdown");
            if (dd) {
              if (dd.classList.contains("open")) {
                dd.classList.remove("open");
              } else {
                document.querySelectorAll(".dropdown").forEach(function(d) { d.classList.remove("open"); });
                dd.classList.add("open");
              }
            }
            e.stopPropagation();
          });
        });

        document.querySelectorAll(".dropdown-item").forEach(function(item) {
          item.addEventListener("click", function(e) {
            applyTheme(item.getAttribute("data-theme"));
            document.getElementById("theme-dropdown").classList.remove("open");
            e.stopPropagation();
          });
        });

        document.querySelectorAll(".style-option").forEach(function(opt) {
          opt.addEventListener("click", function(e) {
            applyStyle(opt.getAttribute("data-style"));
            document.getElementById("style-dropdown").classList.remove("open");
            e.stopPropagation();
          });
        });

        document.addEventListener("click", function(e) {
          if (!e.target.closest(".dropdown-wrap")) {
            document.querySelectorAll(".dropdown").forEach(function(d) { d.classList.remove("open"); });
          }
        });
      });

      window.themes = ${JSON.stringify(THEMES)};
    })();
  </script>
  <script>
  (function() {
    function escapeHtml(str) {
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    var debounceTimer = null;
    var currentIndex = -1;
    var items = [];
    var categoryParam = ${JSON.stringify(category)};

    function showSuggestions(suggestions) {
      if (!suggestions || suggestions.length === 0) {
        dropdown.classList.remove("visible");
        dropdown.innerHTML = "";
        items = [];
        currentIndex = -1;
        return;
      }
      items = suggestions;
      dropdown.innerHTML = suggestions.map(function(item, i) {
        return '<li class="autocomplete-item" data-index="' + i + '">' +
          '<span class="autocomplete-icon">&#x2315;</span>' +
          '<span class="autocomplete-text">' + escapeHtml(item) + '</span></li>';
      }).join("");
      dropdown.classList.add("visible");

      dropdown.querySelectorAll(".autocomplete-item").forEach(function(el) {
        el.addEventListener("click", function() {
          var idx = parseInt(this.getAttribute("data-index"), 10);
          input.value = items[idx];
          dropdown.classList.remove("visible");
          dropdown.innerHTML = "";
          items = [];
          currentIndex = -1;
          form.submit();
        });
      });
    }

    function hideSuggestions() {
      dropdown.classList.remove("visible");
      dropdown.innerHTML = "";
      items = [];
      currentIndex = -1;
    }

    function updateActive(index) {
      dropdown.querySelectorAll(".autocomplete-item").forEach(function(el, i) {
        el.classList.toggle("active", i === index);
      });
    }

    var input, dropdown, form;

    function initAutocomplete() {
      input = document.getElementById("search-input");
      dropdown = document.getElementById("autocomplete-dropdown");
      form = document.getElementById("search-form");
      if (!input || !dropdown) return;

      input.addEventListener("input", function() {
        var q = input.value.trim();
        clearTimeout(debounceTimer);
        if (!q.length) {
          hideSuggestions();
          return;
        }
        debounceTimer = setTimeout(function() {
          fetch("/autocompleter?q=" + encodeURIComponent(q) + (categoryParam ? "&category=" + encodeURIComponent(categoryParam) : ""))
            .then(function(r) { return r.json(); })
            .then(function(data) { showSuggestions(data.items || []); })
            .catch(function() { hideSuggestions(); });
        }, 50);
      });

      input.addEventListener("keydown", function(e) {
        if (items.length === 0) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          currentIndex = (currentIndex + 1) % items.length;
          updateActive(currentIndex);
          input.value = items[currentIndex];
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          currentIndex = (currentIndex - 1 + items.length) % items.length;
          updateActive(currentIndex);
          input.value = items[currentIndex];
        } else if (e.key === "Enter") {
          if (currentIndex >= 0 && currentIndex < items.length) {
            e.preventDefault();
            input.value = items[currentIndex];
            hideSuggestions();
            form.submit();
          }
        } else if (e.key === "Escape") {
          hideSuggestions();
        }
      });

      document.addEventListener("click", function(e) {
        if (!e.target.closest(".search-form")) {
          hideSuggestions();
        }
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAutocomplete);
    } else {
      initAutocomplete();
    }
  })();
  </script>
</head>
<body>
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
          <button class="style-toggle ${effectiveStyle}">
            \u2630 <span class="style-name">${effectiveStyle.charAt(0).toUpperCase() + effectiveStyle.slice(1)}</span>
          </button>
          <div class="dropdown style-dropdown" id="style-dropdown">
            <button class="style-option ${effectiveStyle === 'clean' ? 'active' : ''}" data-style="clean">
              <span class="style-dot clean-dot"></span>
              Clean
            </button>
            <button class="style-option ${effectiveStyle === 'bold' ? 'active' : ''}" data-style="bold">
              <span class="style-dot bold-dot"></span>
              Bold
            </button>
          </div>
        </div>
        <div class="dropdown-wrap">
          <button class="theme-toggle">
            \u2699 <span class="theme-name">${effectiveTheme.charAt(0).toUpperCase() + effectiveTheme.slice(1)}</span>
          </button>
          <div class="dropdown" id="theme-dropdown">
            ${Object.entries(THEMES).map(([name, t]) => `
            <div class="dropdown-item ${effectiveTheme === name ? 'active' : ''}" data-theme="${name}" title="${name.charAt(0).toUpperCase() + name.slice(1)}"></div>`).join("")}
          </div>
        </div>
      </div>
    </div>
  </header>

 <main class="content">
<section class="ai-overview sidebar-empty" id="ai-overview-placeholder">${aiOverviewLoading && !aiOverview && !aiOverviewError
       ? `<div class="ai-overview-label">Generating AI Overview</div>
           <p class="ai-loading">
             <span class="spinner">
               <svg viewBox="0 0 24 24" width="16" height="16">
                 <circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10">
                   <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                 </circle>
               </svg>
             </span>
             Analyzing search results...
           </p>
           <button class="ai-cancel" onclick="window.cancelSse()">Cancel</button>
           <div class="sidebar-answer" id="mobile-sidebar-answer"></div>`
: aiOverview
        ? `<div class="ai-overview-label">AI Overview</div>
           <div class="sidebar-answer" id="mobile-sidebar-answer">${markdownToHtml(aiOverview)}</div>`
        : aiOverviewError
        ? `<div class="ai-overview-label">AI Overview unavailable</div>
           <p>${escapeHtml(aiOverviewError)}</p>`
        : `<div class="ai-overview-label">AI Overview</div>
           <p style="color: var(--text-muted); font-size: 13px;">AI overview will appear here when available.</p>`}
    </section>

    <div class="content-layout">
      <div class="content-main">
        ${resultsCountHtml}
        ${emptyState}
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
${aiOverviewLoading && !aiOverview && !aiOverviewError
             ? `<div class="sidebar-loading">
                   <span class="spinner">
                     <svg viewBox="0 0 24 24" width="16" height="16">
                       <circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10">
                         <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                       </circle>
                     </svg>
                   </span>
                   Analyzing...
                 </div>
                 <button class="ai-cancel" onclick="window.cancelSse()">Cancel</button>`
: aiOverview
                ? `<div class="ai-overview-label">AI Overview</div>
                   ${markdownToHtml(aiOverview)}`
                : aiOverviewError
                  ? `<div class="ai-overview-label">AI Overview unavailable</div>
                     <p>${escapeHtml(aiOverviewError)}</p>`
                  : ''}
          </div>
        </div>
       </aside>
    </div>
  </main>
  ${sseScript}
</body>
</html>`;
}
