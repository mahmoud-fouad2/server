'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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

    // Faheemly Business ID
    const FAHEEMLY_BUSINESS_ID = 'cmivd3c0z0003ulrrn7m1jtjf';
    
    // Check if script is already loaded
    if (document.getElementById('fahimo-widget-script')) return;

    const script = document.createElement('script');
    script.id = 'fahimo-widget-script';
    // Use the production API URL for the widget script
    script.src = 'https://fahimo-api.onrender.com/fahimo-widget.js';
    script.setAttribute('data-business-id', FAHEEMLY_BUSINESS_ID);
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      // Optional: Cleanup if needed, but usually we want the widget to persist
    };
  }, [shouldHide]);

  if (shouldHide) return null;

  return null; // The widget renders itself into the body
};

export default SalesBot;
