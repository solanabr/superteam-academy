import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, type Locale, locales } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  let locale: Locale = defaultLocale;

  const cookieLocale = cookieStore.get("locale")?.value as Locale | undefined;
  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const acceptLanguage = headerStore.get("accept-language") ?? "";
    for (const l of locales) {
      if (acceptLanguage.toLowerCase().includes(l)) {
        locale = l;
        break;
      }
    }
  }

  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
