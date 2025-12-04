/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Health Monitoring Tests
 * ═══════════════════════════════════════════════════
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('System Health Monitoring', () => {
  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    test('should execute simple query', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as result`;
      expect(result[0].result).toBe(1);
    });

    test('should disconnect gracefully', async () => {
      await expect(prisma.$disconnect()).resolves.not.toThrow();
    });
  });

  describe('Environment Variables', () => {
    test('JWT_SECRET should be set and strong', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
      expect(process.env.JWT_SECRET).not.toBe('your-secret-key');
      expect(process.env.JWT_SECRET).not.toBe('fahimo_secret_key_2026_secure');
    });

    test('DATABASE_URL should be set', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).toContain('postgresql://');
    });

    test('GROQ_API_KEY should be set', () => {
      expect(process.env.GROQ_API_KEY).toBeDefined();
      expect(process.env.GROQ_API_KEY.startsWith('gsk_')).toBe(true);
    });
  });

  describe('AI Provider Status', () => {
    test('should have at least one AI provider configured', () => {
      const hasProvider = 
        process.env.DEEPSEEK_API_KEY ||
        process.env.GROQ_API_KEY ||
        process.env.CEREBRAS_API_KEY ||
        process.env.GEMINI_API_KEY;

      expect(hasProvider).toBeTruthy();
    });

    test('hybrid AI service should initialize', () => {
      const hybridAI = require('../../src/services/hybrid-ai.service');
      expect(hybridAI.generateResponse).toBeDefined();
      expect(hybridAI.getProviderStats).toBeDefined();
      expect(hybridAI.checkProvidersHealth).toBeDefined();
    });
  });

  describe('Critical Routes', () => {
    const requiredRoutes = [
      'auth.routes.js',
      'business.routes.js',
      'chat.routes.js',
      'knowledge.routes.js',
      'analytics.routes.js',
      'visitor.routes.js'
    ];

    test.each(requiredRoutes)('should have %s file', (route) => {
      const fs = require('fs');
      const path = require('path');
      const routePath = path.join(__dirname, '../../src/routes', route);
      expect(fs.existsSync(routePath)).toBe(true);
    });
  });

  describe('Middleware Integrity', () => {
    test('auth middleware should export required functions', () => {
      const auth = require('../../src/middleware/auth');
      expect(auth.authenticateToken).toBeDefined();
      expect(auth.requireRole).toBeDefined();
      expect(typeof auth.authenticateToken).toBe('function');
      expect(typeof auth.requireRole).toBe('function');
    });
  });

  describe('Memory Usage', () => {
    test('should track memory usage', () => {
      const used = process.memoryUsage();
      
      expect(used.heapUsed).toBeDefined();
      expect(used.heapTotal).toBeDefined();
      expect(used.rss).toBeDefined();
      
      // Log for monitoring (should be under 512MB for typical usage)
      console.log('Memory Usage:', {
        heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
        rss: `${Math.round(used.rss / 1024 / 1024)} MB`
      });
    });
  });

  describe('Uptime Tracking', () => {
    test('should track process uptime', () => {
      const uptime = process.uptime();
      expect(uptime).toBeGreaterThan(0);
      expect(typeof uptime).toBe('number');
    });
  });
});
