"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  defaultLocale,
  dictionaries,
  isLocale,
  type Dictionary,
  type DictionaryValue,
  type Locale
} from "@/lib/i18n/config";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readDictionaryPath(dict: Dictionary, path: string): string | undefined {
  const parts = path.split(".");
  let current: DictionaryValue | undefined = dict;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      return undefined;
    }

    current = (current as Dictionary)[part];
  }

  return typeof current === "string" ? current : undefined;
}

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("locale", nextLocale);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLocale = window.localStorage.getItem("locale");
    if (storedLocale && isLocale(storedLocale) && storedLocale !== locale) {
      setLocaleState(storedLocale);
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[locale];

    return {
      locale,
      setLocale,
      t: (path: string) => readDictionaryPath(dictionary, path) ?? path
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}
