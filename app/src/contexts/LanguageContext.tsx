"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Lang } from '@/i18n/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text = translations[lang][key] || translations['en'][key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, language: lang, setLanguage: setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be within LanguageProvider');
  return ctx;
}
