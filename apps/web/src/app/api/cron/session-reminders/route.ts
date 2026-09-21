import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { runCronJob } from "@/lib/cron/guard";
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
 * AUTH AND OBSERVABILITY: both live in `runCronJob` (lib/cron/guard) — fail
 * closed on an unset `CRON_SECRET`, timing-safe Bearer compare, and one stable
 * `[CRON_00n]` line on every non-2xx.
 *
 * IDEMPOTENCY: enforced in the database, not here — `claim_due_session_reminders`
 * claims each learner for the São Paulo day in the same statement that reads
 * them, so a duplicate invocation (retry, overlap, manual curl with the secret)
 * sends nothing.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return runCronJob("session-reminders", req.headers, (appUrl) =>
    sendSessionPlanReminders({ appUrl, locale: defaultLocale })
  );
}
