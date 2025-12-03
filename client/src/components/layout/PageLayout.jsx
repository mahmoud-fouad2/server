"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import Footer from './Footer'

export default function PageLayout({ children }) {
  const [isDark, setIsDark] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
  }

  return (
    <>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'h-28 shadow-lg' : 'h-32'} bg-[#f8f8fa] dark:bg-cosmic-950/90 border-b border-gray-200 dark:border-white/5`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="hover:scale-105 transition-transform">
            <img src="/logo.webp" alt="فهملي" className={`${scrolled ? 'w-40 h-40' : 'w-48 h-48'} object-contain transition-all`} />
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className={`hidden lg:block text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              الرئيسية
            </Link>
            <Link href="/services" className={`hidden lg:block text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              الخدمات
            </Link>
            <Link href="/solutions" className={`hidden lg:block text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              الحلول
            </Link>
            <Link href="/pricing" className={`hidden lg:block text-sm font-medium transition-colors hover:text-brand-600 dark:hover:text-brand-400 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              الأسعار
            </Link>

            <button onClick={toggleTheme} className={`p-2.5 rounded-full ${isDark ? 'bg-white/5 hover:bg-white/10 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-all hover:scale-105`}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link href="/login" className={`text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:scale-105 ${isDark ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
              تسجيل الدخول
            </Link>
            <Link href="/register" className="hidden md:block px-8 py-3 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold shadow-lg hover:scale-105 transition-all">
              ابدأ الآن
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24">
        {children}
      </div>

      {/* Floating Widget - Visible on all pages - RIGHT SIDE */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => {
            const widget = document.querySelector('#fahimo-widget-container');
            if (widget) {
              widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
            }
          }}
          className="group relative w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-500 rounded-full shadow-2xl hover:shadow-brand-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center"
        >
          {/* Icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            className="w-8 h-8 text-white relative z-10 group-hover:rotate-12 transition-transform"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            تحدث معنا
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </>
  )
}
