const levenshtein = require('fast-levenshtein');
const { LRUCache } = require('lru-cache');

class CacheService {
  constructor() {
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    this.hits = 0;
    this.misses = 0;
  }

  // Fahimo Insight: Normalize Arabic text for better matching
  normalizeArabicText(text) {
    if (!text) return '';
    return text
      .replace(/[أإآ]/g, 'ا')
      .replace(/[ىئ]/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\w\s\u0600-\u06FF]/g, '') // Remove special chars
      .toLowerCase()
      .trim();
  }

  // Find similar response in cache
  async findSimilar(query, businessId, threshold = 0.85) {
    const normalizedQuery = this.normalizeArabicText(query);
    const cacheKeyPrefix = `biz:${businessId}:`;
    
    // Iterate through cache keys for this business
    // Note: LRU Cache doesn't support direct iteration easily in all versions, 
    // but for this implementation we will check exact match first, then potential fuzzy match if needed.
    // For high performance, we usually use exact match or vector DB. 
    // Here we implement a simplified exact/near-exact match for the MVP.
    
    const exactKey = `${cacheKeyPrefix}${normalizedQuery}`;
    if (this.cache.has(exactKey)) {
      this.hits++;
      return this.cache.get(exactKey);
    }

    // For Levenshtein, we would need to store keys separately or iterate. 
    // To keep it fast for MVP, we'll stick to exact normalized match.
    // Future upgrade: Use Vector DB (pgvector/Pinecone) for semantic similarity.
    
    this.misses++;
    return null;
  }

  // Save to cache
  async set(query, response, businessId) {
    const normalizedQuery = this.normalizeArabicText(query);
    const key = `biz:${businessId}:${normalizedQuery}`;
    this.cache.set(key, response);
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses || 1)
    };
  }
}

module.exports = new CacheService();
