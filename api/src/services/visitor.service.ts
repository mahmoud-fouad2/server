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
        pageViews: 1,
      },
    });

    return {
      ...session,
      visitor,
    };
  }

  async trackPageView(sessionId: string) {
    return prisma.visitorSession.update({
      where: { id: sessionId },
      data: {
        pageViews: { increment: 1 },
      },
    });
  }
}
