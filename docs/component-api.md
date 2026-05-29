# Search UI — Client-Side Behavior

The search endpoint (`/search`) returns a fully self-contained HTML page with inline CSS and JavaScript. No external JS bundles or Lit components are required.

---

## Theme Switching

The page includes a built-in theme switcher in the header. Theme preference is persisted in a cookie named `aetherium-theme` (1-year expiry).

### Available Themes

| Theme | Palette | Description |
|---|---|---|
| `gruvbox` | Gruvbox Hard Dark | Dark brown palette, yellow accents (default) |
| `tokyonight` | Tokyo Night | Dark blue palette, blue accents |
| `dark-aero` | Aero Glass | Dark blue with frosted translucent backgrounds and backdrop blur effects |

### Setting the Theme

Theme is controlled via the `aetherium-theme` cookie:

```javascript
// Set via cookie
document.cookie = "aetherium-theme=tokyonight; path=/; max-age=31536000";
```

Or use the built-in UI — click the gear icon (⚙) in the header to open the theme dropdown.

---

## Frosted Glass (Dark Aero Theme)

The `dark-aero` theme applies glassmorphism-style frosted translucency using CSS `backdrop-filter: blur()` with semi-transparent backgrounds. These effects are applied to the following elements when `body[data-theme="dark-aero"]`:

| Element | Effect |
|---|---|
| `.header` | Frosted sticky header with subtle blue top border glow |
| `.result` | Frosted translucent search result cards with blue border glow |
| `.sidebar-answer` | Frosted AI overview panel |
| `.ai-overview` | Frosted mobile AI overview placeholder |
| `.thinking-block` | Frosted collapsible thinking block |
| `.dropdown` | Frosted theme/style dropdown menus |
| `.empty-state` | Frosted no-results state |

The `backdrop-filter: blur()` values range from `8px` (empty state) to `20px` (dropdowns). A fallback `box-shadow` and subtle `inset` highlight provide depth when backdrop blur is unsupported.

---

## CSS Custom Properties

The page defines CSS custom properties scoped to `:root` that map to the active theme's color palette. These are applied inline via JavaScript when the theme changes.

| Property | Description |
|---|---|
| `--bg` | Page background |
| `--surface` | Card/header background |
| `--surface-border` | Border color |
| `--text` | Primary text |
| `--text-secondary` | Secondary text |
| `--text-muted` | Muted text |
| `--primary` | Primary accent color |
| `--primary-hover` | Primary hover color |
| `--accent` | Success/accent color |
| `--error` | Error color |
| `--error-bg` | Error background |
| `--input-bg` | Input background |
| `--input-border` | Input border |
| `--input-focus` | Input focus ring |
| `--tag-bg` | Tag background |
| `--tag-text` | Tag text |
| `--link` | Link color |
| `--divider` | Divider color |
| `--placeholder` | Placeholder text |
| `--shadow` | Box shadow |

### Overriding Colors

Override colors by setting inline styles on `body`:

```javascript
document.body.style.setProperty('--primary', '#ff6600');
document.body.style.setProperty('--link', '#ff6600');
```

---

## AI Overview (SSE Client)

The page includes an inline SSE client that connects to `/search/stream` to receive the AI overview asynchronously.

### How It Works

1. The `/search` response includes an inline `<script>` that loads `marked` and `DOMPurify` from CDN
2. After the libraries load, the script creates an `EventSource` connected to `/search/stream`
3. SSE events (`thinking`, `overview`, `error`) are received and rendered into the page
4. The `marked` library converts markdown to HTML; `DOMPurify` sanitizes the output

### SSE Events

| Event | Data Format | Description |
|---|---|---|
| `thinking` | `{"thinking": "..."}` | LLM reasoning/thinking block (collapsible) |
| `overview` | `{"overview": "..."}` | AI overview in markdown (replaces loading state) |
| `error` | `{"error": "..."}` | Error message shown when LLM call fails |

### Configuration

SSE client behavior is configured via environment variables:

| Variable | Default | Description |
|---|---|---|
| `SSE_MAX_RETRIES` | `30` | Max retries to load marked/DOMPurify libraries |
| `SSE_RETRY_DELAY_MS` | `100` | Delay between retry attempts in milliseconds |

The client waits up to `SSE_MAX_RETRIES * SSE_RETRY_DELAY_MS` milliseconds (default 3s) for the libraries to load before giving up.

---

## Responsive Layout

| Breakpoint | Behavior |
|---|---|
| `> 640px` | Standard layout with centered content at `max-width: 960px` |
| `<= 640px` | Header wraps; search form takes full width; content padding reduced to `16px` |

---

## Form Submission

The search form submits via `GET` to `/search?q=<query>`. Users can also use the browser's built-in search integration (configure as a search engine keyword).

---

## HTML Structure

```html
<body>
  <header class="header">
    <div class="logo">Aetherium Search</div>
    <form class="search-form" action="/search" method="GET">
      <input type="search" name="q" placeholder="Search the web...">
    </form>
    <div class="theme-toggle">
      <button>⚙ Theme</button>
      <div class="theme-dropdown">
        <div class="theme-dot" data-theme="gruvbox"></div>
        <div class="theme-dot" data-theme="tokyonight"></div>
        <div class="theme-dot" data-theme="dark-aero"></div>
      </div>
    </div>
  </header>
  <main>
    <section class="results">
      <!-- Search results rendered server-side -->
    </section>
    <aside class="ai-overview">
      <div id="ai-overview-placeholder">
        <!-- Loading state or AI overview rendered via SSE -->
      </div>
    </aside>
  </main>
  <script>/* SSE client for AI overview */</script>
</body>
```
