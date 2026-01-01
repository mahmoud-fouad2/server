"use client";

import { useEffect } from 'react';
import { API_CONFIG } from '@/lib/config';

// Seeded Faheemly business that powers the public demo (see api/src/scripts/seed.ts)
// Use environment variable for demo business ID, fallback to the known seeded ID
const FAHEEMLY_DEMO_BUSINESS_ID = process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID || 'cmir2oyaz00013ltwis4xc4tp';
const WIDGET_BUILD_VERSION = getWidgetBuildVersion();

function getWidgetBuildVersion() {
  return (
    process.env.NEXT_PUBLIC_WIDGET_BUILD_ID ||
    process.env.NEXT_PUBLIC_WIDGET_VERSION ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_GIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.BUILD_ID ||
    ''
  );
}

function normalizeApiBaseUrl(value) {
  if (!value) return value;
  // Trim trailing slashes and a trailing `/api` segment if present.
  // The widget itself always calls `${apiBase}/api/...`.
  return String(value)
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');
}

export default function WidgetLoader() {
  useEffect(() => {
    try {
      if (WIDGET_BUILD_VERSION) {
        window.__FAHIMO_WIDGET_VERSION = WIDGET_BUILD_VERSION;
      }
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
      // Priority order for choosing a business id:
      // 1) Build-time env var (NEXT_PUBLIC_WIDGET_BUSINESS_ID / NEXT_PUBLIC_BUSINESS_ID)
      // 2) Runtime override: `window.__FAHIMO_BUSINESS_ID` or a meta tag <meta name="fahimo-business-id" content="..." />
      // 3) Fallback to demo on faheemly.com (for the public site)
      const bidEnv = process.env.NEXT_PUBLIC_WIDGET_BUSINESS_ID || process.env.NEXT_PUBLIC_BUSINESS_ID;
      const bidRuntime = typeof window !== 'undefined' ? (window.__FAHIMO_BUSINESS_ID || document?.querySelector('meta[name="fahimo-business-id"]')?.getAttribute('content')) : undefined;
      let bid = bidEnv || bidRuntime;
      if (bidRuntime && !bidEnv) {
        console.info('[Fahimo] Using runtime business ID override via window.__FAHIMO_BUSINESS_ID or meta tag');
      }

      if (!bid) {
        const host = typeof window !== 'undefined' && window.location ? window.location.hostname : '';
        // Allow localhost to use the demo business ID for testing purposes
        if ((host && host.includes('faheemly.com')) || host === 'localhost' || host === '127.0.0.1') {
          // On the faheemly.com site (or localhost), default to the demo Faheemly business so the embed works without extra setup
          bid = FAHEEMLY_DEMO_BUSINESS_ID;
          console.info('[Fahimo] No env business ID found; defaulting to Faheemly demo business');
        } else {
          console.warn('No business ID configured for widget. Set NEXT_PUBLIC_WIDGET_BUSINESS_ID or NEXT_PUBLIC_BUSINESS_ID or place a runtime override via window.__FAHIMO_BUSINESS_ID or <meta name="fahimo-business-id">.');
          return;
        }
      }
      // Skip loading if this business already has a widget present (prevents duplicates per business)
      if (document.getElementById(`fahimo-widget-script-${bid}`) || document.querySelector(`script[src*="fahimo-widget"][data-business-id="${bid}"]`) || document.querySelector(`#fahimo-widget-container[data-business-id="${bid}"]`)) return;

      // Prefer Render-hosted widget (same backend) to avoid broken static hosting on faheemly.com
      const externalWidget = process.env.NEXT_PUBLIC_WIDGET_URL || API_CONFIG.WIDGET_SCRIPT || 'https://fahimo-api.onrender.com/fahimo-widget.js';
      const widgetSrc = appendCacheBust(externalWidget);

      // Load only the production/external widget by default. Local fallbacks are
      // disabled to prevent accidental loading from localhost in production.
      // To allow a local fallback for development, set NEXT_PUBLIC_ALLOW_LOCAL_WIDGET=true.
      function loadScript(src) {
        const s = document.createElement('script');
        s.id = `fahimo-widget-script-${bid}`;
        s.async = true;
        s.defer = true;
        s.src = src;
        s.setAttribute('data-business-id', bid);
        if (WIDGET_BUILD_VERSION) {
          s.setAttribute('data-widget-version', WIDGET_BUILD_VERSION);
        }
        // Only set explicit data-api-url in safe cases:
        // 1) If NEXT_PUBLIC_API_URL is provided at build-time (explicit override)
        // 2) If running on localhost and NEXT_PUBLIC_ALLOW_LOCAL_WIDGET=true (local dev only)
        try {
          const explicitApi = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
          const allowLocal = process.env.NEXT_PUBLIC_ALLOW_LOCAL_WIDGET === 'true';
          const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

          if (explicitApi && explicitApi.indexOf('localhost') === -1) {
            s.setAttribute('data-api-url', explicitApi);
          } else if ((hostname === 'localhost' || hostname === '127.0.0.1') && allowLocal) {
            s.setAttribute('data-api-url', window.location.origin);
          } else {
            // Force production URL if explicitApi is missing or is localhost in a non-local context
            // This ensures we never accidentally inject localhost into the widget config
            if (process.env.NODE_ENV === 'production') {
               // Do not set data-api-url, let the widget use its default (https://fahimo-api.onrender.com)
               // Explicitly set it to the production API to be safe
               s.setAttribute('data-api-url', 'https://fahimo-api.onrender.com');
            }
            
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
      loadScript(widgetSrc);
    } catch (e) {
      console.error('WidgetLoader error', e);
    }
  }, []);

  return null;
}

function appendCacheBust(url) {
  if (!WIDGET_BUILD_VERSION) return url;
  const [base, hash = ''] = url.split('#');
  const separator = base.includes('?') ? '&' : '?';
  const busted = `${base}${separator}v=${encodeURIComponent(WIDGET_BUILD_VERSION)}`;
  return hash ? `${busted}#${hash}` : busted;
}
