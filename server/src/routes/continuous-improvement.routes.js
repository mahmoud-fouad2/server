const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ContinuousImprovementService = require('../services/continuous-improvement.service');
const logger = require('../utils/logger');

/**
 * @route GET /api/improvement/gaps
 * @desc Get knowledge gaps analysis
 * @access Private (Business Owner/Admin)
 */
router.get('/gaps', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { limit = 20, offset = 0 } = req.query;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const gaps = await ContinuousImprovementService.analyzeKnowledgeGaps(businessId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: gaps
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Get gaps error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to analyze knowledge gaps',
      error: error.message
    });
  }
});

/**
 * @route POST /api/improvement/gaps/:gapId/suggestions
 * @desc Generate improvement suggestions for a gap
 * @access Private (Business Owner/Admin)
 */
router.post('/gaps/:gapId/suggestions', authenticateToken, async (req, res) => {
  try {
    const { gapId } = req.params;
    const businessId = req.business?.id;

    const suggestions = await ContinuousImprovementService.generateImprovementSuggestions(gapId, businessId);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Generate suggestions error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to generate improvement suggestions',
      error: error.message
    });
  }
});

/**
 * @route POST /api/improvement/knowledge/update
 * @desc Update knowledge base with new information
 * @access Private (Business Owner/Admin)
 */
router.post('/knowledge/update', authenticateToken, async (req, res) => {
  try {
    const { content, category, source, priority } = req.body;
    const businessId = req.business?.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const result = await ContinuousImprovementService.updateKnowledgeBase(businessId, {
      content,
      category,
      source,
      priority: priority || 'medium'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Update knowledge error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to update knowledge base',
      error: error.message
    });
  }
});

/**
 * @route GET /api/improvement/metrics
 * @desc Get improvement metrics and analytics
 * @access Private (Business Owner/Admin)
 */
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { period = '30d' } = req.query;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const metrics = await ContinuousImprovementService.getImprovementMetrics(businessId, period);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Get metrics error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get improvement metrics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/improvement/feedback
 * @desc Submit user feedback for improvement
 * @access Private
 */
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { conversationId, rating, feedback, category } = req.body;
    const businessId = req.business?.id;
    const userId = req.user?.id;

    if (!conversationId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID and rating are required'
      });
    }

    const result = await ContinuousImprovementService.submitFeedback(businessId, {
      conversationId,
      userId,
      rating,
      feedback,
      category
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Submit feedback error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

/**
 * @route GET /api/improvement/feedback
 * @desc Get feedback analytics
 * @access Private (Business Owner/Admin)
 */
router.get('/feedback', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { limit = 50, offset = 0, category, rating } = req.query;

    const feedback = await ContinuousImprovementService.getFeedbackAnalytics(businessId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      category,
      rating: rating ? parseInt(rating) : null
    });

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Get feedback error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback analytics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/improvement/auto-update
 * @desc Trigger automatic knowledge base update
 * @access Private (Business Owner/Admin)
 */
router.post('/auto-update', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { sources, categories } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const result = await ContinuousImprovementService.triggerAutoUpdate(businessId, {
      sources: sources || [],
      categories: categories || []
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Auto update error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to trigger auto update',
      error: error.message
    });
  }
});

/**
 * @route GET /api/improvement/recommendations
 * @desc Get personalized improvement recommendations
 * @access Private (Business Owner/Admin)
 */
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const recommendations = await ContinuousImprovementService.getRecommendations(businessId);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Get recommendations error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

/**
 * @route POST /api/improvement/train-model
 * @desc Train improvement model with new data
 * @access Private (Business Owner/Admin)
 */
router.post('/train-model', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { trainingData, modelType } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const result = await ContinuousImprovementService.trainImprovementModel(businessId, {
      trainingData,
      modelType: modelType || 'gap_detection'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Train model error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to train improvement model',
      error: error.message
    });
  }
});

/**
 * @route GET /api/improvement/performance
 * @desc Get system performance improvement data
 * @access Private (Business Owner/Admin)
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { metric, period = '7d' } = req.query;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const performance = await ContinuousImprovementService.getPerformanceData(businessId, {
      metric,
      period
    });

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Get performance error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get performance data',
      error: error.message
    });
  }
});

/**
 * @route POST /api/improvement/benchmark
 * @desc Run benchmark comparison
 * @access Private (Business Owner/Admin)
 */
router.post('/benchmark', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { competitors, metrics } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const benchmark = await ContinuousImprovementService.runBenchmark(businessId, {
      competitors: competitors || [],
      metrics: metrics || ['response_time', 'accuracy', 'satisfaction']
    });

    res.json({
      success: true,
      data: benchmark
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Benchmark error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to run benchmark',
      error: error.message
    });
  }
});

/**
 * @route GET /api/improvement/trends
 * @desc Get improvement trends over time
 * @access Private (Business Owner/Admin)
 */
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { period = '90d', metrics } = req.query;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const trends = await ContinuousImprovementService.getImprovementTrends(businessId, {
      period,
      metrics: metrics ? metrics.split(',') : ['accuracy', 'response_time', 'satisfaction']
    });

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Get trends error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get improvement trends',
      error: error.message
    });
  }
});

/**
 * @route POST /api/improvement/goals
 * @desc Set improvement goals
 * @access Private (Business Owner/Admin)
 */
router.post('/goals', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const { goals } = req.body;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    if (!goals || !Array.isArray(goals)) {
      return res.status(400).json({
        success: false,
        message: 'Goals array is required'
      });
    }

    const result = await ContinuousImprovementService.setImprovementGoals(businessId, goals);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Set goals error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to set improvement goals',
      error: error.message
    });
  }
});

/**
 * @route GET /api/improvement/goals/progress
 * @desc Get goals progress
 * @access Private (Business Owner/Admin)
 */
router.get('/goals/progress', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const progress = await ContinuousImprovementService.getGoalsProgress(businessId);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    logger.error('[Continuous Improvement Routes] Get goals progress error', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get goals progress',
      error: error.message
    });
  }
});

module.exports = router;
