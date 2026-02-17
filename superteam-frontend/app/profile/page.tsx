import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";
import { getActivityDays } from "@/lib/server/activity-store";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";

export default async function Page() {
  const user = await requireAuthenticatedUser();
  let snapshot, activityDays, courseSnapshots;
  try {
    [snapshot, activityDays, courseSnapshots] = await Promise.all([
      getIdentitySnapshotForUser(user),
      getActivityDays(user.walletAddress, 365),
      getAllCourseProgressSnapshots(user.walletAddress),
    ]);
  } catch (error: any) {
    // Network error - use fallbacks
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("Network error") ||
      error?.message?.includes("ECONNREFUSED")
    ) {
      console.warn(
        "Network error loading profile data, using fallbacks:",
        error.message,
      );
      snapshot = await getIdentitySnapshotForUser(user).catch(() => null);
      activityDays = await getActivityDays(user.walletAddress, 365);
      courseSnapshots = [];
    } else {
      throw error;
    }
  }
  const allCourses = courseSnapshots.map((s) => s.course);

  return (
    <div>
      <Navbar />
      <ProfilePageComponent
        identity={snapshot}
        activityDays={activityDays}
        allCourses={allCourses}
      />
    </div>
  );
}
