"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PageLayout from '@/components/layout/PageLayout'
import { 
  Stethoscope, 
  Check,
  ArrowRight,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  MessageCircle,
  Bell,
  FileText,
  Shield
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function ClinicSolution() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <div className="w-20 h-20 rounded-3xl bg-blue-500 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Stethoscope size={40} />
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
                حلول العيادات الطبية
              </h1>
              <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
                نظام حجز مواعيد ذكي يحسّن تجربة المرضى ويقلل العبء الإداري
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button className="h-14 px-8 text-xl rounded-full shadow-xl">
                    ابدأ تجربتك المجانية
                    <ArrowRight size={20} className="mr-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="h-14 px-8 text-xl rounded-full">
                    احجز عرضاً توضيحياً
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10"
            >
              <img 
                src="/assets/images/clinic-solution.jpg" 
                alt="حلول العيادات"
                className="w-full h-[500px] object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200"
                }}
              />
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 px-6 bg-white dark:bg-cosmic-900">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: <TrendingUp />, number: '60%', label: 'تقليل المواعيد الفائتة' },
                { icon: <Clock />, number: '80%', label: 'تقليل المكالمات الهاتفية' },
                { icon: <Users />, number: '90%', label: 'رضا المرضى' },
                { icon: <Calendar />, number: '3x', label: 'زيادة في الحجوزات' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 text-blue-500">
                    {stat.icon}
                  </div>
                  <div className="text-4xl font-bold text-blue-500 mb-2">{stat.number}</div>
                  <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
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
                نظام متكامل لإدارة عيادتك
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                كل ما تحتاجه لإدارة المواعيد والمرضى بكفاءة
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <Calendar size={32} />,
                  title: 'حجز المواعيد التلقائي',
                  desc: 'يتيح للمرضى حجز مواعيدهم مباشرة عبر واتساب مع التحقق الفوري من التوفر وإرسال تأكيد الحجز'
                },
                {
                  icon: <Bell size={32} />,
                  title: 'تذكيرات ذكية',
                  desc: 'إرسال تذكيرات تلقائية للمرضى قبل موعدهم بـ 24 ساعة و1 ساعة لتقليل المواعيد الفائتة'
                },
                {
                  icon: <MessageCircle size={32} />,
                  title: 'الإجابة على الاستفسارات الطبية',
                  desc: 'الرد على الأسئلة الشائعة حول التخصصات، الأسعار، التأمينات المقبولة، وأوقات العمل'
                },
                {
                  icon: <Users size={32} />,
                  title: 'إدارة قوائم الانتظار',
                  desc: 'تنظيم المرضى في قوائم انتظار ذكية وإخطارهم عند اقتراب دورهم'
                },
                {
                  icon: <FileText size={32} />,
                  title: 'إرسال التقارير والنتائج',
                  desc: 'إرسال نتائج التحاليل والتقارير الطبية للمرضى بشكل آمن ومشفر عبر واتساب'
                },
                {
                  icon: <Shield size={32} />,
                  title: 'حماية البيانات الطبية',
                  desc: 'نظام آمن ومتوافق مع معايير حماية البيانات الطبية وخصوصية المرضى'
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-cosmic-900 p-8 rounded-3xl border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
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
        <section className="py-20 px-6 bg-gradient-to-b from-blue-500 to-blue-600 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">كيف يعمل النظام؟</h2>
              <p className="text-xl opacity-90">أمثلة واقعية من الاستخدام اليومي</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'حجز موعد جديد',
                  scenario: 'مريض يرسل "عايز أحجز كشف أسنان" - البوت يعرض المواعيد المتاحة ويؤكد الحجز فوراً'
                },
                {
                  title: 'إلغاء أو تعديل',
                  scenario: 'مريض يطلب "عايز أغيّر موعدي" - البوت يعرض المواعيد الجديدة ويعدّل الحجز تلقائياً'
                },
                {
                  title: 'استفسار طبي',
                  scenario: 'مريض يسأل "هل تقبلون تأمين بوبا؟" - البوت يرد فوراً بجميع التأمينات المقبولة'
                }
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
              لا حاجة لبطاقة ائتمانية
            </p>
            <div className="bg-white dark:bg-cosmic-900 rounded-3xl p-10 border border-gray-200 dark:border-white/10 shadow-xl max-w-md mx-auto">
              <div className="text-5xl font-bold text-blue-500 mb-2">99 ر.س</div>
              <div className="text-gray-600 dark:text-gray-400 mb-8">شهرياً</div>
              <ul className="text-right space-y-3 mb-8">
                {[
                  '4,000 محادثة شهرياً',
                  'حجز مواعيد تلقائي',
                  'تذكيرات ذكية',
                  'قوائم انتظار',
                  'حماية البيانات',
                  'دعم فني مباشر'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <Check size={20} className="text-blue-500 flex-shrink-0" strokeWidth={3} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full h-14 text-lg font-bold rounded-xl">
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
              حسّن تجربة مرضاك اليوم
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
              انضم لمئات العيادات التي تستخدم فهملي
            </p>
            <Link href="/register">
              <Button className="h-16 px-12 text-xl font-bold rounded-full shadow-2xl">
                ابدأ التجربة المجانية الآن
                <ArrowRight size={24} className="mr-2" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
