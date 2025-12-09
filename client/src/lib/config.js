/**
 * Centralized configuration for API and environment settings
 * Production-ready with proper environment variable handling
 */

// Get base API URL from environment with production default
const getBaseApiUrl = () => {
  // Check all possible env variable names
  const envUrl = 
    process.env.NEXT_PUBLIC_API_URL || 
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.REACT_APP_API_URL;

  // Production default (backend is on Render, frontend on Bluehost)
  const productionDefault = 'https://fahimo-api.onrender.com';
  
  return envUrl || productionDefault;
};

export const API_CONFIG = {
  BASE_URL: getBaseApiUrl(),
  TIMEOUT: 30000, // 30 seconds
  WIDGET_SCRIPT: `${getBaseApiUrl()}/fahimo-widget.js`,
};

export const getApiUrl = endpoint => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
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
