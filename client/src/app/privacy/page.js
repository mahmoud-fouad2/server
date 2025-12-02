"use client"

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Lock, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/logo';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-brand-600">
            <Logo className="w-8 h-8" />
            فهملي<span className="text-gray-900 dark:text-white">.كوم</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowRight size={16} /> العودة للرئيسية
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl font-bold mb-4">سياسة الخصوصية</h1>
          <p className="text-xl text-muted-foreground">آخر تحديث: 2 ديسمبر 2025</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-12 bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold mb-4 text-brand-600">
              <Eye className="w-6 h-6" />
              1. المعلومات التي نجمعها
            </h2>
            <p>نحن في فهملي نجمع المعلومات التالية لتقديم خدماتنا وتحسينها:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-600 dark:text-gray-300">
              <li><strong>معلومات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف، واسم الشركة.</li>
              <li><strong>معلومات الاستخدام:</strong> كيفية تفاعلك مع خدماتنا، السجلات، والبيانات التحليلية.</li>
              <li><strong>المحتوى:</strong> الرسائل والمحادثات التي تتم معالجتها عبر البوت (يتم تخزينها بشكل مشفر).</li>
              <li><strong>معلومات الدفع:</strong> تتم معالجتها عبر بوابات دفع آمنة ولا نحتفظ ببيانات البطاقات الكاملة.</li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold mb-4 text-brand-600">
              <Lock className="w-6 h-6" />
              2. كيف نستخدم معلوماتك
            </h2>
            <p>نستخدم البيانات للأغراض التالية:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-600 dark:text-gray-300">
              <li>تقديم وتشغيل وصيانة خدماتنا.</li>
              <li>تحسين وتخصيص وتوسيع خدماتنا.</li>
              <li>فهم وتحليل كيفية استخدامك لخدماتنا.</li>
              <li>تطوير منتجات وخدمات وميزات ووظائف جديدة.</li>
              <li>التواصل معك، إما مباشرة أو من خلال أحد شركائنا، بما في ذلك لخدمة العملاء.</li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold mb-4 text-brand-600">
              <FileText className="w-6 h-6" />
              3. مشاركة البيانات
            </h2>
            <p>نحن لا نبيع بياناتك الشخصية. قد نشارك المعلومات فقط في الحالات التالية:</p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-600 dark:text-gray-300">
              <li>مع مزودي الخدمة الموثوقين (مثل مزودي الاستضافة ومعالجة الدفع) الذين يساعدوننا في تشغيل أعمالنا.</li>
              <li>للامتثال للقوانين واللوائح المعمول بها.</li>
              <li>لحماية حقوقنا وممتلكاتنا وسلامتنا وسلامة مستخدمينا.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. أمن البيانات</h2>
            <p>نحن نستخدم إجراءات أمنية إدارية وتقنية ومادية معقولة تجاريًا لحماية معلوماتك الشخصية. ومع ذلك، لا يوجد نقل عبر الإنترنت أو تخزين إلكتروني آمن بنسبة 100%.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. حقوقك</h2>
            <p>لديك الحق في الوصول إلى بياناتك الشخصية وتصحيحها وحذفها. يمكنك إدارة إعدادات حسابك أو الاتصال بنا لممارسة هذه الحقوق.</p>
          </section>

          <section className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <h2 className="text-xl font-bold mb-4">تواصل معنا</h2>
            <p>إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا:</p>
            <p className="mt-2 font-medium text-brand-600">info@Faheemly.com</p>
          </section>
        </div>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
          <p>© 2025 فهملي.كوم. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
