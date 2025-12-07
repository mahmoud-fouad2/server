// Runtime fetch proxy
// Rewrites browser requests to relative `/api/*` to the configured API host
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://fahimo-api.onrender.com';

if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input, init) {
    try {
      let url = input;

      // If input is a Request, extract its URL
      if (input && input instanceof Request) {
        url = input.url;
      }

      // Only rewrite same-origin or relative /api calls
      if (typeof url === 'string') {
        // relative path starting with /api/
        if (url.startsWith('/api/')) {
          url = `${API_BASE}${url}`;
        } else if (url.startsWith(window.location.origin + '/api/')) {
          // full URL pointing to the frontend origin
          const rel = url.substring(window.location.origin.length);
          url = `${API_BASE}${rel}`;
        }
      }

      // If original input was a Request and we changed the URL, create a new Request preserving options
      if (input && input instanceof Request) {
        const newReq = new Request(url, {
          method: input.method,
          headers: input.headers,
          body: input.body,
          mode: input.mode,
          credentials: input.credentials,
          cache: input.cache,
          redirect: input.redirect,
          referrer: input.referrer,
          referrerPolicy: input.referrerPolicy,
          integrity: input.integrity,
        });
        return originalFetch(newReq, init);
      }

      return originalFetch(url, init);
    } catch (err) {
      // Fallback to original fetch on unexpected errors
      return originalFetch(input, init);
    }
  };
}

export default null;
