import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { runCronJob } from "@/lib/cron/guard";
import { sendReengagementEmails } from "@/lib/email/reengagement-send";
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
 * AUTH AND OBSERVABILITY: both live in `runCronJob` (lib/cron/guard) — fail
 * closed on an unset `CRON_SECRET`, timing-safe Bearer compare, and one stable
 * `[CRON_00n]` line on every non-2xx.
 *
 * IDEMPOTENCY AND FREQUENCY: enforced in the database, not here.
 * `claim_due_reengagement` claims each learner in the same statement that reads
 * them, and additionally excludes anyone who received a re-engagement-class
 * email in the last N days. A duplicate invocation — retry, overlap, manual curl
 * with the secret — therefore sends nothing, and a permanently lapsed learner
 * hears from us at most once per window rather than daily.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return runCronJob("reengagement", req.headers, (appUrl) =>
    sendReengagementEmails({ appUrl, locale: defaultLocale })
  );
}
