const request = require('supertest');

describe('Twilio Webhook Quota Enforcement', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
  });

  test('returns empty TwiML when no business found', async () => {
    // Mock prisma to return no integration and no business
    jest.doMock('../../src/config/database', () => ({
      integration: { findFirst: jest.fn().mockResolvedValue(null) },
      business: { findFirst: jest.fn().mockResolvedValue(null) }
    }));

    const express = require('express');
    const appLocal = express();
    appLocal.use(express.urlencoded({ extended: true }));

    const twilioRoutes = require('../../src/routes/twilio.routes');
    appLocal.use('/api/twilio', twilioRoutes);

    const res = await request(appLocal)
      .post('/api/twilio/webhook')
      .send('From=whatsapp:+123&Body=hello')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<Response>');
  });

  test('replies with quota message when quota exceeded', async () => {
    const mockBusiness = { id: 'b1', messagesUsed: 100, messageQuota: 100 };

    jest.doMock('../../src/config/database', () => ({
      integration: { findFirst: jest.fn().mockResolvedValue(null) },
      business: { findFirst: jest.fn().mockResolvedValue(mockBusiness) }
    }));

    const express = require('express');
    const appLocal = express();
    appLocal.use(express.urlencoded({ extended: true }));

    const twilioRoutes = require('../../src/routes/twilio.routes');
    appLocal.use('/api/twilio', twilioRoutes);

    const res = await request(appLocal)
      .post('/api/twilio/webhook')
      .send('From=whatsapp:+123&Body=hello')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.text).toContain('عذراً');
  });
});
