'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { API_CONFIG, WIDGET_CONFIG } from '@/lib/config';

const SalesBot = () => {
  const pathname = usePathname();

  // Hide on dashboard, admin, login, register, wizard, examples, docs pages
  const hiddenPaths = [
    '/dashboard',
    '/admin',
    '/login',
    '/register',
    '/wizard',
    '/examples',
    '/docs',
  ];
  // Only hide if pathname matches these specific paths, not the homepage
  const shouldHide = pathname && hiddenPaths.some(path => pathname.startsWith(path));

  useEffect(() => {
    if (shouldHide) return;
    
    // Check if a fahimo widget script is already present (handle different IDs / variants)
    if (document.getElementById('fahimo-widget-script') || document.querySelector('script[src*="fahimo-widget"]')) return;

    const script = document.createElement('script');
    script.id = 'fahimo-widget-script';
    // Use centralized configuration
    script.src = API_CONFIG.WIDGET_SCRIPT;
    script.setAttribute('data-business-id', WIDGET_CONFIG.BUSINESS_ID);
    script.async = true;
    
    script.onerror = () => {
      console.error('Failed to load Fahimo widget from:', script.src);
    };
    
    document.body.appendChild(script);

    return () => {
      // Optional: Cleanup if needed, but usually we want the widget to persist
    };
  }, [shouldHide]);

  if (shouldHide) return null;

  return null; // The widget renders itself into the body
};

export default SalesBot;
