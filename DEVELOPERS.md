# 🔧 Fahimo V2 - تعليمات المطورين

## 🎯 قواعد التطوير

### ❌ ممنوع منعاً باتاً:

1. **لا تنشئ ملفات مكررة**
   - إذا كان الملف موجود، قم بتعديله
   - لا تنشئ `service-v2.ts` أو `service.new.ts`
   
2. **لا ترفع `.env` إلى Git**
   - جميع المفاتيح السرية في `.env`
   - استخدم `.env.example` للتوثيق فقط

3. **لا تكتب API Keys في الكود**
   ```typescript
   // ❌ خطأ
   const apiKey = "sk-abc123...";
   
   // ✅ صحيح
   const apiKey = process.env.GROQ_API_KEY;
   ```

4. **لا تستخدم `any` في TypeScript**
   ```typescript
   // ❌ خطأ
   function process(data: any) { }
   
   // ✅ صحيح  
   function process(data: Message) { }
   ```

---

## 📂 هيكل المشروع

```
api/
├── src/
│   ├── controllers/      # Request handlers (تعامل مع HTTP requests)
│   ├── services/         # Business logic (المنطق الأساسي)
│   ├── middleware/       # Security & validation
│   ├── routes/           # API endpoints
│   ├── utils/            # Helper functions
│   └── types/            # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
└── package.json
```

---

## 🔨 إضافة ميزة جديدة

### 1. إنشاء Service (مثال: SMS)

```typescript
// api/src/services/sms.service.ts
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

class SMSService {
  async sendSMS(phone: string, message: string) {
    try {
      logger.info(`Sending SMS to ${phone}`);
      
      // Your logic here
      
      // Cache if needed
      await cacheService.set(`sms:${phone}`, 'sent', 300);
      
      return { success: true };
    } catch (error: any) {
      logger.error('SMS send failed:', error);
      throw new Error('SMS send failed');
    }
  }
}

export default new SMSService();
```

### 2. إنشاء Controller

```typescript
// api/src/controllers/sms.controller.ts
import { Request, Response } from 'express';
import smsService from '../services/sms.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export class SMSController {
  send = asyncHandler(async (req: Request, res: Response) => {
    const { phone, message } = req.body;
    
    const result = await smsService.sendSMS(phone, message);
    
    res.json(result);
  });
}
```

### 3. إنشاء Routes

```typescript
// api/src/routes/sms.routes.ts
import { Router } from 'express';
import { SMSController } from '../controllers/sms.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const controller = new SMSController();

router.post('/send', authenticateToken, apiLimiter, controller.send);

export default router;
```

### 4. تسجيل في index.ts

```typescript
// api/src/index.ts
import smsRoutes from './routes/sms.routes.js';

app.use('/api/sms', apiLimiter, smsRoutes);
```

---

## 🗄️ التعامل مع Database

### إضافة Model جديد

```prisma
// prisma/schema.prisma
model SMSLog {
  id String @id @default(uuid())
  phone String
  message String
  status String @default("pending")
  sentAt DateTime?
  createdAt DateTime @default(now())
  
  @@map("sms_logs")
}
```

### تطبيق التغييرات

```bash
# Create migration
npm run db:migrate

# Generate Prisma Client
npm run db:generate
```

### استخدام في الكود

```typescript
await prisma.sMSLog.create({
  data: {
    phone,
    message,
    status: 'sent',
    sentAt: new Date(),
  }
});
```

---

## 🔄 إضافة Background Job

```typescript
// في api/src/worker.ts
queueService.createWorker('sms', async (job) => {
  const { phone, message } = job.data;
  
  await smsService.sendSMS(phone, message);
  
  return { success: true };
});

// في service
await queueService.addJob('sms', 'send-sms', { phone, message });
```

---

## 🧪 Testing

### Unit Test مثال

```typescript
// api/src/services/__tests__/sms.service.test.ts
import smsService from '../sms.service';

describe('SMSService', () => {
  it('should send SMS successfully', async () => {
    const result = await smsService.sendSMS('+1234567890', 'Test');
    expect(result.success).toBe(true);
  });
});
```

### تشغيل Tests

```bash
npm test                    # All tests
npm test sms.service       # Specific test
```

---

## 🔍 Debugging

### 1. Logger استخدام

