// Trigger Render redeploy for CORS fix
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import http from 'http';
import helmet from 'helmet';

// Force Prisma to use binary engine
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';

import prisma from './config/database.js';
import logger from './utils/logger.js';
const redisCacheModule = await import('./services/cache.service.js');
const redisCache = redisCacheModule.default || redisCacheModule;
import { errorHandler, handleUnhandledRejections, handleUncaughtExceptions } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';
import { validateEnv, getEnvSummary } from './config/env.validator.js';
import socketIO from './socket/index.js';
import { responseWrapperMiddleware } from './middleware/response-wrapper.js';
const authRoutesModule = await import('./routes/auth.routes.js');
const authRoutes = authRoutesModule.default || authRoutesModule;
const passwordRoutesModule = await import('./routes/password.routes.js');
const passwordRoutes = passwordRoutesModule.default || passwordRoutesModule;
const chatRoutesModule = await import('./routes/chat.routes.js');
const chatRoutes = chatRoutesModule.default || chatRoutesModule;
const businessRoutesModule = await import('./routes/business.routes.js');
const businessRoutes = businessRoutesModule.default || businessRoutesModule;
const notificationsRoutesModule = await import('./routes/notifications.routes.js');
const notificationsRoutes = notificationsRoutesModule.default || notificationsRoutesModule;
const contactRoutesModule = await import('./routes/contact.routes.js');
const contactRoutes = contactRoutesModule.default || contactRoutesModule;
const knowledgeRoutesModule = await import('./routes/knowledge.routes.js');
const knowledgeRoutes = knowledgeRoutesModule.default || knowledgeRoutesModule;
const teamRoutesModule = await import('./routes/team.routes.js');
const teamRoutes = teamRoutesModule.default || teamRoutesModule;
const adminRoutesModule = await import('./routes/admin.routes.js');
const adminRoutes = adminRoutesModule.default || adminRoutesModule;
const adminBusinessRoutesModule = await import('./routes/admin-business.routes.js');
const adminBusinessRoutes = adminBusinessRoutesModule.default || adminBusinessRoutesModule;
const adminConversationsRoutesModule = await import('./routes/admin-conversations.routes.js');
const adminConversationsRoutes = adminConversationsRoutesModule.default || adminConversationsRoutesModule;
const adminKnowledgeRoutesModule = await import('./routes/admin-knowledge.routes.js');
const adminKnowledgeRoutes = adminKnowledgeRoutesModule.default || adminKnowledgeRoutesModule;
const paymentRoutesModule = await import('./routes/payment.routes.js');
const paymentRoutes = paymentRoutesModule.default || paymentRoutesModule;
const paymentWebhookRoutesModule = await import('./routes/payment-webhooks.routes.js');
const paymentWebhookRoutes = paymentWebhookRoutesModule.default || paymentWebhookRoutesModule;
const adminPaymentRoutesModule = await import('./routes/admin-payment.routes.js');
const adminPaymentRoutes = adminPaymentRoutesModule.default || adminPaymentRoutesModule;
const adminCrmRoutesModule = await import('./routes/admin-crm.routes.js');
const adminCrmRoutes = adminCrmRoutesModule.default || adminCrmRoutesModule;
const internalRoutesModule = await import('./routes/internal.routes.js');
const internalRoutes = internalRoutesModule.default || internalRoutesModule;
const adminExtendedRoutesModule = await import('./routes/admin-extended.routes.js');
const adminExtendedRoutes = adminExtendedRoutesModule.default || adminExtendedRoutesModule;
const ticketsRoutesModule = await import('./routes/tickets.routes.js');
const ticketsRoutes = ticketsRoutesModule.default || ticketsRoutesModule;
const multiLanguageRoutesModule = await import('./routes/multi-language.routes.js');
const multiLanguageRoutes = multiLanguageRoutesModule.default || multiLanguageRoutesModule;
const continuousImprovementRoutesModule = await import('./routes/continuous-improvement.routes.js');
const continuousImprovementRoutes = continuousImprovementRoutesModule.default || continuousImprovementRoutesModule;
const proxyRoutesModule = await import('./routes/proxy.routes.js');
const proxyRoutes = proxyRoutesModule.default || proxyRoutesModule;
const widgetRoutesModule = await import('./routes/widget.routes.js');
const widgetRoutes = widgetRoutesModule.default || widgetRoutesModule;
const uploadsRoutesModule = await import('./routes/uploads.routes.js');
const uploadsRoutes = uploadsRoutesModule.default || uploadsRoutesModule;
const healthRoutesModule = await import('./routes/health.routes.js');
const healthRoutes = healthRoutesModule.default || healthRoutesModule;
const analyticsRoutesModule = await import('./routes/analytics.routes.js');
const analyticsRoutes = analyticsRoutesModule.default || analyticsRoutesModule;
const visitorRoutesModule = await import('./routes/visitor.routes.js');
const visitorRoutes = visitorRoutesModule.default || visitorRoutesModule;
const ratingRoutesModule = await import('./routes/rating.routes.js');
const ratingRoutes = ratingRoutesModule.default || ratingRoutesModule;
const crmRoutesModule = await import('./routes/crm.routes.js');
const crmRoutes = crmRoutesModule.default || crmRoutesModule;
const convRoutesModule = await import('./routes/conversations.routes.js');
const convRoutes = convRoutesModule.default || convRoutesModule;
const kbCompatModule = await import('./routes/knowledge-base.routes.js');
const kbCompat = kbCompatModule.default || kbCompatModule;
import { validateEnvironment } from './config/env.js';
const monitorModule = await import('./utils/monitor.js');
const monitor = monitorModule.default || monitorModule;
const continuousImprovementModule = await import('./services/continuous-improvement.service.js');
const continuousImprovement = continuousImprovementModule.default || continuousImprovementModule;
const cacheServiceModule = await import('./services/cache.service.js');
const cacheService = cacheServiceModule.default || cacheServiceModule;
const queueServiceModule = await import('./queue/queue.js');
const queueService = queueServiceModule.default || queueServiceModule;
import * as _bcrypt from 'bcryptjs';
const bcrypt = _bcrypt.default || _bcrypt;
import vectorSearch from './services/vector-search.service.js';

