import logger from "../logger.js";
import type { ScrapedContent, ScrapedComment, ScraperConfig } from "./IScraper.js";
import { chromium, Browser, BrowserContext, Page } from "playwright";

export default class PlaywrightScraper {
  private static browser: Browser | null = null;

  static async init(): Promise<void> {
    if (this.browser) return;
    logger.info("[PlaywrightScraper] Launching warm Chromium browser...");

    this.browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        '--disable-gl-drawing-for-tests',
      ],
    });
    logger.info("[PlaywrightScraper] Chromium browser ready");
  }

  static async close(): Promise<void> {
    if (this.browser) {
      logger.info("[PlaywrightScraper] Closing Chromium browser...");
      await this.browser.close();
      this.browser = null;
    }
  }

  shouldAttempt(url: string): boolean {
    if (!PlaywrightScraper.browser) {
      logger.debug("[PlaywrightScraper] Browser not initialized, skipping");
      return false;
    }
    const lower = url.toLowerCase();
    if (lower.match(/\.(pdf|zip|exe|mp3|mp4|webp|svg|jpg|jpeg|png)$/)) return false;
    return true;
  }

  async scrape(url: string, config: ScraperConfig, signal: AbortSignal): Promise<ScrapedContent | null> {
    const startTime = Date.now();
    const browser = PlaywrightScraper.browser;
    if (!browser) return null;

    logger.info(`[PlaywrightScraper] Scrape started: ${url}`);

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    const navTimeout = config.playwright?.timeoutMs ?? 15_000;

    signal.addEventListener("abort", () => {
      if (page) page.close().catch(() => {});
      if (context) context.close().catch(() => {});
    }, { once: true });

    try {
      context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        viewport: { width: 1280, height: 900 },
        locale: "en-US",
      });

      page = await context.newPage();

      if (signal.aborted) return null;

      logger.debug(`[PlaywrightScraper] Navigating to ${url} (timeout=${navTimeout}ms)`);
      const navStart = Date.now();

      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: navTimeout,
      }).catch(() => null);

      if (!response) {
        logger.warn(`[PlaywrightScraper] Navigation timeout after ${Date.now() - navStart}ms: ${url}`);
        return null;
      }

      if (signal.aborted) return null;

      const status = response.status();
      const finalUrl = page.url();
      logger.info(`[PlaywrightScraper] HTTP ${status} in ${Date.now() - navStart}ms: ${url} → ${finalUrl}`);

      if (status >= 400) {
        logger.error(`[PlaywrightScraper] HTTP ${status} for ${url}`);
        return null;
      }

      const idleStart = Date.now();
      const idleTimeout = Math.max(3_000, navTimeout - (Date.now() - navStart));
      await Promise.race([
        page.waitForLoadState("networkidle").catch(() => {}),
        new Promise(r => setTimeout(r, idleTimeout)),
      ]);
      logger.info(`[PlaywrightScraper] networkidle after ${Date.now() - idleStart}ms: ${url}`);

      if (signal.aborted) return null;

      let content: ScrapedContent | null = null;

      if (this.isRedditUrl(url)) {
        content = await this.extractReddit(url, page, config, startTime);
      }

      if (!content) {
        content = await this.extractGeneric(url, page, config, startTime);
      }

      const totalMs = Date.now() - startTime;
      if (!content) {
        logger.warn(`[PlaywrightScraper] All extraction failed after ${totalMs}ms: ${url}`);
      } else {
        logger.info(`[PlaywrightScraper] Success after ${totalMs}ms: ${url} → title="${content.title}", contentLen=${content.content.length}, comments=${content.comments?.length ?? 0}`);
      }

      return content;
    } catch (err: any) {
      if (err.name === "AbortError") {
        logger.warn(`[PlaywrightScraper] Aborted: ${url}`);
        return null;
      }
      logger.error(`[PlaywrightScraper] Error: ${url}: ${err.message}`);
      return null;
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
      if (context) {
        await context.close().catch(() => {});
      }
    }
  }

  private isRedditUrl(url: string): boolean {
    return url.includes("reddit.com") && url.includes("/comments/");
  }

  private safeDate(timestamp: number): string {
    try {
      return new Date(timestamp).toISOString();
    } catch {
      return "";
    }
  }

  private unwrapChildren(data: any): any[] {
    return data?.children || data?.replies || [];
  }

  private shouldOmitComment(comment: any): boolean {
    if (comment?.kind === "more") return true;
    const body = (comment?.data?.body || "").trim();
    return ["[removed]", "[deleted]", ""].includes(body);
  }

  private async extractReddit(
    url: string, page: Page, config: ScraperConfig, startTime: number
  ): Promise<ScrapedContent | null> {
    try {
      logger.info(`[PlaywrightScraper] Attempting Reddit extraction: ${url}`);

      const nextData = await page.evaluate(() => {
        const el = document.getElementById("__NEXT_DATA__");
        return el ? JSON.parse(el.textContent || "{}") : null;
      });

      if (!nextData) {
        logger.warn(`[PlaywrightScraper] Reddit: no __NEXT_DATA__ on ${url}`);
        return null;
      }

      const post = nextData.props?.pageProps?.posting;
      if (!post) {
        logger.warn(`[PlaywrightScraper] Reddit: no posting data in __NEXT_DATA__ for ${url}`);
        return null;
      }

      const comments = config.reddit.ignoreComments ? [] : this.unwrapChildren(nextData.props?.pageProps?.comments);
      const topComments = comments
        .filter((c: any) => !this.shouldOmitComment({ kind: c.kind, data: c?.data }))
        .sort((a: any, b: any) => (b.data?.score || 0) - (a.data?.score || 0))
        .slice(0, config.reddit.maxTopLevelComments);

      const scrapedComments = this.scrapeComments(topComments, config);

      return {
        metadata: {
          url,
          author: post.author || "",
          siteName: "Reddit",
          scrapeDuration: `${(Date.now() - startTime) / 1000}s`,
          datePublished: this.safeDate(post.created_utc * 1000),
        },
        title: post.title || "",
        content: post.selftext || post.body || "",
        comments: scrapedComments,
      };
    } catch (err: any) {
      logger.error(`[PlaywrightScraper] Reddit extraction threw: ${url}: ${err.message}`);
      return null;
    }
  }

  private scrapeComments(commentList: any[], config: ScraperConfig, level = 0): ScrapedComment[] {
    if (!Array.isArray(commentList) || commentList.length === 0 || level >= config.reddit.maxCommentDepth) {
      return [];
    }

    const results: ScrapedComment[] = [];

    for (const item of commentList) {
      if (this.shouldOmitComment({ kind: item.kind, data: item?.data })) continue;

      const d = item.data || item;
      let body = (d.body || "").substring(0, config.reddit.commentMaxContent).trim();

      if (d.score < 0) {
        body = "(omitted - negative score)";
      }

      const replies = this.unwrapChildren(d.replies);
      const children = this.scrapeComments(replies, config, level + 1)
        .sort((a, b) => (b.rating?.score || 0) - (a.rating?.score || 0))
        .slice(0, Math.max(config.reddit.maxCommentDepth - level - 1, 1));

      results.push({
        author: d.author || "",
        comment: body,
        datePosted: this.safeDate(d.created_utc * 1000),
        url: d.permalink,
        rating: {
          ups: d.ups || 0,
          downs: d.downs || 0,
          score: d.score || 0,
        },
        replies: children,
      });
    }

    return results;
  }

  private async extractGeneric(
    url: string, page: Page, config: ScraperConfig, startTime: number
  ): Promise<ScrapedContent | null> {
    logger.info(`[PlaywrightScraper] Generic extraction: ${url}`);

    const diagnostics = await page.evaluate(() => {
      const h1s = Array.from(document.querySelectorAll("h1")).map((h) => h.textContent?.trim()).filter(Boolean);
      const body = document.body || document.documentElement;
      const totalText = (body.textContent || "").replace(/\s+/g, " ").trim();
      const scriptText = Array.from(document.querySelectorAll("script")).reduce((sum, s) => sum + (s.textContent || "").length, 0);
      const totalEls = body.querySelectorAll("*").length;

      return {
        docTitle: document.title,
        ogTitle: (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content || "",
        ogSiteName: (document.querySelector('meta[property="og:site_name"]') as HTMLMetaElement)?.content || "",
        h1s: h1s.slice(0, 3),
        totalTextLen: totalText.length,
        scriptTextLen: scriptText,
        totalEls,
        bodyChildren: body.childElementCount,
      };
    });

    logger.info(`[PlaywrightScraper] Page diagnostics ${url}: title="${diagnostics.docTitle}", h1s=${JSON.stringify(diagnostics.h1s)}, totalText=${diagnostics.totalTextLen}, scriptText=${diagnostics.scriptTextLen}, elements=${diagnostics.totalEls}, bodyChildren=${diagnostics.bodyChildren}`);

    const extracted = await page.evaluate(() => {
      const unnecessary = new Set([
        "script", "style", "noscript", "iframe", "link", "meta", "svg",
        "nav", "footer", "header", "form", "button", "video",
      ]);

      const classPatterns = [/nav/i, /sidebar/i, /footer/i, /cookie/i, /banner/i, /popup/i, /modal/i, /ad[rt]?/i, /breadcrumb/i, /toolbar/i, /menu/i, /newsletter/i, /signup/i, /chat/i, /widget/i];
      const idPatterns = [/sidebar/i, /footer/i, /cookie/i, /banner/i, /popup/i, /modal/i, /ad[rt]?/i, /menu/i, /newsletter/i, /signup/i, /chat/i, /widget/i];

      const clone = document.body?.cloneNode(true) as DocumentFragment;
      if (!clone) return null;

      const allEls = clone.querySelectorAll("*");
      let removedCount = 0;
      for (const el of allEls) {
        const tag = el.tagName.toLowerCase();
        if (unnecessary.has(tag)) { el.remove(); removedCount++; continue; }
        const cls = el.className as string;
        const id = el.id || "";
        if (cls && classPatterns.some(p => p.test(cls))) { el.remove(); removedCount++; continue; }
        if (id && idPatterns.some(p => p.test(id))) { el.remove(); removedCount++; continue; }
      }

      const selectors = [
        "article",
        "main",
        '[role="main"]',
        "[itemprop=articleBody]",
        ".post-content",
        ".entry-content",
        "#content",
        ".content",
        ".article-body",
        "[class*='article']",
        "[class*='post']",
        "[id*='content']",
        "[class*='body']",
        "#main",
        ".main-content",
        "[id*='article']",
        ".prose",
        ".markdown-body",
      ];

      const matched: { sel: string; len: number; el: Element }[] = [];
      for (const sel of selectors) {
        const found = clone.querySelector(sel);
        if (found) {
          matched.push({ sel, len: (found.textContent || "").replace(/\s+/g, " ").trim().length, el: found });
        }
      }

      let mainContent: Element | null = null;
      if (matched.length > 0) {
        matched.sort((a, b) => b.len - a.len);
        mainContent = matched[0].el;
      }

      if (!mainContent) {
        mainContent = clone.firstElementChild || null;
      }

      if (!mainContent) {
        return {
          title: "",
          siteName: "",
          publishedTime: "",
          textContent: "",
          matchedSelector: "(none)",
          removedCount,
          selectorMatches: matched,
          error: "No main content element found after pruning",
        };
      }

      const title = document.querySelector("h1")?.textContent?.trim()
        || document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim()
        || document.title?.trim()
        || "";

      const siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute("content")?.trim()
        || "";

      const publishedTime = document.querySelector('meta[property="article:published_time"]')?.getAttribute("content")
        || document.querySelector('time[datetime]')?.getAttribute("datetime")
        || "";

      const textContent = (mainContent.textContent || "")
        .replace(/\n/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      return {
        title,
        siteName,
        publishedTime,
        textContent,
        matchedSelector: mainContent.tagName.toLowerCase() + (mainContent.id ? "#" + mainContent.id : "") + (mainContent.className ? "." + (mainContent.className as string).split(/\s+/)[0] : ""),
        removedCount,
        selectorMatches: matched.map((m: any) => ({ sel: m.sel, len: m.len })),
      };
    });

    if (!extracted) {
      logger.warn(`[PlaywrightScraper] Extraction evaluate returned null: ${url}`);
      return null;
    }

    if (extracted.selectorMatches && extracted.selectorMatches.length > 0) {
      logger.info(`[PlaywrightScraper] Selector matches ${url}: ${extracted.selectorMatches.map((s: any) => `${s.sel}=${s.len}c`).join(", ")} (best=${extracted.selectorMatches[0].sel})`);
    }

    if (extracted.error) {
      logger.warn(`[PlaywrightScraper] ${extracted.error}: ${url}`);
    }

    logger.info(`[PlaywrightScraper] Extraction result ${url}: selector="${extracted.matchedSelector}", removed=${extracted.removedCount}, textLen=${extracted.textContent?.length ?? 0}, title="${extracted.title}"`);

    if (!extracted.textContent || extracted.textContent.length < 100) {
      logger.warn(`[PlaywrightScraper] Insufficient content: ${extracted.textContent?.length ?? 0} chars (need >= 100): ${url}`);

      const sample = (extracted.textContent || "").substring(0, 300);
      if (sample) {
        logger.info(`[PlaywrightScraper] Content sample: "${sample}"`);
      }

      const fullBodyFallback = await page.evaluate(() => {
        const toRemove = document.querySelectorAll("script, style, noscript, iframe, nav, footer, header, .nav, .sidebar, .footer, .cookie, .banner, .popup, .modal, .ad, [role='navigation']");
        toRemove.forEach(el => el.remove());
        const text = (document.body?.textContent || "")
          .replace(/\n/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
        return { text, len: text.length };
      });

      logger.info(`[PlaywrightScraper] Full body fallback: ${fullBodyFallback.len} chars: ${url}`);

      if (fullBodyFallback.len >= 100) {
        let text = fullBodyFallback.text;
        if (text.length > config.contentLimit) {
          const nextDot = text.indexOf(".", config.contentLimit);
          const cutAt = nextDot === -1 ? config.contentLimit : nextDot + 1;
          text = text.substring(0, cutAt);
        }
        const hostname = new URL(url).hostname.replace(/^www\./, "");
        return {
          metadata: {
            url,
            siteName: diagnostics.ogSiteName || hostname,
            scrapeDuration: `${(Date.now() - startTime) / 1000}s`,
          },
          title: extracted.title || diagnostics.docTitle,
          content: text,
        };
      }

      return null;
    }

    let text = extracted.textContent;
    if (text.length > config.contentLimit) {
      const nextDot = text.indexOf(".", config.contentLimit);
      const cutAt = nextDot === -1 ? config.contentLimit : nextDot + 1;
      text = text.substring(0, cutAt);
    }

    const hostname = new URL(url).hostname.replace(/^www\./, "");

    return {
      metadata: {
        url,
        siteName: extracted.siteName || hostname,
        scrapeDuration: `${(Date.now() - startTime) / 1000}s`,
        datePublished: extracted.publishedTime || undefined,
      },
      title: extracted.title,
      content: text,
    };
  }
}
