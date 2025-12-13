'use client';

import { useEffect, useState } from 'react';
import FaheemAnimatedLogo from '../components/FaheemAnimatedLogo';

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
      {/* Subtle animated bg */}
      <div className="absolute inset-0 opacity-60 overflow-hidden pointer-events-none">
        <div className="absolute -left-16 -top-16 w-96 h-96 bg-brand-500/6 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -right-20 -bottom-12 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 text-center w-full px-4">
        {/* Circular badge for logo (use shared component) */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center rounded-full shadow-2xl p-4">
            <FaheemAnimatedLogo size="large" isLoading={true} showText={false} />
          </div>
        </div>

        {/* Main loading label (animated) */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold">
            <span className="bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-500 bg-clip-text text-transparent animate-shimmer">جاري التحميل</span>
          </h2>
        </div>

        {/* Big Progress Bar (raised and slightly thicker) */}
        <div className="w-full max-w-2xl mx-auto mt-2 mb-4 px-6">
          <div className="h-4 md:h-5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(Math.max(progress, 2), 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Percentage */}
        <div className="mb-6">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
        </div>

        {/* Small helper text */}
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">نرجو الانتظار قليلاً بينما نجهز الملفات والإعدادات</div>
      </div>
    </div>
  );
}
