'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50 dark:from-cosmic-950 dark:via-cosmic-900 dark:to-brand-950 transition-all duration-500">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

      <div className="relative z-10 text-center">
        {/* Logo Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-2xl animate-ping"></div>
          <div className="relative">
              <Image
                src="/logo2.png"
                alt="فهملي"
                width={96}
                height={96}
                className="object-contain mx-auto animate-bounce"
                priority
              />
            </div>
        </div>

        {/* Brand Name */}
        <h1
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-brand-600 via-purple-600 to-brand-600 bg-clip-text text-transparent animate-shimmer"
          style={{ backgroundSize: '200% 100%' }}
        >
          فهملي
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium">
          منصة الذكاء الاصطناعي للشات بوت
        </p>

        {/* Modern Progress Bar */}
        <div className="w-80 mx-auto mb-10 relative z-0">
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner relative z-0">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-purple-500 to-brand-600 rounded-full transition-all duration-300 ease-out relative z-0"
              style={{ width: `${progress}%` }}
            >
              <div
                className="absolute inset-0 bg-white/30 animate-shimmer"
                style={{ backgroundSize: '200% 100%' }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>جاري التحميل</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Loading Text */}
        <div className="flex items-center justify-center gap-2 text-brand-600 dark:text-brand-400 mt-2 z-20 relative">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"></div>
            <div
              className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
          <span className="text-sm font-medium">جاري تجهيز مساحة العمل</span>
        </div>
      </div>
    </div>
  );
}
