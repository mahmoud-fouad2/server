/*
 * 🛡️ CORE SYSTEM FILE - DO NOT MODIFY WITHOUT EXPERT REVIEW 🛡️
 * This file controls the main server entry point, middleware order, and global error handling.
 * Any changes here can take down the entire production API.
 */
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import hpp from 'hpp';
import { SocketService } from './socket/index.js';
import logger from './utils/logger.js';
import cacheService from './services/cache.service.js';
import queueService from './services/queue.service.js';
import { 
  errorHandler, 
  notFound, 
  handleUnhandledRejections, 
  handleUncaughtExceptions 
} from './middleware/errorHandler.js';
import { globalLimiter, apiLimiter } from './middleware/rateLimiter.js';
import { sanitizeInput } from './middleware/sanitization.js';

// Import routes
import widgetRoutes from './routes/widget.routes.js';
import chatRoutes from './routes/chat.routes.js';
import authRoutes from './routes/auth.routes.js';
import businessRoutes from './routes/business.routes.js';
import crmRoutes from './routes/crm.routes.js';
import knowledgeRoutes from './routes/knowledge.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import aiRoutes from './routes/ai.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import teamRoutes from './routes/team.routes.js';
import adminRoutes from './routes/admin.routes.js';
import integrationRoutes from './routes/integration.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import visitorRoutes from './routes/visitor.routes.js';
import continuousImprovementRoutes from './routes/continuous-improvement.routes.js';
import customAIModelRoutes from './routes/custom-ai-model.routes.js';
import apiKeyRoutes from './routes/api-key.routes.js';

dotenv.config();

// Setup global error handlers
handleUnhandledRejections();
handleUncaughtExceptions();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.IO
new SocketService(server);

// Initialize services
logger.info('🚀 Starting Fahimo API V2...');
logger.info(`✅ Cache service: ${cacheService.isConnected() ? 'Connected' : 'Using LRU only'}`);
logger.info('✅ Queue service initialized');

// Security Middleware
app.use(helmet());
app.use(hpp()); // Protect against HTTP Parameter Pollution
app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true,
}));

// Rate limiting
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitization
app.use(sanitizeInput);

// Static files
app.use('/uploads', express.static('uploads'));

// Serve widget script at root /fahimo-widget.js for backwards compatibility
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/fahimo-widget.js', (req, res) => {
  const widgetPath = path.join(__dirname, '../../widget/dist/fahimo-loader.iife.js');
  res.set('Content-Type', 'application/javascript');
  res.set('Cache-Control', 'public, max-age=3600');
  res.sendFile(widgetPath);
});

// API Routes
app.use('/api/widget', widgetRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/business', apiLimiter, businessRoutes);
app.use('/api/crm', apiLimiter, crmRoutes);
app.use('/api/knowledge', apiLimiter, knowledgeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', apiLimiter, aiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/improvement', apiLimiter, continuousImprovementRoutes);
app.use('/api/custom-ai-models', apiLimiter, customAIModelRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      cache: cacheService.isConnected(),
      queue: !!queueService.getQueue('default'),
    },
  });
});

// Root Route (Fixes 404 errors in logs)
app.get('/', (req, res) => {
  res.json({
    message: 'Fahimo API V2 is running',
    docs: '/api-docs', // If you have docs
    health: '/health'
  });
});

// 404 Handler
app.use(notFound);

// Error Handler
app.use(errorHandler);

// Start Server
server.listen(PORT, () => {
  logger.info(`✅ Server V2 running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 CORS enabled for: ${process.env.CORS_ORIGINS || '*'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  await queueService.closeAll();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
