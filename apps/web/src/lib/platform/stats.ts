import "server-only";

import { unstable_cache } from "next/cache";
import { ERROR_IDS } from "@/constants/errorIds";
import { logError } from "@/lib/logging";
import { createAdminClient } from "@/lib/supabase/admin";

export const PLATFORM_STATS_CACHE_TAG = "platform-stats";

export interface PlatformStats {
  totalXpMinted: number;
  enrolledBuilders: number;
  credentialsIssued: number;
}

const EMPTY_STATS: PlatformStats = {
  totalXpMinted: 0,
  enrolledBuilders: 0,
  credentialsIssued: 0,
};

const PLATFORM_STATS_TIMEOUT_MS = 1_500;

/**
 * Landing-page platform stats (#1091), cached server-side.
 *
 * `get_platform_stats()` is one cheap RPC (0.95 ms execution on prod) but it
 * was being called 48,830 times a month for 361 users — once per landing
 * render. The page declares `export const revalidate = 300`, which never takes
 * effect because the route renders dynamically, so ISR was not doing the
 * caching anyone assumed it was. `unstable_cache` caches the VALUE rather than
 * the page, so it holds regardless of how the route is rendered.
 *
 * Service-role (server-only) so this public landing can read aggregate counts:
 * the anon client hits RLS ("own-row only" on profiles/certificates) and every
 * count comes back 0. These are non-sensitive totals and the service key never
 * reaches the client.
 *
 * Failure degrades to zeros rather than throwing — a throw inside an
 * `unstable_cache` callback surfaces during BACKGROUND revalidation, attributed
 * to whatever render is in flight, which is how a stats bar takes down
 * unrelated pages. Zeros render as a quiet stats bar.
 */
async function loadPlatformStats(): Promise<PlatformStats> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .rpc("get_platform_stats")
      // PostgREST caps statements at 8 s and this one runs in ~7 ms, so a
      // longer wait is a stalled socket. [PLATFORM_STATS_001] Gateway Timeouts
      // were this call hanging with the landing render behind it.
      .abortSignal(AbortSignal.timeout(PLATFORM_STATS_TIMEOUT_MS));

    const row = data?.[0];
    if (error || !row) {
      throw new Error(error?.message ?? "get_platform_stats returned no row");
    }

    return {
      totalXpMinted: row.total_xp,
      enrolledBuilders: row.builders,
      credentialsIssued: row.credentials,
    };
  } catch (err) {
    logError({
      errorId: ERROR_IDS.PLATFORM_STATS_RPC_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { note: "platform stats degraded to zeros for this cache window" },
    });
    return EMPTY_STATS;
  }
}

export const getPlatformStats = unstable_cache(
  loadPlatformStats,
  ["platform-stats"],
  { tags: [PLATFORM_STATS_CACHE_TAG], revalidate: 300 }
);
