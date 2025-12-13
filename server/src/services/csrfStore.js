const { createClient } = require('redis');
const logger = require('../utils/logger');

class CsrfStore {
  constructor() {
    this.redisUrl = process.env.REDIS_URL || null;
    this.useRedis = !!this.redisUrl;
    if (this.useRedis) {
      this.client = createClient({ url: this.redisUrl });
      this.client.on('error', (e) => logger.warn('CSRF Redis client error', { error: e.message }));
      this.client.connect().catch(e => logger.warn('Failed to connect CSRF Redis', { error: e.message }));
    } else {
      this.store = new Map();
    }
  }

  async set(sessionId, token, ttlMs) {
    const key = `${sessionId}:${token}`;
    if (this.useRedis) {
      await this.client.set(key, '1', { PX: ttlMs });
    } else {
      const expiry = Date.now() + ttlMs;
      this.store.set(key, expiry);
    }
  }

  async get(sessionId, token) {
    const key = `${sessionId}:${token}`;
    if (this.useRedis) {
      const val = await this.client.get(key);
      return val ? true : false;
    } else {
      const expiry = this.store.get(key);
      if (!expiry) return false;
      if (Date.now() > expiry) {
        this.store.delete(key);
        return false;
      }
      return true;
    }
  }

  async delete(sessionId, token) {
    const key = `${sessionId}:${token}`;
    if (this.useRedis) {
      await this.client.del(key);
    } else {
      this.store.delete(key);
    }
  }
}

module.exports = new CsrfStore();
