// components/providers/ThemeProvider.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages theme initialization and hydration
 * Wraps the entire application to ensure theme is applied before render
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

ThemeProvider.displayName = 'ThemeProvider';
