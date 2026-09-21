import { getAllCourses, getDeployedAchievements } from "@/lib/content/queries";
import { resolveFlagshipLessonHref } from "@/lib/courses/entry-lesson";
import { getPlatformStats } from "@/lib/platform/stats";
import { LandingPageClient } from "./landing-client";

// The landing shows live platform stats (courses, enrolled builders, credentials,
// XP). Without revalidation it renders fully static and freezes at build time —
// which is why "COURSES LIVE" showed 0 whenever the build-time content fetch lagged
// and never refreshed. 5-minute ISR keeps the numbers current without per-request
// cost — and because this route in practice renders dynamically, the stats read
// carries its own 5-minute `unstable_cache` entry (tag "platform-stats") rather
// than trusting this to do the caching. See lib/platform/stats.ts.
export const revalidate = 300;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [courses, achievements, flagshipLessonHref, stats] = await Promise.all([
    getAllCourses(),
    getDeployedAchievements(),
    resolveFlagshipLessonHref(locale),
    getPlatformStats(),
  ]);

  return (
    <LandingPageClient
      courseCount={courses.length}
      totalXpMinted={stats.totalXpMinted}
      enrolledBuilders={stats.enrolledBuilders}
      credentialsIssued={stats.credentialsIssued}
      achievements={achievements}
      flagshipLessonHref={flagshipLessonHref}
    />
  );
}
