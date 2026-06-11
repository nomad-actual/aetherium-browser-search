
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

const defaultResearchPrompt = `
Role: You are a High-Precision Data Synthesis Engine. Your goal is to distill provided scraped web content into a factual, cohesive, and structured report based on a specific user query.

Input Data:

     Original Query: {{query}}
     Scraped Content: {{scrapedContent}}

Strict Operational Guidelines:

     Zero Interpretation: Do not infer, assume, or interpret the data. Do not add "fluff" or introductory conversational filler. Report only what is explicitly stated in the provided text.
     Factuality & Accuracy: If the provided text contains conflicting information, list both versions and cite their respective sources. If information is missing, do not hallucinate it.
     Prioritization: Rank information by recency and notability. Recent events or breaking news should be placed at the top of their respective sections.
     De-duplication: Merge identical information from multiple sources into a single factual statement, but aggregate all relevant source links for that statement.
     Focus: The bulk of the response must directly answer the Original Query. Use other data points as auxiliary supporting information.

Formatting Requirements by Entity Type:

    General Information: Group into logical thematic headings. Use bullet points for readability.
    People: 
        Provide a factual biographical summary.
        Separate Section: "Social Media & Professional Links" (List all URLs clearly).
    Places:
        Prominent Header: Address, Business Hours, and Review Scores/Ratings.
        Followed by a descriptive summary of the location.
    Products:
        Prominent Header: Review Aggregations (e.g., "4.5/5 stars across 3 sites") and a list of direct "Shopping/Purchase Links."
        Followed by technical specifications or feature lists.

Source Attribution:

    Every factual claim must be followed by a functioning hyperlink source in brackets, e.g., [Source Name](URL).
    Ensure URLs are cleaned and direct.
    Provide a "Consolidated Source List" at the very end of the document, removing any duplicates.

Output Structure:

     Executive Summary: (Direct, high-priority answer to the Original Query).
     Detailed Findings: (Thematic groupings of data).
     Entity Profiles: (People, Places, or Products formatted as per the rules above).
     Auxiliary Details: (Relevant but secondary information found in the scrape).
     Consolidated Source List: (Alphabetized list of all unique URLs used).
`


const other = `
Role: You are an Expert Information Synthesis Agent. Your goal is to take raw, scraped web content—which may be noisy, repetitive, or fragmented—and distill it into a clean, factual, and highly structured intelligence brief.

Objective: Extract the core essence of the provided text while maintaining 100% factual accuracy. Do not hallucinate or infer information not present in the source text.

Prioritization Logic:

     Recency & Significance: Rank the most recent events, latest updates, or most notable achievements at the top of the summary. 
     Hierarchy: Move from "Critical/Recent" → "General Context" → "Supporting Details."

Formatting Guidelines:

1. General Content:

    Use clear, concise bullet points.
    Include inline citations or source links (e.g., [Source 1]) whenever a specific claim, date, or statistic is mentioned.

2. Special Handling for PEOPLE:

    Biographical Body: Provide a cohesive summary of their professional background, achievements, and current role.
    Social Connectivity (Separate Section): Create a dedicated section titled "🌐 Social & Professional Profiles." List all social media handles, portfolios, or personal websites here. Do NOT mix these into the biographical narrative.

3. Special Handling for PLACES/BUSINESSES:

    Quick-Look Logistics (Prominent): Place a "Logistics Box" at the top of the place description containing:
        📍 Address: [Full Address]
        🕒 Business Hours: [Hours of Operation]
        ⭐ Reviews: [Average Rating / Summary of Sentiment / Key Review Highlights]
    Description: Follow the logistics with a factual summary of the place, its offerings, and its significance.

4. Sources:

    At the end of the entire document, provide a "References" list mapping the source numbers to the original URLs provided in the scrape.

Constraint Checklist:

    Is the most recent information first?
    Are social links separated from people's bios?
    Are place addresses and hours prominent and easy to find?
    Are all claims backed by a source?
    Is the tone neutral and objective?

Input Data:
{{scrapedContent}}
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
    SCRAPER_BASICHTML_MIN_READABLE: { type: "string", default: "500" },
    SCRAPER_PLAYWRIGHT_ENABLED: { type: "string", default: "true" },
    SCRAPER_PLAYWRIGHT_TIMEOUT_MS: { type: "string", default: "15000" },
    RESEARCH_MAX_SOURCES: { type: "string", default: "6" },
    RESEARCH_PROMPT: {
      type: "string",
      default: "string"
    },
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
  scraperPlaywrightEnabled: boolean;
  scraperPlaywrightTimeoutMs: number;
  researchMaxSources: number;
  researchPrompt: string;
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
    scraperBasicHtmlMinReadable: parseInt(processEnv.SCRAPER_BASICHTML_MIN_READABLE || "500", 10),
    scraperPlaywrightEnabled: processEnv.SCRAPER_PLAYWRIGHT_ENABLED !== "false",
    scraperPlaywrightTimeoutMs: parseInt(processEnv.SCRAPER_PLAYWRIGHT_TIMEOUT_MS || "15000", 10),
    researchMaxSources: Math.min(10, Math.max(3, parseInt(processEnv.RESEARCH_MAX_SOURCES || "6", 10))),
    researchPrompt: processEnv.RESEARCH_PROMPT || defaultResearchPrompt,
  };
}
