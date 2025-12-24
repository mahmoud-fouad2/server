'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export const DemoChatWindow = () => {
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    // Choose business id in priority order:
    // 1) runtime override: window.__FAHIMO_BUSINESS_ID or meta[name="fahimo-business-id"]
    // 2) build-time env: NEXT_PUBLIC_WIDGET_BUSINESS_ID / NEXT_PUBLIC_BUSINESS_ID
    // 3) fallback to seeded demo (keeps behavior safe for local dev)
    const runtimeBiz = typeof window !== 'undefined'
      ? (window.__FAHIMO_BUSINESS_ID || document?.querySelector('meta[name="fahimo-business-id"]')?.getAttribute('content'))
      : undefined;
    const envBiz = process.env.NEXT_PUBLIC_WIDGET_BUSINESS_ID || process.env.NEXT_PUBLIC_BUSINESS_ID;
    const BUSINESS_ID = runtimeBiz || envBiz || 'cmir2oyaz00013ltwis4xc4tp';

    const scriptId = `fahimo-widget-script-${BUSINESS_ID}`;
    const existingScript = document.getElementById(scriptId);
    const existingRoot = document.getElementById('fahimo-widget-root');
    let createdByThis = false;

    if (!existingScript && !existingRoot) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://fahimo-api.onrender.com/fahimo-widget.js';
      script.setAttribute('data-business-id', BUSINESS_ID);
      script.async = true;
      script.onload = () => setWidgetLoaded(true);
      document.body.appendChild(script);
      createdByThis = true;
    } else {
      setWidgetLoaded(true);
    }

    return () => {
      // Cleanup only if we created the script/root to avoid removing other instances
      try {
        if (createdByThis) {
          const widgetRoot = document.getElementById('fahimo-widget-root');
          if (widgetRoot) widgetRoot.remove();
          const demoScript = document.getElementById(scriptId);
          if (demoScript) demoScript.remove();
        }
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, []);

  if (!widgetLoaded) {
    return (
      <div
        className="w-full max-w-3xl mx-auto font-sans relative"
        dir="rtl"
      >
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-brand-500 mb-4">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="text-lg font-bold">جاري تحميل الويدجت التفاعلي...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-3xl mx-auto font-sans relative"
      dir="rtl"
      style={{ minHeight: '600px' }}
    >
      {/* The actual widget will render here via script injection */}
      <div className="text-center py-8">
        <Sparkles className="w-8 h-8 mx-auto mb-4 text-brand-500 animate-pulse" />
        <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">الويدجت التفاعلي الحقيقي</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">جرّب المحادثة مع مساعد فهملي الذكي الآن!</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">ابحث عن أيقونة المحادثة في الزاوية اليمنى السفلى 👇</p>
      </div>
    </div>
  );
};
