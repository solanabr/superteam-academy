import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  getIdentitySnapshotForUser,
  getIdentitySnapshotForWallet,
} from "@/lib/server/solana-identity-adapter";
import { getActivityDays } from "@/lib/server/activity-store";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import { courseService } from "@/lib/cms/course-service";
import type { CourseProgressSnapshot } from "@/lib/server/academy-progress-adapter";
import type { IdentitySnapshot } from "@/lib/identity/types";

export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const currentUser = await requireAuthenticatedUser();

  const isCurrentUser =
    username === currentUser.walletAddress ||
    username === currentUser.username ||
    username === `user_${currentUser.walletAddress.slice(0, 6).toLowerCase()}`;

  const targetWallet = isCurrentUser ? currentUser.walletAddress : username;

  let snapshot: IdentitySnapshot | undefined;
  let activityDays: Awaited<ReturnType<typeof getActivityDays>>;
  let courseSnapshots: CourseProgressSnapshot[] = [];
  try {
    [snapshot, activityDays, courseSnapshots] = await Promise.all([
      isCurrentUser
        ? getIdentitySnapshotForUser(currentUser)
        : getIdentitySnapshotForWallet(targetWallet),
      getActivityDays(targetWallet, 365),
      getAllCourseProgressSnapshots(targetWallet),
    ]);
  } catch {
    snapshot =
      (isCurrentUser
        ? await getIdentitySnapshotForUser(currentUser).catch(() => null)
        : await getIdentitySnapshotForWallet(targetWallet).catch(() => null)) ??
      undefined;
    activityDays = await getActivityDays(targetWallet, 365);
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
      isOwnProfile={isCurrentUser}
    />
  );
}
