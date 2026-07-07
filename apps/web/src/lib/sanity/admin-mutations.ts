import "server-only";
import { createClient } from "next-sanity";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

const sanityAdmin = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  token: serverEnv.SANITY_ADMIN_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

/**
 * Set the full course membership of a learning path (issue #323). Admin-only —
 * the calling route must have passed `requireAdminAuth`. `courseIds` should be
 * de-duplicated by the caller; each becomes a keyed Sanity reference (order
 * preserved). Passing an empty array clears the path.
 */
export async function setLearningPathCourses(
  pathId: string,
  courseIds: string[]
): Promise<void> {
  const courses = courseIds.map((ref) => ({
    _type: "reference",
    _ref: ref,
    _key: ref,
  }));
  await sanityAdmin.patch(pathId).set({ courses }).commit();
}

export async function writeCourseOnChainStatus(
  sanityId: string,
  status: string,
  coursePda: string,
  txSignature: string
): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({
      "onChainStatus.status": status,
      "onChainStatus.coursePda": coursePda,
      "onChainStatus.lastSynced": new Date().toISOString(),
      "onChainStatus.txSignature": txSignature,
    })
    .commit();
}

/**
 * Mirror a course's on-chain `is_active` flag into Sanity so the public catalog
 * can hide a deactivated course (issue #321). The catalog gate reads
 * `onChainStatus.isActive`; the on-chain tx alone doesn't affect Sanity, so the
 * deactivate/reactivate routes call this after the tx succeeds.
 */
export async function writeCourseActive(
  sanityId: string,
  isActive: boolean
): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({ "onChainStatus.isActive": isActive })
    .commit();
}

export async function writeCourseTrackCollection(
  sanityId: string,
  trackCollectionAddress: string
): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({
      "onChainStatus.trackCollectionAddress": trackCollectionAddress,
    })
    .commit();
}

/**
 * Approve a teacher-submitted course (issue #268). Admin-only — the calling
 * route (`/api/admin/courses/review`) MUST have passed `requireAdminAuth`
 * first. Sets `authoringStatus = "approved"` and clears any prior
 * `reviewFeedback`. Does NOT run the on-chain sync; the admin UI triggers the
 * existing `/api/admin/courses/sync` separately so the complex sync stays in
 * one place.
 */
export async function approveCourse(sanityId: string): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({ authoringStatus: "approved", reviewFeedback: null })
    .commit();
}

/**
 * Reject a teacher-submitted course (issue #268). Admin-only. Returns the
 * course to `draft` and stores `feedback` in `reviewFeedback` so the teacher
 * can see why it was rejected. Feedback length bounding is the caller's
 * responsibility (enforced in the review route).
 */
export async function rejectCourse(
  sanityId: string,
  feedback: string
): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({ authoringStatus: "draft", reviewFeedback: feedback })
    .commit();
}

export async function writeAchievementOnChainStatus(
  sanityId: string,
  achievementPda: string,
  collectionAddress: string
): Promise<void> {
  await sanityAdmin
    .patch(sanityId)
    .set({
      "onChainStatus.status": "synced",
      "onChainStatus.achievementPda": achievementPda,
      "onChainStatus.collectionAddress": collectionAddress,
      "onChainStatus.lastSynced": new Date().toISOString(),
    })
    .commit();
}
