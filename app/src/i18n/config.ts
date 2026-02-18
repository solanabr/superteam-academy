export const locales = ['en', 'pt', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Portugues',
  es: 'Espanol'
};

export const localeFlags: Record<Locale, string> = {
  en: 'US',
  pt: 'BR',
  es: 'ES'
};
