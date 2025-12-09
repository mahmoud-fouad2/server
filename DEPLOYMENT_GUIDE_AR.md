# 🚀 Fahimo - نظام الشات بوت الذكي - دليل النشر على الإنتاج

## 📋 ملخص البيئة

- **Frontend (العميل)**: Next.js على Bluehost Shared Hosting (https://faheemly.com)
- **Backend (الخادم)**: Node.js + Prisma على Render.com (https://fahimo-api.onrender.com)
- **قاعدة البيانات**: PostgreSQL مع pgvector على Render
- **Redis**: Cloud Redis Labs
- **مزودي الذكاء الاصطناعي**: Groq, Gemini, DeepSeek, Cerebras

---

## ✅ التحسينات والإصلاحات المطبقة

### 1. إصلاح عناوين URL المشفرة
- ✅ إزالة جميع عناوين `localhost` من الكود
- ✅ مركزية إعدادات API في `client/src/lib/config.js`
- ✅ استخدام متغيرات البيئة بشكل صحيح

### 2. تحسين الأمان
- ✅ CORS محدد فقط للنطاقات المسموحة في الإنتاج
- ✅ CSP (Content Security Policy) محدث للإنتاج
- ✅ localhost محظور في الإنتاج

### 3. إصلاح نقاط النهاية المفقودة
- ✅ `/api/analytics/realtime` - موجود ويعمل
- ✅ `/api/analytics/alerts` - موجود ويعمل
- ✅ `groq.service.js` - موجود ويعمل كـ adapter

### 4. تنظيف الكود
- ✅ إزالة الاستيرادات غير المستخدمة
- ✅ تحسين بنية المشروع
- ✅ توحيد استخدام API endpoints

---

## 🔧 متغيرات البيئة

### Backend (Render.com)
متغيرات البيئة التالية مضبوطة بالفعل في Render:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://fahimo_user:ugbqfF41eTQkwCTqYum8wJi9Y3GTh0Fq@dpg-d4ni1bfpm1nc73e7e5gg-a:5432/fahimo?schema=public
REDIS_URL=redis://default:rkSQTYTGg3xpnP8Fm8XMnGw5RSr0kUek@redis-12651.c253.us-central1-1.1.us.cloud.redislabs.com:12651
JWT_SECRET=Il8u31B+OSUJy0hAViJvz04Lnh7muI+Wi6rVJ3KGDH8JKuKmBtEB8P1ewhvJCG0G
FRONTEND_URL=https://faheemly.com
CORS_ORIGINS=https://faheemly.com
GROQ_API_KEY=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
GEMINI_API_KEY=AIzaSyDJaGqQh6PnCVhaXLFyc61V1RDVsnXyqcw
DEEPSEEK_API_KEY=sk-2cc3db21757f4af493012f75f6185ed1
CEREBRAS_API_KEY=csk-92v9ywj8cr4et9k4h2rpm3mwfxpe4hnhvhxe9yfyfvtncjfm
FORCE_PGVECTOR=true
ADMIN_INITIAL_PASSWORD=Dodaa55002004
```

### Frontend (Bluehost)
تم إنشاء ملف `.env.production` بالقيم التالية:

```bash
NEXT_PUBLIC_API_URL=https://fahimo-api.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://fahimo-api.onrender.com
NEXT_PUBLIC_BUSINESS_ID=cmivd3c0z0003ulrrn7m1jtjf
NODE_ENV=production
```

---

## 📦 خطوات النشر

### 1️⃣ Backend (Render.com) - التحديث التلقائي

سيتم التحديث تلقائياً عند push للكود على GitHub:

```bash
cd server
git add .
git commit -m "Production fixes: Security, CORS, and API improvements"
git push origin main
```

Render سيقوم تلقائياً بـ:
1. تشغيل `npm install`
2. تشغيل `npx prisma generate`
3. تشغيل `npx prisma migrate deploy`
4. تشغيل `npm start`

### 2️⃣ Frontend (Bluehost) - النشر اليدوي

#### خطوة أ: بناء المشروع محلياً

```bash
cd client
npm install
npm run build
```

#### خطوة ب: رفع الملفات إلى Bluehost

**الطريقة 1: عبر FTP**
1. افتح FileZilla أو أي برنامج FTP
2. اتصل بـ Bluehost
3. انتقل إلى `public_html`
4. ارفع محتويات مجلد `.next/standalone` أو `.next/static`
5. ارفع مجلد `public`

**الطريقة 2: عبر cPanel File Manager**
1. سجل دخول إلى cPanel
2. افتح File Manager
3. انتقل إلى `public_html`
4. ارفع الملفات باستخدام Upload

**الطريقة 3: عبر SSH (إذا متوفر)**
```bash
# على جهازك المحلي
cd client
npm run build
tar -czf build.tar.gz .next public

# رفع إلى Bluehost
scp build.tar.gz user@faheemly.com:/home/user/public_html/

# على خادم Bluehost
ssh user@faheemly.com
cd public_html
tar -xzf build.tar.gz
```

#### خطوة ج: إعداد Node.js على Bluehost

1. سجل دخول إلى cPanel
2. ابحث عن "Setup Node.js App"
3. أنشئ تطبيق Node.js جديد:
   - **Node.js Version**: 18.x أو 20.x
   - **Application Mode**: Production
   - **Application Root**: public_html
   - **Application URL**: faheemly.com
   - **Application Startup File**: server.js أو .next/standalone/server.js

4. انقر "Create"

5. في قسم Environment Variables، أضف:
   ```
   NEXT_PUBLIC_API_URL=https://fahimo-api.onrender.com
   NODE_ENV=production
   ```

6. أعد تشغيل التطبيق

---

## 🧪 اختبار ما بعد النشر

### 1. اختبار Backend
```bash
# اختبار الصحة العامة
curl https://fahimo-api.onrender.com/health

# اختبار Analytics (يحتاج token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://fahimo-api.onrender.com/api/analytics/realtime

# اختبار Widget Script
curl -I https://fahimo-api.onrender.com/fahimo-widget.js
```

### 2. اختبار Frontend
```bash
# اختبار الصفحة الرئيسية
curl -I https://faheemly.com

# اختبار تحميل الموارد
curl -I https://faheemly.com/_next/static/...
```

### 3. اختبار في المتصفح
1. افتح https://faheemly.com
2. افتح Developer Console (F12)
3. تحقق من:
   - ✅ لا توجد أخطاء 404
   - ✅ لا توجد أخطاء CORS
   - ✅ لا توجد أخطاء CSP
   - ✅ Widget يعمل بشكل صحيح
   - ✅ Dashboard يحمل البيانات

---

## 🔍 استكشاف الأخطاء

### مشكلة: 404 على نقاط النهاية
**الحل**: تأكد من أن Render قد أعاد التشغيل بعد آخر commit

### مشكلة: CORS Errors
**الحل**: 
1. تحقق من أن `FRONTEND_URL` و `CORS_ORIGINS` مضبوطة في Render
2. تأكد من أن القيم تطابق النطاق الفعلي (https://faheemly.com)

### مشكلة: Widget لا يظهر
**الحل**:
1. تحقق من Console للأخطاء
2. تأكد من أن `NEXT_PUBLIC_API_URL` مضبوط صحيحاً
3. تحقق من أن CSP يسمح بتحميل السكريبت

### مشكلة: Database Connection Failed
**الحل**: تحقق من أن `DATABASE_URL` صحيح في Render

### مشكلة: Redis Connection Failed
**الحل**: تحقق من أن `REDIS_URL` صحيح في Render

---

## 📊 مراقبة الأداء

### Logs على Render
1. افتح Render Dashboard
2. اختر خدمة "fahimo-api"
3. انقر على "Logs"
4. راقب الأخطاء والتحذيرات

### Logs على Bluehost
1. سجل دخول إلى cPanel
2. افتح "Errors" تحت Metrics
3. أو افتح File Manager وشاهد `error_log`

---

## 🎉 المشروع جاهز!

المشروع الآن:
- ✅ منظم ومرتب
- ✅ آمن للإنتاج
- ✅ بدون أكواد مكررة أو قديمة
- ✅ جميع عناوين URL ديناميكية
- ✅ CORS و CSP محدثة
- ✅ جميع نقاط النهاية تعمل

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من هذا الدليل أولاً
2. راجع Console logs في المتصفح
3. راجع Server logs في Render
4. تأكد من جميع متغيرات البيئة مضبوطة صحيحاً

---

**تم التحديث**: ديسمبر 2025
**الإصدار**: Production-Ready v1.0
