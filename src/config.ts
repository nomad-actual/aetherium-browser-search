
const defaultPrompt = `
You are an expert research synthesizer. Analyze the provided search results and generate a concise, accurately sourced summary.

INSTRUCTIONS:
1. QUERY MEANING PREVIEW: Begin with exactly 1-5 words that capture the core intent or meaning of the original query. Format: **Query Intent:** [1-5 word phrase]. Infer this from the context/results if not explicitly provided. No explanations.
2. THEMATIC GROUPING: Organize findings under clear key-point headings (e.g., **Video Games:**, **Filmography:**, **Public Controversies:**). Each heading must cover one distinct topic or career segment.
3. CITATION FORMAT: Every factual claim must be followed by clickable markdown citations formatted as [registered-domain.tld](exact-source-url). The visible text must ONLY be the root domain/TLD. The hyperlink target must point directly to the exact page where the information was found.
4. SOURCE CLUSTERING: Combine multiple sources supporting the same clause using commas: Claim text [domain1.com](url1), [domain2.org](url2). Order citations alphabetically by domain. Strip subdomains, paths, and tracking parameters from the visible text only (e.g., https://en.wikipedia.org/wiki/Page → [wikipedia.org](https://en.wikipedia.org/wiki/Page)).
5. FIDELITY & TONE: Maintain a neutral, encyclopedic tone. No introductions, conclusions, or speculative content. Only include facts explicitly present in the input. If sources conflict, note the discrepancy and cite all relevant domains.
6. LENGTH & CLARITY: Keep each key point to 1-3 concise sentences. Prioritize high-signal information; discard repetitive or low-confidence snippets.

OUTPUT FORMAT:
***(User's Query Intent expressed in 1-5 words)***

**Category/Key Point:** [Summary sentence(s) with clickable domain citations]. 
**Category/Key Point:** [Summary sentence(s) with clickable domain citations].
...

EXAMPLE:
Video Games: She is notable for voicing Nightwarden Minthara in Baldur's Gate 3 [reddit.com](https://www.reddit.com/r/BaldursGate3/comments/abc), [wikidata.org](https://www.wikidata.org/wiki/Q123) and has also voiced the Empire commander in Battlefront II [starwars.com](https://www.starwars.com/news/battlefront-ii-cast).

QUERY:
{{query}}

PROCESS THE FOLLOWING SEARCH RESULTS:
{{results}}
`


export const envSchema = {
  type: "object",
  required: ["SEARXNG_URL"],
  properties: {
    PORT: { type: "string", default: "3000" },
    HOST: { type: "string", default: "0.0.0.0" },
    SEARXNG_URL: { type: "string", description: "Base URL of your SearXNG instance" },
    SEARXNG_API_KEY: { type: "string", default: "" },
    LLM_API_URL: { type: "string", description: "Base URL of the OpenAI-compatible LLM API (e.g. llamacpp)" },
    LLM_API_KEY: { type: "string", default: "" },
    LLM_MODEL: { type: "string", default: "llama3.1-8b-instruct" },
    LLM_MAX_TOKENS: { type: "string", default: "1024" },
    LLM_TEMPERATURE: { type: "string", default: "0.2" },
    STREAM_AI_OVERVIEW: { type: "string", default: "true" },
    AI_OVERVIEW_PROMPT: {
      type: "string",
      default: "Based on the following search results, provide a concise, informative overview answering the user's query. Synthesize the key points and cite sources where relevant. Query: {{query}}\n\nResults:\n{{results}}"
    }
  }
};

export interface AppConfig {
  searxngUrl: string;
  searxngApiKey: string;
  llmApiUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmMaxTokens: number;
  llmTemperature: number;
  streamAIOverview: boolean;
  aiOverviewPrompt: string;
}

export function buildConfig(processEnv: NodeJS.ProcessEnv): AppConfig {
  return {
    searxngUrl: processEnv.SEARXNG_URL || "",
    searxngApiKey: processEnv.SEARXNG_API_KEY || "",
    llmApiUrl: processEnv.LLM_API_URL || "",
    llmApiKey: processEnv.LLM_API_KEY || "",
    llmModel: processEnv.LLM_MODEL || "llama3.1-8b-instruct",
    llmMaxTokens: parseInt(processEnv.LLM_MAX_TOKENS || "1024", 10),
    llmTemperature: parseFloat(processEnv.LLM_TEMPERATURE || "0.7"),
    streamAIOverview: processEnv.STREAM_AI_OVERVIEW !== "false",
    aiOverviewPrompt: processEnv.AI_OVERVIEW_PROMPT || defaultPrompt
  };
}
