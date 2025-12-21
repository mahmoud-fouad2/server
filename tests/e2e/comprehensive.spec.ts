import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'Test123456!',
  name: 'Test User',
  businessName: 'Test Business'
};

let authToken = '';
let businessId = '';

test.describe('نظام Faheemly - اختبارات شاملة', () => {

  test.describe('1. التسجيل والمصادقة', () => {
    
    test('يجب أن يسمح بتسجيل مستخدم جديد', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/register`, {
        data: testUser
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUser.email);
      
      authToken = data.token;
      businessId = data.user.businessId;
    });

    test('يجب أن يرفض تسجيل مستخدم موجود', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/register`, {
        data: testUser
      });
      
      expect(response.status()).toBe(400);
    });

    test('يجب أن يسمح بتسجيل الدخول', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: testUser.email,
          password: testUser.password
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
    });

    test('يجب أن يرفض بيانات دخول خاطئة', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          email: testUser.email,
          password: 'wrongpassword'
        }
      });
      
      expect(response.status()).toBe(401);
    });
  });

  test.describe('2. الدردشة والبوت الذكي', () => {
    
    test('يجب أن يرسل رسالة ويحصل على رد من البوت', async ({ request }) => {
      const response = await request.post(`${API_URL}/chat/send`, {
        data: {
          businessId,
          content: 'مرحبا، كيف يمكنك مساعدتي؟',
          senderType: 'USER'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.conversationId).toBeDefined();
      expect(data.botMessage).toBeDefined();
      expect(data.botMessage.content).toBeDefined();
      expect(data.botMessage.sender).toBe('bot');
    });

    test('يجب أن يحتفظ بسياق المحادثة', async ({ request }) => {
      // Send first message
      const res1 = await request.post(`${API_URL}/chat/send`, {
        data: {
          businessId,
          content: 'اسمي محمد',
          senderType: 'USER'
        }
      });
      
      const data1 = await res1.json();
      const conversationId = data1.conversationId;
      
      // Send second message with context
      const res2 = await request.post(`${API_URL}/chat/send`, {
        data: {
          businessId,
          conversationId,
          content: 'ما اسمي؟',
          senderType: 'USER'
        }
      });
      
      expect(res2.ok()).toBeTruthy();
      const data2 = await res2.json();
      expect(data2.botMessage.content.toLowerCase()).toContain('محمد');
    });

    test('يجب أن يرفض الرسائل بدون businessId', async ({ request }) => {
      const response = await request.post(`${API_URL}/chat/send`, {
        data: {
          content: 'مرحبا',
          senderType: 'USER'
        }
      });
      
      expect(response.status()).toBe(400);
    });
  });

  test.describe('3. التقييمات', () => {
    
    test('يجب أن يسمح بتقييم المحادثة', async ({ request }) => {
      // Create conversation first
      const chatRes = await request.post(`${API_URL}/chat/send`, {
        data: {
          businessId,
          content: 'سؤال للتقييم',
          senderType: 'USER'
        }
      });
      
      const chatData = await chatRes.json();
      const conversationId = chatData.conversationId;
      
      // Rate the conversation
      const response = await request.post(`${API_URL}/chat/rate`, {
        data: {
          businessId,
          conversationId,
          rating: 5
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.rating).toBe(5);
    });

    test('يجب أن يرفض تقييم غير صحيح', async ({ request }) => {
      const response = await request.post(`${API_URL}/chat/rate`, {
        data: {
          businessId,
          conversationId: 'test-conv-id',
          rating: 6 // Invalid rating
        }
      });
      
      expect(response.status()).toBe(400);
    });
  });

  test.describe('4. قاعدة المعرفة', () => {
    
    let knowledgeId = '';

    test('يجب أن يضيف معرفة جديدة', async ({ request }) => {
      const response = await request.post(`${API_URL}/knowledge`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-business-id': businessId
        },
        data: {
          title: 'أوقات العمل',
          content: 'نعمل من 9 صباحاً حتى 5 مساءً يومياً',
          category: 'general'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.id).toBeDefined();
      knowledgeId = data.id;
    });

    test('يجب أن يستخدم البوت قاعدة المعرفة', async ({ request }) => {
      // Wait a bit for indexing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await request.post(`${API_URL}/chat/send`, {
        data: {
          businessId,
          content: 'ما هي أوقات عملكم؟',
          senderType: 'USER'
        }
      });
      
      const data = await response.json();
      expect(data.botMessage.content).toContain('9');
      expect(data.botMessage.content).toContain('5');
    });

    test('يجب أن يحذف معرفة', async ({ request }) => {
      const response = await request.delete(`${API_URL}/knowledge/${knowledgeId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-business-id': businessId
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('5. إحصائيات الأعمال', () => {
    
    test('يجب أن يعرض إحصائيات', async ({ request }) => {
      const response = await request.get(`${API_URL}/business/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-business-id': businessId
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.stats).toBeDefined();
      expect(data.stats.totalConversations).toBeGreaterThanOrEqual(0);
      expect(data.stats.messagesUsed).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('6. واجهة الويدجت', () => {
    
    test('يجب أن يحمل الويدجت بنجاح', async ({ page }) => {
      // Create a test page with widget
      await page.goto(`data:text/html,
        <!DOCTYPE html>
        <html>
        <head>
          <title>Widget Test</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <script>
            window.__FAHIMO_CONFIG = {
              businessId: "${businessId}",
              primaryColor: "#6366F1",
              welcomeMessage: "مرحبا! كيف يمكنني مساعدتك؟"
            };
          </script>
          <script src="${API_URL.replace('/api', '')}/fahimo-widget.js"></script>
        </body>
        </html>
      `);
      
      // Wait for widget to load
      await page.waitForTimeout(2000);
      
      // Check if widget button exists
      const widgetButton = page.locator('button[style*="position: fixed"]');
      await expect(widgetButton).toBeVisible();
    });

    test('يجب أن يفتح نافذة الدردشة', async ({ page }) => {
      await page.goto(`data:text/html,
        <!DOCTYPE html>
        <html>
        <head><title>Widget Test</title></head>
        <body>
          <script>
            window.__FAHIMO_CONFIG = {
              businessId: "${businessId}",
              primaryColor: "#6366F1"
            };
          </script>
          <script src="${API_URL.replace('/api', '')}/fahimo-widget.js"></script>
        </body>
        </html>
      `);
      
      await page.waitForTimeout(2000);
      
      // Click widget button
      const widgetButton = page.locator('button[style*="position: fixed"]').first();
      await widgetButton.click();
      
      // Check if chat window opens
      await page.waitForTimeout(500);
      const chatWindow = page.locator('div[style*="backgroundColor: white"]').first();
      await expect(chatWindow).toBeVisible();
    });

    test('يجب أن يرسل رسالة من الويدجت', async ({ page }) => {
      await page.goto(`data:text/html,
        <!DOCTYPE html>
        <html>
        <head><title>Widget Test</title></head>
        <body>
          <script>
            window.__FAHIMO_API_URL = "${API_URL.replace('/api', '')}";
            window.__FAHIMO_CONFIG = {
              businessId: "${businessId}",
              primaryColor: "#6366F1"
            };
          </script>
          <script src="${API_URL.replace('/api', '')}/fahimo-widget.js"></script>
        </body>
        </html>
      `);
      
      await page.waitForTimeout(2000);
      
      // Open widget
      const widgetButton = page.locator('button[style*="position: fixed"]').first();
      await widgetButton.click();
      await page.waitForTimeout(500);
      
      // Type message
      const input = page.locator('textarea').first();
      await input.fill('مرحبا من الويدجت');
      
      // Send message
      const sendButton = page.locator('button[style*="svg"]').last();
      await sendButton.click();
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      // Check if bot responded
      const messages = page.locator('div[style*="sender"]');
      expect(await messages.count()).toBeGreaterThan(0);
    });
  });

  test.describe('7. لوحة التحكم', () => {
    
    test('يجب أن تحمل صفحة تسجيل الدخول', async ({ page }) => {
      await page.goto(`${WEB_URL}/login`);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('يجب أن يسجل الدخول إلى لوحة التحكم', async ({ page }) => {
      await page.goto(`${WEB_URL}/login`);
      
      // Fill login form
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      
      // Submit (assuming there's a submit button)
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL(`${WEB_URL}/dashboard`, { timeout: 10000 });
      
      // Check if dashboard loaded
      expect(page.url()).toContain('/dashboard');
    });

    test('يجب أن تعرض المحادثات', async ({ page }) => {
      // Login first
      await page.goto(`${WEB_URL}/login`);
      await page.fill('input[type="email"]', testUser.email);
      await page.fill('input[type="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${WEB_URL}/dashboard`, { timeout: 10000 });
      
      // Navigate to conversations (if there's a tab/button)
      await page.waitForTimeout(2000);
      
      // Check if page has conversation-related content
      const hasConversations = await page.locator('text=/conversation|محادثة/i').count() > 0;
      expect(hasConversations).toBeTruthy();
    });
  });

  test.describe('8. الأداء والاستجابة', () => {
    
    test('يجب أن يستجيب API في أقل من 2 ثانية', async ({ request }) => {
      const start = Date.now();
      
      await request.post(`${API_URL}/chat/send`, {
        data: {
          businessId,
          content: 'سؤال سريع',
          senderType: 'USER'
        }
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    test('يجب أن يتعامل مع طلبات متزامنة', async ({ request }) => {
      const promises = Array.from({ length: 5 }, (_, i) => 
        request.post(`${API_URL}/chat/send`, {
          data: {
            businessId,
            content: `سؤال رقم ${i + 1}`,
            senderType: 'USER'
          }
        })
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy();
      });
    });
  });

  test.describe('9. الأمان', () => {
    
    test('يجب أن يرفض الوصول بدون توكن', async ({ request }) => {
      const response = await request.get(`${API_URL}/business/stats`);
      expect(response.status()).toBe(401);
    });

    test('يجب أن يرفض توكن غير صحيح', async ({ request }) => {
      const response = await request.get(`${API_URL}/business/stats`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      expect(response.status()).toBe(401);
    });

    test('يجب أن يمنع SQL Injection', async ({ request }) => {
      const response = await request.post(`${API_URL}/chat/send`, {
        data: {
          businessId: "'; DROP TABLE users; --",
          content: 'test',
          senderType: 'USER'
        }
      });
      
      // Should either reject or handle safely
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('10. استمرارية الجلسة', () => {
    
    test('يجب أن يحفظ الجلسة في localStorage', async ({ page }) => {
      await page.goto(`data:text/html,
        <!DOCTYPE html>
        <html>
        <head><title>Widget Test</title></head>
        <body>
          <script>
            window.__FAHIMO_API_URL = "${API_URL.replace('/api', '')}";
            window.__FAHIMO_CONFIG = {
              businessId: "${businessId}",
              primaryColor: "#6366F1"
            };
          </script>
          <script src="${API_URL.replace('/api', '')}/fahimo-widget.js"></script>
        </body>
        </html>
      `);
      
      await page.waitForTimeout(2000);
      
      // Open and send a message
      await page.click('button[style*="position: fixed"]');
      await page.waitForTimeout(500);
      await page.fill('textarea', 'رسالة للحفظ');
      await page.click('button[style*="svg"]');
      await page.waitForTimeout(2000);
      
      // Check localStorage
      const storage = await page.evaluate(() => {
        return localStorage.getItem(`fahimo-chat-${window.__FAHIMO_CONFIG.businessId}`);
      });
      
      expect(storage).toBeDefined();
      expect(storage).toContain('رسالة للحفظ');
    });

    test('يجب أن يستعيد الجلسة بعد التحديث', async ({ page }) => {
      await page.goto(`data:text/html,
        <!DOCTYPE html>
        <html>
        <head><title>Widget Test</title></head>
        <body>
          <script>
            window.__FAHIMO_API_URL = "${API_URL.replace('/api', '')}";
            window.__FAHIMO_CONFIG = {
              businessId: "${businessId}"
            };
          </script>
          <script src="${API_URL.replace('/api', '')}/fahimo-widget.js"></script>
        </body>
        </html>
      `);
      
      await page.waitForTimeout(2000);
      
      // Send a message
      await page.click('button[style*="position: fixed"]');
      await page.waitForTimeout(500);
      await page.fill('textarea', 'رسالة قبل التحديث');
      await page.click('button[style*="svg"]');
      await page.waitForTimeout(2000);
      
      // Reload page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Open widget again
      await page.click('button[style*="position: fixed"]');
      await page.waitForTimeout(500);
      
      // Check if message is still there
      const messageExists = await page.locator('text="رسالة قبل التحديث"').count() > 0;
      expect(messageExists).toBeTruthy();
    });
  });
});

test.describe('11. اختبارات التكامل الشاملة', () => {
  
  test('سيناريو كامل: من التسجيل إلى المحادثة المقيّمة', async ({ page, request }) => {
    // 1. Register a new user
    const newUser = {
      email: `integration-${Date.now()}@test.com`,
      password: 'Test123456!',
      name: 'Integration Test',
      businessName: 'Integration Business'
    };
    
    const registerRes = await request.post(`${API_URL}/auth/register`, {
      data: newUser
    });
    
    expect(registerRes.ok()).toBeTruthy();
    const registerData = await registerRes.json();
    const businessId = registerData.user.businessId;
    
    // 2. Add knowledge
    await request.post(`${API_URL}/knowledge`, {
      headers: {
        'Authorization': `Bearer ${registerData.token}`,
        'x-business-id': businessId
      },
      data: {
        title: 'سياسة الإرجاع',
        content: 'يمكنك إرجاع المنتج خلال 14 يوم من الشراء',
        category: 'policy'
      }
    });
    
    // 3. Chat and get AI response
    const chatRes = await request.post(`${API_URL}/chat/send`, {
      data: {
        businessId,
        content: 'ما هي سياسة الإرجاع؟',
        senderType: 'USER'
      }
    });
    
    expect(chatRes.ok()).toBeTruthy();
    const chatData = await chatRes.json();
    expect(chatData.botMessage.content).toContain('14');
    
    // 4. Rate the conversation
    const rateRes = await request.post(`${API_URL}/chat/rate`, {
      data: {
        businessId,
        conversationId: chatData.conversationId,
        rating: 5
      }
    });
    
    expect(rateRes.ok()).toBeTruthy();
    
    // 5. Check stats
    const statsRes = await request.get(`${API_URL}/business/stats`, {
      headers: {
        'Authorization': `Bearer ${registerData.token}`,
        'x-business-id': businessId
      }
    });
    
    expect(statsRes.ok()).toBeTruthy();
    const statsData = await statsRes.json();
    expect(statsData.stats.totalConversations).toBeGreaterThan(0);
  });
});
