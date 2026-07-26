import type { CohortLeague } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProgressService } from "@/lib/services";
import { getCohortLeaderboard } from "@/lib/leaderboard/cohort";
import { serverEnv } from "@/lib/env.server";
import { LeaderboardClient } from "./leaderboard-client";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const service = getProgressService(supabase);

  const [
    initialGlobalEntries,
    {
      data: { user },
    },
  ] = await Promise.all([
    service.getLeaderboard("alltime"),
    supabase.auth.getUser(),
  ]);

  // Cohort league is the primary board (LX-B9b). It requires an authenticated
  // user (lazy assignment) and the service-role RPC; anon visitors see only the
  // demoted global board. A cohort read failure degrades to global, never 500s
  // the page.
  let initialCohort: CohortLeague | null = null;
  if (user && serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      initialCohort = await getCohortLeaderboard(createAdminClient(), user.id);
    } catch {
      initialCohort = null;
    }
  }

  return (
    <LeaderboardClient
      initialGlobalEntries={initialGlobalEntries}
      initialCohort={initialCohort}
      currentUserId={user?.id ?? ""}
    />
  );
}
