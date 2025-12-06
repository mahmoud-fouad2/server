import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// API Configuration
export const API_URL = 'https://fahimo-api.onrender.com';
