"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "pt-BR" | "es";

interface Translations {
  [key: string]: string | Translations;
}

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: { code: Language; label: string; name: string }[];
}

// Externalized to public/locales

const languages = [
  { code: "en" as Language, label: "EN", name: "English" },
  { code: "pt-BR" as Language, label: "PT", name: "Português" },
  { code: "es" as Language, label: "ES", name: "Español" },
];

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const loadTranslations = async (lang: Language) => {
    try {
      const response = await fetch(`/locales/${lang}/common.json`);
      const data = await response.json();
      setTranslations(data);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}`, error);
      // Fallback to English if not already English
      if (lang !== "en") {
        loadTranslations("en");
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("language") as Language;
    const initialLang: Language = saved && ["en", "pt-BR", "es"].includes(saved) ? saved : "en";
    setLanguageState(initialLang);
    loadTranslations(initialLang);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    loadTranslations(lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    if (!translations) return key;

    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== "string") return key;

    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? `{{${k}}}`));
    }

    return value;
  };

  if (!isMounted || !translations) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export { languages };
export type { Language };
