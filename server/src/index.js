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

// Fahimo Insight: Initialize the core "Understanding" engine
dotenv.config();
const app = express();

// Trust proxy for Render deployment (enables correct IP detection behind proxy)
app.set('trust proxy', 1);

// HTTPS Enforcement (Production only)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

const server = http.createServer(app);

const authRoutes = require('./routes/auth.routes');
const botRoutes = require('./routes/bots');
const whatsappRoutes = require('./routes/whatsapp');
const knowledgeRoutes = require('./routes/knowledge.routes');
const widgetRoutes = require('./routes/widget.routes');
const businessRoutes = require('./routes/business.routes');
const chatRoutes = require('./routes/chat.routes');
const ticketRoutes = require('./routes/tickets.routes');
const contactRoutes = require('./routes/contact.routes');
const passwordRoutes = require('./routes/password.routes');
const teamRoutes = require('./routes/team.routes');
const adminRoutes = require('./routes/admin.routes');
const telegramRoutes = require('./routes/telegram.routes');
const twilioRoutes = require('./routes/twilio.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const aiRoutes = require('./routes/ai.routes');
const permissionsRoutes = require('./middleware/permissions');
const visitorRoutes = require('./routes/visitor.routes');
const ratingRoutes = require('./routes/rating.routes');
const healthRoutes = require('./routes/health.routes');

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to avoid breaking widget embedding
  crossOriginEmbedderPolicy: false
}));
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate Limiting - General API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Rate Limiting - Authentication
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour per IP
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Determine allowed origins
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://faheemly.com', 
      'https://www.faheemly.com',
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : [])
    ]
  : ['http://localhost:3000', 'http://localhost:3001'];

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Add size limit for security

// Serve server public folder (API static assets) with caching
app.use(express.static('public', { 
  maxAge: '1d', // Cache for 1 day
  etag: true 
}));

// Serve the statically exported Next.js client (output directory `client/out`).
const clientOut = path.join(__dirname, '..', '..', 'client', 'out');
app.use('/chat1', express.static(clientOut, { 
  index: 'index.html',
  maxAge: '1d', // Cache for 1 day
  etag: true
}));
app.use('/', express.static(clientOut, { 
  index: 'index.html',
  maxAge: '1d', // Cache for 1 day
  etag: true
}));

// Socket.io for real-time widget chat
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Fahimo Insight: Real-time connection for the "Magic" widget
const initializeSocket = require('./socket/socketHandler');
initializeSocket(io);

// Basic Routes
app.get('/', (req, res) => {
  res.send('Fahimo API is running. The AI that understands you.');
});

// Health Check Endpoint (using new monitoring system)
app.use('/api/health', healthRoutes);

// Apply rate limiters
app.use('/api/auth', authLimiter); // Strict limiter for auth routes
app.use('/api', apiLimiter); // General limiter for all other API routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes); // Password reset routes
app.use('/api/bots', botRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes); // Hybrid AI monitoring
app.use('/api/permissions', permissionsRoutes);
app.use('/api/visitor', visitorRoutes); // Visitor tracking & analytics
app.use('/api/rating', ratingRoutes); // Rating system

const PORT = process.env.PORT || 3001;

// CRITICAL: Validate required environment variables on startup
function validateEnvironment() {
  const required = ['JWT_SECRET', 'DATABASE_URL', 'GROQ_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('FATAL: Missing required environment variables', null, { missing });
    logger.error('Please set them in your .env file');
    process.exit(1);
  }

  if (process.env.JWT_SECRET === 'your-secret-key' || process.env.JWT_SECRET.length < 32) {
    logger.error('FATAL: JWT_SECRET is weak or using default value!');
    logger.error('Generate a strong secret: openssl rand -base64 32');
    process.exit(1);
  }

  // Note: ADMIN_INITIAL_PASSWORD should be set on Render/hosting platform, not in .env file
  // This is for security - password shouldn't be committed to git

  logger.info('Environment validation passed');
}

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION - Server will exit', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION - Server will exit', reason instanceof Error ? reason : new Error(String(reason)));
  process.exit(1);
});

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

server.listen(PORT, async () => {
  logger.info(`Fahimo Server is running on port ${PORT}`);
  logger.info('"The one who understands you" is ready to serve.');
  
  // Validate environment before starting
  validateEnvironment();
  
  await ensureAdminExists();
  await checkServicesStatus();

  // Start system monitoring (every 5 minutes)
  const monitor = require('./utils/monitor');
  monitor.startPeriodicMonitoring(5);
  logger.info('🔍 System monitoring initialized (5-minute intervals)');
});
