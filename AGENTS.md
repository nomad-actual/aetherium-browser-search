# Aetherium Browser Search — API & Developer Overview

## Architecture

```
Browser (search provider URL)
    │
    │ GET /search?q=<query>
    ▼
┌─────────────────────────────────────────────────┐
│  Fastify Service (TypeScript, Port 3000)        │
│                                                  │
│  1. Validate query                               │
│  2. Check SearXNG cache (30s TTL)                │
│  3. Forward to SearXNG (JSON response)           │
│  4. Return HTML shell + /js/app.js SPA bundle    │
│  5. Browser connects to /search/stream for SSE   │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
             ┌──────────┐
             │ SearXNG  │
             │ :8080    │
             └────┬─────┘
                  │
                  ▼
             Client SPA (SSE client)
                  │
                  │ EventSource → /search/stream
                  ▼
             ┌──────────────┐
             │ LLM API      │
             │ :8081        │
             └──────────────┘
```

The AI overview is delivered asynchronously via Server-Sent Events (SSE). The `/search` response returns an HTML shell with the client-side SPA bundle (`/js/app.js`), then the browser connects to `/search/stream` which calls the LLM and pushes the overview as SSE events.

## Endpoints

### `GET /search`

Returns an HTML page with a client-side SPA that renders search results and AI overview. This is the primary endpoint for browser search bar integration.

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

**Response:** `text/html` — an HTML page with the search UI shell and client-side JavaScript bundle at `/js/app.js`.

**Example request from browser:**
```
https://search.example.com/search?q=how+to+fix+a+leaky+faucet
```

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
6. Return HTML shell to browser (immediate response)
                         │
                         ▼
7. Browser loads /js/app.js (client SPA bundle)
                         │
                         ▼
8. Client SPA renders results, SSE script connects to /search/stream
                         │
                         ▼
9. /search/stream fetches SearXNG results again,
   calls getAIOverview(), pushes SSE events:
   - session: { sessionId: "..." }
   - thinking: { thinking: "..." }
   - incremental: "partial text..." (streaming chunks)
   - overview: {} (signals completion)
   - error: {} (if LLM fails)
                         │
                         ▼
10. SSE client receives events, updates the AI overview sidebar
```

## Module Overview

### Server App (`src/server/app.ts`)

Fastify bootstrap, CORS, env validation (via `@fastify/env`), AbortController for graceful shutdown, static file serving, health endpoint.

**Key features:**
- `onClose` hook: aborts all in-flight requests, then 1s drain delay for SSE streams
- Root `/` serves `public/index.html`
- `/search` serves `public/index.html` (SPA shell)
- `/js/` serves compiled client JS from `dist/client/`
- `GET /health` returns `{ status, timestamp }`

### Routes (`src/server/routes.ts`)

Fastify route handlers for `/search`, `/search/stream`, `/config`, and `/health`.

**Key functions:**
- `cacheKey(q, opts)` — generates cache key from query and filter params
- `getCacheEntry(key)` — returns cached results if TTL not expired
- `fetchResults(config, q, opts)` — checks cache, fetches SearXNG on miss
- `buildRoutes(app, config, shutdownSignal)` — registers GET /search, GET /search/stream SSE

### SearXNG Module (`src/server/searxng.ts`)

**Exports:**
| Export | Description |
|---|---|
| `buildSearXNGUrl(config, q, opts)` | Constructs SearXNG search URL |
| `getSearchHeaders(config)` | Builds HTTP headers for SearXNG requests |
| `interpolatePrompt(prompt, query, results)` | Replaces `{{query}}` and `{{results}}` placeholders |

### LLM Module (`src/server/llm.ts`)

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

### Client App (`src/client/app.ts`)

Client-side SPA entry point. Bundled by esbuild to `dist/client/app.js`, served at `/js/app.js`.

**Key functions:**
- `renderHome()` — renders the home page with search form
- `renderSearchPage(q, results, error, category)` — renders search results page
- `initSSE(urlParams)` — connects to SSE stream for AI overview streaming

### Client UI (`src/client/ui.ts`)

**Exports:**
| Export | Description |
|---|---|
| `initTheme()` | Initializes theme switching from cookie |
| `escapeHtml(str)` | HTML entity escaping |

### Client Markdown (`src/client/markdown.ts`)

**Exports:**
| Export | Description |
|---|---|
| `markdownToHtml(md)` | Sanitized markdown → HTML (marked + DOMPurify) |

### Client Autocomplete (`src/client/autocomplete.ts`)

**Exports:**
| Export | Description |
|---|---|
| `initAutocomplete(isSearchPage)` | Initializes search autocomplete dropdown |

### Shared Types (`src/shared/types.ts`)

| Type | Description |
|---|---|
| `SearXNGResult` | A single search result from SearXNG |
| `SearXNGResponse` | Full SearXNG JSON response |
| `ChatMessage` | LLM chat message (system/user/assistant) |
| `LLMResponse` | Parsed LLM response with overview text |

### Client Types (`src/client/types.ts`)

| Type | Description |
|---|---|
| `SearXNGResult` | Client-side search result type |

### Config (`src/server/config.ts`)

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

## Running Locally

```bash
npm install
cp .env.example .env   # edit with your settings
npm run dev             # watches and restarts on changes
```

## Building for Production

```bash
npm run build    # compiles TypeScript (server + client)
npm start        # runs the compiled app
```

## Docker

```bash
docker compose up -d      # build and start
docker compose logs -f    # view logs
docker compose down       # stop
```

## Public Assets

### `public/index.html`

The HTML shell served by `/` and `/search`. Contains the base structure and links to the client SPA bundle at `/js/app.js`, plus CSS from `public/css/`.

### `public/css/base.css`

Base styles, layout (flexbox with responsive breakpoints), result styling, header, sidebar, thinking block, and dark-aero glassmorphism overrides.

### `public/css/themes.css`

Theme color palettes for gruvbox, tokyonight, and dark-aero as CSS custom properties.

### `opensearch.xml`

OpenSearch discovery document for browser search engine integration, served at `/opensearch`.
