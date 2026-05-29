# Aetherium Browser Search — API & Developer Overview

## Architecture

```
Browser (search provider URL)
    │
    │ GET /search?q=<query>  OR  POST /search { "q": "..." }
    ▼
┌─────────────────────────────────────────────────┐
│  Fastify Service (TypeScript, Port 3000)        │
│                                                  │
│  1. Validate query                               │
│  2. Forward to SearXNG (JSON response)           │
│  3. Generate HTML shell + SSE script             │
│  4. Return HTML shell to browser                 │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
             ┌──────────┐
             │ SearXNG  │
             │ :8080    │
             └────┬─────┘
                  │
                  ▼
             Browser (SSE client)
                  │
                  │ WebSocket → /search/stream
                  ▼
             ┌──────────────┐
             │ LLM API      │
             │ :8081        │
             └──────────────┘
```

The AI overview is delivered asynchronously via Server-Sent Events (SSE). The initial `/search` response returns an HTML shell with a loading placeholder, then the browser connects to `/search/stream` which calls the LLM and pushes the overview as SSE events.

## Endpoints

### `GET /search`

Returns an HTML page with a Lit web component that renders search results and AI overview. This is the primary endpoint for browser search bar integration.

```
GET /search?q=<url-encoded-query>&category=<cat>&language=<lang>&pageno=<n>
```

| Query Param | Required | Values | Description |
|---|---|---|---|
| `q` | Yes | any string | The search query |
| `category` | No | `general`, `images`, `news`, `video`, `science`, `it`, `music`, `files`, `maps` | SearXNG search category |
| `engines` | No | comma-separated | SearXNG engine names (e.g., `google,duckduckgo`) |
| `language` | No | BCP 47 code | Language filter (e.g., `en`, `en-US`, `de`) |
| `pageno` | No | integer | Page number (1-based) |

**Response:** `text/html` — an HTML page with the search UI and an `<search-results>` component initialized with server-rendered data.

**Example request from browser:**
```
https://search.example.com/search?q=how+to+fix+a+leaky+faucet
```

### `POST /search`

Same as GET but accepts JSON body. Useful for programmatic integration or when the query contains characters that are problematic in URLs.

```
POST /search
Content-Type: application/json

{
  "q": "what is the capital of France?",
  "category": "general",
  "language": "en"
}
```

**Response:** `text/html` — same HTML as GET.

### `GET /config`

Returns current service configuration. Sensitive values (API keys) are returned as `null`.

```
GET /config
```

**Response:**
```json
{
  "searxngUrl": "http://searxng:8080",
  "llmApiUrl": "http://llamacpp:8081",
  "llmModel": "llama3.1-8b-instruct",
  "llmMaxTokens": 1024,
  "llmTemperature": 0.7,
  "llmApiKey": null,
  "searxngApiKey": null
}
```

### `POST /config`

Validates configuration changes. Changes require a service restart to take effect.

```
POST /config
Content-Type: application/json

{
  "llmApiUrl": "http://new-llm:8081",
  "llmModel": "mistral-7b-instruct"
}
```

**Response:**
```json
{ "success": true, "message": "Config updated. Restart required for changes to take effect." }
```

### `GET /health`

Health check for load balancers and container orchestration.

```
GET /health
```

**Response:**
```json
{ "status": "ok", "timestamp": "2025-01-15T12:00:00.000Z" }
```

## Request Flow (Search)

```
1. Browser sends GET /search?q=typescript+tutorial
                        │
                        ▼
2. Route handler extracts query params
                        │
                        ▼
3. Build SearXNG URL:
   http://searxng:8080/search?q=typescript+tutorial&format=json
                        │
                        ▼
4. Fetch SearXNG response:
   { results: [...], number_of_results: 42, ... }
                        │
                        ▼
5. Generate HTML shell (with loading placeholder for AI overview)
                        │
                        ▼
6. Return HTML to browser (immediate response)
                        │
                        ▼
7. Browser renders page, SSE script connects to /search/stream
                        │
                        ▼
8. /search/stream fetches SearXNG results again,
   calls getAIOverview(), pushes SSE events:
   - thinking: { thinking: "..." }
   - overview: { overview: "..." }
   - error: { error: "..." } (if LLM fails)
                        │
                        ▼
9. SSE client receives events, updates the AI overview sidebar
```

## Module Overview

### Routes (`src/routes.ts`)

Fastify route handlers for `/search`, `/search/stream`, `/config`, and `/health`.

**Key functions:**
- `createHtmlShell(q, results, aiOverview, aiOverviewError, aiOverviewLoading, ...)` — generates the full HTML response
- `buildSearXNGUrl(config, q, opts)` — constructs the SearXNG search URL
- `fetchResults(config, q, opts)` — fetches and formats SearXNG results
- `generateSSEScript(query, searchParams, sseConfig)` — generates the client-side SSE script

