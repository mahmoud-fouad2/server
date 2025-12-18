"use client";

import { useEffect } from 'react';
import { API_CONFIG } from '@/lib/config';

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

      // If a widget script or already-rendered widget container exists for this business, avoid injecting another
      const bid = process.env.NEXT_PUBLIC_WIDGET_BUSINESS_ID || process.env.NEXT_PUBLIC_BUSINESS_ID || 'cmjbp7ew000016xf96ail1m8w';
      if (document.getElementById('fahimo-widget-script') || document.querySelector('script[src*="fahimo-widget"]') || document.querySelector(`#fahimo-widget-container[data-business-id="${bid}"]`)) return;

      // Prefer Render-hosted widget (same backend) to avoid broken static hosting on faheemly.com
      const externalWidget = process.env.NEXT_PUBLIC_WIDGET_URL || API_CONFIG.WIDGET_SCRIPT || 'https://fahimo-api.onrender.com/fahimo-widget.js';

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
        // Only set explicit data-api-url in safe cases:
        // 1) If NEXT_PUBLIC_API_URL is provided at build-time (explicit override)
        // 2) If running on localhost and NEXT_PUBLIC_ALLOW_LOCAL_WIDGET=true (local dev only)
        try {
          const explicitApi = process.env.NEXT_PUBLIC_API_URL;
          const allowLocal = process.env.NEXT_PUBLIC_ALLOW_LOCAL_WIDGET === 'true';
          const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

          if (explicitApi) {
            s.setAttribute('data-api-url', explicitApi);
          } else if ((hostname === 'localhost' || hostname === '127.0.0.1') && allowLocal) {
            s.setAttribute('data-api-url', window.location.origin);
          } else {
            // Avoid setting a default local API URL that could cause CSP violations when the widget
            // is embedded on remote sites (e.g., faheemly.com). In production, recommend configuring
            // NEXT_PUBLIC_API_URL to the correct API host.
            if (process.env.NODE_ENV === 'production' && !explicitApi) {
              console.warn('WidgetLoader: NEXT_PUBLIC_API_URL not set in production; widget will use script origin or default. Set NEXT_PUBLIC_API_URL to your API host to prevent CSP/localhost calls.');
            }
          }
        } catch (e) {}

        s.crossOrigin = 'anonymous';
        s.onload = () => console.debug('Fahimo widget script loaded:', src);
        s.onerror = () => console.error('Failed to load Fahimo widget from:', src);
        document.body.appendChild(s);
      }

      // Always attempt to load the external (production) widget first.
      // Attempt external widget only (no local/localhost fallback in production)
      // Warn developers if the default external widget points to production while the page origin is clearly not production.
      try {
        const isProdWidget = externalWidget && externalWidget.indexOf('fahimo-api.onrender.com') !== -1;
        const pageHost = typeof window !== 'undefined' ? window.location.host : '';
        if (isProdWidget && pageHost && pageHost.indexOf('faheemly.com') === -1 && !process.env.NEXT_PUBLIC_API_URL) {
          console.warn('WidgetLoader: loading production widget script without NEXT_PUBLIC_API_URL set. This may cause the widget to call the production API and return 404/400 on non-production sites.');
        }
      } catch (e) {}
      loadScript(externalWidget);
    } catch (e) {
      console.error('WidgetLoader error', e);
    }
  }, []);

  return null;
}
