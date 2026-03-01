'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Locale } from '@/types';
import en from './en.json';
import pt from './pt.json';
import es from './es.json';

const messages: Record<Locale, typeof en> = { en, pt, es };

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K) : never }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<typeof en>;

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locale') as Locale;
      if (saved && messages[saved]) return saved;
    }
    return 'en';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem('locale', l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const parts = key.split('.');
      let val: any = messages[locale];
      for (const p of parts) {
        val = val?.[p];
        if (val === undefined) return key;
      }
      return typeof val === 'string' ? val : key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
