import { locales, type Locale } from './config';

export function getLocaleName(locale: Locale): string {
  const names: Record<Locale, string> = {
    'pt-BR': 'Português',
    en: 'English',
    es: 'Español',
  };
  return names[locale];
}

export function getLocaleFlag(locale: Locale): string {
  const flags: Record<Locale, string> = {
    'pt-BR': '🇧🇷',
    en: '🇺🇸',
    es: '🇪🇸',
  };
  return flags[locale];
}

export { locales, type Locale };
