/**
 * Centralized configuration for API and environment settings
 * Production-ready with proper environment variable handling
 */

const normalizeApiBaseUrl = (value) => {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/\/+$/, '')
    // Some env files set NEXT_PUBLIC_API_URL to ".../api".
    // Normalize to the host base so we can safely append "/api" where needed.
    .replace(/\/api$/i, '');
};

// Get base API URL from environment with production default
const getBaseApiUrl = () => {
  // Production default (backend is on Render, frontend on Bluehost)
  const productionDefault = 'https://fahimo-api.onrender.com';

  // Check environment overrides first
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.REACT_APP_API_URL;

  // Runtime guard: prevent accidental localhost in production/static export.
  // (Next.js loads `.env.local` in all environments; a wrong local file can leak into builds.)
  try {
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname || '';
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
      const hasLocalApi = envUrl && /(^|\/\/)(localhost|127\.0\.0\.1|::1)(:|\/|$)/i.test(envUrl);
      if (!isLocalHost && hasLocalApi) return productionDefault;
    }
  } catch {
    // ignore
  }

  // If an environment variable is set, use it
  if (envUrl) return normalizeApiBaseUrl(envUrl);

  // Fallback to production default if no env var is set
  if (process.env.NODE_ENV === 'production') {
    return productionDefault;
  }

  // In development, prefer a relative API (same origin) unless an env URL is explicitly set.
  // This prevents dev builds from calling the production host unintentionally.
  if (envUrl) return normalizeApiBaseUrl(envUrl);

  // Use relative path in dev so requests go to the same origin (useful when running backend locally).
  return '';
};

export const API_CONFIG = {
  BASE_URL: getBaseApiUrl(),
  TIMEOUT: 30000, // 30 seconds
  // Append a build-time version to the widget URL to allow easy cache-busting
  // Set NEXT_PUBLIC_WIDGET_VERSION in CI/CD or use a commit SHA. Falls back to 'v1'.
  WIDGET_SCRIPT: `${getBaseApiUrl()}/fahimo-widget.js?v=${process.env.NEXT_PUBLIC_WIDGET_VERSION || process.env.NEXT_PUBLIC_COMMIT_SHA || 'v1'}`,
};

export const getApiUrl = endpoint => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Warn when using the production API host from a non-production host without explicit override
  try {
    if (typeof window !== 'undefined' && API_CONFIG.BASE_URL && API_CONFIG.BASE_URL.indexOf('fahimo-api.onrender.com') !== -1) {
      const pageHost = window.location && window.location.host ? window.location.host : '';
      const hasOverride = process.env.NEXT_PUBLIC_API_URL;
      if (pageHost && pageHost.indexOf('faheemly.com') === -1 && !hasOverride && process.env.NODE_ENV !== 'production') {
        console.warn('API_CONFIG: Using production API host from non-production page host. Consider setting NEXT_PUBLIC_API_URL to your staging/local API.');
      }
    }
  } catch (warningError) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('API_CONFIG: unable to verify host origin', warningError);
    }
  }
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

export const getApiEndpoint = (path) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_CONFIG.BASE_URL}/${cleanPath}`;
};

export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development';
};

export const WIDGET_CONFIG = {
  BUSINESS_ID: process.env.NEXT_PUBLIC_BUSINESS_ID || 'cmjbkfqmn00016wef957p6hjk',
};

export const APP_CONFIG = {
  NAME: 'فهملي',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@faheemly.com',
};
