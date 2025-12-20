import { Request, Response, NextFunction } from 'express';
import { geoDetect, mapCountryToDialect, GeoRequest } from '../geo.middleware';

describe('Geo Middleware', () => {
  let mockReq: Partial<GeoRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      socket: { remoteAddress: '8.8.8.8' } as any,
    };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('geoDetect middleware', () => {
    it('should detect country from IP address', () => {
      mockReq.socket = { remoteAddress: '8.8.8.8' } as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockReq.geo).toBeDefined();
      expect(mockReq.geo?.country).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use x-forwarded-for header if present', () => {
      mockReq.headers = { 'x-forwarded-for': '8.8.8.8, 192.168.1.1' };
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockReq.geo).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should default to Saudi Arabia for localhost', () => {
      mockReq.socket = { remoteAddress: '127.0.0.1' } as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockReq.geo?.country).toBe('SA');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should default to Saudi Arabia for ::1 (IPv6 localhost)', () => {
      mockReq.socket = { remoteAddress: '::1' } as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockReq.geo?.country).toBe('SA');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should hash IP for privacy', () => {
      mockReq.socket = { remoteAddress: '8.8.8.8' } as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockReq.geo?.ipHash).toBeDefined();
      expect(mockReq.geo?.ipHash).not.toBe('8.8.8.8'); // Should be hashed
      expect(mockReq.geo?.ipHash?.length).toBe(64); // SHA-256 = 64 hex chars
    });

    it('should set response headers', () => {
      mockReq.socket = { remoteAddress: '8.8.8.8' } as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Geo-Country', expect.any(String));
    });

    it('should handle errors gracefully', () => {
      mockReq.socket = undefined as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockReq.geo?.country).toBe('SA'); // Default fallback
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() even on error', () => {
      mockReq.socket = null as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('mapCountryToDialect', () => {
    it('should map Saudi Arabia to sa dialect', () => {
      expect(mapCountryToDialect('SA')).toBe('sa');
    });

    it('should map Egypt to eg dialect', () => {
      expect(mapCountryToDialect('EG')).toBe('eg');
    });

    it('should map UAE to ae dialect', () => {
      expect(mapCountryToDialect('AE')).toBe('ae');
    });

    it('should map Kuwait to kw dialect', () => {
      expect(mapCountryToDialect('KW')).toBe('kw');
    });

    it('should map Bahrain to gulf dialect', () => {
      expect(mapCountryToDialect('BH')).toBe('gulf');
    });

    it('should map Oman to gulf dialect', () => {
      expect(mapCountryToDialect('OM')).toBe('gulf');
    });

    it('should map Qatar to gulf dialect', () => {
      expect(mapCountryToDialect('QA')).toBe('gulf');
    });

    it('should map Jordan to lev dialect', () => {
      expect(mapCountryToDialect('JO')).toBe('lev');
    });

    it('should map Lebanon to lev dialect', () => {
      expect(mapCountryToDialect('LB')).toBe('lev');
    });

    it('should map Syria to lev dialect', () => {
      expect(mapCountryToDialect('SY')).toBe('lev');
    });

    it('should map Palestine to lev dialect', () => {
      expect(mapCountryToDialect('PS')).toBe('lev');
    });

    it('should map Morocco to maghreb dialect', () => {
      expect(mapCountryToDialect('MA')).toBe('maghreb');
    });

    it('should map Algeria to maghreb dialect', () => {
      expect(mapCountryToDialect('DZ')).toBe('maghreb');
    });

    it('should map Tunisia to maghreb dialect', () => {
      expect(mapCountryToDialect('TN')).toBe('maghreb');
    });

    it('should map Libya to maghreb dialect', () => {
      expect(mapCountryToDialect('LY')).toBe('maghreb');
    });

    it('should map Iraq to gulf dialect', () => {
      expect(mapCountryToDialect('IQ')).toBe('gulf');
    });

    it('should map Yemen to gulf dialect', () => {
      expect(mapCountryToDialect('YE')).toBe('gulf');
    });

    it('should map Sudan to gulf dialect', () => {
      expect(mapCountryToDialect('SD')).toBe('gulf');
    });

    it('should default to msa for unknown countries', () => {
      expect(mapCountryToDialect('US')).toBe('msa');
    });

    it('should default to msa for undefined', () => {
      expect(mapCountryToDialect(undefined)).toBe('msa');
    });

    it('should default to msa for empty string', () => {
      expect(mapCountryToDialect('')).toBe('msa');
    });
  });

  describe('Privacy & Security', () => {
    it('should not expose raw IP in geo object', () => {
      mockReq.socket = { remoteAddress: '8.8.8.8' } as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      const geoString = JSON.stringify(mockReq.geo);
      expect(geoString).not.toContain('8.8.8.8');
    });

    it('should only store country code, not full location', () => {
      mockReq.socket = { remoteAddress: '8.8.8.8' } as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      
      expect(mockReq.geo).toHaveProperty('country');
      expect(mockReq.geo).not.toHaveProperty('latitude');
      expect(mockReq.geo).not.toHaveProperty('longitude');
      expect(mockReq.geo).not.toHaveProperty('ip');
    });

    it('should generate consistent hash for same IP', () => {
      const ip = '8.8.8.8';
      mockReq.socket = { remoteAddress: ip } as any;
      
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      const hash1 = mockReq.geo?.ipHash;
      
      // Reset and test again
      mockReq = { headers: {}, socket: { remoteAddress: ip } as any };
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      const hash2 = mockReq.geo?.ipHash;
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('Performance', () => {
    it('should complete detection in under 10ms', () => {
      mockReq.socket = { remoteAddress: '8.8.8.8' } as any;
      
      const start = Date.now();
      geoDetect(mockReq as GeoRequest, mockRes as Response, mockNext);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10);
    });

    it('should handle concurrent requests', () => {
      const requests = Array.from({ length: 100 }, (_, i) => ({
        headers: {},
        socket: { remoteAddress: `192.168.1.${i}` } as any,
      }));
      
      const start = Date.now();
      requests.forEach(req => {
        geoDetect(req as GeoRequest, mockRes as Response, mockNext);
      });
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100); // 100 requests in < 100ms
    });
  });
});
