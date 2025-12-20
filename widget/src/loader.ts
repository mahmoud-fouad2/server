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

  function loadWidget(variant: 'standard' | 'enhanced', config: any, apiUrl: string, businessId: string) {
    console.log(`[Fahimo] Loading ${variant} widget for ${businessId}`);
    
    window.__FAHIMO_CONFIG = config;
    window.__FAHIMO_API_URL = apiUrl;
    window.__FAHIMO_BUSINESS_ID = businessId;

    // Create Root
    const container = document.createElement('div');
    container.id = 'fahimo-widget-root';
    document.body.appendChild(container);

    // Render Preact App
    render(h(App, { config: config.widgetConfig, variant, businessId }), container);
  }
})();

