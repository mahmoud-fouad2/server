'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Settings,
  Book,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Shield,
  Users,
  BarChart3,
  Search,
  Menu,
  X,
} from 'lucide-react';

export default function TroubleshootingGuide() {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const problems = [
    {
      id: 'no-response',
      title: 'البوت لا يرد على الرسائل',
      icon: <MessageCircle className="h-6 w-6 text-red-500" />,
      solutions: [
        {
          title: 'ربط حساب واتساب',
          description: 'تأكد من ربط حساب واتساب بوتك بشكل صحيح من لوحة التحكم',
          steps: [
            'اذهب إلى لوحة التحكم',
            'اضغط على "إعدادات البوت"',
            'تحقق من حالة ربط واتساب',
            'أعد الربط إذا لزم الأمر'
          ]
        },
        {
          title: 'حالة البوت',
          description: 'تحقق من أن البوت مفعل ويعمل',
          steps: [
            'تحقق من مؤشر الحالة في لوحة التحكم',
            'تأكد من عدم وجود صيانة مؤقتة',
            'أعد تشغيل البوت إذا كان متوقفاً'
          ]
        },
        {
          title: 'الرصيد المتاح',
          description: 'تأكد من وجود رصيد كافي في باقتك',
          steps: [
            'تحقق من الرصيد المتبقي في لوحة التحكم',
            'اشترك في باقة إذا نفد الرصيد',
            'راجع تاريخ الاستخدام'
          ]
        }
      ]
    },
    {
      id: 'inaccurate-responses',
      title: 'إجابات غير دقيقة',
      icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
      solutions: [
        {
          title: 'تدريب البوت',
          description: 'أعد تدريب البوت على معرفتك الخاصة',
          steps: [
            'اذهب إلى قسم "قاعدة المعرفة"',
            'أضف معلومات جديدة ومفصلة',
            'أعد تدريب البوت على البيانات الجديدة',
            'اختبر الإجابات بعد التدريب'
          ]
        },
        {
          title: 'إعدادات النبرة',
          description: 'راجع إعدادات النبرة والأسلوب',
          steps: [
            'اذهب إلى "إعدادات البوت"',
            'اختر النبرة المناسبة لنشاطك',
            'اضبط مستوى الرسمية',
            'احفظ التغييرات واختبر'
          ]
        },
        {
          title: 'إضافة أمثلة',
          description: 'أضف المزيد من الأمثلة في قاعدة المعرفة',
          steps: [
            'أضف محادثات مثالية',
            'أدرج أسئلة شائعة وإجاباتها',
            'أضف سياقات مختلفة',
            'تدريب البوت على الأمثلة الجديدة'
          ]
        }
      ]
    }
  ];

  const faqs = [
    {
      question: 'كم يستغرق تدريب البوت؟',
      answer: 'عادةً 15-30 دقيقة حسب حجم البيانات. البوتات الصغيرة تستغرق 15 دقيقة، بينما البوتات الكبيرة قد تحتاج إلى 30 دقيقة أو أكثر.'
    },
    {
      question: 'هل يدعم اللغة العربية؟',
      answer: 'نعم، فهملي متخصص في اللهجة العربية واللغة العربية الفصحى. البوت يفهم ويرد بالعربية بشكل طبيعي.'
    },
    {
      question: 'كيف أعرف إذا كان البوت يعمل؟',
      answer: 'يمكنك التحقق من حالة البوت في لوحة التحكم. إذا كان المؤشر أخضر، فالبوت يعمل بشكل طبيعي. يمكنك أيضاً إرسال رسالة اختبار.'
    },
    {
      question: 'ما هي الباقات المتاحة؟',
      answer: 'لدينا باقات متعددة: تجريبية (مجانية)، أساسية، احترافية، شركات، ووكالات. كل باقة توفر عدد مختلف من الرسائل والمميزات.'
    },
    {
      question: 'هل يمكن تخصيص البوت حسب احتياجاتي؟',
      answer: 'نعم، يمكن تخصيص البوت بالكامل. يمكنك تحديد النبرة، إضافة معرفتك الخاصة، تخصيص الردود، وإعداد قواعد محددة.'
    },
    {
      question: 'كيف أضيف معرفة جديدة للبوت؟',
      answer: 'اذهب إلى قسم "قاعدة المعرفة" في لوحة التحكم، أضف النصوص أو الملفات، ثم اضغط "تدريب البوت".'
    },
    {
      question: 'ما هي أنواع الملفات المدعومة؟',
      answer: 'ندعم النصوص، PDF، DOCX، وروابط المواقع. يمكنك رفع ملفات متعددة أو إضافة محتوى مباشرة.'
    },
    {
      question: 'هل البيانات آمنة؟',
      answer: 'نعم، نحن نحمي بياناتك بأعلى معايير الأمان. جميع البيانات مشفرة ولا نشاركها مع أي طرف ثالث.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-cosmic-950 dark:via-cosmic-900 dark:to-brand-950 font-sans">
      {/* Navigation */}
      <nav className="w-full border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0 z-50">
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
                <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                  فهملي
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/docs" className="text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">
                التوثيق
              </Link>
              <Link href="/pricing">
                <button className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                  الأسعار
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-600 transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link href="/docs" className="hover:text-brand-600 transition-colors">التوثيق</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">استكشاف الأخطاء</span>
        </nav>

        <div className="py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 mb-6">
              <AlertTriangle size={16} />
              <span className="text-sm font-bold">دليل استكشاف الأخطاء</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-red-600 to-orange-600 dark:from-white dark:via-red-400 dark:to-orange-400 bg-clip-text text-transparent">
              حل المشاكل الشائعة
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              دليل مبسط لحل أكثر المشاكل شيوعاً في بوت فهملي مع خطوات واضحة
            </p>
          </motion.div>

          {/* Problems Section */}
          <div className="space-y-8 mb-16">
            {problems.map((problem, index) => (
              <motion.div
                key={problem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-cosmic-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    {problem.icon}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {problem.title}
                    </h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-1 gap-6">
                    {problem.solutions.map((solution, solutionIndex) => (
                      <div key={solutionIndex} className="border border-gray-200 dark:border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          {solution.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {solution.description}
                        </p>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">الخطوات:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                            {solution.steps.map((step, stepIndex) => (
                              <li key={stepIndex}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-cosmic-900 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  الأسئلة المتكررة
                </h2>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-white/10">
              {faqs.map((faq, index) => (
                <div key={index} className="p-6">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </h3>
                    {expandedFAQ === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {expandedFAQ === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 text-gray-600 dark:text-gray-400"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center bg-gradient-to-r from-brand-600 to-purple-600 rounded-3xl p-8 text-white"
          >
            <h2 className="text-3xl font-bold mb-4">
              لم تحل مشكلتك؟
            </h2>
            <p className="text-xl mb-8 opacity-90">
              فريق الدعم جاهز لمساعدتك في أي وقت
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <button className="bg-white text-brand-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold shadow-xl hover:shadow-2xl transition-all">
                  تواصل مع الدعم
                </button>
              </Link>
              <Link href="/docs">
                <button className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition-all">
                  التوثيق الكامل
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white dark:bg-cosmic-900 border-t border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.webp"
                  alt="فهملي"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                  فهملي
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                المنصة الأولى للذكاء الاصطناعي باللغة العربية. أنشئ بوتات ذكية لخدمة عملائك.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">الروابط السريعة</h3>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">التوثيق</Link></li>
                <li><Link href="/pricing" className="text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">الأسعار</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">تواصل معنا</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">الدعم</h3>
              <ul className="space-y-2">
                <li><Link href="/docs/troubleshooting" className="text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">استكشاف الأخطاء</Link></li>
                <li><Link href="/docs" className="text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">دليل المستخدم</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors">الدعم الفني</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              © 2025 فهملي. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}