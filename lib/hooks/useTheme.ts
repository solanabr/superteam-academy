// lib/hooks/useTheme.ts
'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme.store';
import { Theme } from '@/lib/types/theme';

/**
 * Hook to manage theme in components
 * 
 * @example
 * const { theme, setTheme, isDark, toggleTheme } = useTheme();
 */
export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  const systemDark = useThemeStore((state) => state.systemDark);
  const setTheme = useThemeStore((state) => state.setTheme);
  const setSystemDark = useThemeStore((state) => state.setSystemDark);
  const getEffectiveTheme = useThemeStore((state) => state.getEffectiveTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  useEffect(() => {
    // Detect system preference once on mount
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setSystemDark(prefersDark);

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setSystemDark]);

  useEffect(() => {
    applyTheme(getEffectiveTheme());
  }, [theme, systemDark, getEffectiveTheme]);

  return {
    theme,
    setTheme,
    isDark: getEffectiveTheme() === 'dark',
    toggleTheme,
    effectiveTheme: getEffectiveTheme(),
  };
}

function applyTheme(theme: 'light' | 'dark') {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}
