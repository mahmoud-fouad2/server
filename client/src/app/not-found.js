"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import FaheemAnimatedLogo from '@/components/FaheemAnimatedLogo'
import { Home, MessageSquare, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f6f8] dark:bg-cosmic-950 text-center p-4" dir="rtl">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full animate-pulse"></div>
        <FaheemAnimatedLogo size="medium" showText={false} />
      </div>
      
      <h1 className="text-9xl font-black text-brand-500/20 mb-4 select-none">404</h1>
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">عذراً، الصفحة غير موجودة</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8 text-lg">
        يبدو أنك ضللت الطريق. لا تقلق، مساعدك الذكي هنا لإرشادك للعودة إلى المسار الصحيح.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button className="h-12 px-8 text-lg rounded-xl gap-2 shadow-lg shadow-brand-500/20 bg-brand-600 hover:bg-brand-700 text-white">
            <Home className="w-5 h-5" />
            العودة للرئيسية
          </Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline" className="h-12 px-8 text-lg rounded-xl gap-2 border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5">
            <MessageSquare className="w-5 h-5" />
            الدعم الفني
          </Button>
        </Link>
      </div>
    </div>
  )
}
