# API Documentation

Aetherium Browser Search exposes a REST API for search queries, configuration management, and health checks. The `/search` endpoint returns a fully rendered HTML page. Other endpoints return JSON.

**Base URL:** `http://localhost:3000` (or your configured host/port)

**Default Content Types:**

| Endpoint | Response Type |
|---|---|
| `GET /search` | `text/html` |
| `GET /search/stream` | `text/event-stream` (SSE) |
| `GET /config` | `application/json` |
| `POST /config` | `application/json` |
| `GET /health` | `application/json` |
| `GET /` | `text/html` |

---

## Home Page

### `GET /`

Serves the landing page with the main search form. The page features a centered search input, theme switcher, and inline CSS/JavaScript for theme switching (gruvbox, tokyonight, and dark-aero themes).

**Response:** `text/html` — a standalone HTML page with no external dependencies.

---

## Search Endpoints

### `GET /search`

Performs a web search via SearXNG and returns a fully rendered HTML page with search results and an AI overview sidebar. The AI overview is delivered asynchronously via Server-Sent Events (SSE).

The page is a single-page application (SPA) — the HTML contains the shell with inline CSS, and the client-side JavaScript (bundled via esbuild at `/js/app.js`) handles rendering search results, theme switching, and SSE streaming.

**Query Parameters:**

| Parameter | Required | Type | Default | Description |
|---|---|---|---|---|
| `q` | Yes | string | — | The search query (URL-encoded) |
| `category` | No | string | `general` | SearXNG search category. One of: `general`, `images`, `news`, `video`, `science`, `it`, `music`, `files`, `maps` |
| `engines` | No | string | (all) | Comma-separated list of SearXNG engine names (e.g., `google,duckduckgo`) |
| `language` | No | string | (default) | BCP 47 language tag filter (e.g., `en`, `en-US`, `de`, `ja`) |
| `pageno` | No | integer | `1` | Page number for pagination (1-based) |

**Response:** `text/html`

A complete HTML document with:
- Sticky header containing the logo, search form, and theme switcher
- Main content area with search results and result count
- Right sidebar (flexible, up to 600px, sticky) with AI overview section and collapsible thinking block
- Inline CSS with CSS custom properties for theming
- Client-side JavaScript bundle at `/js/app.js` that handles rendering, theme switching, and SSE streaming
- Theme switching with cookie persistence

**Example Request:**

```
GET /search?q=how+to+fix+a+leaky+faucet&category=general&language=en
```

---

### `GET /search/stream` (Server-Sent Events)

Receives the AI overview asynchronously as SSE events. The SPA automatically connects to this endpoint when `LLM_API_URL` is configured. Fetches search results from SearXNG, sends them to the LLM, and streams the response back as SSE events.

**Query Parameters:** Same as `GET /search` (`q`, `category`, `engines`, `language`, `pageno`).

**SSE Events:**

| Event | Data | Description |
|---|---|---|
| `session` | `{sessionId}` | Unique session ID for cancellation |
| `thinking` | `{"thinking": "..."}` | The LLM's reasoning/thinking process (if available) |
| `incremental` | raw text | Streaming overview text (markdown) |
| `overview` | `{}` | Signals the overview is complete |
| `error` | `{}` | Error message if LLM call fails or no LLM configured |

**Example SSE Response:**

```
event: session
data: abc123-session-id

event: thinking
data: {"thinking":"Let me look at the search results..."}

event: incremental
data: The capital of France is

event: incremental
data: **Paris**, the country's largest city.

event: overview
data: {}
```

