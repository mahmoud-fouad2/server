"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PageLayout from '@/components/layout/PageLayout'
import Head from 'next/head'
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
  TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

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
      'تقييمات العملاء التلقائية'
    ],
    stats: {
      increase: '45%',
      metric: 'زيادة في الطلبات',
      time: '70%',
      timeMetric: 'تقليل وقت الرد'
    },
    image: '/assets/images/restaurant-solution.jpg'
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
      'متابعة الحالات المزمنة'
    ],
    stats: {
      increase: '60%',
      metric: 'تقليل المواعيد الفائتة',
      time: '80%',
      timeMetric: 'تقليل الاتصالات الهاتفية'
    },
    image: '/assets/images/clinic-solution.jpg'
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
      'استرجاع وتبديل سلس'
    ],
    stats: {
      increase: '55%',
      metric: 'زيادة معدل التحويل',
      time: '24/7',
      timeMetric: 'خدمة مبيعات متواصلة'
    },
    image: '/assets/images/retail-solution.jpg'
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
      'تكامل مع أنظمة CRM'
    ],
    stats: {
      increase: '70%',
      metric: 'تحسين رضا العملاء',
      time: '50%',
      timeMetric: 'تقليل تكاليف الدعم'
    },
    image: '/assets/images/business-solution.jpg'
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
      'استشارات أكاديمية'
    ],
    stats: {
      increase: '65%',
      metric: 'زيادة التسجيلات',
      time: '90%',
      timeMetric: 'أتمتة العمليات الإدارية'
    },
    image: '/assets/images/education-solution.jpg'
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
      'متابعة العملاء المحتملين'
    ],
    stats: {
      increase: '40%',
      metric: 'زيادة المعاينات',
      time: '60%',
      timeMetric: 'تسريع عملية البيع'
    },
    image: '/assets/images/realestate-solution.jpg'
  }
]

export default function SolutionsPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedSolution, setSelectedSolution] = useState(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
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
                className="bg-white dark:bg-cosmic-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 hover:shadow-2xl transition-all group"
              >
                {/* Image Header */}
                <div className="relative h-64 overflow-hidden bg-gray-100 dark:bg-cosmic-800">
                  <img 
                    src={solution.image} 
                    alt={solution.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className={`absolute bottom-6 right-6 w-16 h-16 rounded-2xl bg-${solution.color}-500 text-white flex items-center justify-center shadow-xl`}>
                    {solution.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                    {solution.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                    {solution.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {solution.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check size={12} className="text-green-500" strokeWidth={3} />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 dark:bg-white/5 rounded-2xl mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-1">
                        {solution.stats.increase}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {solution.stats.metric}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-brand-600 dark:text-brand-400 mb-1">
                        {solution.stats.time}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {solution.stats.timeMetric}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link href={`/solutions/${solution.id}`}>
                    <Button className="w-full py-4 text-lg font-bold rounded-xl shadow-lg">
                      اعرف المزيد عن {solution.title}
                      <ArrowRight size={20} className="mr-2" />
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
            <p className="text-xl opacity-90">مميزات تجعلنا الخيار الأفضل لجميع الأعمال</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Zap size={32} />, title: 'سريع وذكي', desc: 'ردود فورية على مدار الساعة' },
              { icon: <Shield size={32} />, title: 'آمن ومحمي', desc: 'بيانات عملائك في أمان تام' },
              { icon: <Clock size={32} />, title: 'متاح 24/7', desc: 'لا إجازات ولا أوقات عمل محددة' },
              { icon: <TrendingUp size={32} />, title: 'زيادة المبيعات', desc: 'تحويل أكثر من 40% من المحادثات' }
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
              <Button variant="outline" className="h-14 px-8 text-xl rounded-full">
                تواصل معنا
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </div>
    </PageLayout>
  )
}
