# Aetherium Browser Search — API & Developer Overview

## Architecture

```
Browser (search provider URL)
    │
    │ GET /search?q=<query>  OR  POST /search { "q": "..." }
    ▼
┌─────────────────────────────────────────┐
│  Fastify Service (TypeScript, Port 3000) │
│                                          │
│  1. Validate query                       │
│  2. Forward to SearXNG (JSON response)   │
│  3. Send top results + query to LLM      │
│  4. Inject data into Lit component       │
│  5. Return HTML shell to browser         │
└──────────────────────────────────────────┘
         │                  │
         ▼                  ▼
   ┌──────────┐      ┌──────────────┐
   │ SearXNG  │      │ LLM API      │
   │ :8080    │      │ :8081        │
   └──────────┘      └──────────────┘
```

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
| `engines` | No | comma-separated | SearXNG engine names (e.g., `google,duckddgo`) |
| `language` | No | BCP 47 code | Language filter (e.g., `en`, `en-US`, `de`) |
| `pageno` | No | integer | Page number (1-based) |

**Response:** `text/html` — an HTML page with a `<search-results>` Lit web component initialized with server-rendered data.

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
5. Format results for display + LLM context
                        │
               ┌────────┴────────┐
               ▼                 ▼
6a. Build LLM prompt       6b. Generate HTML shell
   system: "You are a       <html>
   helpful assistant..."      <search-results
   user: "Based on...         data={query,
   Query: TS tutorial         results, aiOverview}
   Results: 1. ...           </search-results>
   2. ...                     </html>
   3. ..."
               │                 │
               ▼                 ▼
7. Call LLM API               8. Return HTML
   POST /v1/chat/completions
   { model, messages, ... }
               │
               ▼
8. Extract overview text
               │
               ▼
9. Inject into Lit component
               │
               ▼
10. Return final HTML
```

## Lit Component (`src/components/search-results.ts`)

A custom web component `<search-results>` that renders the UI reactively.

### Properties

| Property | Type | Description |
|---|---|---|
| `data` | `SearchResultsData` | Server-rendered search data (query, results, AI overview) |
| `theme` | `string` | Active theme name (dark, light, slate, ocean) |
| `themeMode` | `ThemeMode` | Theme resolution mode: `"dark" | "light" | "system"` |

### Data Structure

```typescript
interface SearchResultsData {
  query: string;
  results: SearXNGResult[];
  aiOverview?: string;
  aiOverviewError?: string;
  categories?: string[];
}
```

### Theme System

Four built-in themes with CSS custom properties:

| Theme | Description |
|---|---|
| `dark` | GitHub-dark inspired (default) |
| `light` | GitHub-light inspired |
| `slate` | Dark blue-slate palette |
| `ocean` | Dark ocean teal palette |

Theme preference is persisted via cookie (`aetherium-theme`).

## SearXNG Module (`src/searxng.ts`)

### `buildSearXNGUrl(config, q, opts)`

Constructs the full SearXNG search URL with query parameters.

### `getSearchHeaders(config)`

Builds HTTP headers for SearXNG requests, including optional Bearer auth.

### `formatResultsForLLM(results)`

Formats search results into text for LLM prompting.

## LLM Module (`src/llm.ts`)

### `getAIOverview(config, query, results)`

Sends a chat completion request to an OpenAI-compatible API.

**Request body:**
```json
{
  "model": "llama3.1-8b-instruct",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant..."
    },
    {
      "role": "user",
      "content": "Based on the following search results...\n\nResults:\n1. ...\n2. ..."
    }
  ],
  "max_tokens": 1024,
  "temperature": 0.7,
  "stream": false
}
```

**Response parsing:** Extracts `choices[0].message.content` as the overview text.

## Types (`src/types.ts`)

| Type | Description |
|---|---|
| `SearchQuery` | Incoming search parameters |
| `SearXNGResult` | A single search result from SearXNG |
| `SearXNGResponse` | Full SearXNG JSON response |
| `ChatMessage` | LLM chat message (system/user/assistant) |
| `LLMResponse` | Parsed LLM response with overview text |
| `SearchResult` | Final merged result for component data |

## Config (`src/config.ts`)

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
| `HTTPS` | Enable/disable HTTPS |
| `AI_OVERVIEW_PROMPT` | Custom prompt template with `{{query}}` and `{{results}}` placeholders |

## Running Locally

```bash
npm install
cp .env.example .env   # edit with your settings
npm run dev             # watches and restarts on changes
```

## Building for Production

```bash
npm run build    # compiles TypeScript + bundles Lit component
npm start        # runs the compiled app
```

## Docker

```bash
docker compose up -d      # build and start
docker compose logs -f    # view logs
docker compose down       # stop
```

## HTML Shell (`public/index.html`)

Minimal HTML page that loads the bundled Lit component and initializes it with data via inline scripts.

**Search endpoint shell format:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script type="module" src="/static/search-results.js"></script>
</head>
<body>
  <search-results id="app"></search-results>
  <script>
    document.getElementById("app").data = { query, results, aiOverview, aiOverviewError };
  </script>
</body>
</html>
```
