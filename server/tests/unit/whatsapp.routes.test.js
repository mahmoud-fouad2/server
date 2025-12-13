const request = require('supertest');
const express = require('express');
const router = require('../../src/routes/whatsapp');

function rawBodySaver(req, res, buf, encoding) {
  if (buf && buf.length) req.rawBody = buf.toString(encoding || 'utf8');
}

describe('WhatsApp webhook verification', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json({ verify: rawBodySaver }));
    // Mount router at root to use /webhook paths directly in tests
    app.use('/', router);
  });

  test('GET verification returns 500 if verify token not configured', async () => {
    const res = await request(app).get('/webhook');
    expect(res.status).toBe(500);
  });

  test('POST rejects invalid signature when secret configured', async () => {
    process.env.WHATSAPP_APP_SECRET = 'test-secret';
    const body = { object: 'whatsapp_business_account' };
    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .send(body);
    expect(res.status).toBe(403);
    delete process.env.WHATSAPP_APP_SECRET;
  });

  test('POST accepts valid signature when secret configured', async () => {
    process.env.WHATSAPP_APP_SECRET = 'test-secret-2';
    const payload = { object: 'whatsapp_business_account' };
    const raw = JSON.stringify(payload);
    const crypto = require('crypto');
    const expected = 'sha256=' + crypto.createHmac('sha256', process.env.WHATSAPP_APP_SECRET).update(raw).digest('hex');
    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', expected)
      .send(payload);
    // No processing occurs because we didn't include `entry` payload; But signature valid should not return 403
    expect([200, 404]).toContain(res.status);
    delete process.env.WHATSAPP_APP_SECRET;
  });
});
