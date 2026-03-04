"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  type Locale,
  DEFAULT_LOCALE,
  translate,
  getTranslations,
  type TranslationKeys,
} from "@/lib/i18n";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: TranslationKeys;
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  translations: getTranslations(DEFAULT_LOCALE),
});

const LOCALE_STORAGE_KEY = "caminho_locale";
const subscribeHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "pt-br" || stored === "es") return stored;

  // Try browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("pt")) return "pt-br";
  if (browserLang.startsWith("es")) return "es";

  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const mounted = useSyncExternalStore(
    subscribeHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const initialLocale = getInitialLocale();
      setLocaleState((current) =>
        current === initialLocale ? current : initialLocale
      );
      document.documentElement.lang =
        initialLocale === "pt-br" ? "pt-BR" : initialLocale;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale === "pt-br" ? "pt-BR" : newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const translations = getTranslations(locale);

  // Prevent hydration mismatch: render default locale on server, switch after mount
  const contextValue: I18nContextType = {
    locale: mounted ? locale : DEFAULT_LOCALE,
    setLocale,
    t: mounted ? t : (key: string) => translate(DEFAULT_LOCALE, key),
    translations: mounted ? translations : getTranslations(DEFAULT_LOCALE),
  };

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
