import "server-only";

import { unstable_cache } from "next/cache";
import type { LeaderboardEntry } from "@superteam-lms/types";
import { createCookielessClient } from "@/lib/supabase/cookieless";

export type LeaderboardTimeframe = "weekly" | "monthly" | "alltime";

export const LEADERBOARD_CACHE_TAG = "leaderboard";

const LEADERBOARD_TIMEOUT_MS = 2_000;

/**
 * Global XP leaderboard, shared by the `/api/leaderboard` route and the
 * leaderboard page. The `get_leaderboard` RPC is SECURITY DEFINER, anon-granted,
 * and reads no `auth.uid()` — the same rows for every viewer — so it goes
 * through the cookieless anon client (a `cookies()`-bound client would stamp
 * Set-Cookie and force-dynamic everything downstream) and one `unstable_cache`
 * entry per timeframe (60s, tag "leaderboard").
 *
 * Shape matches `HybridProgressService.getLeaderboard` exactly — same RPC, same
 * `p_limit`, same row mapping.
 *
 * Outage behaviour (mirrors `deployments.ts`): an RPC error THROWS inside the
 * `unstable_cache` callback — nothing is written to the cache on a throw, so
 * the next request retries instead of a transient failure being served as a
 * cacheable empty board for the whole revalidate window. Callers degrade
 * OUTSIDE the cache: the route returns an uncached 500, the page falls back
 * to `[]`.
 */
async function loadLeaderboard(
  timeframe: LeaderboardTimeframe
): Promise<LeaderboardEntry[]> {
  const supabase = createCookielessClient();
  const { data, error } = await supabase
    .rpc("get_leaderboard", {
      p_timeframe: timeframe,
      p_limit: 20,
    })
    // Postgres answers this in ~11 ms (max 214 ms over 30 d) and PostgREST caps
    // any statement at 8 s, so a longer wait is a stalled Vercel→Supabase
    // socket rather than a slow query. Unbounded it reached p95 182 s with the
    // board render waiting on it; 2 s is far above the healthy round trip and
    // turns a hung socket into a fast, loggable failure.
    .abortSignal(AbortSignal.timeout(LEADERBOARD_TIMEOUT_MS));

  if (error) {
    // Throwing (not returning []) keeps the failure out of the data cache;
    // the RPC message rides along so the route's logError isn't blind.
    throw new Error(
      `Failed to load leaderboard (${timeframe}): ${error.message}`
    );
  }

  return (data ?? []).map(
    (row): LeaderboardEntry => ({
      userId: row.user_id,
      username: row.username,
      avatarUrl: row.avatar_url ?? "",
      totalXp: row.total_xp,
      level: row.level,
      rank: row.rank,
    })
  );
}

export function getCachedLeaderboard(
  timeframe: LeaderboardTimeframe
): Promise<LeaderboardEntry[]> {
  return unstable_cache(
    () => loadLeaderboard(timeframe),
    ["leaderboard", timeframe],
    { tags: [LEADERBOARD_CACHE_TAG], revalidate: 60 }
  )();
}
