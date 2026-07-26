import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CohortLeague,
  CohortLeaderboardEntry,
} from "@superteam-lms/types";
import type { Database } from "@/lib/supabase/types";

/**
 * Fetch the viewer's weekly cohort league via the server-authoritative
 * `get_cohort_leaderboard` RPC (LX-B9b). Must be called with the service-role
 * (admin) client: the RPC does lazy assignment writes + cross-user reads and is
 * REVOKEd from anon/authenticated. Returns null when the user has no cohort
 * (should not happen — the RPC assigns on read — but callers render the empty
 * state defensively).
 */
export async function getCohortLeaderboard(
  admin: SupabaseClient<Database>,
  userId: string
): Promise<CohortLeague | null> {
  const { data, error } = await admin.rpc("get_cohort_leaderboard", {
    p_user_id: userId,
  });

  if (error) throw new Error(`get_cohort_leaderboard failed: ${error.message}`);
  if (!data || data.length === 0) return null;

  const entries: CohortLeaderboardEntry[] = data.map((row) => ({
    userId: row.user_id,
    username: row.username,
    avatarUrl: row.avatar_url,
    score: row.score,
    rank: row.rank,
    isYou: row.is_you,
  }));

  const first = data[0]!;
  return {
    tier: first.tier,
    weekStart: first.week_start,
    memberCount: entries.length,
    entries,
  };
}
