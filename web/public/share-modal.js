// Safe placeholder for share-modal used on static exports and older deployments.
// Some sites (or older cached versions) try to attach event listeners to
// share buttons that might not exist. This guard ensures the elements exist
// and provides no-op handlers so "addEventListener" on null errors are
// avoided across environments.

function addSharePlaceholders() {
	try {
		if (typeof document === 'undefined') return;
		const ids = ['share-modal', 'share-button', 'share-btn', 'share-trigger', 'share-modal-root'];
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
				if (root && typeof root.appendChild === 'function') root.appendChild(el);
			}
		});
	} catch (e) {
		// Fail silently in case DOM not available (e.g., some server-side contexts)
		try { console.warn('share-modal placeholder guard failed', e?.message || e); } catch (_) {}
	}
}

if (typeof document !== 'undefined' && document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', addSharePlaceholders);
} else if (typeof window !== 'undefined') {
	addSharePlaceholders();
}
