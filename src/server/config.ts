
const defaultPrompt = `
You are an expert research synthesizer. Analyze the provided search results and generate a concise, accurately sourced summary.

INSTRUCTIONS:
1. QUERY INTENT PREVIEW: Begin with exactly 1–5 words capturing the core meaning of the query. Format: **Query Intent:** [phrase]. Infer from context if not explicitly stated. No explanations.
2. THEMATIC GROUPING: Organize findings under clear key-point headings (e.g., **Video Games:**, **Filmography:**, **Public Controversies:**). Each heading must cover one distinct topic or career segment.
3. VISUAL CITATION BLOCK: Place a dedicated source block directly beneath each category's summary paragraph. Format sources as a clean bulleted list for clear visual separation. Do NOT embed citations inline, mid-sentence, or at the end of individual sentences.
4. LINK FORMAT: Each citation must be a clickable markdown link: [registered-domain.tld](exact-source-url). Visible text = root domain only (strip www, subdomains, paths, and tracking parameters). Link target = exact source page URL. Alphabetize domains within each block.
5. FIDELITY & TONE: Maintain a neutral, encyclopedic tone. No introductions, conclusions, or speculative content. Only include facts explicitly present in the input. If sources conflict within a category, note it in the summary and include all relevant domains in that section's citation block.
6. LENGTH & CLARITY: Keep each key point to 1–3 concise sentences. Prioritize high-signal information; discard repetitive or low-confidence snippets.

OUTPUT FORMAT:
***(User's Query Intent expressed in 1-5 words)***

**Category/Key Point:** [Summary sentence(s).]
- [domain1.com](url1)
- [domain2.org](url2)

**Category/Key Point:** [Summary sentence(s).]
- [domain3.net](url3)
- [domain4.com](url4)

EXAMPLE:
***Voice actress career highlights***

**Video Games:** She is notable for voicing Nightwarden Minthara in Baldur's Gate 3. She has also voiced the Empire commander in Battlefront II, and contributed to several indie RPG soundtracks.
- [reddit.com](https://www.reddit.com/r/BaldursGate3/comments/abc)
- [starwars.com](https://www.starwars.com/news/battlefront-ii-cast)
- [wikidata.org](https://www.wikidata.org/wiki/Q123)

**Filmography:** She appeared in supporting roles on several streaming dramas and made her theatrical debut in an award-winning indie film.
- [imdb.com](https://www.imdb.com/name/nm123456/)
- [variety.com](https://variety.com/2023/film/news/debut-123/)

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
    },
    RESEARCH_MODE: { type: "string", default: "false" },
    DEFAULT_THEME: { type: "string", default: "paper" },
    SCRAPER_TIMEOUT_MS: { type: "string", default: "15000" },
    SCRAPER_CONTENT_LIMIT: { type: "string", default: "8000" },
    SCRAPER_CONCURRENCY: { type: "string", default: "3" },
    SCRAPER_REDDIT_MAX_COMMENTS: { type: "string", default: "10" },
    SCRAPER_REDDIT_MAX_DEPTH: { type: "string", default: "3" },
    SCRAPER_REDDIT_COMMENT_MAX_LEN: { type: "string", default: "2000" },
    SCRAPER_REDDIT_IGNORE_COMMENTS: { type: "string", default: "false" },
    SCRAPER_BASICHTML_MIN_READABLE: { type: "string", default: "500" }
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
  researchMode: boolean;
  defaultTheme: string;
  scraperTimeoutMs: number;
  scraperContentLimit: number;
  scraperConcurrency: number;
  scraperRedditMaxComments: number;
  scraperRedditMaxDepth: number;
  scraperRedditCommentMaxLen: number;
  scraperRedditIgnoreComments: boolean;
  scraperBasicHtmlMinReadable: number;
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
    aiOverviewPrompt: processEnv.AI_OVERVIEW_PROMPT || defaultPrompt,
    researchMode: processEnv.RESEARCH_MODE === "true",
    defaultTheme: processEnv.DEFAULT_THEME || "paper",
    scraperTimeoutMs: parseInt(processEnv.SCRAPER_TIMEOUT_MS || "15000", 10),
    scraperContentLimit: parseInt(processEnv.SCRAPER_CONTENT_LIMIT || "8000", 10),
    scraperConcurrency: parseInt(processEnv.SCRAPER_CONCURRENCY || "3", 10),
    scraperRedditMaxComments: parseInt(processEnv.SCRAPER_REDDIT_MAX_COMMENTS || "10", 10),
    scraperRedditMaxDepth: parseInt(processEnv.SCRAPER_REDDIT_MAX_DEPTH || "3", 10),
    scraperRedditCommentMaxLen: parseInt(processEnv.SCRAPER_REDDIT_COMMENT_MAX_LEN || "2000", 10),
    scraperRedditIgnoreComments: processEnv.SCRAPER_REDDIT_IGNORE_COMMENTS === "true",
    scraperBasicHtmlMinReadable: parseInt(processEnv.SCRAPER_BASICHTML_MIN_READABLE || "500", 10)
  };
}
