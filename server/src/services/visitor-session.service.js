const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const UAParser = require('ua-parser-js');
const logger = require('../utils/logger');

/**
 * 🎯 نظام إدارة جلسات الزوار - Visitor Session Management
 * 
 * الميزات:
 * ✅ جلسة دائمة حتى مع الـ refresh
 * ✅ تتبع IP وموقع الزائر (البلد)
 * ✅ تتبع الصفحات المزارة
 * ✅ كشف اللهجة تلقائياً من البلد
 * ✅ حفظ جميع بيانات التصفح
 */
class VisitorSessionService {
  /**
   * إنشاء أو استرجاع جلسة الزائر مع localStorage للاستمرارية
   */
  async getOrCreateSession(businessId, sessionId, req) {
    try {
      // 1. إذا كان لديه sessionId موجود مسبقاً
      if (sessionId) {
        const existingSession = await prisma.visitorSession.findUnique({
          where: { id: sessionId },
          include: {
            pageVisits: {
              orderBy: { enteredAt: 'desc' },
              take: 10
            }
          }
        });

        if (existingSession) {
          // تحديث آخر نشاط
          await prisma.visitorSession.update({
            where: { id: sessionId },
            data: { lastActivity: new Date() }
          });
          
          logger.debug('Session restored', { sessionId, businessId });
          return existingSession;
        }
      }

      // 2. إنشاء جلسة جديدة مع كشف اللهجة
      const visitorInfo = await this.extractVisitorInfo(req);
      const detectedDialect = this.detectDialectFromCountry(visitorInfo.country);

      const newSession = await prisma.visitorSession.create({
        data: {
          businessId,
          ...visitorInfo,
          detectedDialect, // 🎯 اللهجة المكتشفة
          isActive: true
        },
        include: {
          pageVisits: true
        }
      });

      logger.info('New visitor session created', { sessionId: newSession.id, businessId, country: visitorInfo.country, dialect: detectedDialect });
      return newSession;

    } catch (error) {
      logger.error('Failed to get or create session', { businessId, sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * استخراج معلومات الزائر (IP, بلد, متصفح, جهاز)
   */
  async extractVisitorInfo(req) {
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // 🌍 الحصول على IP الحقيقي (حتى خلف Proxy/CDN)
    const ipAddress = 
      req.headers['cf-connecting-ip'] || // Cloudflare
      req.headers['x-real-ip'] || // Nginx
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || // Standard proxy
      req.ip ||
      req.connection?.remoteAddress ||
      'unknown';

    // 🗺️ كشف الموقع الجغرافي من IP
    let geoData = {};
    try {
      geoData = await this.getGeoLocation(ipAddress);
    } catch (error) {
      logger.warn('GeoIP lookup failed', { ipAddress, error: error.message });
    }

    // 📊 Referrer & UTM Parameters
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    const utmParams = this.extractUTM(req.query);

    const info = {
      ipAddress,
      country: geoData.country || null,
      city: geoData.city || null,
      region: geoData.region || null,
      timezone: geoData.timezone || null,
      countryCode: geoData.countryCode || null,
      
      userAgent,
      browser: result.browser.name || null,
      browserVersion: result.browser.version || null,
      os: result.os.name || null,
      device: result.device.type || 'desktop',
      isMobile: result.device.type === 'mobile' || result.device.type === 'tablet',
      
      referrer,
      ...utmParams,
      
      pageViews: 0,
      totalDuration: 0,
      // fingerprint will be generated after info is constructed
    };

    // Generate fingerprint now that `info` is initialized
    try {
      info.fingerprint = this.generateFingerprint(info);
    } catch (err) {
      logger.warn('Visitor fingerprint generation failed', { error: err?.message || err });
      info.fingerprint = null;
    }

    return info;
  }

  /**
   * 🗺️ كشف الموقع الجغرافي من IP (GeoIP)
   * يستخدم ip-api.com (مجاني: 45 req/min)
   */
  async getGeoLocation(ip) {
    // In test environments, avoid external GeoIP calls for speed and determinism
    if (process.env.NODE_ENV === 'test') {
      return { country: 'Local', city: 'Localhost', countryCode: 'LO', region: 'Local', timezone: 'UTC' };
    }

    try {
      // Local IPs
      if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip === '::1') {
        return { 
          country: 'Local', 
          city: 'Localhost',
          countryCode: 'LO'
        };
      }

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,regionName,timezone`,
        { timeout: 3000 }
      );
      
      const data = await response.json();

      if (data.status === 'success') {
        return {
          country: data.country,
          countryCode: data.countryCode,
          city: data.city,
          region: data.regionName,
          timezone: data.timezone
        };
      }
    } catch (error) {
      logger.error('GeoIP API error', { ip, error: error.message });
    }
    
    return { country: 'Unknown', countryCode: 'XX' };
  }

  /**
   * 🎯 كشف اللهجة من البلد
   */
  detectDialectFromCountry(country) {
    const dialectMap = {
      'Saudi Arabia': 'sa',
      'Egypt': 'eg',
      'United Arab Emirates': 'uae',
      'Kuwait': 'kw',
      'Qatar': 'sa', // قريبة من السعودية
      'Bahrain': 'sa',
      'Oman': 'sa',
      'Jordan': 'standard',
      'Palestine': 'standard',
      'Lebanon': 'standard',
      'Syria': 'standard',
      'Iraq': 'standard',
      'Yemen': 'sa',
      'Libya': 'eg',
      'Tunisia': 'standard',
      'Algeria': 'standard',
      'Morocco': 'standard',
      'Sudan': 'eg'
    };

    const dialect = dialectMap[country] || 'standard';
    logger.debug('Dialect detected from country', { country, dialect });
    return dialect;
  }

  /**
   * استخراج UTM Parameters للتسويق
   */
  extractUTM(query) {
    return {
      utmSource: query.utm_source || null,
      utmMedium: query.utm_medium || null,
      utmCampaign: query.utm_campaign || null,
      utmTerm: query.utm_term || null,
      utmContent: query.utm_content || null
    };
  }

  /**
   * 📄 تسجيل زيارة صفحة جديدة
   */
  async trackPageVisit(sessionId, pageData) {
    try {
      const visit = await prisma.pageVisit.create({
        data: {
          sessionId,
          url: pageData.url,
          title: pageData.title || null,
          path: pageData.path,
          enteredAt: new Date()
        }
      });

      // تحديث عدد الصفحات
      await prisma.visitorSession.update({
        where: { id: sessionId },
        data: {
          pageViews: { increment: 1 },
          lastActivity: new Date()
        }
      });

      logger.debug('Page visit tracked', { sessionId, path: pageData.path, title: pageData.title });
      return visit;

    } catch (error) {
      logger.error('Failed to track page visit', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * ⏱️ تحديث مدة البقاء في الصفحة
   */
  async updatePageDuration(visitId, duration) {
    try {
      return await prisma.pageVisit.update({
        where: { id: visitId },
        data: {
          duration: Math.floor(duration),
          exitedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to update page duration', { visitId, duration, error: error.message });
      throw error;
    }
  }

  /**
   * 🛑 إنهاء الجلسة
   */
  async endSession(sessionId) {
    try {
      const session = await prisma.visitorSession.findUnique({
        where: { id: sessionId },
        include: { pageVisits: true }
      });

      if (!session) return null;

      // حساب المدة الإجمالية
      const totalDuration = session.pageVisits.reduce((sum, visit) => {
        return sum + (visit.duration || 0);
      }, 0);

      const ended = await prisma.visitorSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt: new Date(),
          totalDuration: Math.floor(totalDuration)
        }
      });

      logger.info('Visitor session ended', { sessionId, totalDuration: Math.floor(totalDuration) });
      return ended;

    } catch (error) {
      logger.error('Failed to end session', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * 📊 الحصول على جلسات نشطة
   */
  async getActiveSessions(businessId, minutes = 30) {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);
      
      return await prisma.visitorSession.findMany({
        where: {
          businessId,
          isActive: true,
          lastActivity: { gte: since }
        },
        include: {
          pageVisits: {
            orderBy: { enteredAt: 'desc' },
            take: 5
          },
          conversations: {
            where: { status: { in: ['ACTIVE', 'AGENT_ACTIVE'] } },
            take: 1
          }
        },
        orderBy: { lastActivity: 'desc' },
        take: 50
      });
    } catch (error) {
      logger.error('Failed to get active sessions', { businessId, error: error.message });
      throw error;
    }
  }

  /**
   * 📈 إحصائيات الزوار
   */
  async getAnalytics(businessId, dateFrom, dateTo) {
    try {
      const sessions = await prisma.visitorSession.findMany({
        where: {
          businessId,
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        include: {
          pageVisits: true,
          conversations: true
        }
      });

      return {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length,
        totalPageViews: sessions.reduce((sum, s) => sum + s.pageViews, 0),
        avgDuration: sessions.reduce((sum, s) => sum + s.totalDuration, 0) / sessions.length || 0,
        totalConversations: sessions.reduce((sum, s) => sum + s.conversations.length, 0),
        
        byCountry: this.groupBy(sessions, 'country'),
        byDevice: this.groupBy(sessions, 'device'),
        byDialect: this.groupBy(sessions, 'detectedDialect'),
        topPages: this.getTopPages(sessions)
      };
    } catch (error) {
      logger.error('Failed to get visitor analytics', { businessId, error: error.message });
      throw error;
    }
  }

  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const value = item[key] || 'Unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  getTopPages(sessions) {
    const pages = {};
    sessions.forEach(session => {
      session.pageVisits.forEach(visit => {
        pages[visit.path] = (pages[visit.path] || 0) + 1;
      });
    });
    return Object.entries(pages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
  }

  /**
   * إنشاء fingerprint للزائر
   */
  generateFingerprint(visitorInfo) {
    const crypto = require('crypto');
    const data = `${visitorInfo.ipAddress}-${visitorInfo.userAgent}-${visitorInfo.browser}-${visitorInfo.os}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }
}

module.exports = new VisitorSessionService();
