'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaBook,
  FaCode,
  FaCogs,
  FaLightbulb,
  FaRocket,
  FaSearch,
  FaCopy,
  FaCheck,
  FaExclamationCircle,
} from 'react-icons/fa';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/layout/Footer';
import useTheme from '@/lib/theme';
import { TRANSLATIONS } from '@/constants';
import { useRouter } from 'next/navigation';

const sections = [
  {
    id: 'introduction',
    title: 'مقدمة',
    icon: <FaBook />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">مرحباً بك في منصة فهملي</h3>
        <p className="text-lg leading-relaxed">
          <strong>فهملي</strong> هي منصة الشات بوت الأولى عربياً المدعومة بالذكاء الاصطناعي المتقدم.
          نقدم لك حلاً متكاملاً لأتمتة خدمة العملاء، زيادة المبيعات، وتحسين تجربة المستخدم على مدار الساعة.
        </p>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-r-4 border-indigo-500 p-6 rounded-l-lg">
          <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center text-xl">
            <FaLightbulb className="ml-2" />
            لماذا تختار فهملي؟
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">⚡ سرعة التثبيت</h5>
              <p className="text-sm">انسخ كود واحد فقط ويكون البوت جاهز في أقل من دقيقة</p>
            </div>
            <div>
              <h5 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">🌍 دعم كل اللهجات</h5>
              <p className="text-sm">يفهم اللهجة السعودية، المصرية، الخليجية، والشامية تلقائياً</p>
            </div>
            <div>
              <h5 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">🧠 تعلم ذكي</h5>
              <p className="text-sm">يتعلم من محتوى موقعك، ملفاتك، وقاعدة معرفتك تلقائياً</p>
            </div>
            <div>
              <h5 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">📊 تحليلات شاملة</h5>
              <p className="text-sm">لوحة تحكم متقدمة لمتابعة الأداء ورضا العملاء لحظياً</p>
            </div>
            <div>
              <h5 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">💬 ربط واتساب</h5>
              <p className="text-sm">تكامل فوري مع واتساب وتيليجرام بدون برمجة</p>
            </div>
            <div>
              <h5 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">🎨 تخصيص كامل</h5>
              <p className="text-sm">غير الألوان، الرسائل، ونمط الحوار ليناسب علامتك التجارية</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500 p-4 rounded-l-lg">
          <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">🎯 ما الذي يجعل فهملي مختلفاً؟</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>استخدام أحدث تقنيات الذكاء الاصطناعي (GPT-4, Groq, Gemini)</li>
            <li>بحث متجهي (Vector Search) لردود أكثر دقة</li>
            <li>كاش ذكي يوفر لك آلاف الدولارات شهرياً</li>
            <li>كشف تلقائي لبلد وجهاز الزائر للرد بالأسلوب المناسب</li>
            <li>تحويل فوري للموظف البشري عند الحاجة</li>
            <li>تقييم تلقائي لجودة الردود وتحسينها مستمر</li>
          </ul>
        </div>

        <div className="mt-6">
          <h4 className="font-bold text-xl mb-3">من يستخدم فهملي؟</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-3xl mb-2">🍔</div>
              <h5 className="font-bold mb-1">المطاعم والكافيهات</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                حجز الطاولات، الطلبات، الاستعلام عن المنيو
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-3xl mb-2">🏥</div>
              <h5 className="font-bold mb-1">العيادات والمستشفيات</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                حجز المواعيد، الاستعلام، تذكير المرضى
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-3xl mb-2">🛒</div>
              <h5 className="font-bold mb-1">المتاجر الإلكترونية</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                الاستفسارات، تتبع الطلبات، المرتجعات
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'installation',
    title: 'التثبيت السريع',
    icon: <FaRocket />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">ثبّت البوت في 3 خطوات سهلة</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-4 space-x-reverse">
            <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-2">سجل حساب مجاني</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ادخل على <a href="/register" className="text-indigo-600 underline">صفحة التسجيل</a> وأنشئ حسابك في أقل من دقيقة. لن تحتاج لبطاقة ائتمان!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 space-x-reverse">
            <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-2">أضف قاعدة المعرفة</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                من لوحة التحكم، أضف معلومات عن نشاطك التجاري، روابط موقعك، أو ارفع ملفات PDF/Word. البوت سيتعلم تلقائياً!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 space-x-reverse">
            <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-2">انسخ الكود والصقه</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                انسخ الكود التالي والصقه قبل وسم <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">&lt;/body&gt;</code> في موقعك:
              </p>
              <CodeBlock
                language="html"
                code={`<!-- Faheemly Widget - انسخ هذا الكود -->
<script>
  window.FAHEEMLY_BOT_ID = "YOUR_BUSINESS_ID";
</script>
<script 
  src="https://fahimo-api.onrender.com/fahimo-widget.js" 
  data-business-id="YOUR_BUSINESS_ID"
  async 
  defer
></script>
<!-- نهاية كود فهملي -->`}
              />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-r-4 border-yellow-500 p-4 rounded-l-lg">
          <h4 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2 flex items-center">
            <FaExclamationCircle className="ml-2" />
            مهم جداً!
          </h4>
          <p className="text-sm">
            استبدل <code className="font-mono font-bold bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">YOUR_BUSINESS_ID</code> بمعرف النشاط التجاري الخاص بك.
            تجده في لوحة التحكم تحت <strong>الإعدادات &gt; معلومات البوت</strong>.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500 p-4 rounded-l-lg">
          <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">✅ خلاص! البوت شغال</h4>
          <p className="text-sm">
            الآن أعد تحميل موقعك وسترى أيقونة الدردشة في الزاوية السفلية. جرّب المحادثة وتأكد من أن البوت يرد بشكل صحيح.
          </p>
        </div>

        <div className="mt-8">
          <h4 className="font-bold text-xl mb-3">💡 نصائح للتثبيت</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-green-500 ml-2">✓</span>
              <span>الكود يعمل مع جميع المنصات: WordPress, Shopify, Wix, HTML</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 ml-2">✓</span>
              <span>لا يؤثر على سرعة موقعك (يُحمّل بشكل async)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 ml-2">✓</span>
              <span>يعمل على الجوال والكمبيوتر بتصميم متجاوب</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 ml-2">✓</span>
              <span>يمكنك تخصيص الألوان والموقع من لوحة التحكم</span>
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'configuration',
    title: 'التخصيص والإعدادات',
    icon: <FaCogs />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">خصّص البوت ليناسب علامتك التجارية</h3>
        <p className="text-lg">
          يمكنك التحكم الكامل في مظهر وسلوك البوت من <strong>لوحة التحكم</strong> بدون أي برمجة.
          كل التغييرات تُحفظ تلقائياً وتُطبَّق فوراً على موقعك.
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl">
          <h4 className="font-bold text-xl mb-4">⚙️ الإعدادات الأساسية</h4>
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h5 className="font-bold text-indigo-600 mb-1">اسم البوت</h5>
              <p className="text-sm">اختر اسماً يناسب نشاطك (مثلاً: &quot;مساعد المطعم&quot;، &quot;دكتور الأسنان الرقمي&quot;)</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h5 className="font-bold text-indigo-600 mb-1">نمط الحوار (Bot Tone)</h5>
              <p className="text-sm">رسمي، ودود، مرح، أو احترافي - اختر الأسلوب المناسب لعملائك</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h5 className="font-bold text-indigo-600 mb-1">اللهجة المفضلة</h5>
              <p className="text-sm">سعودي، مصري، خليجي، أو عربي فصيح - البوت سيرد باللهجة التي تختارها</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-bold text-xl mb-3">🎨 التخصيص المرئي</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-indigo-50 dark:bg-indigo-900/30">
                <tr className="border-b dark:border-gray-700">
                  <th className="py-3 px-4 font-bold">الخاصية</th>
                  <th className="py-3 px-4 font-bold">النوع</th>
                  <th className="py-3 px-4 font-bold">الوصف</th>
                  <th className="py-3 px-4 font-bold">مثال</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-mono text-indigo-600">primary_color</td>
                  <td className="py-3 px-4 text-sm">Hex</td>
                  <td className="py-3 px-4 text-sm">اللون الرئيسي للبوت</td>
                  <td className="py-3 px-4 text-sm font-mono">#4F46E5</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-mono text-indigo-600">position</td>
                  <td className="py-3 px-4 text-sm">String</td>
                  <td className="py-3 px-4 text-sm">مكان الظهور</td>
                  <td className="py-3 px-4 text-sm">left / right</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-mono text-indigo-600">greeting_msg</td>
                  <td className="py-3 px-4 text-sm">String</td>
                  <td className="py-3 px-4 text-sm">رسالة الترحيب</td>
                  <td className="py-3 px-4 text-sm">مرحباً! كيف أقدر أساعدك؟</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-mono text-indigo-600">auto_open</td>
                  <td className="py-3 px-4 text-sm">Boolean</td>
                  <td className="py-3 px-4 text-sm">فتح تلقائي عند دخول الموقع</td>
                  <td className="py-3 px-4 text-sm">true / false</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-mono text-indigo-600">avatar_url</td>
                  <td className="py-3 px-4 text-sm">URL</td>
                  <td className="py-3 px-4 text-sm">صورة البوت (شعارك)</td>
                  <td className="py-3 px-4 text-sm">https://...</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 font-mono text-indigo-600">language</td>
                  <td className="py-3 px-4 text-sm">String</td>
                  <td className="py-3 px-4 text-sm">لغة الواجهة</td>
                  <td className="py-3 px-4 text-sm">ar / en</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 p-4 rounded-l-lg">
          <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">💡 نصيحة للتخصيص</h4>
          <p className="text-sm">
            استخدم ألوان علامتك التجارية في <code className="font-mono">primary_color</code> 
            لجعل البوت يبدو جزءاً طبيعياً من موقعك. يمكنك معاينة التغييرات مباشرة قبل الحفظ!
          </p>
        </div>

        <div className="mt-6">
          <h4 className="font-bold text-xl mb-3">🔧 إعدادات متقدمة</h4>
          <CodeBlock
            language="javascript"
            code={`// التحكم البرمجي في إعدادات البوت
window.FaheemlyConfig = {
  businessId: "YOUR_BUSINESS_ID",
  primaryColor: "#4F46E5",
  position: "right",
  greetingMessage: "أهلاً! كيف أقدر أساعدك اليوم؟",
  autoOpen: false,
  showOnPages: ["/", "/products", "/contact"],
  hideOnPages: ["/checkout", "/admin"]
};`}
          />
        </div>
      </div>
    ),
  },
  {
    id: 'api',
    title: 'واجهة المطورين (API)',
    icon: <FaCode />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">API للمطورين المحترفين</h3>
        <p className="text-lg">
          إذا كنت مطوراً وتحتاج تحكماً متقدماً، نوفر لك <strong>REST API</strong> متكاملاً 
          و<strong>JavaScript SDK</strong> سهل الاستخدام للتفاعل مع البوت برمجياً.
        </p>

        <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-xl">
          <h4 className="font-bold text-xl mb-4">🔑 الحصول على API Key</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>ادخل على <strong>لوحة التحكم &gt; الإعدادات &gt; API</strong></li>
            <li>انقر على &quot;إنشاء مفتاح جديد&quot;</li>
            <li>احفظ المفتاح في مكان آمن (لن يظهر مرة أخرى!)</li>
            <li>استخدم المفتاح في الـ Header: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">Authorization: Bearer YOUR_API_KEY</code></li>
          </ol>
        </div>

        <div className="mt-6">
          <h4 className="font-bold text-xl mb-3">📡 التحكم في البوت عبر JavaScript</h4>
          
          <h5 className="font-bold text-lg mt-4 mb-2">فتح وإغلاق البوت</h5>
          <CodeBlock
            language="javascript"
            code={`// فتح نافذة الدردشة برمجياً
window.Faheemly.open();

// إغلاق نافذة الدردشة
window.Faheemly.close();

// التبديل (إذا مفتوح يُغلق، وإذا مغلوق يُفتح)
window.Faheemly.toggle();

// التحقق من حالة البوت
if (window.Faheemly.isOpen()) {
  console.log('البوت مفتوح حالياً');
}`}
          />

          <h5 className="font-bold text-lg mt-6 mb-2">إرسال رسالة برمجياً</h5>
          <CodeBlock
            language="javascript"
            code={`// إرسال رسالة من الكود (مفيد للتفاعلات المخصصة)
window.Faheemly.sendMessage("أريد حجز موعد غداً الساعة 3 مساءً");

// إرسال رسالة مع بيانات إضافية (metadata)
window.Faheemly.sendMessage("استفسار عن المنتج", {
  productId: "12345",
  category: "electronics"
});`}
          />

          <h5 className="font-bold text-lg mt-6 mb-2">الاستماع للأحداث (Events)</h5>
          <CodeBlock
            language="javascript"
            code={`// عند تحميل البوت بنجاح
window.addEventListener('faheemly:ready', function() {
  console.log('✅ البوت جاهز للعمل!');
});

// عند إرسال رسالة من المستخدم
window.addEventListener('faheemly:message_sent', function(e) {
  console.log('📤 تم إرسال رسالة:', e.detail.message);
  // يمكنك إرسال تتبع لـ Google Analytics هنا
  gtag('event', 'chat_message', { message: e.detail.message });
});

// عند استلام رد من البوت
window.addEventListener('faheemly:message_received', function(e) {
  console.log('📥 رد البوت:', e.detail.response);
});

// عند فتح نافذة الدردشة
window.addEventListener('faheemly:opened', function() {
  console.log('💬 المستخدم فتح الدردشة');
});

// عند إغلاق نافذة الدردشة
window.addEventListener('faheemly:closed', function() {
  console.log('❌ المستخدم أغلق الدردشة');
});`}
          />
        </div>

        <div className="mt-8">
          <h4 className="font-bold text-xl mb-3">🌐 REST API Endpoints</h4>
          <p className="mb-4">Base URL: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">https://fahimo-api.onrender.com/api</code></p>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 space-x-reverse mb-2">
                <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded font-mono text-sm">POST</span>
                <code className="font-mono text-sm">/chat/message</code>
              </div>
              <p className="text-sm mb-3">إرسال رسالة للبوت والحصول على رد</p>
              <CodeBlock
                language="json"
                code={`{
  "message": "ما هي أوقات العمل؟",
  "businessId": "YOUR_BUSINESS_ID",
  "conversationId": "optional-conversation-id"
}`}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 space-x-reverse mb-2">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded font-mono text-sm">GET</span>
                <code className="font-mono text-sm">/chat/conversations</code>
              </div>
              <p className="text-sm">جلب جميع المحادثات (يتطلب API Key)</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 space-x-reverse mb-2">
                <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded font-mono text-sm">POST</span>
                <code className="font-mono text-sm">/knowledge</code>
              </div>
              <p className="text-sm">إضافة محتوى جديد لقاعدة المعرفة برمجياً</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border-r-4 border-purple-500 p-4 rounded-l-lg mt-6">
          <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">📚 الوثائق الكاملة</h4>
          <p className="text-sm">
            لمزيد من التفاصيل حول جميع الـ Endpoints، المعاملات، والأمثلة، 
            قم بزيارة <a href="/api" className="underline font-bold">صفحة API Reference</a> الكاملة.
          </p>
        </div>

        <div className="mt-6">
          <h4 className="font-bold text-xl mb-3">🔐 أمان الـ API</h4>
          <ul className="space-y-2 text-sm list-disc list-inside">
            <li>جميع الطلبات تُشفَّر عبر HTTPS</li>
            <li>استخدم API Keys فقط من السيرفر (لا تكشفها في الكود الأمامي)</li>
            <li>Rate Limit: 60 طلب/دقيقة للـ Free Plan، غير محدود للـ Enterprise</li>
            <li>يمكنك إلغاء المفتاح وإنشاء واحد جديد في أي وقت</li>
          </ul>
        </div>
      </div>
    ),
  },
];

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden bg-gray-900 text-gray-100 font-mono text-sm my-4 dir-ltr">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors"
          title="نسخ الكود"
        >
          {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation State
  const [lang, setLang] = useState('ar');
  const [isDark, setIsDark] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);
  const changeCountry = (code) => {
    if (code === 'sa') router.push('/');
    else router.push(`/${code}`);
  };

  const filteredSections = sections.filter(section => 
    section.title.includes(searchQuery) || 
    (typeof section.content === 'string' && section.content.includes(searchQuery))
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-cosmic-950 text-white' : 'bg-slate-50 text-gray-900'}`}>
      <Navigation
        lang={lang}
        setLang={setLang}
        activeCountry="sa"
        changeCountry={changeCountry}
        isDark={isDark}
        toggleTheme={toggleTheme}
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        t={TRANSLATIONS[lang]}
      />

      {/* Header */}
      <div className={`pt-32 pb-12 px-4 ${isDark ? 'bg-cosmic-900' : 'bg-white border-b'}`}>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            مركز <span className="text-indigo-600">المساعدة والوثائق</span>
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            كل ما تحتاج معرفته لاستخدام وتخصيص فهملي في مكان واحد
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto mt-8 relative">
            <FaSearch className={`absolute top-1/2 right-4 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="ابحث في الوثائق..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-4 pr-12 pl-4 rounded-xl border outline-none transition-all ${
                isDark 
                  ? 'bg-white/5 border-white/10 focus:border-indigo-500 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 focus:border-indigo-500 focus:shadow-lg'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="md:w-1/4">
            <div className="sticky top-32 space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : isDark 
                        ? 'text-gray-400 hover:bg-white/5 hover:text-white' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4">
            <div className={`rounded-2xl p-8 min-h-[600px] ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-xl'}`}>
              {filteredSections.map((section) => (
                activeSection === section.id && (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-4 space-x-reverse mb-8 border-b pb-6 dark:border-gray-700">
                      <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-2xl">
                        {section.icon}
                      </div>
                      <h2 className="text-3xl font-bold">{section.title}</h2>
                    </div>
                    <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                      {section.content}
                    </div>
                  </motion.div>
                )
              ))}
              
              {filteredSections.length === 0 && (
                <div className="text-center py-20">
                  <FaSearch className="text-6xl mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                  <p className="text-xl text-gray-500">لا توجد نتائج بحث مطابقة لـ &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
