export interface SearXNGResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail?: string;
  content?: string;
  engine?: string;
  engines?: string[];
  parsed_url?: string[];
  score?: number;
  category?: string;
  template?: string;
}

export interface SearXNGResponse {
  results: SearXNGResult[];
  number_of_results?: number;
  query: string;
  engines: { name: string; supported_langs: string[] }[];
  search_criteria?: {
    query: string;
    engines: string[];
    language: string;
    pageno: number;
    format: string;
    search_suggestions: boolean;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  overview: string;
  thinking?: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
