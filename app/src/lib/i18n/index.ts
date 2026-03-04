import en, { type TranslationKeys } from "./translations/en";
import ptBR from "./translations/pt-br";
import es from "./translations/es";

export type Locale = "en" | "pt-br" | "es";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "pt-br", label: "Portugues (BR)", flag: "🇧🇷" },
  { code: "es", label: "Espanol", flag: "🇪🇸" },
];

export const DEFAULT_LOCALE: Locale = "en";

const translations: Record<Locale, TranslationKeys> = {
  en,
  "pt-br": ptBR,
  es,
};

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

/**
 * Flatten a nested object into dot-separated keys.
 * e.g. { a: { b: "hello" } } => { "a.b": "hello" }
 */
type FlattenKeys<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: FlattenKeys<
        T[K],
        Prefix extends "" ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

export type TranslationKey = FlattenKeys<TranslationKeys>;

/**
 * Get a translation value by dot-separated key path.
 * Supports interpolation: t("dashboard.xpToLevel", { xp: 100, level: 3 })
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = getTranslations(locale);
  const parts = key.split(".");
  let value: Record<string, unknown> | string = dict as Record<string, unknown>;

  for (const part of parts) {
    if (value == null || typeof value !== "object") return key;
    const next = (value as Record<string, unknown>)[part];
    if (typeof next === "string" || (typeof next === "object" && next !== null)) {
      value = next as Record<string, unknown> | string;
    } else {
      return key;
    }
  }

  if (typeof value !== "string") return key;

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, k) =>
      params[k] !== undefined ? String(params[k]) : `{${k}}`
    );
  }

  return value;
}

export { type TranslationKeys };
