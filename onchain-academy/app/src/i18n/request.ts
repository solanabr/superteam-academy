import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const messages = {
    en: (await import("../messages/en.json")).default,
    "pt-BR": (await import("../messages/pt-BR.json")).default,
    es: (await import("../messages/es.json")).default,
  }[locale];

  return {
    locale,
    messages,
  };
});
