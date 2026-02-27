export { en, type Translations } from './en';
export { ptBr } from './pt-br';
export { es } from './es';

export type Locale = 'en' | 'pt-br' | 'es';

export const locales: Locale[] = ['en', 'pt-br', 'es'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'pt-br': 'Português',
  es: 'Español',
};
