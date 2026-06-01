import logger from "../logger.js";
import type { ScrapedContent, ScrapedComment, ScraperConfig } from "./IScraper.js";

export default class RedditScraper {
  shouldAttempt(url: string): boolean {
    return url.startsWith('https://www.reddit.com') && url.includes('/comments/');
  }

  private catchTimeCrash(s: number, _stuff: unknown): string {
    try {
      return new Date(s).toISOString();
    } catch (e) {
      logger.warn(`[RedditScraper] Error parsing date: ${e}`);
      return '';
    }
  }

  async scrape(url: string, config: ScraperConfig, signal: AbortSignal): Promise<ScrapedContent | null> {
    const startTime = Date.now();

    const overrideUrl = `${(url.endsWith('/') ? url.slice(0, -1) : url)}.json`;

    logger.info('reddit override:' + overrideUrl)

    const resp = await fetch(overrideUrl, {
      signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
      }
    });

    if (!resp.ok) {
      logger.error(`[RedditScraper] Failed to fetch ${url}. Status: ${resp.status}`);
      return null;
    }

    const data = await resp.json() as any[];

    const mainPosting = (this.unwrapRedditObj(data[0]) || [])[0]?.data;
    if (!mainPosting) {
      return null;
    }

    const author = mainPosting.author;
    const content = mainPosting.selftext;
    const title = mainPosting.title;
    const postedDate = this.catchTimeCrash(mainPosting.created_utc * 1000, mainPosting);
    const scrapeDuration = `${(Date.now() - startTime) / 1000} seconds`;

    const comments = config.reddit.ignoreComments ? [] : this.unwrapRedditObj(data[1]);
    const topComments = this.getTopVotedMax(comments, config.reddit.maxTopLevelComments);
    const scrapedComments = this.scrapeComments(topComments, config);

    return {
      metadata: {
        url,
        author,
        siteName: 'Reddit',
        scrapeDuration,
        datePublished: postedDate
      },
      title,
      content,
      comments: scrapedComments,
    };
  }

  private unwrapRedditObj(redditListing: any) {
    return redditListing?.data?.children || redditListing?.data?.replies || [];
  }

  private getTopVotedMax(redditListing: any[], maxComments: number): any[] {
    return redditListing
      .filter(l => !this.shouldOmitComment(l))
      .sort((a, b) => b.data.score - a.data.score)
      .slice(0, maxComments);
  }

  private shouldOmitComment(comment: any): boolean {
    if (comment.kind === 'more') return true;

    const commentContent = (comment.data.body || '').trim();
    return ['[removed]', '[deleted]'].includes(commentContent);
  }

  private scrapeComments(commentList: any[], config: ScraperConfig, level?: number): ScrapedComment[] {
    const safeLevel = level || 0;

    if (!Array.isArray(commentList) || commentList.length === 0 || safeLevel >= config.reddit.maxCommentDepth) {
      return [];
    }

    const comments: ScrapedComment[] = [];

    for (const dataObj of commentList) {
      if (this.shouldOmitComment(dataObj)) continue;

      const { data: comment } = dataObj;

      let content = ((comment.body || '') as string).substring(0, config.reddit.commentMaxContent).trim();

      if (comment.score < 0) {
        content = '(omitted - bad score)';
      }

      const replyPosted = this.catchTimeCrash(comment.created_utc * 1000, comment);

      const replies = this.unwrapRedditObj(comment.replies);
      const children = this.scrapeComments(replies, config, safeLevel + 1);

      const scrapedComment: ScrapedComment = {
        author: comment.author,
        comment: content,
        datePosted: replyPosted,
        url: comment.permalink,
        rating: {
          ups: comment.ups as number,
          downs: comment.downs as number,
          score: comment.score as number,
        },
        replies: children
          .sort((a, b) => (b.rating?.score || 0) - (a.rating?.score || 0))
          .slice(0, Math.max(config.reddit.maxCommentDepth - safeLevel, 1)),
      };

      comments.push(scrapedComment);
    }

    return comments;
  }
}
