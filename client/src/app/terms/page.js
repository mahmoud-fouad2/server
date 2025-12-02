"use client"

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Scale, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/logo';

export default function TermsPage() {
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
            <Scale size={32} />
          </div>
          <h1 className="text-4xl font-bold mb-4">الشروط والأحكام</h1>
          <p className="text-xl text-muted-foreground">آخر تحديث: 2 ديسمبر 2025</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-12 bg-white dark:bg-gray-800 p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold mb-4 text-brand-600">
              <CheckCircle className="w-6 h-6" />
              1. قبول الشروط
            </h2>
            <p>من خلال الوصول إلى واستخدام منصة "فهملي"، فإنك توافق على الالتزام بهذه الشروط والأحكام وجميع القوانين واللوائح المعمول بها. إذا كنت لا توافق على أي من هذه الشروط، فيُحظر عليك استخدام هذا الموقع.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. ترخيص الاستخدام</h2>
            <p>يتم منح إذن لتنزيل نسخة واحدة مؤقتًا من المواد (المعلومات أو البرامج) على موقع فهملي للمشاهدة الشخصية وغير التجارية العابرة فقط. هذا هو منح ترخيص، وليس نقل ملكية.</p>
            <p className="mt-4">بموجب هذا الترخيص، لا يجوز لك:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-600 dark:text-gray-300">
              <li>تعديل أو نسخ المواد.</li>
              <li>استخدام المواد لأي غرض تجاري، أو لأي عرض عام (تجاري أو غير تجاري).</li>
              <li>محاولة فك تشفير أو عكس هندسة أي برنامج موجود على موقع فهملي.</li>
              <li>إزالة أي حقوق نشر أو تدوينات ملكية أخرى من المواد.</li>
            </ul>
          </section>

          <section>
            <h2 className="flex items-center gap-3 text-2xl font-bold mb-4 text-brand-600">
              <AlertCircle className="w-6 h-6" />
              3. إخلاء المسؤولية
            </h2>
            <p>يتم توفير المواد الموجودة على موقع فهملي "كما هي". لا تقدم فهملي أي ضمانات، صريحة أو ضمنية، وتخلي مسؤوليتها وتنفي بموجب هذا جميع الضمانات الأخرى بما في ذلك، على سبيل المثال لا الحصر، الضمانات الضمنية أو شروط التسويق أو الملاءمة لغرض معين.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. القيود</h2>
            <p>في أي حال من الأحوال، لن تكون فهملي أو مورديها مسؤولين عن أي أضرار (بما في ذلك، على سبيل المثال لا الحصر، الأضرار الناجمة عن فقدان البيانات أو الربح، أو بسبب انقطاع الأعمال) الناشئة عن استخدام أو عدم القدرة على استخدام المواد على موقع فهملي.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. دقة المواد</h2>
            <p>قد تتضمن المواد التي تظهر على موقع فهملي أخطاء فنية أو مطبعية أو فوتوغرافية. لا تضمن فهملي أن أيًا من المواد الموجودة على موقعها دقيقة أو كاملة أو حديثة.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. التعديلات</h2>
            <p>قد تقوم فهملي بمراجعة شروط الخدمة هذه لموقعها الإلكتروني في أي وقت دون إشعار مسبق. باستخدام هذا الموقع، فإنك توافق على الالتزام بالإصدار الحالي من شروط الخدمة هذه.</p>
          </section>

          <section className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <h2 className="text-xl font-bold mb-4">تواصل معنا</h2>
            <p>للاستفسارات القانونية، يرجى التواصل عبر:</p>
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
