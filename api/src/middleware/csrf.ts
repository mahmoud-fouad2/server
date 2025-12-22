import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service.js';
import logger from '../utils/logger.js';

interface CSRFTokenData {
  token: string;
  createdAt: number;
  expiresAt: number;
}

class CSRFProtection {
  private tokenExpiry: number = 3600000; // 1 hour

  generateToken(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async createToken(sessionId: string): Promise<string> {
    const token = this.generateToken();
    const now = Date.now();

    const tokenData: CSRFTokenData = {
      token,
      createdAt: now,
      expiresAt: now + this.tokenExpiry,
    };

    await cacheService.set(`csrf:${sessionId}`, tokenData, this.tokenExpiry / 1000);
    
    return token;
  }

  async validateToken(sessionId: string, token: string): Promise<boolean> {
    try {
      const tokenData = await cacheService.get<CSRFTokenData>(`csrf:${sessionId}`);
      
      if (!tokenData) {
        return false;
      }

      if (Date.now() > tokenData.expiresAt) {
        await cacheService.del(`csrf:${sessionId}`);
        return false;
      }

      return tokenData.token === token;
    } catch (error) {
      logger.error('CSRF validation error:', error);
      return false;
    }
  }

  async deleteToken(sessionId: string): Promise<void> {
    await cacheService.del(`csrf:${sessionId}`);
  }
}

const csrfProtection = new CSRFProtection();

export const generateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req as any).session?.id || req.ip || 'anonymous';
    const token = await csrfProtection.createToken(sessionId);
    
    res.locals.csrfToken = token;
    res.setHeader('X-CSRF-Token', token);
    
    next();
  } catch (error) {
    logger.error('CSRF token generation failed:', error);
    next(error);
  }
};

export const validateCSRFToken = async (req: Request, res: Response, next: NextFunction) => {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  try {
    const sessionId = (req as any).session?.id || req.ip || 'anonymous';
    const token = req.headers['x-csrf-token'] as string || req.body._csrf;

    if (!token) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token missing',
      });
    }

    const isValid = await csrfProtection.validateToken(sessionId, token);

    if (!isValid) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token',
      });
    }

    next();
  } catch (error) {
    logger.error('CSRF validation error:', error);
    res.status(500).json({
      success: false,
      message: 'CSRF validation failed',
    });
  }
};

export default csrfProtection;
