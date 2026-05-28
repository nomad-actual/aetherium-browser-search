import Fastify, { FastifyInstance } from "fastify";
import { SearchResult, SearXNGResponse, SearXNGResult } from "./types.js";
import { AppConfig } from "./config.js";
import { getAIOverview } from "./llm.js";
import { buildSearXNGUrl, getSearchHeaders, formatResultsForLLM } from "./searxng.js";

function formatSearXNGResults(response: SearXNGResponse): SearXNGResult[] {
  return response.results.map((r) => ({
    title: r.title || "",
    url: r.url || "",
    content: r.content || "",
    img_src: r.img_src,
    engine: r.engine || "",
    engines: r.engines || [],
    parsed_url: r.parsed_url || [],
    score: r.score,
    category: r.category || "general"
  }));
}

function getSearchParams(query: string, category?: string, engines?: string, language?: string, pageno?: string) {
  return { query, category, engines, language, pageno };
}

async function fetchResults(
  config: AppConfig,
  q: string,
  opts: { category?: string; engines?: string; language?: string; pageno?: string }
): Promise<{ results: SearXNGResult[]; aiOverviewError?: string }> {
  const searxngUrl = buildSearXNGUrl(config, q, opts);
  const searxngHeaders = getSearchHeaders(config);

  let searxngResponse: SearXNGResponse;
  try {
    const searxngRes = await fetch(searxngUrl, { headers: searxngHeaders });
    if (!searxngRes.ok) {
      throw new Error(`SearXNG error ${searxngRes.status}: ${searxngRes.statusText}`);
    }
    searxngResponse = await searxngRes.json() as SearXNGResponse;
  } catch (err: any) {
    return {
      results: [],
      aiOverviewError: `SearXNG error: ${err?.message || "Unknown error"}`
    };
  }

  return { results: formatSearXNGResults(searxngResponse) };
}

function buildSearchParamsString(opts: { category?: string; engines?: string; language?: string; pageno?: string }): string {
  const parts: string[] = [];
  if (opts.category) parts.push(`category=${encodeURIComponent(opts.category)}`);
  if (opts.engines) parts.push(`engines=${encodeURIComponent(opts.engines)}`);
  if (opts.language) parts.push(`language=${encodeURIComponent(opts.language)}`);
  if (opts.pageno) parts.push(`pageno=${encodeURIComponent(opts.pageno)}`);
  return parts.join("&");
}

function createHtmlShell(
  q: string,
  results: SearXNGResult[],
  aiOverview: string | undefined,
  aiOverviewError: string | undefined,
  aiOverviewLoading: boolean,
  searchParams: string
): string {
  const initData = JSON.stringify({
    query: q,
    results,
    aiOverview,
    aiOverviewError,
    aiOverviewLoading
  });

  const sseScript = aiOverviewLoading && searchParams
    ? `<script>
(function() {
  const params = ${JSON.stringify(searchParams)};
  const source = new EventSource("/search/stream?" + params);
  source.addEventListener("overview", function(e) {
    try {
      const data = JSON.parse(e.data);
      const app = document.getElementById("app");
      if (app) {
        app.data = { ...app.data, aiOverview: data.overview, aiOverviewLoading: false };
      }
    } catch(err) {
      const app = document.getElementById("app");
      if (app) {
        app.data = { ...app.data, aiOverviewError: "Failed to load AI overview", aiOverviewLoading: false };
      }
    }
    source.close();
  });
  source.addEventListener("error", function() {
    const app = document.getElementById("app");
    if (app) {
      app.data = { ...app.data, aiOverviewError: "AI overview unavailable", aiOverviewLoading: false };
    }
    source.close();
  });
})();
</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${q} - Aetherium Search</title>
  <script type="module" src="/static/search-results.js"></script>
</head>
<body>
  <search-results id="app"></search-results>
  <script>
    document.getElementById("app").data = ${initData};
  </script>
  ${sseScript}
</body>
</html>`;
}

