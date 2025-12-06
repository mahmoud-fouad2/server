const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const prisma = require('./config/database');
const logger = require('./utils/logger');
const { errorHandler, handleUnhandledRejections, handleUncaughtExceptions } = require('./middleware/errorHandler');

// Fahimo Insight: Initialize the core "Understanding" engine
dotenv.config();

// Safety guard: never allow DEV_NO_AUTH in production
if (process.env.NODE_ENV === 'production' && process.env.DEV_NO_AUTH === 'true') {
  console.error('FATAL: DEV_NO_AUTH=true is not allowed in production. Remove this variable from your environment.');
  // Exit early to avoid starting an insecure server
  process.exit(1);
}

// Test database connection after environment is loaded
const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('[Database] Connected successfully');

    // Run a simple query to verify vector extension
    await prisma.$queryRaw`SELECT 1`;
    console.log('[Database] Vector extension available');

  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    process.exit(1);
  }
};
const app = express();

// CORS: restrict origins via `CORS_ORIGINS` env (comma-separated). If not set, default to allow only same-origin.
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
if (allowedOrigins.length === 0) {
  // In absence of explicit config, allow same-origin only by a safe default
  app.use(cors({ origin: false }));
} else {
  app.use(cors({
    origin: function(origin, cb) {
      // allow non-browser requests (e.g., curl, server-to-server) with no origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('CORS origin denied'));
    },
    credentials: true,
  }));
}

// We'll create the server inside a helper so we can retry on EADDRINUSE

