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

async function handleSearch(
  config: AppConfig,
  q: string,
  opts: { category?: string; engines?: string; language?: string; pageno?: string }
): Promise<SearchResult> {
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
      query: q.trim(),
      results: [],
      aiOverviewError: `SearXNG error: ${err?.message || "Unknown error"}`
    };
  }

  const results = formatSearXNGResults(searxngResponse);

  let aiOverview: string | undefined;
  let aiOverviewError: string | undefined;

  if (config.llmApiUrl) {
    try {
      const ai = await getAIOverview(config, q.trim(), results);
      aiOverview = ai.overview;
    } catch (err: any) {
      aiOverviewError = err?.message || "Unknown error";
    }
  } else {
    aiOverviewError = "LLM_API_URL not configured";
  }

  return {
    query: q.trim(),
    results,
    categories: opts.category ? [opts.category] : undefined,
    aiOverview,
    aiOverviewError
  };
}

function createHtmlShell(
  q: string,
  results: SearXNGResult[],
  aiOverview: string | undefined,
  aiOverviewError: string | undefined
): string {
  const initData = JSON.stringify({
    query: q,
    results,
    aiOverview,
    aiOverviewError
  });

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

    const result = await handleSearch(config, q, { category, engines, language, pageno });
    const html = createHtmlShell(
      result.query,
      result.results,
      result.aiOverview,
      result.aiOverviewError
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

    const result = await handleSearch(config, q, {
      category,
      engines,
      language,
      pageno: pageno?.toString()
    });
    const html = createHtmlShell(
      result.query,
      result.results,
      result.aiOverview,
      result.aiOverviewError
    );
    return reply.type("text/html").send(html);
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
