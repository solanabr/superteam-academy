// lib/store/user.ts

/**
 * USER STORE
 * 
 * Global state management using Zustand
 * Stores user profile, authentication status, and preferences
 */

import { create } from 'zustand';
import { User, Locale } from '@/lib/types/domain';

interface UserStore {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;
  locale: Locale;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLocale: (locale: Locale) => void;
  reset: () => void;
  
  // Computed
  isAuthenticated: () => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  // Initial state
  user: null,
  isLoading: false,
  error: null,
  locale: 'en',
  
  // Actions
  setUser: (user) => set({ user, error: null }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  setLocale: (locale) => set({ locale }),
  
  reset: () => set({
    user: null,
    isLoading: false,
    error: null,
  }),
  
  // Computed
  isAuthenticated: () => get().user !== null,
}));

/**
 * Hook to get user data
 */
export function useUser() {
  const user = useUserStore((state) => state.user);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated());
  
  return { user, isLoading, error, isAuthenticated };
}

/**
 * Hook to get user actions
 */
export function useUserActions() {
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);
  const setError = useUserStore((state) => state.setError);
  const reset = useUserStore((state) => state.reset);
  
  return { setUser, setLoading, setError, reset };
}

/**
 * Hook to get locale
 */
export function useLocale() {
  const locale = useUserStore((state) => state.locale);
  const setLocale = useUserStore((state) => state.setLocale);
  
  return { locale, setLocale };
}
