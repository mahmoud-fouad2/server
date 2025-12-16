const prisma = require('../config/database');
const logger = require('../utils/logger');

class AdminAnalyticsService {
  /**
   * Get global overview across businesses
   */
  async getOverview(dateFrom, dateTo) {
    try {
      const [totalSessions, pageViewsAgg, totalConversations, totalUsers, activeUsers] = await Promise.all([
        prisma.visitorSession.count({ where: { createdAt: { gte: dateFrom, lte: dateTo } } }),
        prisma.visitorSession.aggregate({ _sum: { pageViews: true }, where: { createdAt: { gte: dateFrom, lte: dateTo } } }),
        prisma.conversation.count({ where: { createdAt: { gte: dateFrom, lte: dateTo } } }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } })
      ]);

      const totalPageViews = pageViewsAgg._sum.pageViews || 0;

      // By country
      const byCountry = await prisma.visitorSession.groupBy({
        by: ['country'],
        _count: { _all: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } }
      });

      // Top IPs
      const topIps = await prisma.visitorSession.groupBy({
        by: ['ipAddress'],
        _count: { _all: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
        orderBy: { _count: { _all: 'desc' } },
        take: 20
      });

      // Top pages (from pageVisit table)
      const topPages = await prisma.pageVisit.groupBy({
        by: ['path'],
        _count: { _all: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
        orderBy: { _count: { _all: 'desc' } },
        take: 20
      });

      // Time series (sessions per day) - raw query
      const timeseries = await prisma.$queryRaw`
        SELECT date_trunc('day', "createdAt")::date AS day, count(*) AS sessions
        FROM "VisitorSession"
        WHERE "createdAt" >= ${dateFrom} AND "createdAt" <= ${dateTo}
        GROUP BY day
        ORDER BY day;
      `;

      return {
        totalSessions,
        totalPageViews,
        totalConversations,
        totalUsers,
        activeUsers,
        byCountry: byCountry.map(c => ({ country: c.country || 'Unknown', count: c._count._all })),
        topIps: topIps.map(i => ({ ip: i.ipAddress, count: i._count._all })),
        topPages: topPages.map(p => ({ path: p.path, count: p._count._all })),
        timeseries
      };
    } catch (error) {
      logger.error('Failed to get admin overview analytics', { error: error.message });
      throw error;
    }
  }

  async getSessionsByCountry(dateFrom, dateTo) {
    try {
      const byCountry = await prisma.visitorSession.groupBy({
        by: ['country'],
        _count: { _all: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } }
      });

      return byCountry.map(c => ({ country: c.country || 'Unknown', count: c._count._all }));
    } catch (error) {
      logger.error('Failed to get sessions by country', { error: error.message });
      throw error;
    }
  }

  async getTopIps(dateFrom, dateTo, skip = 0, take = 50) {
    try {
      const topIps = await prisma.visitorSession.groupBy({
        by: ['ipAddress'],
        _count: { _all: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
        orderBy: { _count: { _all: 'desc' } },
        take,
        skip
      });

      return topIps.map(i => ({ ip: i.ipAddress, count: i._count._all }));
    } catch (error) {
      logger.error('Failed to get top IPs', { error: error.message });
      throw error;
    }
  }

  async getBrowserDeviceBreakdown(dateFrom, dateTo) {
    try {
      const browsers = await prisma.visitorSession.groupBy({
        by: ['browser'],
        _count: { _all: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } }
      });

      const devices = await prisma.visitorSession.groupBy({
        by: ['device'],
        _count: { _all: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } }
      });

      return {
        browsers: browsers.map(b => ({ browser: b.browser || 'Unknown', count: b._count._all })),
        devices: devices.map(d => ({ device: d.device || 'Unknown', count: d._count._all }))
      };
    } catch (error) {
      logger.error('Failed to get browser/device breakdown', { error: error.message });
      throw error;
    }
  }

  async getReferrers(dateFrom, dateTo, take = 50) {
    try {
      const refs = await prisma.visitorSession.groupBy({
        by: ['referrer'],
        _count: { _all: true },
        where: { createdAt: { gte: dateFrom, lte: dateTo } },
        orderBy: { _count: { _all: 'desc' } },
        take
      });

      return refs.map(r => ({ referrer: r.referrer || 'Direct', count: r._count._all }));
    } catch (error) {
      logger.error('Failed to get referrers', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AdminAnalyticsService();
