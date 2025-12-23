import { Redis, type Redis as RedisClient } from 'ioredis';
import { LRUCache } from 'lru-cache';
import logger from '../utils/logger.js';

class CacheService {
  private redis: RedisClient | null = null;
  private lruCache: LRUCache<string, any>;
  private isRedisConnected: boolean = false;

  constructor() {
    // Initialize LRU cache as fallback
    this.lruCache = new LRUCache({
      max: 500, // Maximum number of items
      maxSize: 50 * 1024 * 1024, // 50MB
      sizeCalculation: (value) => {
        return JSON.stringify(value).length;
      },
      ttl: 1000 * 60 * 5, // 5 minutes default TTL
    });

    this.initializeRedis();
  }

  private initializeRedis() {
    if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
      logger.warn('Redis configuration not found, using LRU cache only');
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL;
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT || '6379');
      const redisPassword = process.env.REDIS_PASSWORD;

      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 1, // Reduce retries to fail fast
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.error('Redis connection failed after 3 retries, switching to LRU cache');
              this.redis?.disconnect();
              this.redis = null;
              return null;
            }
            return Math.min(times * 1000, 3000);
          },
        });
      } else {
        // If no explicit config, don't try localhost in production/render
        if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
             logger.warn('No Redis URL provided in production, using LRU cache');
             return;
        }
        
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 3) {
              logger.error('Redis connection failed after 3 retries');
              return null;
            }
            return Math.min(times * 1000, 3000);
          },
        });
      }

      this.redis?.on('connect', () => {
        this.isRedisConnected = true;
        logger.info('✅ Redis connected successfully');
      });

      this.redis?.on('error', (error) => {
        this.isRedisConnected = false;
        logger.error('Redis connection error:', error);
      });

      this.redis?.on('close', () => {
        this.isRedisConnected = false;
        logger.warn('Redis connection closed');
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis && this.isRedisConnected) {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }

      // Fallback to LRU cache
      const lruValue = this.lruCache.get(key);
      return lruValue || null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      const stringValue = JSON.stringify(value);

      // Set in Redis
      if (this.redis && this.isRedisConnected) {
        await this.redis.setex(key, ttl, stringValue);
      }

      // Set in LRU cache
      this.lruCache.set(key, value, { ttl: ttl * 1000 });

      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (this.redis && this.isRedisConnected) {
        await this.redis.del(key);
      }
      this.lruCache.delete(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<number> {
    let deletedCount = 0;

    try {
      if (this.redis && this.isRedisConnected) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          deletedCount = await this.redis.del(...keys);
        }
      }

      // Clear LRU cache entries matching pattern
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of this.lruCache.keys()) {
        if (regex.test(key)) {
          this.lruCache.delete(key);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return deletedCount;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.redis && this.isRedisConnected) {
        const exists = await this.redis.exists(key);
        return exists === 1;
      }
      return this.lruCache.has(key);
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      if (this.redis && this.isRedisConnected) {
        await this.redis.flushdb();
      }
      this.lruCache.clear();
      return true;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    try {
      if (this.redis && this.isRedisConnected) {
        return await this.redis.incrby(key, by);
      }

      const current = this.lruCache.get(key) || 0;
      const newValue = (typeof current === 'number' ? current : 0) + by;
      this.lruCache.set(key, newValue);
      return newValue;
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      if (this.redis && this.isRedisConnected) {
        return await this.redis.decrby(key, by);
      }

      const current = this.lruCache.get(key) || 0;
      const newValue = (typeof current === 'number' ? current : 0) - by;
      this.lruCache.set(key, newValue);
      return newValue;
    } catch (error) {
      logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  async flush(): Promise<void> {
    try {
      if (this.redis && this.isRedisConnected) {
        await this.redis.flushall();
        logger.info('Redis cache flushed (flushall).');
      }
      this.lruCache.clear();
      logger.info('LRU cache cleared.');
    } catch (error) {
      logger.error('Error flushing cache:', error);
      throw error;
    }
  }

  getRedisClient(): RedisClient | null {
    return this.redis;
  }

  isConnected(): boolean {
    return this.isRedisConnected;
  }
}

export const cacheService = new CacheService();