```typescript
import logger from '../utils/logger.js';

logger.info('Processing started', { userId: '123' });
logger.warn('Rate limit approaching');
logger.error('Failed to send', error);
logger.debug('Debug info', data);
```

### 2. مراقبة Redis

```bash
# Connect to Redis CLI
redis-cli -h redis-host -p 12651 -a password

# View keys
KEYS *

# Get value
GET key_name
```

### 3. مراقبة Queues

```typescript
const queue = queueService.getQueue('sms');
const jobs = await queue.getJobs(['waiting', 'active']);
console.log(jobs);
```

---

## 🚀 Best Practices

### 1. Error Handling

```typescript
// ✅ استخدم asyncHandler
export const myHandler = asyncHandler(async (req, res) => {
  // سيتم التعامل مع الأخطاء تلقائياً
});

// ✅ أو try-catch مع logger
try {
  await doSomething();
} catch (error: any) {
  logger.error('Operation failed:', error);
  throw new AppError('Friendly message', 500);
}
```

### 2. Validation

```typescript
// استخدم Zod للتحقق
import { z } from 'zod';

const schema = z.object({
  phone: z.string().regex(/^\+\d{10,15}$/),
  message: z.string().min(1).max(160),
});

const validated = schema.parse(req.body);
```

### 3. Caching

```typescript
// Cache expensive operations
const cacheKey = `user:${userId}:profile`;
const cached = await cacheService.get(cacheKey);

if (cached) return JSON.parse(cached);

const data = await fetchExpensiveData();
await cacheService.set(cacheKey, JSON.stringify(data), 3600);
```

### 4. Prisma Transactions

```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id }, data: { ... } });
  await tx.log.create({ data: { ... } });
});
```

---

## 📦 إضافة Package جديد

```bash
# Install
cd api
npm install package-name

# Install dev dependency
npm install -D @types/package-name

# Update lock file
npm install
```

**ملاحظة**: تأكد من إضافة types إذا كان TypeScript

---

## 🔐 Security Checklist

قبل كل Commit:

- [ ] لا توجد API keys في الكود
- [ ] جميع inputs مُصفّاة (sanitized)
- [ ] استخدام parameterized queries
- [ ] rate limiting مُفعّل
- [ ] CSRF protection للـ POST/PUT/DELETE
- [ ] Authentication & Authorization صحيحة
- [ ] Logs لا تحتوي على بيانات حساسة

---

## 📝 Commit Messages

```bash
# Format
type(scope): description

# أمثلة
feat(api): add SMS notification service
fix(auth): resolve JWT expiry issue
docs(readme): update deployment guide
refactor(cache): optimize Redis connection
test(sms): add unit tests for SMSService
```

---

## 🔄 Git Workflow

```bash
# 1. إنشاء branch
git checkout -b feature/sms-integration

# 2. التطوير والاختبار
npm test
npm run build

# 3. Commit
git add .
git commit -m "feat(sms): add SMS notification service"

# 4. Push
git push origin feature/sms-integration

# 5. Pull Request على GitHub
```

---

## 🌐 Environment Variables

### إضافة متغير جديد:

1. أضف في `.env`:
   ```
   NEW_API_KEY=your-key-here
   ```

2. وثّق في `.env.example`:
   ```
   NEW_API_KEY=your-api-key
   ```

3. استخدم في الكود:
   ```typescript
   const apiKey = process.env.NEW_API_KEY;
   if (!apiKey) throw new Error('NEW_API_KEY not configured');
   ```

---

## 🎓 موارد مفيدة

- [Prisma Docs](https://www.prisma.io/docs)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Redis Commands](https://redis.io/commands)
- [BullMQ Guide](https://docs.bullmq.io/)

---

## ❓ أسئلة شائعة

**س: كيف أضيف AI provider جديد؟**
ج: عدّل `ai.service.ts`، أضف method جديد مثل `callNewProvider()`

**س: كيف أغير database schema؟**
ج: عدّل `prisma/schema.prisma` ثم `npm run db:migrate`

**س: كيف أختبر API locally؟**
ج: استخدم Postman أو cURL:
```bash
curl -X POST http://localhost:3001/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","message":"Test"}'
```

---

**آخر تحديث**: December 20, 2025
**للمطورين فقط** - لا تشارك هذا الملف خارج الفريق
