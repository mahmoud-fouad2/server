// Safe placeholder for share-modal used in client/public
// Ensure DOM exists before creating placeholders. If DOM is not yet available,
// wait for DOMContentLoaded, otherwise run immediately.
function addSharePlaceholders() {
  try {
    if (typeof document === 'undefined') return;
    const ids = ['share-modal', 'share-button', 'share-btn', 'share-trigger', 'share-modal-root'];
    // Provide safe placeholders if script expects these elements
    ids.forEach(id => {
      if (!document.getElementById(id)) {
        const el = id.includes('button') || id.includes('btn') ? document.createElement('button') : document.createElement('div');
        el.id = id;
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
        // Add a safe no-op listener so scripts that call addEventListener won't crash
        if (el && typeof el.addEventListener === 'function') {
          el.addEventListener('click', () => {});
        }
        const root = document.body || document.documentElement;
        if (root && typeof root.appendChild === 'function') {
          root.appendChild(el);
        }
      }
    });
  } catch (e) {
    // Ignore in case DOM is not available (e.g., native mobile runtime)
    // eslint-disable-next-line no-console
    console.warn('share-modal placeholder guard failed', e?.message || e);
  }
}

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addSharePlaceholders);
} else if (typeof window !== 'undefined') {
  // DOM already ready
  addSharePlaceholders();
}

