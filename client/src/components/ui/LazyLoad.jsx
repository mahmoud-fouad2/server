'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * LazyLoad Component - Loads children only when visible in viewport
 */
export default function LazyLoad({ 
  children, 
  threshold = 0.1,
  rootMargin = '50px',
  placeholder = null,
  once = true,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              setHasLoaded(true);
              observer.disconnect();
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, once]);

  const shouldRender = once ? hasLoaded || isVisible : isVisible;

  return (
    <div ref={ref} className={className}>
      {shouldRender ? children : placeholder}
    </div>
  );
}

/**
 * LazyImage Component - Lazy loads images with blur-up effect
 */
export function LazyImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '',
  blurDataURL,
  priority = false,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [priority]);

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
          {...props}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-cosmic-700 animate-pulse" />
      )}
    </div>
  );
}

/**
 * LazySection - For lazy loading entire sections
 */
export function LazySection({ 
  children, 
  fallback = null,
  minHeight = '200px',
  className = ''
}) {
  return (
    <LazyLoad 
      placeholder={
        fallback || (
          <div 
            className={`animate-pulse bg-gray-200 dark:bg-cosmic-700 rounded-lg ${className}`}
            style={{ minHeight }}
          />
        )
      }
      className={className}
    >
      {children}
    </LazyLoad>
  );
}

/**
 * Hook for lazy loading data
 */
export function useLazyLoad(callback, dependencies = []) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            callback();
            setHasLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [callback, hasLoaded, ...dependencies]);

  return { ref, isVisible, hasLoaded };
}
