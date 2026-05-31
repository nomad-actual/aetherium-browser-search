# Aetherium Browser Search

A privacy-focused browser search bar service that proxies queries to [SearXNG](https://github.com/searxng/searxng) for decentralized web search results and enhances them with AI-generated overviews from any OpenAI-compatible LLM (llama.cpp, Ollama, vLLM, etc.).

## Features

- **Browser Search Bar Integration** -- Configure any browser to use your service as a search engine via the OpenSearch / keyword URL format
- **SearXNG Proxy** -- Forward queries to a self-hosted or remote SearXNG instance, supporting categories (general, images, news, video, science, etc.)
- **AI Overview** -- Automatically generate a concise AI summary from top search results using any OpenAI-compatible LLM endpoint, streamed live via SSE
- **SPA Architecture** -- Client-side single-page application bundled with esbuild for fast, reactive rendering
- **Switchable Themes** -- Built-in gruvbox, tokyonight, and dark-aero themes with cookie-persisted user preference
- **Collapsible Thinking Block** -- View the LLM's reasoning process in a collapsible sidebar panel
- **Docker Ready** -- Multi-stage build with health checks, ready to deploy via `docker-compose`

## Architecture

```
Browser (search provider URL)
    │
    │ GET /search?q=<query>
    ▼
┌─────────────────────────────────┐
│  Fastify Service (TypeScript)   │
│  - SearXNG proxy                │
│  - LLM AI overview              │
│  - SPA HTML shell               │
└─────────┬───────────────┬───────┘
          │               │
          ▼               ▼
    ┌──────────┐   ┌──────────────┐
    │ SearXNG  │   │ OpenAI-Like  │
    │ Instance │   │ LLM API      │
    └──────────┘   └──────────────┘
          │               │
          └───────┬───────┘
                  ▼
         Client SPA (esbuild bundle)
         - Search results rendering
         - Theme switcher
         - SSE streaming client
```

## Quick Start

### Prerequisites

- Node.js 22+ (for local development)
- Docker & Docker Compose (for production)
- A running SearXNG instance
- An OpenAI-compatible LLM API (optional, e.g., llama.cpp, Ollama)

### Docker Compose (Recommended)

1. Copy and customize the environment file:

```bash
cp .env.example .env
```

2. Edit `.env` with your SearXNG URL and optional LLM settings:

```ini
SEARXNG_URL=http://localhost:8080
LLM_API_URL=http://localhost:8081
LLM_MODEL=llama3.1-8b-instruct
```

3. Start the service:

```bash
docker compose up -d
```

4. Visit `http://localhost:3000/health` to verify.

### Local Development

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## Browser Configuration

### Chrome / Edge / Brave

1. Open **Settings** → **Search engine** → **Manage search engines**
2. Under **Site search**, click **Add**
3. Fill in:
   - **Search engine**: Aetherium Search
   - **Keyword**: `@aether`
   - **URL with %s in place of query**: `https://your-domain.com/search?q=%s`
4. Now typing `@aether something` in the address bar will search via your service.

### Firefox

1. Open **Settings** → **Search**
2. Scroll to **Search Shortcuts**, click **Add**
3. Fill in:
   - **Name**: Aetherium Search
   - **Shortcut**: `@aether`
   - **URL**: `https://your-domain.com/search?q=%s`

### Safari

Safari uses your default search engine. Set your default to point to:

```
https://your-domain.com/search?q=
```

## Configuration

All settings are environment variables (see `.env.example`):

| Variable | Required | Default | Description |
|---|---|---|---|
| `SEARXNG_URL` | Yes | — | Base URL of your SearXNG instance |
| `SEARXNG_API_KEY` | No | — | API key if SearXNG requires authentication |
| `LLM_API_URL` | No | — | Base URL of the OpenAI-compatible LLM API |
| `LLM_API_KEY` | No | — | API key for the LLM endpoint |
| `LLM_MODEL` | No | `llama3.1-8b-instruct` | Model name to use |
| `LLM_MAX_TOKENS` | No | `1024` | Max tokens for LLM response |
| `LLM_TEMPERATURE` | No | `0.7` | LLM sampling temperature |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `0.0.0.0` | Server bind address |
| `AI_OVERVIEW_PROMPT` | No | Built-in | Custom prompt template for AI overview |

### AI Overview Prompt

Use `{{query}}` and `{{results}}` as placeholders:

```ini
AI_OVERVIEW_PROMPT=Synthesize the following search results into a concise answer for: {{query}}

Results:
{{results}}
```

## API Reference

### `GET /search`

Returns an HTML page with search results and AI overview.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Search query (required) |
| `category` | string | SearXNG category: `general`, `images`, `news`, `video`, `science`, `it`, `music`, `files`, `maps` |
| `engines` | string | Comma-separated SearXNG engines |
| `language` | string | Language code (e.g., `en`, `en-US`) |
| `pageno` | number | Page number |

**Example:**

```
GET https://search.yourdomain.com/search?q=what+is+aetherium&category=general
```

### `GET /config`

Returns current configuration (API keys masked).

**Response:**

```json
{
  "searxngUrl": "http://localhost:8080",
  "llmApiUrl": "http://localhost:8081",
  "llmModel": "llama3.1-8b-instruct",
  "llmApiKey": null,
  ...
}
```

### `POST /config`

Validate configuration changes (requires restart to apply).

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

## Project Structure

```
├── src/
│   ├── server/
│   │   ├── app.ts            # Fastify server bootstrap
│   │   ├── config.ts         # Environment schema, config loader, AppConfig
│   │   ├── routes.ts         # Fastify route handlers
│   │   ├── searxng.ts        # SearXNG URL builder, result formatting
│   │   └── llm.ts            # OpenAI-compatible LLM call
│   ├── client/
│   │   ├── app.ts            # Client SPA entry point
│   │   ├── search.ts         # Search page rendering, SSE client
│   │   ├── ui.ts             # Theme switching, escapeHtml
│   │   ├── markdown.ts       # markdownToHtml (marked + DOMPurify)
│   │   ├── autocomplete.ts   # Autocomplete dropdown
│   │   └── types.ts          # Client-side SearXNGResult type
│   └── shared/
│       └── types.ts          # Shared TypeScript interfaces
├── public/
│   ├── index.html            # HTML shell
│   └── css/
│       ├── base.css          # Base styles, layout, result styling
│       └── themes.css        # Theme color palettes
├── docker-compose.yml
├── Dockerfile
├── tsconfig.server.json
├── tsconfig.client.json
└── .env.example
```

## License

ISC