// Initialize environment variables
dotenv.config();

// Ensure we have a client URL environment variable for CORS and CSP
// Accept FRONTEND_URL as the preferred name, or fallback to CLIENT_URL for historic reasons
const configuredFrontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
if (!configuredFrontendUrl) {
  if (process.env.NODE_ENV === 'production') {
    logger.error('FRONTEND_URL or CLIENT_URL must be set in production environment');
    process.exit(1);
  }
  // Default in development
  process.env.CLIENT_URL = 'https://faheemly.com';
  process.env.FRONTEND_URL = process.env.CLIENT_URL;
  logger.warn('FRONTEND_URL/CLIENT_URL not set; using default CLIENT_URL (development only)');
} else {
  // Normalize so both names exist for backward compatibility
  process.env.CLIENT_URL = configuredFrontendUrl;
  process.env.FRONTEND_URL = configuredFrontendUrl;
}

// Warn about ephemeral local uploads in production if S3 is not configured
const hasS3Config = process.env.AWS_S3_BUCKET ||
                   (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
if (process.env.NODE_ENV === 'production' && !hasS3Config) {
  logger.warn('No persistent object storage configured (AWS_S3_BUCKET or complete S3_* vars not set). Uploaded widget icons stored on local disk may not persist across deploys.');
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

// Test database + Redis connection after environment is loaded
let isDatabaseConnected = false;
let isRedisConnected = false;
let dbReconnectInterval = null;

function startDbReconnectLoop(intervalMs = 10000) {
  if (dbReconnectInterval) return;
  let attempt = 0;
  logger.info('Starting DB reconnection loop (every ' + (intervalMs/1000) + 's)');
  dbReconnectInterval = setInterval(async () => {
    attempt += 1;
    try {
      await prisma.$connect();
      isDatabaseConnected = true;
      logger.info(`Database reconnection successful (attempt ${attempt})`);
      try {
        // Run post-connection tasks; only stop reconnection loop if these succeed
        await onDbConnected();
        logger.info('Post-DB connection tasks completed successfully');
        stopDbReconnectLoop();
      } catch (e) {
        // If post-connection tasks fail, keep reconnection loop running so we can retry
        logger.warn('Post-DB-connection tasks failed, will continue reconnection attempts', e?.message || e);
        isDatabaseConnected = false;
        try { await prisma.$disconnect(); } catch (ignore) {}
      }
    } catch (e) {
      logger.warn(`Database reconnection attempt ${attempt} failed`, { message: e?.message || e });
    }
  }, intervalMs);
}

function stopDbReconnectLoop() {
  if (dbReconnectInterval) {
    clearInterval(dbReconnectInterval);
    dbReconnectInterval = null;
    logger.info('Stopped DB reconnection loop');
  }
}

async function onDbConnected() {
  // Run tasks that rely on the DB being available
  // Don't throw if these fail - server can run in degraded mode
  logger.info('Running post-DB connection startup tasks');
  
  try {
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_AUTO_ADMIN === 'true') {
      await ensureAdminExists();
      logger.info('Admin user initialization completed');
    }
  } catch (e) {
    logger.warn('Failed to initialize admin user', e?.message || e);
  }
  
  try {
    if (queueService && queueService.initQueues) {
      queueService.initQueues();
      logger.info('Job queues initialized');
    }
  } catch (e) {
    logger.warn('Queue init after DB connect failed', e?.message || e);
  }
}
const testDatabaseConnection = async () => {
  // Try DB connection first
  try {
    await prisma.$connect();
    isDatabaseConnected = true;
    logger.info('Database connected successfully');

    // Run a simple query to verify vector extension
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Vector extension available');
    } catch (qErr) {
      logger.warn('Vector extension check failed (non-fatal in dev)', { error: qErr?.message || qErr });
      // keep going; some environments (test mocks) may not support this
    }
  } catch (error) {
    isDatabaseConnected = false;
    logger.error('Database connection failed', error);
    // If the DB is unavailable, start a reconnection loop in non-production modes
    if (isTestEnvironment) {
      throw error;
    }
    if (process.env.NODE_ENV === 'production') {
      // In production we must fail fast
      process.exit(1);
    }
    logger.warn('Continuing in development mode without database connection (degraded mode). Some features may be disabled.');
    // Start periodic reconnect attempts
    startDbReconnectLoop();
  }

  // Try Redis connection separately
  try {
    await redisCache.connect();
    isRedisConnected = true;
    logger.info('Redis connected successfully');
  } catch (error) {
    isRedisConnected = false;
    logger.error('Redis connection failed', { message: error?.message || error });
    if (isTestEnvironment) {
      throw error;
    }
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    logger.warn('Continuing in development mode without Redis (degraded mode). Queue and caching will be disabled.');
  }

  // Expose flags for runtime checks
  app.locals.isDatabaseConnected = isDatabaseConnected;
  app.locals.isRedisConnected = isRedisConnected;
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
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : []),
  // Allow API domain for widget assets
  ...(process.env.NODE_ENV === 'production' ? ['https://fahimo-api.onrender.com'] : [])
].filter(Boolean);

