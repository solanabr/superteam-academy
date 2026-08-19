import "server-only";

import { unstable_cache } from "next/cache";
import type { LeaderboardEntry } from "@superteam-lms/types";
import { createCookielessClient } from "@/lib/supabase/cookieless";
import { logError } from "@/lib/logging";

export type LeaderboardTimeframe = "weekly" | "monthly" | "alltime";

export const LEADERBOARD_CACHE_TAG = "leaderboard";

/**
 * Global XP leaderboard, shared by the `/api/leaderboard` route and the
 * leaderboard page. The `get_leaderboard` RPC is SECURITY DEFINER, anon-granted,
 * and reads no `auth.uid()` — the same rows for every viewer — so it goes
 * through the cookieless anon client (a `cookies()`-bound client would stamp
 * Set-Cookie and force-dynamic everything downstream) and one `unstable_cache`
 * entry per timeframe (60s, tag "leaderboard").
 *
 * Shape matches `HybridProgressService.getLeaderboard` exactly — same RPC, same
 * `p_limit`, same row mapping. A read failure degrades to `[]` (logged), also
 * matching the service.
 */
async function loadLeaderboard(
  timeframe: LeaderboardTimeframe
): Promise<LeaderboardEntry[]> {
  const supabase = createCookielessClient();
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_timeframe: timeframe,
    p_limit: 20,
  });

  if (error) {
    logError({
      errorId: "getCachedLeaderboard.get_leaderboard",
      error: new Error(error.message),
      context: { note: "getCachedLeaderboard degraded to []", timeframe },
    });
    return [];
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
