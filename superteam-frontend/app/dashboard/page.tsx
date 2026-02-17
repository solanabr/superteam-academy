import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import { getActivityData } from "@/lib/server/activity-store";
import { getCachedLeaderboard } from "@/lib/server/leaderboard-cache";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  let snapshot, courseSnapshots, activityData, leaderboardEntries;
  try {
    [snapshot, courseSnapshots, activityData, leaderboardEntries] =
      await Promise.all([
        getIdentitySnapshotForUser(user),
        getAllCourseProgressSnapshots(user.walletAddress),
        getActivityData(user.walletAddress, 365),
        getCachedLeaderboard(),
      ]);
  } catch (error: any) {
    // Network error - use fallbacks
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("Network error") ||
      error?.message?.includes("ECONNREFUSED")
    ) {
      console.warn(
        "Network error loading dashboard data, using fallbacks:",
        error.message,
      );
      snapshot = await getIdentitySnapshotForUser(user).catch(() => null);
      courseSnapshots = [];
      activityData = await getActivityData(user.walletAddress, 365);
      leaderboardEntries = [];
    } else {
      throw error;
    }
  }
  const courses = courseSnapshots.map((item) => item.course);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
