import { getRequestConfig } from "next-intl/server";
import { locales, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = locales.includes(requested as Locale) ? requested : "en";

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
