import { LeaderboardClient } from "./leaderboard-client";
import { createClient } from "@/lib/supabase/server";
import { getProgressService } from "@/lib/services";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const service = getProgressService(supabase);

  const [
    initialEntries,
    {
      data: { user },
    },
  ] = await Promise.all([
    service.getLeaderboard("alltime"),
    supabase.auth.getUser(),
  ]);

  return (
    <LeaderboardClient
      initialEntries={initialEntries}
      initialTimeframe="alltime"
      currentUserId={user?.id ?? ""}
    />
  );
}
