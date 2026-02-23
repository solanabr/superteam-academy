export const locales = ["en", "pt-br", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-br": "Português",
  es: "Español",
};
