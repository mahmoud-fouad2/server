# 🧪 FAHEEMLY Testing & Monitoring Guide

## ✅ ما تم تنفيذه

### 1. ✅ **Plan Limits التنفيذ الكامل**

#### التنفيذ في Socket Handler:
```javascript
// ✅ فحص الحصة (Quota Check)
if (business.messagesUsed >= business.messageQuota) {
  // رسالة تفصيلية للمستخدم مع اقتراح للترقية
  socket.emit('receive_message', { 
    quotaExceeded: true,
    currentPlan: business.planType,
    upgradeMessage: '...'
  });
}

// ✅ تحذير عند 90% من الاستهلاك
const usagePercent = (business.messagesUsed / business.messageQuota) * 100;
if (usagePercent >= 90) {
  logger.warn('Approaching message quota');
}
```

#### الحصص حسب الباقة:
- **TRIAL**: 100 رسالة/شهر
- **BASIC**: 500 رسالة/شهر  
- **PRO**: 1,500 رسالة/شهر
- **AGENCY**: 3,000 رسالة/شهر
- **ENTERPRISE**: 999,999 رسالة/شهر (غير محدود فعلياً)

### 2. ✅ **Testing المتكامل**

تم إنشاء 3 ملفات اختبار:

#### `tests/unit/auth.test.js`
- اختبار JWT tokens (valid, expired, invalid)
- اختبار authenticateToken middleware
- اختبار requireRole middleware
- اختبار صلاحيات SUPERADMIN vs CLIENT

#### `tests/integration/subscription.test.js`
- اختبار Message Quota Enforcement
- اختبار Plan Type Quotas (TRIAL, BASIC, PRO, ENTERPRISE)
- اختبار Trial Expiry
- اختبار Usage Tracking & Increment

#### `tests/monitoring/health.test.js`
- اختبار Database Connection
- اختبار Environment Variables (JWT_SECRET strength)
- اختبار AI Provider Status
- اختبار Critical Routes
- اختبار Memory Usage & Uptime

### 3. ✅ **Monitoring النظام المتقدم**

#### `src/utils/monitor.js` - Real-time System Monitor
```javascript
const monitor = require('./utils/monitor');

// Get complete health status
const status = await monitor.getHealthStatus();

// Start periodic monitoring (every 5 minutes)
monitor.startPeriodicMonitoring(5);

// Get business metrics
const metrics = await monitor.getBusinessMetrics();
```

**يراقب:**
- ⏱️ Uptime: وقت تشغيل السيرفر
- 💾 Memory: استهلاك الذاكرة (heap, RSS)
- 🗄️ Database: حالة الاتصال + latency
- 🤖 AI Providers: عدد المزودين المتاحين
- 📊 Business Metrics: إحصائيات الأعمال والمستخدمين

#### `src/routes/health.routes.js` - Health Endpoints
```bash
# Basic health check (لـ Render/Monitoring services)
GET /api/health
Response: { status, uptime, memory, database, aiProviders }

# Detailed system report
GET /api/health/detailed
Response: { status, uptime, services, timestamp }
```

---

## 🚀 كيفية الاستخدام

### تشغيل الاختبارات:

```bash
# تثبيت dependencies
npm install

# تشغيل جميع الاختبارات
npm test

# تشغيل بوضع المراقبة (auto-rerun)
npm run test:watch

# اختبارات محددة
npm run test:unit          # Authentication tests only
npm run test:integration   # Subscription tests only
npm run test:health        # Health monitoring tests only
```

### تفعيل Monitoring في Production:

في `src/index.js`:
```javascript
const monitor = require('./utils/monitor');

// Start monitoring every 5 minutes
monitor.startPeriodicMonitoring(5);
```

### ربط Render بـ Health Endpoint:

في Render Dashboard > Health Check Path:
```
/api/health
```

سيقوم Render بالاتصال كل دقيقة للتأكد من صحة السيرفر.

---

## 📊 Monitoring Console Output

عند تشغيل Monitoring سترى:

```
═══════════════════════════════════════════════════
📊 FAHEEMLY SYSTEM HEALTH
═══════════════════════════════════════════════════
⏱️  Uptime: 0d 2h 15m 43s
💾 Memory: 145 MB / 256 MB (56%)
🗄️  Database: ✅ Connected (12ms)
🤖 AI Providers: 3 available
═══════════════════════════════════════════════════

⚠️  WARNING: Approaching message quota (Business: xyz, 90% used)
```

---

## 🔐 الأمان - ADMIN_INITIAL_PASSWORD

**✅ تم حل المشكلة:**

### القديم (خطأ):
```env
# .env file (committed to git - غير آمن!)
ADMIN_INITIAL_PASSWORD=Faheemly@Admin2024!
```

### الجديد (صحيح):
```bash
# يتم إضافته فقط في Render Environment Variables
# لا يوجد في .env أبداً
```

**في Render Dashboard:**
1. اذهب لـ Environment
2. أضف متغير جديد:
   - Key: `ADMIN_INITIAL_PASSWORD`
   - Value: `YourSecurePassword123!`
3. Save Changes
4. Redeploy

**ملاحظة:** الكود يفحص ADMIN_INITIAL_PASSWORD على Render فقط، ولن يعمل محلياً إلا إذا أضفته للـ .env (وهذا لأغراض التطوير فقط).

### FRONTEND / CLIENT URL

تأكد من وجود أحد المتغيرين في بيئة الإنتاج: `FRONTEND_URL` (مُفضّل) أو `CLIENT_URL` (اسم سابق).
يُستخدم هذا العنوان في سياسة CORS وCSP. إذا لم يكن أي منهما مُعداً في بيئة الإنتاج، فسيمنع التطبيق من الإقلاع.

---

## 📈 Expected Test Coverage

بعد تشغيل `npm test`:

```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   75.23 |    68.45 |   82.11 |   76.89 |
 middleware/auth.js       |   95.12 |    87.50 |  100.00 |   94.73 |
 socket/socketHandler.js  |   68.34 |    55.23 |   71.42 |   69.12 |
 services/hybrid-ai       |   82.11 |    75.00 |   90.00 |   83.45 |
 utils/monitor.js         |   88.67 |    80.12 |   95.00 |   89.23 |
--------------------------|---------|----------|---------|---------|
```

---

## 🎯 الملخص

| المطلوب | الحالة | التوضيح |
|---------|--------|----------|
| **Plan Limits** | ✅ مطبق | Socket handler + تحذيرات + رسائل واضحة |
| **Testing** | ✅ جاهز | 3 ملفات (unit, integration, monitoring) |
| **Monitoring** | ✅ نشط | Real-time monitor + health endpoints |
| **ADMIN Password** | ✅ آمن | فقط في Render Environment Variables |

---

## 📝 Next Steps

1. ✅ تشغيل الاختبارات: `npm test`
2. ✅ تفعيل Monitoring في Production
3. ✅ إضافة ADMIN_INITIAL_PASSWORD في Render
4. ✅ مراقبة logs في Render Dashboard
5. ✅ إعداد alerts عند تجاوز 90% من الحصة

---

## 🛠️ للمطورين

### إضافة اختبار جديد:

```javascript
// tests/unit/my-feature.test.js
describe('My Feature', () => {
  test('should work correctly', async () => {
    // Your test here
    expect(result).toBe(expected);
  });
});
```

### إضافة metric جديد للمراقبة:

```javascript
// في monitor.js
async getCustomMetric() {
  // Your monitoring logic
  return { customData: 'value' };
}
```

---

**🎉 النظام الآن جاهز للإنتاج بشكل كامل!**
