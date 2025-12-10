"use client";

import { useEffect } from 'react';

export default function WidgetLoader() {
  useEffect(() => {
    try {
      const disabled = process.env.NEXT_PUBLIC_DISABLE_WIDGET === 'true';
      if (disabled) return;

      const path = typeof window !== 'undefined' ? window.location.pathname : '/';
      // Prevent loading widget on the wizard and other admin pages
      const blockedPaths = ['/wizard', '/admin', '/dashboard', '/register', '/login'];
      if (blockedPaths.some(p => path.startsWith(p))) return;

      if (document.getElementById('fahimo-widget-script') || document.querySelector('script[src*="fahimo-widget"]')) return;

      const bid = process.env.NEXT_PUBLIC_WIDGET_BUSINESS_ID || process.env.NEXT_PUBLIC_BUSINESS_ID || 'your-business-id';
      const scriptSrc = (process.env.NODE_ENV === 'production')
        ? 'https://fahimo-api.onrender.com/fahimo-widget.js'
        : (process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com') + '/fahimo-widget.js';

      const s = document.createElement('script');
      s.id = 'fahimo-widget-script';
      s.async = true;
      s.defer = true;
      s.src = scriptSrc;
      s.setAttribute('data-business-id', bid);
      s.crossOrigin = 'anonymous';
      s.onload = () => console.debug('Fahimo widget script loaded:', scriptSrc);
      s.onerror = () => console.error('Failed to load Fahimo widget from:', scriptSrc);
      document.body.appendChild(s);
    } catch (e) {
      console.error('WidgetLoader error', e);
    }
  }, []);

  return null;
}
