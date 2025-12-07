/**
 * Business Controller
 * Handles all business-related operations including settings, stats, plans, and integrations
 */

const asyncHandler = require('express-async-handler');
const prisma = require('../config/database');

/**
 * @desc    Get Dashboard Statistics
 * @route   GET /api/business/stats
 * @access  Private (Business Owner)
 */
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const businessId = req.user.businessId;

  // 1. Total Conversations
  const totalConversations = await prisma.conversation.count({
    where: { businessId }
  });

  // 2. Messages Saved (served from cache)
  const savedMessagesCount = await prisma.message.count({
    where: {
      conversation: {
        businessId: businessId
      },
      wasFromCache: true
    }
  });

  // 3. Active Users (Unique externalIds in conversations)
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

  // Calculate savings (0.05 SAR per message saved)
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
});

/**
 * @desc    Get Business Settings
 * @route   GET /api/business/settings
 * @access  Private (Business Owner)
 */
exports.getSettings = asyncHandler(async (req, res) => {
  const business = await prisma.business.findUnique({
    where: { id: req.user.businessId }
  });

  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  res.json(business);
});

/**
 * @desc    Update Business Settings
 * @route   PUT /api/business/settings
 * @access  Private (Business Owner)
 */
exports.updateSettings = asyncHandler(async (req, res) => {
  const { name, activityType, botTone } = req.body;
  const businessId = req.user.businessId;

  try {
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: { name, activityType, botTone }
    });

    res.json({ 
      message: 'Business settings updated', 
      business: updatedBusiness 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404);
      throw new Error('Business not found');
    }
    throw error;
  }
});

/**
 * @desc    Get Business Plan Details
 * @route   GET /api/business/plan
 * @access  Private (Business Owner)
 */
exports.getPlan = asyncHandler(async (req, res) => {
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
    res.status(404);
    throw new Error('Business not found');
  }

  res.json(business);
});

/**
 * @desc    Update Business Plan
 * @route   PUT /api/business/plan
 * @access  Private (Business Owner)
 */
exports.updatePlan = asyncHandler(async (req, res) => {
  const { planType } = req.body;
  const businessId = req.user.businessId;

  // Set quotas based on plan
  let messageQuota;
  let trialEndsAt = null;
  
  switch (planType.toUpperCase()) {
    case 'TRIAL':
      messageQuota = 1000;
      trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
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
      res.status(400);
      throw new Error('Invalid plan type');
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

    res.json({ 
      message: 'Plan updated successfully', 
      business: updatedBusiness 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404);
      throw new Error('Business not found');
    }
    throw error;
  }
});

/**
 * @desc    Get All Conversations
 * @route   GET /api/business/conversations
 * @access  Private (Business Owner)
 */
exports.getConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { businessId: req.user.businessId },
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    }),
    prisma.conversation.count({
      where: { businessId: req.user.businessId }
    })
  ]);
  
  res.json({
    conversations: conversations.map(c => ({
      id: c.id,
      user: c.externalId || 'Anonymous',
      lastMessage: c.messages[0]?.content || 'No messages',
      time: c.updatedAt,
      channel: c.channel
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Get Single Conversation with Messages
 * @route   GET /api/business/conversations/:id
 * @access  Private (Business Owner)
 */
exports.getConversationById = asyncHandler(async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  if (conversation.businessId !== req.user.businessId) {
    res.status(403);
    throw new Error('Not authorized to access this conversation');
  }

  res.json(conversation);
});

/**
 * @desc    Get Chart Data for Last 7 Days
 * @route   GET /api/business/chart-data
 * @access  Private (Business Owner)
 */
exports.getChartData = asyncHandler(async (req, res) => {
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

  // Initialize last 7 days with 0
  const chartData = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    chartData[dateStr] = 0;
  }

  // Count conversations per day
  conversations.forEach(c => {
    const dateStr = new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (chartData[dateStr] !== undefined) {
      chartData[dateStr]++;
    }
  });

  // Convert to array for frontend (oldest first)
  const result = Object.entries(chartData)
    .map(([date, count]) => ({ date, count }))
    .reverse();

  res.json(result);
});

/**
 * @desc    Get Business Integrations
 * @route   GET /api/business/integrations
 * @access  Private (Business Owner)
 */
exports.getIntegrations = asyncHandler(async (req, res) => {
  const integrations = await prisma.integration.findMany({
    where: { businessId: req.user.businessId }
  });

  res.json(integrations);
});

/**
 * @desc    Update Demo Business (Admin Only)
 * @route   POST /api/business/update-demo
 * @access  Private (Admin)
 */
exports.updateDemoBusiness = asyncHandler(async (req, res) => {
  // Only allow for hello@faheemly.com user
  if (req.user.email !== 'hello@faheemly.com') {
    res.status(403);
    throw new Error('Unauthorized: Admin access required');
  }

  const businessId = req.user.businesses?.[0]?.id;
  if (!businessId) {
    res.status(404);
    throw new Error('Business not found');
  }

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
});