### SearXNG Module (`src/searxng.ts`)

### `buildSearXNGUrl(config, q, opts)`

Constructs the full SearXNG search URL with query parameters.

### `getSearchHeaders(config)`

Builds HTTP headers for SearXNG requests, including optional Bearer auth.

### `formatResultsForLLM(results)`

Formats search results into text for LLM prompting.

### LLM Module (`src/llm.ts`)

### `getAIOverview(config, query, results)`

Sends a streaming chat completion request to an OpenAI-compatible API.

**Request body:**
```json
{
  "model": "llama3.1-8b-instruct",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant that provides concise, accurate overviews..."
    },
    {
      "role": "user",
      "content": "Based on the following search results...\n\nResults:\n1. ...\n2. ..."
    }
  ],
  "max_tokens": 1024,
  "temperature": 0.7,
  "stream": true,
  "stream_options": { "include_usage": true }
}
```

**Response parsing:** Reads the SSE stream from the LLM, accumulates `choices[0].delta.content` into the overview text, and extracts `delta.reasoning_content` / `delta.thinking` for the thinking block.

### Themes (`src/themes.ts`)

### Theme colors and CSS variable generation.

| Export | Description |
|---|---|
| `THEMES` | Record of all available themes with their color palettes |
| `getThemeColors(name)` | Returns color palette for a theme name, falls back to gruvbox |
| `getThemeCSSVars(colors)` | Generates CSS custom properties string from a color palette |
| `generateThemeScript(defaultTheme, defaultStyle)` | Generates client-side theme switching script |
| `generateThemeDropdownHTML(themeKey, effectiveTheme, themeColors)` | Generates the theme dropdown HTML |

### Theme System

Two built-in themes with CSS custom properties:

| Theme | Description |
|---|---|
| `gruvbox` | Gruvbox hard dark palette, yellow accents (default) |
| `tokyonight` | Tokyo Night palette, blue accents |

Theme preference is persisted via cookie (`aetherium-theme`).

### Scripts (`src/scripts.ts`)

### `generateSSEScript(query, searchParams, sseConfig)`

Generates the client-side JavaScript that connects to `/search/stream` via EventSource, parses SSE events, and updates the AI overview UI. Uses `marked` and `DOMPurify` for HTML sanitization of the AI overview content.

### Types (`src/types.ts`)

| Type | Description |
|---|---|
| `SearchQuery` | Incoming search parameters |
| `SearXNGResult` | A single search result from SearXNG |
| `SearXNGResponse` | Full SearXNG JSON response |
| `ChatMessage` | LLM chat message (system/user/assistant) |
| `LLMResponse` | Parsed LLM response with overview text |
| `SearchResult` | Final merged result for component data |

### Config (`src/config.ts`)

| Type | Description |
|---|---|
| `AppConfig` | Runtime configuration object |
| `buildConfig(processEnv)` | Loads and parses environment variables into AppConfig |

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `SEARXNG_URL` | SearXNG instance base URL (required) |
| `LLM_API_URL` | LLM API base URL (optional, enables AI overview) |
| `LLM_MODEL` | Model name for the LLM |
| `LLM_API_KEY` | API key for the LLM endpoint |
| `HTTPS` | Enable/disable HTTPS |
| `AI_OVERVIEW_PROMPT` | Custom prompt template with `{{query}}` and `{{results}}` placeholders |
| `SSE_MAX_RETRIES` | Max client-side SSE library load retries (default: 30) |
| `SSE_RETRY_DELAY_MS` | Delay between SSE retry attempts in ms (default: 100) |

## Running Locally

```bash
npm install
cp .env.example .env   # edit with your settings
npm run dev             # watches and restarts on changes
```

## Building for Production

```bash
npm run build    # compiles TypeScript
npm start        # runs the compiled app
```

## Docker

```bash
docker compose up -d      # build and start
docker compose logs -f    # view logs
docker compose down       # stop
```

## HTML Shell (`public/index.html`)

A minimal landing page that serves as the home page (`/`). The search endpoint (`/search`) returns a fully self-contained HTML page with inline CSS, theme switching logic, and the search results UI — no external JS bundle required.

**Search endpoint shell format:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <style>/* theme CSS variables */</style>
  <script>/* theme switching script */</script>
  <script src="marked.cdn.js" async></script>
  <script src="dompurify.cdn.js" async></script>
  <script>/* SSE client for AI overview */</script>
</head>
<body>
  <!-- Search UI with results + AI overview sidebar -->
</body>
</html>
```
