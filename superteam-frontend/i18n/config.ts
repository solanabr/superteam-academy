export const locales = ["en", "pt-br", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  "pt-br": "Português (BR)",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  "pt-br": "🇧🇷",
  es: "🇪🇸",
};
