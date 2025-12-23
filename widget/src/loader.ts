import { render, h } from 'preact';
import App from './App';

export {};

declare global {
  interface Window {
    __FAHIMO_WIDGET_LOADER: any;
    __FAHIMO_CONFIG: any;
    __FAHIMO_API_URL: string;
    __FAHIMO_BUSINESS_ID: string;
  }
}

(function() {
  // Fahimo Unified Loader
  if (window.__FAHIMO_WIDGET_LOADER) return;
  window.__FAHIMO_WIDGET_LOADER = { initialized: true };

  const scriptTag = document.currentScript as HTMLScriptElement;
  const businessId = scriptTag?.getAttribute('data-business-id');

  if (!businessId) {
    console.error('[Fahimo] Business ID is missing.');
    return;
  }

  // Determine Asset Base URL (where this script is loaded from)
  let assetBaseUrl = 'https://faheemly.com'; // Default fallback
  if (scriptTag.src) {
    try {
      const url = new URL(scriptTag.src);
      assetBaseUrl = url.origin;
    } catch (e) {
      console.warn('[Fahimo] Could not determine asset base URL from script src');
    }
  }

  // Determine API URL
  // Default to assetBaseUrl (where the script is served from) which is usually the API server
  let apiUrl = assetBaseUrl;
  const dataApi = scriptTag.getAttribute('data-api-url');
  if (dataApi) apiUrl = dataApi;

  // SPA Navigation Handler
  let currentRoot: HTMLElement | null = null;

  function getConfigUrl() {
    return `${apiUrl.replace(/\/+$/, '').replace(/\/api$/i, '')}/api/widget/config/${businessId}`;
  }

  function ensureRoot() {
    if (currentRoot && document.body.contains(currentRoot)) return currentRoot;
    const existing = document.getElementById('fahimo-widget-root') as HTMLElement | null;
    if (existing) {
      currentRoot = existing;
      return existing;
    }
    const container = document.createElement('div');
    container.id = 'fahimo-widget-root';
    document.body.appendChild(container);
    currentRoot = container;
    return container;
  }

  function renderWidget(publicConfig: any) {
    const container = ensureRoot();

    window.__FAHIMO_CONFIG = publicConfig;
    window.__FAHIMO_API_URL = apiUrl;
    window.__FAHIMO_BUSINESS_ID = businessId;

    render(
      h(App, {
        config: {
          businessId: businessId,
          ...publicConfig?.widgetConfig,
        },
        businessId,
        assetBaseUrl,
        apiBaseUrl: apiUrl,
        // Extra props are safe in Preact; App may ignore them if not declared.
        businessName: publicConfig?.name,
        preChatFormEnabled: publicConfig?.preChatFormEnabled,
        isDemo: publicConfig?.isDemo,
      } as any),
      container
    );
  }

  async function fetchAndRender() {
    try {
      const res = await fetch(getConfigUrl(), { cache: 'no-store' as any });
      const config = await res.json();
      if (!config || !config.widgetConfig) throw new Error('Invalid config');
      renderWidget(config);
      trackVisitor(config); // Track visit after config loads
    } catch (err) {
      console.warn('[Fahimo] Failed to load widget config, falling back to minimal config:', err);
      // Fallback: render a minimal, non-demo widget so the business still shows
      renderWidget({ name: 'Business', widgetConfig: {}, widgetVariant: 'STANDARD', configVersion: Date.now(), isDemo: false });
      // Do not attempt visitor tracking when fallback is in use
    }
  }

  async function trackVisitor(publicConfig?: any) {
    try {
      if (publicConfig?.isDemo) {
        console.warn('[Fahimo] Demo widget config detected; skipping visitor tracking.');
        return;
      }
      // 1. Get/Create Fingerprint
      let fingerprint = localStorage.getItem(`fahimo-fp-${businessId}`);
      if (!fingerprint) {
        fingerprint = 'v_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(`fahimo-fp-${businessId}`, fingerprint);
      }

      // 2. Create Session
      const sessionRes = await fetch(`${apiUrl}/api/visitor/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          fingerprint,
          // Simple client-side detection
          device: /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          browser: navigator.userAgent, 
          os: navigator.platform
        })
      });
      
      if (!sessionRes.ok) {
        let errorPayload: any = null;
        try {
          errorPayload = await sessionRes.json();
        } catch (err) {
          // ignore parse errors
        }
        const reason = errorPayload?.error || errorPayload?.message || 'unknown error';
        console.warn(`[Fahimo] Failed to create visitor session (${sessionRes.status}): ${reason}`);
        return;
      }
      const session = await sessionRes.json();

      // 3. Track Page View
      await fetch(`${apiUrl}/api/visitor/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          url: window.location.href,
          title: document.title,
          referrer: document.referrer || undefined,
          origin: window.location.hostname,
        })
      });

    } catch (e) {
      // Silent fail for analytics
    }
  }

  function init() {
    // Fetch config and (re)render.
    fetchAndRender().catch(err => {
      console.error('[Fahimo] Failed to load widget config:', err);
    });
  }

  // Initial load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init);
  }

  // Watch for SPA page changes (DOM mutations)
  const observer = new MutationObserver((mutations) => {
    if (!document.body.contains(currentRoot)) {
      // Widget was removed (e.g. by SPA router clearing body), re-mount
      init();
    }
  });

  observer.observe(document.body, { childList: true, subtree: false });

  // Listen for dashboard-driven config updates (same-origin dashboards can broadcast).
  try {
    const channelName = `fahimo-config-update-${businessId}`;
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(channelName);
      bc.onmessage = () => {
        fetchAndRender().catch(() => {});
      };
    }

    // Fallback for browsers without BroadcastChannel support
    const storageKey = `fahimo-config-update-${businessId}-notify`;
    window.addEventListener('storage', (e) => {
      if (e && e.key === storageKey) {
        fetchAndRender().catch(() => {});
      }
    });
  } catch (e) {
    // ignore
  }

})();

