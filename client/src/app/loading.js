"use client";

import FaheemAnimatedLogo from "@/components/FaheemAnimatedLogo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/90 dark:bg-cosmic-950/90 backdrop-blur-sm transition-all duration-500">
      <div className="relative">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl animate-pulse"></div>
        
        <FaheemAnimatedLogo size="large" isLoading={true} showText={true} />
        
        {/* Loading Bar */}
        <div className="mt-8 w-48 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500 w-full animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
        </div>
        
        <p className="text-center mt-4 text-sm font-medium text-muted-foreground animate-pulse">
          جاري تجهيز مساحة العمل...
        </p>
      </div>
    </div>
  );
}
