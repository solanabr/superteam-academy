import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const locales = ["en", "pt-BR", "es"] as const;

export default getRequestConfig(async () => {
  const store = await cookies();
  const localeStore = store.get("locale")?.value;
  const locale =
    localeStore && locales.includes(localeStore as (typeof locales)[number])
      ? localeStore
      : "en";

  return {
    locale,
    messages: (await import(`../src/messages/${locale}.json`)).default,
  };
});
