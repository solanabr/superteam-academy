"use client";

import { useState } from "react";

const LOCALES = [
  { code: "pt-BR", label: "PT-BR", flag: "🇧🇷" },
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

export function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState("pt-BR");
  const [open, setOpen] = useState(false);

  const current = LOCALES.find((l) => l.code === currentLocale)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-32 rounded-lg bg-[#1a1a2e] border border-white/10 shadow-xl z-50 overflow-hidden">
            {LOCALES.map((locale) => (
              <button
                key={locale.code}
                onClick={() => { setCurrentLocale(locale.code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  currentLocale === locale.code
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5"
                }`}
              >
                <span>{locale.flag}</span>
                <span>{locale.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
