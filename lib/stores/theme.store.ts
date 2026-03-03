// lib/stores/theme.store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme } from '@/lib/types/theme';

interface ThemeStore {
  theme: Theme;
  systemDark: boolean;
  
  setTheme: (theme: Theme) => void;
  setSystemDark: (isDark: boolean) => void;
  getEffectiveTheme: () => 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      systemDark: false,

      setTheme: (theme) => set({ theme }),

      setSystemDark: (isDark) => set({ systemDark: isDark }),

      getEffectiveTheme: () => {
        const { theme, systemDark } = get();
        if (theme === 'system') {
          return systemDark ? 'dark' : 'light';
        }
        return theme;
      },

      toggleTheme: () => {
        const { theme, getEffectiveTheme } = get();
        const current = getEffectiveTheme();
        const next = current === 'light' ? 'dark' : 'light';
        set({ theme: next });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
