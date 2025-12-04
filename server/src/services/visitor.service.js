const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const UAParser = require('ua-parser-js');

class VisitorService {
  /**
   * إنشاء أو استرجاع جلسة زائر
   */
  async getOrCreateSession(businessId, fingerprint, req) {
    try {
      // البحث عن جلسة نشطة
      let session = await prisma.visitorSession.findFirst({
        where: {
          businessId,
          fingerprint,
          isActive: true
        },
        include: {
          pageVisits: {
            orderBy: { enteredAt: 'desc' },
            take: 10
          },
          conversations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (session) {
        // تحديث آخر نشاط
        session = await prisma.visitorSession.update({
          where: { id: session.id },
          data: { lastActivity: new Date() },
          include: {
            pageVisits: {
              orderBy: { enteredAt: 'desc' },
              take: 10
            },
            conversations: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });
      } else {
        // إنشاء جلسة جديدة
        const visitorInfo = await this.extractVisitorInfo(req);
        session = await prisma.visitorSession.create({
          data: {
            businessId,
            fingerprint,
            ...visitorInfo
          },
          include: {
            pageVisits: true,
            conversations: true
          }
        });
      }

      return session;
    } catch (error) {
      console.error('Error in getOrCreateSession:', error);
      throw error;
    }
  }

  /**
   * استخراج معلومات الزائر من الـ request
   */
  async extractVisitorInfo(req) {
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // الحصول على IP (مع دعم proxies و CDN)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     req.headers['x-real-ip'] ||
                     req.ip ||
                     req.connection?.remoteAddress ||
                     'unknown';

    // Geo Location (سنستخدم API خارجي أو قاعدة بيانات)
    let geoData = {};
    try {
      geoData = await this.getGeoLocation(ipAddress);
    } catch (error) {
      console.error('Geo location error:', error);
    }

    // Referrer & UTM
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    const utmParams = this.extractUTM(req.query);

    return {
      ipAddress,
      country: geoData.country || null,
      city: geoData.city || null,
      region: geoData.region || null,
      timezone: geoData.timezone || null,
      userAgent,
      browser: result.browser.name || null,
      browserVersion: result.browser.version || null,
      os: result.os.name || null,
      device: result.device.type || 'desktop',
      isMobile: result.device.type === 'mobile' || result.device.type === 'tablet',
      referrer,
      ...utmParams
    };
  }

  /**
   * الحصول على موقع جغرافي من IP
   */
  async getGeoLocation(ip) {
    try {
      // استخدام IP-API.com (مجاني 45 req/min)
      if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
        return { country: 'Local', city: 'Localhost' };
      }

      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,timezone`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          country: data.country,
          city: data.city,
          region: data.regionName,
          timezone: data.timezone
        };
      }
    } catch (error) {
      console.error('GeoLocation API error:', error);
    }
    return {};
  }

  /**
   * استخراج UTM parameters
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
   * تسجيل زيارة صفحة
   */
  async trackPageVisit(sessionId, pageData) {
    try {
      const visit = await prisma.pageVisit.create({
        data: {
          sessionId,
          url: pageData.url,
          title: pageData.title || null,
          path: pageData.path
        }
      });

      // تحديث عدد الصفحات المزارة
      await prisma.visitorSession.update({
        where: { id: sessionId },
        data: {
          pageViews: { increment: 1 },
          lastActivity: new Date()
        }
      });

      return visit;
    } catch (error) {
      console.error('Error tracking page visit:', error);
      throw error;
    }
  }

  /**
   * تحديث بيانات زيارة صفحة (duration, scroll, clicks)
   */
  async updatePageVisit(visitId, updates) {
    try {
      return await prisma.pageVisit.update({
        where: { id: visitId },
        data: {
          ...updates,
          exitedAt: updates.exitedAt || new Date()
        }
      });
    } catch (error) {
      console.error('Error updating page visit:', error);
      throw error;
    }
  }

  /**
   * إنهاء جلسة
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

      return await prisma.visitorSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt: new Date(),
          totalDuration
        }
      });
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * الحصول على جلسات نشطة لمشروع معين
   */
  async getActiveSessions(businessId) {
    try {
      return await prisma.visitorSession.findMany({
        where: {
          businessId,
          isActive: true,
          lastActivity: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // آخر 30 دقيقة
          }
        },
        include: {
          pageVisits: {
            orderBy: { enteredAt: 'desc' },
            take: 5
          },
          conversations: {
            where: { status: { in: ['ACTIVE', 'AGENT_ACTIVE'] } }
          }
        },
        orderBy: { lastActivity: 'desc' }
      });
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw error;
    }
  }

  /**
   * إحصائيات الزوار
   */
  async getSessionAnalytics(businessId, dateFrom, dateTo) {
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

      // تحليل البيانات
      const analytics = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => s.isActive).length,
        totalPageViews: sessions.reduce((sum, s) => sum + s.pageViews, 0),
        avgDuration: sessions.reduce((sum, s) => sum + s.totalDuration, 0) / sessions.length || 0,
        totalConversations: sessions.reduce((sum, s) => sum + s.conversations.length, 0),
        
        // By Country
        byCountry: this.groupBy(sessions, 'country'),
        
        // By Device
        byDevice: this.groupBy(sessions, 'device'),
        
        // By Browser
        byBrowser: this.groupBy(sessions, 'browser'),
        
        // Top Pages
        topPages: this.getTopPages(sessions),
        
        // Traffic Sources
        trafficSources: this.getTrafficSources(sessions)
      };

      return analytics;
    } catch (error) {
      console.error('Error getting analytics:', error);
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

  getTrafficSources(sessions) {
    const sources = {
      direct: 0,
      organic: 0,
      social: 0,
      referral: 0,
      utm: 0
    };

    sessions.forEach(session => {
      if (session.utmSource) {
        sources.utm++;
      } else if (!session.referrer) {
        sources.direct++;
      } else if (session.referrer.includes('google') || session.referrer.includes('bing')) {
        sources.organic++;
      } else if (session.referrer.includes('facebook') || session.referrer.includes('twitter') || session.referrer.includes('instagram')) {
        sources.social++;
      } else {
        sources.referral++;
      }
    });

    return sources;
  }

  /**
   * تسجيل نشاط مستخدم (للمشتركين)
   */
  async trackUserActivity(businessId, userId, action, metadata = {}, req) {
    try {
      const visitorInfo = await this.extractVisitorInfo(req);
      
      return await prisma.userAnalytics.create({
        data: {
          businessId,
          userId,
          action,
          metadata,
          ...visitorInfo
        }
      });
    } catch (error) {
      console.error('Error tracking user activity:', error);
      throw error;
    }
  }

  /**
   * الحصول على نشاطات المستخدمين
   */
  async getUserActivities(businessId, dateFrom, dateTo) {
    try {
      return await prisma.userAnalytics.findMany({
        where: {
          businessId,
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    } catch (error) {
      console.error('Error getting user activities:', error);
      throw error;
    }
  }
}

module.exports = new VisitorService();
