import prisma from '../config/database.js';

export class AnalyticsService {
  async getDashboardStats(businessId: string, startDate: Date, endDate: Date) {
    const totalMessages = await prisma.message.count({
      where: {
        conversation: { businessId },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalConversations = await prisma.conversation.count({
      where: {
        businessId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const messages = await prisma.message.findMany({
      where: {
        conversation: { businessId },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
    });

    const trendsMap: Record<string, number> = {};
    messages.forEach((msg: any) => {
      const date = msg.createdAt.toISOString().split('T')[0];
      trendsMap[date] = (trendsMap[date] || 0) + 1;
    });

    const trends = Object.keys(trendsMap).map((date) => ({
      date,
      count: trendsMap[date],
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalMessages,
      totalConversations,
      trends,
    };
  }

  async getRealtimeStats(businessId: string) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [activeConversations, conversationsLast24h, messagesLastHour, messagesLast24h] =
      await Promise.all([
        prisma.conversation.count({
          where: { businessId, status: 'active' },
        }),
        prisma.conversation.count({
          where: { businessId, createdAt: { gte: oneDayAgo } },
        }),
        prisma.message.count({
          where: { conversation: { businessId }, createdAt: { gte: oneHourAgo } },
        }),
        prisma.message.count({
          where: { conversation: { businessId }, createdAt: { gte: oneDayAgo } },
        }),
      ]);

    return {
      activeConversations,
      conversationsLast24h,
      messagesLastHour,
      messagesLast24h,
      timestamp: now.toISOString(),
    };
  }

  async getVectorStats(businessId: string) {
    const [totalChunks, chunksWithEmbedding] = await Promise.all([
      prisma.knowledgeChunk.count({ where: { businessId } }),
      prisma.knowledgeChunk.count({ where: { businessId, embedding: { not: null } } }),
    ]);

    return {
      totalChunks,
      chunksWithEmbedding,
      chunksMissingEmbedding: Math.max(0, totalChunks - chunksWithEmbedding),
    };
  }
}
