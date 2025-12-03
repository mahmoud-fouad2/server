"use client"

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import PageLayout from '@/components/layout/PageLayout'
import { 
  MessageSquare, 
  Mic, 
  Upload, 
  Globe,
  Zap,
  Bot,
  BarChart3,
  Settings,
  Shield,
  Clock,
  Users,
  Phone,
  Mail,
  Check,
  ArrowRight
} from "lucide-react"
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const services = [
  {
    icon: <MessageSquare size={40} />,
    title: 'ربط واتساب الذكي',
    description: 'اربط رقمك التجاري بمنصة فهملي، وسيقوم البوت بالرد على استفسارات العملاء، أخذ الطلبات، وحجز المواعيد تلقائياً 24/7.',
    color: 'green',
    features: [
      'ربط سريع في أقل من دقيقة',
      'رد تلقائي على جميع الاستفسارات',
      'قبول الطلبات وحجز المواعيد',
      'يعمل على مدار الساعة',
      'دعم اللهجات المختلفة'
    ]
  },
  {
    icon: <Globe size={40} />,
    title: 'ويدجت الموقع الإلكتروني',
    description: 'أضف أيقونة دردشة أنيقة لموقعك. قابلة للتخصيص بالكامل (الألوان، الترحيب) وتعمل بنفس ذكاء بوت الواتساب.',
    color: 'blue',
    features: [
      'تصميم قابل للتخصيص بالكامل',
      'تطابق ألوان موقعك',
      'رسالة ترحيب مخصصة',
      'سهولة التركيب (كود واحد)',
      'متجاوب مع جميع الأجهزة'
    ]
  },
  {
    icon: <MessageSquare size={40} />,
    title: 'تكامل تيليجرام',
    description: 'اربط حسابك على تيليجرام واستقبل الرسائل تلقائياً. نفس ذكاء واتساب مع ملايين المستخدمين.',
    color: 'purple',
    features: [
      'ربط سريع مع Telegram Bot API',
      'ردود تلقائية ذكية',
      'دعم المجموعات والقنوات',
      'إشعارات فورية',
      'لوحة تحكم موحدة'
    ]
  },
  {
    icon: <Upload size={40} />,
    title: 'التعلم من الملفات',
    description: 'لا داعي لإدخال الأسئلة والأجوبة يدوياً. فقط ارفع ملف PDF (منيو، بروفايل الشركة) والذكاء الاصطناعي سيتعلم منه فوراً.',
    color: 'orange',
    features: [
      'دعم ملفات PDF و Word',
      'استخراج ذكي للمعلومات',
      'تحديث سهل للمحتوى',
      'تعلم فوري من الملفات',
      'دعم المستندات الكبيرة'
    ]
  },
  {
    icon: <BarChart3 size={40} />,
    title: 'تقارير وتحليلات',
    description: 'احصل على رؤى قيمة عن محادثات عملائك. تقارير مفصلة عن الأسئلة الأكثر شيوعاً، أوقات الذروة، ومعدلات الرضا.',
    color: 'indigo',
    features: [
      'تقارير يومية وشهرية',
      'تحليل الأسئلة الشائعة',
      'قياس رضا العملاء',
      'تتبع أوقات الذروة',
      'تصدير البيانات'
    ]
  },
  {
    icon: <Bot size={40} />,
    title: 'ذكاء اصطناعي متطور',
    description: 'تقنية AI حديثة تفهم السياق والنية. تعلم مستمر من كل محادثة لتحسين الأداء.',
    color: 'red',
    features: [
      'فهم عميق للسياق',
      'تعلم آلي مستمر',
      'تحسين تلقائي للردود',
      'دعم متعدد اللغات',
      'توقع احتياجات العميل'
    ]
  }
]

export default function ServicesPage() {
  const [mounted, setMounted] = useState(false)

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
            <div className="flex items-center justify-center gap-3 mb-6">
              <img src="/logo.webp" alt="فهملي" className="w-16 h-16 object-contain" />
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
                خدماتنا
              </h1>
            </div>
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
              ربط واتساب في دقيقة واحدة – ردود ذكية من بياناتك فقط!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-cosmic-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10 hover:shadow-2xl hover:-translate-y-2 transition-all group"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${service.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-${service.color}-500`}>
                  {service.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {service.description}
                </p>

                <ul className="space-y-3">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-green-500" strokeWidth={3} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-brand-500 to-brand-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">لماذا تختار فهملي؟</h2>
            <p className="text-xl opacity-90">أسباب تجعلنا الخيار الأفضل</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Zap size={32} />, title: 'إعداد سريع', desc: 'ابدأ في أقل من 5 دقائق' },
              { icon: <Shield size={32} />, title: 'أمان عالي', desc: 'بياناتك محمية بأعلى معايير الأمان' },
              { icon: <Clock size={32} />, title: 'دعم 24/7', desc: 'فريق دعم متاح على مدار الساعة' },
              { icon: <Users size={32} />, title: '+500 عميل', desc: 'يثقون بخدماتنا يومياً' }
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
            جاهز لتجربة فهملي؟
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
            ابدأ تجربتك المجانية لمدة 7 أيام - لا حاجة لبطاقة ائتمانية
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="h-14 px-8 text-xl rounded-full shadow-xl">
                ابدأ التجربة المجانية
                <ArrowRight size={20} className="mr-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="h-14 px-8 text-xl rounded-full border-gray-300 dark:border-white/10">
                <Phone size={20} className="ml-2" />
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
