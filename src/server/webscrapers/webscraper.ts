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

async function scrapeOne(url: string, config: ScraperConfig, signal: AbortSignal): Promise<ScrapedContent | null> {
  const scrapers = getScrapers(url, config);

  if (scrapers.length === 0) {
    logger.debug(`[Scraper] No scrapers matched for ${url}`);
    return null;
  }

  const perSiteController = new AbortController();
  const perSiteTimer = setTimeout(() => perSiteController.abort(), PER_SITE_TIMEOUT_MS);

  if (signal) {
    signal.addEventListener("abort", () => { clearTimeout(perSiteTimer); perSiteController.abort(); }, { once: true });
  }

  const perSiteSignal = perSiteController.signal;
  const startTime = Date.now();

  for (const scraper of scrapers) {
    if (perSiteSignal.aborted) break;
    logger.debug(`[Scraper] Attempting ${scraper.constructor.name} on ${url}`);

    try {
      const content = await scraper.scrape(url, config, perSiteSignal);

      if (content) {
        clearTimeout(perSiteTimer);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`[Scraper] Content found using ${scraper.constructor.name} (${duration}s)`);
        return content;
      }
    } catch (err: any) {
      logger.warn(`[Scraper] ${scraper.constructor.name} failed on ${url}: ${err.message}`);
    }
  }

  clearTimeout(perSiteTimer);
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

  const urlQueue = [...urls];
  let completed = 0;

  while (urlQueue.length > 0) {
    const batch: Promise<void>[] = [];

    for (let i = 0; i < Math.min(concurrency, urlQueue.length); i++) {
      const url = urlQueue.shift()!;
      const idx = total - urlQueue.length;

      if (onProgress) {
        onProgress({ index: idx, total, url, status: "started" });
      }

      batch.push(
        scrapeOne(url, config, signal || AbortSignal.timeout(PER_SITE_TIMEOUT_MS)).then((result) => {
          if (result) results.push(result);
          completed++;
          if (onProgress) {
            onProgress({
              index: idx,
              total,
              url,
              status: result ? "completed" : "failed",
              title: result?.title,
            });
          }
        }).catch((err) => {
          logger.warn(`[Scraper] Error scraping ${url}: ${err.message}`);
          completed++;
          if (onProgress) {
            onProgress({ index: idx, total, url, status: "failed" });
          }
        })
      );
    }

    await Promise.all(batch);

    if (signal?.aborted) break;
  }

  return results;
}
