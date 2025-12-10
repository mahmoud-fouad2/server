"use client";

import { useEffect } from 'react';

export default function WidgetLoader() {
  useEffect(() => {
    try {
      // Widget is disabled by default. Only enable when NEXT_PUBLIC_ENABLE_WIDGET=true
      const enabled = process.env.NEXT_PUBLIC_ENABLE_WIDGET === 'true';
      if (!enabled) {
        // Keep widget off unless explicitly enabled in environment
        console.debug('WidgetLoader: widget disabled by default. Set NEXT_PUBLIC_ENABLE_WIDGET=true to enable.');
        return;
      }

      const path = typeof window !== 'undefined' ? window.location.pathname : '/';
      // Prevent loading widget on the wizard and other admin pages
      const blockedPaths = ['/wizard', '/admin', '/dashboard', '/register', '/login'];
      if (blockedPaths.some(p => path.startsWith(p))) return;

      if (document.getElementById('fahimo-widget-script') || document.querySelector('script[src*="fahimo-widget"]')) return;

      const bid = process.env.NEXT_PUBLIC_WIDGET_BUSINESS_ID || process.env.NEXT_PUBLIC_BUSINESS_ID || 'your-business-id';

      // Prefer a same-origin widget file if present (avoids remote-hosted mismatches/caching issues).
      const localCandidate = `${window.location.origin}/fahimo-widget.js`;
      // Only allow falling back to the external host when explicitly enabled.
      const allowExternal = process.env.NEXT_PUBLIC_ALLOW_EXTERNAL_WIDGET === 'true';
      const externalCandidate = allowExternal
        ? ((process.env.NODE_ENV === 'production')
            ? 'https://fahimo-api.onrender.com/fahimo-widget.js'
            : (process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com') + '/fahimo-widget.js')
        : null;

      async function pickAndLoad() {
        const candidates = externalCandidate ? [localCandidate, externalCandidate] : [localCandidate];

        for (const src of candidates) {
          try {
            // If the page is opened from the filesystem, do not attempt to load
            if (window.location.protocol === 'file:') {
              console.warn('WidgetLoader: running from file:// — skipping widget load for safety', src);
              continue;
            }

            // Try a HEAD request for same-origin candidates to validate availability and content-type.
            let isSameOrigin = false;
            try { isSameOrigin = new URL(src).origin === window.location.origin; } catch (e) { isSameOrigin = false; }

            if (isSameOrigin) {
              const head = await fetch(src, { method: 'HEAD' });
              if (!head.ok) {
                console.warn('WidgetLoader: candidate HEAD not OK, skipping', src, head.status);
                continue;
              }
              const ct = head.headers.get('content-type') || '';
              if (!ct.toLowerCase().includes('javascript')) {
                // Not a JS file — skip to next candidate
                console.warn('WidgetLoader: candidate not JS, skipping', src, ct);
                continue;
              }
            }

            // Append the script tag (script tags bypass CORS and will load regardless)
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
            return;
          } catch (err) {
            // HEAD may fail due to CORS for remote origins — fallback to next candidate
            console.warn('WidgetLoader: candidate check failed, trying next', src, err);
            continue;
          }
        }

        console.error('WidgetLoader: no valid fahimo-widget.js candidate found. Widget not loaded.');
      }

      pickAndLoad();
    } catch (e) {
      console.error('WidgetLoader error', e);
    }
  }, []);

  return null;
}
