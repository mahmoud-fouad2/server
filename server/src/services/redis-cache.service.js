const { createClient } = require('redis');
const crypto = require('crypto');

/**
 * Redis Cache Service for AI Responses
 * 
 * Features:
 * - Cache AI responses to reduce API costs
 * - Query fingerprinting with hash
 * - TTL-based auto-eviction (7 days)
 * - Manual invalidation on KB updates
 */

class RedisCacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = !!process.env.REDIS_URL;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (!this.isEnabled) {
      console.log('[RedisCache] Redis URL not configured, caching disabled');
      return;
    }

    if (this.isConnected) {
      return; // Already connected
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('[RedisCache] Max reconnection attempts reached');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000); // Exponential backoff
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('[RedisCache] Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('[RedisCache] ✅ Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('[RedisCache] ⚠️ Disconnected from Redis');
        this.isConnected = false;
      });

      await this.client.connect();

    } catch (error) {
      console.error('[RedisCache] Failed to connect:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Generate cache key for a query
   * 
   * @param {string} businessId - Business ID
   * @param {string} query - User query
   * @returns {string} - Cache key
   */
  generateCacheKey(businessId, query) {
    // Normalize query (lowercase, trim, remove extra spaces)
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Create hash for consistent key generation
    const hash = crypto.createHash('md5').update(normalized).digest('hex');
    
    return `chat:${businessId}:${hash}`;
  }

  /**
   * Get cached response
   * 
   * @param {string} businessId - Business ID
   * @param {string} query - User query
   * @returns {Promise<Object|null>} - Cached response or null
   */
  async get(businessId, query) {
    if (!this.isEnabled || !this.isConnected) {
      return null;
    }

    try {
      const key = this.generateCacheKey(businessId, query);
      const cached = await this.client.get(key);

      if (cached) {
        console.log('[RedisCache] 🎯 Cache HIT for query');
        const data = JSON.parse(cached);
        
        // Update hit count (separate key for stats)
        await this.client.incr(`${key}:hits`);
        
        return data;
      }

      console.log('[RedisCache] ❌ Cache MISS for query');
      return null;

    } catch (error) {
      console.error('[RedisCache] Get error:', error);
      return null;
    }
  }

  /**
   * Set cached response
   * 
   * @param {string} businessId - Business ID
   * @param {string} query - User query
   * @param {Object} response - AI response to cache
   * @param {number} ttl - Time to live in seconds (default: 7 days)
   * @returns {Promise<boolean>} - Success status
   */
  async set(businessId, query, response, ttl = 7 * 24 * 60 * 60) {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    try {
      const key = this.generateCacheKey(businessId, query);
      const data = JSON.stringify({
        response,
        cachedAt: new Date().toISOString(),
        businessId,
        query: query.substring(0, 100) // Store truncated query for debugging
      });

      await this.client.setEx(key, ttl, data);
      console.log('[RedisCache] 💾 Cached response with TTL:', ttl);
      
      return true;

    } catch (error) {
      console.error('[RedisCache] Set error:', error);
      return false;
    }
  }

  /**
   * Invalidate all cache for a business
   * Call this when knowledge base is updated
   * 
   * @param {string} businessId - Business ID
   * @returns {Promise<number>} - Number of keys deleted
   */
  async invalidate(businessId) {
    if (!this.isEnabled || !this.isConnected) {
      return 0;
    }

    try {
      const pattern = `chat:${businessId}:*`;
      // Use scanIterator instead of KEYS for production-safe iteration
      const toDelete = [];
      for await (const key of this.client.scanIterator({ MATCH: pattern })) {
        toDelete.push(key);
        // Batch delete per 1000 keys
        if (toDelete.length >= 1000) {
          await this.client.del(toDelete);
          toDelete.length = 0;
        }
      }

      if (toDelete.length > 0) {
        await this.client.del(toDelete);
      }

      console.log('[RedisCache] 🗑️ Invalidated cache entries for business');
      return 1; // best-effort: we deleted keys (exact count not always available with stream)

    } catch (error) {
      console.error('[RedisCache] Invalidation error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics for a business
   * 
   * @param {string} businessId - Business ID
   * @returns {Promise<Object>} - Stats object
   */
  async getStats(businessId) {
    if (!this.isEnabled || !this.isConnected) {
      return { enabled: false };
    }

    try {
      const pattern = `chat:${businessId}:*`;
      let totalCached = 0;
      let totalHits = 0;

      for await (const key of this.client.scanIterator({ MATCH: pattern })) {
        if (key.includes(':hits')) {
          const hits = await this.client.get(key);
          totalHits += parseInt(hits || 0);
        } else {
          totalCached += 1;
        }
      }

      return {
        enabled: true,
        totalCachedQueries: totalCached,
        totalCacheHits: totalHits,
        hitRate: totalCached > 0 ? Number((totalHits / totalCached).toFixed(2)) : 0
      };

    } catch (error) {
      console.error('[RedisCache] Stats error:', error);
      return { enabled: true, error: error.message };
    }
  }

  /**
   * Clear all cache (use with caution!)
   * 
   * @returns {Promise<boolean>} - Success status
   */
  async clearAll() {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushDb();
      console.log('[RedisCache] 🗑️ Cleared ALL cache');
      return true;
    } catch (error) {
      console.error('[RedisCache] Clear all error:', error);
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      console.log('[RedisCache] Disconnected');
    }
  }
}

// Singleton instance
const redisCache = new RedisCacheService();

// Auto-connect on module load
// redisCache.connect().catch(err => {
//   console.error('[RedisCache] Auto-connect failed:', err);
// });

module.exports = redisCache;
