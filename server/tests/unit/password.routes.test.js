const request = require('supertest');
const express = require('express');
const crypto = require('crypto');

jest.mock('../../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn()
  }
}));

jest.mock('../../src/services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue({ accepted: ['test@example.com'], messageId: '1' })
}));

const prisma = require('../../src/config/database');
const emailService = require('../../src/services/email.service');
const router = require('../../src/routes/password.routes');

describe('Password routes', () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', router);
    jest.clearAllMocks();
  });

  test('POST /forgot-password returns 400 when email missing', async () => {
    const res = await request(app).post('/forgot-password').send({});
    expect(res.status).toBe(400);
  });

  test('POST /forgot-password sends email when user exists', async () => {
    const email = 'test@example.com';
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email });
    prisma.user.update.mockResolvedValue({ id: 'user-1', email });

    const res = await request(app).post('/forgot-password').send({ email });
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalled();
    expect(emailService.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: email }));
  });

  test('POST /forgot-password returns generic response when user not found and does not send email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/forgot-password').send({ email: 'nope@example.com' });
    expect(res.status).toBe(200);
    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  test('POST /reset-password with valid token updates password and clears token', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = { id: 'user-1', resetToken: resetTokenHash, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) };

    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({ id: 'user-1' });

    const res = await request(app).post('/reset-password').send({ token: rawToken, newPassword: 'newSecurePass1' });
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: user.id } , data: expect.objectContaining({ password: expect.any(String) }) }));
  });
});
