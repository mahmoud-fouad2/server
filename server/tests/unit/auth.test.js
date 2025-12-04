/**
 * ═══════════════════════════════════════════════════
 *  FAHEEMLY - Authentication Unit Tests
 * ═══════════════════════════════════════════════════
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock app setup (simplified)
const express = require('express');
const app = express();
app.use(express.json());

// Import auth middleware
const { authenticateToken, requireRole } = require('../../src/middleware/auth');

// Test routes
app.get('/test-auth', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/test-admin', authenticateToken, requireRole('SUPERADMIN'), (req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

describe('Authentication Middleware', () => {
  let validToken;
  let expiredToken;

  beforeAll(() => {
    // Generate valid token
    validToken = jwt.sign(
      { userId: 'test-user-123', role: 'CLIENT' },
      process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars',
      { expiresIn: '1h' }
    );

    // Generate expired token
    expiredToken = jwt.sign(
      { userId: 'test-user-123', role: 'CLIENT' },
      process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars',
      { expiresIn: '-1h' }
    );
  });

  describe('authenticateToken middleware', () => {
    test('should reject request without token', async () => {
      const res = await request(app).get('/test-auth');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('مطلوب');
    });

    test('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/test-auth')
        .set('Authorization', 'Bearer invalid-token-here');
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('غير صحيح');
    });

    test('should reject expired token', async () => {
      const res = await request(app)
        .get('/test-auth')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(403);
    });

    test('should accept valid token', async () => {
      const res = await request(app)
        .get('/test-auth')
        .set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.userId).toBe('test-user-123');
    });
  });

  describe('requireRole middleware', () => {
    test('should reject non-admin trying to access admin route', async () => {
      const clientToken = jwt.sign(
        { userId: 'client-123', role: 'CLIENT' },
        process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test-admin')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('صلاحية');
    });

    test('should allow admin access to admin route', async () => {
      const adminToken = jwt.sign(
        { userId: 'admin-123', role: 'SUPERADMIN' },
        process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/test-admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('JWT Token Generation', () => {
  test('should generate valid JWT token', () => {
    const payload = { userId: 'test-123', role: 'CLIENT' };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars',
      { expiresIn: '24h' }
    );

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT has 3 parts
  });

  test('should decode JWT correctly', () => {
    const payload = { userId: 'test-123', role: 'CLIENT' };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars',
      { expiresIn: '24h' }
    );

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars'
    );

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });
});
