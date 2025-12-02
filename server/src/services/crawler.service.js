const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Advanced Web Crawler Service
 * Crawls websites and extracts meaningful content
 */

class WebCrawler {
  constructor(options = {}) {
    this.maxPages = options.maxPages || 10;
    this.maxDepth = options.maxDepth || 2;
    this.timeout = options.timeout || 15000;
    this.visitedUrls = new Set();
    this.pages = [];
  }

  /**
   * Normalize URL to avoid duplicates
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove hash and some query params
      urlObj.hash = '';
      // Sort query params for consistency
      urlObj.searchParams.sort();
      return urlObj.toString();
    } catch (e) {
      return url;
    }
  }

  /**
   * Check if URL should be crawled
   */
  shouldCrawl(url, baseUrl) {
    try {
      const urlObj = new URL(url);
      const baseObj = new URL(baseUrl);

      // Only crawl same domain
      if (urlObj.hostname !== baseObj.hostname) {
        return false;
      }

      // Skip common non-content URLs
      const skipPatterns = [
        '/login', '/signin', '/signup', '/register',
        '/cart', '/checkout', '/account',
        '/wp-admin', '/admin',
        '.pdf', '.jpg', '.png', '.gif', '.zip', '.mp4'
      ];

      const path = urlObj.pathname.toLowerCase();
      return !skipPatterns.some(pattern => path.includes(pattern));
    } catch (e) {
      return false;
    }
  }

  /**
   * Extract text content from HTML
   */
  extractContent(html, url) {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, iframe, noscript, svg, aside').remove();
    $('.menu, .navigation, .sidebar, .ads, .advertisement').remove();

    // Get metadata
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled Page';
    
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       '';

    // Extract main content
    let mainContent = '';
    
    // Try to find main content area
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      'body'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 100) {
        mainContent = element.text();
        break;
      }
    }

    // Clean text
    const cleanText = mainContent
      .replace(/\s+/g, ' ')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();

    // Extract links for further crawling
    const links = [];
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).toString();
          links.push(absoluteUrl);
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    return {
      url,
      title,
      description,
      content: cleanText,
      links: [...new Set(links)], // Remove duplicates
      wordCount: cleanText.split(/\s+/).length,
      length: cleanText.length
    };
  }

  /**
   * Fetch and parse a single page
   */
  async fetchPage(url) {
    try {
      console.log(`[Crawler] Fetching: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
        },
        timeout: this.timeout,
        maxRedirects: 5
      });

      if (response.headers['content-type']?.includes('text/html')) {
        return this.extractContent(response.data, url);
      }
      
      return null;
    } catch (error) {
      console.error(`[Crawler] Error fetching ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Crawl website recursively
   */
  async crawl(startUrl, depth = 0) {
    const normalizedUrl = this.normalizeUrl(startUrl);

    // Check limits
    if (depth > this.maxDepth || 
        this.visitedUrls.size >= this.maxPages ||
        this.visitedUrls.has(normalizedUrl)) {
      return;
    }

    this.visitedUrls.add(normalizedUrl);

    // Fetch page
    const pageData = await this.fetchPage(startUrl);
    
    if (!pageData || pageData.length < 100) {
      return;
    }

    this.pages.push({
      url: pageData.url,
      title: pageData.title,
      description: pageData.description,
      content: pageData.content,
      wordCount: pageData.wordCount,
      depth: depth
    });

    console.log(`[Crawler] ✅ Crawled: ${pageData.title} (${pageData.wordCount} words)`);

    // Crawl linked pages (if depth allows)
    if (depth < this.maxDepth && this.visitedUrls.size < this.maxPages) {
      const linksToFollow = pageData.links
        .filter(link => this.shouldCrawl(link, startUrl))
        .slice(0, 5); // Limit links per page

      for (const link of linksToFollow) {
        if (this.visitedUrls.size >= this.maxPages) break;
        await this.crawl(link, depth + 1);
      }
    }
  }

  /**
   * Start crawling and return all collected pages
   */
  async start(url) {
    console.log(`[Crawler] Starting crawl of: ${url}`);
    console.log(`[Crawler] Max pages: ${this.maxPages}, Max depth: ${this.maxDepth}`);
    
    await this.crawl(url, 0);

    console.log(`[Crawler] ✅ Crawl complete! Collected ${this.pages.length} pages`);
    
    return {
      pages: this.pages,
      totalPages: this.pages.length,
      totalWords: this.pages.reduce((sum, p) => sum + p.wordCount, 0)
    };
  }

  /**
   * Get combined content from all pages
   */
  getCombinedContent() {
    return this.pages.map(page => {
      return `# ${page.title}\nURL: ${page.url}\n\n${page.content}`;
    }).join('\n\n---\n\n');
  }
}

/**
 * Simple single-page scraper (for backward compatibility)
 */
async function scrapeSinglePage(url) {
  const crawler = new WebCrawler({ maxPages: 1, maxDepth: 0 });
  const result = await crawler.start(url);
  return result.pages[0] || null;
}

module.exports = {
  WebCrawler,
  scrapeSinglePage
};
