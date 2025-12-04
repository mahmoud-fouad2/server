"use client"

import React, { useState, useEffect, useRef } from 'react';
import useTheme from '@/lib/theme'
import { chatApi } from '@/lib/api';
import Link from 'next/link';
import { Button } from './ui/Components';
import { Bot, Zap, X, Moon, Sun, ShoppingBag, Stethoscope, Utensils, MessageCircle, Send, Check, Globe, Smile, User, Brain, ArrowRight, Twitter, Instagram, Linkedin, Mail, Phone, Sparkles, Rocket, Shield, Code, Users, Clock, Lock, CheckCircle, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { TRANSLATIONS, SEO_DATA, REGIONAL_CONTENT, COMPARISON_DATA } from '../constants';
import { DemoChatWindow } from './DemoChatWindow';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';
import SalesBot from './SalesBot';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './layout/Footer';
import LoadingScreen from './LoadingScreen';

import { useRouter } from 'next/navigation';

export const LandingPage = ({ lang: initialLang = 'ar', setLang: externalSetLang, country = 'sa' }) => {
  const router = useRouter();
  const [lang, setLangState] = useState(initialLang);
  
  const setLang = (newLang) => {
    setLangState(newLang);
    if (externalSetLang) externalSetLang(newLang);
  };
  
  const t = TRANSLATIONS[lang];
  const activeCountry = country;
  
  const changeCountry = (code) => {
    if (code === 'sa') router.push('/');
    else router.push(`/${code}`);
  };

  const regionContent = REGIONAL_CONTENT[activeCountry] || REGIONAL_CONTENT['sa'];
  const [isDark, setIsDark] = useTheme(true);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Set page title based on country
    const seoData = SEO_DATA[activeCountry] || SEO_DATA['sa'];
    document.title = seoData.home.title;
    
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeCountry]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const FlagIcon = ({ code }) => {
    if (code === 'sa') return <span className="text-xl drop-shadow-md hover:scale-110 transition-transform">🇸🇦</span>;
    if (code === 'eg') return <span className="text-xl drop-shadow-md hover:scale-110 transition-transform">🇪🇬</span>;
    return null;
  };

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
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
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'h-28 shadow-lg shadow-black/5' : 'h-32'} bg-[#f8f8fa] dark:bg-cosmic-950/90 border-b border-gray-200 dark:border-white/5`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/" className="flex items-center group hover:scale-105 transition-transform">
                <img src="/logo.webp" alt="فهملي" className={`${scrolled ? 'w-40 md:w-48' : 'w-48 md:w-64'} h-auto object-contain transition-all`} />
             </Link>
             {activeCountry === 'eg' && (
               <span className="text-[10px] px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full border border-red-500/20 font-bold hidden sm:block animate-fade-in">
                 {lang === 'en' ? 'Egypt Edition' : 'نسخة مصر'}
               </span>
             )}
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Country Switcher - Desktop Only */}
            <div className="relative group hidden md:block">
              <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10">
                <span className={`fi fi-${activeCountry} text-xl rounded-sm shadow-sm`}></span>
                <span className="text-sm font-bold hidden sm:inline-block opacity-80">{activeCountry === 'sa' ? 'السعودية' : activeCountry === 'eg' ? 'مصر' : activeCountry === 'ae' ? 'الإمارات' : 'الكويت'}</span>
              </button>
               <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-cosmic-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50 overflow-hidden">
                  <div className="p-1.5">
                    <button onClick={() => changeCountry('sa')} className={`w-full text-right px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm transition-colors ${activeCountry === 'sa' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : ''}`}>
                      <span className="fi fi-sa text-lg rounded-sm shadow-sm"></span>
                      السعودية
                    </button>
                    <button onClick={() => changeCountry('eg')} className={`w-full text-right px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm transition-colors ${activeCountry === 'eg' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : ''}`}>
                      <span className="fi fi-eg text-lg rounded-sm shadow-sm"></span>
                      مصر
                    </button>
                    <button onClick={() => changeCountry('ae')} className={`w-full text-right px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm transition-colors ${activeCountry === 'ae' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : ''}`}>
                      <span className="fi fi-ae text-lg rounded-sm shadow-sm"></span>
                      الإمارات
                    </button>
                    <button onClick={() => changeCountry('kw')} className={`w-full text-right px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm transition-colors ${activeCountry === 'kw' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : ''}`}>
                      <span className="fi fi-kw text-lg rounded-sm shadow-sm"></span>
                      الكويت
                    </button>
                  </div>
               </div>
            </div>

            {/* Language Toggle - Desktop Only */}
            <button 
              onClick={() => {
                const newLang = lang === 'ar' ? 'en' : 'ar';
                setLang(newLang);
                // Update HTML dir and lang attributes
                document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
                document.documentElement.setAttribute('lang', newLang === 'ar' ? 'ar' : 'en');
              }} 
              className={`hidden md:block px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${lang === 'en' ? 'bg-brand-600 text-white border-brand-600' : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-500 hover:text-brand-500'}`}
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>

            {/* Theme Toggle - Desktop */}
            <button onClick={toggleTheme} className={`hidden md:block p-2.5 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-all hover:scale-105`}>
               {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden px-5 py-2.5 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-all hover:scale-105 shadow-lg shadow-brand-500/30"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-6 ml-8">
              <Link href="/" className={`text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {lang === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
              <Link href="/services" className={`text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {lang === 'ar' ? 'الخدمات' : 'Services'}
              </Link>
              <Link href="/solutions" className={`text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {lang === 'ar' ? 'الحلول' : 'Solutions'}
              </Link>
              <Link href="/pricing" className={`text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {lang === 'ar' ? 'الأسعار' : 'Pricing'}
              </Link>
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className={`text-sm font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full transition-all hover:scale-105 ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                {t.loginBtn}
              </Link>
              <Link href="/register" className="block">
                <Button className="rounded-full px-5 md:px-8 py-2 md:py-3 text-sm md:text-base shadow-lg shadow-brand-500/30 font-bold hover:shadow-brand-500/50 transition-all hover:-translate-y-1 hover:scale-105 bg-gradient-to-r from-brand-600 to-brand-500 border-0">
                  {t.startTrial}
                </Button>
              </Link>
            </div>

            {/* Mobile: Only "جرب مجاناً" Button (Theme toggle already visible above) */}
            <Link href="/register" className="md:hidden">
              <Button className="rounded-full px-5 py-2.5 text-sm shadow-lg shadow-brand-500/30 font-bold hover:shadow-brand-500/50 transition-all hover:scale-105 bg-gradient-to-r from-brand-600 to-brand-500 border-0 whitespace-nowrap">
                جرب مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sidebar */}
      <div className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-cosmic-900 shadow-2xl transform transition-transform duration-300 overflow-y-auto ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-cosmic-900 z-10">
            <img src="/logo2.png" alt="فهملي" className="h-20 w-auto" />
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Close menu"
            >
              <X size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex flex-col p-6 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">
                {lang === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
              <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">
                {lang === 'ar' ? 'الخدمات' : 'Services'}
              </Link>
              <Link href="/solutions" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">
                {lang === 'ar' ? 'الحلول' : 'Solutions'}
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">
                {lang === 'ar' ? 'الأسعار' : 'Pricing'}
              </Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">
                {lang === 'ar' ? 'من نحن' : 'About Us'}
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium">
                {lang === 'ar' ? 'اتصل بنا' : 'Contact Us'}
              </Link>
            </div>

            {/* Country Selector */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2 px-4">
                <Globe size={16} />
                {lang === 'ar' ? 'اختر الدولة' : 'Select Country'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { changeCountry('sa'); setMobileMenuOpen(false); }} className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeCountry === 'sa' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                  🇸🇦 السعودية
                </button>
                <button onClick={() => { changeCountry('eg'); setMobileMenuOpen(false); }} className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeCountry === 'eg' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                  🇪🇬 مصر
                </button>
                <button onClick={() => { changeCountry('ae'); setMobileMenuOpen(false); }} className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeCountry === 'ae' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                  🇦🇪 الإمارات
                </button>
                <button onClick={() => { changeCountry('kw'); setMobileMenuOpen(false); }} className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeCountry === 'kw' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                  🇰🇼 الكويت
                </button>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-4">{lang === 'ar' ? 'اللغة' : 'Language'}</h3>
              <div className="flex gap-2">
                <button onClick={() => {
                  setLang('ar');
                  document.documentElement.setAttribute('dir', 'rtl');
                  document.documentElement.setAttribute('lang', 'ar');
                }} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${lang === 'ar' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                  عربي
                </button>
                <button onClick={() => {
                  setLang('en');
                  document.documentElement.setAttribute('dir', 'ltr');
                  document.documentElement.setAttribute('lang', 'en');
                }} className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${lang === 'en' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                  English
                </button>
              </div>
            </div>

            {/* Theme Toggle Mobile */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <button onClick={toggleTheme} className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                {lang === 'ar' ? (isDark ? 'الوضع النهاري' : 'الوضع الليلي') : (isDark ? 'Light Mode' : 'Dark Mode')}
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 pt-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full px-6 py-3 rounded-xl text-center font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full px-6 py-3 rounded-xl text-center font-bold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:opacity-90 transition-opacity shadow-lg">
                {lang === 'ar' ? 'ابدأ الآن مجاناً' : 'Start Free Trial'}
              </Link>
            </div>
          </div>
        </div>
      </div>

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
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
             <Link href="/register" className="w-full sm:w-auto">
               <Button className={`w-full sm:w-auto h-16 px-10 text-xl rounded-2xl ${isDark ? 'bg-brand-600 hover:bg-brand-500 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'} border-0 shadow-2xl shadow-brand-500/30 font-bold transition-all hover:scale-110 hover:shadow-brand-500/50 relative overflow-hidden group`}>
                 <span className="relative z-10 flex items-center gap-2">
                   <Sparkles className="w-5 h-5" />
                   {t.startTrial}
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
               </Button>
             </Link>
             <Link href="/solutions" className="w-full sm:w-auto">
                <button className={`w-full sm:w-auto h-16 px-10 text-lg rounded-2xl border-2 ${isDark ? 'border-white/20 hover:bg-white/10 text-white bg-white/5 backdrop-blur-sm' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-800'} transition-all font-bold flex items-center justify-center gap-3 shadow-lg hover:scale-105 hover:shadow-xl`}>
                  <ArrowRight className="w-5 h-5" />
                  استكشف الحلول
                </button>
             </Link>
          </motion.div>


          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-4 text-sm font-medium"
          >
             <span className={`flex items-center gap-2 px-5 py-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
               <Globe size={16} className="text-brand-500" /> 
               {activeCountry === 'eg' ? 'يدعم اللهجة المصرية 🇪🇬' : 'يدعم اللهجة السعودية 🇸🇦'}
             </span>
             <span className={`flex items-center gap-2 px-5 py-3 rounded-xl ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
               <Check size={16} className="text-green-500" strokeWidth={3} /> 
               <span className="text-green-700 dark:text-green-400 font-bold">تجربة مجانية 7 أيام</span>
             </span>
             <span className={`flex items-center gap-2 px-5 py-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm'}`}>
               <Shield size={16} className="text-blue-500" /> 
               <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>بدون بطاقة ائتمانية</span>
             </span>
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

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: '500+', label: 'عميل نشط', icon: <Users size={24} /> },
              { number: '50K+', label: 'محادثة يومياً', icon: <MessageCircle size={24} /> },
              { number: '99.9%', label: 'وقت التشغيل', icon: <Zap size={24} /> },
              { number: '24/7', label: 'دعم فني', icon: <Shield size={24} /> }
            ].map((stat, i) => (
              <div key={i} className={`text-center p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-lg'} hover:scale-105 transition-transform`}>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${isDark ? 'bg-brand-500/10' : 'bg-brand-50'} text-brand-500 mb-3`}>
                  {stat.icon}
                </div>
                <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.number}</div>
                <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
              </div>
            ))}
          </motion.div>

        </div>
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
                      {t.startFreeTrial}
                    </Button>
                  </Link>
                  <button onClick={() => setSelectedIndustry(null)} className="px-8 py-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-bold transition-colors text-gray-700 dark:text-gray-300">
                    {t.closeBtn}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Middle East Coverage Section */}
      <section className={`py-20 relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-cosmic-900 via-cosmic-900 to-cosmic-800' : 'bg-gradient-to-br from-white via-gray-50 to-blue-50'}`}>
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-6 ${isDark ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-600 border border-green-200'}`}>
              <Globe size={16} />
              {t.coverageTitle}
            </span>
            <h2 className={`text-4xl lg:text-6xl font-black mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.coverageSubtitle}
            </h2>
            <p className={`text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {t.coverageDescription}
            </p>
          </motion.div>

          {/* Countries Grid */}
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 md:gap-6 mt-16">
            {[
              { flag: 'SA', name: 'السعودية', code: 'SA' },
              { flag: 'EG', name: 'مصر', code: 'EG' },
              { flag: 'AE', name: 'الإمارات', code: 'AE' },
              { flag: 'KW', name: 'الكويت', code: 'KW' },
              { flag: 'QA', name: 'قطر', code: 'QA' },
              { flag: 'BH', name: 'البحرين', code: 'BH' },
              { flag: 'JO', name: 'الأردن', code: 'JO' },
              { flag: 'LB', name: 'لبنان', code: 'LB' },
              { flag: 'MA', name: 'المغرب', code: 'MA' }
            ].map((country, index) => (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`group relative p-6 rounded-2xl text-center transition-all duration-300 hover:scale-110 ${isDark ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-lg hover:shadow-xl'}`}
              >
                <div className="text-5xl mb-3 transform group-hover:scale-125 transition-transform duration-300">
                  <span className={`inline-block rounded-lg overflow-hidden shadow-lg fi fi-${country.code.toLowerCase()}`} style={{ fontSize: '48px', lineHeight: '48px', width: '48px', height: '48px', backgroundSize: 'cover' }}></span>
                </div>
                <p className={`text-sm font-bold ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
                  {country.name}
                </p>
                <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {country.code}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Industry Solutions */}
      <section className={`py-16 relative ${isDark ? 'bg-cosmic-950' : 'bg-gray-50'}`}>
        {isDark && <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>}
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${isDark ? 'bg-brand-500/10 text-brand-400' : 'bg-brand-50 text-brand-600'}`}>
              {t.solutionsTag}
            </span>
            <h2 className={`text-3xl lg:text-5xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.indTitle}</h2>
            <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.solutionsSubtitle}</p>
            <div className="mt-8 flex justify-center">
              <Link href="/solutions">
                <Button className="rounded-full px-10 py-4 text-lg shadow-lg font-bold hover:shadow-xl transition-all">
                  عرض جميع الحلول
                  <ArrowRight size={20} className="mr-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { 
                icon: <Utensils size={36} />, 
                title: 'المطاعم والكافيهات', 
                desc: 'عرض المنيو بالصور، حجز الطاولات، استقبال طلبات التوصيل، والرد على استفسارات الموقع وأوقات العمل بلهجة تفتح النفس.',
                modalTitle: 'حلول ذكية للمطاعم والكافيهات',
                modalDesc: 'نظام متكامل يتيح لعملائك تصفح المنيو، حجز الطاولات، وطلب التوصيل عبر واتساب بكل سهولة.',
                color: "orange", 
                image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600" 
              },
              { 
                icon: <Stethoscope size={36} />, 
                title: 'العيادات والمراكز الطبية', 
                desc: 'حجز المواعيد تلقائياً، الإجابة على الأسئلة الطبية الشائعة، تذكير المرضى بمواعيدهم، وإدارة قوائم الانتظار.',
                modalTitle: 'حلول العيادات والمراكز الطبية',
                modalDesc: 'نظام حجز مواعيد ذكي يقلل المكالمات الهاتفية ويحسن تجربة المرضى.',
                color: "blue", 
                image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600" 
              },
              { 
                icon: <ShoppingBag size={36} />, 
                title: 'المتاجر والوكالات', 
                desc: 'مساعد تسوق ذكي يقترح المنتجات، يتابع حالة الطلب، يجيب على استفسارات المنتجات، ويقلل من استرجاع البضائع.',
                modalTitle: 'حلول المتاجر الإلكترونية',
                modalDesc: 'زود مبيعاتك مع مساعد تسوق ذكي يفهم احتياجات عملائك ويقترح المنتجات المناسبة.',
                color: "purple", 
                image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600" 
              },
              {
                icon: <Code size={36} />,
                title: 'الشركات والمؤسسات',
                desc: 'دعم فني ذكي، نظام تذاكر متقدم، إدارة طلبات الخدمة، قاعدة معرفية تفاعلية، وتقارير تحليلية مفصلة للأداء.',
                modalTitle: 'حلول الشركات والمؤسسات',
                modalDesc: 'نظام دعم فني متكامل مع قاعدة معرفية ذكية وتقارير تحليلية تفصيلية.',
                color: "green",
                image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600"
              },
              {
                icon: <Brain size={36} />,
                title: 'التعليم والتدريب',
                desc: 'تسجيل الطلاب، إرسال المواد التعليمية، متابعة الحضور والغياب، الرد على الاستفسارات الأكاديمية، وتنبيهات الامتحانات.',
                modalTitle: 'حلول التعليم والتدريب',
                modalDesc: 'أتمتة العمليات الإدارية وتحسين التواصل مع الطلاب وأولياء الأمور.',
                color: "indigo",
                image: "/assets/images/education.jpg"
              },
              {
                icon: <Shield size={36} />,
                title: 'الخدمات المالية',
                desc: 'استفسارات عن الحسابات والأرصدة، طلبات القروض، دعم فني آمن ومشفر، إشعارات المعاملات، وتقارير مالية فورية.',
                modalTitle: 'حلول الخدمات المالية',
                modalDesc: 'خدمات مصرفية ذكية وآمنة عبر واتساب مع حماية عالية للبيانات.',
                color: "red",
                image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=600"
              }
            ].map((item, idx) => {
              const solutionLinks = {
                'المطاعم والكافيهات': '/solutions/restaurant',
                'العيادات والمراكز الطبية': '/solutions/clinic',
                'المتاجر والوكالات': '/solutions/retail',
                'الشركات والمؤسسات': '/solutions/business',
                'التعليم والتدريب': '/solutions/education',
                'الخدمات المالية': '/solutions/realestate'
              };
              return (
              <Link key={idx} href={solutionLinks[item.title] || '/solutions'}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
              >
                <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300 h-full ${
                  isDark 
                    ? 'border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-brand-500/30 hover:shadow-xl' 
                    : 'border-gray-200 bg-white hover:border-brand-400 hover:shadow-xl'
                } hover:-translate-y-2`}>
                  
                  {/* Icon */}
                  <div className="relative p-6">
                    <div className={`inline-flex w-14 h-14 rounded-xl items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105 ${
                      isDark
                        ? `bg-${item.color}-500/10 text-${item.color}-400`
                        : `bg-${item.color}-50 text-${item.color}-600`
                    }`}>
                      {item.icon}
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-3 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className={`text-sm leading-relaxed min-h-[100px] ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.desc}
                    </p>
                  </div>

                  {/* Bottom CTA */}
                  <div className={`px-6 pb-6 pt-2`}>
                    <div className="flex items-center gap-2 text-sm font-semibold transition-colors duration-300 group-hover:gap-3 ${
                        isDark 
                          ? 'text-brand-400' 
                          : 'text-brand-600'
                      }">
                      اكتشف المزيد
                      <ArrowRight size={16} className="transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
              </Link>
            )})})
          </div>
        </div>
      </section>

      {/* Comparison Section (New & Improved) */}
      <section className={`py-16 border-t ${isDark ? 'border-white/5 bg-cosmic-900/50' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
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

      {/* Testimonials Section */}
      <section className={`py-16 ${isDark ? 'bg-cosmic-900/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${isDark ? 'bg-brand-500/10 text-brand-400' : 'bg-brand-50 text-brand-600'}`}>
              ماذا يقول عملاؤنا
            </span>
            <h2 className={`text-3xl lg:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              قصص نجاح حقيقية
            </h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              انضم لمئات الشركات التي نجحت مع فهملي
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'أحمد السالم',
                role: 'مدير مطعم الذواقة',
                text: 'زادت طلباتنا 45% بعد استخدام فهملي. العملاء يحبون سرعة الرد والدقة في فهم طلباتهم!',
                rating: 5,
                avatar: '👨‍💼'
              },
              {
                name: 'فاطمة محمد',
                role: 'مديرة عيادة النور',
                text: 'تقليل 60% من المكالمات الهاتفية. الآن المرضى يحجزون مواعيدهم بسهولة عبر واتساب.',
                rating: 5,
                avatar: '👩‍⚕️'
              },
              {
                name: 'خالد العتيبي',
                role: 'صاحب متجر إلكتروني',
                text: 'فهملي غيّر شكل خدمة العملاء عندنا. الردود السريعة زادت رضا العملاء بشكل كبير.',
                rating: 5,
                avatar: '👨‍💻'
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-lg'} hover:shadow-2xl transition-all hover:-translate-y-2`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className={`text-lg mb-6 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4 pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}">
                  <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {testimonial.name}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Faheemly */}
      <section className="py-20 px-6 bg-gradient-to-b from-brand-500 to-brand-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-4">لماذا تختار فهملي؟</h2>
              <p className="text-xl opacity-90">أسباب تجعلنا الخيار الأفضل</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Zap size={32} />, title: 'إعداد سريع', desc: 'ابدأ في أقل من 5 دقائق' },
              { icon: <Shield size={32} />, title: 'أمان عالي', desc: 'بياناتك محمية بأعلى معايير الأمان' },
              { icon: <Clock size={32} />, title: 'دعم 24/7', desc: 'فريق دعم متاح على مدار الساعة' }
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
      <section className={`py-16 relative overflow-hidden ${isDark ? 'bg-cosmic-950' : 'bg-white'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-purple-500/10 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block p-4 rounded-full bg-brand-500/10 mb-8">
              <Sparkles size={40} className="text-brand-500" />
            </div>
            <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              جاهز لتحويل تجربة عملائك؟
            </h2>
            <p className={`text-xl mb-10 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ابدأ تجربتك المجانية اليوم - بدون بطاقة ائتمانية - 7 أيام كاملة
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button className="h-16 px-10 text-xl rounded-2xl shadow-2xl shadow-brand-500/30 hover:scale-110 transition-all">
                  <Rocket size={20} className="ml-2" />
                  ابدأ التجربة المجانية
                </Button>
              </Link>
              <Link href="/contact">
                <button className={`h-16 px-10 text-xl rounded-2xl border-2 font-bold transition-all hover:scale-105 ${isDark ? 'border-white/20 hover:bg-white/5 text-white' : 'border-gray-300 hover:bg-gray-50 text-gray-900'}`}>
                  <Mail size={20} className="inline ml-2" />
                  تواصل معنا
                </button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center items-center gap-6 mt-12">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
                <div className="text-yellow-500">⭐⭐⭐⭐⭐</div>
                <span className="text-xs font-medium">4.9/5 تقييم</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
                <Shield size={16} className="text-green-500" />
                <span className="text-xs font-medium">مدفوعات آمنة</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
                <Lock size={16} className="text-blue-500" />
                <span className="text-xs font-medium">بيانات محمية SSL</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-xs font-medium">ضمان استرداد 30 يوم</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Limited Time Offer - Compact Banner */}
      <section className={`py-8 ${isDark ? 'bg-cosmic-900/50' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-pink-600 p-[1px]"
          >
            <div className={`rounded-xl px-6 py-4 ${isDark ? 'bg-cosmic-900' : 'bg-white'} flex flex-col md:flex-row items-center justify-between gap-4`}>
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold">
                  <Sparkles size={12} />
                  عرض لفترة محدودة
                </div>
                <div className="text-center md:text-right">
                  <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    {activeCountry === 'eg' && 'ابدأ من 372 جنيه شهرياً'}
                    {activeCountry === 'ae' && 'ابدأ من 99 درهم شهرياً'}
                    {activeCountry === 'kw' && 'ابدأ من 8 دينار شهرياً'}
                    {activeCountry === 'sa' && 'ابدأ من 99 ريال شهرياً'}
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    خطة احترافية كاملة 🎉
                  </p>
                </div>
              </div>
              <Link href="/register">
                <Button className="px-5 py-2.5 text-sm rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 font-bold whitespace-nowrap">
                  اشترك الآن
                  <ArrowRight className="mr-2" size={16} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
