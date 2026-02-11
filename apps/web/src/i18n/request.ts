import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale: Locale = defaultLocale;

  const requested = await requestLocale;
  if (requested && locales.includes(requested as Locale)) {
    locale = requested as Locale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
