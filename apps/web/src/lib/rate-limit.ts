import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Cross-instance rate limiter backed by Supabase (P1-7).
//
// Fixed-window counter: all tokens reset at the start of each
// `refillIntervalMs` window. State lives in the `rate_limits` table via the
// atomic `check_rate_limit` SECURITY DEFINER function, so limits hold across
// all serverless instances (unlike the previous in-memory Map).
//
// Fails OPEN: if the store is unreachable we allow the request rather than
// hard-blocking traffic on a transient DB issue (the limiter is abuse/cost
// mitigation, not an auth gate). Failures are logged.

interface RateLimiterOptions {
  maxTokens: number;
  refillIntervalMs: number;
}

export async function isRateLimited(
  namespace: string,
  key: string,
  opts: RateLimiterOptions
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: `${namespace}:${key}`,
      p_max_tokens: opts.maxTokens,
      p_window_seconds: Math.max(1, Math.ceil(opts.refillIntervalMs / 1000)),
    });

    if (error) {
      console.warn(
        `[rate-limit] check_rate_limit failed for ${namespace}, allowing:`,
        error.message
      );
      return false;
    }

    return data === true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[rate-limit] limiter unavailable for ${namespace}, allowing:`,
      message
    );
    return false;
  }
}
