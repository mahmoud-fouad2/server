import request from 'supertest';
import { app } from '../src/index';
import prisma from '../src/config/database';

describe('API Tests - اختبارات شاملة', () => {
  let authToken: string;
  let businessId: string;
  let conversationId: string;
  
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123456!',
    name: 'Test User',
    businessName: 'Test Business'
  };

  afterAll(async () => {
    // Cleanup test data
    if (businessId) {
      await prisma.conversation.deleteMany({ where: { businessId } });
      await prisma.knowledgeBase.deleteMany({ where: { businessId } });
      await prisma.business.delete({ where: { id: businessId } });
    }
    await prisma.$disconnect();
  });

  describe('Auth API', () => {
    test('POST /api/auth/register - يجب أن يسجل مستخدم جديد', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      
      authToken = res.body.token;
      businessId = res.body.user.businessId;
    });

    test('POST /api/auth/register - يجب أن يرفض email مكرر', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
    });

    test('POST /api/auth/login - يجب أن يسجل الدخول', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    test('POST /api/auth/login - يجب أن يرفض كلمة مرور خاطئة', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });

    test('GET /api/auth/me - يجب أن يعيد بيانات المستخدم', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
    });

    test('GET /api/auth/me - يجب أن يرفض بدون token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Chat API', () => {
    test('POST /api/chat/send - يجب أن يرسل رسالة ويحصل على رد', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .send({
          businessId,
          content: 'مرحبا، كيف حالك؟',
          senderType: 'USER'
        });

      expect(res.status).toBe(200);
      expect(res.body.conversationId).toBeDefined();
      expect(res.body.botMessage).toBeDefined();
      expect(res.body.botMessage.content).toBeDefined();
      
      conversationId = res.body.conversationId;
    });

    test('POST /api/chat/send - يجب أن يحتفظ بسياق المحادثة', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .send({
          businessId,
          conversationId,
          content: 'ما اسمي؟',
          senderType: 'USER'
        });

      expect(res.status).toBe(200);
      expect(res.body.botMessage.content).toBeDefined();
    });

    test('POST /api/chat/send - يجب أن يرفض بدون businessId', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .send({
          content: 'مرحبا',
          senderType: 'USER'
        });

      expect(res.status).toBe(400);
    });

    test('GET /api/chat/conversations - يجب أن يعيد المحادثات', async () => {
      const res = await request(app)
        .get('/api/chat/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('GET /api/chat/conversations/:id/messages - يجب أن يعيد رسائل المحادثة', async () => {
      const res = await request(app)
        .get(`/api/chat/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('POST /api/chat/rate - يجب أن يقيم المحادثة', async () => {
      const res = await request(app)
        .post('/api/chat/rate')
        .send({
          businessId,
          conversationId,
          rating: 5
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.rating).toBe(5);
    });

    test('POST /api/chat/rate - يجب أن يرفض تقييم غير صحيح', async () => {
      const res = await request(app)
        .post('/api/chat/rate')
        .send({
          businessId,
          conversationId,
          rating: 6
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Knowledge Base API', () => {
    let knowledgeId: string;

    test('POST /api/knowledge - يجب أن يضيف معرفة جديدة', async () => {
      const res = await request(app)
        .post('/api/knowledge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId)
        .send({
          title: 'ساعات العمل',
          content: 'نعمل من الساعة 9 صباحاً حتى 5 مساءً',
          category: 'general'
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      knowledgeId = res.body.id;
    });

    test('GET /api/knowledge - يجب أن يعيد قائمة المعرفة', async () => {
      const res = await request(app)
        .get('/api/knowledge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('PUT /api/knowledge/:id - يجب أن يحدث المعرفة', async () => {
      const res = await request(app)
        .put(`/api/knowledge/${knowledgeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId)
        .send({
          title: 'ساعات العمل المحدثة',
          content: 'نعمل من 8 صباحاً حتى 6 مساءً',
          category: 'general'
        });

      expect(res.status).toBe(200);
    });

    test('DELETE /api/knowledge/:id - يجب أن يحذف المعرفة', async () => {
      const res = await request(app)
        .delete(`/api/knowledge/${knowledgeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
    });
  });

  describe('Business API', () => {
    test('GET /api/business - يجب أن يعيد بيانات الأعمال', async () => {
      const res = await request(app)
        .get('/api/business')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(businessId);
    });

    test('PATCH /api/business - يجب أن يحدث بيانات الأعمال', async () => {
      const res = await request(app)
        .patch('/api/business')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId)
        .send({
          name: 'Updated Business Name',
          primaryColor: '#FF5733'
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Business Name');
    });

    test('GET /api/business/stats - يجب أن يعيد الإحصائيات', async () => {
      const res = await request(app)
        .get('/api/business/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-business-id', businessId);

      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalConversations).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance Tests', () => {
    test('يجب أن يستجيب في أقل من 1 ثانية', async () => {
      const start = Date.now();
      
      await request(app)
        .post('/api/chat/send')
        .send({
          businessId,
          content: 'سؤال سريع',
          senderType: 'USER'
        });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    test('يجب أن يتعامل مع 10 طلبات متزامنة', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/chat/send')
          .send({
            businessId,
            content: `سؤال رقم ${i + 1}`,
            senderType: 'USER'
          })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Security Tests', () => {
    test('يجب أن يرفض SQL Injection', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .send({
          businessId: "'; DROP TABLE users; --",
          content: 'test',
          senderType: 'USER'
        });

      expect(res.status).toBeLessThan(500);
    });

    test('يجب أن يرفض XSS في المحتوى', async () => {
      const res = await request(app)
        .post('/api/chat/send')
        .send({
          businessId,
          content: '<script>alert("XSS")</script>',
          senderType: 'USER'
        });

      expect(res.status).toBe(200);
      expect(res.body.botMessage.content).not.toContain('<script>');
    });

    test('يجب أن يطبق rate limiting', async () => {
      // Send many requests quickly
      const promises = Array.from({ length: 100 }, () =>
        request(app)
          .post('/api/chat/send')
          .send({
            businessId,
            content: 'spam',
            senderType: 'USER'
          })
      );

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
