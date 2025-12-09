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
const redisCache = require('./services/cache.service');
const { errorHandler, handleUnhandledRejections, handleUncaughtExceptions } = require('./middleware/errorHandler');
const { validateEnv, getEnvSummary } = require('./config/env.validator');

// Initialize environment variables
dotenv.config();

// Set default CLIENT_URL if not provided (before validation)
if (!process.env.CLIENT_URL) {
  process.env.CLIENT_URL = 'https://faheemly.com';
}

const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

// Validate environment configuration
if (!isTestEnvironment) {
  const validation = validateEnv();
  if (!validation.success) {
    logger.error('Environment validation failed - check configuration');
    // In production, validator will exit(1) automatically
  }
  
  // Log environment summary (no secrets)
  const envSummary = getEnvSummary();
  logger.info('Environment configured', envSummary);
}

// Test database connection after environment is loaded
const testDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Run a simple query to verify vector extension
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Vector extension available');

    // Connect to Redis
    await redisCache.connect();

  } catch (error) {
    logger.error('Database connection failed', error);
    if (isTestEnvironment) {
      throw error;
    }
    process.exit(1);
  }
};
const app = express();

// Trust Proxy for Render (Required for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // ✅ Allow widget/images to be loaded cross-origin
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'",
          "data:",
          "https:",
          // ✅ Allow localhost in development
          ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
            ? ["http://localhost:*", "http://127.0.0.1:*"] 
            : []
          )
        ],
        "connect-src": [
          "'self'", 
          "https://fahimo-api.onrender.com", 
          process.env.CLIENT_URL,
          ...(process.env.NODE_ENV === 'development' ? ["http://localhost:*"] : [])
        ]
      }
    }
  })
);

// Production-safe CORS: Use FRONTEND_URL and CORS_ORIGINS from environment
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://faheemly.com',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : [])
].filter(Boolean);

// Add localhost ONLY in development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  logger.info('Development mode: localhost origins enabled for CORS');
}

// Enable Pre-Flight for all routes
app.options('*', cors());

// SECURITY: Fail-safe CORS configuration
// In production, we MUST have explicit origins configured
if (allowedOrigins.length === 0) {
  if (process.env.NODE_ENV === 'production') {
    logger.error('🚨 SECURITY: CORS_ORIGINS not configured in production!');
    logger.error('Set FRONTEND_URL and/or CORS_ORIGINS environment variables');
    logger.error('Server cannot start without CORS configuration in production');
    process.exit(1);
  } else {
    // Development only: Allow localhost
    logger.warn('⚠️  CORS_ORIGINS not set. Development mode: allowing localhost only');
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002');
  }
}

// Configure CORS with whitelist
app.use(cors({
  origin: function(origin, cb) {
    // Allow non-browser requests (curl, server-to-server, mobile apps)
    if (!origin) return cb(null, true);
    
    // Handle wildcard * (NOT recommended for production)
    if (allowedOrigins.includes('*')) {
      logger.warn('⚠️  CORS wildcard (*) is enabled - not recommended for production');
      return cb(null, true);
    }
    
    // Check if origin is whitelisted
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    
    // Reject and log blocked origin
    logger.error(`🚫 CORS blocked unauthorized origin: ${origin}`);
    const error = new Error('CORS policy: Origin not allowed');
    error.statusCode = 403;
    cb(error);
  },
  credentials: true,
}));

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
        logger.error('Server runtime error', err);
      });

      // Initialize Socket.IO
      const socketIO = require('./socket');
      socketIO.init(s);
      logger.info('Socket.IO initialized');

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
app.use(express.static(path.join(__dirname, '../public')));

// Test route - Always enabled to verify server is running
app.get('/', (req, res) => {
  res.send('Fahimo Server Started - The one who understands you is ready to serve.');
});

// Auth routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Chat routes
const chatRoutes = require('./routes/chat.routes');
app.use('/api/chat', chatRoutes);

// Business routes
const businessRoutes = require('./routes/business.routes');
app.use('/api/business', businessRoutes);

// Knowledge routes
const knowledgeRoutes = require('./routes/knowledge.routes');
app.use('/api/knowledge', knowledgeRoutes);

// Team routes
const teamRoutes = require('./routes/team.routes');
app.use('/api/team', teamRoutes);

