"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  JSX,
  Suspense,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import translations from "./translations.json";

// Opt out of static rendering since we read searchParams at runtime
export const dynamic = "force-dynamic";

export type Locale = "en" | "es" | "pt" | "id";

export const LOCALES: { code: Locale; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
];

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let result: any = obj;
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  return typeof result === "string" ? result : undefined;
}

function resolveInitialLocale(urlLang: string | null): Locale {
  if (urlLang && urlLang in translations) return urlLang as Locale;
  const stored = localStorage.getItem("locale");
  if (stored && stored in translations) return stored as Locale;
  const browser = navigator.language.split("-")[0] as any;
  if (browser in translations) return browser as Locale;
  return "en";
}

// Inner component that actually calls useSearchParams — must be inside <Suspense>
function I18nProviderInner({ children }: { children: ReactNode }): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [locale, setLocaleState] = useState<Locale>("en");

  // On mount: resolve locale and ensure ?lang= is in the URL (only once)
  useEffect(() => {
    const urlLang = searchParams.get("language");
    const resolved = resolveInitialLocale(urlLang);
    setLocaleState(resolved);
    localStorage.setItem("locale", resolved);

    // Only write to URL if lang param is missing or wrong — never on every render
    if (urlLang !== resolved) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("language", resolved);
      // replaceState directly — zero re-render, zero Next.js compilation trigger
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When user explicitly switches language
  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      localStorage.setItem("locale", newLocale);

      const params = new URLSearchParams(searchParams.toString());
      params.set("language", newLocale);

      // router.push so CMS fetches re-run on the new locale
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const translation = getNestedValue(translations[locale], key);

      if (!translation) {
        const fallback = getNestedValue(translations["en"], key);
        if (!fallback) {
          console.warn(`Missing translation for key: ${key}`);
          return key;
        }
        return fallback;
      }

      if (!params) return translation;

      return translation.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() ?? `{${paramKey}}`;
      });
    },
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Public provider wraps the inner component in Suspense, satisfying Next.js's
// requirement that any component calling useSearchParams has a Suspense boundary.
export function I18nProvider({ children }: { children: ReactNode }): JSX.Element {
  return (
    <Suspense fallback={null}>
      <I18nProviderInner>{children}</I18nProviderInner>
    </Suspense>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale, locales: LOCALES };
}