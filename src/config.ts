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
    LLM_TEMPERATURE: { type: "string", default: "0.7" },
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
    aiOverviewPrompt: processEnv.AI_OVERVIEW_PROMPT ||
      "Based on the following search results, provide a concise, informative overview answering the user's query. Synthesize the key points and cite sources where relevant. Query: {{query}}\n\nResults:\n{{results}}"
  };
}
