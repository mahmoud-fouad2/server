'use client';
import PageLayout from '@/components/layout/PageLayout';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export default function PrivacyPage() {
  return (
    <PageLayout>
      <div
        className="min-h-screen bg-gray-50 dark:bg-cosmic-950 py-20 px-6"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white dark:bg-cosmic-900 rounded-3xl p-12 shadow-xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-brand-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                سياسة الخصوصية
              </h1>
            </div>
            <div className="space-y-8 text-gray-700 dark:text-gray-300">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-6 h-6 text-brand-600" />
                  <h2 className="text-2xl font-bold">
                    1. المعلومات التي نجمعها
                  </h2>
                </div>
                <p className="leading-relaxed mb-4">
                  نجمع الأنواع التالية من المعلومات:
                </p>
                <ul className="list-disc pr-6 space-y-2">
                  <li>
                    <strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني،
                    رقم الهاتف، اسم الشركة
                  </li>
                  <li>
                    <strong>معلومات الاستخدام:</strong> عدد المحادثات، الوقت،
                    نوع الجهاز، عنوان IP
                  </li>
                  <li>
                    <strong>معلومات الدفع:</strong> تُعالج بشكل آمن عبر معالجات
                    دفع مرخصة (لا نخزن بيانات البطاقات)
                  </li>
                  <li>
                    <strong>المحتوى:</strong> الملفات المرفوعة (PDF)، قواعد
                    المعرفة، المحادثات مع العملاء
                  </li>
                </ul>
              </section>
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-6 h-6 text-brand-600" />
                  <h2 className="text-2xl font-bold">2. كيف نستخدم معلوماتك</h2>
                </div>
                <ul className="list-disc pr-6 space-y-2">
                  <li>تقديم وتحسين خدماتنا</li>
                  <li>معالجة المدفوعات والفواتير</li>
                  <li>إرسال إشعارات مهمة (انتهاء الباقة، تحديثات النظام)</li>
                  <li>تحليل الاستخدام لتحسين الأداء</li>
                  <li>الدعم الفني وحل المشاكل</li>
                  <li>الامتثال للمتطلبات القانونية</li>
                </ul>
              </section>
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-brand-600" />
                  <h2 className="text-2xl font-bold">3. حماية البيانات</h2>
                </div>
                <p className="leading-relaxed mb-4">
                  نتخذ إجراءات أمنية صارمة:
                </p>
                <ul className="list-disc pr-6 space-y-2">
                  <li>تشفير SSL/TLS لجميع البيانات المنقولة</li>
                  <li>تشفير قواعد البيانات</li>
                  <li>مصادقة ثنائية العامل للحسابات الحساسة</li>
                  <li>نسخ احتياطي يومي للبيانات</li>
                  <li>مراجعات أمنية دورية</li>
                  <li>فريق أمن سيبراني متخصص</li>
                </ul>
              </section>
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <UserCheck className="w-6 h-6 text-brand-600" />
                  <h2 className="text-2xl font-bold">4. مشاركة المعلومات</h2>
                </div>
                <p className="leading-relaxed mb-4">
                  لا نبيع معلوماتك أبداً. نشارك المعلومات فقط في الحالات
                  التالية:
                </p>
                <ul className="list-disc pr-6 space-y-2">
                  <li>
                    <strong>مزودي الخدمة:</strong> معالجات الدفع، مزودي
                    الاستضافة (AWS/Render)
                  </li>
                  <li>
                    <strong>الامتثال القانوني:</strong> عند الطلب الرسمي من جهات
                    حكومية
                  </li>
                  <li>
                    <strong>موافقتك:</strong> عند حصولنا على إذن صريح منك
                  </li>
                </ul>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">
                  5. ملفات تعريف الارتباط (Cookies)
                </h2>
                <p className="leading-relaxed">
                  نستخدم ملفات تعريف الارتباط لتحسين تجربتك: تذكر تسجيل الدخول،
                  التفضيلات، تحليلات الاستخدام. يمكنك تعطيلها من متصفحك، لكن بعض
                  الميزات قد لا تعمل بشكل صحيح.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">6. حقوقك</h2>
                <ul className="list-disc pr-6 space-y-2">
                  <li>
                    <strong>الوصول:</strong> طلب نسخة من بياناتك
                  </li>
                  <li>
                    <strong>التصحيح:</strong> تحديث معلوماتك الشخصية
                  </li>
                  <li>
                    <strong>الحذف:</strong> طلب حذف حسابك وبياناتك
                  </li>
                  <li>
                    <strong>التصدير:</strong> تحميل بياناتك بصيغة قابلة للقراءة
                  </li>
                  <li>
                    <strong>الاعتراض:</strong> رفض معالجة بياناتك لأغراض تسويقية
                  </li>
                </ul>
                <p className="leading-relaxed mt-4">
                  لممارسة حقوقك، تواصل معنا على info@faheemly.com
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">
                  7. الاحتفاظ بالبيانات
                </h2>
                <p className="leading-relaxed">
                  نحتفظ ببياناتك طالما حسابك نشط، أو حسب الحاجة لتقديم الخدمات.
                  بعد حذف الحساب، نحذف بياناتك خلال 90 يوماً (مع الاحتفاظ ببعض
                  السجلات للامتثال القانوني).
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-bold mb-4">8. خصوصية الأطفال</h2>
                <p className="leading-relaxed">
                  خدماتنا غير مخصصة لمن هم دون 18 سنة. لا نجمع معلومات من
                  الأطفال عمداً.
                </p>
              </section>
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-brand-600" />
                  <h2 className="text-2xl font-bold">
                    9. التغييرات على هذه السياسة
                  </h2>
                </div>
                <p className="leading-relaxed">
                  قد نحدث هذه السياسة من وقت لآخر. سنرسل لك إشعاراً بالتغييرات
                  الجوهرية عبر البريد الإلكتروني.
                </p>
              </section>
              <section className="bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">تواصل معنا</h2>
                <p className="leading-relaxed mb-4">
                  لأي استفسارات حول سياسة الخصوصية:
                </p>
                <ul className="list-none space-y-2">
                  <li>
                    📧 <strong>البريد:</strong> info@faheemly.com
                  </li>
                  <li>
                    📱 <strong>الهاتف:</strong> +966 530047640
                  </li>
                  <li>
                    🏢 <strong>العنوان:</strong> الرياض، المملكة العربية
                    السعودية
                  </li>
                </ul>
              </section>
              <p className="text-sm text-gray-500 mt-8 pt-8 border-t">
                آخر تحديث: 4 ديسمبر 2025
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
