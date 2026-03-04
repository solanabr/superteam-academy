export const locales = ["en", "pt-BR", "es"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português (BR)",
  es: "Español",
};

export const defaultLocale: Locale = "en";
