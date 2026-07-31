import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendReengagementEmails } from "@/lib/email/reengagement-send";
import { serverEnv } from "@/lib/env.server";
import { defaultLocale } from "@/lib/i18n/config";

// Service-role DB writes + outbound mail — never prerender, never cache.
export const dynamic = "force-dynamic";

// Two serial passes of chunks-of-100 with a 600ms courtesy delay plus each
// batch's Resend round-trip. 300s is this project's plan ceiling.
export const maxDuration = 300;

/**
 * GET /api/cron/reengagement — the ONLY trigger for the re-engagement send
 * (#899; templates and selection shipped in #898).
 *
 * SCHEDULE: `apps/web/vercel.json` runs this daily at `0 13 * * *` UTC = 10:00
 * America/Sao_Paulo (no DST since 2019, so a stable UTC-3). Two hours after the
 * session-plan reminder, so a learner who receives both on the same morning
 * does not get them in the same minute.
 *
 * AUTH: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. This route fails
 * CLOSED — with `CRON_SECRET` unset it 503s and sends nothing, so a
 * misconfigured deploy can never expose an unauthenticated mail trigger. The
 * comparison is timing-safe.
 *
 * IDEMPOTENCY AND FREQUENCY: enforced in the database, not here.
 * `claim_due_reengagement` claims each learner in the same statement that reads
 * them, and additionally excludes anyone who received a re-engagement-class
 * email in the last N days. A duplicate invocation — retry, overlap, manual curl
 * with the secret — therefore sends nothing, and a permanently lapsed learner
 * hears from us at most once per window rather than daily.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "cron is not configured" },
      { status: 503 }
    );
  }
  if (!authorized(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL must be set to send email" },
      { status: 500 }
    );
  }

  const result = await sendReengagementEmails({
    appUrl,
    locale: defaultLocale,
  });
  return NextResponse.json(result);
}

/** Constant-time `Bearer <secret>` check. Length mismatch is rejected first. */
function authorized(header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
