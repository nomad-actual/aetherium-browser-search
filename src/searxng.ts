import { AppConfig } from "./config.js";
import { SearXNGResult } from "./types.js";

export function buildSearXNGUrl(config: AppConfig, q: string, opts: {
  category?: string;
  engines?: string;
  language?: string;
  pageno?: string;
}): string {
  const params = new URLSearchParams();
  params.set("q", q.trim());
  params.set("format", "json");

  if (opts.category) {
    params.set("categories", opts.category);
  }
  if (opts.engines) {
    params.set("engines", opts.engines);
  }
  if (opts.language) {
    params.set("language", opts.language);
  }
  if (opts.pageno) {
    params.set("pageno", opts.pageno);
  }

  const base = config.searxngUrl.replace(/\/+$/, "");
  return `${base}/search?${params.toString()}`;
}

export function getSearchHeaders(config: AppConfig): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (config.searxngApiKey) {
    headers["Authorization"] = `Bearer ${config.searxngApiKey}`;
  }
  return headers;
}

export function interpolatePrompt(
  prompt: string,
  query: string,
  results: SearXNGResult[]
): string {
  const resultsText = results
    .slice(0, 10)
    .map(
      (r, i) =>
        `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Snippet: ${r.content || "No snippet available"}`
    )
    .join("\n\n");
  return prompt
    .replace(/{{query}}/g, query)
    .replace(/{{results}}/g, resultsText);
}
