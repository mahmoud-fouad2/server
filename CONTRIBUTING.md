# المساهمة في Faheemly

شكراً لاهتمامك بالمساهمة في Faheemly! 🎉

## 🔰 قبل البدء

1. **Fork المشروع** على GitHub
2. **Clone** نسختك المحلية
3. **أنشئ branch جديد** لكل feature

```bash
git checkout -b feature/amazing-feature
```

## 📝 معايير الكود

### JavaScript/React
- استخدم **ES6+** features
- **Arrow functions** للـ components
- **Async/await** بدلاً من promises chains
- **Destructuring** للـ props

### Naming Conventions
- **Components**: PascalCase (e.g., `DashboardCard.jsx`)
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Files**: kebab-case (e.g., `user-service.js`)

### التعليقات
- اكتب تعليقات بالعربي للـ business logic
- استخدم JSDoc للدوال المهمة

```javascript
/**
 * إنشاء جلسة مستخدم جديدة
 * @param {string} userId - معرف المستخدم
 * @param {string} businessId - معرف العمل
 * @returns {Promise<Session>} الجلسة المنشأة
 */
async function createSession(userId, businessId) {
  // ...
}
```

## 🧪 الاختبار

قبل عمل commit، تأكد من:

```bash
# Frontend
cd client
npm run build    # يجب أن ينجح بدون أخطاء

# Backend
cd server
npm test         # إذا كانت هناك tests
```

## 📦 Commit Messages

استخدم الصيغة التالية:

```
<type>: <description>

[optional body]
```

### Types:
- `feat`: ميزة جديدة
- `fix`: إصلاح bug
- `docs`: تحديث توثيق
- `style`: تنسيق كود (لا يؤثر على الوظيفة)
- `refactor`: إعادة هيكلة
- `test`: إضافة tests
- `chore`: مهام صيانة

### أمثلة:
```bash
git commit -m "feat: Add WhatsApp business integration"
git commit -m "fix: Resolve wizard next button issue"
git commit -m "docs: Update pricing in README"
```

## 🚀 Pull Request Process

1. **تأكد من أن الكود يعمل**
2. **اكتب وصف واضح** للتغييرات
3. **أضف screenshots** إذا كان UI change
4. **ارجع لـ latest main** قبل الـ PR

```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main
```

## 🐛 البلاغ عن Bugs

استخدم GitHub Issues مع:
- **وصف واضح** للمشكلة
- **خطوات إعادة المشكلة**
- **Expected vs Actual behavior**
- **Screenshots** إن أمكن
- **Environment** (Browser, OS, etc.)

## 💡 اقتراح Features

نحب نسمع أفكارك! افتح GitHub Issue مع:
- **وصف الـ feature**
- **الحالة الاستخدامية**
- **فائدة الـ feature**
- **mockups** إن أمكن

## ❓ أسئلة؟

- 📧 Email: dev@faheemly.com
- 💬 Discord: [قريباً]

شكراً لمساهمتك! 🙏
