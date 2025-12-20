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

  // SPA Navigation Handler
  let currentRoot: HTMLElement | null = null;

  function init() {
    // Check if already mounted
    if (document.getElementById('fahimo-widget-root')) return;

    // Fetch Config
    fetch(`${apiUrl}/api/widget/config/${businessId}`)
      .then(res => res.json())
      .then(config => {
        if (!config || !config.widgetConfig) {
          throw new Error('Invalid config');
        }
        loadWidget(config.widgetVariant, config, apiUrl, businessId);
      })
      .catch(err => {
        console.error('[Fahimo] Failed to load widget config:', err);
      });
  }

  function loadWidget(variant: 'standard' | 'enhanced', config: any, apiUrl: string, businessId: string) {
    console.log(`[Fahimo] Loading ${variant} widget for ${businessId}`);
    
    window.__FAHIMO_CONFIG = config;
    window.__FAHIMO_API_URL = apiUrl;
    window.__FAHIMO_BUSINESS_ID = businessId;

    // Create Root
    const container = document.createElement('div');
    container.id = 'fahimo-widget-root';
    document.body.appendChild(container);
    currentRoot = container;

    // Render Preact App
    render(h(App, { config: config.widgetConfig, variant, businessId }), container);
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

})();

