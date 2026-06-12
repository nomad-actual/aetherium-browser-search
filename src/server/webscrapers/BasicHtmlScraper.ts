import logger from "../logger.js";
import type { ScrapedContent, ScraperConfig } from "./IScraper.js";
import { Readability } from "@mozilla/readability";
import { capitalizeFirstLetter } from "../formatter.js";
import { JSDOM, VirtualConsole } from "jsdom";

const SHOW_ELEMENT = 1;
const FILTER_ACCEPT = 1;
const FILTER_REJECT = 2;
const DEFAULT_TIMEOUT = 10_000;

export default class BasicHtmlScraper {
  shouldAttempt(url: string): boolean {
    const lower = url.toLowerCase();
    if (lower.match(/\.(pdf|zip|exe|mp3|mp4|webp|svg|jpg|jpeg|png)$/)) return false;
    if (lower.match(/instagram\.com|tiktok\.com|twitter\.com|x\.com/)) return false;
    return true;
  }

  async scrape(url: string, config: ScraperConfig, signal: AbortSignal): Promise<ScrapedContent | null> {
    const startTime = Date.now();

    logger.debug(`[BasicHtmlScraper] Starting fetch for ${url}`);

    const controller = new AbortController();
    const timeoutMs = Math.min(config.timeout, DEFAULT_TIMEOUT);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        controller.abort();
      }, { once: true });
    }

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AetheriumScraper)" }
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      logger.error(`[BasicHtmlScraper] Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    if (controller.signal.aborted) return null;

    const htmlText = await response.text();

    const dom = new JSDOM(htmlText, {
      url,
      virtualConsole: new VirtualConsole(),
    });

    trimInPlace(dom.window.document);

    const reader = new Readability(dom.window.document, {
      charThreshold: config.basicHtmlReader.minReadableLength,
      debug: false,
      maxElemsToParse: 250_000,
    });

    const article = reader.parse();
    if (!article) {
      logger.error(`[BasicHtmlScraper] No readable content from ${url}`);
      return null;
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.debug(`[BasicHtmlScraper] Readability complete (${totalDuration}s) for ${url}`);

    let processedTextContent = (article.textContent || '')
      .replaceAll(/\n/g, ' ')
      .replaceAll(/\s{2,}/g, ' ')
      .trim();

    if (processedTextContent.length > config.contentLimit) {
      const nextPos = processedTextContent.indexOf('.', config.contentLimit);
      const truncIdx = nextPos === -1 ? config.contentLimit : nextPos + 1;
      processedTextContent = processedTextContent.substring(0, truncIdx);
    }

    const altSiteName = capitalizeFirstLetter(new URL(url).hostname);

    return {
      metadata: {
        url,
        siteName: article.siteName || altSiteName,
        datePublished: article.publishedTime || undefined,
        scrapeDuration: totalDuration,
      },
      title: article.title || '',
      content: processedTextContent,
    };
  }
}

const UNNECESSARY_ELEMENTS = new Set([
  'script', 'style', 'noscript', 'iframe',
  'link', 'meta', 'svg',
  'form', 'button', 'input', 'select', 'textarea',
]);

const UNNECESSARY_CLASSES = [
  /nav/i, /sidebar/i, /footer/i, /header.*menu/i,
  /cookie/i, /banner/i, /popup/i, /modal/i,
  /ad[rt]?/i, /advertisement/i, /companion/i,
  /share[-_ ]?button/i, /social[-_ ]?media/i,
  /comment[-_ ]?form/i, /related[-_ ]?articl/i,
  /breadcrumb/i, /sitema[i|p]/i,
  /top[-_ ]?bar/i,
  /bottom[-_ ]?bar/i, /toolbar/i, /menu/i,
];

const UNNECESSARY_IDS = [
  /sidebar/i, /footer/i, /header/i, /nav/i,
  /cookie/i, /banner/i, /popup/i, /modal/i,
  /ad[rt]?/i, /advertisement/i,
  /share[-_ ]?button/i, /social[-_ ]?media/i,
  /comment[-_ ]?form/i, /related[-_ ]?articl/i,
  /breadcrumb/i, /sitema[i|p]/i,
  /print/i, /top[-_ ]?bar/i,
  /bottom[-_ ]?bar/i, /toolbar/i, /menu/i,
  /newsletter/i, /subscribe/i, /signup/i,
];

function trimInPlace(doc: Document): void {
  const walker = doc.createTreeWalker(doc.body || doc.documentElement, SHOW_ELEMENT, {
    acceptNode(node: Node) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (UNNECESSARY_ELEMENTS.has(tag)) return FILTER_REJECT;

      if (el.className) {
        for (const pattern of UNNECESSARY_CLASSES) {
          if (pattern.test(el.className as string)) return FILTER_REJECT;
        }
      }

      if (el.id) {
        for (const pattern of UNNECESSARY_IDS) {
          if (pattern.test(el.id)) return FILTER_REJECT;
        }
      }

      return FILTER_ACCEPT;
    },
  });

  const toRemove: Element[] = [];
  let node = walker.nextNode() as Element | null;
  while (node) {
    toRemove.push(node);
    node = walker.nextNode() as Element | null;
  }

  if (toRemove.length > 0) {
    const initial = doc.body?.querySelectorAll('*').length || 0;
    for (const el of toRemove) {
      el.remove();
    }
    const final = doc.body?.querySelectorAll('*').length || 0;
    logger.debug(`[BasicHtmlScraper] Trimmed ${toRemove.length} elements (${initial} → ${final} nodes)`);
  }
}
