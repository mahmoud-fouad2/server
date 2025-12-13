# تحسينات نظام CRM ونظام الدفع

## ✅ ما تم إنجازه

### 1. تطوير نظام CRM

#### Backend Enhancements:
- ✅ **تطوير `crm.service.js`**:
  - إضافة `getCrmStats()` - إحصائيات شاملة
  - إضافة `getLeadsByActivityType()` - تصفية حسب نوع النشاط
  - إضافة `getActivityKeywords()` - كلمات مفتاحية حسب النشاط
  - إضافة `bulkUpdateLeads()` - تحديث جماعي
  - إضافة `deleteLead()` - حذف عميل
  - إضافة `getLeadById()` - الحصول على عميل محدد

- ✅ **تطوير `crm.routes.js`**:
  - GET `/api/crm/stats` - إحصائيات CRM
  - GET `/api/crm/leads/:id` - تفاصيل عميل
  - PUT `/api/crm/leads/:id` - تحديث عميل
  - DELETE `/api/crm/leads/:id` - حذف عميل
  - POST `/api/crm/leads/bulk-update` - تحديث جماعي
  - GET `/api/admin/crm/leads` - جميع العملاء (Super Admin)
  - GET `/api/admin/crm/stats` - إحصائيات شاملة (Super Admin)

- ✅ **إضافة `admin-crm.routes.js`**:
  - GET `/api/admin/crm/businesses` - جميع الأعمال مع حالة CRM
  - PUT `/api/admin/crm/businesses/:id/toggle` - تفعيل/تعطيل CRM
  - PUT `/api/admin/crm/businesses/:id/pre-chat` - تفعيل/تعطيل Pre-chat Form
  - GET `/api/admin/crm/leads` - جميع العملاء مع فلاتر متقدمة
  - GET `/api/admin/crm/stats` - إحصائيات شاملة
  - DELETE `/api/admin/crm/leads/:id` - حذف عميل
  - POST `/api/admin/crm/leads/bulk-delete` - حذف جماعي

#### Features:
- ✅ **ترتيب وسحب بيانات العملاء**:
  - تصدير CSV
  - تصفية حسب التاريخ
  - بحث متقدم
  - ترتيب حسب نوع النشاط

- ✅ **مخاطبة كل زائر حسب نوع النشاط**:
  - `generateRequestSummary()` - ملخص ديناميكي حسب النشاط
  - `getActivityKeywords()` - كلمات مفتاحية لكل نشاط
  - `getLeadsByActivityType()` - تصفية حسب النشاط

- ✅ **ربط CRM بالادمن**:
  - Super Admin يمكنه تفعيل/تعطيل CRM لأي عمل
  - Super Admin يمكنه تفعيل/تعطيل Pre-chat Form
  - Super Admin يمكنه عرض جميع العملاء
  - Super Admin يمكنه حذف وتحديث العملاء
  - إحصائيات شاملة لجميع الأعمال

### 2. Pre-chat Form

#### Backend:
- ✅ **Routes موجودة**:
  - GET `/api/chat/pre-chat/:businessId` - الحصول على إعدادات النموذج
  - POST `/api/chat/pre-chat/:businessId` - إرسال بيانات النموذج

#### Frontend (Widget):
- ✅ **Pre-chat Form في الويدجت**:
  - نموذج جميل ومتجاوب
  - حقول: الاسم (مطلوب)، البريد الإلكتروني (اختياري)، الهاتف (اختياري)، الطلب (مطلوب)
  - التحقق من البيانات
  - حفظ البيانات في localStorage
  - ربط تلقائي مع CRM

#### Settings:
- ✅ **`preChatFormEnabled`**:
  - متاح في الخطوة الأولى (يمكن تفعيله/تعطيله)
  - يمكن تفعيله من Dashboard
  - Super Admin يمكنه تفعيله لأي عمل

- ✅ **`crmLeadCollectionEnabled`**:
  - متاح فقط للأدمن (Super Admin)
  - متاح في أكبر باقة (ENTERPRISE)
  - يتم تفعيله من Admin Panel

### 3. نظام الدفع

#### Backend:
- ✅ **Payment Service** (`payment.service.js`):
  - دعم Stripe, Paymob, Paytabs, PayPal
  - تشفير API keys
  - Webhook handling
  - تحديث الكوتا والباقات تلقائياً

- ✅ **Payment Routes**:
  - GET `/api/payments/gateways` - بوابات الدفع المتاحة
  - POST `/api/payments/create` - إنشاء payment intent
  - GET `/api/payments/:id` - تفاصيل الدفع
  - GET `/api/payments` - تاريخ المدفوعات

