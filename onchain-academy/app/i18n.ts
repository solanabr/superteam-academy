import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'pt-br', 'es'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  'en':    'English',
  'pt-br': 'Português',
  'es':    'Español',
};

export default getRequestConfig(async ({ locale }) => {
  // Reject any locale not in our list — returns 404
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
