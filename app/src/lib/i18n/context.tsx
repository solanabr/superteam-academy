'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type Locale, t as translate } from './translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'pt-BR',
  setLocale: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('stacademy_locale') as Locale) || 'pt-BR';
    }
    return 'pt-BR';
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stacademy_locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback((key: string) => translate(locale, key), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const locales: { code: Locale; label: string; flag: string }[] = [
    { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="flex items-center gap-1">
      {locales.map(({ code, flag }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            locale === code
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title={code}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}
