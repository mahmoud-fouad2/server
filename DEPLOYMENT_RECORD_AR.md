# سجل التغييرات ونشرة النشر (تفصيلي)
تاريخ الإصدار: 2025-12-11

ملخص الحالة:
- الحالة الحالية: المستودع مستقر بعد تعديلات واجهة المستخدم وخدمات الـ AI والـ embeddings. تم تنفيذ بناء الـ client محليًا بنجاح ودُفِعَت التغييرات إلى الفرع `main`.
- ملاحظة هامة: يجب تحديث متغيرات البيئة في بيئة الاستضافة (Render / Bluehost / VPS) لكي تدخل التغييرات حيز التنفيذ الكامل.

قائمة التغييرات التفصيلية (ملفات/مسارات ووصف التغيير):

- `server/src/services/embedding.service.js`:
  - إعادة كتابة خدمة الـ embeddings لتدعم ترتيب موفري الـ embeddings القابل للتهيئة (`EMBEDDING_PROVIDER_ORDER`).
  - إضافة دعم لـ VoyageAI كموفر للـ embeddings.
  - تفضيل DeepSeek وVoyage قبل Groq في ترتيب المحاولات الافتراضي.
  - إضافة منطق تبريد (cooldown) تكيفي لموفّر Gemini عند حدوث قيود/نفاد الحصّة.
  - إضافة حارس (`CEREBRAS_SUPPORTS_EMBEDDINGS`) لمنع استدعاء Cerebras للـ embeddings إلا عند تفعيل واضح.

- `server/src/services/ai.service.js`:
  - إضافة Voyage كمزود للدردشة (chat fallback) ودمجه في لائحة الموفّرين.
  - الاحتفاظ بمنطق التوزيع/التراجع (round-robin + fallback) وتتبّع استخدام المزودين.

- `server/src/config/env.validator.js`:
  - إضافة `VOYAGE_API_KEY` وملف التحقق لسطح الإعدادات حتى يظهر التحذير إن كان مفقودًا.

- `client/src/components/FaheemAnimatedLogo.jsx`:
  - إضافة حجم `tiny` للشعار وجعل الشعار الصغير مرئيًا على شاشات المحمول.

- `client/src/components/chat/MessageBubble.jsx`:
  - تحسين عرض ردود المساعد: تحويل الأسطر المتعددة إلى قوائم مرقمة (`<ol>`) ودعم تحويل نص **bold** إلى عناصر `<strong>`.

- `client/src/app/dashboard/components/ConversationsView.jsx` و
  `client/src/app/dashboard/components/LiveSupportView.jsx`:
  - عرض زائرين/طلبات المساعدة بصيغة `Country • VISITORID` عند توفر البلد.
  - تنسيق مُعرّف الزائر للعروض القصيرة وتهيئة معاينات الرسائل لتتوافق مع العرض الجديد للمساعد.

- `client/src/app/docs/page.jsx`:
  - استبدال/تنظيف صفحة الوثائق التي كانت تحتوي أحرف تحكم مخفية وتسبّب فشل بناء Next.js.
  - إدخال صفحة توثيق معيارية ومكتوبة بشكل نظيف لعدم تعطيل البناء.

- `PROJECT_STATUS.md` و `DEPLOYMENT_RECORD_AR.md` (هذا الملف):
  - ملف حالة المشروع وسجل النشر وإرشادات صيانة قصيرة.

عمليات Git والبناء والنشر المحلية:
- الحالات الأخيرة في بيئة التطوير (محلي/Windows PowerShell):
  - تم تنفيذ: `git add .` و `git commit -m "Embedding: add Voyage support, guard Cerebras embeddings, prefer DeepSeek/Voyage"` ثم `git push` إلى الفرع `main`.
  - في مجلد `client`: تم تشغيل `npm install` ثم `npm run build` بنجاح (مخرجات البناء أظهرت تحذيرات peer-deps لكنها لم تمنع الإخراج النهائي).

متغيرات البيئة المطلوبة/الموصى بها (تأكد من إضافتها في بيئة الإنتاج):
- إلزامي:
  - `VOYAGE_API_KEY` : (مفتاح API لـ VoyageAI) — مطلوب لعمل Voyage كموفر embeddings/chat.
  - `EMBEDDING_PROVIDER_ORDER` : مثال مقترح `deepseek,voyage,groq,gemini` أو `deepseek,voyage,groq` إذا أردت تجنب Gemini للـ embeddings.
- موصى به لضمان ثبات النظام:
  - `SKIP_GEMINI_EMBEDDING=true`  (إذا كانت حصص Gemini مشكلة وتريد استخدامه فقط للدردشة)
  - `CEREBRAS_SUPPORTS_EMBEDDINGS=false` (ضع `true` فقط إذا تأكدت أن Cerebras لديها نقطة نهاية للـ embeddings في بيئتك)
  - `FORCE_FAKE_EMBEDDINGS=false` (للاختبارات الداخلية فقط إذا كان موجودًا)

خطوات النشر (اختصار عملي لعدم كسر النظام):
1) تأكد من أن المتغيرات أعلاه مضافة في لوحة الاستضافة (Render/Bluehost/VPS).
2) تشغيل بناء الـ client على السيرفر/CI أو عبر خطوات النشر المعتادة:
   - في PowerShell داخل مجلد `client`:
