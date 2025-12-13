const { createClient } = require('redis');
const crypto = require('crypto');
const logger = require('../utils/logger');

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
      logger.info('[RedisCache] Redis URL not configured, caching disabled');
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
              logger.error('[RedisCache] Max reconnection attempts reached');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000); // Exponential backoff
          }
        }
      });

      this.client.on('error', (err) => {
        // Only log error if not already disconnected (avoid spam)
        if (this.isConnected) {
          logger.warn('[RedisCache] Redis Client Error - caching disabled', { error: err.message });
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('[RedisCache] ✅ Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('[RedisCache] ⚠️ Disconnected from Redis');
        this.isConnected = false;
      });

      await this.client.connect();

    } catch (error) {
      // Don't spam logs if Redis is intentionally not available
      if (process.env.NODE_ENV !== 'test') {
        logger.warn('[RedisCache] Redis not available - caching disabled', { 
          error: error.message,
          hint: 'Set REDIS_URL environment variable to enable caching'
        });
      }
      this.isEnabled = false;
      this.isConnected = false;
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
        logger.debug('[RedisCache] 🎯 Cache HIT for query');
        const data = JSON.parse(cached);
        
        // Update hit count (separate key for stats) - don't fail if this errors
        try {
          await this.client.incr(`${key}:hits`);
        } catch (e) {
          // Ignore stats update errors
        }
        
        return data;
      }

      logger.debug('[RedisCache] ❌ Cache MISS for query');
      return null;

    } catch (error) {
      // Don't spam logs if Redis is intentionally unavailable
      if (error.code !== 'ECONNREFUSED' && error.code !== 'ENOTFOUND') {
        logger.warn('[RedisCache] Get error', { error: error.message });
      }
      this.isConnected = false;
      return null; // Gracefully degrade - return null to indicate cache miss
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
      logger.debug('[RedisCache] 💾 Cached response with TTL', { ttl });
      
      return true;

    } catch (error) {
      // Don't spam logs if Redis is intentionally unavailable
      if (error.code !== 'ECONNREFUSED' && error.code !== 'ENOTFOUND') {
        logger.warn('[RedisCache] Set error', { error: error.message });
      }
      this.isConnected = false;
      return false; // Gracefully degrade - caching failed but app continues
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
      let totalDeleted = 0;
      for await (const key of this.client.scanIterator({ MATCH: pattern })) {
        // Defensive: ensure keys are strings
        toDelete.push(String(key));
        // Batch delete per 1000 keys
        if (toDelete.length >= 1000) {
          try {
            const deleted = await this.client.del(...toDelete);
            totalDeleted += Number(deleted || 0);
          } catch (err) {
            logger.error('[RedisCache] Batch delete error', err);
          }
          toDelete.length = 0;
        }
      }

      if (toDelete.length > 0) {
        try {
          const deleted = await this.client.del(...toDelete);
          totalDeleted += Number(deleted || 0);
        } catch (err) {
          logger.error('[RedisCache] Final batch delete error', err);
        }
      }

      logger.info('[RedisCache] 🗑️ Invalidated cache entries for business', { deleted: totalDeleted });
      return totalDeleted; // return actual count of deleted keys when possible

    } catch (error) {
      // Don't spam logs if Redis is intentionally unavailable
      if (error.code !== 'ECONNREFUSED' && error.code !== 'ENOTFOUND') {
        logger.warn('[RedisCache] Invalidation error', { error: error.message });
      }
      this.isConnected = false;
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
      logger.error('[RedisCache] Stats error', error);
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
      logger.info('[RedisCache] 🗑️ Cleared ALL cache');
      return true;
    } catch (error) {
      logger.error('[RedisCache] Clear all error', error);
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      logger.info('[RedisCache] Disconnected');
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
