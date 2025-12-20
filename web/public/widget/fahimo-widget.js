// Lightweight noop proxy to avoid duplicate widget initialization in pages.
// The canonical widget is served from the API (`/fahimo-widget.js`).
// This file intentionally does nothing to avoid double-init or conflicting
// runtime code when developers include a local copy.
(function () {
  try {
    if (window.__FAHIMO_WIDGET_LOADED) return;
    window.__FAHIMO_WIDGET_LOADED = true;
    // no-op intentionally
    console.debug('Fahimo: client noop widget loaded (proxy)');
  } catch (e) {
    // Swallow to avoid causing page errors
    try {
      console.warn('Fahimo noop proxy init failed', e);
    } catch (ignored) {}
  }
})();
