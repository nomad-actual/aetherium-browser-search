import logger from "../logger.js";
import BasicHtmlScraper from "./BasicHtmlScraper.js";
import PlaywrightScraper from "./PlaywrightScraper.js";
import type { ScrapedContent, IScraper, ScraperConfig } from "./IScraper.js";

function getScrapers(url: string, config: ScraperConfig): IScraper[] {
  const scrapers: IScraper[] = [];
  if (config.playwright?.enabled) {
    scrapers.push(new PlaywrightScraper());
  }
  scrapers.push(new BasicHtmlScraper());
  return scrapers.filter((s) => s.shouldAttempt(url));
}

async function scrapeOne(url: string, config: ScraperConfig, signal: AbortSignal): Promise<ScrapedContent | null> {
  const scrapers = getScrapers(url, config);

  if (scrapers.length === 0) {
    logger.debug(`[Scraper] No scrapers matched for ${url}`);
    return null;
  }

  const startTime = Date.now();

  for (const scraper of scrapers) {
    logger.debug(`[Scraper] Attempting ${scraper.constructor.name} on ${url}`);

    try {
      const content = await scraper.scrape(url, config, signal);

      if (content) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`[Scraper] Content found using ${scraper.constructor.name} (${duration}s)`);
        return content;
      }
    } catch (err: any) {
      logger.warn(`[Scraper] ${scraper.constructor.name} failed on ${url}: ${err.message}`);
    }
  }

  logger.warn(`[Scraper] No content found for ${url}`);
  return null;
}

export async function doWebScrape(
  urls: string[],
  config: ScraperConfig,
  signal?: AbortSignal
): Promise<ScrapedContent[]> {
  const concurrency = config.concurrency || 3;
  const results: ScrapedContent[] = [];

  const urlQueue = [...urls];

  while (urlQueue.length > 0) {
    const batch: Promise<void>[] = [];

    for (let i = 0; i < Math.min(concurrency, urlQueue.length); i++) {
      const url = urlQueue.shift()!;

      batch.push(
        scrapeOne(url, config, signal || AbortSignal.timeout(config.timeout * 2)).then((result) => {
          if (result) results.push(result);
        }).catch((err) => {
          logger.warn(`[Scraper] Error scraping ${url}: ${err.message}`);
        })
      );
    }

    await Promise.all(batch);

    if (signal?.aborted) break;
  }

  return results;
}
