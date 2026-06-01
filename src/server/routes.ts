import crypto from "node:crypto";
import { Readable } from "node:stream";
import Fastify, { FastifyInstance } from "fastify";
import { SearXNGResponse, SearXNGResult } from "../shared/types.js";
import { AppConfig } from "./config.js";
import { getAIOverview } from "./llm.js";
import { buildSearXNGUrl, buildAutocompleterUrl, getSearchHeaders, interpolatePrompt } from "./searxng.js";
import { doWebScrape } from "./webscrapers/webscraper.js";
import type { ScrapedContent, ScraperConfig } from "./webscrapers/IScraper.js";

function cacheKey(q: string, opts: { category?: string; engines?: string; language?: string; pageno?: string }): string {
  return `${q}|${opts.category || ""}|${opts.engines || ""}|${opts.language || ""}|${opts.pageno || ""}`;
}

const searxngCache = new Map<string, { results: SearXNGResult[]; timestamp: number }>();
const sseControllers = new Map<string, AbortController>();
const scrapedContentStore = new Map<string, ScrapedContent[]>();
const CACHE_TTL_MS = 30_000;
const SSE_UPDATE_INTERVAL_MS = 50;
const SCRAPED_TTL_MS = 300_000; // 5 min TTL for scraped content

function getCacheEntry(key: string): SearXNGResult[] | undefined {
  const entry = searxngCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    searxngCache.delete(key);
    return undefined;
  }
  return entry.results;
}

async function fetchResults(
  config: AppConfig,
  q: string,
  opts: { category?: string; engines?: string; language?: string; pageno?: string },
  signal?: AbortSignal
): Promise<{ results: SearXNGResult[]; error?: string }> {
  const key = cacheKey(q, opts);
  const cached = getCacheEntry(key);
  if (cached) return { results: cached };

  const searxngUrl = buildSearXNGUrl(config, q, opts);
  const searxngHeaders = getSearchHeaders(config);

  let searxngResponse: SearXNGResponse;
  try {
    const searxngRes = await fetch(searxngUrl, { headers: searxngHeaders, signal });
    if (!searxngRes.ok) {
      throw new Error(`SearXNG error ${searxngRes.status}: ${searxngRes.statusText}`);
    }
    searxngResponse = await searxngRes.json() as SearXNGResponse;
  } catch (err: any) {
    return {
      results: [],
      error: `SearXNG error: ${err?.message || "Unknown error"}`
    };
  }

  const results = searxngResponse.results;
  searxngCache.set(key, { results, timestamp: Date.now() });
  return { results };
}

function buildSearchParamsString(opts: { category?: string; engines?: string; language?: string; pageno?: string }): string {
  const parts: string[] = [];
  if (opts.category) parts.push(`category=${encodeURIComponent(opts.category)}`);
  if (opts.engines) parts.push(`engines=${encodeURIComponent(opts.engines)}`);
  if (opts.language) parts.push(`language=${encodeURIComponent(opts.language)}`);
  if (opts.pageno) parts.push(`pageno=${encodeURIComponent(opts.pageno)}`);
  return parts.join("&");
}

