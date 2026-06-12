import logger from "../logger.js";
import BasicHtmlScraper from "./BasicHtmlScraper.js";
import PlaywrightScraper from "./PlaywrightScraper.js";
import type { ScrapedContent, IScraper, ScraperConfig, ScrapeProgress } from "./IScraper.js";

function getScrapers(url: string, config: ScraperConfig): IScraper[] {
  const scrapers: IScraper[] = [];
  if (config.playwright?.enabled) {
    scrapers.push(new PlaywrightScraper());
  }
  scrapers.push(new BasicHtmlScraper());
  return scrapers.filter((s) => s.shouldAttempt(url));
}

const PER_SITE_TIMEOUT_MS = 5_000;

async function scrapeOne(url: string, config: ScraperConfig, totalSignal: AbortSignal): Promise<ScrapedContent | null> {
  const scrapers = getScrapers(url, config);

  if (scrapers.length === 0) {
    logger.debug(`[Scraper] No scrapers matched for ${url}`);
    return null;
  }

  const perSiteTimeout = AbortSignal.timeout(PER_SITE_TIMEOUT_MS);
  const combinedSignal = AbortSignal.any([perSiteTimeout, totalSignal]);

  const startTime = Date.now();

  for (const scraper of scrapers) {
    if (combinedSignal.aborted) break;
    logger.debug(`[Scraper] Attempting ${scraper.constructor.name} on ${url}`);

    try {
      const content = await scraper.scrape(url, config, combinedSignal);

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
  const total = urls.length;
  const onProgress = config.onProgress;
  let completed = 0;

  async function processUrl(url: string, idx: number): Promise<void> {
    if (onProgress) {
      onProgress({ index: idx, total, url, status: "started" });
    }

    try {
      const result = await scrapeOne(url, config, signal || AbortSignal.timeout(PER_SITE_TIMEOUT_MS));
      if (result) results.push(result);
      completed++;
      if (onProgress) {
        onProgress({
          index: idx,
          total,
          completed,
          url,
          status: result ? "completed" : "failed",
          title: result?.title,
        });
      }
    } catch (err: any) {
      completed++;
      logger.warn(`[Scraper] Error scraping ${url}: ${err.message}`);
      if (onProgress) {
        onProgress({ index: idx, total, completed, url, status: "failed" });
      }
    }
  }

  // Build all task promises, but only kick off `concurrency` at a time.
  // Each task, when done, triggers the next queued task.
  const allPromises: Promise<void>[] = [];

  for (let i = 0; i < total; i++) {
    if (signal?.aborted) break;

    const url = urls[i];
    const idx = i + 1;

    // For tasks beyond concurrency, chain off the promise that started
    // `concurrency` positions earlier — it will have finished by then.
    const prevPromise = i >= concurrency ? allPromises[i - concurrency] : Promise.resolve();

    const task = prevPromise.then(() => processUrl(url, idx));
    allPromises.push(task);
  }

  await Promise.all(allPromises);
  return results;
}
