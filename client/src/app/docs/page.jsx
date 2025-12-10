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
import useTheme from '@/lib/theme';
import { TRANSLATIONS } from '@/constants';
import { useRouter } from 'next/navigation';
import ApiSection from './components/ApiSection';
import TroubleshootingSection from './components/TroubleshootingSection';

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
    title: 'التثبيت',
    icon: <FaRocket />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">تثبيت الويدجت</h3>
        <p>يمكنك إضافة ويدجت فهملي إلى موقعك في خطوة واحدة بسيطة.</p>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative group" dir="ltr">
          <button
            className="absolute top-2 right-2 p-2 bg-gray-800 rounded hover:bg-gray-700 transition"
            onClick={() => navigator.clipboard.writeText('<script src="https://fahimo-api.onrender.com/fahimo-widget.js" data-business-id="YOUR_BUSINESS_ID"></script>')}
          >
            <FaCopy />
          </button>
          <code className="font-mono text-sm">
            &lt;script src=&quot;https://fahimo-api.onrender.com/fahimo-widget.js&quot; data-business-id=&quot;YOUR_BUSINESS_ID&quot;&gt;&lt;/script&gt;
          </code>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-r-4 border-yellow-500 p-4 rounded-l-lg">
          <h4 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2">ملاحظة هامة</h4>
          <p className="text-sm">
            تأكد من استبدال <code>YOUR_BUSINESS_ID</code> بمعرف عملك الخاص الذي يمكنك الحصول عليه من لوحة التحكم.
          </p>
        </div>

        <h4 className="text-xl font-bold mt-8 mb-4">التثبيت في منصات مختلفة</h4>
        
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h5 className="font-bold mb-2">WordPress</h5>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>قم بتثبيت إضافة &quot;Insert Headers and Footers&quot;</li>
              <li>اذهب إلى الإعدادات {'>'} Insert Headers and Footers</li>
              <li>الصق الكود في قسم &quot;Scripts in Footer&quot;</li>
              <li>اضغط حفظ</li>
            </ol>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h5 className="font-bold mb-2">Salla / Zid</h5>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>اذهب إلى إعدادات المتجر</li>
              <li>اختر &quot;كود مخصص&quot; أو &quot;Custom Code&quot;</li>
              <li>أضف الكود في قسم &quot;Body End&quot; أو &quot;Footer&quot;</li>
              <li>احفظ التغييرات</li>
            </ol>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'configuration',
    title: 'الإعدادات',
    icon: <FaCogs />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">تخصيص البوت</h3>
        <p>يمكنك تخصيص مظهر وسلوك البوت بالكامل من لوحة التحكم.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-bold mb-3 text-lg">المظهر</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                تغيير اللون الرئيسي
              </li>
              <li className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                تغيير أيقونة البوت
              </li>
              <li className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                تغيير موضع الويدجت (يمين/يسار)
              </li>
              <li className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                تفعيل/تعطيل الوضع الليلي
              </li>
            </ul>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-bold mb-3 text-lg">السلوك</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                رسالة الترحيب التلقائية
              </li>
              <li className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                نبرة المحادثة (رسمي/ودي)
              </li>
              <li className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                جمع بيانات الزوار (الاسم/الهاتف)
              </li>
              <li className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                ساعات العمل والرد الآلي
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: <FaCode />,
    content: <ApiSection />,
  },
  {
    id: 'troubleshooting',
    title: 'استكشاف الأخطاء',
    icon: <FaExclamationCircle />,
    content: <TroubleshootingSection />,
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Local state to keep Navigation consistent with the rest of the site
  const [lang, setLang] = useState('ar');
  const [activeCountry, setActiveCountry] = useState('sa');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-cosmic-900 text-gray-900 dark:text-gray-100 font-sans" dir="rtl">
      <Navigation
        lang={lang}
        setLang={setLang}
        activeCountry={activeCountry}
        changeCountry={setActiveCountry}
        isDark={isDark}
        toggleTheme={() => { toggleTheme(); setIsDark(!isDark); }}
        scrolled={false}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        t={TRANSLATIONS.ar}
      />

      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-4 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="relative">
              <FaSearch className="absolute top-3 right-3 text-gray-400" />
              <input
                type="text"
                placeholder="بحث في الوثائق..."
                className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === section.id
                      ? 'bg-brand-600 text-white shadow-lg'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700"
          >
            {sections.find(s => s.id === activeSection)?.content}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
