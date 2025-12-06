/**
 * Centralized configuration for API and environment settings
 */

export const API_CONFIG = {
  BASE_URL:
    process.env.NEXT_PUBLIC_API_URL || 'https://faheemly.com',
  TIMEOUT: 30000, // 30 seconds
};

export const getApiUrl = endpoint => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

export const APP_CONFIG = {
  NAME: 'فهملي',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@faheemly.com',
};
