"use client";

import { useEffect } from 'react';
import { API_CONFIG } from '@/lib/config';

// Seeded Faheemly business that powers the public demo (see api/src/scripts/seed.ts)
// Use environment variable for demo business ID, fallback to the known seeded ID
const FAHEEMLY_DEMO_BUSINESS_ID = process.env.NEXT_PUBLIC_DEMO_BUSINESS_ID || 'cmjx5hz7a000br594zctuurus';
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
        // Allow faheemly.com to use the demo business ID
        if (host && host.includes('faheemly.com')) {
          // On the faheemly.com site, default to the demo Faheemly business so the embed works without extra setup
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

      // PRODUCTION ONLY: Load external widget, no local fallback
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
        // PRODUCTION ONLY: Always use production API URL
        try {
          const explicitApi = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

          if (explicitApi && explicitApi.indexOf('localhost') === -1) {
            s.setAttribute('data-api-url', explicitApi);
          } else {
            // Production default - never use localhost
            s.setAttribute('data-api-url', 'https://fahimo-api.onrender.com');
          }
        } catch (e) {}

        s.crossOrigin = 'anonymous';
        s.onload = () => console.debug('Fahimo widget script loaded:', src);
        s.onerror = () => console.error('Failed to load Fahimo widget from:', src);
        document.body.appendChild(s);
      }

      // PRODUCTION: Load external widget
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