**Implementation Details:**
- Uses a `Readable` stream with manual `read()` implementation
- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`, `Access-Control-Allow-Origin: *`
- Fetches SearXNG results, formats top 10 for LLM prompt, calls `getAIOverview()`
- Cleans thinking artifacts from the final overview response
- Supports cancellation via `POST /search/cancel`

---

### `GET /api/search`

Returns search results as JSON. Useful for programmatic integration or when you need raw data instead of the HTML SPA.

**Query Parameters:** Same as `GET /search` (`q`, `category`, `engines`, `language`, `pageno`).

**Response (`application/json`):**

| Field | Type | Description |
|---|---|---|
| `query` | string | The executed search query |
| `results` | SearXNGResult[] | Array of search results |
| `number_of_results` | number | Number of results returned |
| `searchParams` | string | Reconstructed query string for pagination |
| `aiOverviewEnabled` | boolean | `true` if LLM is configured and no errors |
| `error` | string (nullable) | Error message if search failed |

**Example Response:**

```json
{
  "query": "how to fix a leaky faucet",
  "results": [
    {
      "title": "How to Fix a Leaky Faucet - This Old House",
      "url": "https://www.thisoldhouse.com/plumbing/21035566/how-to-fix-a-leaky-faucet",
      "content": "A dripping faucet can waste gallons of water...",
      "engine": "google",
      "engines": ["google"]
    }
  ],
  "number_of_results": 1,
  "searchParams": "category=general&language=en",
  "aiOverviewEnabled": true
}
```

---

### `POST /search/cancel`

Cancels an in-flight SSE stream for a given session.

**Request Body (`application/json`):**

| Field | Required | Type | Description |
|---|---|---|---|
| `sessionId` | Yes | string | Session ID from the `session` SSE event |

**Example Request:**

```http
POST /search/cancel
Content-Type: application/json

{ "sessionId": "abc123-session-id" }
```

**Response:**

```json
{ "success": true }
```

---

### `GET /autocompleter`

Returns search suggestion items from SearXNG's autocompleter endpoint. Used by the client-side autocomplete dropdown.

**Query Parameters:**

| Parameter | Required | Type | Description |
|---|---|---|---|
| `q` | Yes | string | Partial query text |
| `category` | No | string | SearXNG category filter |

**Response (`application/json`):**

| Field | Type | Description |
|---|---|---|
| `items` | string[] | Array of suggestion strings |

**Example Response:**

```json
{ "items": ["how to fix a leaky faucet", "how to fix a leaky faucet washer"] }
```

---

## Configuration Endpoints

### `GET /config`

Returns the current runtime configuration. Sensitive values (API keys) are returned as `null`.

**Response (`application/json`):**

| Field | Type | Description |
|---|---|---|
| `searxngUrl` | string | SearXNG instance base URL |
| `llmApiUrl` | string | LLM API base URL (null if not configured) |
| `llmModel` | string | Model name for the LLM |
| `llmMaxTokens` | number | Maximum tokens for LLM responses |
| `llmTemperature` | number | LLM temperature (0–1) |
| `aiOverviewPrompt` | string | Custom AI overview prompt template |
| `streamAIOverview` | boolean | Whether to stream AI overview via SSE |
| `llmApiKey` | null | Always `null` (redacted) |
| `searxngApiKey` | null | Always `null` (redacted) |

**Example Response:**

```json
{
  "searxngUrl": "http://searxng:8080",
  "llmApiUrl": "http://llamacpp:8081",
  "llmModel": "llama3.1-8b-instruct",
  "llmMaxTokens": 1024,
  "llmTemperature": 0.7,
  "aiOverviewPrompt": "Based on the following search results...",
  "llmApiKey": null,
  "searxngApiKey": null
}
```

---

### `POST /config`

Validates configuration changes submitted as JSON. **Changes are validated but do not take effect until the service is restarted.**

**Request Body (`application/json`):**

| Field | Required | Type | Description |
|---|---|---|---|
| `searxngUrl` | No | string | New SearXNG base URL |
| `llmApiUrl` | No | string | New LLM API base URL |

**Example Request:**

```http
POST /config
Content-Type: application/json

