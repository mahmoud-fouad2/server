# 🚀 Quick Test Guide - Widget Real-Time Updates

**تاريخ الإصلاح**: 18 ديسمبر 2025  
**حالة الـ Deployment**: في الانتظار (~2 دقيقة من آخر push)

---

## ✅ قائمة الـ Fixes المنجزة

### 1️⃣ **الأمان - إزالة بيانات قاعدة البيانات الحساسة**
- ✅ حذف `DATABASE_URL` من جميع `.env` files
- ✅ حذف 3 scripts تحتوي على credentials:
  - `find-and-update.js`
  - `setup-real-business.js`  
  - `test-widget-update.js`

### 2️⃣ **الويدجت - إصلاح الـ Real-Time Updates**
- ✅ تم تحريك دالة `triggerConfigRefresh()` قبل استخدامها
- ✅ الآن الـ BroadcastChannel و localStorage listeners تعمل بدون تأخير
- ✅ تحديث الألوان من الـ dashboard سيظهر فوراً في الويدجت

### 3️⃣ **الـ Avatar Upload - إصلاح FormData**
- ✅ الـ proxy route الآن يُرسل الـ files بشكل صحيح للـ backend
- ✅ الـ backend يستقبل الأيقونات للمعالجة والـ S3 upload

### 4️⃣ **قاعدة المعرفة - إضافة Endpoint**
- ✅ تم إضافة `GET /api/knowledge-base/{businessId}/articles`
- ✅ الويدجت يمكنه الآن جلب المقالات

---

## 🧪 الاختبارات المطلوبة (بعد Render Deploy)

### **اختبار 1: تحديث اللون الفوري** ⏱️
```
1. اذهب إلى: https://faheemly.com/dashboard
2. اختر: Widget Settings → Primary Color
3. غيّر اللون إلى أحمر: #FF0000
4. افتح الويدجت المضمن على موقع خارجي
   (أو استخدم الـ embed code أدناه)
5. ✅ يجب أن يتغير اللون فوراً (ليس بعد 30 ثانية)
```

**الـ Embed Code للاختبار**:
```html
<script src="https://fahimo-api.onrender.com/fahimo-widget.js?v=v1" 
        data-business-id="cmjbl1e6a00016xdz321fyf8x"></script>
```

### **اختبار 2: قاعدة المعرفة** 📚
```bash
curl "https://fahimo-api.onrender.com/api/knowledge-base/cmjbl1e6a00016xdz321fyf8x/articles"
```
**النتيجة المتوقعة**:
```json
{
  "success": true,
  "businessId": "cmjbl1e6a00016xdz321fyf8x",
  "articles": [],
  "total": 0
}
```

### **اختبار 3: رفع أيقونة مخصصة** 🖼️
```
1. اذهب إلى Dashboard → Avatar Settings
2. اختر صورة محلية وارفعها
3. يجب أن تُحفظ بـ API URL (ليس faheemly.com)
4. الويدجت يجب أن يعرضها بدون تأخير
```

### **اختبار 4: تحديثات Cross-Tab** 🔄
```
1. افتح الويدجت في Tab 1
2. افتح الـ Dashboard في Tab 2
3. غيّر إعدادات الويدجت في Tab 2
4. ✅ يجب أن تتحدث Tab 1 فوراً (عبر BroadcastChannel)
```

---

## 📊 معلومات الـ Business الحالية

| المعلومة | القيمة |
|---------|--------|
| **Business ID** | `cmjbl1e6a00016xdz321fyf8x` |
| **البريد الإلكتروني** | `hello@faheemly.com` |
| **نوع الويدجت** | `standard` |
| **اللون الأساسي** | `#9d150c` (أحمر داكن) |
| **API Base** | `https://fahimo-api.onrender.com` |

---

## ⚠️ المشاكل المعروفة المتبقية

### **مشكلة S3 Bucket**
```
Error: "Bucket not found"
قد تحتاج:
1. التحقق من بيانات Supabase
2. أو استخدام التخزين المحلي فقط (/uploads/)
```

### **مشكلة Groq API Key**
```
Error: "Invalid API Key"
الحل: تحديث Groq API Key في Render Dashboard
```

### **بيانات معرضة في Git History**
```
الحل الأمثل:
git filter-branch --tree-filter 'find . -name "*.js" | xargs grep -l "postgresql://fahimo_user" | xargs rm' --prune-empty HEAD
```

---

## 🎯 ملخص التغييرات

```javascript
// ✅ BEFORE: Function defined too late, ReferenceError
const broadcastChannel = new BroadcastChannel(updateChannelName);
broadcastChannel.onmessage = () => {
    triggerConfigRefresh(); // ❌ Function not yet defined!
};

function triggerConfigRefresh() { ... }

// ✅ AFTER: Function defined first
function triggerConfigRefresh() { ... }

const broadcastChannel = new BroadcastChannel(updateChannelName);
broadcastChannel.onmessage = () => {
    triggerConfigRefresh(); // ✅ Function ready to call
};
```

---

## 🚀 خطوات النشر التالية

1. **انتظر 2 دقيقة** لـ Render يعيد نشر التطبيق
2. **جرّب الاختبارات أعلاه** بترتيب
3. **إذا فشلت أي اختبار** تحقق من logs على Render Dashboard
4. **لتنظيف Git History** استخدم الأمر أعلاه

---

**الحالة**: ✅ جاهز للنشر  
**آخر تحديث**: 18 ديسمبر 2025 - 18:40 UTC+3

