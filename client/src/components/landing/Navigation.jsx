'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/Components';
import { Moon, Sun, Globe, X } from 'lucide-react';

const Navigation = ({
  lang,
  setLang,
  activeCountry,
  changeCountry,
  isDark,
  toggleTheme,
  scrolled,
  mobileMenuOpen,
  setMobileMenuOpen,
  t
}) => {
  const FlagIcon = ({ code }) => {
    if (code === 'sa') return <span className="text-xl drop-shadow-md hover:scale-110 transition-transform">🇸🇦</span>;
    if (code === 'eg') return <span className="text-xl drop-shadow-md hover:scale-110 transition-transform">🇪🇬</span>;
    return null;
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'h-28 shadow-lg shadow-black/5' : 'h-32'} bg-[#f8f8fa] dark:bg-cosmic-950/90 border-b border-gray-200 dark:border-white/5`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center group hover:scale-105 transition-transform">
              <Image
                src="/logo.webp"
                alt="فهملي"
                width={scrolled ? 160 : 256}
                height={64}
                className={`${scrolled ? 'w-40 md:w-48' : 'w-48 md:w-64'} h-auto object-contain transition-all`}
              />
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
                <span className="text-sm font-bold hidden sm:inline-block opacity-80">
                  {activeCountry === 'sa' ? 'السعودية' : activeCountry === 'eg' ? 'مصر' : activeCountry === 'ae' ? 'الإمارات' : 'الكويت'}
                </span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-cosmic-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50 overflow-hidden">
                <div className="p-1.5">
                  {['sa', 'eg', 'ae', 'kw'].map(code => (
                    <button
                      key={code}
                      onClick={() => changeCountry(code)}
                      className={`w-full text-right px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center gap-3 text-sm transition-colors ${activeCountry === code ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : ''}`}
                    >
                      <span className="fi fi-${code} text-lg rounded-sm shadow-sm"></span>
                      {code === 'sa' ? 'السعودية' : code === 'eg' ? 'مصر' : code === 'ae' ? 'الإمارات' : 'الكويت'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Language Toggle - Desktop Only */}
            <button
              onClick={() => {
                const newLang = lang === 'ar' ? 'en' : 'ar';
                setLang(newLang);
                document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
                document.documentElement.setAttribute('lang', newLang === 'ar' ? 'ar' : 'en');
              }}
              className={`hidden md:block px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${lang === 'en' ? 'bg-brand-600 text-white border-brand-600' : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-500 hover:text-brand-500'}`}
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>

            {/* Theme Toggle - Desktop */}
            <button
              onClick={toggleTheme}
              className={`hidden md:block p-2.5 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-all hover:scale-105`}
            >
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
              {[
                { href: '/', label: lang === 'ar' ? 'الرئيسية' : 'Home' },
                { href: '/services', label: lang === 'ar' ? 'الخدمات' : 'Services' },
                { href: '/solutions', label: lang === 'ar' ? 'الحلول' : 'Solutions' },
                { href: '/examples', label: lang === 'ar' ? 'كيف نعمل' : 'How We Work' },
                { href: '/pricing', label: lang === 'ar' ? 'الأسعار' : 'Pricing' }
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className={`text-sm font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-full transition-all hover:scale-105 ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
                {t.loginBtn}
              </Link>
              <Link href="/register">
                <Button className="rounded-full px-5 md:px-8 py-2 md:py-3 text-sm md:text-base shadow-lg shadow-brand-500/30 font-bold hover:shadow-brand-500/50 transition-all hover:-translate-y-1 hover:scale-105 bg-gradient-to-r from-brand-600 to-brand-500 border-0">
                  {t.startTrial}
                </Button>
              </Link>
            </div>

            {/* Mobile: Only "جرب مجاناً" Button */}
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

        {/* Sidebar */}
        <div className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-cosmic-900 shadow-2xl transform transition-transform duration-300 overflow-y-auto ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-cosmic-900 z-10">
            <Image src="/logo2.png" alt="فهملي" width={120} height={80} className="h-20 w-auto" />
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors" aria-label="Close menu">
              <X size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex flex-col p-6 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-2">
              {[
                { href: '/', label: lang === 'ar' ? 'الرئيسية' : 'Home' },
                { href: '/services', label: lang === 'ar' ? 'الخدمات' : 'Services' },
                { href: '/solutions', label: lang === 'ar' ? 'الحلول' : 'Solutions' },
                { href: '/examples', label: lang === 'ar' ? 'كيف نعمل' : 'How We Work' },
                { href: '/pricing', label: lang === 'ar' ? 'الأسعار' : 'Pricing' },
                { href: '/about', label: lang === 'ar' ? 'من نحن' : 'About Us' },
                { href: '/contact', label: lang === 'ar' ? 'اتصل بنا' : 'Contact Us' }
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Country Selector */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2 px-4">
                <Globe size={16} />
                {lang === 'ar' ? 'اختر الدولة' : 'Select Country'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {['sa', 'eg', 'ae', 'kw'].map(code => (
                  <button
                    key={code}
                    onClick={() => { changeCountry(code); setMobileMenuOpen(false); }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeCountry === code ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                  >
                    {code === 'sa' ? '🇸🇦 السعودية' : code === 'eg' ? '🇪🇬 مصر' : code === 'ae' ? '🇦🇪 الإمارات' : '🇰🇼 الكويت'}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Switcher */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-4">
                {lang === 'ar' ? 'اللغة' : 'Language'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setLang('ar')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${lang === 'ar' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${lang === 'en' ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Theme Toggle Mobile */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <button
                onClick={toggleTheme}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300 font-medium"
              >
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
    </>
  );
};

export default Navigation;