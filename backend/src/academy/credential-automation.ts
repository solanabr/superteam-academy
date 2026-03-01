import type { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  fetchEnrollment,
  getEnrollmentCredentialAsset,
} from "@/academy/shared.js";
import {
  issueCredentialInternal,
  upgradeCredentialInternal,
} from "@/academy/credential-service.js";
import { buildCredentialMetadata } from "@/academy/credential-metadata.js";
import { uploadCredentialMetadataToPinata } from "@/academy/pinata.js";
import { getCredentialCollectionsListAsync } from "@/academy/credential-collections-store.js";
import { getTrackCourseIds } from "@/academy/track-config.js";
import { badRequest } from "@/lib/errors.js";

const PLACEHOLDER_URI = process.env.CREDENTIAL_PLACEHOLDER_URI?.trim() ?? null;

type CourseWithTrack = {
  trackId?: number;
  track_id?: number;
  trackLevel?: number;
  track_level?: number;
  lessonCount?: number;
  lesson_count?: number;
  xpPerLesson?: number;
  xp_per_lesson?: number;
};

/**
 * Runs after a course is finalized in complete-lesson, or when admin calls issue-credential-for-completion.
 * If trackCollectionOverride is provided it is used; otherwise resolves from course trackId.
 */
export async function runCredentialAfterFinalize(
  program: Program,
  courseId: string,
  learner: import("@solana/web3.js").PublicKey,
  course: CourseWithTrack,
  trackCollectionOverride?: string
): Promise<void> {
  const trackIdNum =
    (course as { track_id?: number }).track_id ??
    (course as { trackId?: number }).trackId;
  const list = await getCredentialCollectionsListAsync();

  let trackCollection: string | null = null;
  if (trackCollectionOverride) {
    trackCollection = trackCollectionOverride;
  } else {
    if (trackIdNum == null) return;
    const row = list.find((r) => r.trackId === trackIdNum);
    trackCollection = row?.collectionAddress ?? null;
  }
  if (!trackCollection) return;

  const collectionRow = list.find((r) => r.collectionAddress === trackCollection);
  if (trackIdNum != null && collectionRow && collectionRow.trackId !== trackIdNum) {
    throw badRequest(
      `Selected collection is for track ${collectionRow.trackId} but the course is track ${trackIdNum}. Use a collection for the same track.`
    );
  }

  const trackId = trackIdNum ?? 0;
  const trackCollectionPk = new PublicKey(trackCollection);

  const trackLevel =
    (course as { track_level?: number }).track_level ??
    (course as { trackLevel?: number }).trackLevel ??
    1;

  const courseIdsInTrack = getTrackCourseIds(trackId);
  const courseIds = courseIdsInTrack.length > 0 ? courseIdsInTrack : [courseId];

  let baseCourseId: string | null = null;
  let credentialAsset: import("@solana/web3.js").PublicKey | null = null;

  for (const cid of courseIds) {
    const pair = await fetchEnrollment(program, cid, learner);
    if (!pair) continue;
    const asset = getEnrollmentCredentialAsset(pair.enrollment);
    if (asset) {
      baseCourseId = cid;
      credentialAsset = asset;
      break;
    }
  }

  const lessonCount =
    (course as { lesson_count?: number }).lesson_count ??
    (course as { lessonCount?: number }).lessonCount ??
    0;
  const xpPerLesson =
    (course as { xp_per_lesson?: number }).xp_per_lesson ??
    (course as { xpPerLesson?: number }).xpPerLesson ??
    0;
  const courseXp = Math.max(0, lessonCount * xpPerLesson);

  const credentialName = `Track ${trackId} Level ${trackLevel}`;

  let coursesCompletedForMeta = 0;
  for (const cid of courseIds) {
    const pair = await fetchEnrollment(program, cid, learner);
    if (pair?.enrollment) {
      const completedAt =
        (pair.enrollment as { completed_at?: unknown }).completed_at ??
        (pair.enrollment as { completedAt?: unknown }).completedAt;
      if (completedAt != null) coursesCompletedForMeta++;
    }
  }
  if (coursesCompletedForMeta === 0) coursesCompletedForMeta = 1;

  let collectionImageUrl: string | undefined;
  const listRow = list.find((r) => r.trackId === trackId);
  if (listRow?.imageUrl) collectionImageUrl = listRow.imageUrl;

  const metadataPayload = buildCredentialMetadata(credentialName, {
    description: `Superteam Academy credential: ${credentialName}`,
    image: collectionImageUrl,
    attributes: {
      track_id: trackId,
      level: trackLevel,
      courses_completed: coursesCompletedForMeta,
      total_xp: courseXp,
      course_id: courseId,
    },
  });
  let metadataUri = await uploadCredentialMetadataToPinata(
    metadataPayload as unknown as Record<string, unknown>,
    `credential-${trackId}-${trackLevel}.json`
  );
  if (!metadataUri) {
    if (PLACEHOLDER_URI) metadataUri = PLACEHOLDER_URI;
    else throw new Error("Pinata upload failed. Set CREDENTIAL_PLACEHOLDER_URI or ensure PINATA_JWT is configured.");
  }

  if (baseCourseId && credentialAsset) {
    await upgradeCredentialInternal(program, {
      courseId: baseCourseId,
      learner,
      credentialAsset,
      credentialName,
      metadataUri,
      trackCollection: trackCollectionPk,
      coursesCompleted: coursesCompletedForMeta,
      totalXp: courseXp,
    });
  } else {
    await issueCredentialInternal(program, {
      courseId,
      learner,
      credentialName,
      metadataUri,
      trackCollection: trackCollectionPk,
      coursesCompleted: 1,
      totalXp: courseXp,
    });
  }
}
