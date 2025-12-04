/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Health Check Endpoint
 *  Public endpoint for Render/monitoring services
 * ═══════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const monitor = require('../utils/monitor');

/**
 * GET /api/health - Basic health check
 * Public endpoint - no authentication required
 */
router.get('/', async (req, res) => {
  try {
    const status = await monitor.getHealthStatus();
    
    // Determine overall health
    const isHealthy = 
      status.memory.healthy &&
      status.database.healthy &&
      status.aiProviders.healthy;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      uptime: status.uptime.formatted,
      memory: status.memory,
      database: {
        connected: status.database.connected,
        latency: status.database.latency
      },
      aiProviders: {
        available: status.aiProviders.health?.totalAvailable || 0
      },
      timestamp: status.timestamp
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/detailed - Detailed system report
 * Public endpoint - but returns less sensitive info
 */
router.get('/detailed', async (req, res) => {
  try {
    const report = await monitor.getSystemReport();
    
    // Remove sensitive details for public endpoint
    const publicReport = {
      status: 'operational',
      uptime: report.system.uptime.formatted,
      services: {
        database: report.system.database.connected ? 'online' : 'offline',
        ai: report.system.aiProviders.health?.totalAvailable > 0 ? 'online' : 'offline',
        memory: report.system.memory.healthy ? 'normal' : 'high'
      },
      timestamp: report.generatedAt
    };

    res.json(publicReport);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to generate health report',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
