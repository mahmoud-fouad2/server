const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const { Server } = require('socket.io');

// Fahimo Insight: Initialize the core "Understanding" engine
dotenv.config();
const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

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
    origin: "*", // Allow all for now, restrict in production
    methods: ["GET", "POST"]
  }
});

// Fahimo Insight: Real-time connection for the "Magic" widget
io.on('connection', (socket) => {
  console.log('A user connected to Fahimo Widget:', socket.id);

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
      console.error('Socket Message Error:', error);
      socket.emit('receive_message', {
        role: 'assistant',
        content: 'عذراً، حدث خطأ أثناء معالجة رسالتك.',
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Basic Routes
app.get('/', (req, res) => {
  res.send('Fahimo API is running. The AI that understands you.');
});

app.use('/api/auth', authRoutes);
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

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

server.listen(PORT, () => {
  console.log(`\n🚀 Fahimo Server is running on port ${PORT}`);
  console.log(`✨ "The one who understands you" is ready to serve.`);
});
