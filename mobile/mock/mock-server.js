// Simple mock server to emulate backend API responses for local UI preview
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3002;

app.post('/api/auth/demo-login', (req, res) => {
  const { email } = req.body || {};
  return res.json({
    success: true,
    token: 'mock-token-12345',
    user: { id: 'user-1', email: email || 'demo@faheemly.com', name: 'Demo User' }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body || {};
  return res.json({
    success: true,
    token: 'mock-token-12345',
    user: { id: 'user-1', email: email || 'demo@faheemly.com', name: 'Demo User' }
  });
});

app.get('/api/chat/conversations', (req, res) => {
  return res.json({
    success: true,
    conversations: [
      { id: 'conv-1', title: 'Support: Welcome', lastMessage: 'Hello! How can I help?', unread: 0 },
      { id: 'conv-2', title: 'Billing', lastMessage: 'Your subscription is expiring', unread: 2 },
    ]
  });
});

app.get('/api/chat/messages', (req, res) => {
  const convId = req.query.conversationId || 'conv-1';
  return res.json({
    success: true,
    messages: [
      { id: 'm1', conversationId: convId, role: 'assistant', text: 'Welcome to Faheemly! How can I assist you today?', createdAt: new Date().toISOString(), sender: 'assistant' },
      { id: 'm2', conversationId: convId, role: 'user', text: 'I need help with my account', createdAt: new Date().toISOString(), sender: 'user' },
    ]
  });
});

app.post('/api/chat/message', (req, res) => {
  const { conversationId, text } = req.body || {};
  const botReply = `Echoing: ${text || 'Hello'}`;
  return res.json({
    success: true,
    message: {
      id: 'mock-' + Math.random().toString(36).slice(2, 9),
      conversationId: conversationId || 'conv-1',
      role: 'assistant',
      text: botReply,
      createdAt: new Date().toISOString(),
    }
  });
});

app.get('/', (req, res) => res.send('Mobile Mock API running on ' + PORT));

app.listen(PORT, () => console.log(`Mock API server running on ${PORT}`));
