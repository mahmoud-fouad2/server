# 📘 دليل الاختبار الشامل - نظام Faheemly

## ✅ ما تم إنجازه

### 1. ملف الصوت المحلي 🔊

#### التغييرات المنفذة:
- ✅ نسخ ملف `notification.mp3` إلى `widget/public/sounds/`
- ✅ تحديث `widget/vite.config.ts` لنسخ المجلد `public`
- ✅ تحديث `widget/src/App.tsx` لاستخدام الملف المحلي
- ✅ تحديث `api/scripts/copy-widget.js` لنسخ مجلد الأصوات

#### كيفية الاستخدام:
```javascript
// في الويدجت، يتم تحميل الصوت من:
const soundUrl = assetBaseUrl 
  ? `${assetBaseUrl}/sounds/notification.mp3` 
  : '/sounds/notification.mp3';

// الصوت موجود في:
// - widget/public/sounds/notification.mp3 (قبل البناء)
// - widget/dist/sounds/notification.mp3 (بعد البناء)
// - api/public/sounds/notification.mp3 (على السيرفر)
```

#### التحقق من التثبيت:
```bash
# بناء الويدجت
cd widget
npx vite build

# التحقق من وجود الملف
ls dist/sounds/notification.mp3

# نسخ إلى API
cd ../api
node scripts/copy-widget.js

# التحقق من النسخ
ls public/sounds/notification.mp3
```

### 2. نظام الاختبار الشامل 🧪

#### هيكل الاختبارات:

```
tests/
├── package.json                     # Dependencies
├── playwright.config.ts             # إعدادات Playwright
├── README.md                        # دليل الاستخدام
└── e2e/
    └── comprehensive.spec.ts        # الاختبارات الشاملة

api/src/
└── __tests__/
    └── api.test.ts                  # اختبارات API
```

#### الاختبارات المتوفرة:

##### A. اختبارات E2E (End-to-End)
**الملف:** `tests/e2e/comprehensive.spec.ts`

1. **اختبار المصادقة**
   - التسجيل بحساب جديد
   - تسجيل الدخول
   - التحقق من الجلسة
   - رفض البيانات غير الصحيحة

2. **اختبار الدردشة مع AI**
   - إنشاء محادثة جديدة
   - إرسال رسالة
   - استقبال رد من البوت
   - التحقق من وجود رد AI

3. **اختبار التقييمات**
   - إرسال تقييم للمحادثة
   - التحقق من حفظ التقييم
   - الحماية من التقييمات المكررة

4. **اختبار قاعدة المعرفة**
   - إضافة معرفة جديدة
   - استرجاع المعرفة
   - تحديث المعرفة
   - حذف المعرفة
   - استخدام البوت للمعرفة

5. **اختبار إحصائيات الأعمال**
   - احصائيات المحادثات
   - معدلات التحويل
   - متوسط وقت الاستجابة

6. **اختبار واجهة الويدجت**
   - تحميل الويدجت
   - فتح نافذة الدردشة
   - إرسال رسالة
   - تسجيل الدخول للمستخدم

7. **اختبار لوحة التحكم**
   - الوصول إلى الصفحة الرئيسية
   - عرض الإحصائيات
   - عرض قائمة المحادثات

8. **اختبار الأداء**
   - زمن استجابة API < 2 ثانية
   - معالجة 10 طلبات متزامنة
   - تحميل الصفحات بسرعة

9. **اختبار الأمان**
   - الحماية من SQL Injection
   - الحماية من XSS
   - Rate Limiting
   - التحقق من الصلاحيات

10. **اختبار استمرارية الجلسة**
    - حفظ الجلسة في localStorage
    - استعادة الجلسة بعد التحديث
    - استعادة رسائل المحادثة

11. **اختبار التكامل الكامل**
    - سيناريو كامل: تسجيل → دردشة → تقييم
    - تكامل جميع المكونات

##### B. اختبارات API Unit Tests
**الملف:** `api/src/__tests__/api.test.ts`

1. **Auth Endpoints**
   - POST /api/auth/register
   - POST /api/auth/login
   - GET /api/auth/user

2. **Chat Endpoints**
   - POST /api/chat/conversations
   - POST /api/chat/conversations/:id/messages
   - GET /api/chat/conversations/:id

3. **Knowledge Base**
   - POST /api/knowledge
   - GET /api/knowledge
   - PUT /api/knowledge/:id
   - DELETE /api/knowledge/:id

4. **Business API**
   - GET /api/business/stats
   - GET /api/business/conversations
   - GET /api/business/analytics

5. **Performance Tests**
   - Response time benchmarks
   - Concurrent request handling
   - Load testing

6. **Security Tests**
   - SQL Injection protection
   - XSS protection
   - Rate limiting
   - Authentication validation

## 🚀 كيفية تشغيل الاختبارات

### الخطوة 1: تثبيت المتطلبات

```bash
# في مجلد tests
cd tests
npm install

# تثبيت Playwright browsers
npx playwright install
```

### الخطوة 2: إعداد البيئة

تأكد من تشغيل API و Web Server:

```bash
# Terminal 1: API Server
cd api
npm run dev

# Terminal 2: Web Server
cd web
npm run dev
```

### الخطوة 3: تشغيل الاختبارات

#### اختبارات E2E (Playwright)

```bash
cd tests

# تشغيل جميع الاختبارات
npm test

# تشغيل مع واجهة مرئية (UI Mode)
npm run test:ui

# تشغيل مع عرض المتصفح
npm run test:headed

# تشغيل في وضع التصحيح
npm run test:debug

# تشغيل اختبار محدد
npx playwright test -g "يجب أن يسجل مستخدم جديد"
```

#### اختبارات API Unit Tests

