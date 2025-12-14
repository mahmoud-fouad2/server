"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
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
import { API_CONFIG } from '@/lib/config';
import { TRANSLATIONS } from '@/constants';
// Widget source (always resolved from config)
const widgetSrc = API_CONFIG.WIDGET_SCRIPT || `${API_CONFIG.BASE_URL}/fahimo-widget.js`;

const ApiSection = dynamic(() => import('./components/ApiSection').catch(() => () => <div>API section not available</div>), { ssr: false });
const TroubleshootingSection = dynamic(() => import('./components/TroubleshootingSection').catch(() => () => <div>Troubleshooting not available</div>), { ssr: false });

const sections = [
  {
    id: 'introduction',
    title: 'مقدمة',
    icon: <FaBook />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">مرحباً بك في منصة فهملي</h3>
        <p className="text-lg leading-relaxed">
          <strong>فهملي</strong> هي منصة شات بوت عربية مدعومة بالذكاء الاصطناعي لتقديم دعم العملاء،
          زيادة التحويلات، وتقديم تجربة محادثة ذكية على موقعك.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <h4 className="font-semibold">أهم الميزات</h4>
            <ul className="mt-2 list-disc list-inside text-sm space-y-1">
              <li>تكامل سريع بنسخة واحدة من السكربت</li>
              <li>بحث متجهي (Vector Search) للردود دقيقة</li>
              <li>دعم لهجات عربية متعددة</li>
              <li>لوحة تحكم وتحليلات متقدمة</li>
            </ul>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <h4 className="font-semibold">لماذا فهملي</h4>
            <p className="text-sm mt-2">نقدّم بنية قابلة للتوسع، أمان على مستوى المؤسسات، وخيارات مزوّدات الذكاء الاصطناعي متعددة لتقليل الاعتماد على مزود واحد.</p>
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
        <p>أبسط طريقة لتثبيت الويدجت هي لصق سطر واحد داخل تذييل الموقع (footer):</p>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto" dir="ltr">
          {`<script src="${widgetSrc}" data-business-id="YOUR_BUSINESS_ID"></script>`}
        </div>

        <h4 className="font-semibold">خطوات التثبيت (تفصيلي)</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>انسخ كود التضمين وضعه قبل وسم <code>&lt;/body&gt;</code> في الموقع.</li>
          <li>استبدل <code>YOUR_BUSINESS_ID</code> بمعرف العمل الخاص بك من لوحة التحكم.</li>
          <li>تأكد من أن المسار <code>/fahimo-widget.js</code> يخدم ملف الويدجت من الـ API أو CDN.</li>
        </ol>

        <h4 className="font-semibold">منصات شائعة</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">WordPress: ضع الكود في footer (functions.php أو إضافة Insert Headers & Footers).</div>
          <div className="p-4 border rounded">Shopify / Zid: استخدم قسم Footer أو Custom Code داخل إعدادات القالب.</div>
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
        <p>يمكنك تخصيص الاسم، النبرة، الألوان، ورسائل الترحيب من لوحة التحكم. خيارات شائعة:</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Primary color: لتوحيد ألوان الويدجت مع علامتك التجارية</li>
          <li>Custom icon URL: لاستبدال الحرف الافتراضي بصورة</li>
          <li>Welcome message: رسالة ترحيب أولية (يمكنك تعطيلها)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: <FaCode />,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold mb-4">واجهات برمجة التطبيقات</h3>
        <p className="text-sm">أهم نقاط النهاية المستخدمة من قبل الويدجت:</p>

        <div className="bg-white dark:bg-gray-800 border rounded p-4 font-mono text-sm">
          <strong>POST /api/visitor/session</strong>
          <div className="text-xs mt-2">Body: {"{ businessId, fingerprint }"}</div>
          <div className="mt-1 text-xs">Returns: session id, success flag.</div>
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded p-4 font-mono text-sm">
          <strong>POST /api/chat/message</strong>
          <div className="text-xs mt-2">Body: {"{ message, businessId, conversationId?, sessionId? }"}</div>
          <div className="mt-1 text-xs">Returns: {"{ response, conversationId }"} (response: string)</div>
        </div>

        <div className="bg-white dark:bg-gray-800 border rounded p-4 font-mono text-sm">
          <strong>GET /api/widget/config/:businessId</strong>
          <div className="text-xs mt-2">Returns widget configuration (colors, name, welcomeMessage, customIconUrl, etc.)</div>
        </div>

        <p className="text-sm">نصائح للمطورين: احرص على إرسال الـ sessionId و conversationId عند إعادة المحادثة لتضمين سياق المستخدم.</p>
      </div>
    ),
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
  const [isDark, setIsDark] = useState(false);
  const widgetSrc = API_CONFIG.WIDGET_SCRIPT || `${API_CONFIG.BASE_URL}/fahimo-widget.js`;

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toc = useMemo(() => sections.map(s => ({ id: s.id, title: s.title })), []);

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function onScroll() {
      const el = document.querySelector('.docs-typography');
      if (!el) return setProgress(0);
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight + 120;
      if (total <= 0) return setProgress(100);
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(Math.round((scrolled / total) * 100));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-cosmic-900 text-gray-900 dark:text-gray-100 font-sans" dir="rtl">
      <Navigation
        lang={'ar'}
        setLang={() => {}}
        activeCountry={'sa'}
        changeCountry={() => {}}
        isDark={isDark}
        toggleTheme={() => { toggleTheme(); setIsDark(!isDark); }}
        scrolled={false}
        mobileMenuOpen={false}
        setMobileMenuOpen={() => {}}
        t={TRANSLATIONS.ar}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-8">
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6 md:p-8 mb-8 border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">التوثيق الشامل - دليل فهملي</h1>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl">دليل خطوة بخطوة لإعداد وفهم منصة فهملي: التثبيت، التخصيص، التكامل، وواجهات الـ API.</p>
            </div>
            <div className="flex items-center gap-3">
              <a href="/register" className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold shadow">ابدأ الآن</a>
              <a href="#installation" className="inline-block px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm">طريقة التثبيت</a>
            </div>
          </div>
        </section>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  aria-pressed={activeSection === section.id}
                  className={`whitespace-nowrap px-3 py-2 rounded-lg border transition text-sm ${
                    activeSection === section.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          <aside className="hidden md:block w-72 flex-shrink-0">
            <div className="sticky top-28 space-y-6">
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
                <div className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-semibold mb-2 text-gray-500">المحتويات</div>
                  <ul className="space-y-1 text-sm">
                    {toc.map(item => (
                      <li key={item.id}>
                        <button
                          onClick={() => { setActiveSection(item.id); const target = document.getElementById(item.id); if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                          className={`w-full text-left px-2 py-1 rounded transition-colors ${activeSection === item.id ? 'text-brand-600 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:text-brand-600'}`}
                        >
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

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

          <main className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              dir="rtl"
              className="docs-typography bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 max-w-5xl mx-auto"
            >
              <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              {(sections.find(s => s.id === activeSection) || {}).content}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
