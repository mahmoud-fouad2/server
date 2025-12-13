// Safe placeholder for share-modal used in client/public
(function () {
  try {
    const ids = ['share-modal', 'share-button', 'share-btn', 'share-trigger', 'share-modal-root'];
    // Provide safe placeholders if script expects these elements
    ids.forEach(id => {
      if (!document.getElementById(id)) {
        const el = document.createElement('div');
        el.id = id;
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
        document.body.appendChild(el);
      }
    });
  } catch (e) {
    // Ignore in case DOM is not available (e.g., native mobile runtime)
    // eslint-disable-next-line no-console
    console.warn('share-modal placeholder guard failed', e?.message || e);
  }
})();
