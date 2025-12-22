import { useState, useEffect } from 'react';

export function setTheme(isDark) {
  try {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('useTheme: failed to persist theme preference', error);
    }
  }
}

export function useTheme(defaultPref = false) {
  const [isDark, setIsDark] = useState(defaultPref);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem('theme');
      if (t === 'dark') {
        setIsDark(true);
      } else {
        // Default to light mode regardless of system preference
        setIsDark(false);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('useTheme: failed to read persisted theme', error);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      setTheme(isDark);
    }
  }, [isDark, mounted]);

  return [isDark, setIsDark];
}

export default useTheme;