{
  "llmApiUrl": "http://new-llm:8081",
  "llmModel": "mistral-7b-instruct"
}
```

**Example Response (success):**

```json
{
  "success": true,
  "message": "Config updated. Restart required for changes to take effect."
}
```

**Example Response (validation error):**

```json
{
  "success": false,
  "message": "llmApiUrl must be a string"
}
```

---

## Health Check

### `GET /health`

Returns the service health status. Used by load balancers, container orchestrators, and monitoring systems.

**Response (`application/json`):**

| Field | Type | Description |
|---|---|---|
| `status` | string | `"ok"` when healthy |
| `timestamp` | string | ISO 8601 timestamp of the health check |

**Example Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

## Error Responses

| Status Code | Content-Type | Description |
|---|---|---|
| `400` | `application/json` | Bad request — missing or invalid `q` parameter |
| `502` | `text/html` or `application/json` | Upstream error — SearXNG or LLM unreachable |

**Error Response Body:**

```json
{
  "error": "Query parameter 'q' is required"
}
```

---

## Data Models

### SearXNG Result

Each search result follows the `SearXNGResult` interface:

| Field | Type | Description |
|---|---|---|
| `title` | string | Result title |
| `url` | string | Result URL |
| `content` | string (nullable) | Snippet/description text |
| `img_src` | string (nullable) | Image URL (for image results) |
| `thumbnail` | string (nullable) | Thumbnail URL |
| `engine` | string | Primary search engine name |
| `engines` | string[] | All engines that returned this result |
| `parsed_url` | string[] | Parsed URL components |
| `score` | number (nullable) | Relevance score |
| `category` | string | Search category |
| `template` | string | SearXNG template name |

### SearXNG Response

Full response from SearXNG (`SearXNGResponse` interface):

| Field | Type | Description |
|---|---|---|
| `results` | SearXNGResult[] | Array of search results |
| `number_of_results` | number (nullable) | Total result count |
| `query` | string | The executed query |
| `engines` | EngineInfo[] | Available engines with supported languages |
| `search_criteria` | object (nullable) | Search criteria used (query, engines, language, pageno, format, search_suggestions) |

### LLM Response

Output from the AI overview generation (`LLMResponse` interface):

| Field | Type | Description |
|---|---|---|
| `overview` | string | Generated AI overview in markdown |
| `thinking` | string (nullable) | LLM reasoning/thinking content |
| `model` | string (nullable) | Model name used for generation |
| `usage` | object (nullable) | Token usage (prompt_tokens, completion_tokens, total_tokens) |

---

## AI Overview Generation

When an LLM is configured (`LLM_API_URL` is set), the AI overview is generated asynchronously via the `/search/stream` SSE endpoint.

**Flow:**
1. `/search/stream` fetches results from SearXNG
2. Top 10 results are formatted as numbered list with title, URL, and snippet
3. Prompt is constructed using `AI_OVERVIEW_PROMPT` with `{{query}}` and `{{results}}` placeholders
4. Streaming chat completion request sent to OpenAI-compatible API at `{llmApiUrl}/v1/chat/completions`
5. SSE response is parsed — `choices[0].delta.content` accumulated as overview, `delta.reasoning_content` / `delta.thinking` accumulated as thinking
6. Thinking artifacts are cleaned from the final overview using pattern-based removal
7. Events pushed to SSE stream: `session`, `thinking`, then `incremental` (streaming chunks), then `overview` (or `error` on failure)

**Default System Prompt:**

```
You are a helpful assistant that provides concise, accurate overviews based on search results. Always cite sources when possible. If the results don't contain enough information to answer the query, say so clearly.
```

**Default Prompt Template:**

```
Based on the following search results, provide a concise, informative overview answering the user's query. Synthesize the key points and cite sources where relevant. Query: {{query}}

