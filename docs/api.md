# API Documentation

Aetherium Browser Search exposes a REST API for search queries, configuration management, and health checks. All endpoints return JSON unless otherwise noted.

**Base URL:** `http://localhost:3000` (or your configured host/port)

**Default Content Types:**

| Endpoint | Response Type |
|---|---|
| `GET /search` | `text/html` |
| `POST /search` | `text/html` |
| `GET /config` | `application/json` |
| `POST /config` | `application/json` |
| `GET /health` | `application/json` |

---

## Search Endpoints

### `GET /search`

Performs a web search via SearXNG, optionally generates an AI overview via an LLM, and returns a fully rendered HTML page containing the `<search-results>` Lit web component.

**Query Parameters:**

| Parameter | Required | Type | Default | Description |
|---|---|---|---|---|
| `q` | Yes | string | — | The search query (URL-encoded) |
| `category` | No | string | `general` | SearXNG search category. One of: `general`, `images`, `news`, `video`, `science`, `it`, `music`, `files`, `maps` |
| `engines` | No | string | (all) | Comma-separated list of SearXNG engine names (e.g., `google,duckduckgo`) |
| `language` | No | string | (default) | BCP 47 language tag filter (e.g., `en`, `en-US`, `de`, `ja`) |
| `pageno` | No | integer | `1` | Page number for pagination (1-based) |

**Response:** `text/html`

A complete HTML document containing the `<search-results>` Lit web component initialized with server-rendered data. The component receives a `data` attribute with the following structure:

```json
{
  "query": "typescript tutorial",
  "results": [
    {
      "title": "TypeScript Tutorial",
      "url": "https://www.typescriptlang.org/docs/",
      "content": "Learn TypeScript...",
      "engine": "google",
      "engines": ["google"],
      "category": "general"
    }
  ],
  "aiOverview": "TypeScript is a strongly typed programming language...",
  "aiOverviewError": null,
  "categories": ["general"]
}
```

**Example Request:**

```
GET /search?q=how+to+fix+a+leaky+faucet&category=general&language=en
```

**Example Request (from browser search bar):**

```
https://search.example.com/search?q=site+reddit+typescript+best+practices
```

---

### `POST /search`

Same as `GET /search` but accepts search parameters in the request body as JSON. Useful for programmatic integration or when the query contains characters that are problematic in URLs.

**Request Body (`application/json`):**

| Field | Required | Type | Default | Description |
|---|---|---|---|---|
| `q` | Yes | string | — | The search query |
| `category` | No | string | `general` | SearXNG search category |
| `engines` | No | string | (all) | Comma-separated engine names |
| `language` | No | string | (default) | BCP 47 language tag |
| `pageno` | No | integer | `1` | Page number (1-based) |

**Response:** `text/html` — same format as `GET /search`.

**Example Request:**

```http
POST /search
Content-Type: application/json

{
  "q": "what is the capital of France?",
  "category": "general",
  "language": "en"
}
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

All other config fields are not modifiable via this endpoint.

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

Each result in the `results` array follows the SearXNG result format:

| Field | Type | Description |
|---|---|---|
| `title` | string | Result title |
| `url` | string | Result URL |
| `content` | string | Snippet/description text |
| `img_src` | string (nullable) | Image URL (for image results) |
| `engine` | string | Primary search engine name |
| `engines` | string[] | All engines that returned this result |
| `parsed_url` | string[] | Parsed URL components |
| `score` | number (nullable) | Relevance score |
| `category` | string | Search category |

### AI Overview

When an LLM is configured, the `aiOverview` field contains a generated summary based on the top search results. The system prompt and result formatting are defined in the `AI_OVERVIEW_PROMPT` environment variable.

**Prompt Template Placeholders:**

| Placeholder | Replaced With |
|---|---|
| `{{query}}` | The user's search query |
| `{{results}}` | Formatted text of the top 10 search results |

---

## Authentication

No authentication is required for API endpoints by default. SearXNG and LLM API keys (if configured) are used for upstream service authentication only and are not exposed via the `/config` endpoint.

---

## Rate Limiting

No rate limiting is implemented at the application level. Rate limiting should be configured at the reverse proxy or load balancer layer if needed.
