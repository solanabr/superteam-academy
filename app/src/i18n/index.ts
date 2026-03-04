import type { SupportedLocale } from "@/config/constants";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/config/constants";

import en from "./locales/en/common.json";
import ptBR from "./locales/pt-BR/common.json";
import es from "./locales/es/common.json";

type NestedRecord = { [key: string]: string | NestedRecord };

const locales: Record<SupportedLocale, NestedRecord> = {
  en,
  "pt-BR": ptBR,
  es,
};

function getNestedValue(obj: NestedRecord, path: string): string | undefined {
  const keys = path.split(".");
  let current: NestedRecord | string = obj;
  for (const key of keys) {
    if (typeof current !== "object" || current === null) return undefined;
    current = current[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function getTranslation(
  locale: SupportedLocale,
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = locales[locale] || locales[DEFAULT_LOCALE];
  let value = getNestedValue(messages, key);

  if (!value) {
    value = getNestedValue(locales[DEFAULT_LOCALE], key);
  }

  if (!value) return key;

  if (params) {
    return Object.entries(params).reduce(
      (str, [paramKey, paramValue]) =>
        str.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue)),
      value
    );
  }

  return value;
}

export function isValidLocale(locale: string): locale is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export function getLocaleFromStorage(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem("locale");
  if (stored && isValidLocale(stored)) return stored;
  return DEFAULT_LOCALE;
}

export function setLocaleToStorage(locale: SupportedLocale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("locale", locale);
}