Results:
{{results}}
```

**LLM Request Body:**

```json
{
  "model": "llama3.1-8b-instruct",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant..." },
    { "role": "user", "content": "Based on the following search results..." }
  ],
  "max_tokens": 1024,
  "temperature": 0.7,
  "stream": true,
  "stream_options": { "include_usage": true }
}
```

**Timeout:** 30 seconds (`AbortSignal.timeout(30000)`)

---

## Environment Variables

See `.env.example` for the full list.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `0.0.0.0` | Server bind address |
| `SEARXNG_URL` | Yes | — | Base URL of SearXNG instance |
| `SEARXNG_API_KEY` | No | `""` | SearXNG Bearer auth key |
| `LLM_API_URL` | No | `""` | OpenAI-compatible LLM API base URL |
| `LLM_API_KEY` | No | `""` | LLM API Bearer key |
| `LLM_MODEL` | No | `llama3.1-8b-instruct` | Model name for LLM |
| `LLM_MAX_TOKENS` | No | `1024` | Max tokens for LLM responses |
| `LLM_TEMPERATURE` | No | `0.2` | LLM temperature (0–1) |
| `STREAM_AI_OVERVIEW` | No | `true` | Whether to stream AI overview via SSE |
| `AI_OVERVIEW_PROMPT` | No | *(default template)* | Custom prompt with `{{query}}` and `{{results}}` placeholders |

---

## Authentication

No authentication is required for API endpoints by default. SearXNG and LLM API keys (if configured) are used for upstream service authentication only and are not exposed via the `/config` endpoint.

---

## Rate Limiting

No rate limiting is implemented at the application level. Rate limiting should be configured at the reverse proxy or load balancer layer if needed.

---

## Themes

The HTML response includes inline CSS for three built-in themes. The active theme is persisted in a cookie named `aetherium-theme` (1-year expiry). Theme switching is available via a dropdown button in the header.

| Theme | Palette | Description |
|---|---|---|
| `gruvbox` | Gruvbox Hard Dark | Dark brown palette, yellow accents (default) |
| `tokyonight` | Tokyo Night | Dark blue palette, blue accents |
| `dark-aero` | Dark Aero | Glassmorphism with backdrop blur, blue accents |

### Theme Colors

Both themes define 20 CSS custom properties:

| Property | Purpose |
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

### Adding Themes

Themes are defined in `public/css/themes.css` as CSS custom property sets. Add a new theme with a `body[data-theme="your-theme"]` selector and include the name in the `themeNames` array in `src/client/ui.ts`.

---

## Responsive Layout

| Breakpoint | Behavior |
|---|---|
| `> 960px` | Standard layout: main content (flex) + sidebar (flex, up to 600px, sticky) |
| `<= 960px` | Sidebar moves above results; both columns stack vertically |
| `<= 640px` | Header wraps; search form takes full width below controls; content padding reduced to 12px |

---

## Source Modules

| Module | Path | Purpose |
|---|---|---|
| App Entry | `src/server/app.ts` | Fastify server bootstrap, static file serving |
| Routes | `src/server/routes.ts` | All HTTP route handlers |
| SearXNG | `src/server/searxng.ts` | URL building, headers, result formatting for LLM |
| LLM | `src/server/llm.ts` | Streaming chat completion, SSE parsing, thinking cleanup |
| Client App | `src/client/app.ts` | Client-side SPA entry point (bundled by esbuild) |
| Client Search | `src/client/search.ts` | Search page rendering, SSE client |
| Client UI | `src/client/ui.ts` | Theme switching, `escapeHtml` |
| Client Markdown | `src/client/markdown.ts` | `markdownToHtml` (marked + DOMPurify) |
| Client Autocomplete | `src/client/autocomplete.ts` | Autocomplete dropdown logic |
| Client Types | `src/client/types.ts` | Client-side `SearXNGResult` type |
| Shared Types | `src/shared/types.ts` | TypeScript interfaces for all data models |
| Config | `src/server/config.ts` | Environment variable parsing and `AppConfig` interface |
| Public CSS | `public/css/base.css` | Base styles, layout, result styling |
| Public CSS | `public/css/themes.css` | Theme color palettes (gruvbox, tokyonight, dark-aero) |
