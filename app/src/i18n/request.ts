import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/dist/server/request/cookies";
import { headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "./config";

export { locales, localeNames, defaultLocale } from "./config";
export type { Locale } from "./config";

async function getLocale(): Promise<Locale> {
  // Check cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value as Locale | undefined;
  if (localeCookie && locales.includes(localeCookie)) {
    return localeCookie;
  }

  // Check Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    const browserLocales = acceptLanguage.split(",").map((lang) => {
      const [locale] = lang.trim().split(";");
      return locale;
    });

    for (const browserLocale of browserLocales) {
      // Exact match
      if (locales.includes(browserLocale as Locale)) {
        return browserLocale as Locale;
      }
      // Partial match (e.g., "pt" matches "pt-BR")
      const partial = locales.find((l) => l.startsWith(browserLocale.split("-")[0]));
      if (partial) {
        return partial;
      }
    }
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await getLocale();
  
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
