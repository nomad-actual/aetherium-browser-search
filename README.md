# Aetherium Browser Search

A privacy-focused browser search bar service that proxies queries to [SearXNG](https://github.com/searxng/searxng) for decentralized web search results and enhances them with AI-generated overviews from any OpenAI-compatible LLM (llama.cpp, Ollama, vLLM, etc.).

## Features

- **Browser Search Bar Integration** -- Configure any browser to use your service as a search engine via the OpenSearch / keyword URL format
- **SearXNG Proxy** -- Forward queries to a self-hosted or remote SearXNG instance, supporting categories (general, images, news, video, science, etc.)
- **AI Overview** -- Automatically generate a concise AI summary from top search results using any OpenAI-compatible LLM endpoint
- **Lit Web Components** -- Modern, framework-native UI built with Lit web components for fast, reactive rendering
- **Switchable Themes** -- Built-in gruvbox and tokyonight themes with cookie-persisted user preference
- **HTTPS Support** -- Built-in HTTPS with Let's Encrypt / custom certificates, falls back to HTTP if certs are unavailable
- **Docker Ready** -- Multi-stage build with health checks, ready to deploy via `docker-compose`

## Architecture

```
Browser (search provider URL)
    │
    │ GET /search?q=<query>
    ▼
┌─────────────────────────────────┐
│  Fastify Service (TypeScript)   │
│  - HTTPS / HTTP                 │
│  - SearXNG proxy                │
│  - LLM AI overview              │
│  - Lit UI component             │
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
         Lit Web Component
         (search-results)
         - Theme switcher
         - Reactive rendering
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

3. (Optional) Place HTTPS certificates in `certs/` directory:

```bash
mkdir -p certs
# Place cert.pem and key.pem in certs/
# Or use certbot: certbot certonly --standalone -d search.yourdomain.com
```

4. Start the service:

```bash
docker compose up -d
```

5. Visit `http://localhost:3000/health` to verify.

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
| `HTTPS` | No | `true` | Enable HTTPS |
| `HTTPS_CERT_FILE` | No | `/certs/cert.pem` | Path to TLS certificate |
| `HTTPS_KEY_FILE` | No | `/certs/key.pem` | Path to TLS private key |
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

### `POST /search`

Same as GET but accepts a JSON body.

**Body:**

```json
{
  "q": "what is aetherium",
  "category": "general",
  "language": "en"
}
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
│   ├── app.ts            # Fastify server bootstrap, HTTPS setup
│   ├── config.ts         # Environment schema, config loader, AppConfig
│   ├── routes.ts         # Fastify route handlers
│   ├── searxng.ts        # SearXNG URL builder, result formatting
│   ├── llm.ts            # OpenAI-compatible LLM call
│   ├── types.ts          # TypeScript type definitions
│   └── components/
│       └── search-results.ts  # Lit web component with theme switching
├── public/
│   ├── index.html        # HTML shell
│   └── search-results.js # Bundled Lit component
├── scripts/
│   └── bundle-lit.ts     # esbuild bundler for Lit component
├── docker-compose.yml
├── Dockerfile
├── tsconfig.json
└── .env.example
```

## License

ISC
