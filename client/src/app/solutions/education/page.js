'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/PageLayout';
import {
  GraduationCap,
  Check,
  ArrowRight,
  BookOpen,
  Calendar,
  Users,
  TrendingUp,
  MessageCircle,
  Bell,
  FileText,
  Video,
  Award,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function EducationSolution() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <div className="w-20 h-20 rounded-3xl bg-indigo-500 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <GraduationCap size={40} />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                حلول التعليم والتدريب
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                أتمتة العمليات الإدارية وتحسين التواصل مع الطلاب وأولياء الأمور
                عبر واتساب
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button className="h-14 px-10 text-lg rounded-full shadow-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 transition-all">
                    ابدأ تجربتك المجانية
                    <ArrowRight size={20} className="mr-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    className="h-14 px-10 text-lg rounded-full border-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  >
                    احجز عرضاً توضيحياً
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-cosmic-800"
            >
              <img
                src="/assets/images/education-hero.jpg"
                alt="حلول التعليم"
                className="w-full h-[500px] object-cover"
                loading="lazy"
              />
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 px-6 bg-white dark:bg-cosmic-900">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: <TrendingUp />,
                  number: '65%',
                  label: 'زيادة في التسجيلات',
                },
                {
                  icon: <Users />,
                  number: '90%',
                  label: 'أتمتة العمليات الإدارية',
                },
                {
                  icon: <Calendar />,
                  number: '75%',
                  label: 'تقليل الاستفسارات المتكررة',
                },
                { icon: <Award />, number: '85%', label: 'رضا أولياء الأمور' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 text-indigo-500">
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-indigo-500 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                نظام تعليمي متكامل عبر واتساب
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                كل ما تحتاجه لإدارة مؤسستك التعليمية بكفاءة
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <FileText size={32} />,
                  title: 'تسجيل الطلاب التلقائي',
                  desc: 'استقبال طلبات التسجيل، جمع البيانات المطلوبة، والتأكيد الفوري للطلاب وأولياء الأمور',
                },
                {
                  icon: <BookOpen size={32} />,
                  title: 'إرسال المواد التعليمية',
                  desc: 'توزيع الملفات، الفيديوهات، والواجبات على الطلاب مباشرة عبر واتساب',
                },
                {
                  icon: <Calendar size={32} />,
                  title: 'متابعة الحضور والغياب',
                  desc: 'إخطار أولياء الأمور تلقائياً عند غياب أبنائهم ومتابعة معدلات الحضور',
                },
                {
                  icon: <Bell size={32} />,
                  title: 'تنبيهات الامتحانات',
                  desc: 'إرسال تذكيرات بمواعيد الاختبارات، الجداول، والنتائج للطلاب وأولياء الأمور',
                },
                {
                  icon: <MessageCircle size={32} />,
                  title: 'استشارات أكاديمية',
                  desc: 'الرد على استفسارات الطلاب حول المناهج، الجداول، والخدمات المقدمة',
                },
                {
                  icon: <Video size={32} />,
                  title: 'إشعارات الحصص الأونلاين',
                  desc: 'إرسال روابط المحاضرات الافتراضية وتذكير الطلاب بمواعيدها',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-cosmic-900 p-8 rounded-3xl border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 px-6 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">سيناريوهات يومية</h2>
              <p className="text-xl opacity-90">كيف يُسهّل فهملي عملك اليومي</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'تسجيل طالب جديد',
                  scenario:
                    'ولي أمر يرسل "عايز أسجل ابني في دورة إنجليزي" - البوت يقرأ البيانات المتاحة في النظام ويعرض الدورات والمواعيد والأسعار',
                },
                {
                  title: 'استفسار عن الجدول',
                  scenario:
                    'طالب يسأل "امتى موعد الامتحان؟" - البوت يقرأ من قاعدة البيانات ويرسل جدول الامتحانات الكامل',
                },
                {
                  title: 'طلب شهادة',
                  scenario:
                    'طالب يطلب "عايز شهادة حضور" - البوت يقرأ بيانات الطالب ويرسل رابط تحميل الشهادة أو يوجهه للخطوات المطلوبة',
                },
              ].map((useCase, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                  <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
                  <p className="opacity-90">{useCase.scenario}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              جرّب مجاناً لمدة 7 أيام
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
              بدون بطاقة ائتمانية - ابدأ فوراً
            </p>
            <div className="bg-white dark:bg-cosmic-900 rounded-3xl p-10 border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    باقة التعليم
                  </span>
                </div>
                <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                  ابدأ بـ 99 ر.س
                </div>
                <div className="text-gray-700 dark:text-gray-300 font-medium">
                  شهرياً - جرب مجاناً 7 أيام
                </div>
              </div>
              <ul className="text-right space-y-3 mb-8">
                {[
                  'تسجيل طلاب تلقائي',
                  'إرسال مواد تعليمية بالملفات',
                  'متابعة حضور وغياب',
                  'تنبيهات امتحانات ومواعيد',
                  'رد فوري على استفسارات الطلاب',
                  'دعم فني مباشر 24/7',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-gray-800 dark:text-gray-200"
                  >
                    <Check
                      size={22}
                      className="text-indigo-500 flex-shrink-0"
                      strokeWidth={3}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600">
                  ابدأ الآن
                  <ArrowRight size={20} className="mr-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-cosmic-900 dark:to-cosmic-950">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              وفّر وقتك وركّز على التدريس
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
              دع فهملي يتولى الإدارة بينما تركز على ما تحب
            </p>
            <Link href="/register">
              <Button className="h-16 px-12 text-xl font-bold rounded-full shadow-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600">
                ابدأ التجربة المجانية الآن
                <ArrowRight size={24} className="mr-2" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