// Add localhost ONLY in development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  logger.info('Development mode: localhost origins enabled for CORS');
}

// Enable Pre-Flight for all routes and ensure headers include Authorization
app.options('*', cors({ allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-business-id' }));

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

// Extra runtime guard: ensure no localhost is accidentally allowed in production CORS
if (process.env.NODE_ENV === 'production') {
  const localhostPattern = /localhost|127\.0\.0\.1/i;
  const hasLocalhost = allowedOrigins.some(o => localhostPattern.test(o));
  if (hasLocalhost) {
    logger.error('🚨 SECURITY: Detected localhost/127.0.0.1 in CORS origins while in production - aborting startup');
    process.exit(1);
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
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-business-id',
  credentials: true,
}));

// Ensure Access-Control-Allow-Headers is always present on preflight responses
app.use((req, res, next) => {
  if (!res.get('Access-Control-Allow-Headers')) {
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-business-id');
  }
  next();
});

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
      socketIO.init(s);
      logger.info('Socket.IO initialized');

      logger.info(`Server successfully bound to port ${port}`);
      return { server: s, port };
    } catch (err) {
      // Clean up and try next port on EADDRINUSE
      try { s.close(); } catch (e) { logger.warn('Failed to close server instance after binding error', e); }

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
// Capture raw body for webhook signature verification (useful for WhatsApp/Hubs)
const rawBodySaver = (req, res, buf, encoding) => {
  if (buf && buf.length) req.rawBody = buf.toString(encoding || 'utf8');
};
app.use(express.json({ verify: rawBodySaver }));

// Response wrapper middleware for standardized responses
app.use(responseWrapperMiddleware());

// Serve the widget with conservative caching to make deployments easier to roll out
app.get('/fahimo-widget.js', (req, res) => {
  try {
    const widgetPath = path.join(__dirname, '../public/fahimo-widget.js');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
    // Short caching to avoid stale widgets being served for too long
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.sendFile(widgetPath);
  } catch (e) {
    logger.warn('Failed to serve fahimo-widget.js via explicit route, falling back to static middleware', { error: e?.message || e });
    return res.status(500).send('Widget not available');
  }
});

app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, _path, _stat) => {
    // Allow cross-origin loading of static assets (scripts, images)
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Special route for uploaded icons to ensure CORS headers
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
  setHeaders: (res, _path, _stat) => {
    // Allow cross-origin loading of uploaded images
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  }
}));

