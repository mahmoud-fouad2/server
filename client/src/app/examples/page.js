'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/logo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Users,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Heart,
  Shield,
  Brain,
} from 'lucide-react';
import Image from 'next/image';
import Breadcrumb from '@/components/Breadcrumb';

export default function Examples() {
  const router = useRouter();
  const [selectedExample, setSelectedExample] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showFullConversation, setShowFullConversation] = useState(false);

  const examples = [
    {
      id: 'restaurant',
      title: 'مطعم برجر',
      subtitle: 'النبرة: شهية وودودة',
      emoji: '🍔',
      color: 'orange',
      bgColor: 'bg-orange-50/50 dark:bg-orange-950/10',
      textColor: 'text-orange-700 dark:text-orange-400',
      btnColor: 'bg-orange-500 hover:bg-orange-600',
      conversation: [
        { type: 'user', text: 'عندكم شي سبايسي؟', delay: 0 },
        { type: 'bot', text: 'يا هلا! 🔥 أكيد، جرب "فولكينو برجر" بصوصنا الحار الخاص، نار وشرار!', delay: 1000 },
        { type: 'user', text: 'كم سعره؟', delay: 2000 },
        { type: 'bot', text: '25 ريال بس! ومعاه بطاطس مقلية مجاناً. تحب نطلبه لك؟', delay: 3000 },
        { type: 'user', text: 'تمام، أطلب واحد', delay: 4000 },
        { type: 'bot', text: 'ممتاز! 🎉 تم الطلب. راح يوصل خلال 20 دقيقة. شكراً لثقتك بنا!', delay: 5000 },
      ],
      features: ['طلبات سريعة', 'اقتراحات ذكية', 'تتبع الطلبات', 'دعم 24/7'],
      stats: { orders: '45%', satisfaction: '4.8/5', response: '< 30 ثانية' },
    },
    {
      id: 'fashion',
      title: 'متجر أزياء',
      subtitle: 'النبرة: أنيقة وناصحة',
      emoji: '👗',
      color: 'purple',
      bgColor: 'bg-purple-50/50 dark:bg-purple-950/10',
      textColor: 'text-purple-700 dark:text-purple-400',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
      conversation: [
        { type: 'user', text: 'وش يناسب الفستان الأسود؟', delay: 0 },
        { type: 'bot', text: 'الأسود ملك الألوان! ✨ أنصحك بكعب فضي لامع لإطلالة سهرة، أو جاكيت جينز لطلعة كاجوال.', delay: 1000 },
        { type: 'user', text: 'عندكم مقاسات كبيرة؟', delay: 2000 },
        { type: 'bot', text: 'بالتأكيد! عندنا حتى مقاس XXL. ونقدر نعدل المقاسات مجاناً. 😊', delay: 3000 },
        { type: 'user', text: 'تمام، أريد أشوف الصور', delay: 4000 },
        { type: 'bot', text: 'راح أرسل لك روابط الصور على واتساب. عندك أي أسئلة أخرى؟ 💫', delay: 5000 },
      ],
      features: ['استشارات أزياء', 'اقتراحات شخصية', 'معاينة افتراضية', 'توصيل سريع'],
      stats: { sales: '60%', conversion: '3.2x', engagement: '85%' },
    },
    {
      id: 'corporate',
      title: 'شركة خدمات',
      subtitle: 'النبرة: رسمية ودقيقة',
      emoji: '🏢',
      color: 'blue',
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/10',
      textColor: 'text-blue-700 dark:text-blue-400',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
      conversation: [
        { type: 'user', text: 'متى دوامكم؟', delay: 0 },
        { type: 'bot', text: 'مرحباً بك. ساعات العمل الرسمية من الأحد إلى الخميس، من الساعة 9:00 صباحاً حتى 5:00 مساءً.', delay: 1000 },
        { type: 'user', text: 'عندكم خدمة طوارئ؟', delay: 2000 },
        { type: 'bot', text: 'نعم، فريق الطوارئ متاح 24/7 على رقم 920001234. كيف يمكننا مساعدتك؟', delay: 3000 },
        { type: 'user', text: 'أحتاج استشارة عاجلة', delay: 4000 },
        { type: 'bot', text: 'سيتصل بك أحد خبرائنا خلال 5 دقائق. هل تفضل تحديد نوع الاستشارة؟', delay: 5000 },
      ],
      features: ['ردود فورية', 'توجيه ذكي', 'دعم متعدد القنوات', 'جدولة تلقائية'],
      stats: { response: '< 1 دقيقة', efficiency: '80%', satisfaction: '4.9/5' },
    },
    {
      id: 'clinic',
      title: 'عيادة أسنان',
      subtitle: 'النبرة: مهنية ومطمئنة',
      emoji: '🦷',
      color: 'teal',
      bgColor: 'bg-teal-50/50 dark:bg-teal-950/10',
      textColor: 'text-teal-700 dark:text-teal-400',
      btnColor: 'bg-teal-600 hover:bg-teal-700',
      conversation: [
        { type: 'user', text: 'خايف من خلع الضرس', delay: 0 },
        { type: 'bot', text: 'لا تقلق أبداً. أطباؤنا يستخدمون أحدث تقنيات التخدير لضمان تجربة مريحة وبدون ألم.', delay: 1000 },
        { type: 'user', text: 'كم التكلفة تقريباً؟', delay: 2000 },
        { type: 'bot', text: 'تختلف حسب الحالة، لكن المتوسط من 200-500 ريال. راح نعطيك تشخيص دقيق مجاناً.', delay: 3000 },
        { type: 'user', text: 'أريد أحجز موعد', delay: 4000 },
        { type: 'bot', text: 'ممتاز! أقرب موعد متاح غداً الساعة 10 صباحاً. راح أرسل لك تفاصيل الحجز على واتساب.', delay: 5000 },
      ],
      features: ['حجز مواعيد', 'تطمين المرضى', 'تذكير تلقائي', 'متابعة ما بعد العلاج'],
      stats: { bookings: '70%', retention: '95%', reviews: '4.9/5' },
    },
  ];

  const currentExample = examples[selectedExample];

  useEffect(() => {
    if (isPlaying && currentMessageIndex < currentExample.conversation.length) {
      const timer = setTimeout(() => {
        setCurrentMessageIndex(prev => prev + 1);
      }, currentExample.conversation[currentMessageIndex]?.delay || 1000);

      return () => clearTimeout(timer);
    } else if (currentMessageIndex >= currentExample.conversation.length) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentMessageIndex, currentExample.conversation.length]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentMessageIndex(0);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMessageIndex(0);
  };

  const nextExample = () => {
    setSelectedExample((prev) => (prev + 1) % examples.length);
    handleReset();
  };

  const prevExample = () => {
    setSelectedExample((prev) => (prev - 1 + examples.length) % examples.length);
    handleReset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-cosmic-950 dark:via-cosmic-900 dark:to-brand-950 font-sans">
      {/* Navigation */}
      <nav className="w-full border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0 z-50">
        <div className="container flex h-20 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.webp"
              alt="فهملي"
              width={40}
              height={40}
              className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              فهملي
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing">
              <Button variant="ghost" className="hidden md:flex">
                الأسعار
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white shadow-lg">
                ابدأ مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'الأمثلة' }]} />

        <div className="py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-6">
            <Sparkles size={16} />
            <span className="text-sm font-bold">أمثلة حية تفاعلية</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-brand-600 to-purple-600 dark:from-white dark:via-brand-400 dark:to-purple-400 bg-clip-text text-transparent">
            شاهد فهملي في العمل
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            اكتشف كيف يتكيف فهملي مع طبيعة كل عمل ليقدم أفضل خدمة ممكنة لعملائك
          </p>
        </motion.div>

        {/* Interactive Demo Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-cosmic-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
          >
            {/* Demo Header */}
            <div className="p-8 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{currentExample.emoji}</div>
                  <div>
                    <h3 className={`text-2xl font-bold ${currentExample.textColor}`}>
                      {currentExample.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentExample.subtitle}
                    </p>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevExample}
                    className="p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={nextExample}
                    className="p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(currentExample.stats).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-brand-600">{value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {key === 'orders' && 'زيادة الطلبات'}
                      {key === 'satisfaction' && 'رضا العملاء'}
                      {key === 'response' && 'سرعة الرد'}
                      {key === 'sales' && 'زيادة المبيعات'}
                      {key === 'conversion' && 'معدل التحويل'}
                      {key === 'engagement' && 'التفاعل'}
                      {key === 'efficiency' && 'الكفاءة'}
                      {key === 'bookings' && 'الحجوزات'}
                      {key === 'retention' && 'الاحتفاظ'}
                      {key === 'reviews' && 'التقييمات'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Demo */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  محادثة تجريبية
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    title="إعادة تشغيل"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={handlePlay}
                    className={`p-2 rounded-full transition-colors ${
                      isPlaying
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-brand-500 text-white hover:bg-brand-600'
                    }`}
                    title={isPlaying ? 'إيقاف' : 'تشغيل'}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="bg-gray-50 dark:bg-cosmic-800 rounded-2xl p-6 min-h-[400px] space-y-4">
                <AnimatePresence>
                  {currentExample.conversation
                    .slice(0, currentMessageIndex + (showFullConversation ? currentExample.conversation.length : 0))
                    .map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            message.type === 'user'
                              ? 'bg-brand-500 text-white rounded-br-md'
                              : `bg-white dark:bg-cosmic-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm`
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {message.type === 'user' ? '👤 العميل' : '🤖 فهملي'}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.text}</p>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>

                {!showFullConversation && currentMessageIndex >= currentExample.conversation.length - 1 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setShowFullConversation(true)}
                      className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                    >
                      عرض المحادثة الكاملة →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {examples.map((example, index) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`neumorphic border-none ${example.bgColor} cursor-pointer transition-all hover:scale-105 ${
                  selectedExample === index ? 'ring-2 ring-brand-500 shadow-xl' : ''
                }`}
                onClick={() => {
                  setSelectedExample(index);
                  handleReset();
                }}
              >
                <CardHeader>
                  <div className="text-4xl mb-2">{example.emoji}</div>
                  <CardTitle className={example.textColor}>
                    {example.title}
                  </CardTitle>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {example.subtitle}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {example.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${example.color}-500`} />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className={`w-full mt-4 ${example.btnColor} text-white`}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/register');
                    }}
                  >
                    جرب الآن
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
            لماذا يختار العملاء فهملي؟
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: <Brain size={32} />,
                title: 'ذكاء اصطناعي متقدم',
                desc: 'يتعلم من كل محادثة ليقدم إجابات أفضل',
              },
              {
                icon: <Zap size={32} />,
                title: 'ردود فورية',
                desc: 'يرد على العملاء خلال ثوانٍ مع الحفاظ على الجودة',
              },
              {
                icon: <Heart size={32} />,
                title: 'تخصيص كامل',
                desc: 'يتماشى مع هوية عملك وأسلوب خدمة عملائك',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-brand-600 to-purple-600 rounded-3xl p-12 text-white"
        >
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              جاهز لتحويل خدمة عملائك؟
            </h2>
            <p className="text-xl mb-8 opacity-90">
              انضم لآلاف الشركات التي تثق بفهملي في خدمة عملائها
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/wizard">
                <Button
                  size="lg"
                  className="bg-white text-brand-600 hover:bg-gray-100 text-lg h-14 px-10 rounded-full shadow-xl hover:shadow-2xl transition-all"
                >
                  <Sparkles className="ml-2" size={20} />
                  اصنع بوتك الآن
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 text-lg h-14 px-10 rounded-full"
                >
                  ابدأ التجربة المجانية
                  <ArrowRight className="mr-2" size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <footer className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Development By{' '}
            <a
              href="https://ma-fo.info"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <img
                src="https://ma-fo.info/logo2.png"
                alt="Ma-Fo Logo"
                className="w-4 h-4"
              />
              Ma-Fo
            </a>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2025 جميع الحقوق محفوظة لشركة فهملي
          </p>
        </div>
      </footer>
    </div>
    </div>
  );
}
