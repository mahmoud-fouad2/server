/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Real-time System Monitor
 *  Tracks: Uptime, Memory, DB, AI Providers
 * ═══════════════════════════════════════════════════
 */

import prisma from '../config/database.js';
import logger from './logger.js';

class SystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      uptime: 0,
      memory: {},
      database: { connected: false, latency: 0 },
      aiProviders: {},
      errors: []
    };
    this.monitorInterval = null;
  }

  /**
   * Get current system health status
   */
  async getHealthStatus() {
    const status = {
      uptime: this.getUptime(),
      memory: this.getMemoryUsage(),
      database: await this.checkDatabaseHealth(),
      aiProviders: await this.checkAIProvidersHealth(),
      timestamp: new Date().toISOString()
    };

    // Store metrics
    this.metrics = status;

    // Send alerts for critical issues
    if (!status.memory.healthy) {
      this.sendAlert('HIGH_MEMORY', `Memory usage: ${status.memory.percentage}%`);
    }
    if (!status.database.healthy) {
      this.sendAlert('DB_CONNECTION', `Database ${status.database.connected ? 'latency high' : 'disconnected'}: ${status.database.latency || status.database.error}`);
    }
    if (!status.aiProviders.healthy) {
      this.sendAlert('AI_UNAVAILABLE', 'All AI providers are down or rate limited');
    }

    return status;
  }

  /**
   * Get formatted uptime
   */
  getUptime() {
    const uptime = Date.now() - this.startTime;
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return {
      milliseconds: uptime,
      formatted: `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`,
      healthy: true
    };
  }

  /**
   * Get memory usage stats
   */
  getMemoryUsage() {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const rssMB = Math.round(used.rss / 1024 / 1024);

    return {
      heapUsed: `${heapUsedMB} MB`,
      heapTotal: `${heapTotalMB} MB`,
      rss: `${rssMB} MB`,
      percentage: Math.round((used.heapUsed / used.heapTotal) * 100),
      healthy: heapUsedMB < 400 // Alert if over 400MB
    };
  }

  /**
   * Check database connection and latency
   */
  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      const DB_LATENCY_THRESHOLD = parseInt(process.env.DB_LATENCY_THRESHOLD_MS, 10) || 1000;

      return {
        connected: true,
        latency: `${latency}ms`,
        healthy: latency < DB_LATENCY_THRESHOLD // Configurable threshold via env
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        healthy: false
      };
    }
  }

  /**
   * Check AI providers health
   */
  async checkAIProvidersHealth() {
    try {
      const aiModule = await import('../services/ai.service.js');
      const aiService = aiModule?.default || aiModule;
      const summary = await (typeof aiService.checkProvidersHealth === 'function' ? aiService.checkProvidersHealth() : Promise.resolve({ totalAvailable: 0, totalConfigured: 0, providers: [] }));

      return {
        healthy: summary.totalAvailable > 0,
        totalAvailable: summary.totalAvailable,
        totalConfigured: summary.totalConfigured,
        providers: summary.providers
      };
    } catch (error) {
      return {
        error: error.message,
        healthy: false,
        totalAvailable: 0,
        totalConfigured: 0,
        providers: []
      };
    }
  }

  /**
   * Log health status to console (for monitoring dashboards)
   */
  async logHealthStatus() {
    const status = await this.getHealthStatus();
    
    logger.info('FAHEEMLY SYSTEM HEALTH', {
      uptime: status.uptime.formatted,
      memory: status.memory,
      database: status.database,
      aiProviders: status.aiProviders,
    });

    return status;
  }

  /**
   * Start periodic health checks
   */
  startPeriodicMonitoring(intervalMinutes = 5) {
    logger.info(`Starting health monitoring (every ${intervalMinutes} minutes)...`);
    
    // Initial check
    this.logHealthStatus().catch(error => logger.error('Initial health check error', { error }));

    // Periodic checks
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.monitorInterval = setInterval(async () => {
      try {
        await this.logHealthStatus();
      } catch (error) {
        logger.error('Periodic health check error', { error });
      }
    }, intervalMinutes * 60 * 1000);
  }

  stopPeriodicMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  /**
   * Get business analytics for monitoring
   */
  async getBusinessMetrics() {
    try {
      const totalBusinesses = await prisma.business.count();
      const activeBusinesses = await prisma.business.count({
        where: { status: 'ACTIVE' }
      });
      const trialBusinesses = await prisma.business.count({
        where: { planType: 'TRIAL' }
      });
      const totalUsers = await prisma.user.count();
      const totalConversations = await prisma.conversation.count();
      const totalMessages = await prisma.message.count();

      // Get usage stats from last 24 hours
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const messagesLast24h = await prisma.message.count({
        where: {
          createdAt: { gte: last24h }
        }
      });

      return {
        businesses: {
          total: totalBusinesses,
          active: activeBusinesses,
          trial: trialBusinesses
        },
        users: totalUsers,
        conversations: totalConversations,
        messages: {
          total: totalMessages,
          last24h: messagesLast24h
        }
      };
    } catch (error) {
      logger.error('Error fetching business metrics', { error });
      return null;
    }
  }

  /**
   * Send alert notification
   * @param {string} type - Alert type
   * @param {string} message - Alert message
   */
  sendAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type)
    };

    // Log alert
    logger.error(`🚨 ALERT [${alert.severity}]: ${type} - ${message}`);

    // In production, send to external monitoring service
    // Example: SendGrid email, Slack webhook, PagerDuty, etc.
    // this.sendToMonitoringService(alert);

    // Store alert for dashboard
    this.alerts = this.alerts || [];
    this.alerts.unshift(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(0, 100);
    }
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severityMap = {
      HIGH_MEMORY: 'WARNING',
      DB_CONNECTION: 'CRITICAL',
      AI_UNAVAILABLE: 'CRITICAL',
      RATE_LIMIT: 'WARNING',
      SYSTEM_ERROR: 'ERROR'
    };
    return severityMap[type] || 'INFO';
  }

  /**
   * Get recent alerts for dashboard
   */
  getRecentAlerts(limit = 10) {
    return (this.alerts || []).slice(0, limit);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanHours = 24) {
    if (!this.alerts) return;
    
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => new Date(alert.timestamp) > cutoff);
  }

  /**
   * Get detailed system report
   */
  async getSystemReport() {
    const health = await this.getHealthStatus();
    const metrics = await this.getBusinessMetrics();
    const alerts = this.getRecentAlerts(5);

    return {
      system: health,
      business: metrics,
      alerts: alerts,
      generatedAt: new Date().toISOString()
    };
  }
}

// Singleton instance
const monitor = new SystemMonitor();

export default monitor;
