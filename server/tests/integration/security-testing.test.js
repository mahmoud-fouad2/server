const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

describe('Security Testing Suite', () => {
  let app;
  let server;
  let testUser;
  let testBusiness;
  let authToken;

  beforeAll(async () => {
    app = require('../index');
    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up and create test data
    await prisma.user.deleteMany();
    await prisma.business.deleteMany();

    // Create test user and business
    const hashedPassword = await bcrypt.hash('TestPass123!', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'security-test@example.com',
        password: hashedPassword,
        name: 'Security Test User'
      }
    });

    testBusiness = await prisma.business.create({
      data: {
        userId: testUser.id,
        name: 'Security Test Business',
        activityType: 'COMPANY'
      }
    });

    authToken = jwt.sign(
      { userId: testUser.id, businessId: testBusiness.id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('Authentication Security', () => {
    test('should prevent SQL injection in login', async () => {
      const maliciousInputs = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1 --"
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: input,
            password: 'password'
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid credentials');
      }
    });

    test('should prevent brute force attacks with rate limiting', async () => {
      const promises = [];

      // Attempt multiple login failures
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'security-test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const results = await Promise.allSettled(promises);
      const rateLimited = results.some(result =>
        result.status === 'fulfilled' && result.value.status === 429
      );

      // Rate limiting should kick in
      expect(rateLimited).toBe(true);
    });

    test('should validate JWT tokens properly', async () => {
      // Test with invalid token
      await request(app)
        .get('/api/business')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Test with expired token
      const expiredToken = jwt.sign(
        { userId: testUser.id, businessId: testBusiness.id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      );

      await request(app)
        .get('/api/business')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      // Test with malformed token
      await request(app)
        .get('/api/business')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .expect(401);
    });

    test('should prevent token theft via timing attacks', async () => {
      // This test checks that token validation takes constant time
      const validToken = authToken;
      const invalidToken = authToken.slice(0, -5) + 'xxxxx';

      const start1 = Date.now();
      await request(app)
        .get('/api/business')
        .set('Authorization', `Bearer ${validToken}`);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await request(app)
        .get('/api/business')
        .set('Authorization', `Bearer ${invalidToken}`);
      const time2 = Date.now() - start2;

      // Times should be similar (within 50ms tolerance)
      expect(Math.abs(time1 - time2)).toBeLessThan(50);
    });
  });

  describe('Input Validation and XSS Protection', () => {
    test('should prevent XSS attacks in user input', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        '<svg onload=alert("xss")>',
        '"><script>alert("xss")</script>',
        '\'><script>alert("xss")</script>'
      ];

      for (const payload of xssPayloads) {
        // Test in registration
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            name: payload,
            businessName: 'Test Business',
            activityType: 'COMPANY'
          });

        // Should either sanitize or reject
        if (response.status === 201) {
          expect(response.body.user.name).not.toContain('<script>');
          expect(response.body.user.name).not.toContain('javascript:');
        }
      }
    });

    test('should validate and sanitize chat messages', async () => {
      // Create a conversation first
      const conversation = await prisma.conversation.create({
        data: {
          businessId: testBusiness.id,
          channel: 'WIDGET'
        }
      });

      const maliciousMessages = [
        '<script>alert("xss")</script> hello',
        'SELECT * FROM users;',
        '../../../etc/passwd',
        '<img src=x onerror=alert(1)>',
        'javascript:void(0)'
      ];

      for (const message of maliciousMessages) {
        const response = await request(app)
          .post(`/api/conversations/${conversation.id}/messages`)
          .send({
            message: message,
            businessId: testBusiness.id
          })
          .expect(200);

        // Message should be sanitized or rejected
        const savedMessage = await prisma.message.findFirst({
          where: { conversationId: conversation.id, content: { contains: message } }
        });

        if (savedMessage) {
          expect(savedMessage.content).not.toContain('<script>');
          expect(savedMessage.content).not.toContain('javascript:');
        }
      }
    });

    test('should prevent path traversal attacks', async () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ];

      for (const payload of pathTraversalPayloads) {
        // Test in file upload endpoints (if they exist)
        const response = await request(app)
          .post('/api/uploads')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', Buffer.from('test'), {
            filename: payload,
            contentType: 'text/plain'
          });

        // Should reject or sanitize the filename
        expect([400, 403, 404]).toContain(response.status);
      }
    });
  });

  describe('Data Isolation and Access Control', () => {
    let otherUser;
    let otherBusiness;

    beforeEach(async () => {
      // Create another user and business
      const otherHashedPassword = await bcrypt.hash('OtherPass123!', 10);
      otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: otherHashedPassword,
          name: 'Other User'
        }
      });

      otherBusiness = await prisma.business.create({
        data: {
          userId: otherUser.id,
          name: 'Other Business',
          activityType: 'COMPANY'
        }
      });
    });

    test('should enforce business data isolation', async () => {
      // Create conversation for other business
      const otherConversation = await prisma.conversation.create({
        data: {
          businessId: otherBusiness.id,
          channel: 'WIDGET'
        }
      });

      // Try to access other business's conversation
      await request(app)
        .get(`/api/conversations/${otherConversation.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      // Try to send message to other business's conversation
      await request(app)
        .post(`/api/conversations/${otherConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'test message',
          businessId: testBusiness.id
        })
        .expect(403);
    });

    test('should prevent privilege escalation', async () => {
      // Try to access admin endpoints as regular user
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      await request(app)
        .post('/api/admin/system-settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ key: 'test', value: 'test' })
        .expect(403);
    });

    test('should validate business ownership', async () => {
      // Try to update other business's settings
      await request(app)
        .put('/api/business/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          businessId: otherBusiness.id, // Trying to update other business
          botTone: 'formal'
        })
        .expect(403);
    });
  });

  describe('API Security Headers and Configuration', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for important security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    test('should prevent information disclosure', async () => {
      // Test error responses don't leak sensitive information
      const responses = await Promise.all([
        request(app).get('/api/nonexistent-endpoint'),
        request(app).post('/api/auth/login').send({}),
        request(app).get('/api/business').set('Authorization', 'Bearer invalid')
      ]);

      for (const response of responses) {
        // Error messages should be generic, not revealing internal details
        if (response.body.message) {
          expect(response.body.message).not.toContain('prisma');
          expect(response.body.message).not.toContain('sql');
          expect(response.body.message).not.toContain('stack');
          expect(response.body.message).not.toContain('error');
        }
      }
    });

    test('should handle CORS properly', async () => {
      // Test CORS headers
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('File Upload Security', () => {
    test('should validate file types and sizes', async () => {
      const largeFile = Buffer.alloc(10 * 1024 * 1024); // 10MB file

      // Test large file upload
      const response = await request(app)
        .post('/api/uploads')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFile, {
          filename: 'large-file.txt',
          contentType: 'text/plain'
        });

      // Should reject large files
      expect([400, 413]).toContain(response.status);
    });

    test('should prevent malicious file uploads', async () => {
      const maliciousFiles = [
        { name: 'malicious.php', content: '<?php echo "hacked"; ?>' },
        { name: 'script.js', content: 'alert("xss")' },
        { name: 'evil.exe', content: 'MZfakeexecutable' }
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/uploads')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', Buffer.from(file.content), {
            filename: file.name,
            contentType: 'application/octet-stream'
          });

        // Should reject executable or script files
        expect([400, 403]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    test('should implement rate limiting on API endpoints', async () => {
      const promises = [];

      // Hit an endpoint multiple times rapidly
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .get('/api/health')
        );
      }

      const results = await Promise.allSettled(promises);
      const rateLimited = results.filter(result =>
        result.status === 'fulfilled' && result.value.status === 429
      ).length;

      // Some requests should be rate limited
      expect(rateLimited).toBeGreaterThan(0);
    });

    test('should handle slowloris-style attacks', async () => {
      // This is a basic test - in production, you'd need more sophisticated protection
      const response = await request(app)
        .get('/api/health')
        .set('Content-Length', '1000000') // Fake large content length
        .timeout(5000);

      expect(response.status).not.toBe(408); // Should not timeout
    });
  });
});