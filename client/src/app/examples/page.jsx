'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRobot,
  FaComments,
  FaStar,
  FaClock,
  FaCheckCircle,
  FaStore,
  FaUtensils,
  FaHospital,
  FaGraduationCap,
  FaPlay,
  FaArrowRight,
  FaArrowLeft,
} from 'react-icons/fa';
import Navigation from '@/components/landing/Navigation';
import Footer from '@/components/layout/Footer';
import useTheme from '@/lib/theme';
import { TRANSLATIONS } from '@/constants';
import { useRouter } from 'next/navigation';

const industries = [
  {
    id: 'restaurant',
    name: 'مطعم',
    icon: <FaUtensils />,
    color: 'from-orange-500 to-red-500',
    questions: [
      'ما هي أوقات العمل؟',
      'هل عندكم خدمة توصيل؟',
      'ما هي الأطباق المميزة؟',
      'كم سعر الوجبة العائلية؟',
    ],
  },
  {
    id: 'clinic',
    name: 'عيادة طبية',
    icon: <FaHospital />,
    color: 'from-blue-500 to-cyan-500',
    questions: [
      'كيف أحجز موعد؟',
      'ما هي التخصصات المتوفرة؟',
      'هل تقبلون التأمين الطبي؟',
      'ما هي أوقات الدوام؟',
    ],
  },
  {
    id: 'retail',
    name: 'متجر إلكتروني',
    icon: <FaStore />,
    color: 'from-purple-500 to-pink-500',
    questions: [
      'كيف أتتبع طلبي؟',
      'ما هي سياسة الإرجاع؟',
      'هل يوجد شحن مجاني؟',
      'كم مدة التوصيل؟',
    ],
  },
  {
    id: 'education',
    name: 'مركز تعليمي',
    icon: <FaGraduationCap />,
    color: 'from-green-500 to-emerald-500',
    questions: [
      'ما هي الدورات المتاحة؟',
      'كيف أسجل في دورة؟',
      'ما هي رسوم التسجيل؟',
      'هل يوجد شهادات معتمدة؟',
    ],
  },
];