export function buildRoutes(app: FastifyInstance, config: AppConfig, shutdownSignal?: AbortSignal) {
  app.get<{
    Querystring: { q: string; category?: string; engines?: string; language?: string; pageno?: string };
  }>("/api/search", async (request, reply) => {
    const { q, category, engines, language, pageno } = request.query;

    if (!q || !q.trim()) {
      reply.code(400);
      return reply.send({ error: "Query parameter 'q' is required" });
    }

    const { results, error } = await fetchResults(config, q.trim(), { category, engines, language, pageno }, shutdownSignal);

    return reply.send({
      query: q.trim(),
      results,
      number_of_results: results.length,
      searchParams: buildSearchParamsString({ category, engines, language, pageno }),
      aiOverviewEnabled: !!config.llmApiUrl && !error,
      researchMode: config.researchMode,
      error
    });
  });

  app.post<{ Body: { urls: string[] } }>("/api/scrape", async (request, reply) => {
    const { urls } = request.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return reply.code(400).send({ error: "urls array is required and must not be empty" });
    }

    const scraperConfig: ScraperConfig = {
      timeout: config.scraperTimeoutMs,
      contentLimit: config.scraperContentLimit,
      concurrency: config.scraperConcurrency,
      reddit: {
        maxTopLevelComments: config.scraperRedditMaxComments,
        maxCommentDepth: config.scraperRedditMaxDepth,
        commentMaxContent: config.scraperRedditCommentMaxLen,
        ignoreComments: config.scraperRedditIgnoreComments,
      },
      basicHtmlReader: {
        minReadableLength: config.scraperBasicHtmlMinReadable,
      },
    };

    const controller = new AbortController();
    const maxScrapeTime = config.scraperTimeoutMs * urls.length * 2;
    setTimeout(() => controller.abort(), maxScrapeTime);

    try {
      const results = await doWebScrape(urls, scraperConfig, controller.signal);
      const id = crypto.randomUUID();
      scrapedContentStore.set(id, results);
      setTimeout(() => scrapedContentStore.delete(id), SCRAPED_TTL_MS);
      controller.abort();
      return reply.send({ id, results });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return reply.code(408).send({ error: "Scrape timed out" });
      }
      return reply.code(500).send({ error: `Scrape failed: ${err.message}` });
    }
  });

  app.get<{
    Querystring: { q: string; category?: string; engines?: string; language?: string; pageno?: string; scrapedContentId?: string };
  }>("/search/stream", async (request, reply) => {
    const { q, category, engines, language, pageno, scrapedContentId } = request.query;

    if (!q || !q.trim()) {
      reply.code(400);
      return reply.send({ error: "Query parameter 'q' is required" });
    }

    reply.header("Content-Type", "text/event-stream");
    reply.header("Cache-Control", "no-cache");
    reply.header("Connection", "keep-alive");
    reply.header("X-Accel-Buffering", "no");
    reply.header("Access-Control-Allow-Origin", "*");

    const controller = new AbortController();
    const sessionId = crypto.randomUUID();
    sseControllers.set(sessionId, controller);

    if (shutdownSignal) {
      if (shutdownSignal.aborted) {
        controller.abort();
      } else {
        shutdownSignal.addEventListener(
          "abort",
          () => { controller.abort(); sseControllers.delete(sessionId); },
          { once: true }
        );
      }
    }

    reply.header("X-Session-Id", sessionId);

    let lastPush = 0;
    let buffer = "";
    let pushScheduled = false;
    let started = false;

    const stream = new Readable({
      async read() {
        if (started) return;
        started = true;
        stream.push(`event: session\ndata: ${sessionId}\n\n`);
        try {
          const { results } = await fetchResults(
            config, q.trim(),
            { category, engines, language, pageno },
            controller.signal
          );

          if (!config.llmApiUrl || !results.length) {
            stream.push(`event: error\ndata: {}\n\n`);
            stream.push(null);
            return;
          }

          function schedulePush() {
            if (pushScheduled) return;
            pushScheduled = true;
            const now = Date.now();
            const elapsed = now - lastPush;
            const delay = Math.max(0, SSE_UPDATE_INTERVAL_MS - elapsed);
            setTimeout(() => {
              pushScheduled = false;
              if (buffer) {
                stream.push('event: incremental\n');
                const lines = buffer.split(/\r?\n/);
                for (const line of lines) {
                  stream.push(`data: ${line}\n`);
                }
                stream.push('\n');
                lastPush = Date.now();
                buffer = "";
              }
            }, delay);
          }

         let customPrompt: string | undefined;
            if (scrapedContentId) {
              const scraped = scrapedContentStore.get(scrapedContentId);
              if (scraped && scraped.length > 0) {
                const resultsText = results
                  .slice(0, 10)
                  .map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Snippet: ${r.content || "No snippet"}`)
                  .join("\n\n");

                const scrapedText = scraped
                  .map(s => `Source: ${s.title}\nURL: ${s.metadata.url}\nContent:\n${s.content}`)
                  .join("\n\n---\n\n");

                customPrompt = `
You are an expert research synthesizer. Analyze the provided search results and scraped web page content to generate a comprehensive, deeply informed overview.

INSTRUCTIONS:
1. Begin with a brief 1-5 word **Query Intent:** phrase.
2. Organize findings under clear thematic headings.
3. Use scraped content to provide detailed, specific information beyond the snippets.
4. Place visual citation blocks beneath each section with clickable links to source domains.
5. Maintain a neutral, encyclopedic tone. No introductions or conclusions.
6. Keep each point to 1-3 concise sentences.

OUTPUT FORMAT:
**Query Intent:** [phrase]

**Category:** [Summary with details from scraped content.]
- [domain.com](url)

QUERY:
${q.trim()}

SEARCH RESULTS (snippets):
${resultsText}

SCRAPED CONTENT (full page text from top results):
${scrapedText}
`.trim();
              }
            }

           const ai = await getAIOverview(
             config,
             q.trim(),
             results,
             controller.signal,
             config.streamAIOverview
               ? (chunk, _partial) => {
                   buffer += chunk;
                   schedulePush();
                 }
               : undefined,
             customPrompt
           );

          if (buffer) {
            stream.push('event: incremental\n');
            const lines = buffer.split(/\r?\n/);
            for (const line of lines) {
              stream.push(`data: ${line}\n`);
            }
            stream.push('\n');
            buffer = "";
          }

          if (ai.thinking) {
            stream.push(`event: thinking\ndata: ${JSON.stringify({ thinking: ai.thinking })}\n\n`);
          }
         stream.push(`event: overview\ndata: ${JSON.stringify({ overview: ai.overview })}\n\n`);
           sseControllers.delete(sessionId);
           controller.abort();
           stream.push(null);
        } catch (err: any) {
          if (err.name === "AbortError" || err.name === "TimeoutError" || controller.signal.aborted) {
            sseControllers.delete(sessionId);
            stream.push(null);
            return;
          }
          console.error("SSE stream error:", err);
          sseControllers.delete(sessionId);
          stream.push(`event: error\ndata: {}\n\n`);
          stream.push(null);
        }
      }
    });

    return reply.send(stream);
  });

  app.post<{ Body: { sessionId: string } }>("/search/cancel", async (request, reply) => {
    const { sessionId } = request.body;
    const ac = sseControllers.get(sessionId);
    if (ac) {
      ac.abort();
      sseControllers.delete(sessionId);
    }
    return reply.send({ success: true });
  });

  app.get("/config", async (_request, reply) => {
    return reply.send({
      searxngUrl: config.searxngUrl,
      llmApiUrl: config.llmApiUrl,
      llmModel: config.llmModel,
      llmMaxTokens: config.llmMaxTokens,
      llmTemperature: config.llmTemperature,
      streamAIOverview: config.streamAIOverview,
      aiOverviewPrompt: config.aiOverviewPrompt,
      researchMode: config.researchMode,
      defaultTheme: config.defaultTheme,
      scraperTimeoutMs: config.scraperTimeoutMs,
      scraperContentLimit: config.scraperContentLimit,
      scraperConcurrency: config.scraperConcurrency,
      scraperRedditMaxComments: config.scraperRedditMaxComments,
      scraperRedditMaxDepth: config.scraperRedditMaxDepth,
      scraperRedditCommentMaxLen: config.scraperRedditCommentMaxLen,
      scraperRedditIgnoreComments: config.scraperRedditIgnoreComments,
      scraperBasicHtmlMinReadable: config.scraperBasicHtmlMinReadable,
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

    if (body?.researchMode !== undefined && typeof body.researchMode !== "boolean") {
      return reply.code(400).send({ success: false, message: "researchMode must be a boolean" });
    }

    return reply.send({ success: true, message: "Config updated. Restart required for changes to take effect." });
  });

  app.get<{
    Querystring: { q: string; category?: string };
  }>("/autocompleter", async (request, reply) => {
    const { q, category } = request.query;

    if (!q || !q.trim()) {
      return reply.code(400).send({ items: [] });
    }

    const searxngUrl = buildAutocompleterUrl(config, q.trim(), category);

    try {
      const res = await fetch(searxngUrl, {
        headers: getSearchHeaders(config),
        signal: shutdownSignal,
      });

      if (!res.ok) {
        return reply.code(res.status).send({ items: [] });
      }

      const [searchTerm, results] = await res.json() as [string, string[]];
      return reply.send({ items: results || [] });
    } catch {
      return reply.send({ items: [] });
    }
  });

  app.get("/health", async (_request, reply) => {
    return reply.send({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });
}
