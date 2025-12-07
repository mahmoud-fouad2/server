const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get Dashboard Stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    // 1. Total Conversations
    const totalConversations = await prisma.conversation.count({
      where: { businessId }
    });

    // 2. Messages Saved (served from cache)
    // We need to count messages where wasFromCache = true
    // But wait, wasFromCache is on Message model, not Conversation.
    // We need to join or aggregate.
    // Let's count all messages for this business that were from cache.
    const savedMessagesCount = await prisma.message.count({
      where: {
        conversation: {
          businessId: businessId
        },
        wasFromCache: true
      }
    });

    // 3. Active Users (Unique externalIds in conversations)
    // Prisma doesn't support distinct count directly on non-id fields easily in all versions, 
    // but we can group by.
    const activeUsersGroup = await prisma.conversation.groupBy({
      by: ['externalId'],
      where: { businessId },
    });
    const activeUsers = activeUsersGroup.length;

    // 4. Recent Activity (Last 5 conversations with last message)
    const recentConversations = await prisma.conversation.findMany({
      where: { businessId },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Calculate savings (Mock calculation: 0.05 SAR per message saved)
    const savings = (savedMessagesCount * 0.05).toFixed(2);

    // Fetch Business Subscription Details
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        planType: true,
        messageQuota: true,
        messagesUsed: true,
        trialEndsAt: true
      }
    });

    res.json({
      stats: {
        totalConversations,
        savedMessages: savedMessagesCount,
        savings,
        activeUsers
      },
      recentActivity: recentConversations.map(c => ({
        id: c.id,
        user: c.externalId || 'Anonymous',
        lastMessage: c.messages[0]?.content || 'No messages',
        time: c.updatedAt
      })),
      subscription: business
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get Business Settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.user.businessId }
    });
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update Business Settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { name, activityType, botTone } = req.body;
    const businessId = req.user.businessId;

    // Defensive update: ensure business exists and catch P2025
    try {
      const updatedBusiness = await prisma.business.update({
        where: { id: businessId },
        data: { name, activityType, botTone }
      });
      res.json({ message: 'Business settings updated', business: updatedBusiness });
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.status(404).json({ error: 'Business not found' });
      }
      console.error('Update Settings Error:', e);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get Business Plan
router.get('/plan', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        planType: true,
        messageQuota: true,
        messagesUsed: true,
        trialEndsAt: true,
        status: true
      }
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    res.json(business);
  } catch (error) {
    console.error('Get Plan Error:', error);
    res.status(500).json({ error: 'Failed to get plan information' });
  }
});

// Update Business Plan
router.put('/plan', authenticateToken, async (req, res) => {
  try {
    const { planType } = req.body;
    const businessId = req.user.businessId;

    // Set quotas based on plan
    let messageQuota;
    let trialEndsAt = null;
    
    switch (planType.toUpperCase()) {
      case 'TRIAL':
        messageQuota = 1000;
        trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        break;
      case 'BASIC':
        messageQuota = 5000;
        break;
      case 'PRO':
        messageQuota = 25000;
        break;
      case 'ENTERPRISE':
        messageQuota = 999999; // Virtually unlimited
        break;
      default:
        messageQuota = 1000;
    }

    try {
      const updatedBusiness = await prisma.business.update({
        where: { id: businessId },
        data: {
          planType: planType.toUpperCase(),
          messageQuota,
          trialEndsAt
        }
      });
      res.json({ message: 'Plan updated successfully', business: updatedBusiness });
    } catch (e) {
      if (e && e.code === 'P2025') {
        return res.status(404).json({ error: 'Business not found' });
      }
      console.error('Update Plan Error:', e);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  } catch (error) {
    console.error('Update Plan Error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Get All Conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { businessId: req.user.businessId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    res.json(conversations.map(c => ({
      id: c.id,
      user: c.externalId || 'Anonymous',
      lastMessage: c.messages[0]?.content || 'No messages',
      time: c.updatedAt,
      channel: c.channel
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get Single Conversation Messages
router.get('/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation || conversation.businessId !== req.user.businessId) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Get Chart Data (Last 7 Days)
router.get('/chart-data', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const conversations = await prisma.conversation.findMany({
      where: {
        businessId,
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group by date
    const chartData = {};
    // Initialize last 7 days with 0
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      chartData[dateStr] = 0;
    }

    conversations.forEach(c => {
      const dateStr = new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (chartData[dateStr] !== undefined) {
        chartData[dateStr]++;
      }
    });

    // Convert to array for frontend
    const result = Object.entries(chartData)
      .map(([date, count]) => ({ date, count }))
      .reverse(); // Oldest first

    res.json(result);
  } catch (error) {
    console.error('Chart Data Error:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get Integrations
router.get('/integrations', authenticateToken, async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { businessId: req.user.businessId }
    });
    res.json(integrations);
  } catch (error) {
    console.error('Get Integrations Error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Update demo business (temporary endpoint)
router.post('/update-demo', authenticateToken, async (req, res) => {
  try {
    // Only allow for hello@faheemly.com user
    if (req.user.email !== 'hello@faheemly.com') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const businessId = req.user.businesses[0]?.id;
    if (!businessId) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: 'فهملي - Faheemly',
        messageQuota: 999999,
        messagesUsed: 0,
        planType: 'ENTERPRISE'
      }
    });

    res.json({
      success: true,
      message: 'Business updated successfully',
      business: updatedBusiness
    });
  } catch (error) {
    console.error('Update demo business error:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

module.exports = router;
