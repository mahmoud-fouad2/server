import prisma from '../config/database.js';

const ACTIVE_WINDOW_MINUTES = 15;
const SOCIAL_DOMAINS = ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'snapchat', 'youtube'];
const SEARCH_DOMAINS = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex'];

const normalizeTrafficSource = (referrer?: string | null, origin?: string | null) => {
  if (!referrer) return 'direct';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    const sanitizedOrigin = origin?.toLowerCase();

    if (sanitizedOrigin && host.includes(sanitizedOrigin)) {
      return 'internal';
    }

    if (SEARCH_DOMAINS.some(domain => host.includes(domain))) {
      return 'search';
    }

    if (SOCIAL_DOMAINS.some(domain => host.includes(domain))) {
      return 'social';
    }

    return 'referral';
  } catch {
    return 'referral';
  }
};

const normalizeLabel = (value?: string | null, fallback = 'Unknown') => {
  const trimmed = (value || '').trim();
  return trimmed.length ? trimmed : fallback;
};

const extractPath = (value?: string | null) => {
  if (!value) return '/';
  try {
    const parsed = value.startsWith('http') ? new URL(value) : new URL(value, 'https://placeholder.local');
    return parsed.pathname || '/';
  } catch {
    return value.startsWith('/') ? value : `/${value}`;
  }
};

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

  async trackPageView(
    sessionId: string,
    pageData?: { url: string; title?: string; referrer?: string; origin?: string }
  ) {
    const trafficSource = normalizeTrafficSource(pageData?.referrer, pageData?.origin);
    const update = prisma.visitorSession.update({
      where: { id: sessionId },
      data: {
        pageViews: { increment: 1 },
        trafficSource,
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

  async getActiveSessions(businessId: string, windowMinutes: number = ACTIVE_WINDOW_MINUTES) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    const sessions = await prisma.visitorSession.findMany({
      where: {
        visitor: { businessId },
        OR: [{ endedAt: null }, { endedAt: { gte: windowStart } }],
      },
      orderBy: { startedAt: 'desc' },
      take: 25,
      include: {
        visits: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { url: true, title: true, createdAt: true },
        },
        visitor: { select: { fingerprint: true } },
      },
    });

    return sessions.map(session => ({
      id: session.id,
      visitorId: session.visitor?.fingerprint || session.visitorId,
      country: normalizeLabel(session.country),
      city: normalizeLabel(session.city),
      device: normalizeLabel(session.device),
      browser: normalizeLabel(session.browser),
      os: normalizeLabel(session.os),
      pageViews: session.pageViews,
      isMobile: /mobile|android|iphone|ipad/i.test(session.device || ''),
      startedAt: session.startedAt,
      lastActivityAt: session.visits[0]?.createdAt || session.startedAt,
      pageVisits: session.visits.map(visit => ({
        path: extractPath(visit.url),
        title: visit.title || visit.url,
        visitedAt: visit.createdAt,
      })),
    }));
  }

  async getAnalytics(
    businessId: string,
    options: { from?: Date; to?: Date } | number = {}
  ) {
    const now = new Date();
    let rangeStart: Date;
    let rangeEnd: Date;

    if (typeof options === 'number') {
      const days = Number.isFinite(options) && options > 0 ? options : 30;
      rangeEnd = now;
      rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    } else {
      rangeEnd = options?.to ?? now;
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      rangeStart = options?.from ?? defaultStart;
    }

    const activeWindow = new Date(Date.now() - ACTIVE_WINDOW_MINUTES * 60 * 1000);

    const [
      totalSessions,
      totalPageViews,
      activeNow,
      deviceStats,
      browserStats,
      countryStats,
      topPages,
      durationSamples,
      trafficSourceStats,
    ] = await Promise.all([
      prisma.visitorSession.count({
        where: {
          visitor: { businessId },
          startedAt: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      prisma.pageVisit.count({
        where: {
          session: { visitor: { businessId } },
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      prisma.visitorSession.count({
        where: {
          visitor: { businessId },
          OR: [{ endedAt: null }, { endedAt: { gte: activeWindow } }],
        },
      }),
      prisma.visitorSession.groupBy({
        by: ['device'],
        where: {
          visitor: { businessId },
          startedAt: { gte: rangeStart, lte: rangeEnd },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.visitorSession.groupBy({
        by: ['browser'],
        where: {
          visitor: { businessId },
          startedAt: { gte: rangeStart, lte: rangeEnd },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.visitorSession.groupBy({
        by: ['country'],
        where: {
          visitor: { businessId },
          startedAt: { gte: rangeStart, lte: rangeEnd },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.pageVisit.groupBy({
        by: ['url', 'title'],
        where: {
          session: { visitor: { businessId } },
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.visitorSession.findMany({
        where: {
          visitor: { businessId },
          startedAt: { gte: rangeStart, lte: rangeEnd },
        },
        select: { startedAt: true, endedAt: true },
      }),
      prisma.visitorSession.groupBy({
        by: ['trafficSource'],
        where: {
          visitor: { businessId },
          startedAt: { gte: rangeStart, lte: rangeEnd },
        },
        _count: { id: true },
      }),
    ]);

    const avgDurationSeconds = durationSamples.length
      ? durationSamples.reduce((total, session) => {
          const end = session.endedAt ?? now;
          return total + Math.max(0, (end.getTime() - session.startedAt.getTime()) / 1000);
        }, 0) / durationSamples.length
      : 0;

    const byDevice = deviceStats.reduce<Record<string, number>>((acc, cur) => {
      const label = normalizeLabel(cur.device);
      acc[label] = (acc[label] || 0) + cur._count.id;
      return acc;
    }, {});

    const byBrowser = browserStats.reduce<Record<string, number>>((acc, cur) => {
      const label = normalizeLabel(cur.browser);
      acc[label] = (acc[label] || 0) + cur._count.id;
      return acc;
    }, {});

    const topPagesNormalized = topPages.map(page => ({
      path: extractPath(page.url),
      title: page.title || page.url,
      count: page._count.id,
    }));

    const trafficSources = trafficSourceStats.reduce<Record<string, number>>((acc, source) => {
      const key = source.trafficSource || 'direct';
      acc[key] = (acc[key] || 0) + source._count.id;
      return acc;
    }, {});

    const byCountry = countryStats.reduce<Record<string, number>>((acc, cur) => {
      const label = normalizeLabel(cur.country);
      acc[label] = (acc[label] || 0) + cur._count.id;
      return acc;
    }, {});

    return {
      totalSessions,
      totalPageViews,
      avgDuration: Number(avgDurationSeconds.toFixed(0)),
      activeNow,
      deviceStats: deviceStats.map(d => ({ name: d.device || 'Unknown', count: d._count.id })),
      browserStats: browserStats.map(b => ({ name: b.browser || 'Unknown', count: b._count.id })),
      countryStats: countryStats.map(c => ({ name: c.country || 'Unknown', count: c._count.id })),
      byDevice,
      byBrowser,
      byCountry,
      topPages: topPagesNormalized,
      trafficSources,
    };
  }
}
