import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["en", "pt-BR", "es"] as const;
export type Locale = (typeof locales)[number];

const defaultLocale: Locale = "pt-BR";

function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const nextLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = nextLocale && isValidLocale(nextLocale) ? nextLocale : defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "America/Sao_Paulo",
    now: new Date(),
  };
});
