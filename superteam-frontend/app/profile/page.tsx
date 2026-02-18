import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";
import { getActivityDays } from "@/lib/server/activity-store";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import { getAllCourses } from "@/lib/server/admin-store";

export default async function Page() {
  const user = await requireAuthenticatedUser();
  let snapshot, activityDays, courseSnapshots;
  try {
    [snapshot, activityDays, courseSnapshots] = await Promise.all([
      getIdentitySnapshotForUser(user),
      getActivityDays(user.walletAddress, 365),
      getAllCourseProgressSnapshots(user.walletAddress),
    ]);
  } catch {
    snapshot = await getIdentitySnapshotForUser(user).catch(() => null);
    activityDays = await getActivityDays(user.walletAddress, 365);
    courseSnapshots = [];
  }
  const allCourses =
    courseSnapshots.length > 0
      ? courseSnapshots.map((s) => s.course)
      : getAllCourses().map((c) => ({ ...c, progress: 0 }));

  return (
    <ProfilePageComponent
      identity={snapshot}
      activityDays={activityDays}
      allCourses={allCourses}
    />
  );
}
