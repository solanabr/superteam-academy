import { getRequestConfig } from 'next-intl/server';
import { Locale, locales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming locale is valid
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
