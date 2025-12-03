"use client"

import PageLayout from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Utensils, Check, ArrowRight, Clock, Users, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RestaurantPage() {
  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-gradient-to-b from-orange-50 to-white dark:from-cosmic-900 dark:to-cosmic-950">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-500/10 mb-6">
                <Utensils size={40} className="text-orange-500" />
              </div>
              <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                حلول فهملي للمطاعم والمقاهي
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
                زد مبيعاتك 45% مع مساعد ذكي يستقبل الطلبات ويحجز الطاولات تلقائياً على مدار الساعة
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/register">
                  <Button className="h-14 px-8 text-lg">
                    ابدأ تجربتك المجانية
                    <ArrowRight size={20} className="mr-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">المميزات الرئيسية</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Clock size={32} />, title: 'توفير 70% من الوقت', desc: 'رد تلقائي على الاستفسارات' },
                { icon: <Users size={32} />, title: 'زيادة الطلبات 45%', desc: 'خدمة 24/7 بدون توقف' },
                { icon: <TrendingUp size={32} />, title: 'تحسين الخدمة', desc: 'رضا أعلى للعملاء' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-cosmic-900 p-8 rounded-2xl border border-gray-200 dark:border-white/10"
                >
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-white dark:bg-cosmic-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">ابدأ بـ 99 ريال فقط شهرياً</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
              تجربة مجانية 7 أيام - بدون بطاقة ائتمانية
            </p>
            <Link href="/register">
              <Button className="h-16 px-12 text-xl">
                ابدأ الآن
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </PageLayout>
  )
}
