const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Fix for BigInt serialization in JSON (Prisma COUNT returns BigInt)
BigInt.prototype.toJSON = function() { return Number(this) }

/**
 * Analytics Dashboard API
 * Comprehensive statistics for business owners
 */

// ✅ DASHBOARD ENDPOINT (Custom Range)
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    // If no query params, this might be a mistake or default request
    // But since /dashboard/:days handles the default, we assume this is for custom range
    
    const businessId = req.user.businessId || (await prisma.business.findFirst({ where: { userId: req.user.userId } }))?.id;
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    // 1. Daily Trends
    const dailyMessages = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM "Message" m
      JOIN "Conversation" c ON m."conversationId" = c.id
      WHERE c."businessId" = ${businessId}
        AND m."createdAt" >= ${startDate}
        AND m."createdAt" <= ${endDate}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    // 2. Response Times (Mock)
    const responseTimes = [
      { range: '0-1m', count: 45 },
      { range: '1-5m', count: 20 },
      { range: '5m+', count: 5 }
    ];

    // 3. Satisfaction
    const ratings = await prisma.conversation.groupBy({
      by: ['rating'],
      where: {
        businessId,
        rating: { not: null },
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: { rating: true }
    });

    const satisfactionDistribution = ratings.map(r => ({
      rating: r.rating,
      count: r._count.rating
    }));

    res.json({
      trends: {
        daily: dailyMessages.map(d => ({ date: d.date, count: Number(d.count) }))
      },
      performance: {
        responseTimes,
        satisfactionDistribution
      }
    });

  } catch (error) {
    console.error('Dashboard custom range error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ✅ DASHBOARD ENDPOINT (Aggregated Stats)
router.get('/dashboard/:days', authenticateToken, async (req, res) => {
  try {
    const { days } = req.params;
    let businessId = req.user.businessId; 
    
    if (!businessId) {
       const business = await prisma.business.findFirst({ where: { userId: req.user.userId } });
       if (!business) return res.status(404).json({ error: 'Business not found' });
       businessId = business.id;
    }

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(days || 30));

    // 1. Daily Trends
    const dailyMessages = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM "Message" m
      JOIN "Conversation" c ON m."conversationId" = c.id
      WHERE c."businessId" = ${businessId}
        AND m."createdAt" >= ${periodDate}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    // 2. Response Times (Mock or Real)
    const responseTimes = [
      { range: '0-1m', count: 45 },
      { range: '1-5m', count: 20 },
      { range: '5m+', count: 5 }
    ];

    // 3. Satisfaction
    const ratings = await prisma.conversation.groupBy({
      by: ['rating'],
      where: {
        businessId: businessId,
        rating: { not: null },
        createdAt: { gte: periodDate }
      },
      _count: { rating: true }
    });

    const satisfactionDistribution = ratings.map(r => ({
      rating: r.rating,
      count: r._count.rating
    }));

    res.json({
      trends: {
        daily: dailyMessages.map(d => ({ date: d.date, count: Number(d.count) }))
      },
      performance: {
        responseTimes,
        satisfactionDistribution
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ✅ VECTOR STATS ENDPOINT
router.get('/vector-stats', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId || (await prisma.business.findFirst({ where: { userId: req.user.userId } }))?.id;
    
    if (!businessId) return res.status(404).json({ error: 'Business not found' });

    // Count documents and knowledge base items
    const documentCount = await prisma.document?.count({ where: { businessId } }) || 0;
    const knowledgeCount = await prisma.knowledgeBase?.count({ where: { businessId } }) || 0;
    
    // Mock vector dimension info (since we can't easily query it without raw SQL on vector column)
    res.json({
      totalDocuments: documentCount,
      totalVectors: knowledgeCount, // Assuming 1 vector per knowledge item
      dimension: 1536, // OpenAI default
      indexStatus: 'indexed'
    });

  } catch (error) {
    console.error('Vector stats error:', error);
    res.status(500).json({ error: 'Failed to fetch vector stats' });
  }
});

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

// ✅ REALTIME ANALYTICS ENDPOINT
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    
    // Get real-time data
    const activeConversations = await prisma.conversation.count({
      where: {
        businessId,
        status: 'ACTIVE',
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });
    
    const todayMessages = await prisma.message.count({
      where: {
        conversation: { businessId },
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    
    res.json({
      activeVisitors: activeConversations,
      todayMessages,
      responseTime: '2.3s', // Calculate actual response time
      satisfaction: 4.5 // Calculate from ratings
    });
  } catch (error) {
    console.error('Realtime analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ ALERTS ENDPOINT
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { businessId } = req.user;
    
    // Check for alerts
    const alerts = [];
    
    // Example: Check if quota is low
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { messageQuota: true, messagesUsed: true }
    });
    
    if (business && business.messagesUsed > business.messageQuota * 0.9) {
      alerts.push({
        type: 'warning',
        message: 'Message quota almost reached',
        percentage: ((business.messagesUsed / business.messageQuota) * 100).toFixed(0)
      });
    }
    
    res.json({ alerts });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
