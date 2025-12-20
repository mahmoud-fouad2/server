'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TroubleshootingSection() {
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
    <div className="space-y-12">
      {/* Problems Section */}
      <div className="space-y-8">
        {problems.map((problem, index) => (
          <motion.div
            key={problem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
                  <div key={solutionIndex} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              الأسئلة المتكررة
            </h2>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
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
    </div>
  );
}
