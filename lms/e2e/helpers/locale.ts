const DEFAULT_LOCALE = "en";

/** Build a locale-aware path. Default locale ("en") uses no prefix. */
export function localePath(path: string, locale = DEFAULT_LOCALE): string {
  if (locale === DEFAULT_LOCALE) return path;
  return `/${locale}${path}`;
}
