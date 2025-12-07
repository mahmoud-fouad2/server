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
      <div className="space-y-4">
        <p className="text-lg leading-relaxed">
          مرحباً بك في وثائق فهملي! منصتنا توفر لك أذكى بوت دردشة مدعوم بالذكاء الاصطناعي
          لخدمة عملائك بشكل آلي وفعال. تم تصميم فهملي ليكون سهل الاستخدام، سريع التثبيت،
          وقابل للتخصيص بالكامل.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 p-4 rounded-l-lg">
          <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center">
            <FaLightbulb className="ml-2" />
            لماذا فهملي؟
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>تثبيت في دقيقة واحدة</li>
            <li>دعم للغة العربية واللهجات المحلية</li>
            <li>تعلم آلي من محتوى موقعك</li>
            <li>لوحة تحكم متكاملة للتحليلات</li>
          </ul>
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
        <p>
          يمكنك إضافة بوت فهملي إلى موقعك ببساطة عن طريق إضافة كود JavaScript التالي
          قبل إغلاق وسم <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-pink-500">&lt;/body&gt;</code>.
        </p>
        
        <CodeBlock
          language="html"
          code={`<!-- Faheemly Widget Start -->
<script>
  window.FAHEEMLY_BOT_ID = "YOUR_BOT_ID";
</script>
<script 
  src="https://faheem.ly/widget/fahimo-widget.js" 
  async 
  defer
></script>
<!-- Faheemly Widget End -->`}
        />

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-r-4 border-yellow-500 p-4 rounded-l-lg">
          <h4 className="font-bold text-yellow-700 dark:text-yellow-300 mb-2 flex items-center">
            <FaExclamationCircle className="ml-2" />
            ملاحظة هامة
          </h4>
          <p className="text-sm">
            لا تنس استبدال <code className="font-mono font-bold">YOUR_BOT_ID</code> بالمعرف الخاص بك
            الذي يمكنك الحصول عليه من لوحة التحكم بعد التسجيل.
          </p>
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
        <p>
          يمكنك تخصيص مظهر وسلوك البوت ليتناسب مع هوية علامتك التجارية.
          إليك أهم الإعدادات المتاحة:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-3 px-4 font-bold">الخاصية</th>
                <th className="py-3 px-4 font-bold">النوع</th>
                <th className="py-3 px-4 font-bold">الوصف</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              <tr>
                <td className="py-3 px-4 font-mono text-indigo-600">theme_color</td>
                <td className="py-3 px-4 text-sm">String (Hex)</td>
                <td className="py-3 px-4 text-sm">لون البوت الرئيسي (مثال: #4F46E5)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-indigo-600">position</td>
                <td className="py-3 px-4 text-sm">String</td>
                <td className="py-3 px-4 text-sm">مكان البوت: &apos;left&apos; أو &apos;right&apos;</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono text-indigo-600">greeting_msg</td>
                <td className="py-3 px-4 text-sm">String</td>
                <td className="py-3 px-4 text-sm">رسالة الترحيب التلقائية</td>
              </tr>
            </tbody>
          </table>
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
        <p>
          للمطورين الذين يحتاجون لتحكم أكبر، نوفر API متكامل للتفاعل مع البوت برمجياً.
        </p>

        <h4 className="font-bold text-lg mt-6 mb-2">فتح وإغلاق البوت</h4>
        <CodeBlock
          language="javascript"
          code={`// فتح نافذة الدردشة
window.Faheemly.open();

// إغلاق نافذة الدردشة
window.Faheemly.close();

// التبديل بين الفتح والإغلاق
window.Faheemly.toggle();`}
        />

        <h4 className="font-bold text-lg mt-6 mb-2">الاستماع للأحداث</h4>
        <CodeBlock
          language="javascript"
          code={`window.addEventListener('faheemly:ready', function() {
  console.log('البوت جاهز للعمل!');
});

window.addEventListener('faheemly:message_sent', function(e) {
  console.log('تم إرسال رسالة:', e.detail);
});`}
        />
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
