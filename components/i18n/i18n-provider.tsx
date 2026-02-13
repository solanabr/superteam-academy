'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLocale, dictionaries } from '@/lib/i18n/messages';
import { Locale } from '@/lib/types';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dictionary: (typeof dictionaries)[Locale];
}

const STORAGE_KEY = 'superteam.locale';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'pt-BR' || stored === 'es' || stored === 'en') {
        setLocale(stored);
      }
    } catch {
      // Ignore storage read failures and keep default locale.
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale: Locale) => {
        setLocale(nextLocale);
        try {
          window.localStorage.setItem(STORAGE_KEY, nextLocale);
        } catch {
          // Ignore storage write failures and keep in-memory locale only.
        }
      },
      dictionary: dictionaries[locale]
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider');
  }

  return context;
}
