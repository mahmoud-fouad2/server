import { render, h } from 'preact';
import { App } from './App';

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

  // Determine API URL
  let apiUrl = 'https://fahimo-api.onrender.com';
  const dataApi = scriptTag.getAttribute('data-api-url');
  if (dataApi) apiUrl = dataApi;

  // Determine Asset Base URL (where this script is loaded from)
  let assetBaseUrl = 'https://fahimo.com'; // Default fallback
  if (scriptTag.src) {
    try {
      const url = new URL(scriptTag.src);
      assetBaseUrl = url.origin;
    } catch (e) {
      console.warn('[Fahimo] Could not determine asset base URL from script src');
    }
  }

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

    const variant: 'standard' | 'enhanced' = (String(publicConfig?.widgetVariant || 'STANDARD').toLowerCase() === 'enhanced')
      ? 'enhanced'
      : 'standard';

    render(
      h(App, {
        // Keep backwards-compat: App expects `config` to be the widgetConfig object.
        config: publicConfig?.widgetConfig || {},
        variant,
        businessId,
        assetBaseUrl,
        // Extra props are safe in Preact; App may ignore them if not declared.
        businessName: publicConfig?.name,
        preChatFormEnabled: publicConfig?.preChatFormEnabled,
      } as any),
      container
    );
  }

  async function fetchAndRender() {
    const res = await fetch(getConfigUrl(), { cache: 'no-store' as any });
    const config = await res.json();
    if (!config || !config.widgetConfig) throw new Error('Invalid config');
    renderWidget(config);
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

