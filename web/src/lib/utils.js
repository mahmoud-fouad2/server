import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// API Configuration - use centralized config
import { API_CONFIG } from './config';
export const API_URL = API_CONFIG.BASE_URL;
