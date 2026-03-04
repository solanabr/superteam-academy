"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { LOCALES, type Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
          compact ? "px-2 py-1.5 text-sm" : "px-3 py-2 text-sm"
        }`}
        aria-label="Change language"
      >
        <span>{current.flag}</span>
        {!compact && (
          <span className="text-neutral-700 dark:text-neutral-300">
            {current.label}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-50 overflow-hidden">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code as Locale);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
                l.code === locale
                  ? "bg-neutral-50 dark:bg-neutral-700 font-medium"
                  : ""
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {l.label}
              </span>
              {l.code === locale && (
                <svg
                  className="w-4 h-4 ml-auto text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
