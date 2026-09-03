import type { NextRequest } from "next/server";
import { locales, type Locale } from "@/lib/i18n/config";

/**
 * The reader's UI locale for a `/api/content/*` request, or undefined.
 *
 * These routes sit outside the `[locale]` segment, so next-intl's request
 * config never sees them and the middleware never tags them. The client
 * components that call them (dashboard, profile, certificates) live on a
 * `/{locale}/…` page, and a same-origin fetch carries that page as its
 * `Referer` under the default `strict-origin-when-cross-origin` policy. An
 * explicit `?locale=` wins when a caller sends one; the `NEXT_LOCALE` cookie
 * next-intl sets on a language switch is the fallback between the two.
 *
 * Undefined — not the default locale — when nothing identifies the reader:
 * the content queries then return the source tree, exactly as they do for
 * grading, rather than guessing English for a Portuguese reader.
 */
export function localeFromRequest(request: NextRequest): Locale | undefined {
  const isLocale = (v: string | null | undefined): v is Locale =>
    !!v && (locales as readonly string[]).includes(v);

  const explicit = request.nextUrl.searchParams.get("locale");
  if (isLocale(explicit)) return explicit;

  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (isLocale(cookie)) return cookie;

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const first = new URL(referer).pathname.split("/")[1];
      if (isLocale(first)) return first;
    } catch {
      // A malformed Referer is not the reader's problem.
    }
  }
  return undefined;
}
