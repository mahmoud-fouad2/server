const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/ai.service');
const logger = require('../utils/logger');

/**
 * Get AI Provider Status and Usage Statistics
 * Protected route - requires authentication
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = aiService.getProviderStatus();
    
    res.json({
      timestamp: new Date().toISOString(),
      providers: status,
      summary: {
        totalProviders: Object.keys(status).length,
        availableProviders: Object.values(status).filter(p => p.available).length,
        enabledProviders: Object.values(status).filter(p => p.enabled).length
      }
    });
  } catch (error) {
    logger.error('[AI Status] Error:', error);
    res.status(500).json({ error: 'Failed to fetch AI provider status' });
  }
});

/**
 * Health Check - Test all AI providers
 * Protected route - requires authentication
 */
router.post('/health', authenticateToken, async (req, res) => {
  try {
    logger.info('[AI Health] Running health check for all providers...');
    const healthResults = await aiService.healthCheck();
    
    const healthySummary = {
      healthy: Object.values(healthResults).filter(r => r.status === 'healthy').length,
      unhealthy: Object.values(healthResults).filter(r => r.status === 'error').length,
      disabled: Object.values(healthResults).filter(r => r.status === 'disabled').length
    };

    res.json({
      timestamp: new Date().toISOString(),
      results: healthResults,
      summary: healthySummary,
      overallHealth: healthySummary.healthy > 0 ? 'operational' : 'degraded'
    });
  } catch (error) {
    logger.error('[AI Health] Error:', error);
    res.status(500).json({ error: 'Failed to perform health check' });
  }
});

/**
 * Test AI Response
 * Protected route - requires authentication
 * Useful for testing the hybrid AI system
 */
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const messages = [
      { role: 'system', content: 'You are a helpful assistant. Keep responses concise.' },
      { role: 'user', content: message }
    ];

    const startTime = Date.now();
    const result = await aiService.generateResponse(messages, { maxTokens: 200 });
    const duration = Date.now() - startTime;

    res.json({
      success: true,
      response: result.response,
      metadata: {
        provider: result.provider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        responseTime: `${duration}ms`
      }
    });
  } catch (error) {
    logger.error('[AI Test] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      details: error.message 
    });
  }
});

module.exports = router;
