import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { sendSessionPlanReminders } from "@/lib/email/reminders";
import { defaultLocale } from "@/lib/i18n/config";

// Service-role DB writes + outbound mail — never prerender, never cache.
export const dynamic = "force-dynamic";

// The send is serial: chunks of 100 with a 600ms courtesy delay plus each
// batch's Resend round-trip (lib/email/reminders.ts). 300s is this project's
// plan ceiling and covers well beyond any near-term audience.
export const maxDuration = 300;

/**
 * GET /api/cron/session-reminders — the ONLY trigger for the session-plan
 * reminder send (#869).
 *
 * SCHEDULE: `apps/web/vercel.json` runs this daily at `0 11 * * *` UTC = 08:00
 * America/Sao_Paulo (Brazil has had no DST since 2019, so the offset is a stable
 * UTC-3). A learner who committed to studying today gets the nudge in the
 * morning, ahead of the hour they picked.
 *
 * AUTH: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. This route
 * fails CLOSED — with `CRON_SECRET` unset it 503s and sends nothing, so a
 * misconfigured deploy can never expose an unauthenticated mail trigger. The
 * comparison is timing-safe.
 *
 * IDEMPOTENCY: enforced in the database, not here — `claim_due_session_reminders`
 * claims each learner for the São Paulo day in the same statement that reads
 * them, so a duplicate invocation (retry, overlap, manual curl with the secret)
 * sends nothing.
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

  const result = await sendSessionPlanReminders({
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
