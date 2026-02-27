'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { en, ptBr, es, type Translations, type Locale } from '@/locales';

const LOCALE_STORAGE_KEY = 'locale';
const LOCALE_CHANGE_EVENT = 'capsolbuild:locale-change';

const translations: Record<Locale, Translations> = {
  en,
  'pt-br': ptBr,
  es,
};

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<Translations>;

function getNestedValue(obj: Translations, path: string): string {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if translation not found
    }
  }

  return typeof result === 'string' ? result : path;
}

function formatMissingKey(path: string): string {
  const lastSegment = path.split('.').pop() ?? path;
  const withSpaces = lastSegment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  if (!withSpaces) {
    return path;
  }

  return withSpaces
    .split(' ')
    .map((word) => {
      if (word.toUpperCase() === 'XP') {
        return 'XP';
      }
      if (word.length <= 2) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get stored locale or detect from browser
    const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (storedLocale && translations[storedLocale]) {
      setLocaleState(storedLocale);
      document.documentElement.lang = storedLocale;
      return;
    }

    // Detect from browser
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('pt')) {
      setLocaleState('pt-br');
      document.documentElement.lang = 'pt-br';
    } else if (browserLang.startsWith('es')) {
      setLocaleState('es');
      document.documentElement.lang = 'es';
    } else {
      setLocaleState('en');
      document.documentElement.lang = 'en';
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocaleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: Locale }>;
      const incomingLocale = customEvent.detail?.locale;
      if (incomingLocale && translations[incomingLocale]) {
        setLocaleState(incomingLocale);
        document.documentElement.lang = incomingLocale;
      }
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY || !event.newValue) return;
      const incomingLocale = event.newValue as Locale;
      if (translations[incomingLocale]) {
        setLocaleState(incomingLocale);
        document.documentElement.lang = incomingLocale;
      }
    };

    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleEvent as EventListener);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleEvent as EventListener);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(LOCALE_CHANGE_EVENT, {
          detail: { locale: newLocale },
        })
      );
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, params?: Record<string, string | number>): string => {
      let result = getNestedValue(translations[locale], key);

      if (result === key) {
        const englishFallback = getNestedValue(translations.en, key);
        result = englishFallback === key ? formatMissingKey(key) : englishFallback;
      }

      // Handle interpolation: replace {key} with values from params
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        });
      }

      return result;
    },
    [locale]
  );

  const currentTranslations = useMemo(() => translations[locale], [locale]);

  return {
    t,
    locale,
    setLocale,
    translations: currentTranslations,
  };
}
