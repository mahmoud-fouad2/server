const express = require('express');
const request = require('supertest');

// Mock the auth middleware so requests appear authenticated
jest.mock('../../src/middleware/auth.js', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { businessId: 'test-business' };
    return next();
  }
}));

describe('Route ordering: /conversations and /handover-requests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Import the router after mocking auth
    const chatRoutes = require('../../src/routes/chat.routes');

    // Stub the controller handlers to detect correct routing
    const chatController = require('../../src/controllers/chat.controller');
    chatController.getConversations = (req, res) => res.status(200).json({ ok: true, route: 'conversations' });
    chatController.getHandoverRequests = (req, res) => res.status(200).json({ ok: true, route: 'handover-requests' });
    chatController.getMessages = (req, res) => res.status(200).json({ ok: true, route: 'messages' });

    app.use('/api/chat', chatRoutes);
  });

  test('GET /api/chat/conversations should hit getConversations (not treated as conversationId)', async () => {
    const res = await request(app).get('/api/chat/conversations').set('Authorization', 'Bearer faketoken');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('conversations');
  });

  test('GET /api/chat/handover-requests should hit getHandoverRequests', async () => {
    const res = await request(app).get('/api/chat/handover-requests').set('Authorization', 'Bearer faketoken');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('handover-requests');
  });
});
