import prisma from '../config/database.js';

export class VisitorService {
  async getOrCreateSession(
    businessId: string,
    fingerprint: string,
    data: {
      userAgent?: string;
      ipAddress?: string;
      country?: string;
      city?: string;
      device?: string;
      browser?: string;
      os?: string;
    }
  ) {
    // 1. Find or Create Visitor
    let visitor = await prisma.visitor.findUnique({
      where: {
        businessId_fingerprint: {
          businessId,
          fingerprint,
        },
      },
    });

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          businessId,
          fingerprint,
        },
      });
    }

    // 2. Create Session
    const session = await prisma.visitorSession.create({
      data: {
        visitorId: visitor.id,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        country: data.country,
        city: data.city,
        device: data.device,
        browser: data.browser,
        os: data.os,
        pageViews: 1,
      },
    });

    return {
      ...session,
      visitor,
    };
  }

  async trackPageView(sessionId: string, pageData?: { url: string; title?: string }) {
    const update = prisma.visitorSession.update({
      where: { id: sessionId },
      data: {
        pageViews: { increment: 1 },
      },
    });

    if (pageData?.url) {
      await prisma.pageVisit.create({
        data: {
          sessionId,
          url: pageData.url,
          title: pageData.title,
        }
      }).catch(e => console.error('Failed to log page visit', e));
    }

    return update;
  }

  async getAnalytics(businessId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalSessions, activeNow, deviceStats, browserStats, topPages] = await Promise.all([
      // Total Sessions
      prisma.visitorSession.count({
        where: {
          visitor: { businessId },
          startedAt: { gte: startDate }
        }
      }),
      // Active Now (last 15 mins)
      prisma.visitorSession.count({
        where: {
          visitor: { businessId },
          startedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
        }
      }),
      // Device Stats
      prisma.visitorSession.groupBy({
        by: ['device'],
        where: {
          visitor: { businessId },
          startedAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),
      // Browser Stats
      prisma.visitorSession.groupBy({
        by: ['browser'],
        where: {
          visitor: { businessId },
          startedAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),
      // Top Pages
      prisma.pageVisit.groupBy({
        by: ['url', 'title'],
        where: {
          session: { visitor: { businessId } },
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      })
    ]);

    return {
      totalSessions,
      activeNow,
      deviceStats: deviceStats.map(d => ({ name: d.device || 'Unknown', count: d._count.id })),
      browserStats: browserStats.map(b => ({ name: b.browser || 'Unknown', count: b._count.id })),
      topPages: topPages.map(p => ({ url: p.url, title: p.title, count: p._count.id }))
    };
  }
}
