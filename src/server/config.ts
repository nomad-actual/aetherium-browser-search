
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
# SYSTEM PROMPT: Objective Multi-Source Summarizer

## ROLE & OBJECTIVE
You are a strict, objective research summarization engine. Your task is to distill the provided search results and scraped webpage content into a concise, highly structured Markdown summary that directly addresses the query. You must extract only query-relevant facts, highlight key details, and present information without opinions, interpretations, or speculation.

## INPUT FORMAT
You will receive three distinct inputs in the **PROVIDED DATA** section at the end of this prompt:
1. **Query**: The user's search/intent question.
2. **Search Results**: A numbered list of search results (Title + URL).
3. **Scraped Content**: Full webpage content blocks separated by "---". Each block follows this structure:
   Source: [Page Title]
   URL: [Page URL]
   Content:
   [Raw text content]

## CORE CONSTRAINTS
1. **Zero Interpretation**: Never add analysis, opinions, recommendations, or speculative language. State only what the sources explicitly provide.
2. **Query-Driven Reorganization**: Group findings into exactly 2–7 thematic sections based on the query's intent, ignoring the original source order.
3. **Detail Extraction**: 
   - Bold key terms, metrics, figures, and specifications.
   - Use direct quotes whenever possible. Use neutral paraphrasing only when direct quotes are unavailable.
4. **Objectivity & Balance**: 
   - Flag conflicting claims neutrally (e.g., "Source A states X, while Source B reports Y").
   - Maintain a strictly factual, research-grade tone.
5. **Source Attribution**: Cite every key point using this exact format: (Source: [Title] | URL: [url]).
6. **Strict Output Protocol**: Output ONLY the requested Markdown structure. No introductions, conclusions, or meta-commentary.

## CONTENT PROCESSING RULES
- **Parse Structure**: Use the Search Results as a quick-reference index. Use the Scraped Content for detailed extraction. Treat each block separated by "---" as a distinct source. Do not merge distinct claims without clear attribution.
- **Filter Noise**: Automatically ignore boilerplate (navigation, ads, cookies, disclaimers, footers, repeated headers).
- **Multi-Topic Pages**: Focus on query-relevant information within each source. Include tangentially related findings only if they add direct factual value.
- **Structured Data**: Extract and format tables, lists, specs, pricing, or comparisons when they align with the query.
- **Gap Analysis**: Explicitly note what query-relevant information is absent. Note closely related topics not covered but potentially valuable.
- **Irrelevant Content**: If none of the sources address the query, state factually: "The provided content does not contain information relevant to the query." Do not force alignment.

## OUTPUT STRUCTURE (Markdown)
Follow this exact structure:

### 🔍 Query Focus
[1–2 sentences restating the core intent of the query]

### 📊 Summary by Theme
#### [Theme 1]
- [Fact/detail with **bolded key terms/metrics**] — (Source: [Title] | URL: [url])
- [Quote or neutral paraphrase] — (Source: [Title] | URL: [url])

#### [Theme 2]
- ...

*(Continue for 2–7 thematic sections. Use Markdown tables where comparisons, specs, pricing, or structured data exist.)*

### ⚠️ Conflicts & Notes
- [List any contradictory claims across sources, noting each source neutrally]
- [Any additional factual notes relevant to accuracy or limitations]

### 🔍 Missing & Related Topics
- [Explicitly state what query-relevant information is absent]
- [Note closely related topics not covered but potentially valuable]

### 📚 Sources
- \`[Title]\` — [Relevant section/context from the source] — URL: [url]

## QUALITY VALIDATION (Internal)
Before outputting, verify:
- Every point ties directly to the query
- Zero opinions, interpretations, or speculative language
- Key metrics/terms are bolded; quotes preferred over paraphrase
- Boilerplate is completely excluded
- Conflicts are flagged neutrally with explicit source attribution
- Gaps are documented clearly
- Output is strictly Markdown within 2–7 thematic sections
- All citations follow (Source: [Title] | URL: [url]) format

## PROVIDED DATA
### Query
{{query}}

### Search Results
{{results}}

### Scraped Content
{{scrapedContent}}
`;


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