export function buildRoutes(app: FastifyInstance, config: AppConfig) {
  app.get<{
    Querystring: { q: string; category?: string; engines?: string; language?: string; pageno?: string };
  }>("/search", async (request, reply) => {
    const { q, category, engines, language, pageno } = request.query;

    if (!q || !q.trim()) {
      reply.code(400);
      return reply.send({ error: "Query parameter 'q' is required" });
    }

    const { results, aiOverviewError } = await fetchResults(config, q.trim(), { category, engines, language, pageno });
    const searchParams = buildSearchParamsString({ category, engines, language, pageno });
    const html = createHtmlShell(
      q.trim(),
      results,
      undefined,
      aiOverviewError,
      !!config.llmApiUrl && !aiOverviewError,
      searchParams
    );
    return reply.type("text/html").send(html);
  });

  app.post<{
    Body: { q: string; category?: string; engines?: string; language?: string; pageno?: number };
  }>("/search", async (request, reply) => {
    const { q, category, engines, language, pageno } = request.body;

    if (!q || !q.trim()) {
      reply.code(400);
      return reply.send({ error: "Query 'q' is required in request body" });
    }

    const { results, aiOverviewError } = await fetchResults(config, q.trim(), {
      category,
      engines,
      language,
      pageno: pageno?.toString()
    });
    const searchParams = buildSearchParamsString({ category, engines, language, pageno: pageno?.toString() });
    const html = createHtmlShell(
      q.trim(),
      results,
      undefined,
      aiOverviewError,
      !!config.llmApiUrl && !aiOverviewError,
      searchParams
    );
    return reply.type("text/html").send(html);
  });

  app.get<{
    Querystring: { q: string; category?: string; engines?: string; language?: string; pageno?: string };
  }>("/search/stream", async (request, reply) => {
    const { q, category, engines, language, pageno } = request.query;

    if (!q || !q.trim()) {
      reply.code(400);
      return reply.send({ error: "Query parameter 'q' is required" });
    }

    reply.header("Content-Type", "text/event-stream");
    reply.header("Cache-Control", "no-cache");
    reply.header("Connection", "keep-alive");

    try {
      const { results } = await fetchResults(config, q.trim(), { category, engines, language, pageno });

      if (!config.llmApiUrl || !results.length) {
        reply.raw.write(`event: error\ndata: {}\n\n`);
        reply.raw.end();
        return;
      }

      const ai = await getAIOverview(config, q.trim(), results);
      reply.raw.write(`event: overview\ndata: ${JSON.stringify({ overview: ai.overview })}\n\n`);
    } catch (err: any) {
      reply.raw.write(`event: error\ndata: {}\n\n`);
    }

    reply.raw.end();
  });

  app.get("/config", async (request, reply) => {
    return reply.send({
      searxngUrl: config.searxngUrl,
      llmApiUrl: config.llmApiUrl,
      llmModel: config.llmModel,
      llmMaxTokens: config.llmMaxTokens,
      llmTemperature: config.llmTemperature,
      aiOverviewPrompt: config.aiOverviewPrompt,
      llmApiKey: config.llmApiKey || null,
      searxngApiKey: config.searxngApiKey || null
    });
  });

  app.post("/config", async (request, reply) => {
    const body = request.body as Partial<AppConfig> | undefined;

    if (body?.searxngUrl !== undefined && typeof body.searxngUrl !== "string") {
      return reply.code(400).send({ success: false, message: "searxngUrl must be a string" });
    }

    if (body?.llmApiUrl !== undefined && typeof body.llmApiUrl !== "string") {
      return reply.code(400).send({ success: false, message: "llmApiUrl must be a string" });
    }

    return reply.send({ success: true, message: "Config updated. Restart required for changes to take effect." });
  });

  app.get("/health", async (request, reply) => {
    return reply.send({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });
}
