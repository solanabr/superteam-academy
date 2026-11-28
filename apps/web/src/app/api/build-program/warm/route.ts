import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { isRateLimited } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/env.server";

/**
 * Asks the build server's health endpoint for an answer, so an instance that
 * has scaled to zero starts while the learner is still reading and the first
 * build doesn't wait for it. Best-effort: the lesson page fires it and ignores
 * the result.
 *
 * - `ready`: health answered OK.
 * - `waking`: no answer within the wait. The instance keeps starting after we
 *   stop waiting.
 * - `down`: health answered non-OK, or the connection failed outright.
 * - `skipped`: nothing was asked (rate-limited, not configured, or the
 *   request could not be checked).
 */
type BuildWarmStatus = "ready" | "waking" | "down" | "skipped";

type WarmResponse = { status: BuildWarmStatus } | { error: string };

// One call per user per five minutes. The health endpoint takes no API key,
// so none is sent.
const WARM_WINDOW_MS = 5 * 60_000;
const HEALTH_TIMEOUT_MS = 4_000;

export const maxDuration = 10;

function answer(status: BuildWarmStatus): NextResponse<WarmResponse> {
  return NextResponse.json({ status });
}

export async function POST(): Promise<NextResponse<WarmResponse>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Same guard as the build route: with either unset no build can run, so
    // there is nothing to warm.
    const { BUILD_SERVER_URL, BUILD_SERVER_API_KEY } = serverEnv;
    if (!BUILD_SERVER_URL || !BUILD_SERVER_API_KEY) return answer("skipped");

    // Warming is optional, so when the limiter can't check, skip rather than
    // let calls through unmetered.
    if (
      await isRateLimited("build-program-warm", user.id, {
        maxTokens: 1,
        refillIntervalMs: WARM_WINDOW_MS,
        failClosed: true,
      })
    ) {
      return answer("skipped");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const health = await fetch(`${BUILD_SERVER_URL}/health`, {
        cache: "no-store",
        signal: controller.signal,
      });
      return answer(health.ok ? "ready" : "down");
    } catch (fetchErr) {
      const isAbort =
        fetchErr instanceof Error && fetchErr.name === "AbortError";
      return answer(isAbort ? "waking" : "down");
    } finally {
      clearTimeout(timeout);
    }
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.BUILD_PROGRAM_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/build-program/warm" },
    });
    return answer("skipped");
  }
}
