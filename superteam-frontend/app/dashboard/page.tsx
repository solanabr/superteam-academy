import { Footer } from "@/components/footer";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import { getActivityData } from "@/lib/server/activity-store";
import {
  getCachedLeaderboard,
  type LeaderboardEntry,
} from "@/lib/server/leaderboard-cache";
import { courseService } from "@/lib/cms/course-service";
import type { CourseProgressSnapshot } from "@/lib/server/academy-progress-adapter";
import type { IdentitySnapshot } from "@/lib/identity/types";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  let snapshot: IdentitySnapshot | undefined;
  let courseSnapshots: CourseProgressSnapshot[] = [];
  let activityData: Awaited<ReturnType<typeof getActivityData>>;
  let leaderboardEntries: LeaderboardEntry[] = [];
  try {
    [snapshot, courseSnapshots, activityData, leaderboardEntries] =
      await Promise.all([
        getIdentitySnapshotForUser(user),
        getAllCourseProgressSnapshots(user.walletAddress),
        getActivityData(user.walletAddress, 365),
        getCachedLeaderboard(),
      ]);
  } catch {
    snapshot =
      (await getIdentitySnapshotForUser(user).catch(() => null)) ?? undefined;
    courseSnapshots = [];
    activityData = await getActivityData(user.walletAddress, 365);
    leaderboardEntries = [];
  }
  const courses =
    courseSnapshots.length > 0
      ? courseSnapshots.map((item) => item.course)
      : (await courseService.getAllCourses()).map((c) => ({
          ...c,
          progress: 0,
        }));

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
        <DashboardContent
          identity={snapshot}
          coursesData={courses}
          activityDays={activityData.days}
          recentActivity={activityData.recentActivity}
          leaderboardEntries={leaderboardEntries.slice(0, 10)}
        />
      </main>
      <Footer />
    </div>
  );
}
