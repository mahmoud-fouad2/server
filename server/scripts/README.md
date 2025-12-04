# Server Scripts

مجموعة من الأدوات المساعدة لإدارة السيرفر.

## 📋 Scripts المتاحة

### 1. `check-infrastructure.js`
فحص البنية التحتية (Redis، pgvector، Database)

```bash
node scripts/check-infrastructure.js
```

### 2. `listBusinesses.js`
عرض قائمة الأعمال المسجلة

```bash
node scripts/listBusinesses.js
```

### 3. `create-demo-data.js`
إنشاء بيانات تجريبية للاختبار

```bash
node scripts/create-demo-data.js
```

### 4. `seed-faheemly-knowledge.js`
تعبئة قاعدة المعرفة ببيانات فهملي

```bash
node scripts/seed-faheemly-knowledge.js
```

### 5. `test-system.js`
اختبار شامل للنظام

```bash
node scripts/test-system.js
```

### 6. `post-deploy.sh`
يتم تشغيله تلقائياً بعد كل Deploy على Render

```bash
# يتم تشغيله تلقائياً
# لا حاجة للتشغيل اليدوي
```

## 🔧 الاستخدام

جميع الـ scripts تحتاج إلى متغيرات البيئة من ملف `.env`:

```bash
# تأكد من وجود .env أولاً
cp .env.example .env
# عدّل .env بالبيانات الصحيحة

# ثم شغل أي script
node scripts/<script-name>.js
```

## ⚠️ تحذيرات

- **لا تشغل `create-demo-data.js` على Production**
- **`post-deploy.sh` يشتغل أوتوماتيك على Render**
- **تأكد من backup قبل تشغيل scripts تعدل البيانات**
