import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidPreviewSession, TEACH_PREVIEW_COOKIE } from "./preview-auth";

/**
 * Server-component gate for the preview routes (#831). The API routes use
 * `requirePreviewAuth` (which needs a `Request`); pages read the cookie store
 * instead and redirect to the password form rather than returning a 401 the
 * learner would see as a blank page.
 */
export async function requirePreviewPage(locale: string): Promise<void> {
  const store = await cookies();
  const cookie = store.get(TEACH_PREVIEW_COOKIE)?.value;
  if (!isValidPreviewSession(cookie)) {
    redirect(`/${locale}/teach/preview`);
  }
}

/** Base path all preview links hang off, e.g. `/en/teach/preview/24/courses`. */
export function previewHrefBase(locale: string, pr: number): string {
  return `/${locale}/teach/preview/${pr}/courses`;
}

/** Parses the `[pr]` route segment; returns null when it is not a PR number. */
export function parsePrSegment(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
