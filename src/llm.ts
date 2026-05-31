import { AppConfig } from "./config.js";
import { ChatMessage, LLMResponse, SearXNGResult } from "./types.js";
import { interpolatePrompt } from "./searxng.js";

export async function getAIOverview(
  config: AppConfig,
  query: string,
  results: SearXNGResult[],
  signal?: AbortSignal,
  onChunk?: (text: string, partial: string) => void
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
    max_thinking_tokens: 0,
    temperature: config.llmTemperature,
    stream: true,
    stream_options: { include_usage: true }
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (config.llmApiKey) {
    headers["Authorization"] = `Bearer ${config.llmApiKey}`;
  }

  const apiUrl = new URL("/v1/chat/completions", config.llmApiUrl.replace(/\/+$/, "")).toString();
  const combinedSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000);
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body,
    signal: combinedSignal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    return { overview: "No overview generated" };
  }

  let overview = "";
  let thinking = "";
  let model: string | undefined;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) {
      reader.cancel(new DOMException("Aborted", "AbortError"));
      throw new DOMException("Aborted", "AbortError");
    }
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;

      const jsonStr = trimmed.slice("data:".length).trim();
      if (jsonStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const delta = parsed.choices?.[0]?.delta;

        if (delta?.content) {
          overview += delta.content;
          if (onChunk) {
            onChunk(delta.content, overview);
          }
        }
        if (delta?.reasoning_content) {
          thinking += delta.reasoning_content;
        }
        if (delta?.thinking) {
          thinking += delta.thinking;
        }
        if (parsed.model) {
          model = parsed.model;
        }
        if (parsed.usage) {
          // usage comes at the end
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  // Clean up overview: remove any thinking artifacts that leaked in
  if (thinking) {
    overview = cleanThinkingFromResponse(overview, thinking);
  }

  overview = overview.trim();
  if (!overview) {
    overview = "No overview generated";
  }

  return {
    overview,
    thinking: thinking.trim() || undefined,
    model,
    usage: undefined
  };
}

function cleanThinkingFromResponse(overview: string, thinking: string): string {
  // If thinking is present, the model likely included it in the response too.
  // Try to extract just the actual answer by finding common thinking markers.
  const thinkingPatterns = [
    // "Here's a thinking process:" or similar intros
    /^here['\u2019]s\s+(a\s+)?(?:thinking|reasoning|thought)\s*(process|analysis)?[\s\S]*?(?=\n{2,}|\d+\.\s)/i,
    // "1. Analyze..." numbered thinking blocks
    /^(?:\d+\.\s+.+?\n)+/s,
    // "Self-Correction", "Let me think", "OK so", "Alright" intros
    /^(?:(?:self\s*[-]?\s*correction|let\s+me\s+think|ok\s*(?:so)?|alright|okay|wait|hold\s+on|actually|note)[:\s].*?\n)+/i,
    // "Output matches", "Proceed", "Draft structure" meta
    /(?:output\s+(?:matches?|is|generates?)|proceed(?:\s+now)?|draft\s+(?:structure|looks?))[:\s].*$/i,
    // Checkmark / emoji thinking markers
    /[\u2705\u2713\xE2\x9C\x93]\s*/g,
    // Multiple blank lines followed by thinking-like content
    /\n{3,}\s*(?:\d+\.\s+|Self\s*[-]?|Check\s+|Let\s+me|Actually|Wait)/
  ];

  let cleaned = overview;

  for (const pattern of thinkingPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Remove common thinking phrases that may appear inline
  const inlinePatterns = [
    /(?:\s|^)Here['\u2019]s\s+(a\s+)?(?:thinking|reasoning|thought)\s*(process|analysis)?(?:\s*\n)?/g,
    /(?:\s|^)(?:Self[-\s]correction|Let\s+me\s+think|OK\s*(?:so)?|Alright|Actually|Note)\s*:\s*/gi,
    /(?:\s|^)(?:output\s+(?:matches?|is)|proceed(?:\s+now)?|draft\s+(?:structure|looks?))\s*[:.]/gi,
    /(?:^|\s)Check(?:\s+against|\s+snippet|\s+facts)\s*:?\s*/gi,
    /(?:^|\s)Structure\s*:\s*/gi,
    /(?:^|\s)Perfect\s*\.\s*/gi,
    /(?:^|\s)Ready\s*\.\s*/gi,
    /(?:^|\s)(?:Proceed(?:s|ed)?|Generating|Generating\.)\s*/gi,
  ];

  for (const pattern of inlinePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Remove lines that look like thinking meta-comments
  const lines = cleaned.split("\n");
  const thinkingLinePatterns = [
    /(?:^|\s)(?:self[-\s]correction|self[-\s]check|self[-\s]verify)[:\s]/i,
    /(?:^|\s)(?:let['\u2019]s\s+verify|let['\u2019]s\s+check|verify\s+against)/i,
    /(?:^|\s)(?:one\s+minor\s+adjustment|minor\s+adjustment)/i,
    /(?:^|\s)(?:all\s+(?:good|align|check|aligned))\s*[:.]?/i,
    /(?:^|\s)(?:the\s+draft\s+looks?|looks?\s+solid)/i,
    /(?:^|\s)(?:constraint|constraints?|all\s+constraints?|meta\s*(?:check|note))\s*:?\s*/i,
    /(?:^|\s)(?:\d+\.\s+(?:check|verify|ensure|confirm|map))/i,
  ];

  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    for (const pattern of thinkingLinePatterns) {
      if (pattern.test(trimmed)) return false;
    }
    return true;
  });

  cleaned = filtered.join("\n");

  // Clean up whitespace: collapse multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}
