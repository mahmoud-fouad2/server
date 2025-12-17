const request = require('supertest');

describe('Telegram Webhook Quota Enforcement', () => {
  beforeEach(() => jest.resetModules());

  test('returns 404 for missing integration', async () => {
    jest.doMock('../../src/config/database', () => ({
      integration: { findUnique: jest.fn().mockResolvedValue(null) }
    }));

    const express = require('express');
    const appLocal = express();
    appLocal.use(express.json());
    const telegramRoutes = require('../../src/routes/telegram.routes');
    appLocal.use('/api/telegram', telegramRoutes);

    const res = await request(appLocal)
      .post('/api/telegram/webhook/not-found')
      .send({});

    expect(res.status).toBe(404);
  });

  test('replies and stops when quota exceeded', async () => {
    const mockIntegration = {
      id: 'i1',
      isActive: true,
      type: 'TELEGRAM',
      config: { token: 'tkn' },
      business: { id: 'b1', messagesUsed: 10, messageQuota: 10 }
    };

    jest.doMock('../../src/config/database', () => ({
      integration: { findUnique: jest.fn().mockResolvedValue(mockIntegration) },
      conversation: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'conv1', businessId: mockIntegration.business.id })
      },
      systemLog: { create: jest.fn().mockResolvedValue(null) } // prevent error when handler logs
    }));

    // Mock telegramService so sendMessage doesn't throw
    jest.doMock('../../src/services/telegram.service', () => ({
      sendMessage: jest.fn().mockResolvedValue(null),
      getMe: jest.fn()
    }));

    const express = require('express');
    const appLocal = express();
    appLocal.use(express.json());
    const telegramRoutes = require('../../src/routes/telegram.routes');
    appLocal.use('/api/telegram', telegramRoutes);

    const payload = { message: { text: 'hello', chat: { id: 'chat1' }, from: { first_name: 'Test' } } };

    const res = await request(appLocal)
      .post('/api/telegram/webhook/i1')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });
});