const chatResponses = {
  restaurant: {
    'ما هي أوقات العمل؟': 'نحن نعمل يومياً من الساعة 10 صباحاً حتى 11 مساءً، ما عدا يوم الجمعة من 2 ظهراً حتى 12 منتصف الليل. 🕐',
    'هل عندكم خدمة توصيل؟': 'نعم! نوفر خدمة توصيل سريعة لجميع أنحاء المدينة. التوصيل مجاني للطلبات فوق 50 ريال. وقت التوصيل المتوقع: 30-45 دقيقة. 🚗',
    'ما هي الأطباق المميزة؟': 'أشهر أطباقنا: كبسة اللحم الفاخرة، مندي الدجاج، برياني روبيان، وشاورما مشكلة. جميعها محضرة بأجود المكونات! 🍽️',
    'كم سعر الوجبة العائلية؟': 'الوجبة العائلية تبدأ من 120 ريال وتكفي 4-5 أشخاص. تشمل: طبق رئيسي، أرز، سلطات، ومشروبات. 👨‍👩‍👧‍👦',
  },
  clinic: {
    'كيف أحجز موعد؟': 'يمكنك الحجز عبر الواتساب على 0501234567، أو من خلال موقعنا الإلكتروني، أو بالاتصال المباشر. متاح الحجز 24/7. 📱',
    'ما هي التخصصات المتوفرة؟': 'لدينا: طب عام، أسنان، جلدية، نساء وولادة، أطفال، وقسم الطوارئ. جميع الأطباء معتمدون ومتخصصون. 👨‍⚕️',
    'هل تقبلون التأمين الطبي؟': 'نعم، نتعامل مع جميع شركات التأمين الرئيسية: بوبا، تعاونية، ميدغلف، والمانع، وغيرها. 💳',
    'ما هي أوقات الدوام؟': 'نعمل من السبت للخميس: 8 صباحاً - 10 مساءً. الجمعة: 4 عصراً - 10 مساءً. قسم الطوارئ متاح 24 ساعة. ⏰',
  },
  retail: {
    'كيف أتتبع طلبي؟': 'سيصلك رابط التتبع عبر SMS فور شحن طلبك. يمكنك أيضاً تتبع الطلب من حسابك في الموقع أو عبر تطبيقنا. 📦',
    'ما هي سياسة الإرجاع؟': 'يمكنك إرجاع أو استبدال المنتج خلال 14 يوم من الاستلام. المنتج يجب أن يكون في حالته الأصلية مع الفاتورة. 🔄',
    'هل يوجد شحن مجاني؟': 'نعم! شحن مجاني لجميع الطلبات فوق 200 ريال. الطلبات الأقل رسوم الشحن 15 ريال فقط. 🚚',
    'كم مدة التوصيل؟': 'داخل المدينة: 1-2 يوم عمل. خارج المدينة: 3-5 أيام عمل. المناطق النائية: 5-7 أيام عمل. 📅',
  },
  education: {
    'ما هي الدورات المتاحة؟': 'لدينا دورات في: البرمجة، التصميم، التسويق الرقمي، اللغات، المحاسبة، والذكاء الاصطناعي. دورات معتمدة دولياً. 📚',
    'كيف أسجل في دورة؟': 'التسجيل سهل! اختر الدورة من موقعنا، املأ النموذج، وادفع أونلاين. سيتم تفعيل حسابك فوراً وستبدأ الدراسة. 📝',
    'ما هي رسوم التسجيل؟': 'تختلف حسب الدورة: دورات مجانية، دورات من 299 ريال، ودورات متقدمة حتى 1500 ريال. خصم 20% للطلاب. 💰',
    'هل يوجد شهادات معتمدة؟': 'نعم! جميع دوراتنا معتمدة من المؤسسة العامة للتدريب التقني والمهني. شهادات معترف بها محلياً ودولياً. 🎓',
  },
};

