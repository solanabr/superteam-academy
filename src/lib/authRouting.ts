export function sanitizeReturnTo(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) return `/${locale}/dashboard`;
  if (!value.startsWith("/")) return `/${locale}/dashboard`;
  if (value.startsWith("//")) return `/${locale}/dashboard`;
  if (value.startsWith("/api")) return `/${locale}/dashboard`;

  if (value === `/${locale}` || value.startsWith(`/${locale}/`)) {
    return value;
  }

  if (value === "/") {
    return `/${locale}`;
  }

  return `/${locale}${value}`;
}

export function buildAuthHref(locale: string, returnTo: string): string {
  return `/${locale}/auth?returnTo=${encodeURIComponent(returnTo)}`;
}

