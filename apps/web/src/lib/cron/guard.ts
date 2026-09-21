import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { logEvent } from "@/lib/logging";

/**
 * Stable, greppable codes for every non-2xx a `/api/cron/*` route can return.
 *
 * Why these exist: a cron route that returns a bare 503 is invisible. Sentry
 * records a failed transaction with no exception (nothing was thrown) and the
 * Vercel log line carries only a status, so "100% failure across 30
 * invocations" reads identically whether the secret is missing, the header is
 * wrong, or the send threw. #869's session-reminder cron sat in exactly that
 * state — every invocation 503'd on an unset `CRON_SECRET` in the Vercel
 * project, and nothing in either log said so.
 */
export const CRON_CODES = {
  /** `CRON_SECRET` unset — the route fails closed and sends nothing. */
  UNCONFIGURED: "CRON_001",
  /** Authorization header absent, malformed, or not the configured secret. */
  UNAUTHORIZED: "CRON_002",
  /** `NEXT_PUBLIC_APP_URL` unset — email needs absolute links. */
  NO_APP_URL: "CRON_003",
  /** The job itself threw. */
  RUN_FAILED: "CRON_004",
} as const;

/**
 * Counts a cron job reports back to the caller on a successful run. Any object
 * shape — each job owns its own result type (`ReminderRunResult`,
 * `ReengagementRunResult`); the guard only spreads it into the 200 body.
 */
export type CronJobResult = object;

/**
 * Run a scheduled job behind the shared Vercel Cron guard.
 *
 * AUTH: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Fails CLOSED —
 * with `CRON_SECRET` unset the route 503s and the job never runs, so a
 * misconfigured deploy can never leave a mail trigger open to the internet.
 * The comparison is timing-safe.
 *
 * OBSERVABILITY: every non-2xx emits one `[CRON_00n]` line naming the job. The
 * success body always carries the job name alongside the job's own counts, so
 * a 200 that sent nothing is distinguishable from a 200 that sent.
 */
export async function runCronJob<T extends CronJobResult>(
  job: string,
  headers: Headers,
  run: (appUrl: string) => Promise<T>
): Promise<NextResponse> {
  const secret = serverEnv.CRON_SECRET;
  if (!secret) {
    logEvent({
      event: CRON_CODES.UNCONFIGURED,
      level: "error",
      context: { job, reason: "CRON_SECRET is not set" },
    });
    return NextResponse.json(
      { error: "cron is not configured", code: CRON_CODES.UNCONFIGURED },
      { status: 503 }
    );
  }

  if (!authorized(headers.get("authorization"), secret)) {
    logEvent({
      event: CRON_CODES.UNAUTHORIZED,
      context: { job, hasHeader: headers.has("authorization") },
    });
    return NextResponse.json(
      { error: "Unauthorized", code: CRON_CODES.UNAUTHORIZED },
      { status: 401 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    logEvent({
      event: CRON_CODES.NO_APP_URL,
      level: "error",
      context: { job, reason: "NEXT_PUBLIC_APP_URL is not set" },
    });
    return NextResponse.json(
      {
        error: "NEXT_PUBLIC_APP_URL must be set to send email",
        code: CRON_CODES.NO_APP_URL,
      },
      { status: 500 }
    );
  }

  try {
    const result = await run(appUrl);
    return NextResponse.json({ job, ...result });
  } catch (err) {
    logEvent({
      event: CRON_CODES.RUN_FAILED,
      level: "error",
      context: { job, message: err instanceof Error ? err.message : String(err) },
    });
    return NextResponse.json(
      { error: "cron job failed", code: CRON_CODES.RUN_FAILED },
      { status: 500 }
    );
  }
}

/** Constant-time `Bearer <secret>` check. Length mismatch is rejected first. */
function authorized(header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
