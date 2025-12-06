/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - System Monitor Unit Tests
 * ═══════════════════════════════════════════════════
 */

const monitor = require('../../src/utils/monitor');

// Mock dependencies
jest.mock('../../src/config/database');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock hybrid AI service
jest.mock('../../src/services/hybrid-ai.service');
const hybridAI = require('../../src/services/hybrid-ai.service');

describe('System Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset monitor state
    monitor.metrics = {
      uptime: 0,
      memory: {},
      database: { connected: false, latency: 0 },
      aiProviders: {},
      errors: []
    };
    monitor.alerts = [];
  });

  describe('getUptime', () => {
    test('should return formatted uptime', () => {
      const uptime = monitor.getUptime();

      expect(uptime).toHaveProperty('milliseconds');
      expect(uptime).toHaveProperty('formatted');
      expect(uptime).toHaveProperty('healthy');
      expect(uptime.healthy).toBe(true);
      expect(typeof uptime.milliseconds).toBe('number');
      expect(typeof uptime.formatted).toBe('string');
    });

    test('should calculate uptime correctly', () => {
      // Mock start time to be 1 hour ago
      const originalStartTime = monitor.startTime;
      monitor.startTime = Date.now() - (60 * 60 * 1000); // 1 hour ago

      const uptime = monitor.getUptime();

      expect(uptime.milliseconds).toBeGreaterThanOrEqual(60 * 60 * 1000);
      expect(uptime.formatted).toMatch(/\d+h \d+m \d+s/);

      // Restore original start time
      monitor.startTime = originalStartTime;
    });
  });

  describe('getMemoryUsage', () => {
    test('should return memory usage statistics', () => {
      const memory = monitor.getMemoryUsage();

      expect(memory).toHaveProperty('heapUsed');
      expect(memory).toHaveProperty('heapTotal');
      expect(memory).toHaveProperty('rss');
      expect(memory).toHaveProperty('percentage');
      expect(memory).toHaveProperty('healthy');

      expect(typeof memory.heapUsed).toBe('string');
      expect(typeof memory.heapTotal).toBe('string');
      expect(typeof memory.rss).toBe('string');
      expect(typeof memory.percentage).toBe('number');
      expect(typeof memory.healthy).toBe('boolean');

      expect(memory.heapUsed).toMatch(/\d+ MB/);
      expect(memory.heapTotal).toMatch(/\d+ MB/);
      expect(memory.rss).toMatch(/\d+ MB/);
    });

    test('should detect unhealthy memory usage', () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 500 * 1024 * 1024, // 500MB
        heapTotal: 600 * 1024 * 1024, // 600MB
        rss: 700 * 1024 * 1024
      });

      const memory = monitor.getMemoryUsage();

      expect(memory.healthy).toBe(false);
      expect(memory.percentage).toBeGreaterThan(80);

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('checkDatabaseHealth', () => {
    test('should return healthy database status', async () => {
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);

      const dbHealth = await monitor.checkDatabaseHealth();

      expect(dbHealth.connected).toBe(true);
      expect(dbHealth.healthy).toBe(true);
      expect(dbHealth.latency).toMatch(/\d+ms/);
      expect(prisma.$queryRaw).toHaveBeenCalledWith('SELECT 1');
    });

    test('should detect high latency', async () => {
      // Mock slow database response
      prisma.$queryRaw.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve([{ result: 1 }]), 1500); // 1.5 seconds
      }));

      const dbHealth = await monitor.checkDatabaseHealth();

      expect(dbHealth.connected).toBe(true);
      expect(dbHealth.healthy).toBe(false); // Latency > 1000ms
    });

    test('should handle database connection errors', async () => {
      const dbError = new Error('Connection refused');
      prisma.$queryRaw.mockRejectedValue(dbError);

      const dbHealth = await monitor.checkDatabaseHealth();

      expect(dbHealth.connected).toBe(false);
      expect(dbHealth.healthy).toBe(false);
      expect(dbHealth.error).toBe('Connection refused');
    });
  });

  describe('checkAIProvidersHealth', () => {
    test('should return AI providers health status', async () => {
      const mockStats = {
        groq: { available: true, latency: 500 },
        gemini: { available: true, latency: 800 }
      };
      const mockHealth = {
        totalAvailable: 2,
        totalChecked: 2,
        groq: true,
        gemini: true
      };

      hybridAI.getProviderStats.mockReturnValue(mockStats);
      hybridAI.checkProvidersHealth.mockReturnValue(mockHealth);

      const aiHealth = await monitor.checkAIProvidersHealth();

      expect(aiHealth.stats).toEqual(mockStats);
      expect(aiHealth.health).toEqual(mockHealth);
      expect(aiHealth.healthy).toBe(true);
    });

    test('should handle AI service errors', async () => {
      const aiError = new Error('AI service unavailable');
      hybridAI.getProviderStats.mockRejectedValue(aiError);

      const aiHealth = await monitor.checkAIProvidersHealth();

      expect(aiHealth.healthy).toBe(false);
      expect(aiHealth.error).toBe('AI service unavailable');
    });

    test('should detect when no AI providers are available', async () => {
      const mockHealth = {
        totalAvailable: 0,
        totalChecked: 2,
        groq: false,
        gemini: false
      };

      hybridAI.getProviderStats.mockReturnValue({});
      hybridAI.checkProvidersHealth.mockReturnValue(mockHealth);

      const aiHealth = await monitor.checkAIProvidersHealth();

      expect(aiHealth.healthy).toBe(false);
    });
  });

  describe('getHealthStatus', () => {
    test('should return complete health status', async () => {
      // Mock all dependencies
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
      hybridAI.getProviderStats.mockReturnValue({ groq: { available: true } });
      hybridAI.checkProvidersHealth.mockReturnValue({ totalAvailable: 1 });

      const status = await monitor.getHealthStatus();

      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('memory');
      expect(status).toHaveProperty('database');
      expect(status).toHaveProperty('aiProviders');
      expect(status).toHaveProperty('timestamp');

      expect(status.database.connected).toBe(true);
      expect(status.aiProviders.healthy).toBe(true);
    });

    test('should send alerts for critical issues', async () => {
      // Mock unhealthy states
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 500 * 1024 * 1024, // 500MB - unhealthy
        heapTotal: 600 * 1024 * 1024,
        rss: 700 * 1024 * 1024
      });

      prisma.$queryRaw.mockRejectedValue(new Error('DB down'));
      hybridAI.checkProvidersHealth.mockReturnValue({ totalAvailable: 0 });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await monitor.getHealthStatus();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERT')
      );

      // Restore
      process.memoryUsage = originalMemoryUsage;
      consoleSpy.mockRestore();
    });
  });

  describe('getBusinessMetrics', () => {
    test('should return business analytics', async () => {
      // Mock database responses
      prisma.business.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80)  // active
        .mockResolvedValueOnce(20); // trial

      prisma.user.count.mockResolvedValue(500);
      prisma.conversation.count.mockResolvedValue(2000);
      prisma.message.count
        .mockResolvedValueOnce(10000) // total
        .mockResolvedValueOnce(500);   // last 24h

      const metrics = await monitor.getBusinessMetrics();

      expect(metrics.businesses.total).toBe(100);
      expect(metrics.businesses.active).toBe(80);
      expect(metrics.businesses.trial).toBe(20);
      expect(metrics.users).toBe(500);
      expect(metrics.conversations).toBe(2000);
      expect(metrics.messages.total).toBe(10000);
      expect(metrics.messages.last24h).toBe(500);
    });

    test('should handle database errors gracefully', async () => {
      prisma.business.count.mockRejectedValue(new Error('DB error'));

      const metrics = await monitor.getBusinessMetrics();

      expect(metrics).toBeNull();
    });
  });

  describe('sendAlert', () => {
    test('should create and store alerts', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      monitor.sendAlert('TEST_ALERT', 'Test message');

      expect(monitor.alerts).toHaveLength(1);
      expect(monitor.alerts[0]).toMatchObject({
        type: 'TEST_ALERT',
        message: 'Test message',
        severity: 'INFO'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ALERT')
      );

      consoleSpy.mockRestore();
    });

    test('should determine correct alert severity', () => {
      expect(monitor.getAlertSeverity('HIGH_MEMORY')).toBe('WARNING');
      expect(monitor.getAlertSeverity('DB_CONNECTION')).toBe('CRITICAL');
      expect(monitor.getAlertSeverity('AI_UNAVAILABLE')).toBe('CRITICAL');
      expect(monitor.getAlertSeverity('UNKNOWN_TYPE')).toBe('INFO');
    });

    test('should limit stored alerts to 100', () => {
      // Add 101 alerts
      for (let i = 0; i < 101; i++) {
        monitor.sendAlert('TEST', `Alert ${i}`);
      }

      expect(monitor.alerts).toHaveLength(100);
      expect(monitor.alerts[0].message).toBe('Alert 100'); // Most recent first
    });
  });

  describe('getRecentAlerts', () => {
    test('should return recent alerts', () => {
      monitor.sendAlert('ALERT1', 'Message 1');
      monitor.sendAlert('ALERT2', 'Message 2');
      monitor.sendAlert('ALERT3', 'Message 3');

      const recent = monitor.getRecentAlerts(2);

      expect(recent).toHaveLength(2);
      expect(recent[0].type).toBe('ALERT3'); // Most recent first
      expect(recent[1].type).toBe('ALERT2');
    });

    test('should return empty array when no alerts', () => {
      const recent = monitor.getRecentAlerts();

      expect(recent).toEqual([]);
    });
  });

  describe('clearOldAlerts', () => {
    test('should remove old alerts', () => {
      // Add alerts with different timestamps
      monitor.alerts = [
        { timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() }, // 25 hours ago
        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }   // 1 hour ago
      ];

      monitor.clearOldAlerts(24); // Clear older than 24 hours

      expect(monitor.alerts).toHaveLength(1);
      expect(monitor.alerts[0].timestamp).toBeDefined();
    });
  });

  describe('getSystemReport', () => {
    test('should return comprehensive system report', async () => {
      // Mock all dependencies
      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
      prisma.business.count.mockResolvedValue(10);
      prisma.user.count.mockResolvedValue(50);
      hybridAI.getProviderStats.mockReturnValue({});
      hybridAI.checkProvidersHealth.mockReturnValue({ totalAvailable: 1 });

      const report = await monitor.getSystemReport();

      expect(report).toHaveProperty('system');
      expect(report).toHaveProperty('business');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('generatedAt');

      expect(typeof report.generatedAt).toBe('string');
      expect(Array.isArray(report.alerts)).toBe(true);
    });
  });

  describe('logHealthStatus', () => {
    test('should log formatted health status', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      prisma.$queryRaw.mockResolvedValue([{ result: 1 }]);
      hybridAI.getProviderStats.mockReturnValue({});
      hybridAI.checkProvidersHealth.mockReturnValue({ totalAvailable: 1 });

      const status = await monitor.logHealthStatus();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('FAHEEMLY SYSTEM HEALTH')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Uptime:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Memory:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI Providers:')
      );

      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('memory');
      expect(status).toHaveProperty('database');
      expect(status).toHaveProperty('aiProviders');

      consoleSpy.mockRestore();
    });
  });

  describe('startPeriodicMonitoring', () => {
    test('should start periodic health checks', () => {
      jest.useFakeTimers();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitor.startPeriodicMonitoring(1); // Every 1 minute

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Starting health monitoring')
      );

      // Fast-forward 1 minute
      jest.advanceTimersByTime(60 * 1000);

      // Should have called logHealthStatus again
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
      consoleSpy.mockRestore();
    });
  });
});