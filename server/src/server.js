const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Load env vars
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security Middleware
app.use(helmet()); // Set security headers
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Stricter Auth Rate Limiting
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login/register requests per hour
  message: 'Too many login attempts, please try again later.'
});
app.use('/api/auth', authLimiter);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.static('public'));

// Routes
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const businessRoutes = require('./routes/business.routes');
const widgetRoutes = require('./routes/widget.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');
const teamRoutes = require('./routes/team.routes');
const adminRoutes = require('./routes/admin.routes');
const twilioRoutes = require('./routes/twilio.routes');
const telegramRoutes = require('./routes/telegram.routes');
const ticketRoutes = require('./routes/ticket.routes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/tickets', ticketRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('Fahimo API is running 🚀');
});

// Socket.io for Realtime
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3001;

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
