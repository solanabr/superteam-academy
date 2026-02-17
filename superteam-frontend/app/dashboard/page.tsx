import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import {
  getActivityDays,
  getRecentActivity,
} from "@/lib/server/activity-store";
import { getCachedLeaderboard } from "@/lib/server/leaderboard-cache";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  let snapshot,
    courseSnapshots,
    activityDays,
    recentActivity,
    leaderboardEntries;
  try {
    [
      snapshot,
      courseSnapshots,
      activityDays,
      recentActivity,
      leaderboardEntries,
    ] = await Promise.all([
      getIdentitySnapshotForUser(user),
      getAllCourseProgressSnapshots(user.walletAddress),
      Promise.resolve(getActivityDays(user.walletAddress, 365)),
      Promise.resolve(getRecentActivity(user.walletAddress)),
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
      activityDays = getActivityDays(user.walletAddress, 365);
      recentActivity = getRecentActivity(user.walletAddress);
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
          activityDays={activityDays}
          recentActivity={recentActivity}
          leaderboardEntries={leaderboardEntries.slice(0, 10)}
        />
      </main>
      <Footer />
    </div>
  );
}
