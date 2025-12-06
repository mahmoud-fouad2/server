const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ConversationAnalyticsService = require('../services/conversation-analytics.service');

/**
 * @route POST /api/analytics/conversation
 * @desc Analyze a conversation and extract insights
 * @access Private
 */
router.post('/conversation', authenticateToken, async (req, res) => {
  try {
    const { messages, conversationId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    const analysis = ConversationAnalyticsService.analyzeConversation(
      messages,
      conversationId || `conv_${Date.now()}`
    );

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('[Conversation Analytics Routes] Analyze error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze conversation',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analytics/dashboard/:days
 * @desc Get analytics dashboard data
 * @access Private (Business Owner/Admin)
 */
router.get('/dashboard/:days?', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const businessId = req.business?.id || req.params.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const dashboard = ConversationAnalyticsService.getDashboardData(days);
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('[Conversation Analytics Routes] Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

// Public demo dashboard (no auth) - useful for local development and previews
router.get('/dashboard-public/:days?', async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const dashboard = ConversationAnalyticsService.getDashboardData(days);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    console.error('[Conversation Analytics Routes] Public Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard data', error: error.message });
  }
});

/**
 * @route GET /api/analytics/report/:date
 * @desc Get daily analytics report
 * @access Private (Business Owner/Admin)
 */
router.get('/report/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const report = ConversationAnalyticsService.getDailyReport(date);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'No data found for the specified date'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('[Conversation Analytics Routes] Report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics report',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analytics/export
 * @desc Export analytics data
 * @access Private (Business Owner/Admin)
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const days = parseInt(req.query.days) || 30;
    const businessId = req.business?.id;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
    }

    const exportData = ConversationAnalyticsService.exportAnalyticsData(format, days);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${businessId}_${Date.now()}.csv`);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analytics_${businessId}_${Date.now()}.json`);
    }

    res.send(exportData);
  } catch (error) {
    console.error('[Conversation Analytics Routes] Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analytics/topics
 * @desc Get topic analysis for conversations
 * @access Private (Business Owner/Admin)
 */
router.get('/topics', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const dashboard = ConversationAnalyticsService.getDashboardData(30);

    res.json({
      success: true,
      data: {
        topTopics: dashboard.topTopics,
        topicTrends: dashboard.trends.topics
      }
    });
  } catch (error) {
    console.error('[Conversation Analytics Routes] Topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get topic analysis',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analytics/performance
 * @desc Get performance metrics
 * @access Private (Business Owner/Admin)
 */
router.get('/performance', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id;
    const dashboard = ConversationAnalyticsService.getDashboardData(7);

    res.json({
      success: true,
      data: {
        responseTime: dashboard.performance?.averageResponseTime || 0,
        resolutionRate: dashboard.performance?.resolutionRate || 0,
        customerSatisfaction: dashboard.performance?.customerSatisfaction || 0,
        conversationFlow: dashboard.performance?.conversationFlow || {}
      }
    });
  } catch (error) {
    console.error('[Conversation Analytics Routes] Performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error.message
    });
  }
});

/**
 * @route GET /api/analytics/vector-stats
 * @desc Get vector search stats (coverage, embeddings count)
 * @access Private (but we provide public fallback during DEV_NO_AUTH)
 */
router.get('/vector-stats', authenticateToken, async (req, res) => {
  try {
    const businessId = req.business?.id || req.query.businessId || 'demo';
    const vectorSearch = require('../services/vector-search.service');
    const stats = await vectorSearch.getSearchStats(businessId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Conversation Analytics Routes] Vector stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get vector stats', error: error.message });
  }
});

/**
 * @route POST /api/analytics/track-event
 * @desc Track analytics event
 * @access Private
 */
router.post('/track-event', authenticateToken, async (req, res) => {
  try {
    const { eventType, eventData, conversationId } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    // Store event for analytics
    const event = {
      type: eventType,
      data: eventData,
      conversationId,
      timestamp: new Date(),
      businessId: req.business?.id,
      userId: req.user?.id
    };

    // In a real implementation, this would be stored in database
    console.log('[Conversation Analytics Routes] Event tracked:', event);

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('[Conversation Analytics Routes] Track event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
      error: error.message
    });
  }
});

module.exports = router;
