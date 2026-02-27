/** Locale-aware formatting helpers. */

const intlLocaleMap: Record<string, string> = {
  en: "en-US",
  es: "es",
  "pt-br": "pt-BR",
};

function toIntlLocale(locale: string): string {
  return intlLocaleMap[locale] ?? locale;
}

/** Format a date with locale-appropriate medium style (e.g. "Feb 25, 2026"). */
export function formatDate(
  date: Date | string | number,
  locale: string,
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
  }).format(d);
}

/** Format a number with locale-appropriate grouping (e.g. 1,000 vs 1.000). */
export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(n);
}
