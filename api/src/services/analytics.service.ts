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

    // Optimized aggregation using raw query for performance
    const rawTrends = await prisma.$queryRaw<any[]>`
      SELECT "createdAt"::date as date, COUNT(*)::int as count
      FROM "Message"
      WHERE "conversationId" IN (
        SELECT "id" FROM "Conversation" WHERE "businessId" = ${businessId}
      )
      AND "createdAt" >= ${startDate}
      AND "createdAt" <= ${endDate}
      GROUP BY "createdAt"::date
      ORDER BY date ASC
    `;

    const trends = rawTrends.map((t) => ({
      date: new Date(t.date).toISOString().split('T')[0],
      count: Number(t.count),
    }));

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
          where: { businessId, status: 'ACTIVE' }, // Changed to uppercase to match likely Enum
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

  async getRatingStats(businessId: string) {
    const ratings = await prisma.conversation.groupBy({
      by: ['agentRating'],
      where: {
        businessId,
        agentRating: { not: null }
      },
      _count: { id: true }
    });

    const totalRatings = ratings.reduce((acc, curr) => acc + curr._count.id, 0);
    const weightedSum = ratings.reduce((acc, curr) => acc + (curr.agentRating! * curr._count.id), 0);
    const average = totalRatings > 0 ? weightedSum / totalRatings : 0;

    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    ratings.forEach(r => {
      if (r.agentRating) {
        // @ts-ignore
        distribution[r.agentRating] = r._count.id;
      }
    });

    return {
      average: Number(average.toFixed(1)),
      count: totalRatings,
      distribution
    };
  }
}
