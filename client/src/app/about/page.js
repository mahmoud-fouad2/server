'use client';
import { Button } from '@/components/ui/button';
import PageLayout from '@/components/layout/PageLayout';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain,
  Heart,
  Rocket,
  Users,
  Zap,
  Shield,
  Target,
  Award,
  TrendingUp,
  Globe,
  MessageSquare,
  Clock,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { number: '500+', label: 'عميل نشط', icon: <Users /> },
    { number: '1M+', label: 'محادثة شهرياً', icon: <MessageSquare /> },
    { number: '99.9%', label: 'وقت التشغيل', icon: <Clock /> },
    { number: '24/7', label: 'دعم فني', icon: <Shield /> },
  ];

  const values = [
    {
      icon: <Brain size={32} />,
      title: 'الذكاء الحقيقي',
      description:
        'لا نعتمد على الكلمات المفتاحية، بل نفهم السياق والمعنى الحقيقي للمحادثة.',
      color: 'blue',
    },
    {
      icon: <Heart size={32} />,
      title: 'اللمسة الإنسانية',
      description: 'التكنولوجيا يجب أن تخدم الإنسان وتسهل حياته، لا أن تعقدها.',
      color: 'red',
    },
    {
      icon: <Rocket size={32} />,
      title: 'السرعة والكفاءة',
      description:
        'إعداد البوت يجب أن يكون أسرع من إعداد القهوة - 5 دقائق فقط!',
      color: 'purple',
    },
    {
      icon: <Globe size={32} />,
      title: 'للجميع',
      description: 'من المتجر الصغير إلى الشركة العملاقة، فهملي مصمم للجميع.',
      color: 'green',
    },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-cosmic-950" dir="rtl">
        <section className="relative py-20 px-6 overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white">
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                نبني مستقبل الذكاء الاصطناعي العربي
              </h1>
              <p className="text-xl lg:text-2xl opacity-90 max-w-3xl mx-auto">
                لم نكن نريد بناء مجرد &quot;شات بوت&quot;. أردنا بناء عقل يفهم، يتعلم،
                ويتحدث بلسانك.
              </p>
            </motion.div>
          </div>
        </section>
        <section className="py-16 px-6 -mt-10 relative z-20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-cosmic-900 rounded-2xl p-6 shadow-xl text-center"
              >
                <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-brand-600">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                كيف بدأت فهملي؟
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                في عام 2023، لاحظنا فجوة كبيرة في السوق العربي. الشركات تستخدم
                ردوداً آلية جامدة، والعملاء يشعرون بالإحباط.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                وهكذا ولد فهملي. ليس مجرد برنامج، بل موظف ذكي لا ينام ولا يطلب
                راتب.
              </p>
            </motion.div>
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-brand-500/20 to-purple-600/20 flex items-center justify-center">
              <Brain className="w-32 h-32 text-brand-600" />
            </div>
          </div>
        </section>
        <section className="py-20 px-6 bg-white dark:bg-cosmic-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">
              قيمنا الأساسية
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {values.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center p-6 rounded-2xl border hover:shadow-xl transition-all"
                >
                  <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-600">
                    {v.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {v.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-12 text-white">
              <h2 className="text-4xl font-bold mb-6">
                انضم لثورة الذكاء الاصطناعي العربي
              </h2>
              <Link href="/wizard">
                <Button
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-gray-100"
                >
                  ابدأ الآن مجاناً
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
