import { Request, Response, NextFunction } from 'express';
import geoip from 'geoip-lite';
import crypto from 'crypto';
import logger from '../utils/logger.js';

export interface GeoRequest extends Request {
  geo?: {
    country?: string;
    city?: string;
    ipHash?: string;
  };
}

/**
 * IP Geolocation Middleware
 * Detects user's country from IP address (GDPR compliant)
 * 
 * Privacy: Only stores country code + SHA-256 hashed IP
 */
export const geoDetect = (req: GeoRequest, res: Response, next: NextFunction) => {
  try {
    // Get IP from headers or socket
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
              || req.socket.remoteAddress 
              || '';

    // Skip if localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('localhost')) {
      req.geo = { country: 'SA', ipHash: '' }; // Default to Saudi Arabia
      return next();
    }

    // Hash IP for privacy (GDPR/PDPL compliant)
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    // Lookup geolocation
    const geo = geoip.lookup(ip);

    if (geo) {
      req.geo = {
        country: geo.country,
        city: geo.city,
        ipHash
      };

      // Add to response headers for socket connections
      res.setHeader('X-Geo-Country', geo.country);
      if (geo.city) {
        res.setHeader('X-Geo-City', geo.city);
      }

      logger.debug('Geo detection:', { 
        country: geo.country, 
        city: geo.city, 
        ipHash: ipHash.substring(0, 8) + '...' 
      });
    } else {
      // Default to Saudi Arabia if lookup fails
      req.geo = { country: 'SA', ipHash };
      res.setHeader('X-Geo-Country', 'SA');
      logger.debug('Geo lookup failed, defaulting to SA');
    }

    next();
  } catch (error: any) {
    logger.error('Geo detection error:', error.message);
    req.geo = { country: 'SA', ipHash: '' };
    next();
  }
};

/**
 * Map country code to dialect
 */
export function mapCountryToDialect(country?: string): string {
  const dialectMap: Record<string, string> = {
    SA: 'sa', EG: 'eg', AE: 'ae', KW: 'kw',
    BH: 'gulf', OM: 'gulf', QA: 'gulf',
    JO: 'lev', LB: 'lev', SY: 'lev', PS: 'lev',
    MA: 'maghreb', DZ: 'maghreb', TN: 'maghreb', LY: 'maghreb',
    IQ: 'gulf', YE: 'gulf', SD: 'gulf'
  };
  
  return dialectMap[country || ''] || 'msa';
}

/**
 * API endpoint to get user's detected location
 */
export const getGeoLocation = (req: GeoRequest, res: Response) => {
  const geo = req.geo || { country: 'SA' };
  const dialect = mapCountryToDialect(geo.country);

  res.json({
    country: geo.country,
    city: geo.city,
    dialect,
    timestamp: new Date().toISOString()
  });
};
