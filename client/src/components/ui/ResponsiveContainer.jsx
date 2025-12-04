'use client';

import { useState, useEffect } from 'react';

/**
 * Responsive Container Component
 * Provides adaptive layout with breakpoint detection
 */

// Breakpoint constants (matches Tailwind defaults)
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState('lg');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      setWindowSize({
        width,
        height: window.innerHeight,
      });

      // Determine breakpoint
      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl');
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg');
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md');
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    windowSize,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
}

/**
 * Responsive Container Component
 */
export default function ResponsiveContainer({ 
  children, 
  className = '',
  maxWidth = '7xl', // default max-w-7xl
  padding = true,
  ...props 
}) {
  const { isMobile, isTablet } = useBreakpoint();

  const paddingClasses = padding 
    ? 'px-4 sm:px-6 lg:px-8'
    : '';

  const maxWidthClass = `max-w-${maxWidth}`;

  return (
    <div 
      className={`w-full ${maxWidthClass} mx-auto ${paddingClasses} ${className}`}
      data-mobile={isMobile}
      data-tablet={isTablet}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Adaptive Grid - Automatically adjusts columns based on screen size
 */
export function AdaptiveGrid({ 
  children, 
  className = '',
  minColumns = 1,
  maxColumns = 4,
  gap = 4,
  ...props 
}) {
  const gapClass = `gap-${gap}`;

  // Grid columns responsive classes
  const gridCols = `
    grid-cols-${minColumns}
    sm:grid-cols-${Math.min(2, maxColumns)}
    lg:grid-cols-${Math.min(3, maxColumns)}
    xl:grid-cols-${maxColumns}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div 
      className={`grid ${gridCols} ${gapClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Mobile Optimized Wrapper - Shows/hides content based on screen size
 */
export function MobileOptimized({ 
  children, 
  showOn = 'mobile', // 'mobile' | 'desktop' | 'all'
  fallback = null 
}) {
  const { isMobile } = useBreakpoint();

  if (showOn === 'all') {
    return <>{children}</>;
  }

  if (showOn === 'mobile' && !isMobile) {
    return fallback;
  }

  if (showOn === 'desktop' && isMobile) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Responsive Stack - Switches between horizontal and vertical layout
 */
export function ResponsiveStack({ 
  children, 
  className = '',
  stackAt = 'md', // breakpoint to stack vertically
  gap = 4,
  ...props 
}) {
  const { breakpoint } = useBreakpoint();
  
  const shouldStack = BREAKPOINTS[breakpoint] < BREAKPOINTS[stackAt];
  const gapClass = `gap-${gap}`;

  return (
    <div 
      className={`flex ${shouldStack ? 'flex-col' : 'flex-row'} ${gapClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Text - Adjusts font size based on screen size
 */
export function ResponsiveText({ 
  children, 
  className = '',
  size = 'base', // 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  responsive = true,
  ...props 
}) {
  const sizeMap = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl lg:text-4xl',
    '3xl': 'text-3xl sm:text-4xl lg:text-5xl',
    '4xl': 'text-4xl sm:text-5xl lg:text-6xl',
  };

  const sizeClass = responsive ? sizeMap[size] : `text-${size}`;

  return (
    <span className={`${sizeClass} ${className}`} {...props}>
      {children}
    </span>
  );
}

/**
 * Show/Hide based on breakpoint
 */
export function ShowAt({ breakpoint, children }) {
  const { breakpoint: currentBreakpoint } = useBreakpoint();
  
  if (currentBreakpoint === breakpoint) {
    return <>{children}</>;
  }
  
  return null;
}

export function HideAt({ breakpoint, children }) {
  const { breakpoint: currentBreakpoint } = useBreakpoint();
  
  if (currentBreakpoint !== breakpoint) {
    return <>{children}</>;
  }
  
  return null;
}
