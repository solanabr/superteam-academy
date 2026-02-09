export const locales = ["en", "pt-BR", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Portugues (BR)",
  es: "Espanol",
};