- ✅ **Admin Payment Routes**:
  - GET `/api/admin/payments/gateways` - جميع البوابات
  - POST `/api/admin/payments/gateways` - إضافة/تحديث بوابة
  - PATCH `/api/admin/payments/gateways/:id/toggle` - تفعيل/تعطيل
  - DELETE `/api/admin/payments/gateways/:id` - حذف بوابة
  - POST `/api/admin/payments/create-custom` - مدفوع مخصص

#### Frontend:
- ✅ **Payment API** (`api.js`):
  - `paymentApi.getGateways()` - الحصول على البوابات
  - `paymentApi.createPayment()` - إنشاء دفع
  - `paymentApi.getPayment()` - تفاصيل الدفع
  - `paymentApi.getPayments()` - تاريخ المدفوعات

### 4. Database Schema

- ✅ **Payment Models**:
  - `PaymentGateway` - إدارة بوابات الدفع
  - `Payment` - سجلات المدفوعات
  - `Subscription` - الاشتراكات

- ✅ **CRM Models**:
  - `CrmLead` - بيانات العملاء
  - Relations مع `Business` و `Conversation`

---

## 📋 ما يحتاج إلى إكمال

### 1. Frontend Components للدفع
- [ ] صفحة الدفع في Dashboard (`/dashboard/payment`)
- [ ] Admin Panel لإدارة بوابات الدفع
- [ ] صفحة نجاح/فشل الدفع
- [ ] عرض تاريخ المدفوعات

### 2. Frontend Components لـ CRM
- [ ] تحسين `CrmView.jsx`:
  - إضافة إحصائيات متقدمة
  - إضافة فلاتر حسب نوع النشاط
  - إضافة Bulk operations
  - إضافة Export متقدم

### 3. إضافة المميزات في صفحة الأسعار والرئيسية
- [ ] إضافة Pre-chat Form في صفحة الأسعار
- [ ] إضافة CRM features في صفحة الأسعار
- [ ] إضافة Payment features في صفحة الأسعار
- [ ] تحديث LandingPage لعرض المميزات الجديدة

### 4. Database Migration
```bash
cd server
npx prisma migrate dev --name add_payment_and_crm_enhancements
npx prisma generate
```

---

## 🔧 كيفية الاستخدام

### 1. تفعيل Pre-chat Form (Customer)

```javascript
PUT /api/business/pre-chat-settings
{
  "preChatFormEnabled": true
}
```

### 2. تفعيل CRM (Super Admin)

```javascript
PUT /api/admin/crm/businesses/:businessId/toggle
{
  "enabled": true
}
```

### 3. إنشاء دفع (Customer)

```javascript
POST /api/payments/create
{
  "amount": 99,
  "currency": "SAR",
  "planType": "START",
  "messageQuota": 1000,
  "gatewayId": "gateway-id"
}
```

### 4. إدارة بوابات الدفع (Super Admin)

```javascript
POST /api/admin/payments/gateways
{
  "provider": "STRIPE",
  "name": "Stripe",
  "apiKey": "pk_test_...",
  "secretKey": "sk_test_...",
  "isEnabled": true,
  "isActive": true
}
```

---

## 📊 إحصائيات CRM

### Customer Dashboard:
- GET `/api/crm/stats` - إحصائيات العمل
- GET `/api/crm/leads` - قائمة العملاء
- GET `/api/crm/leads/export` - تصدير CSV

### Admin Dashboard:
- GET `/api/admin/crm/stats` - إحصائيات شاملة
- GET `/api/admin/crm/leads` - جميع العملاء
- GET `/api/admin/crm/businesses` - جميع الأعمال مع حالة CRM

---

## 🔐 الأمان

- ✅ Pre-chat Form متاح في الخطوة الأولى
- ✅ CRM متاح فقط للأدمن وفي أكبر باقة
- ✅ تشفير API keys في نظام الدفع
- ✅ Webhook signature verification
- ✅ Authentication required لجميع endpoints

---

## ✅ الخلاصة

تم تطوير نظام CRM ونظام الدفع بشكل شامل:
- ✅ نظام CRM متقدم مع إحصائيات وتحليلات
- ✅ Pre-chat Form متكامل في الويدجت
- ✅ نظام دفع شامل (Stripe, Paymob, Paytabs, PayPal)
- ✅ ربط كامل بين CRM والادمن
- ✅ مخاطبة كل زائر حسب نوع النشاط

النظام جاهز للاستخدام بعد إكمال Frontend Components! 🎉

