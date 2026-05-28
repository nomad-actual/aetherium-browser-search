# Lit Web Component: `<search-results>`

A custom web component built with Lit that renders search results and AI overviews. It is self-contained in a single bundled file (`public/search-results.js`) and requires no build step for consumers.

---

## Quick Start

```html
<script type="module" src="/static/search-results.js"></script>

<search-results id="app"></search-results>

<script>
  document.getElementById("app").data = {
    query: "typescript tutorial",
    results: [
      {
        title: "TypeScript Documentation",
        url: "https://www.typescriptlang.org/docs/",
        content: "Learn TypeScript from the ground up...",
        engine: "google"
      }
    ],
    aiOverview: "TypeScript is a strongly typed programming language..."
  };
</script>
```

---

## Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `data` | `SearchResultsData` | `{ query: "", results: [] }` | Search data object containing query, results, and AI overview |
| `theme` | `string` | `"dark"` | Active theme name. One of: `"dark"`, `"light"`, `"slate"`, `"ocean"` |
| `themeMode` | `ThemeMode` | `"dark"` | Theme resolution mode. One of: `"dark"`, `"light"`, `"system"` |

### `data` Object Structure

```typescript
interface SearchResultsData {
  query: string;
  results: SearXNGResult[];
  aiOverview?: string;
  aiOverviewError?: string;
  categories?: string[];
}

interface SearXNGResult {
  title: string;
  url: string;
  img_src?: string;
  content?: string;
  engine?: string;
  parsed_url?: string[];
  score?: number;
}
```

### `themeMode` Behavior

| Mode | Behavior |
|---|---|
| `"dark"` | Always use dark theme |
| `"light"` | Always use light theme |
| `"system"` | Follow the OS-level `prefers-color-scheme` setting |

---

## Themes

Four built-in themes are available. The active theme is persisted in a cookie named `aetherium-theme` (1-year expiry).

| Theme | Palette | Description |
|---|---|---|
| `dark` | GitHub Dark | Dark gray palette, blue accents |
| `light` | GitHub Light | White palette, blue accents |
| `slate` | Slate | Dark blue-slate palette, indigo accents |
| `ocean` | Ocean | Dark ocean-teal palette, teal accents |

### Setting the Theme

```javascript
const app = document.getElementById("app");
app.theme = "slate";
```

Theme selection is also available via the built-in UI (click the theme toggle button in the header).

---

## Events

The component does not dispatch custom events. Client-side interaction is handled internally:

| Interaction | Behavior |
|---|---|
| Click logo | Redirects to `/` (home) |
| Submit search form | Redirects to `/search?q=<query>` |
| Click theme option | Sets `theme` property and persists to cookie |

---

## CSS Custom Properties

The component defines CSS custom properties scoped to `:host()` that map to the active theme's color palette. These can be overridden by consumers for custom styling.

| Property | Description |
|---|---|
| `--colors-background` | Page background |
| `--colors-surface` | Card/header background |
| `--colors-surface-border` | Border color |
| `--colors-text` | Primary text |
| `--colors-text-secondary` | Secondary text |
| `--colors-text-muted` | Muted text |
| `--colors-primary` | Primary accent color |
| `--colors-primary-hover` | Primary hover color |
| `--colors-accent` | Success/accent color |
| `--colors-error` | Error color |
| `--colors-error-bg` | Error background |
| `--colors-input-bg` | Input background |
| `--colors-input-border` | Input border |
| `--colors-input-focus` | Input focus ring |
| `--colors-tag-bg` | Tag background |
| `--colors-tag-text` | Tag text |
| `--colors-link` | Link color |
| `--colors-divider` | Divider color |
| `--colors-placeholder` | Placeholder text |
| `--colors-shadow` | Box shadow |

### Overriding a Single Color

```css
search-results {
  --colors-primary: #ff6600;
  --colors-primary-hover: #ff8533;
  --colors-link: #ff6600;
}
```

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `> 640px` | Standard layout with centered content at `max-width: 960px` |
| `<= 640px` | Header wraps; search form takes full width; content padding reduced to `16px` |

---

## Using with a Different Server Path

By default, the component redirects to `/search?q=...` for new searches. If your server serves the search endpoint at a different path, override the behavior:

```javascript
const app = document.getElementById("app");
const originalSubmit = app.onSubmit.bind(app);
app.onSubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  const q = form.querySelector('[name="q"]').value.trim();
  if (q) {
    window.location.href = `/custom/search-path?q=${encodeURIComponent(q)}`;
  }
};
```

---

## TypeScript

The component ships with type definitions. Import from the bundled file:

```typescript
import type { SearchResultsData, SearXNGResult, ThemeMode, ThemeDefinition }
  from "/static/search-results.js";
```

Or copy the interfaces from `src/components/search-results.ts`.

---

## Building the Component

The Lit component is bundled using esbuild via the `scripts/bundle-lit.ts` script. This is run automatically during `npm run build`.

To bundle manually:

```bash
npx esbuild src/components/search-results.ts \
  --bundle \
  --format=esm \
  --target=es2022 \
  --minify \
  --outfile=public/search-results.js
```
