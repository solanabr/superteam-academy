import { LandingPageClient } from "./landing-client";
import {
  getAllCourses,
  getAllLearningPaths,
  getDeployedAchievements,
} from "@/lib/sanity/queries";
import { createAdminClient } from "@/lib/supabase/admin";

// The landing shows live platform stats (courses, enrolled builders, credentials,
// XP). Without revalidation it renders fully static and freezes at build time —
// which is why "COURSES LIVE" showed 0 whenever the build-time Sanity fetch lagged
// and never refreshed. 5-minute ISR keeps the numbers current without per-request cost.
export const revalidate = 300;

export default async function LandingPage() {
  const [courses, learningPaths, achievements] = await Promise.all([
    getAllCourses(),
    getAllLearningPaths(),
    getDeployedAchievements(),
  ]);

  // Fetch on-chain stats from Supabase
  let totalXpMinted = 0;
  let enrolledBuilders = 0;
  let credentialsIssued = 0;
  try {
    // Service-role (server-only) so this public landing can read aggregate counts.
    // The anon client hits RLS ("own-row only" on profiles/certificates), so every
    // count returned 0 — why the live page showed 0 builders/credentials despite real
    // data. These are non-sensitive totals; the service key never reaches the client.
    const supabase = createAdminClient();
    const [xpResult, enrollResult, certResult] = await Promise.all([
      supabase.from("public_user_xp").select("total_xp"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("certificates")
        .select("id", { count: "exact", head: true }),
    ]);
    if (xpResult.data) {
      totalXpMinted = xpResult.data.reduce(
        (sum, row) => sum + (row.total_xp ?? 0),
        0
      );
    }
    enrolledBuilders = enrollResult.count ?? 0;
    credentialsIssued = certResult.count ?? 0;
  } catch {
    // Graceful fallback — stats bar shows 0
  }

  return (
    <LandingPageClient
      courseCount={courses.length}
      totalXpMinted={totalXpMinted}
      enrolledBuilders={enrolledBuilders}
      credentialsIssued={credentialsIssued}
      learningPaths={learningPaths}
      achievements={achievements}
    />
  );
}
