"use client"

import React, { useState, useEffect, useRef } from 'react';
import useTheme from '@/lib/theme'
import Link from 'next/link';
import { Button } from './ui/Components';
import { Bot, Zap, X, Moon, Sun, ShoppingBag, Stethoscope, Utensils, MessageCircle, Send, Check, Globe, Smile, User, Brain, ArrowRight, Twitter, Instagram, Linkedin, Mail, Sparkles, Rocket, Shield, Code } from 'lucide-react';
import { TRANSLATIONS, SEO_DATA, REGIONAL_CONTENT, COMPARISON_DATA } from '../constants';
import { DemoChatWindow } from './DemoChatWindow';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';
import { motion, AnimatePresence } from 'framer-motion';

// Sales Bot Component
const SalesBot = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{role: 'bot', text: 'أهلاً بك في فهملي! 👋 هل تبحث عن حل لزيادة مبيعاتك؟'}]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isBotTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsBotTyping(true);

    try {
      const res = await fetch('https://fahimo-api.onrender.com/api/chat/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userText })
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'bot', text: data.response }]);
      } else {
        console.error('Demo chat error:', data);
        setMessages(prev => [...prev, { role: 'bot', text: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.' }]);
      }
    } catch (error) {
      console.error('Demo chat network error:', error);
      setMessages(prev => [...prev, { role: 'bot', text: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.' }]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass-panel w-80 h-[32rem] rounded-2xl shadow-2xl mb-4 flex flex-col overflow-hidden border border-white/10 ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex justify-between items-center relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center relative overflow-hidden border border-white/20 backdrop-blur-sm">
                  <img src="/logo2.png" alt="Bot" className="w-full h-full object-contain" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-brand-600 z-10 animate-pulse"></span>
                </div>
                <div>
                  <p className="font-bold text-sm">مساعد فهملي</p>
                  <p className="text-[10px] opacity-90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
                    متصل الآن
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1.5 transition-colors relative z-10"><X size={18} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-cosmic-950/50 backdrop-blur-sm" ref={scrollRef}>
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm shadow-sm backdrop-blur-md ${
                    m.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-br-none shadow-brand-500/20' 
                      : 'bg-white/80 dark:bg-cosmic-800/80 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isBotTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/80 dark:bg-cosmic-800/80 border border-gray-200 dark:border-white/10 p-3.5 rounded-2xl rounded-bl-none shadow-sm backdrop-blur-md flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-cosmic-900 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <input 
                  className="flex-1 bg-gray-100 dark:bg-cosmic-800/50 border border-transparent dark:border-white/5 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-all"
                  placeholder="اكتب رسالتك..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isBotTyping}
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isBotTyping}
                  className="p-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="text-center pt-1">
                <a href="/" className="text-[10px] text-gray-400 hover:text-brand-500 transition-colors flex items-center justify-center gap-1.5">
                   <Zap size={10} className="text-brand-500" /> مدعوم بواسطة فهملي AI
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white rounded-full shadow-xl shadow-brand-500/40 flex items-center justify-center transition-all relative group"
      >
        <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20"></span>
        {isOpen ? <X size={28} /> : <MessageCircle size={32} className="fill-current" />}
      </motion.button>
    </div>
  );
};

export const LandingPage = ({ lang = 'ar', setLang, country = 'sa', setCountry }) => {
  const t = TRANSLATIONS[lang];
  const [localCountry, setLocalCountry] = useState(country);
  const hasExternalCountrySetter = typeof setCountry === 'function';
  const activeCountry = hasExternalCountrySetter ? country : localCountry;
  const changeCountry = hasExternalCountrySetter ? setCountry : setLocalCountry;
  const regionContent = REGIONAL_CONTENT[activeCountry];
  const [isDark, setIsDark] = useTheme(true);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    document.title = SEO_DATA.home.title;
    
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const FlagIcon = ({ code }) => {
    if (code === 'sa') return <span className="text-xl drop-shadow-md hover:scale-110 transition-transform">🇸🇦</span>;
    if (code === 'eg') return <span className="text-xl drop-shadow-md hover:scale-110 transition-transform">🇪🇬</span>;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-cosmic-950 relative overflow-hidden">
        {/* Background effects */}
        {mounted && isDark && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-brand-600/10 rounded-full blur-[150px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[150px] animate-float"></div>
          </div>
        )}
        <FaheemAnimatedLogo size="medium" isLoading={true} showText={false} className="z-10" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden relative selection:bg-brand-500/30 transition-colors duration-500 bg-gray-50 dark:bg-cosmic-950 text-gray-900 dark:text-white`}>
      
      <SalesBot lang={lang} />

      {/* Dynamic Background */}
      {mounted && isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-brand-600/10 rounded-full blur-[150px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[150px] animate-float"></div>
          <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-blue-600/5 rounded-full blur-[120px] animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'h-32 shadow-lg shadow-black/5' : 'h-40'} bg-[#f8f8fa] dark:bg-cosmic-950/80 border-b border-gray-200 dark:border-white/5`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/" className="flex items-center gap-3 group">
                <FaheemAnimatedLogo size="small" showText={false} />
             </Link>
             {activeCountry === 'eg' && (
               <span className="text-[10px] px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full border border-red-500/20 font-bold hidden sm:block animate-fade-in">
                 نسخة مصر 🇪🇬
               </span>
             )}
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Country Switcher */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                <FlagIcon code={activeCountry} />
                <span className="text-sm font-bold uppercase hidden sm:inline-block opacity-80">{activeCountry}</span>
              </button>
               <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-cosmic-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50 overflow-hidden">
                  <div className="p-1">
                    <button onClick={() => changeCountry('sa')} className="w-full text-right px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm transition-colors">
                      <FlagIcon code="sa" /> السعودية
                    </button>
                    <button onClick={() => changeCountry('eg')} className="w-full text-right px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm transition-colors">
                      <FlagIcon code="eg" /> مصر
                    </button>
                  </div>
               </div>
            </div>

            <button onClick={toggleTheme} className={`p-2.5 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-all hover:scale-105`}>
               {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className={`text-sm font-bold px-4 py-2 rounded-full transition-colors ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                {t.loginBtn}
              </Link>
              <Link href="/register">
                <Button className="rounded-full px-6 py-2.5 shadow-lg shadow-brand-500/25 font-bold hover:shadow-brand-500/40 transition-all hover:-translate-y-0.5 bg-gradient-to-r from-brand-600 to-brand-500 border-0">
                  {t.startTrial}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center z-10 relative">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-white border-gray-200 shadow-sm'} border text-brand-600 dark:text-brand-400 text-sm font-bold mb-8 hover:scale-105 transition-transform cursor-default`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
            </span>
            {t.heroTag}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`text-5xl lg:text-7xl font-bold tracking-tight leading-[1.2] mb-8 bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-b from-white via-gray-100 to-gray-400' : 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600'}`}
          >
            {regionContent.heroTitle}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-lg lg:text-2xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-12 leading-relaxed`}
          >
            {regionContent.heroSubtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
             <Link href="/register" className="w-full sm:w-auto">
               <Button className={`w-full sm:w-auto h-14 px-8 text-xl rounded-full ${isDark ? 'bg-brand-600 hover:bg-brand-500 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'} border-0 shadow-xl shadow-brand-500/20 font-bold transition-all hover:scale-105 hover:shadow-brand-500/40 relative overflow-hidden group`}>
                 <span className="relative z-10">{t.startTrial}</span>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
               </Button>
             </Link>
             <Link href="/login" className="w-full sm:w-auto">
                <button className={`w-full sm:w-auto h-14 px-8 text-lg rounded-full border ${isDark ? 'border-white/10 hover:bg-white/5 text-white bg-white/5 backdrop-blur-sm' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-800'} transition-all font-medium flex items-center justify-center gap-2 shadow-sm hover:scale-105`}>
                  <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                  {t.liveDemo}
                </button>
             </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium"
          >
             <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5"><Globe size={14} /> {activeCountry === 'eg' ? 'يدعم اللهجة المصرية 🇪🇬' : 'يدعم اللهجة السعودية 🇸🇦'}</span>
             <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5"><Check size={14} className="text-green-500" /> تجربة مجانية 7 أيام</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-20 relative z-10"
          >
            <div className="absolute inset-0 bg-brand-500/20 blur-[100px] -z-10 rounded-full"></div>
            <DemoChatWindow />
          </motion.div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="w-full max-w-7xl mx-auto px-6 relative z-20 mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl overflow-hidden shadow-2xl shadow-brand-500/10 border border-gray-200 dark:border-white/10 group"
        >
          <div className="relative w-full">
            <img 
              src="/banner.png" 
              alt="Faheemly Features" 
              className="w-full h-auto transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </motion.div>
      </section>

      {/* Industry Modal */}
      <AnimatePresence>
        {selectedIndustry && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
            onClick={() => setSelectedIndustry(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-cosmic-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative border border-gray-200 dark:border-white/10" 
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelectedIndustry(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors z-10 backdrop-blur-sm">
                <X size={20} />
              </button>
              
              <div className="relative h-56 sm:h-72">
                <img src={selectedIndustry.image} alt={selectedIndustry.title} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-cosmic-900' : 'from-white'} to-transparent`}></div>
                <div className={`absolute bottom-6 right-6 w-16 h-16 rounded-2xl bg-${selectedIndustry.color}-500 text-white flex items-center justify-center shadow-lg shadow-${selectedIndustry.color}-500/30`}>
                  {selectedIndustry.icon}
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{selectedIndustry.modalTitle || selectedIndustry.title}</h3>
                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-8">
                  {selectedIndustry.modalDesc || selectedIndustry.desc}
                </p>
                
                <div className="flex gap-4">
                  <Link href="/register" className="flex-1">
                    <Button className="w-full py-4 text-lg font-bold shadow-lg shadow-brand-500/20 rounded-xl">
                      ابدأ التجربة المجانية
                    </Button>
                  </Link>
                  <button onClick={() => setSelectedIndustry(null)} className="px-8 py-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-bold transition-colors text-gray-700 dark:text-gray-300">
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Industry Solutions */}
      <section className={`py-32 relative ${isDark ? 'bg-cosmic-950' : 'bg-gray-50'}`}>
        {isDark && <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>}
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className={`text-3xl lg:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.indTitle}</h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>اختر الحل المناسب لنشاطك التجاري</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Utensils size={32} />, 
                title: t.indRestTitle, 
                desc: t.indRestDesc, 
                modalTitle: t.indRestModalTitle,
                modalDesc: t.indRestModalDesc,
                color: "orange", 
                image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600" 
              },
              { 
                icon: <Stethoscope size={32} />, 
                title: t.indClinicTitle, 
                desc: t.indClinicDesc, 
                modalTitle: t.indClinicModalTitle,
                modalDesc: t.indClinicModalDesc,
                color: "blue", 
                image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600" 
              },
              { 
                icon: <ShoppingBag size={32} />, 
                title: t.indRetailTitle, 
                desc: t.indRetailDesc, 
                modalTitle: t.indRetailModalTitle,
                modalDesc: t.indRetailModalDesc,
                color: "purple", 
                image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600" 
              }
            ].map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={idx} 
                onClick={() => setSelectedIndustry(item)}
                className={`relative rounded-[2rem] overflow-hidden group cursor-pointer border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'} transition-all hover:-translate-y-2 hover:shadow-2xl`}
              >
                 {/* Background Image with Overlay */}
                 <div className="absolute inset-0 h-48">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className={`absolute inset-0 bg-gradient-to-b ${isDark ? 'from-transparent to-cosmic-900' : 'from-transparent to-white'}`}></div>
                 </div>

                 <div className="relative p-8 pt-32 h-full flex flex-col">
                   <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-${item.color}-500/30 transform group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                     {item.icon}
                   </div>
                   <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                   <p className={`leading-relaxed mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.desc}</p>
                   
                   <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-brand-600 dark:text-brand-400 group-hover:gap-4 transition-all">
                      <span>اكتشف المزيد</span> <ArrowRight size={16} />
                   </div>
                 </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section (New & Improved) */}
      <section className={`py-32 border-t ${isDark ? 'border-white/5 bg-cosmic-900/50' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.whyFahimo}</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.compSub}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
             {/* Traditional Bot */}
             <div className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'} opacity-75 hover:opacity-100 transition-all hover:-translate-y-1`}>
               <div className="flex flex-col items-center text-center mb-6 text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Bot size={32} className="opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold">{COMPARISON_DATA.old.title}</h3>
               </div>
               <ul className="space-y-4">
                 {COMPARISON_DATA.old.points.map((p, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                     <X size={16} className="mt-1 text-red-500 flex-shrink-0" /> {p}
                   </li>
                 ))}
               </ul>
             </div>

             {/* Fahimo (Featured) */}
             <div className={`p-1 rounded-[2rem] bg-gradient-to-b from-brand-500 to-purple-600 relative transform scale-105 z-10 shadow-2xl shadow-brand-500/20`}>
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-lg flex items-center gap-2">
                 <Sparkles size={14} /> الخيار الأذكى
               </div>
               <div className={`h-full p-8 rounded-[1.8rem] ${isDark ? 'bg-cosmic-900' : 'bg-white'}`}>
                  <div className="flex flex-col items-center text-center mb-8 text-brand-500">
                      <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping opacity-20"></div>
                        <Brain size={40} className="text-brand-500" />
                      </div>
                      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-purple-600">{COMPARISON_DATA.fahimo.title}</h3>
                  </div>
                  <ul className="space-y-5">
                    {COMPARISON_DATA.fahimo.points.map((p, i) => (
                      <li key={i} className={`flex items-start gap-3 text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <div className="mt-1 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] shadow-lg shadow-brand-500/30"><Check size={12} strokeWidth={4} /></div> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 text-center">
                    <Link href="/register">
                      <Button className="w-full py-4 text-lg font-bold shadow-lg shadow-brand-500/20 rounded-xl">ابدأ الآن مجاناً</Button>
                    </Link>
                  </div>
               </div>
             </div>

             {/* Human */}
             <div className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'} opacity-75 hover:opacity-100 transition-all hover:-translate-y-1`}>
               <div className="flex flex-col items-center text-center mb-6 text-blue-500">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <User size={32} className="opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold">{COMPARISON_DATA.human.title}</h3>
               </div>
               <ul className="space-y-4">
                 {COMPARISON_DATA.human.points.map((p, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
                     <div className="mt-1 text-blue-500 flex-shrink-0">•</div> {p}
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={`py-32 border-t ${isDark ? 'border-white/5 bg-cosmic-950' : 'bg-white border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.pricingTitle}</h2>
            <p className={`${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{t.pricingSub}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             {/* Starter */}
             <div className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'} flex flex-col hover:border-brand-500/30 transition-colors`}>
                <h3 className="text-xl font-bold text-gray-500 mb-2">{regionContent.pricing.starter.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{t.planStarterDesc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{regionContent.pricing.starter.price}</span>
                  <span className="text-gray-500 text-sm">{regionContent.pricing.currency} / شهرياً</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                   {[t.feat1, t.feat2, t.feat3, t.feat4].map((f, i) => (
                     <li key={i} className={`flex items-center gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                       <Check size={16} className="text-brand-500 flex-shrink-0" /> {f}
                     </li>
                   ))}
                </ul>
                <Link href="/register">
                  <Button variant="secondary" className="w-full rounded-xl py-3">{t.choosePlan}</Button>
                </Link>
             </div>

             {/* Pro (Popular) */}
             <div className={`p-1 rounded-[2rem] bg-gradient-to-b from-brand-500 to-purple-600 relative transform scale-105 z-10 shadow-2xl shadow-brand-500/20`}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Rocket size={12} /> {t.popular}
                </div>
                <div className={`h-full p-8 rounded-[1.8rem] ${isDark ? 'bg-cosmic-900' : 'bg-white'} flex flex-col`}>
                  <h3 className="text-xl font-bold text-brand-500 mb-2">{regionContent.pricing.pro.name}</h3>
                  <p className="text-xs text-gray-500 mb-4">{t.planProDesc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{regionContent.pricing.pro.price}</span>
                    <span className="text-gray-500 text-sm">{regionContent.pricing.currency} / شهرياً</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {[t.featPro1, t.featPro2, t.featPro3, t.featPro4].map((f, i) => (
                      <li key={i} className={`flex items-center gap-3 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        <div className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500"><Check size={12} strokeWidth={3} /></div> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className="w-full font-bold shadow-lg shadow-brand-500/20 rounded-xl py-4 text-lg">{t.choosePlan}</Button>
                  </Link>
                </div>
             </div>

             {/* Agency */}
             <div className={`p-8 rounded-3xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'} flex flex-col hover:border-brand-500/30 transition-colors`}>
                <h3 className="text-xl font-bold text-gray-500 mb-2">{regionContent.pricing.agency.name}</h3>
                <p className="text-xs text-gray-500 mb-4">{t.planAgencyDesc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{regionContent.pricing.agency.price}</span>
                   <span className="text-gray-500 text-sm">{regionContent.pricing.currency} / شهرياً</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                   {[t.featEnt1, t.featEnt2, t.featEnt3, t.featEnt4].map((f, i) => (
                     <li key={i} className={`flex items-center gap-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                       <Check size={16} className="text-brand-500 flex-shrink-0" /> {f}
                     </li>
                   ))}
                </ul>
                <Link href="/register">
                 <Button variant="secondary" className="w-full rounded-xl py-3">{t.choosePlan}</Button>
                </Link>
             </div>
          </div>
        </div>
      </section>

      {/* Improved Footer */}
      <footer className={`border-t ${isDark ? 'border-white/5 bg-black/40 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
             {/* Brand Column */}
             <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-3 mb-6">
                  <img src="/logo2.png" alt="Faheemly" className="w-48 h-auto object-contain rounded-xl" />
                </div>
                <p className="text-sm leading-relaxed mb-8 opacity-80">
                  أقوى منصة شات بوت عربي مدعومة بالذكاء الاصطناعي. نساعدك تزيد مبيعاتك وترضي عملاءك 24/7.
                </p>
                <div className="flex gap-4">
                   <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all"><Twitter size={18} /></a>
                   <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all"><Instagram size={18} /></a>
                   <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all"><Linkedin size={18} /></a>
                </div>
             </div>

             {/* Links Column 1 */}
             <div>
               <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">الشركة</h4>
               <ul className="space-y-3 text-sm">
                 <li><Link href="/about" className="hover:text-brand-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand-500"></span> {t.aboutUs}</Link></li>
                 <li><Link href="/contact" className="hover:text-brand-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand-500"></span> {t.contactUs}</Link></li>
                 <li><Link href="/register" className="hover:text-brand-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand-500"></span> ابدأ التجربة</Link></li>
                 <li><Link href="/login" className="hover:text-brand-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand-500"></span> تسجيل الدخول</Link></li>
               </ul>
             </div>

             {/* Links Column 2 */}
             <div>
               <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">قانوني</h4>
               <ul className="space-y-3 text-sm">
                 <li><Link href="/privacy" className="hover:text-brand-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand-500"></span> {t.privacy}</Link></li>
                 <li><Link href="/terms" className="hover:text-brand-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand-500"></span> {t.terms}</Link></li>
                 <li><Link href="/contact" className="hover:text-brand-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-brand-500"></span> الدعم الفني</Link></li>
               </ul>
             </div>

             {/* Contact Column */}
             <div>
               <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg">تواصل معنا</h4>
               <ul className="space-y-4 text-sm">
                 <li className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Mail size={18} className="text-brand-500" /> info@Faheemly.com</li>
                 <li className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><Globe size={18} className="text-brand-500" /> الرياض، المملكة العربية السعودية</li>
               </ul>
             </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-white/5 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
             <p className="text-sm opacity-60">© 2025 جميع الحقوق محفوظة لشركة فهملي</p>
             <a href="https://ma-fo.info" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity group">
                <img src="https://ma-fo.info/logo.png" alt="Ma-Fo Logo" className="w-5 h-5 object-contain" />
                <span className="text-xs font-bold tracking-wide group-hover:text-brand-500 transition-colors">{t.footerMadeBy}</span>
             </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
