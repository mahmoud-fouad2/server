const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const SentimentAnalysisService = require('../services/sentiment-analysis.service');

/**
 * @route POST /api/sentiment/analyze
 * @desc Analyze sentiment of a message
 * @access Private
 */
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const sentiment = SentimentAnalysisService.analyzeSentiment(message, language);
    res.json({
      success: true,
      data: sentiment
    });
  } catch (error) {
    console.error('[Sentiment Routes] Analyze error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze sentiment',
      error: error.message
    });
  }
});

/**
 * @route POST /api/sentiment/analyze-conversation
 * @desc Analyze sentiment trends in a conversation
 * @access Private
 */
router.post('/analyze-conversation', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    const analysis = SentimentAnalysisService.analyzeConversation(messages);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('[Sentiment Routes] Analyze conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze conversation sentiment',
      error: error.message
    });
  }
});

/**
 * @route GET /api/sentiment/trends
 * @desc Get sentiment trends over time
 * @access Private (Business Owner/Admin)
 */
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const trends = SentimentAnalysisService.getSentimentTrends(hours);

    res.json({
      success: true,
      data: {
        period: `${hours} hours`,
        trends
      }
    });
  } catch (error) {
    console.error('[Sentiment Routes] Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sentiment trends',
      error: error.message
    });
  }
});

/**
 * @route POST /api/sentiment/optimize-response
 * @desc Optimize response based on sentiment
 * @access Private
 */
router.post('/optimize-response', authenticateToken, async (req, res) => {
  try {
    const { baseResponse, sentiment } = req.body;

    if (!baseResponse || !sentiment) {
      return res.status(400).json({
        success: false,
        message: 'Base response and sentiment are required'
      });
    }

    const optimized = SentimentAnalysisService.optimizeResponse(baseResponse, sentiment);
    res.json({
      success: true,
      data: {
        original: baseResponse,
        optimized,
        sentiment: sentiment.sentiment
      }
    });
  } catch (error) {
    console.error('[Sentiment Routes] Optimize response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize response',
      error: error.message
    });
  }
});

/**
 * @route GET /api/sentiment/history
 * @desc Get sentiment analysis history
 * @access Private (Business Owner/Admin)
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const sentimentHistory = Array.from(SentimentAnalysisService.sentimentHistory.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    res.json({
      success: true,
      data: {
        count: sentimentHistory.length,
        history: sentimentHistory
      }
    });
  } catch (error) {
    console.error('[Sentiment Routes] Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sentiment history',
      error: error.message
    });
  }
});

/**
 * @route POST /api/sentiment/track-feedback
 * @desc Track user feedback for sentiment analysis improvement
 * @access Private
 */
router.post('/track-feedback', authenticateToken, async (req, res) => {
  try {
    const { message, sentiment, userFeedback, actualSentiment } = req.body;

    if (!message || !sentiment) {
      return res.status(400).json({
        success: false,
        message: 'Message and sentiment are required'
      });
    }

    // Store feedback for model improvement
    const feedback = {
      message,
      predictedSentiment: sentiment,
      userFeedback,
      actualSentiment,
      timestamp: new Date(),
      businessId: req.business?.id
    };

    // In a real implementation, this would be stored in database
    console.log('[Sentiment Routes] Feedback tracked:', feedback);

    res.json({
      success: true,
      message: 'Feedback tracked successfully'
    });
  } catch (error) {
    console.error('[Sentiment Routes] Track feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track feedback',
      error: error.message
    });
  }
});

module.exports = router;
