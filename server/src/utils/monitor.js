/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Real-time System Monitor
 *  Tracks: Uptime, Memory, DB, AI Providers
 * ═══════════════════════════════════════════════════
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

      return {
        connected: true,
        latency: `${latency}ms`,
        healthy: latency < 100 // Alert if over 100ms
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
    const hybridAI = require('../services/hybrid-ai.service');
    
    try {
      const stats = hybridAI.getProviderStats();
      const health = hybridAI.checkProvidersHealth();

      return {
        stats,
        health,
        healthy: health.totalAvailable > 0
      };
    } catch (error) {
      return {
        error: error.message,
        healthy: false
      };
    }
  }

  /**
   * Log health status to console (for monitoring dashboards)
   */
  async logHealthStatus() {
    const status = await this.getHealthStatus();
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 FAHEEMLY SYSTEM HEALTH');
    console.log('═══════════════════════════════════════════════════');
    console.log(`⏱️  Uptime: ${status.uptime.formatted}`);
    console.log(`💾 Memory: ${status.memory.heapUsed} / ${status.memory.heapTotal} (${status.memory.percentage}%)`);
    console.log(`🗄️  Database: ${status.database.connected ? '✅ Connected' : '❌ Disconnected'} (${status.database.latency})`);
    console.log(`🤖 AI Providers: ${status.aiProviders.health?.totalAvailable || 0} available`);
    console.log('═══════════════════════════════════════════════════\n');

    // Alert if unhealthy
    if (!status.memory.healthy) {
      console.warn('⚠️  WARNING: High memory usage detected!');
    }
    if (!status.database.healthy) {
      console.warn('⚠️  WARNING: Database connection issues!');
    }
    if (!status.aiProviders.healthy) {
      console.warn('⚠️  WARNING: No AI providers available!');
    }

    return status;
  }

  /**
   * Start periodic health checks
   */
  startPeriodicMonitoring(intervalMinutes = 5) {
    console.log(`🔍 Starting health monitoring (every ${intervalMinutes} minutes)...`);
    
    // Initial check
    this.logHealthStatus();

    // Periodic checks
    setInterval(() => {
      this.logHealthStatus();
    }, intervalMinutes * 60 * 1000);
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
      console.error('Error fetching business metrics:', error);
      return null;
    }
  }

  /**
   * Get detailed system report
   */
  async getSystemReport() {
    const health = await this.getHealthStatus();
    const metrics = await this.getBusinessMetrics();

    return {
      system: health,
      business: metrics,
      generatedAt: new Date().toISOString()
    };
  }
}

// Singleton instance
const monitor = new SystemMonitor();

module.exports = monitor;
