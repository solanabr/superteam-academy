"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Language;
    if (stored && ["en", "pt", "es"].includes(stored)) {
      setLangState(stored);
    }
  }, []);

  function setLang(newLang: Language) {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}