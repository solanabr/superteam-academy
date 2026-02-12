import en from "@/lib/i18n/dictionaries/en.json";
import es from "@/lib/i18n/dictionaries/es.json";
import ptBr from "@/lib/i18n/dictionaries/pt-br.json";

export const locales = ["en", "pt-br", "es"] as const;

export type Locale = (typeof locales)[number];

export type DictionaryValue = string | { [key: string]: DictionaryValue };
export type Dictionary = { [key: string]: DictionaryValue };

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  "pt-br": ptBr,
  es
};

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
