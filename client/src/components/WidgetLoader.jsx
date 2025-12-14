"use client";

import { useEffect } from 'react';

export default function WidgetLoader() {
  useEffect(() => {
    try {
      // Widget is now enabled by default (unified single file)
      const enabled = process.env.NEXT_PUBLIC_ENABLE_WIDGET !== 'false'; // Default true
      if (!enabled) {
        console.debug('WidgetLoader: widget disabled via NEXT_PUBLIC_ENABLE_WIDGET=false');
        return;
      }

      const path = typeof window !== 'undefined' ? window.location.pathname : '/';
      // Prevent loading widget on wizard and other admin pages
      const blockedPaths = ['/wizard', '/admin', '/dashboard', '/register', '/login'];
      if (blockedPaths.some(p => path.startsWith(p))) return;

      if (document.getElementById('fahimo-widget-script') || document.querySelector('script[src*="fahimo-widget"]')) return;

      const bid = process.env.NEXT_PUBLIC_WIDGET_BUSINESS_ID || process.env.NEXT_PUBLIC_BUSINESS_ID || 'cmivd3c0z0003ulrrn7m1jtjf';

      // Prefer Render-hosted widget (same backend) to avoid broken static hosting on faheemly.com
      const externalWidget = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://fahimo-api.onrender.com/fahimo-widget.js';

      // Load only the production/external widget by default. Local fallbacks are
      // disabled to prevent accidental loading from localhost in production.
      // To allow a local fallback for development, set NEXT_PUBLIC_ALLOW_LOCAL_WIDGET=true.
      function loadScript(src) {
        const s = document.createElement('script');
        s.id = 'fahimo-widget-script';
        s.async = true;
        s.defer = true;
        s.src = src;
        s.setAttribute('data-business-id', bid);
        s.crossOrigin = 'anonymous';
        s.onload = () => console.debug('Fahimo widget script loaded:', src);
        s.onerror = () => console.error('Failed to load Fahimo widget from:', src);
        document.body.appendChild(s);
      }

      // Always attempt to load the external (production) widget first.
        // Attempt external widget only (no local/localhost fallback in production)
        loadScript(externalWidget);
    } catch (e) {
      console.error('WidgetLoader error', e);
    }
  }, []);

  return null;
}
