import "server-only";
import { createClient } from "next-sanity";
import { env } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import type { SanityDoc } from "@/lib/content-sync/types";
import { MANAGED_TYPES } from "@/lib/content-sync/types";

const sanityAdmin = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  token: serverEnv.SANITY_ADMIN_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

/** The shared server-only write client (spec §10.4 — one SANITY_ADMIN_TOKEN
 *  client, held only by the sync job and admin-mutations). */
export function getSanityAdminClient(): typeof sanityAdmin {
  return sanityAdmin;
}

// ---------------------------------------------------------------------------
// CS-9 content sync — batched managed-doc read/write/delete + asset upload.
// The gateway (lib/content-sync/gateway.ts) is the only caller; each function is
// a thin wrapper over the shared write client so the orchestrator's guards are
// unit-tested against an in-memory double, never a live Sanity.
// ---------------------------------------------------------------------------

/** Read every managed document (with onChainStatus + sync marker) for the sync. */
export async function readManagedDocuments(): Promise<SanityDoc[]> {
  const query = `*[_type in $types]{ ..., onChainStatus, sync }`;
  return sanityAdmin.fetch<SanityDoc[]>(query, { types: [...MANAGED_TYPES] });
}

/** createOrReplace a batch of documents in one transaction. */
export async function writeDocuments(docs: SanityDoc[]): Promise<void> {
  if (docs.length === 0) return;
  let tx = sanityAdmin.transaction();
  for (const doc of docs) {
    tx = tx.createOrReplace(doc as unknown as { _id: string; _type: string });
  }
  await tx.commit({ visibility: "async" });
}

/** Delete a batch of documents by id in one transaction (post write-verify). */
export async function deleteDocuments(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  let tx = sanityAdmin.transaction();
  for (const id of ids) tx = tx.delete(id);
  await tx.commit({ visibility: "async" });
}

/** Write the contentSync singleton LAST (spec §9.4 — never matches the prune). */
export async function writeContentSyncSingleton(
  sha: string,
  counts: Record<string, number>
): Promise<void> {
  await sanityAdmin.createOrReplace({
    _id: "contentSync",
    _type: "contentSync",
    sha,
    syncedAt: new Date().toISOString(),
    counts,
  });
}

/** Read the contentSync singleton's sha (the last-synced commit), or null. */
export async function readContentSyncSingleton(): Promise<{
  sha: string;
} | null> {
  const found = await sanityAdmin.fetch<{ sha?: string } | null>(
    `*[_id == "contentSync"][0]{ sha }`
  );
  return found?.sha ? { sha: found.sha } : null;
}

/** True if an image asset with this content-derived id already exists (§9.6). */
export async function assetExists(assetId: string): Promise<boolean> {
  const found = await sanityAdmin.fetch<string | null>(`*[_id == $id][0]._id`, {
    id: assetId,
  });
  return found !== null;
}

/** Upload image bytes; returns the asset _id (content-derived, so idempotent). */
export async function uploadImageAsset(
  bytes: Uint8Array,
  filename: string
): Promise<string> {
  const asset = await sanityAdmin.assets.upload("image", Buffer.from(bytes), {
    filename,
  });
  return asset._id;
}

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

/**
 * Add a value to the managed course-tag vocabulary (issue #322). Admin-only —
 * the calling route must have passed `requireAdminAuth`. Returns the created
 * doc's id + name. A duplicate name is rejected by the caller (checked first).
 */
export async function createCourseTag(
  name: string
): Promise<{ _id: string; name: string }> {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const created = await sanityAdmin.create({
    _type: "courseTag",
    name,
    slug: { _type: "slug", current: slug || "tag" },
  });
  return { _id: created._id, name };
}

/** Remove a managed course tag by document id. Admin-only. */
export async function deleteCourseTag(id: string): Promise<void> {
  await sanityAdmin.delete(id);
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
