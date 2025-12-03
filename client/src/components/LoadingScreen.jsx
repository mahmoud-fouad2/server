"use client"

import { useState, useEffect } from 'react'
import FaheemAnimatedLogo from './FaheemAnimatedLogo'

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => onComplete?.(), 300)
          return 100
        }
        // Faster progress at start, slower at end
        const increment = prev < 50 ? Math.random() * 15 + 10 : Math.random() * 8 + 3
        return Math.min(prev + increment, 100)
      })
    }, 150)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-cosmic-950 dark:to-cosmic-900">
      {/* Background effects */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-brand-600/10 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[150px] animate-float" />
        </div>
      )}

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <FaheemAnimatedLogo size="medium" isLoading={true} showText={false} />
      </div>

      {/* Progress Bar Container */}
      <div className="relative z-10 w-64 sm:w-80">
        {/* Progress Bar Background */}
        <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
          {/* Progress Bar Fill */}
          <div 
            className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Progress Text */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
            جاري التحميل...
          </span>
          <span className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Loading Dots */}
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
      </div>
    </div>
  )
}
