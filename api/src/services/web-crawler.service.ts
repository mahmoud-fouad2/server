import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  links: string[];
  images: string[];
  metadata: any;
}

class WebCrawlerService {
  private maxDepth: number = 2;
  private maxPages: number = 50;
  private userAgent: string = 'FahimoBot/2.0';

  async crawlUrl(url: string, depth: number = 0): Promise<CrawlResult | null> {
    try {
      if (depth > this.maxDepth) {
        return null;
      }

      logger.info(`Crawling URL: ${url} (depth: ${depth})`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: 30000,
        maxRedirects: 5,
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract title
      const title = $('title').text() || $('h1').first().text() || '';

      // Extract main content (remove scripts, styles, etc.)
      $('script, style, nav, footer, header, aside').remove();
      const content = $('body').text().replace(/\s+/g, ' ').trim();

      // Extract links
      const links: string[] = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && this.isValidUrl(href, url)) {
          links.push(this.normalizeUrl(href, url));
        }
      });

      // Extract images
      const images: string[] = [];
      $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src) {
          images.push(this.normalizeUrl(src, url));
        }
      });

      // Extract metadata
      const metadata: any = {
        description: $('meta[name="description"]').attr('content') || '',
        keywords: $('meta[name="keywords"]').attr('content') || '',
        author: $('meta[name="author"]').attr('content') || '',
        ogTitle: $('meta[property="og:title"]').attr('content') || '',
        ogDescription: $('meta[property="og:description"]').attr('content') || '',
      };

      return {
        url,
        title,
        content: content.substring(0, 50000), // Limit content size
        links: links.slice(0, 100), // Limit links
        images: images.slice(0, 20), // Limit images
        metadata,
      };
    } catch (error: any) {
      logger.error(`Failed to crawl ${url}:`, error.message);
      return null;
    }
  }

  async crawlWebsite(
    startUrl: string,
    maxPages: number = 10
  ): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

    while (queue.length > 0 && results.length < maxPages) {
      const { url, depth } = queue.shift()!;

      if (visited.has(url) || depth > this.maxDepth) {
        continue;
      }

      visited.add(url);

      const result = await this.crawlUrl(url, depth);

      if (result) {
        results.push(result);

        // Add child links to queue
        if (depth < this.maxDepth) {
          result.links.forEach((link) => {
            if (!visited.has(link) && this.isSameDomain(link, startUrl)) {
              queue.push({ url: link, depth: depth + 1 });
            }
          });
        }
      }

      // Add delay to avoid overwhelming servers
      await this.delay(1000);
    }

    logger.info(`Crawled ${results.length} pages from ${startUrl}`);
    return results;
  }

  async extractTextFromUrl(url: string): Promise<string> {
    const result = await this.crawlUrl(url);
    if (!result) {
      return '';
    }

    let text = `${result.title}\n\n${result.content}`;

    if (result.metadata.description) {
      text += `\n\nDescription: ${result.metadata.description}`;
    }

    return text;
  }

  private isValidUrl(href: string, baseUrl: string): boolean {
    if (!href) return false;

    // Skip mailto, tel, javascript, etc.
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return false;
    }

    // Skip anchors
    if (href.startsWith('#')) {
      return false;
    }

    return true;
  }

  private normalizeUrl(url: string, baseUrl: string): string {
    try {
      if (url.startsWith('http')) {
        return url;
      }

      const base = new URL(baseUrl);

      if (url.startsWith('//')) {
        return `${base.protocol}${url}`;
      }

      if (url.startsWith('/')) {
        return `${base.origin}${url}`;
      }

      return `${base.origin}${base.pathname}/${url}`;
    } catch {
      return url;
    }
  }

  private isSameDomain(url1: string, url2: string): boolean {
    try {
      const domain1 = new URL(url1).hostname;
      const domain2 = new URL(url2).hostname;
      return domain1 === domain2;
    } catch {
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new WebCrawlerService();
