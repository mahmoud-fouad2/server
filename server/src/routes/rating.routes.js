import express from 'express';
const router = express.Router();
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * POST /api/rating/conversation
 * تقييم المحادثة (عام)
 */
router.post('/conversation', async (req, res) => {
  try {
    const { conversationId, rating, feedback } = req.body;

    if (!conversationId || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'conversationId and rating are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        rating,
        feedback: feedback || null
      }
    });

    res.json({ success: true, conversation });
  } catch (error) {
    logger.error('Rating error', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/rating/agent
 * تقييم الموظف (Live Agent)
 */
router.post('/agent', async (req, res) => {
  try {
    const { conversationId, agentRating, agentFeedback } = req.body;

    if (!conversationId || !agentRating) {
      return res.status(400).json({ 
        success: false, 
        message: 'conversationId and agentRating are required' 
      });
    }

    if (agentRating < 1 || agentRating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent rating must be between 1 and 5' 
      });
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        agentRating,
        agentFeedback: agentFeedback || null
      }
    });

    res.json({ success: true, conversation });
  } catch (error) {
    logger.error('Agent rating error', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/rating/stats/:businessId
 * إحصائيات التقييمات
 */
router.get('/stats/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;

    // تقييمات المحادثات
    const conversations = await prisma.conversation.findMany({
      where: {
        businessId,
        rating: { not: null }
      },
      select: {
        rating: true,
        agentRating: true,
        createdAt: true
      }
    });

    if (conversations.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalRatings: 0,
          avgRating: 0,
          avgAgentRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          agentRatingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    // حساب الإحصائيات
    const totalRatings = conversations.length;
    const avgRating = conversations.reduce((sum, c) => sum + (c.rating || 0), 0) / totalRatings;
    
    const agentRatedConvs = conversations.filter(c => c.agentRating !== null);
    const avgAgentRating = agentRatedConvs.length > 0
      ? agentRatedConvs.reduce((sum, c) => sum + c.agentRating, 0) / agentRatedConvs.length
      : 0;

    // توزيع التقييمات
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const agentRatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    conversations.forEach(c => {
      if (c.rating) ratingDistribution[c.rating]++;
      if (c.agentRating) agentRatingDistribution[c.agentRating]++;
    });

    res.json({
      success: true,
      stats: {
        totalRatings,
        totalAgentRatings: agentRatedConvs.length,
        avgRating: Math.round(avgRating * 10) / 10,
        avgAgentRating: Math.round(avgAgentRating * 10) / 10,
        ratingDistribution,
        agentRatingDistribution
      }
    });
  } catch (error) {
    logger.error('Rating stats error', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/rating/recent/:businessId
 * أحدث التقييمات
 */
router.get('/recent/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const conversations = await prisma.conversation.findMany({
      where: {
        businessId,
        OR: [
          { rating: { not: null } },
          { agentRating: { not: null } }
        ]
      },
      select: {
        id: true,
        rating: true,
        feedback: true,
        agentRating: true,
        agentFeedback: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });

    res.json({ success: true, ratings: conversations });
  } catch (error) {
    logger.error('Recent ratings error', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
