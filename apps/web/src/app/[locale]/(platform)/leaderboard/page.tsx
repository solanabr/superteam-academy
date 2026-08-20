import type { CohortLeague } from "@superteam-lms/types";
import { getAuthClaims } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCohortLeaderboard } from "@/lib/leaderboard/cohort";
import { getCachedLeaderboard } from "@/lib/leaderboard/global";
import { serverEnv } from "@/lib/env.server";
import { LeaderboardClient } from "./leaderboard-client";

export default async function LeaderboardPage() {
  // Global board via the shared unstable_cache'd cookieless read (60s, tag
  // "leaderboard") — the same rows for every viewer, so no reason to re-run
  // the RPC per request through the cookie-bound service. A read failure
  // throws OUT of the cache (nothing stale gets written); degrade to an empty
  // board here, outside it, so the page renders rather than 500s.
  const [initialGlobalEntries, claims] = await Promise.all([
    getCachedLeaderboard("alltime").catch(() => []),
    getAuthClaims(),
  ]);

  // Cohort league is the primary board (LX-B9b). It requires an authenticated
  // user (lazy assignment) and the service-role RPC; anon visitors see only the
  // demoted global board. A cohort read failure degrades to global, never 500s
  // the page.
  let initialCohort: CohortLeague | null = null;
  if (claims && serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      initialCohort = await getCohortLeaderboard(
        createAdminClient(),
        claims.sub
      );
    } catch {
      initialCohort = null;
    }
  }

  return (
    <LeaderboardClient
      initialGlobalEntries={initialGlobalEntries}
      initialCohort={initialCohort}
      currentUserId={claims?.sub ?? ""}
    />
  );
}