```
cd C:\xampp\htdocs\chat1\github\client
npm install
npm run build
```
3) إعادة تشغيل السيرفر (Node) الخاص بالخدمة `server` بعد تحديث المتغيرات:
```
cd C:\xampp\htdocs\chat1\github\server
# (مثال) تشغيل باستخدام pm2 أو الأمر المعتاد
pm2 restart all   # أو الأمر الذي تستخدمه في الإنتاج
```
4) للتأكد من أن المستخدمين يحصلون على نسخة محدثة من الـ widget: إما قم بعمل `purge` لكاش الـ CDN أو استخدم اسم ملف ذو نسخة مُرقَّمة (مثال `fahimo-widget.v2.js`) في صفحة الـ embed على المواقع.

فحوصات ما بعد النشر (Smoke checks):
- تأكد من أن صفحة الـ docs لا تعطي أخطاء بناء وتُحمَّل بدون Parse errors.
- تحقّق من استجابة نقطة النهاية للـ embeddings (مثال: إرسال اختبار نص صغير ورؤية إرجاع فيتكتور).
- تحقق من واجهة الدردشة: عرض مؤشر الكتابة `جاري الرد`، ظهور الشعار الصغير على الموبايل، وتحويل الردود المتعددة إلى قوائم مرقمة.

خطوات احترازية لمنع كسر المشروع مستقبلًا:
- أ) أضف فحص قبل الالتزام (pre-commit) أو CI job:
  - التحقق من الأحرف الغير مرئية (control characters) في ملفات `.jsx/.js/.md`.
  - تشغيل `npm run build` تلقائيًا في CI قبل الدمج إلى `main` (أو تشغيل فحص `next build`).
- ب) لا تضع مفاتيح API في ملفات المشروع — استخدم متغيرات بيئة في لوحة الاستضافة.
- ج) احتفظ بنسخة من ملف الـ widget المرقّم عند كل تحديث خارجي لسهولة الرجوع.
- د) سجّل وحلل الأخطاء: احتفظ بمراقبة Sentry/Logs بعد إعادة تفعيل Sentry بحذر (تجنّب الـ init غير المستقر في صفحات wizard).

روابط ومواضع الملفات المهمة داخل المشروع (مسارات محلية):
- جذر المشروع: `C:\xampp\htdocs\chat1\github`
- عميل Next.js: `C:\xampp\htdocs\chat1\github\client`
- خادم Node (server): `C:\xampp\htdocs\chat1\github\server`
- ملفات التكوين والخدمات المهمة:
  - `server/src/services/embedding.service.js`
  - `server/src/services/ai.service.js`
  - `server/src/config/env.validator.js`
  - `client/src/components/FaheemAnimatedLogo.jsx`
  - `client/src/components/chat/MessageBubble.jsx`
  - `client/src/app/docs/page.jsx`
  - `client/src/app/dashboard/components/ConversationsView.jsx`

طريقة التحقق من عنوان الريموت (إن احتجت الرابط الخارجي للمستودع):
```
cd C:\xampp\htdocs\chat1\github
git remote -v
```
انسخ النتيجة لاستخدامها في إعدادات الاستضافة أو لوضع روابط الويب.

سجل التغييرات (مختصر زمني للخطوات التي نُفّذت حتى 2025-12-11):
- 2025-12-11: تنظيف صفحة الوثائق من أحرف تحكم، استبدالها بصفحة نظيفة، وإضافة ملف `DEPLOYMENT_RECORD_AR.md` داخل المشروع.
- 2025-12-11: إضافة دعم Voyage للـ embeddings والدردشة، تعديل ترتيب موفري الـ embeddings، إضافة حماية لـ Cerebras، وتكييف منطق تبريد Gemini. تغييرات في `server/src/services/`.
- 2025-12-11: تحسينات واجهة المستخدم: شعار مرئي على الموبايل، تحويل ردود المساعد إلى قوائم مرقمة ودعم الـ bold. تغييرات في `client/src/components/` و `client/src/app/`.
- 2025-12-11: تنفيذ التزامات Git ودفعها إلى الفرع `main`، وبناء الـ client محليًا بنجاح.

ملاحظة ختامية:
- المشروع الآن في حالة مستقرة محليًا حسب فحوصات البناء والاختبارات السريعة. لتثبيت الحالة في الإنتاج: أضف متغيرات البيئة المطلوبة، أعد بناء الـ client في بيئة الإنتاج، وأعد تشغيل الخدمة، ثم قم بمسح كاشات الـ CDN أو استخدم تسمية ملف نسخة جديدة للـ widget.

إذا رغبت، أستطيع:
- إضافة ملف نصي بسيط آخر `DEPLOYMENT_COMMANDS.txt` يتضمن أوامر PowerShell جاهزة للصق والتنفيذ في لوحة الاستضافة.
- إعداد سكربت فحوصات CI صغير (GitHub Actions) يبني المشروع ويتحقق من الأحرف الخفية قبل الدمج.

انتهى السجل.