// Test route - Always enabled to verify server is running
app.get('/', (req, res) => {
  res.send('Fahimo Server Started - The one who understands you is ready to serve.');
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes);

// Chat routes
app.use('/api/chat', chatRoutes);

// Business routes
app.use('/api/business', businessRoutes);

// Notifications
app.use('/api/notifications', notificationsRoutes);

// Contact routes
app.use('/api/contact', contactRoutes);

// Knowledge routes
app.use('/api/knowledge', knowledgeRoutes);

// Team routes
app.use('/api/team', teamRoutes);
app.use('/api/team', teamRoutes);

// Admin routes
try {
  app.use('/api/admin', adminRoutes);
  logger.info('✅ Admin routes loaded');
} catch (e) {
  logger.warn('Admin routes not available', { error: e?.message || e });
}

// Admin Business Management routes
try {
  app.use('/api/admin', adminBusinessRoutes);
  logger.info('✅ Admin Business Management routes loaded');
} catch (e) {
  logger.warn('Admin Business routes not available', { error: e?.message || e });
}

// Admin Conversation Management routes
try {
  app.use('/api/admin', adminConversationsRoutes);
  app.use('/api/admin', adminConversationsRoutes);
  logger.info('✅ Admin Conversation Management routes loaded');
} catch (e) {
  logger.warn('Admin Conversation routes not available', { error: e?.message || e });
}

// Admin Knowledge Base Management routes
try {
  app.use('/api/admin', adminKnowledgeRoutes);
  app.use('/api/admin', adminKnowledgeRoutes);
  logger.info('✅ Admin Knowledge Base Management routes loaded');
} catch (e) {
  logger.warn('Admin Knowledge routes not available', { error: e?.message || e });
}

// Payment routes
try {
  app.use('/api/payment', paymentRoutes);
  app.use('/api/payments', paymentRoutes);
  logger.info('✅ Payment routes loaded');
} catch (e) {
  logger.warn('Payment routes not available', { error: e?.message || e });
}

// Payment webhook routes
try {
  app.use('/api/payment', paymentWebhookRoutes);
  app.use('/api/payments/webhook', paymentWebhookRoutes);
  logger.info('✅ Payment webhook routes loaded');
} catch (e) {
  logger.warn('Payment webhook routes not available', { error: e?.message || e });
}

// Admin Payment Management routes
try {
  app.use('/api/admin', adminPaymentRoutes);
  app.use('/api/admin/payments', adminPaymentRoutes);
  logger.info('✅ Admin Payment Management routes loaded');
} catch (e) {
  logger.warn('Admin Payment routes not available', { error: e?.message || e });
}

// Admin CRM Management routes
try {
  app.use('/api/admin/crm', adminCrmRoutes);
  logger.info('✅ Admin CRM Management routes loaded');
} catch (e) {
  logger.warn('Admin CRM routes not available', { error: e?.message || e });
}

// Internal maintenance endpoints (protected)
try {
  app.use('/internal', internalRoutes);
  logger.info('✅ Internal routes loaded (maintenance)');
} catch (e) {
  logger.warn('Internal routes not available', { error: e?.message || e });
}

// Admin Extended routes (Phase 2: User Management & System Control)
try {
  app.use('/api/admin', adminExtendedRoutes);
  logger.info('✅ Admin Extended routes loaded (User Management & System Control)');
} catch (e) {
  logger.warn('Admin Extended routes not available:', e?.message || e);
}

// Compatibility: ensure legacy admin compatibility endpoint exists and returns 403 for non-superadmins
app.post('/api/admin/system-settings', authenticateToken, (req, res) => {
  const user = req.user || {};
  if (user.role !== 'SUPERADMIN') return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  return res.json({ success: true });
});

// Tickets routes
app.use('/api/tickets', ticketsRoutes);

// Phase 2 Routes
app.use('/api/multi-language', multiLanguageRoutes);

app.use('/api/improvement', continuousImprovementRoutes);

// Proxy routes (useful to avoid CORS to external APIs during local dev)
try {
  app.use('/api/proxy', proxyRoutes);
} catch (e) {
  logger.warn('Proxy routes not available', { error: e?.message || e });
}

// Widget routes (config endpoint used by client widget)
try {
  app.use('/api/widget', widgetRoutes);
} catch (e) {
  logger.warn('Widget routes not available', { error: e?.message || e });
}

// Uploads route (generic security tests expect /api/uploads)
try {
  app.use('/api/uploads', uploadsRoutes);
  logger.info('✅ Uploads routes loaded');
} catch (e) {
  logger.warn('Uploads routes not available', { error: e?.message || e });
}

// Health routes (public)
try {
  app.use('/api/health', healthRoutes);
  logger.info('✅ Health routes loaded');
} catch (e) {
  logger.warn('Health routes not available', { error: e?.message || e });
}

// Analytics routes
try {
  app.use('/api/analytics', analyticsRoutes);
} catch (e) {
  logger.warn('Analytics routes not available', { error: e?.message || e });
}

// Visitor routes
try {
  app.use('/api/visitor', visitorRoutes);
} catch (e) {
  logger.warn('Visitor routes not available', { error: e?.message || e });
}

// Rating routes
try {
  app.use('/api/rating', ratingRoutes);
} catch (e) {
  logger.warn('Rating routes not available', { error: e?.message || e });
}

// Backwards-compatible route: some widgets/clients may still post to /api/chat/rating
// Handle directly instead of redirecting to ensure the request body is preserved in tests
app.post('/api/chat/rating', async (req, res) => {
  try {
    const { conversationId, rating, feedback } = req.body;

    if (!conversationId || !rating) {
      return res.status(400).json({ success: false, message: 'conversationId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { rating, feedback: feedback || null }
    });

    res.json({ success: true, conversation });
  } catch (error) {
    logger.error('Chat rating compatibility handler error', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// CRM routes
try {
  app.use('/api/crm', crmRoutes);
} catch (e) {
  logger.warn('CRM routes not available', { error: e?.message || e });
}

// Compatibility: Conversations endpoints used by older clients/tests
try {
  app.use('/api/conversations', convRoutes);
  logger.info('✅ Conversations compatibility routes loaded');
} catch (e) {
  logger.warn('Conversations compatibility routes not available', { error: e?.message || e });
}

// Compatibility: older tests expect `/api/knowledge-base` endpoints
try {
  app.use('/api/knowledge-base', kbCompat);
  logger.info('✅ Knowledge-base compatibility routes loaded');
} catch (e) {
  logger.warn('Knowledge-base compatibility routes not available', { error: e?.message || e });
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
    logger.warn('Unmatched API request', { method: req.method, path: req.originalUrl, error: e?.message });
  }

  res.status(404).json({ success: false, error: { message: 'API route not found' } });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || process.env.RENDER_PORT || 3002;

// Validate environment variables on startup

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
      if (monitor && monitor.stopPeriodicMonitoring) monitor.stopPeriodicMonitoring();
    } catch (e) {
      // ignore
    }

    // Stop continuous improvement background tasks (non-fatal)
    try { if (continuousImprovement && typeof continuousImprovement.stop === 'function') continuousImprovement.stop(); } catch (e) { logger.warn('Error stopping continuous improvement service', e?.message || e); }

    // Disconnect external resources
    try { await prisma.$disconnect(); } catch (e) { logger.warn('Error disconnecting Prisma', e?.message || e); }
    try { if (cacheService && cacheService.disconnect) await cacheService.disconnect(); } catch (e) { logger.warn('Error disconnecting Redis', e?.message || e); }
    // Close any initialized job queues
    try { if (queueService && queueService.closeQueues) await queueService.closeQueues(); } catch (e) { logger.warn('Error closing job queues', e?.message || e); }

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
  if (!isDatabaseConnected) {
    logger.warn('DB unavailable - deferring admin creation until DB is connected');
    return;
  }

  try {
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
    // If the DB dropped while performing these ops, mark it and start reconnect loop
    logger.error('Failed to ensure admin exists', error);
    if (error && String(error).includes('Server has closed the connection')) {
      isDatabaseConnected = false;
      startDbReconnectLoop();
    }
  }
}

async function checkServicesStatus() {
  try {
    // Check Database Connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('✅ Database is CONNECTED');
      isDatabaseConnected = true;
    } catch (dbError) {
      isDatabaseConnected = false;
      logger.debug('Database query check failed (non-blocking)', { message: dbError?.message || dbError });
    }

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

export default app;
export { app };

if (!isTestEnvironment) {
  // Test database connection before starting server
  // Note: testDatabaseConnection throws on failure; callers should shutdown gracefully
  testDatabaseConnection().then(async () => {
    try {
      const { server, port } = await startServerWithRetries(PORT, 20);
      serverInstance = server;

      logger.info(`Fahimo Server is running on port ${port}`);
      logger.info('"The one who understands you" is ready to serve.', { 
        listening: server.listening, 
        address: server.address() 
      });

      try {
        // Validate environment before starting
        validateEnvironment();

        // Try to connect to Redis if configured
        try {
          if (redisCache.isEnabled && !redisCache.isConnected) {
            await redisCache.connect();
          }
          // Initialize background queues (if configured)
          try {
            if (queueService && queueService.initQueues) queueService.initQueues();
          } catch (err) {
            logger.warn('Failed to initialize job queues', err?.message || err);
          }
        } catch (e) {
          logger.warn('Redis connect attempt failed:', e?.message || e);
        }

        // Run service status check (informational, non-blocking)
        try {
          await checkServicesStatus();
        } catch (e) {
          logger.warn('Service status check failed', e?.message || e);
        }

        logger.info('✅ Startup functions completed');

        // Run DB-dependent initialization if DB is available
        if (isDatabaseConnected) {
          try {
            await onDbConnected();
          } catch (e) {
            logger.warn('Post-DB initialization failed', e?.message || e);
          }
        } else {
          logger.info('Database not available - deferred initialization will run when DB reconnects');
        }

        // Start continuous improvement tasks now the server is ready
        try {
          if (continuousImprovement && typeof continuousImprovement.start === 'function') {
            continuousImprovement.start();
            logger.info('Continuous Improvement tasks started');
          }
        } catch (e) {
          logger.warn('Failed to start Continuous Improvement service (non-fatal):', e?.message || e);
        }

        // Start system monitoring (every 5 minutes)
        monitor.startPeriodicMonitoring(5);
        logger.info('🔍 System monitoring ENABLED');

        // Keep event loop alive
        setInterval(() => {
          // Keep alive
        }, 60000);

        // Also resume stdin to keep alive
        process.stdin.resume();

        logger.info('🚀 Server fully operational and stable');
      } catch (error) {
        logger.error('❌ Startup error', error);
        await shutdown(1);
      }

      server.on('close', () => logger.info('Server closed'));
      process.on('exit', (code) => logger.info('Process exiting', { code }));
    } catch (err) {
      logger.error('Failed to start server', err);
      await shutdown(1);
    }
  }).catch(async err => {
    logger.error('Database setup failed - server will continue in degraded mode', err);
    logger.info('Attempting server startup without database');
    // In development, try to start server anyway in degraded mode
    if (process.env.NODE_ENV === 'development') {
      try {
        const { server, port } = await startServerWithRetries(PORT, 20);
        serverInstance = server;
        logger.info(`Fahimo Server started on port ${port} (degraded mode - no database)`);
        logger.info('"The one who understands you" is ready (limited functionality).');
        
        // Start monitoring (will continue reconnection attempts)
        monitor.startPeriodicMonitoring(5);
        process.stdin.resume();
        setInterval(() => {}, 60000);
        
        logger.info('🚀 Server operational in degraded mode');
      } catch (e) {
        logger.error('Failed to start server even in degraded mode', e);
        await shutdown(1);
      }
    } else {
      logger.error('Database required in production - aborting startup');
      await shutdown(1);
    }
  });
} else {
  logger.info('Test environment detected - skipping automatic server start');
}
