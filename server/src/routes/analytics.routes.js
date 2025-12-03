const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

/**
 * Analytics Dashboard API
 * Comprehensive statistics for business owners
 */

// Get overall statistics
router.get('/stats/overview/:businessId', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { period = '30' } = req.query; // days

    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        userId: req.user.userId
      }
    });

    if (!business) {
      return res.status(403).json({ error: 'غير مصرح لك بالوصول لهذه البيانات' });
    }

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));

    // Total conversations
    const totalConversations = await prisma.conversation.count({
      where: {
        businessId,
        createdAt: { gte: periodDate }
      }
    });

    // Total messages
    const totalMessages = await prisma.message.count({
      where: {
        conversation: { businessId },
        createdAt: { gte: periodDate }
      }
    });

    // User messages vs AI messages
    const userMessages = await prisma.message.count({
      where: {
        conversation: { businessId },
        role: 'USER',
        createdAt: { gte: periodDate }
      }
    });

    const aiMessages = await prisma.message.count({
      where: {
        conversation: { businessId },
        role: 'ASSISTANT',
        createdAt: { gte: periodDate }
      }
    });

    // Average rating
    const ratings = await prisma.conversation.aggregate({
      where: {
        businessId,
        rating: { not: null },
        createdAt: { gte: periodDate }
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    // Channel breakdown
    const channelStats = await prisma.conversation.groupBy({
      by: ['channel'],
      where: {
        businessId,
        createdAt: { gte: periodDate }
      },
      _count: { id: true }
    });

    // Daily message trend (last 30 days)
    const dailyMessages = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "Message" m
      JOIN "Conversation" c ON m."conversationId" = c.id
      WHERE c."businessId" = ${businessId}
        AND m."createdAt" >= ${periodDate}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
      LIMIT 30
    `;

    res.json({
      period: `${period} days`,
      overview: {
        totalConversations,
        totalMessages,
        userMessages,
        aiMessages,
        averageRating: ratings._avg.rating || 0,
        totalRatings: ratings._count.rating || 0
      },
      channels: channelStats.map(stat => ({
        channel: stat.channel,
        count: stat._count.id
      })),
      dailyTrend: dailyMessages,
      quotaUsage: {
        used: business.messagesUsed,
        limit: business.messageQuota,
        percentage: Math.round((business.messagesUsed / business.messageQuota) * 100)
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'فشل جلب الإحصائيات' });
  }
});

// Get most common questions
router.get('/stats/top-questions/:businessId', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.params;
    const { limit = 10 } = req.query;

    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        userId: req.user.userId
      }
    });

    if (!business) {
      return res.status(403).json({ error: 'غير مصرح' });
    }

    // Get most common user messages
    const topQuestions = await prisma.$queryRaw`
      SELECT 
        m.content,
        COUNT(*) as frequency
      FROM "Message" m
      JOIN "Conversation" c ON m."conversationId" = c.id
      WHERE c."businessId" = ${businessId}
        AND m.role = 'USER'
        AND LENGTH(m.content) > 10
      GROUP BY m.content
      ORDER BY frequency DESC
      LIMIT ${parseInt(limit)}
    `;

    res.json({ topQuestions });

  } catch (error) {
    console.error('Top questions error:', error);
    res.status(500).json({ error: 'فشل جلب الأسئلة الشائعة' });
  }
});

// Get response time statistics
router.get('/stats/response-time/:businessId', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        userId: req.user.userId
      }
    });

    if (!business) {
      return res.status(403).json({ error: 'غير مصرح' });
    }

    // Get average response time
    const responseStats = await prisma.$queryRaw`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (m2."createdAt" - m1."createdAt"))) as avg_seconds,
        MIN(EXTRACT(EPOCH FROM (m2."createdAt" - m1."createdAt"))) as min_seconds,
        MAX(EXTRACT(EPOCH FROM (m2."createdAt" - m1."createdAt"))) as max_seconds
      FROM "Message" m1
      JOIN "Message" m2 ON m1."conversationId" = m2."conversationId"
      JOIN "Conversation" c ON m1."conversationId" = c.id
      WHERE c."businessId" = ${businessId}
        AND m1.role = 'USER'
        AND m2.role = 'ASSISTANT'
        AND m2."createdAt" > m1."createdAt"
        AND m2."createdAt" - m1."createdAt" < INTERVAL '5 minutes'
    `;

    res.json({
      averageSeconds: parseFloat(responseStats[0]?.avg_seconds || 0).toFixed(2),
      minSeconds: parseFloat(responseStats[0]?.min_seconds || 0).toFixed(2),
      maxSeconds: parseFloat(responseStats[0]?.max_seconds || 0).toFixed(2)
    });

  } catch (error) {
    console.error('Response time error:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات وقت الاستجابة' });
  }
});

// Get satisfaction trends
router.get('/stats/satisfaction/:businessId', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        userId: req.user.userId
      }
    });

    if (!business) {
      return res.status(403).json({ error: 'غير مصرح' });
    }

    // Rating distribution
    const ratingDistribution = await prisma.conversation.groupBy({
      by: ['rating'],
      where: {
        businessId,
        rating: { not: null }
      },
      _count: { rating: true }
    });

    // Monthly satisfaction trend
    const monthlySatisfaction = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        AVG(rating::numeric) as avg_rating,
        COUNT(*) as total_ratings
      FROM "Conversation"
      WHERE "businessId" = ${businessId}
        AND rating IS NOT NULL
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `;

    res.json({
      distribution: ratingDistribution.map(r => ({
        rating: r.rating,
        count: r._count.rating
      })),
      monthlyTrend: monthlySatisfaction
    });

  } catch (error) {
    console.error('Satisfaction stats error:', error);
    res.status(500).json({ error: 'فشل جلب إحصائيات الرضا' });
  }
});

module.exports = router;