```bash
cd api

# تشغيل جميع اختبارات API
npm test

# تشغيل اختبارات محددة
npm test -- --testNamePattern="Chat API"

# تشغيل مع تغطية
npm test -- --coverage
```

#### تشغيل جميع الاختبارات

```bash
cd tests
npm run test:all
```

### الخطوة 4: عرض النتائج

```bash
# عرض تقرير HTML للاختبارات
npm run test:report

# سيفتح متصفح يعرض التقرير التفاعلي
```

## 📊 قراءة نتائج الاختبارات

### نجاح الاختبارات ✅

```
✓ Auth Flow > يجب أن يسجل مستخدم جديد (1.2s)
✓ Chat with AI > يجب أن يرسل رسالة ويستقبل رد (2.5s)
✓ Rating System > يجب أن يقيم المحادثة (0.8s)

11 passed (15s)
```

### فشل الاختبارات ❌

```
✗ Chat with AI > يجب أن يرسل رسالة ويستقبل رد (timeout)
  Error: Timeout 30000ms exceeded
  at ...
```

في حالة الفشل:
1. تحقق من السجلات في `test-results/`
2. افتح screenshots في `test-results/`
3. شاهد videos في `test-results/`

## 🔍 تصحيح الأخطاء

### مشاكل الاتصال

```bash
# تحقق من أن الخوادم تعمل
curl http://localhost:3001/api/health
curl http://localhost:3000
```

### مشاكل البيانات

```bash
# إعادة تعيين قاعدة البيانات
cd api
npx prisma migrate reset --force
npx prisma generate
```

### مشاكل الاختبارات

```bash
# تشغيل بوضع verbose
npm test -- --debug

# تشغيل اختبار واحد فقط
npx playwright test tests/e2e/comprehensive.spec.ts:25
```

## 📈 معايير النجاح

### الأداء
- ⚡ API Response Time: < 2 ثوانٍ
- 🔄 Concurrent Requests: 10+ في نفس الوقت
- 📄 Page Load: < 3 ثوانٍ

### الجودة
- ✅ Test Pass Rate: 100%
- 📊 Code Coverage: > 80%
- 🐛 Zero Critical Bugs

### الأمان
- 🔒 SQL Injection: محمي
- 🛡️ XSS Protection: محمي
- ⏱️ Rate Limiting: مفعّل
- 🔐 Authentication: آمن

## 🎯 التغطية الحالية

### المكونات المختبرة:
- ✅ Authentication System
- ✅ Chat & AI Integration
- ✅ Rating System
- ✅ Knowledge Base
- ✅ Business Analytics
- ✅ Widget UI
- ✅ Dashboard UI
- ✅ Session Management
- ✅ Performance Optimization
- ✅ Security Measures

### APIs المختبرة:
- ✅ /api/auth/* (Register, Login, User)
- ✅ /api/chat/* (Conversations, Messages)
- ✅ /api/knowledge/* (CRUD)
- ✅ /api/business/* (Stats, Analytics)
- ✅ /api/rating/* (Submit, Get)

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      
      - name: Install dependencies
        run: |
          cd tests && npm install
          npx playwright install
          
      - name: Run API Tests
        run: cd api && npm test
        
      - name: Run E2E Tests
        run: cd tests && npm test
        
      - name: Upload test results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results/
```

## 📝 إضافة اختبارات جديدة

### مثال: إضافة اختبار جديد

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ request }) => {
    // Arrange
    const testData = { name: 'Test' };
    
    // Act
    const response = await request.post(`${API_URL}/endpoint`, {
      data: testData
    });
    
    // Assert
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## 🎨 أفضل الممارسات

1. **اكتب اختبارات واضحة**
   ```typescript
   // ❌ سيء
   test('test1', async () => { ... });
   
   // ✅ جيد
   test('يجب أن يسجل مستخدم جديد بنجاح', async () => { ... });
   ```

2. **استقلالية الاختبارات**
   ```typescript
   // كل اختبار يجب أن ينظف بعد نفسه
   test.afterEach(async () => {
     // cleanup
   });
   ```

3. **استخدم fixtures**
   ```typescript
   const fixtures = {
     testUser: {
       email: 'test@example.com',
       password: 'Test123!@#'
     }
   };
   ```

4. **اختبر السيناريوهات الحقيقية**
   ```typescript
   // لا تختبر فقط الحالات الناجحة
   test('يجب أن يرفض بريد إلكتروني غير صحيح', async () => {
     // test error cases
   });
   ```

## 📞 الدعم والمساعدة

### مشاكل شائعة:

**1. الاختبارات تفشل بسبب timeout**
```bash
# زد الوقت في playwright.config.ts
timeout: 60000
```

**2. لا يمكن الاتصال بالـ API**
```bash
# تحقق من أن السيرفر يعمل
cd api && npm run dev
```

**3. البيانات التجريبية لا تُحذف**
```bash
# استخدم afterAll hook
afterAll(async () => {
  // delete test data
});
```

## 📚 مصادر إضافية

- [Playwright Documentation](https://playwright.dev)
- [Jest Documentation](https://jestjs.io)
- [Supertest Documentation](https://github.com/ladjs/supertest)

---

## ✨ الخلاصة

الآن لديك:
1. ✅ ملف صوت محلي في المشروع (لا يعتمد على روابط خارجية)
2. ✅ نظام اختبار شامل ومتكامل
3. ✅ 40+ اختبار يغطي جميع الوظائف
4. ✅ اختبارات أداء وأمان
5. ✅ توثيق كامل لكيفية الاستخدام

**تم بحمد الله! 🎉**

---
**آخر تحديث:** 21 ديسمبر 2025
**الإصدار:** 2.0.0
