const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const prisma = require('./config/database');
const logger = require('./utils/logger');

// Fahimo Insight: Initialize the core "Understanding" engine
dotenv.config();
const app = express();
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
const demoRoutes = require('./routes/demo.routes');
const passwordRoutes = require('./routes/password.routes');

// Middleware
app.use(cors());
app.use(express.json());

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
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://faheemly.com', 'https://www.faheemly.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Fahimo Insight: Real-time connection for the "Magic" widget
io.on('connection', (socket) => {
  logger.debug('Widget connection established', { socketId: socket.id });

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { businessId, content } = data;
      console.log('Message received:', data);

      if (!businessId || !content) {
        socket.emit('receive_message', {
          role: 'assistant',
          content: 'خطأ: الرسالة أو معرف العمل مفقود',
          timestamp: new Date()
        });
        return;
      }

      // Check Subscription Limits
      const business = await prisma.business.findUnique({ where: { id: businessId } });
      
      if (!business) {
        socket.emit('receive_message', { role: 'assistant', content: 'خطأ: حساب العمل غير موجود.' });
        return;
      }

      // Check Trial Expiry
      if (business.planType === 'TRIAL' && business.trialEndsAt && new Date() > new Date(business.trialEndsAt)) {
        socket.emit('receive_message', { 
          role: 'assistant', 
          content: 'عذراً، انتهت الفترة التجريبية. يرجى ترقية الباقة للمتابعة.' 
        });
        return;
      }

      // Check Message Quota
      if (business.messagesUsed >= business.messageQuota) {
        socket.emit('receive_message', { 
          role: 'assistant', 
          content: 'عذراً، لقد استهلكت رصيد الرسائل المتاح لهذا الشهر. يرجى الترقية.' 
        });
        return;
      }

      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { 
          businessId,
          channel: 'WIDGET',
          externalId: socket.id // Use socket ID as external ID
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            businessId,
            channel: 'WIDGET',
            externalId: socket.id
          }
        });
      }

      // Save User Message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: content
        }
      });

      // Get Conversation History (last 10 messages)
      const history = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Generate AI Response using aiService
      const aiService = require('./services/aiService');
      const aiResult = await aiService.generateResponse(
        content, 
        businessId, 
        history.reverse()
      );

      // Save AI Message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: aiResult.response,
          tokensUsed: aiResult.tokensUsed,
          wasFromCache: aiResult.fromCache,
          aiModel: aiResult.model || 'groq'
        }
      });

      // Update business message count
      await prisma.business.update({
        where: { id: businessId },
        data: {
          messagesUsed: {
            increment: 1
          }
        }
      });

      // Simulate "Thinking" Delay (1.5s - 3s) to feel more natural
      const delay = Math.floor(Math.random() * 1500) + 1500;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Emit response back to client
      socket.emit('receive_message', {
        role: 'assistant',
        content: aiResult.response,
        timestamp: new Date(),
        fromCache: aiResult.fromCache
      });

    } catch (error) {
      logger.error('Socket message processing failed', error, { socketId: socket.id });
      socket.emit('receive_message', {
        role: 'assistant',
        content: 'عذراً، حدث خطأ أثناء معالجة رسالتك.',
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    logger.debug('Widget disconnected', { socketId: socket.id });
  });
});

// Basic Routes
app.get('/', (req, res) => {
  res.send('Fahimo API is running. The AI that understands you.');
});

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
app.use('/api/chat', demoRoutes); // Mount demo routes under /api/chat/demo

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

  logger.info('Environment validation passed');
}

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION - Server will exit', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION', reason instanceof Error ? reason : new Error(String(reason)));
});

// Auto-create admin on startup
async function ensureAdminExists() {
  try {
    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@faheemly.com';
    const adminPassword = await bcrypt.hash('admin@123', 10);
    
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

server.listen(PORT, async () => {
  logger.info(`Fahimo Server is running on port ${PORT}`);
  logger.info('"The one who understands you" is ready to serve.');
  
  // Validate environment before starting
  validateEnvironment();
  
  await ensureAdminExists();
});
