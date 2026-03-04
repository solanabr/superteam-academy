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
        'rounded-lg border border-gray-300 p-2',
        'bg-white text-blue-700 shadow-sm',
        'hover:-translate-y-0.5 hover:bg-blue-50 hover:border-blue-500 hover:shadow-[0_8px_16px_-12px_rgba(37,99,235,0.8)]',
        'dark:border-neon-cyan/45 dark:bg-terminal-surface dark:text-neon-cyan dark:hover:bg-terminal-surface/80',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 dark:focus-visible:ring-neon-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-terminal-bg',
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
