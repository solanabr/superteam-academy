import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` is supported
  let finalLocale = locale as string;
  if (!routing.locales.includes(finalLocale as any)) {
    finalLocale = routing.defaultLocale;
  }

  return {
    locale: finalLocale,
    messages: (await import(`../messages/${finalLocale}.json`)).default,
  };
});
