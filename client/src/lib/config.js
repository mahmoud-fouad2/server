/**
 * Centralized configuration for API and environment settings
 * Production-ready with proper environment variable handling
 */

// Get base API URL from environment with production default
const getBaseApiUrl = () => {
  // Production default (backend is on Render, frontend on Bluehost)
  const productionDefault = 'https://fahimo-api.onrender.com';

  // FORCE production URL in production build
  if (process.env.NODE_ENV === 'production') {
    return productionDefault;
  }

  // Check environment overrides first
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.REACT_APP_API_URL;

  // In development, prefer a relative API (same origin) unless an env URL is explicitly set.
  // This prevents dev builds from calling the production host unintentionally.
  if (envUrl) return envUrl;

  // Use relative path in dev so requests go to the same origin (useful when running backend locally).
  return '';
};

export const API_CONFIG = {
  BASE_URL: getBaseApiUrl(),
  TIMEOUT: 30000, // 30 seconds
  WIDGET_SCRIPT: `${getBaseApiUrl()}/fahimo-widget.js`,
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
  } catch (e) {}
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
  BUSINESS_ID: process.env.NEXT_PUBLIC_BUSINESS_ID || 'cmivd3c0z0003ulrrn7m1jtjf',
};

export const APP_CONFIG = {
  NAME: 'فهملي',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@faheemly.com',
};
