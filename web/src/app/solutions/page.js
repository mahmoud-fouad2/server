'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/PageLayout';
import {
  Utensils,
  Stethoscope,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  Home,
  ArrowRight,
  Check,
  Zap,
  Shield,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const solutions = [
  {
    id: 'restaurant',
    icon: <Utensils size={40} />,
    title: 'المطاعم والمقاهي',
    description: 'احجز طاولة، اطلب توصيل، استعرض المنيو - كل شيء عبر واتساب',
    color: 'orange',
    features: [
      'حجز الطاولات تلقائياً',
      'قائمة طعام تفاعلية بالصور',
      'استقبال طلبات التوصيل',
      'إشعارات الطلبات للمطبخ',
      'تقييمات العملاء التلقائية',
    ],
    stats: {
      increase: '45%',
      metric: 'زيادة في الطلبات',
      time: '70%',
      timeMetric: 'تقليل وقت الرد',
    },
    image: '/assets/images/restaurant.jpg',
  },
  {
    id: 'clinic',
    icon: <Stethoscope size={40} />,
    title: 'العيادات الطبية',
    description: 'احجز موعد، استشارة طبية، متابعة الحالات - بكل سهولة',
    color: 'blue',
    features: [
      'حجز المواعيد والتذكير بها',
      'استشارات طبية أولية',
      'إدارة قوائم الانتظار',
      'إرسال نتائج التحاليل',
      'متابعة الحالات المزمنة',
    ],
    stats: {
      increase: '60%',
      metric: 'تقليل المواعيد الفائتة',
      time: '80%',
      timeMetric: 'تقليل الاتصالات الهاتفية',
    },
    image: '/assets/images/clinic.jpg',
  },
  {
    id: 'retail',
    icon: <ShoppingBag size={40} />,
    title: 'التجارة الإلكترونية',
    description: 'عرض المنتجات، إتمام الطلبات، متابعة الشحنات',
    color: 'purple',
    features: [
      'كتالوج منتجات تفاعلي',
      'إتمام عمليات الشراء',
      'تتبع الشحنات',
      'توصيات منتجات ذكية',
      'استرجاع وتبديل سلس',
    ],
    stats: {
      increase: '55%',
      metric: 'زيادة معدل التحويل',
      time: '24/7',
      timeMetric: 'خدمة مبيعات متواصلة',
    },
    image: '/assets/images/retail.jpg',
  },
  {
    id: 'business',
    icon: <Briefcase size={40} />,
    title: 'الشركات والمؤسسات',
    description: 'دعم فني، استقبال طلبات، إدارة الموظفين',
    color: 'green',
    features: [
      'نظام تذاكر الدعم الفني',
      'قاعدة معرفية ذكية',
      'إدارة الطلبات والعروض',
      'تقارير تحليلية شاملة',
      'تكامل مع أنظمة CRM',
    ],
    stats: {
      increase: '70%',
      metric: 'تحسين رضا العملاء',
      time: '50%',
      timeMetric: 'تقليل تكاليف الدعم',
    },
    image: '/assets/images/business.jpg',
  },
  {
    id: 'education',
    icon: <GraduationCap size={40} />,
    title: 'التعليم والتدريب',
    description: 'تسجيل الطلاب، الاستشارات، متابعة الدورات',
    color: 'indigo',
    features: [
      'تسجيل الطلاب تلقائياً',
      'إرسال المواد التعليمية',
      'متابعة الحضور والغياب',
      'تنبيهات الامتحانات',
      'استشارات أكاديمية',
    ],
    stats: {
      increase: '65%',
      metric: 'زيادة التسجيلات',
      time: '90%',
      timeMetric: 'أتمتة العمليات الإدارية',
    },
    image: '/assets/images/education.jpg',
  },
  {
    id: 'realestate',
    icon: <Home size={40} />,
    title: 'العقارات',
    description: 'عرض العقارات، حجز المعاينات، استشارات تمويلية',
    color: 'red',
    features: [
      'كتالوج عقارات تفاعلي',
      'جدولة معاينات تلقائية',
      'حاسبة تمويل عقاري',
      'مطابقة العقارات الذكية',
      'متابعة العملاء المحتملين',
    ],
    stats: {
      increase: '40%',
      metric: 'زيادة المعاينات',
      time: '60%',
      timeMetric: 'تسريع عملية البيع',
    },
    image: '/assets/images/realestate.jpg',
  },
];

export default function SolutionsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <noscript>
        <div
          style={{
            padding: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif',
            direction: 'rtl',
          }}
        >
          <h1>حلول فهملي للأعمال</h1>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            اكتشف كيف يمكن لفهملي أن يحدث ثورة في طريقة تواصلك مع عملائك
          </p>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div
              style={{
                border: '1px solid #ddd',
                padding: '20px',
                borderRadius: '8px',
              }}
            >
              <h2>🍽️ المطاعم والمقاهي</h2>
              <p>احجز طاولة، اطلب توصيل، استعرض المنيو - كل شيء عبر واتساب</p>
            </div>
            <div
              style={{
                border: '1px solid #ddd',
                padding: '20px',
                borderRadius: '8px',
              }}
            >
              <h2>🏥 العيادات الطبية</h2>
              <p>حجز المواعيد والرد على الاستفسارات الطبية تلقائياً</p>
            </div>
            <div
              style={{
                border: '1px solid #ddd',
                padding: '20px',
                borderRadius: '8px',
              }}
            >
              <h2>🛍️ التجارة الإلكترونية</h2>
              <p>عرض المنتجات وإتمام الطلبات ومتابعة الشحنات</p>
            </div>
          </div>

          <p style={{ marginTop: '30px', textAlign: 'center' }}>
            <a
              href="/register"
              style={{
                padding: '15px 30px',
                background: '#7C3AED',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                display: 'inline-block',
              }}
            >
              ابدأ الآن
            </a>
          </p>
        </div>
      </noscript>
      <PageLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
          {/* Hero Section */}
          <section className="relative pt-32 pb-20 px-6 overflow-hidden border-b border-gray-200 dark:border-white/5">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent"></div>

            <div className="max-w-7xl mx-auto text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block px-4 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-bold mb-6">
                  حلول متكاملة لكل الصناعات
                </span>
                <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
                  الحل الأمثل لكل نشاط تجاري
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
                  اكتشف كيف يمكن لفهملي أن يحدث ثورة في طريقة تواصلك مع عملائك
                </p>
              </motion.div>
            </div>
          </section>

          {/* Solutions Grid */}
          <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12">
                {solutions.map((solution, index) => (
                  <motion.div
                    key={solution.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-cosmic-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-xl transition-all duration-300 group hover:-translate-y-2 cursor-pointer relative"
                  >
                    {/* Icon & Title Section - No Image */}
                    <div className="relative p-6 pb-4 bg-gradient-to-br from-gray-50 to-white dark:from-white/[0.03] dark:to-transparent">
                      <div
                        className={`inline-flex w-12 h-12 rounded-xl bg-${solution.color}-500/10 text-${solution.color}-600 dark:text-${solution.color}-400 items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105`}
                      >
                        {solution.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {solution.title}
                      </h3>
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {solution.description}
                      </p>

                      {/* Features List - Compact */}
                      <ul className="space-y-2 mb-5">
                        {solution.features.slice(0, 4).map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <Check
                              size={14}
                              className="text-green-500 flex-shrink-0"
                              strokeWidth={3}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Stats - Inline */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <div>
                          <div className="text-lg font-bold text-brand-600 dark:text-brand-400">
                            {solution.stats.increase}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {solution.stats.metric}
                          </div>
                        </div>
                        <div className="text-right border-r pr-3 dark:border-white/10">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {solution.stats.time}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {solution.stats.timeMetric}
                          </div>
                        </div>
                      </div>

                      {/* CTA with Enhanced Animation */}
                      <Link href={`/solutions/${solution.id}`}>
                        <Button className="w-full py-3.5 text-base font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all group-hover:scale-[1.02] bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600">
                          استكشف الحل
                          <ArrowRight
                            size={18}
                            className="mr-2 group-hover:translate-x-1 transition-transform"
                          />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Banner */}
          <section className="py-20 px-6 bg-gradient-to-b from-brand-500 to-brand-600 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">لماذا تختار فهملي؟</h2>
                <p className="text-xl opacity-90">
                  مميزات تجعلنا الخيار الأفضل لجميع الأعمال
                </p>
              </div>

              <div className="grid md:grid-cols-4 gap-8">
                {[
                  {
                    icon: <Zap size={32} />,
                    title: 'سريع وذكي',
                    desc: 'ردود فورية على مدار الساعة',
                  },
                  {
                    icon: <Shield size={32} />,
                    title: 'آمن ومحمي',
                    desc: 'بيانات عملائك في أمان تام',
                  },
                  {
                    icon: <Clock size={32} />,
                    title: 'متاح 24/7',
                    desc: 'لا إجازات ولا أوقات عمل محددة',
                  },
                  {
                    icon: <TrendingUp size={32} />,
                    title: 'زيادة المبيعات',
                    desc: 'تحويل أكثر من 40% من المحادثات',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="opacity-90">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                جاهز للبدء؟
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
                ابدأ تجربتك المجانية لمدة 7 أيام - لا حاجة لبطاقة ائتمانية
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button className="h-14 px-8 text-xl rounded-full shadow-xl">
                    ابدأ التجربة المجانية
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    className="h-14 px-8 text-xl rounded-full"
                  >
                    تواصل معنا
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </PageLayout>
    </>
  );
}
