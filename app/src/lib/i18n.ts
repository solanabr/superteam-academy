import { cookies } from "next/headers";
import en from "@/messages/en.json";
import ptbr from "@/messages/pt-br.json";
import es from "@/messages/es.json";

export const LOCALES = ["en", "pt-br", "es"] as const;
export type Locale = (typeof LOCALES)[number];

const dictionaries = { en, "pt-br": ptbr, es } as const;

export async function getLocale(): Promise<Locale> {
  const locale = (await cookies()).get("NEXT_LOCALE")?.value as Locale | undefined;
  return locale && LOCALES.includes(locale) ? locale : "en";
}

export async function t(key: keyof typeof en) {
  const locale = await getLocale();
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}

export async function dictionary() {
  const locale = await getLocale();
  return dictionaries[locale];
}