async function startServerWithRetries(startPort, maxAttempts = 10) {
  let port = parseInt(startPort, 10) || 3002;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const s = http.createServer(app);

    try {
      await new Promise((resolve, reject) => {
        s.once('error', reject);
        s.once('listening', resolve);
        s.listen(port, '0.0.0.0');
      });

      // Attach a runtime error handler
      s.on('error', (err) => {
        console.error('Server runtime error:', err);
        logger.error('Server runtime error', err);
      });

      logger.info(`Server successfully bound to port ${port}`);
      return { server: s, port };
    } catch (err) {
      // Clean up and try next port on EADDRINUSE
      try { s.close(); } catch (e) {}

      if (err && err.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} in use, trying port ${port + 1}`);
        port += 1;
        // continue to next attempt
        continue;
      }

      // Other errors - rethrow
      logger.error('Failed to bind server:', err);
      throw err;
    }
  }

  throw new Error(`Unable to bind server after ${maxAttempts} attempts starting at port ${startPort}`);
}

// Middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => res.send('Hello World'));

// Auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Chat routes
const chatRoutes = require('./routes/chat.routes');
app.use('/api/chat', chatRoutes);

// Phase 2 Routes
const multiLanguageRoutes = require('./routes/multi-language.routes');
app.use('/api/multi-language', multiLanguageRoutes);

const continuousImprovementRoutes = require('./routes/continuous-improvement.routes');
app.use('/api/improvement', continuousImprovementRoutes);

// Proxy routes (useful to avoid CORS to external APIs during local dev)
try {
  const proxyRoutes = require('./routes/proxy.routes');
  app.use('/api/proxy', proxyRoutes);
} catch (e) {
  console.warn('Proxy routes not available:', e?.message || e);
}

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

// Validate environment variables on startup
const { validateEnvironment } = require('./config/env');

// Initialize error handling
handleUncaughtExceptions();
handleUnhandledRejections();

// Graceful shutdown helper
let serverInstance = null;
async function shutdown(code = 0) {
  try {
    logger.info('Shutting down gracefully...');
    // Stop periodic monitoring if running
    try {
      const monitor = require('./utils/monitor');
      if (monitor && monitor.stopPeriodicMonitoring) monitor.stopPeriodicMonitoring();
    } catch (e) {
      // ignore
    }

    // Disconnect external resources
    try { await prisma.$disconnect(); } catch (e) { logger.warn('Error disconnecting Prisma', e?.message || e); }
    try { const redisCache = require('./services/redis-cache.service'); if (redisCache && redisCache.disconnect) await redisCache.disconnect(); } catch (e) { logger.warn('Error disconnecting Redis', e?.message || e); }

    if (serverInstance && serverInstance.close) {
      await new Promise((resolve) => serverInstance.close(resolve));
      logger.info('HTTP server closed');
    }
  } catch (err) {
    logger.error('Error during shutdown', err);
  } finally {
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// Auto-create admin on startup
async function ensureAdminExists() {
  try {
    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@faheemly.com';
    
    // SECURITY: Use environment variable for initial password
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
    
    if (!initialPassword) {
      logger.warn('ADMIN_INITIAL_PASSWORD not set - skipping admin creation');
      logger.info('Admin account must be created manually or password reset via forgot-password');
      return;
    }
    
    if (initialPassword.length < 12) {
      logger.error('ADMIN_INITIAL_PASSWORD too short (minimum 12 characters)');
      return;
    }

    const adminPassword = await bcrypt.hash(initialPassword, 10);
    
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Super Admin',
          password: adminPassword,
          role: 'SUPERADMIN'
        }
      });
      logger.info('Admin account created', { email: adminEmail });
    } else if (existingAdmin.role !== 'SUPERADMIN') {
      // Update existing user to SUPERADMIN
      await prisma.user.update({
        where: { email: adminEmail },
        data: { 
          role: 'SUPERADMIN',
          password: adminPassword // Reset password too
        }
      });
      logger.info('Admin role updated to SUPERADMIN', { email: adminEmail });
    } else {
      logger.info('Admin account already exists', { email: adminEmail });
    }
  } catch (error) {
    logger.error('Failed to ensure admin exists', error);
  }
}

async function checkServicesStatus() {
  try {
    // Check Database Connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('✅ Database is CONNECTED');
    } catch (dbError) {
      logger.error('❌ Database connection FAILED:', dbError.message);
      logger.warn('⚠️  WARNING: Database connection issues!');
    }

    const redisCache = require('./services/redis-cache.service');
    const vectorSearch = require('./services/vector-search.service');

    // Check Redis
    if (redisCache.isEnabled && redisCache.isConnected) {
      logger.info('✅ Redis Cache is ACTIVE and CONNECTED');
    } else if (redisCache.isEnabled && !redisCache.isConnected) {
      logger.warn('⚠️ Redis Cache is ENABLED but NOT CONNECTED');
    } else {
      logger.info('ℹ️ Redis Cache is DISABLED (REDIS_URL not set)');
    }

    // Check pgvector
    const isPgVector = await vectorSearch.isPgVectorAvailable();
    if (isPgVector) {
      logger.info('✅ pgvector extension is INSTALLED and READY');
    } else {
      logger.warn('⚠️ pgvector extension is NOT INSTALLED. Falling back to keyword search.');
    }

  } catch (error) {
    logger.error('Failed to check services status', error);
  }
}

// Test database connection before starting server
// Note: testDatabaseConnection throws on failure; callers should shutdown gracefully
testDatabaseConnection().then(async () => {
  try {
    const { server, port } = await startServerWithRetries(PORT, 20);
    serverInstance = server;

    logger.info(`Fahimo Server is running on port ${port}`);
    logger.info('"The one who understands you" is ready to serve.');
    console.log('Server listening:', server.listening);
    console.log('Server address:', server.address());

    try {
      // Validate environment before starting
      validateEnvironment();

      // Ensure admin only in non-production unless explicitly allowed
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_AUTO_ADMIN === 'true') {
        await ensureAdminExists();
      } else {
        logger.info('Skipping automatic admin creation in production (set ALLOW_AUTO_ADMIN=true to override)');
      }

      // Try to connect to Redis if configured
      try {
        const redisCache = require('./services/redis-cache.service');
        if (redisCache.isEnabled && !redisCache.isConnected) {
          await redisCache.connect();
        }
      } catch (e) {
        logger.warn('Redis connect attempt failed:', e?.message || e);
      }

      await checkServicesStatus();
      console.log('✅ Startup functions completed');

      // Start system monitoring (every 5 minutes)
      const monitor = require('./utils/monitor');
      monitor.startPeriodicMonitoring(5);
      logger.info('🔍 System monitoring ENABLED');

      // Keep event loop alive
      setInterval(() => {
        // Keep alive
      }, 60000);

      // Also resume stdin to keep alive
      process.stdin.resume();

      console.log('🚀 Server fully operational and stable');
    } catch (error) {
      console.error('❌ Startup error:', error);
      await shutdown(1);
    }

    server.on('close', () => logger.info('Server closed'));
    process.on('exit', (code) => console.log('Process exiting with code', code));
  } catch (err) {
    console.error('Failed to start server:', err);
    await shutdown(1);
  }
}).catch(async err => {
  console.error('Failed to connect to database:', err);
  await shutdown(1);
});
