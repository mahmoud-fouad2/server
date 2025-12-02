// Lightweight loader for /widget/fahimo-widget.js — proxies to the root widget file
// This ensures both /fahimo-widget.js and /widget/fahimo-widget.js work.

(function() {
  try {
    if (document.getElementById('fahimo-widget-container')) return; // already initialized

    // Find the script that loaded THIS file (the loader) to get the business ID
    const myScript = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
    
    const businessId = myScript.getAttribute('data-business-id');

    // If the root script is available, load it instead of duplicating
    const existingScript = Array.from(document.scripts).find(s => s.src && s.src.endsWith('/fahimo-widget.js') && !s.src.includes('/widget/'));
    if (existingScript) {
      return;
    }

    const loader = document.createElement('script');
    // Use absolute URL to ensure it loads from the server
    loader.src = 'http://localhost:3001/fahimo-widget.js';
    loader.async = true;
    
    // Pass the business ID to the new script tag so the main widget can find it
    if (businessId) {
        loader.setAttribute('data-business-id', businessId);
    }

    loader.onload = () => console.debug('Fahimo widget loader: root widget script loaded');
    loader.onerror = () => console.warn('Fahimo widget loader: failed to load /fahimo-widget.js');
    document.head.appendChild(loader);
  } catch (e) {
    console.warn('Fahimo widget loader error', e);
  }
})();
