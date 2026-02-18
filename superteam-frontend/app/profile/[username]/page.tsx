import ProfilePageComponent from "@/components/profile/ProfilePageComponent";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  getIdentitySnapshotForUser,
  getIdentitySnapshotForWallet,
} from "@/lib/server/solana-identity-adapter";
import { getActivityDays } from "@/lib/server/activity-store";
import { getAllCourseProgressSnapshots } from "@/lib/server/academy-progress-adapter";
import { getAllCourses } from "@/lib/server/admin-store";

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

  let snapshot, activityDays, courseSnapshots;
  try {
    [snapshot, activityDays, courseSnapshots] = await Promise.all([
      isCurrentUser
        ? getIdentitySnapshotForUser(currentUser)
        : getIdentitySnapshotForWallet(targetWallet),
      getActivityDays(targetWallet, 365),
      getAllCourseProgressSnapshots(targetWallet),
    ]);
  } catch {
    snapshot = isCurrentUser
      ? await getIdentitySnapshotForUser(currentUser).catch(() => null)
      : await getIdentitySnapshotForWallet(targetWallet).catch(() => null);
    activityDays = await getActivityDays(targetWallet, 365);
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
      isOwnProfile={isCurrentUser}
    />
  );
}
