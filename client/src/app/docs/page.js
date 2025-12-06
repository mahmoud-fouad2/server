'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Book,
  Code,
  Settings,
  MessageCircle,
  Zap,
  Shield,
  Users,
  BarChart3,
  ChevronRight,
  Search,
  Menu,
  X,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    {
      id: 'getting-started',
      title: 'البدء السريع',
      icon: <Zap size={20} />,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  مرحباً بك في فهملي!
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  فهملي هو نظام ذكاء اصطناعي متقدم مصمم لمساعدة الشركات في خدمة عملائها بشكل أفضل من خلال الردود التلقائية الذكية على منصات التواصل الاجتماعي.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">خطوات البدء السريع</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-bold mb-1">إنشاء حساب</h4>
                    <p className="text-gray-600 dark:text-gray-400">سجل حساباً جديداً مجاناً وابدأ رحلتك مع فهملي</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-bold mb-1">إعداد البوت</h4>
                    <p className="text-gray-600 dark:text-gray-400">استخدم معالج الإعداد الذكي لتخصيص بوتك حسب احتياجات عملك</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-bold mb-1">ربط القنوات</h4>
                    <p className="text-gray-600 dark:text-gray-400">اربط حساباتك على واتساب والمنصات الأخرى</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-bold mb-1">البدء في العمل</h4>
                    <p className="text-gray-600 dark:text-gray-400">ابدأ استقبال الرسائل وشاهد كيف يعمل بوتك بذكاء</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-brand-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">جاهز للبدء؟</h3>
            <p className="mb-4 opacity-90">ابدأ تجربتك المجانية اليوم واستمتع بـ7 أيام مجاناً</p>
            <Link href="/register">
              <button className="bg-white text-brand-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                ابدأ التجربة المجانية
              </button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: 'api-reference',
      title: 'مرجع API',
      icon: <Code size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">REST API</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              يوفر فهملي API شامل للتكامل مع أنظمتك الحالية
            </p>

            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">POST</code>
                  <code className="text-sm">/api/messages/send</code>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  إرسال رسالة من خلال البوت
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm">
                  <pre>{`{
  "to": "+966501234567",
  "message": "مرحباً بك في خدماتنا",
  "priority": "normal"
}`}</pre>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <code className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">GET</code>
                  <code className="text-sm">/api/conversations</code>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  الحصول على قائمة المحادثات
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm">
                  <pre>{`{
  "conversations": [...],
  "total": 150,
  "page": 1
}`}</pre>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Webhooks</h3>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-1 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                    إعداد Webhooks
                  </h4>
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm mb-3">
                    يمكنك إعداد webhooks لتلقي إشعارات فورية عند حدوث أحداث معينة
                  </p>
                  <code className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-sm">
                    POST https://your-domain.com/webhook
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'customization',
      title: 'التخصيص',
      icon: <Settings size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">إعدادات البوت</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <MessageCircle size={20} className="text-brand-500" />
                  النبرة والأسلوب
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• رسمي للشركات</li>
                  <li>• ودود للمطاعم والمتاجر</li>
                  <li>• مهني للعيادات</li>
                  <li>• مرح للترفيه</li>
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Shield size={20} className="text-green-500" />
                  قواعد الأمان
                </h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• فلترة المحتوى الضار</li>
                  <li>• التحقق من الهوية</li>
                  <li>• حدود المحادثات</li>
                  <li>• إدارة البيانات</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">الذكاء الاصطناعي المخصص</h3>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
              <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-3">
                تدريب البوت على بياناتك
              </h4>
              <p className="text-purple-800 dark:text-purple-200 mb-4">
                يمكن للبوت التعلم من محادثاتك السابقة ومعرفتك الخاصة ليقدم إجابات أكثر دقة وملائمة
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">95%</div>
                  <div className="text-purple-700 dark:text-purple-300">دقة الإجابات</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">24/7</div>
                  <div className="text-purple-700 dark:text-purple-300">عمل متواصل</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">∞</div>
                  <div className="text-purple-700 dark:text-purple-300">قدرة التعلم</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'analytics',
      title: 'التحليلات',
      icon: <BarChart3 size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">لوحة التحكم التحليلية</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              تابع أداء بوتك من خلال تحليلات مفصلة وتقارير شاملة
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <MessageCircle size={20} className="text-blue-500" />
                إحصائيات المحادثات
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">إجمالي المحادثات</span>
                  <span className="font-bold">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">معدل الرضا</span>
                  <span className="font-bold text-green-600">4.8/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">متوسط وقت الرد</span>
                  <span className="font-bold">12 ثانية</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-500" />
                تحليل العملاء
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">العملاء النشطين</span>
                  <span className="font-bold">892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">معدل العودة</span>
                  <span className="font-bold text-green-600">67%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">الدول الأكثر نشاطاً</span>
                  <span className="font-bold">🇸🇦 🇦🇪 🇪🇬</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h4 className="font-bold mb-4">التقارير المتقدمة</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h5 className="font-bold mb-1">تقارير يومية</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">تلقائياً كل صباح</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl mb-2">📈</div>
                <h5 className="font-bold mb-1">تحليل الأداء</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">مع مقارنات شهرية</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h5 className="font-bold mb-1">تحسينات مقترحة</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">بناءً على البيانات</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'حل المشاكل',
      icon: <AlertCircle size={20} />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold mb-4">المشاكل الشائعة وحلولها</h3>

            <div className="space-y-4">
              <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 rounded-lg p-6">
                <h4 className="font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                  <AlertCircle size={20} />
                  البوت لا يرد على الرسائل
                </h4>
                <ul className="text-red-800 dark:text-red-200 text-sm space-y-1 mb-3">
                  <li>• تأكد من ربط حساب واتساب بشكل صحيح</li>
                  <li>• تحقق من حالة البوت في لوحة التحكم</li>
                  <li>• تأكد من وجود رصيد كافي في الباقة</li>
                </ul>
                <Link href="/docs/troubleshooting">
                  <button className="text-red-700 dark:text-red-300 text-sm font-medium underline hover:text-red-800 dark:hover:text-red-200 transition-colors">
                    عرض الدليل التفصيلي
                  </button>
                </Link>
              </div>

              <div className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-6">
                <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                  <AlertCircle size={20} />
                  إجابات غير دقيقة
                </h4>
                <ul className="text-yellow-800 dark:text-yellow-200 text-sm space-y-1 mb-3">
                  <li>• أعد تدريب البوت على معرفتك الخاصة</li>
                  <li>• راجع إعدادات النبرة والأسلوب</li>
                  <li>• أضف المزيد من الأمثلة في قاعدة المعرفة</li>
                </ul>
                <Link href="/docs/troubleshooting">
                  <button className="text-yellow-700 dark:text-yellow-300 text-sm font-medium underline hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors">
                    كيفية تحسين الدقة
                  </button>
                </Link>
              </div>

              <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Info size={20} />
                  أسئلة متكررة
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-blue-800 dark:text-blue-200">كم يستغرق تدريب البوت؟</strong>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">عادةً 15-30 دقيقة حسب حجم البيانات</p>
                  </div>
                  <div>
                    <strong className="text-blue-800 dark:text-blue-200">هل يدعم اللغة العربية؟</strong>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">نعم، فهملي متخصص في اللهجة العربية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <h4 className="font-bold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
              <CheckCircle size={20} />
              تحتاج مساعدة إضافية؟
            </h4>
            <p className="text-green-800 dark:text-green-200 mb-4">
              فريق الدعم متاح 24/7 لمساعدتك في حل أي مشاكل تواجهها
            </p>
            <div className="flex gap-3">
              <Link href="/contact">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  تواصل مع الدعم
                </button>
              </Link>
              <a href="mailto:support@faheemly.com">
                <button className="border border-green-600 text-green-600 dark:text-green-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors">
                  support@faheemly.com
                </button>
              </a>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find(section => section.id === activeSection)?.content;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950">
      {/* Navigation */}
      <nav className="bg-white dark:bg-cosmic-900 border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 group">
                <Image
                  src="/logo.webp"
                  alt="فهملي"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                />
                <span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                  فهملي
                </span>
              </Link>
              <span className="hidden md:block text-gray-500 dark:text-gray-400">|</span>
              <span className="hidden md:block text-gray-600 dark:text-gray-300">التوثيق الشامل</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث في التوثيق..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <Link href="/register">
                <button className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors hidden md:block">
                  ابدأ مجاناً
                </button>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'التوثيق' }]} />

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`w-64 flex-shrink-0 ${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
            <div className="bg-white dark:bg-cosmic-900 rounded-xl border border-gray-200 dark:border-white/10 p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">المحتوى</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {section.icon}
                    <span className="text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                <Link href="/contact">
                  <button className="w-full flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-white/5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-sm">
                    <MessageCircle size={16} />
                    تواصل مع الدعم
                  </button>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-cosmic-900 rounded-xl border border-gray-200 dark:border-white/10 p-8">
              <div className="mb-6">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4">
                  <ArrowLeft size={16} />
                  العودة للرئيسية
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {sections.find(s => s.id === activeSection)?.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  دليل شامل لاستخدام فهملي بفعالية
                </p>
              </div>

              {activeContent}
            </div>

            {/* Footer */}
            <footer className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Development By{' '}
                  <a
                    href="https://ma-fo.info"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <img
                      src="https://ma-fo.info/logo2.png"
                      alt="Ma-Fo Logo"
                      className="w-4 h-4"
                    />
                    Ma-Fo
                  </a>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  © 2025 جميع الحقوق محفوظة لشركة فهملي
                </p>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}