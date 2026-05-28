import { AppConfig } from "./config.js";
import { ChatMessage, LLMResponse, SearXNGResult } from "./types.js";
import { interpolatePrompt } from "./searxng.js";

export async function getAIOverview(
  config: AppConfig,
  query: string,
  results: SearXNGResult[]
): Promise<LLMResponse> {
  if (!config.llmApiUrl) {
    throw new Error("LLM_API_URL is not configured");
  }

  const systemPrompt =
    "You are a helpful assistant that provides concise, accurate overviews based on search results. Always cite sources when possible. If the results don't contain enough information to answer the query, say so clearly.";

  const userMessage = interpolatePrompt(config.aiOverviewPrompt, query, results);

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

  const body = JSON.stringify({
    model: config.llmModel,
    messages,
    max_tokens: config.llmMaxTokens,
    temperature: config.llmTemperature,
    stream: false
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (config.llmApiKey) {
    headers["Authorization"] = `Bearer ${config.llmApiKey}`;
  }

  const apiUrl = config.llmApiUrl.replace(/\/v1\/?$/, "").replace(/\/$/, "");
  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const message = data.choices?.[0]?.message;
  const content = message?.reasoning_content || message?.content || "";
  const overview = content || "No overview generated";

  return {
    overview,
    model: data.model,
    usage: data.usage
  };
}
