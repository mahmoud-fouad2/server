// Minimal service worker to prevent noisy "Failed to fetch" errors during development.
// The SW simply tries to forward requests to the network and returns a lightweight
// 504 response when the network is unavailable.

self.addEventListener('install', () => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Try the network and fallback to a simple 504 response so the runtime doesn't
  // throw unhandled promise rejections when fetches fail (dev server down, CORS, etc.)
  event.respondWith(
    fetch(event.request).catch(
      () => new Response('', { status: 504, statusText: 'offline' })
    )
  );
});
