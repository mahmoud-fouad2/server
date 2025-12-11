'use client';

import { useState, useEffect } from 'react';
import FaheemAnimatedLogo from './FaheemAnimatedLogo';

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 300);
          return 100;
        }
        // Faster progress at start, slower at end
        const increment =
          prev < 50 ? Math.random() * 15 + 10 : Math.random() * 8 + 3;
        return Math.min(prev + increment, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-brand-50 dark:from-cosmic-950 dark:via-cosmic-900 dark:to-brand-950 transition-all duration-500">
      {/* Background effects */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-16 -top-16 w-[60vw] h-[60vw] bg-brand-600/6 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute -right-20 -bottom-12 w-[50vw] h-[50vw] bg-purple-600/6 rounded-full blur-[150px] animate-float" />
        </div>
      )}

      <div className="relative z-10 text-center w-full px-4">
        {/* Circular badge for logo (larger) */}
        <div className="mb-4">
          <div className="inline-flex items-center justify-center rounded-full shadow-2xl p-4">
            <FaheemAnimatedLogo size="large" isLoading={true} showText={false} />
          </div>
        </div>

        {/* Main loading label (animated shimmer) */}
        <div className="mb-2">
          <h2 className="text-2xl sm:text-3xl font-semibold">
            <span className="bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-500 bg-clip-text text-transparent animate-shimmer">جاري التحميل</span>
          </h2>
        </div>

        {/* Big Progress Bar (raised and slightly thicker) */}
        <div className="w-full max-w-2xl mx-auto -mt-2 mb-2 px-6">
          <div className="h-4 md:h-5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${Math.min(Math.max(progress, 2), 100)}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Percentage */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
        </div>

        {/* Small helper text */}
        <div className="text-sm text-gray-500 dark:text-gray-400">نرجو الانتظار قليلاً بينما نجهز الملفات والإعدادات</div>
      </div>
    </div>
  );
}
