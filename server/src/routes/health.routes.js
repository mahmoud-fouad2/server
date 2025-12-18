/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Health Check Endpoint
 *  Public endpoint for Render/monitoring services
 * ═══════════════════════════════════════════════════
 */

import express from 'express';
const router = express.Router();
import * as monitorModule from '../utils/monitor.js';
const monitor = monitorModule && monitorModule.default ? monitorModule.default : monitorModule;

const rateLimitModule = await import('express-rate-limit');
const rateLimit = rateLimitModule?.default || rateLimitModule;

// Rate limiter for health endpoint to mitigate DoS-style bursts in tests
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // allow 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * GET /api/health - Basic health check
 * Public endpoint - no authentication required
 */
router.get('/', healthLimiter, async (req, res) => {
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
        available: status.aiProviders.totalAvailable || 0,
        configured: status.aiProviders.totalConfigured || 0,
        healthy: status.aiProviders.healthy,
        providers: status.aiProviders.providers || []
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
        ai: (report.system.aiProviders.totalAvailable || 0) > 0 ? 'online' : 'offline',
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

export default router;
