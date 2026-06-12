type CommentScore = {
  ups: number;
  downs: number;
  score: number;
}

export type ScrapedComment = {
  author: string;
  comment: string;
  datePosted?: string;
  url?: string;
  rating?: CommentScore;
  replies?: ScrapedComment[];
}

type ScrapedMetadata = {
  url: string;
  author?: string;
  datePublished?: string;
  siteName?: string;
  scrapeDuration: string;
}

export type ScrapedContent = {
  metadata: ScrapedMetadata;
  title: string;
  content: string;
  comments?: ScrapedComment[];
}

export interface IScraper {
  shouldAttempt(url: string): boolean;
  scrape(url: string, config: ScraperConfig, signal: AbortSignal): Promise<ScrapedContent | null>;
}

export type ScrapeProgress = {
  index: number;
  total: number;
  completed?: number;
  url: string;
  status: "started" | "completed" | "failed";
  title?: string;
};

export interface ScraperConfig {
  timeout: number;
  contentLimit: number;
  concurrency: number;
  query?: string;
  onProgress?: (progress: ScrapeProgress) => void;
  reddit: {
    maxTopLevelComments: number;
    maxCommentDepth: number;
    commentMaxContent: number;
    ignoreComments: boolean;
  };
  basicHtmlReader: {
    minReadableLength: number;
  };
  playwright?: {
    enabled: boolean;
    timeoutMs: number;
  };
}
