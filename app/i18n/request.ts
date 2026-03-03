import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./config";
export { locales, defaultLocale, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  };
});
