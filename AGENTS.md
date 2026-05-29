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
│  2. Check SearXNG cache (30s TTL)                │
│  3. Forward to SearXNG (JSON response)           │
│  4. Generate HTML shell + SSE script             │
│  5. Return HTML shell to browser                 │
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
                  │ EventSource → /search/stream
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
3. Build SearXNG URL (with trailing slash normalization)
                         │
                         ▼
4. Check in-memory cache (30s TTL, keyed by query+opts)
                         │
                         ▼
5. Fetch SearXNG response (if cache miss):
    { results: [...], number_of_results: 42, ... }
                         │
                         ▼
6. Generate HTML shell (with loading placeholder for AI overview)
                         │
                         ▼
7. Return HTML to browser (immediate response)
                         │
                         ▼
8. Browser renders page, SSE script connects to /search/stream
                         │
                         ▼
9. /search/stream fetches SearXNG results again,
   calls getAIOverview(), pushes SSE events:
   - thinking: { thinking: "..." }
   - overview: { overview: "..." }
   - error: { error: "..." } (if LLM fails)
                         │
                         ▼
10. SSE client receives events, updates the AI overview sidebar
```

## Module Overview

### App (`src/app.ts`)

Fastify bootstrap, CORS, env validation (via `@fastify/env`), AbortController for graceful shutdown, static file serving, health endpoint.

**Key features:**
- `onClose` hook: aborts all in-flight requests, then 1s drain delay for SSE streams
- Root `/` serves `public/index.html`
- `GET /health` returns `{ status, timestamp }`

### Routes (`src/routes.ts`)

Fastify route handlers for `/search`, `/search/stream`, `/config`, and `/health`.

**Key functions:**
- `cacheKey(q, opts)` — generates cache key from query and filter params
- `getCacheEntry(key)` — returns cached results if TTL not expired
- `fetchResults(config, q, opts)` — checks cache, fetches SearXNG on miss
- `buildRoutes(app, config, shutdownSignal)` — registers GET /search, POST /search, GET /search/stream SSE

### Templates (`src/templates.ts`)

CSS constant, theme system, HTML helpers, and result formatting. (~734 lines)

**Exports:**
| Export | Description |
|---|---|
| `CSS` | Full application CSS string |
| `THEMES` | Record of theme color palettes (gruvbox, tokyonight, dark-aero) |
| `markdownToHtml(md)` | Sanitized markdown → HTML (marked + DOMPurify) |
| `escapeHtml(str)` | HTML entity escaping |
| `formatSearXNGResults(response)` | Maps SearXNG response to `SearXNGResult[]` |
| `getSearchParams(q, category, engines, language, pageno)` | Builds search param object |
| `createHtmlShell(q, results, aiOverview, ...)` | Generates full HTML response |
| `buildSearchParamsString(opts)` | Serializes search opts to query string |

### SearXNG Module (`src/searxng.ts`)

**Exports:**
| Export | Description |
|---|---|
| `buildSearXNGUrl(config, q, opts)` | Constructs SearXNG search URL |
| `getSearchHeaders(config)` | Builds HTTP headers for SearXNG requests |
| `interpolatePrompt(prompt, query, results)` | Replaces `{{query}}` and `{{results}}` placeholders |

### LLM Module (`src/llm.ts`)

**Exports:**
| Export | Description |
|---|---|
| `getAIOverview(config, query, results)` | Streaming chat completion to OpenAI-compatible API |

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

**Response parsing:** Reads the SSE stream from the LLM, accumulates `choices[0].delta.content` into the overview text, and extracts `delta.reasoning_content` / `delta.thinking` for the thinking block. Uses `AbortSignal.any()` combining shutdown signal + 30s timeout.

### Types (`src/types.ts`)

| Type | Description |
|---|---|
| `SearXNGResult` | A single search result from SearXNG |
| `SearXNGResponse` | Full SearXNG JSON response |
| `ChatMessage` | LLM chat message (system/user/assistant) |
| `LLMResponse` | Parsed LLM response with overview text |

### Config (`src/config.ts`)

| Type | Description |
|---|---|
| `AppConfig` | Runtime configuration object |
| `buildConfig(processEnv)` | Loads and parses environment variables into AppConfig |
| `envSchema` | JSON schema for env var validation (`@fastify/env`) |

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `SEARXNG_URL` | SearXNG instance base URL (required) |
| `LLM_API_URL` | LLM API base URL (optional, enables AI overview) |
| `LLM_MODEL` | Model name for the LLM |
| `LLM_API_KEY` | API key for the LLM endpoint |
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
