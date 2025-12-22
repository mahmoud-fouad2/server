import { Request, Response } from 'express';
import { cacheService } from '../services/cache.service.js';
import logger from '../utils/logger.js';

class SystemController {
  async flushCache(req: Request, res: Response) {
    try {
      await cacheService.flush();
      logger.info('Redis cache flushed successfully by admin.');
      res.status(200).json({ message: 'Cache flushed successfully.' });
    } catch (error) {
      logger.error('Error flushing cache:', error);
      res.status(500).json({ message: 'Failed to flush cache.' });
    }
  }
}

export const systemController = new SystemController();
