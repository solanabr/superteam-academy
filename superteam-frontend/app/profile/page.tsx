import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getIdentitySnapshotForUser } from "@/lib/server/solana-identity-adapter";
import { getActivityDays } from "@/lib/server/activity-store";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import { courseService } from "@/lib/cms/course-service";
import type { CourseProgressSnapshot } from "@/lib/server/academy-progress-adapter";
import type { IdentitySnapshot } from "@/lib/identity/types";

export default async function Page() {
  const user = await requireAuthenticatedUser();
  let snapshot: IdentitySnapshot | undefined;
  let activityDays: Awaited<ReturnType<typeof getActivityDays>>;
  let courseSnapshots: CourseProgressSnapshot[] = [];
  try {
    [snapshot, activityDays, courseSnapshots] = await Promise.all([
      getIdentitySnapshotForUser(user),
      getActivityDays(user.walletAddress, 365),
      getAllCourseProgressSnapshots(user.walletAddress),
    ]);
  } catch {
    snapshot =
      (await getIdentitySnapshotForUser(user).catch(() => null)) ?? undefined;
    activityDays = await getActivityDays(user.walletAddress, 365);
    courseSnapshots = [];
  }
  const allCourses =
    courseSnapshots.length > 0
      ? courseSnapshots.map((s) => s.course)
      : (await courseService.getAllCourses()).map((c) => ({
          ...c,
          progress: 0,
        }));

  return (
    <ProfilePageComponent
      identity={snapshot}
      activityDays={activityDays}
      allCourses={allCourses}
    />
  );
}
