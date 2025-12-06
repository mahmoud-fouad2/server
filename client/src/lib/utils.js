import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// API Configuration
// Prefer runtime env `NEXT_PUBLIC_API_URL`; default to the deployed faheemly domain
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://faheemly.com';
