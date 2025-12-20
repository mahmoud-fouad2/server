'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Moon, Sun, Menu, X, Globe } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme, lang, changeLang } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [country, setCountry] = useState('sa');

  useEffect(() => {
    // Detect country from pathname
    if (pathname.includes('/eg')) setCountry('eg');
    else if (pathname.includes('/ae')) setCountry('ae');
    else if (pathname.includes('/kw')) setCountry('kw');
    else setCountry('sa');

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const changeCountry = code => {
    setMobileMenuOpen(false);
    if (code === 'sa') router.push('/');
    else router.push(`/${code}`);
  };

  const countries = [
    { code: 'sa', name: 'السعودية', flag: '🇸🇦' },
    { code: 'eg', name: 'مصر', flag: '🇪🇬' },
    { code: 'ae', name: 'الإمارات', flag: '🇦🇪' },
    { code: 'kw', name: 'الكويت', flag: '🇰🇼' },
  ];

  const menuItems = [
    { href: '/', label: 'الرئيسية' },
    { href: '/services', label: 'الخدمات' },
    { href: '/solutions', label: 'الحلول' },
    { href: '/examples', label: 'كيف نعمل' },
    { href: '/pricing', label: 'الأسعار' },
    { href: '/about', label: 'من نحن' },
    { href: '/contact', label: 'اتصل بنا' },
  ];

  return (
    <>
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'h-20 shadow-lg' : 'h-24'} backdrop-blur-sm border-b border-gray-200 dark:border-white/5`}
        style={{ backgroundColor: '#f8f8fa' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="hover:scale-105 transition-transform">
              <Image
                src="/logo.webp"
                alt="Faheemly"
                width={110}
                height={110}
                className="w-[110px] h-[110px] object-contain transition-all"
                priority={true}
              />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4">
            {menuItems.slice(0, 5).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-all hover:scale-105`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              href="/login"
              className={`text-sm font-bold px-4 py-2 rounded-full transition-all hover:scale-105 ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold shadow-lg hover:scale-105 transition-all text-sm"
            >
              جرب مجاناً
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full ${isDark ? 'bg-white/5 text-yellow-400' : 'bg-gray-100 text-gray-600'} transition-all hover:scale-105`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="px-4 py-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-all hover:scale-105 shadow-lg shadow-brand-500/30"
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-cosmic-900 shadow-2xl transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
            <Image src="/logo2.png" alt="فهملي" width={120} height={60} className="h-16 w-auto" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Close menu"
            >
              <X size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex flex-col h-[calc(100%-80px)] overflow-y-auto">
            {/* Navigation Links */}
            <div className="p-6 space-y-2">
              {menuItems.map(item => {
                // Translate menu items
                const labelMap = {
                  الرئيسية: 'Home',
                  الخدمات: 'Services',
                  الحلول: 'Solutions',
                  الأسعار: 'Pricing',
                  'من نحن': 'About Us',
                  'اتصل بنا': 'Contact Us',
                };
                const displayLabel =
                  lang === 'ar'
                    ? item.label
                    : labelMap[item.label] || item.label;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium"
                  >
                    {displayLabel}
                  </Link>
                );
              })}
            </div>

            {/* Country Selector */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <Globe size={16} />
                اختر الدولة
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {countries.map(c => (
                  <button
                    key={c.code}
                    onClick={() => changeCountry(c.code)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      country === c.code
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                        : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language Toggle */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">
                اللغة
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => changeLang('ar')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    lang === 'ar'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => changeLang('en')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    lang === 'en'
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 dark:border-white/10 space-y-3">
              <Link
                href="/login"
                className="flex items-center justify-center w-full py-3 rounded-xl border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all"
              >
                جرب مجاناً
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