export default function ExamplesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState(industries[0]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Navigation State
  const [lang, setLang] = useState('ar');
  const [isDark, setIsDark] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);
  const changeCountry = (code) => {
    if (code === 'sa') router.push('/');
    else router.push(`/${code}`);
  };

  const handleQuestionClick = async (question) => {
    // Add user message
    const userMessage = {
      type: 'user',
      text: question,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Add bot response
    const botMessage = {
      type: 'bot',
      text: chatResponses[selectedIndustry.id][question],
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setIsTyping(false);
    setChatMessages(prev => [...prev, botMessage]);
  };

  const resetChat = () => {
    setChatMessages([]);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-cosmic-950 text-white' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-900'}`}>
      <Navigation
        lang={lang}
        setLang={setLang}
        activeCountry="sa"
        changeCountry={changeCountry}
        isDark={isDark}
        toggleTheme={toggleTheme}
        scrolled={scrolled}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        t={TRANSLATIONS[lang]}
      />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                شاهد البوت في العمل
              </span>
            </h1>
            <p className={`text-xl mb-8 max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              جرّب أمثلة حية لكيفية تفاعل بوت فهملي الذكي مع عملائك في مختلف الصناعات
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-16">
            {[
              { icon: <FaComments />, value: '50K+', label: 'محادثة يومياً' },
              { icon: <FaStar />, value: '4.9/5', label: 'تقييم العملاء' },
              { icon: <FaClock />, value: '< 2 ثانية', label: 'وقت الاستجابة' },
              { icon: <FaCheckCircle />, value: '98%', label: 'دقة الردود' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 * index }}
                className={`${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-lg'} rounded-2xl p-6`}
              >
                <div className="text-3xl text-indigo-600 mb-2 flex justify-center">{stat.icon}</div>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Selection */}
      <section className={`py-12 px-4 ${isDark ? 'bg-cosmic-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`text-3xl font-bold text-center mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>اختر مجال عملك</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {industries.map((industry) => (
              <motion.button
                key={industry.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedIndustry(industry);
                  resetChat();
                }}
                className={`relative p-6 rounded-2xl transition-all ${
                  selectedIndustry.id === industry.id
                    ? `bg-gradient-to-br ${industry.color} text-white shadow-2xl`
                    : isDark 
                      ? 'bg-white/5 text-gray-300 hover:bg-white/10' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-4xl mb-3 flex justify-center">{industry.icon}</div>
                <div className="font-bold text-lg">{industry.name}</div>
                {selectedIndustry.id === industry.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 border-4 border-white rounded-2xl"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Questions Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className={`${isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-xl'} rounded-2xl p-6`}>
                <h3 className={`text-2xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <FaPlay className="ml-3 text-indigo-600" />
                  جرّب هذه الأسئلة
                </h3>
                <div className="space-y-3">
                  {selectedIndustry.questions.map((question, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuestionClick(question)}
                      className={`w-full text-right p-4 rounded-xl border transition-all group ${
                        isDark 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/50' 
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`${isDark ? 'text-gray-300 group-hover:text-indigo-400' : 'text-gray-700 group-hover:text-indigo-700'}`}>
                          {question}
                        </span>
                        <FaArrowRight className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'}`}>
                <h4 className={`font-bold text-lg mb-3 ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
                  💡 نصيحة احترافية
                </h4>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  البوت يتعلم من قاعدة معرفتك ويتحسن مع كل محادثة. كل ما أضفت معلومات أكثر،
                  كانت الردود أدق وأفضل!
                </p>
              </div>
            </motion.div>

            {/* Chat Interface */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${isDark ? 'bg-cosmic-900' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'border-white/10' : 'border-transparent'}`}
            >
              {/* Chat Header */}
              <div className={`bg-gradient-to-r ${selectedIndustry.color} p-6 text-white`}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <FaRobot className="text-2xl" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">بوت {selectedIndustry.name}</div>
                    <div className="text-sm opacity-90">متصل الآن • يرد فوراً</div>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className={`h-[500px] overflow-y-auto p-6 ${isDark ? 'bg-black/20' : 'bg-gray-50'}`}>
                <AnimatePresence>
                  {chatMessages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex items-center justify-center text-center"
                    >
                      <div>
                        <FaComments className={`text-6xl mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                        <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          اختر سؤالاً من القائمة لبدء المحادثة
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {chatMessages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`mb-4 flex ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl p-4 ${
                              message.type === 'user'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                : isDark 
                                  ? 'bg-white/10 text-gray-200' 
                                  : 'bg-white shadow-md text-gray-800'
                            }`}
                          >
                            <div className="text-sm mb-1">{message.text}</div>
                            <div
                              className={`text-xs ${
                                message.type === 'user' ? 'text-white/70' : 'text-gray-400'
                              }`}
                            >
                              {message.time}
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start mb-4"
                        >
                          <div className={`${isDark ? 'bg-white/10' : 'bg-white shadow-md'} rounded-2xl p-4`}>
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: '0.2s' }}
                              />
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: '0.4s' }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Footer */}
              <div className={`p-4 border-t ${isDark ? 'bg-cosmic-900 border-white/10' : 'bg-white border-gray-200'}`}>
                {chatMessages.length > 0 && (
                  <button
                    onClick={resetChat}
                    className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    مسح المحادثة
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">جاهز لإنشاء بوتك الذكي؟</h2>
          <p className="text-xl mb-8 opacity-90">
            ابدأ مجاناً اليوم واحصل على بوت ذكي يعمل 24/7 لخدمة عملائك
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition text-lg"
            >
              ابدأ مجاناً الآن
            </a>
            <a
              href="/docs"
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition text-lg border-2 border-white/30"
            >
              اطلع على الوثائق
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
