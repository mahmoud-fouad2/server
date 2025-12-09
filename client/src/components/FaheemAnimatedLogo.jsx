'use client';
import React, { useState, useEffect, useRef } from 'react';

const FaheemAnimatedLogo = ({
  size = 'large',
  showText = true,
  isLoading = false,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [wave, setWave] = useState(0);
  const [breathe, setBreathe] = useState(0);
  const [mounted, setMounted] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sizes = {
    small: {
      width: 280,
      height: 120,
      fontSize: 32,
      container: 'w-72 h-32',
      textMargin: 'mt-0',
      textScale: 0.7,
    },
    medium: {
      width: 320,
      height: 140,
      fontSize: 60,
      container: 'w-80 h-36',
      textMargin: 'mt-1',
      textScale: 0.6,
    },
    large: {
      width: 500,
      height: 220,
      fontSize: 100,
      container: 'w-full max-w-[500px] h-[220px]',
      textMargin: 'mt-2',
      textScale: 0.5,
    },
    xlarge: {
      width: 640,
      height: 280,
      fontSize: 130,
      container: 'w-full max-w-[640px] h-[280px]',
      textMargin: 'mt-2',
      textScale: 0.48,
    },
  };

  const currentSize = sizes[size] || sizes.large;

  // Wave animation
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setWave(prev => (prev + 1) % 360);
    }, 25);
    return () => clearInterval(interval);
  }, [mounted]);

  // Breathing
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setBreathe(prev => (prev + 1) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [mounted]);

  const breatheScale = 1 + Math.sin((breathe * Math.PI) / 180) * 0.015;

  // Loading animation - slide/fly effect
  const loadingTranslate = isLoading ? Math.sin((wave * Math.PI) / 60) * 15 : 0;

  if (!mounted) {
    return <div className={currentSize.container} />;
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center ${className} hidden md:flex`}>
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative w-80 h-80 flex items-center justify-center p-12 bg-[#f8f8fa] rounded-full overflow-hidden shadow-2xl border-4 border-white/50">
            <img
              src="/logo.webp"
              alt="Faheemly"
              className="w-full h-full object-contain relative z-10 animate-pulse"
            />
          </div>
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex gap-2">
            <div className="w-3 h-3 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-col items-center justify-center ${className} hidden md:inline-flex`}
    >
      <div
        ref={logoRef}
        className={`relative cursor-pointer transition-all duration-700 ${currentSize.container} overflow-hidden rounded-2xl`}
        style={{
          transform: `scale(${breatheScale}) translateX(${loadingTranslate}px)`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src="/logo.webp"
          alt="Faheemly Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Text below logo - REMOVED as per request */}
      {/* {showText && (
        <div className={`text-center font-black font-sans leading-tight ${currentSize.textMargin} relative group-hover:scale-105 transition-transform duration-300`} style={{ direction: 'rtl' }}>
          <span 
            className="text-blue-700 dark:text-blue-500" 
            style={{ 
              fontSize: `${currentSize.fontSize * (currentSize.textScale || 0.6) * 1.2}px`, 
              letterSpacing: '0px',
            }}
          >
            فهملي
          </span>
          <span 
            className="text-purple-700 dark:text-purple-500" 
            style={{ 
              fontSize: `${currentSize.fontSize * (currentSize.textScale || 0.6) * 0.7}px`, 
              letterSpacing: '0px',
            }}
          >
            .كوم
          </span>
        </div>
      )} */}

      {/* Loading text - REMOVED as per request */}
      {/* {isLoading && (
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-8 h-8 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300 font-sans animate-pulse">
            جاري التحميل...
          </p>
        </div>
      )} */}
    </div>
  );
};

export default FaheemAnimatedLogo;
