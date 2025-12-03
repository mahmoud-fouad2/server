"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PageLayout from '@/components/layout/PageLayout'
import { Home, Check, ArrowRight, MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RealEstateSolution() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        <section className="relative pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
              <div className="w-20 h-20 rounded-3xl bg-red-500 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Home size={40} />
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">حلول العقارات</h1>
              <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">اعرض عقاراتك واحجز المعاينات عبر واتساب</p>
              <div className="flex gap-4 justify-center">
                <Link href="/register"><Button className="h-14 px-8 text-xl rounded-full shadow-xl">ابدأ تجربتك المجانية<ArrowRight size={20} className="mr-2" /></Button></Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="rounded-3xl overflow-hidden shadow-2xl">
              <img src="/assets/images/realestate-solution.jpg" alt="حلول العقارات" className="w-full h-[500px] object-cover" onError={(e) => e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200"} />
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-6 bg-white dark:bg-cosmic-900">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
            {[
              { icon: <TrendingUp />, number: '40%', label: 'زيادة في المعاينات' },
              { icon: <Calendar />, number: '60%', label: 'تسريع عملية البيع' },
              { icon: <MapPin />, number: '100+', label: 'عقار منشور' },
              { icon: <DollarSign />, number: '85%', label: 'رضا العملاء' }
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500">{stat.icon}</div>
                <div className="text-4xl font-bold text-red-500 mb-2">{stat.number}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">بيع وتأجير أسرع</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: 'كتالوج عقارات تفاعلي', desc: 'عرض العقارات بالصور والمواصفات والأسعار' },
                { title: 'جدولة معاينات تلقائية', desc: 'حجز مواعيد المعاينات بشكل فوري وتلقائي' },
                { title: 'حاسبة تمويل عقاري', desc: 'مساعدة العملاء في حساب القسط الشهري' },
                { title: 'مطابقة ذكية', desc: 'اقتراح عقارات تناسب احتياجات العميل' }
              ].map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-white dark:bg-cosmic-900 p-8 rounded-3xl border hover:shadow-xl transition-all">
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">ابدأ عرض عقاراتك</h2>
            <Link href="/register"><Button className="h-16 px-12 text-xl font-bold rounded-full shadow-2xl">ابدأ التجربة المجانية<ArrowRight size={24} className="mr-2" /></Button></Link>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