// Admin routes
try {
  const adminRoutes = require('./routes/admin.routes');
  app.use('/api/admin', adminRoutes);
} catch (e) {
  console.warn('Admin routes not available:', e?.message || e);
}

// Admin Extended routes (Phase 2: User Management & System Control)
// TEMPORARILY DISABLED - Requires database migration
// try {
//   const adminExtendedRoutes = require('./routes/admin-extended.routes');
//   app.use('/api/admin', adminExtendedRoutes);
//   logger.info('✅ Admin Extended routes loaded (User Management & System Control)');
// } catch (e) {
//   logger.warn('Admin Extended routes not available:', e?.message || e);
// }

// Tickets routes
const ticketsRoutes = require('./routes/tickets.routes');
app.use('/api/tickets', ticketsRoutes);

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

// Widget routes (config endpoint used by client widget)
try {
  const widgetRoutes = require('./routes/widget.routes');
  app.use('/api/widget', widgetRoutes);
} catch (e) {
  console.warn('Widget routes not available:', e?.message || e);
}

// Analytics routes
try {
  const analyticsRoutes = require('./routes/analytics.routes');
  app.use('/api/analytics', analyticsRoutes);
} catch (e) {
  console.warn('Analytics routes not available:', e?.message || e);
}

// Visitor routes
try {
  const visitorRoutes = require('./routes/visitor.routes');
  app.use('/api/visitor', visitorRoutes);
} catch (e) {
  console.warn('Visitor routes not available:', e?.message || e);
}

// Fallback widget endpoints if widget routes failed to load
try {
  // noop - placeholder to preserve similarity; the real require happened above
} catch (e) {}

// If the widgetRoutes require failed earlier, ensure the frontend still gets JSON
// instead of an HTML 404 page (which causes "Unexpected token '<'" on the client).
if (!app._router || !app._router.stack.some(layer => layer.route && layer.route.path && layer.route.path.startsWith && layer.route.path.startsWith('/api/widget'))) {
  const defaultWidgetConfig = {
    name: 'Demo Business',
    widgetConfig: {
      welcomeMessage: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
      primaryColor: "#003366",
      personality: "friendly",
      showBranding: true,
      avatar: "robot"
    }
  };

  app.get('/api/widget/config/:businessId', (req, res) => {
    res.json(defaultWidgetConfig);
  });

  app.post('/api/widget/config', (req, res) => {
    res.status(503).json({ error: 'Widget service unavailable' });
  });

  app.post('/api/widget/upload-icon', (req, res) => {
    res.status(503).json({ error: 'Widget service unavailable' });
  });
}

// Health endpoint (JSON) to let frontends assert health without parsing HTML
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Root endpoint - Friendly message instead of 404
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Fahimo API v1', 
    status: 'running', 
    documentation: 'https://faheemly.com/docs/api' 
  });
});

// If any /api/* route was not matched above, return JSON 404 instead of an HTML page.
app.use('/api', (req, res) => {
  // Log the unmatched API request to help diagnose 404/403 issues on the host
  try {
    logger.warn('Unmatched API request', { method: req.method, path: req.originalUrl, ip: req.ip });
  } catch (e) {
    console.warn('Unmatched API request', req.method, req.originalUrl);
  }

  res.status(404).json({ success: false, error: { message: 'API route not found' } });
});

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
    try { const cacheService = require('./services/cache.service'); if (cacheService && cacheService.disconnect) await cacheService.disconnect(); } catch (e) { logger.warn('Error disconnecting Redis', e?.message || e); }

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

    const redisCache = require('./services/cache.service');
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
    try {
      const isPgVector = await vectorSearch.isPgVectorAvailable();
      if (isPgVector) {
        logger.info('✅ pgvector extension is INSTALLED and READY');
      } else {
        logger.info('ℹ️  pgvector extension not available - using keyword search fallback');
      }
    } catch (pgError) {
      logger.info('ℹ️  pgvector check skipped (permissions may be restricted) - will auto-detect during search');
    }

  } catch (error) {
    logger.error('Failed to check services status', error);
  }
}

module.exports = app;

if (!isTestEnvironment) {
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
          const redisCache = require('./services/cache.service');
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
} else {
  logger.info('Test environment detected - skipping automatic server start');
}
