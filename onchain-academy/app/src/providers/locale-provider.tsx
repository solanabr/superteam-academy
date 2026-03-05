"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { en } from "@/i18n/locales/en";
import { es } from "@/i18n/locales/es";
import { ptBR } from "@/i18n/locales/ptBR";
import type { Locale } from "@/types/domain";

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en,
  es,
  "pt-BR": ptBR,
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const localeStorageKey = "superteam-locale";

function resolvePath(
  dictionary: Record<string, unknown>,
  path: string,
): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (typeof acc === "object" && acc !== null && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dictionary);

  return typeof value === "string" ? value : path;
}

export function LocaleProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const initialLocale =
    (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale | undefined) ?? "en";
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const stored = window.localStorage.getItem(
      localeStorageKey,
    ) as Locale | null;
    if (stored && stored in dictionaries) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    window.localStorage.setItem(localeStorageKey, nextLocale);
  };

  const value = useMemo<LocaleContextValue>(() => {
    const dictionary = dictionaries[locale];
    return {
      locale,
      setLocale,
      t: (path) => resolvePath(dictionary, path),
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
