// lib/types/theme.ts

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  current: Theme;
  systemPreference: 'light' | 'dark';
  isDark: boolean;
}

export const THEME_COLORS = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    card: '#f5f5f5',
    border: '#e0e0e0',
    primary: '#9945FF',
    accent: '#00F0FF',
  },
  dark: {
    background: '#0a0e27',
    foreground: '#ffffff',
    card: '#1a1f3a',
    border: '#2d3748',
    primary: '#9945FF',
    accent: '#00F0FF',
  },
};
