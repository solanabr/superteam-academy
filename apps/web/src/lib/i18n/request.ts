import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  // next-intl v4 requires `locale` to be a non-optional string. `hasLocale`
  // narrows `requested` to a valid Locale, falling back to the default.
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
