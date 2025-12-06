'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/PageLayout';
import {
  Utensils,
  Check,
  ArrowRight,
  Star,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RestaurantSolution() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent"></div>

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <div className="w-20 h-20 rounded-3xl bg-orange-500 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Utensils size={40} />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                حلول المطاعم والمقاهي
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                حوّل واتساب إلى نظام إدارة متكامل لمطعمك - من الحجز إلى التوصيل
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button className="h-14 px-10 text-lg rounded-full shadow-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all">
                    ابدأ تجربتك المجانية
                    <ArrowRight size={20} className="mr-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    className="h-14 px-10 text-lg rounded-full border-2 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                  >
                    احجز عرضاً توضيحياً
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-cosmic-800"
            >
              <img
                src="/assets/images/restaurant-hero.jpg"
                alt="حلول المطاعم"
                className="w-full h-[500px] object-cover"
                loading="lazy"
              />
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-6 bg-white dark:bg-cosmic-900">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: <TrendingUp />,
                  number: '45%',
                  label: 'زيادة في الطلبات',
                },
                { icon: <Clock />, number: '70%', label: 'تقليل وقت الانتظار' },
                { icon: <Users />, number: '85%', label: 'رضا العملاء' },
                {
                  icon: <DollarSign />,
                  number: '30%',
                  label: 'زيادة في الإيرادات',
                },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4 text-orange-500">
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-orange-500 mb-2">
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

        {/* Features Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                كل ما يحتاجه مطعمك في مكان واحد
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                أتمتة كاملة لجميع عمليات مطعمك عبر واتساب
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <MessageCircle size={32} />,
                  title: 'حجز الطاولات التلقائي',
                  desc: 'يستقبل البوت طلبات الحجز تلقائياً، يتحقق من التوفر، ويرسل تأكيداً فورياً للعميل مع تفاصيل الحجز',
                },
                {
                  icon: <Utensils size={32} />,
                  title: 'قائمة طعام تفاعلية بالصور',
                  desc: 'عرض المنيو الكامل مع الصور والأسعار، تصنيف حسب الفئات، وإمكانية البحث عن أطباق محددة',
                },
                {
                  icon: <Smartphone size={32} />,
                  title: 'استقبال طلبات التوصيل',
                  desc: 'استقبال الطلبات، حساب المبلغ تلقائياً، تأكيد العنوان، وإرسال وقت التوصيل المتوقع',
                },
                {
                  icon: <Clock size={32} />,
                  title: 'إشعارات وتذكيرات ذكية',
                  desc: 'تذكير العملاء بموعد الحجز، إخطارهم بجاهزية الطلب، وطلب التقييم بعد الخدمة',
                },
                {
                  icon: <Star size={32} />,
                  title: 'تقييمات تلقائية',
                  desc: 'جمع تقييمات العملاء تلقائياً بعد كل طلب، وتحليل الملاحظات لتحسين الخدمة',
                },
                {
                  icon: <Users size={32} />,
                  title: 'إدارة قوائم الانتظار',
                  desc: 'تنظيم قوائم الانتظار بكفاءة، إخطار العملاء بدورهم، وتقليل الازدحام في المطعم',
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
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500">
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
        <section className="py-20 px-6 bg-gradient-to-b from-orange-500 to-orange-600 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">سيناريوهات حقيقية</h2>
              <p className="text-xl opacity-90">
                كيف يستخدم مطعمك فهملي يومياً
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'عميل جديد',
                  scenario:
                    'يرسل "عايز أحجز طاولة لـ 4 أشخاص الساعة 8 مساءً" - يرد البوت فوراً بالتأكيد والتفاصيل',
                },
                {
                  title: 'طلب توصيل',
                  scenario:
                    'يطلب "2 برجر و كولا" - البوت يعرض الاختيارات، يحسب المبلغ، يؤكد العنوان، ويُرسل الطلب للمطبخ',
                },
                {
                  title: 'استفسار عن المنيو',
                  scenario:
                    'يسأل "عندكم أكل نباتي؟" - البوت يعرض جميع الخيارات النباتية مع الصور والأسعار',
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

        {/* Pricing Preview */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
              جرّب مجاناً لمدة 7 أيام
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
              ابدأ بدون بطاقة ائتمانية - شاهد النتائج بنفسك
            </p>
            <div className="bg-white dark:bg-cosmic-900 rounded-3xl p-10 border-2 border-orange-200 dark:border-orange-800 shadow-2xl max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="inline-block px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
                  <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                    باقة المطاعم
                  </span>
                </div>
                <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  ابدأ بـ 99 ر.س
                </div>
                <div className="text-gray-700 dark:text-gray-300 font-medium">
                  شهرياً - جرب مجاناً 7 أيام
                </div>
              </div>
              <ul className="text-right space-y-4 mb-8">
                {[
                  'حجز طاولات تلقائي ذكي',
                  'قائمة طعام تفاعلية بالصور',
                  'استقبال طلبات التوصيل',
                  'تقييمات العملاء التلقائية',
                  'رد فوري على الاستفسارات',
                  'دعم فني مباشر 24/7',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-gray-800 dark:text-gray-200"
                  >
                    <Check
                      size={22}
                      className="text-orange-500 dark:text-orange-400 flex-shrink-0"
                      strokeWidth={3}
                    />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
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
              انضم لمئات المطاعم الناجحة
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
              ابدأ اليوم وشاهد الفرق في أسبوع واحد
            </p>
            <Link href="/register">
              <Button className="h-16 px-12 text-xl font-bold rounded-full shadow-2xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
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
