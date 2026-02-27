import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v4 provides the locale as an async value
  let finalLocale = (await requestLocale) ?? routing.defaultLocale;
  if (!routing.locales.includes(finalLocale as any)) {
    finalLocale = routing.defaultLocale;
  }

  return {
    locale: finalLocale,
    messages: (await import(`../messages/${finalLocale}.json`)).default,
  };
});
