import { LandingPageClient } from "./landing-client";
import {
  getAllCourses,
  getAllLearningPaths,
  getDeployedAchievements,
} from "@/lib/sanity/queries";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();
    const [xpResult, enrollResult, certResult] = await Promise.all([
      supabase.from("user_xp").select("total_xp"),
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
