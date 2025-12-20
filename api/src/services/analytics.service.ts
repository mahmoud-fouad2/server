import prisma from '../config/database';

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
    messages.forEach((msg) => {
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
}
