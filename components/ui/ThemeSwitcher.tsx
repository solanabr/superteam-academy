// components/ui/ThemeSwitcher.tsx
'use client';

import React from 'react';
import { useTheme } from '@/lib/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ThemeSwitcherProps {
  className?: string;
}

/**
 * Theme switcher component for toggling between light/dark modes
 * 
 * @component
 * @example
 * <ThemeSwitcher />
 */
export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center',
        'p-2 rounded-lg',
        'bg-gray-100 dark:bg-gray-800',
        'text-gray-900 dark:text-gray-100',
        'hover:bg-gray-200 dark:hover:bg-gray-700',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

ThemeSwitcher.displayName = 'ThemeSwitcher';
