import "server-only";

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import type { SlotsLockT } from "@superteam-lms/content-schema";
import { serverEnv } from "@/lib/env.server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { isPlatformFrozen } from "@/lib/platform/freeze";
import { platformFrozenResponse } from "@/lib/platform/freeze-http";
import { getAllCoursesAdmin, COURSES_CACHE_TAG } from "@/lib/content/queries";
import { fetchCourse } from "@/lib/solana/academy-reads";
import { findCoursePDA, getProgramId } from "@/lib/solana/pda";
import { isValidLessonCount } from "@/lib/solana/course-write-params";
import {
  deployCoursePda,
  updateCoursePda,
  deployCourseTrackCollection,
  setCourseCollectionPda,
  buildCourseCommit,
} from "@/lib/solana/admin-signer";
import {
  difficultyToNumber,
  getMissingCourseFields,
  isDraftId,
} from "@/lib/admin/sync-diff";
import {
  writeCourseMaintenanceFlag,
  writeCourseOnChainStatus,
  writeCourseTrackCollection,
} from "@/lib/content/deployment-writes";
import { slotsByCourseId } from "@/lib/content/store";
import { SYNCED_SHA } from "@/lib/content/meta";
import { MaskMismatchError } from "@/lib/github/types";
import { deriveActiveMask } from "@/lib/github/content-commit";

/**
 * Load a course's committed `slots.lock.json` from the pinned content bundle
 * (§11.0). SP2-B: sourced from `slotsByCourseId` + the bundle SHA rather than a
 * request-time GitHub tarball of the last-synced tree — the committed bundle IS
 * the synced content, so the lockfile is the one the drift/deploy panel already
 * derives its mask from, keeping the `buildCourseCommit` cross-check meaningful.
 * Throws when the bundle does not carry this course (ordering interlock: a
 * course absent from the synced bundle cannot have its mask committed on-chain).
 */
function readCourseSlotsLock(courseId: string): {
  contentSha: string;
  slotsLock: SlotsLockT;
} {
  const slotsLock = slotsByCourseId.get(courseId);
  if (!slotsLock) {
    throw new Error(
      `${courseId}: not found in the synced content bundle at ${SYNCED_SHA}`
    );
  }
  return { contentSha: SYNCED_SHA, slotsLock };
}

/** Validate a `[u64, u64, u64, u64]` mask sent as decimal strings. */
function parseActiveLessons(
  value: unknown
): [bigint, bigint, bigint, bigint] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  try {
    const words = value.map((w) => {
      if (typeof w !== "string") throw new Error("not a string");
      const n = BigInt(w);
      if (n < 0n) throw new Error("negative");
      return n;
    });
    return [words[0]!, words[1]!, words[2]!, words[3]!];
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  // Global deploy-window freeze (reset wave B2). Deploying/updating a Course PDA
  // is an on-chain write, so it is frozen during the window. EXEMPT: the reset's
  // own close+recreate (lib/admin/recreate-course.ts via the recreate route),
  // which is never gated on this flag.
  if (await isPlatformFrozen()) {
    return platformFrozenResponse();
  }

  let courseId: string;
  // Optional §11.0 commitment: the mask the admin panel's pending-sync state
  // intends to send (u64 words as decimal strings). When present, the on-chain
  // content_tx_id is committed in the same update and the mask is cross-checked
  // against the committed slots.lock.json. Absent → legacy behaviour, unchanged.
  let activeLessons: [bigint, bigint, bigint, bigint] | null = null;
  // `commitContent: true` requests the same §11.0 commitment without the caller
  // supplying a mask — the route derives it from the committed slots.lock.json
  // itself (deriveActiveMask). This is the UI's "Commit content hash" action:
  // the deleted drift screen used to send an explicit mask, but the lockfile is
  // the source of truth, so deriving it here needs no browser-side mask logic.
  let commitContent = false;
  try {
    const body = (await req.json()) as {
      courseId?: unknown;
      activeLessons?: unknown;
      commitContent?: unknown;
    };
    if (typeof body.courseId !== "string" || !body.courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    courseId = body.courseId;
    commitContent = body.commitContent === true;
    if (body.activeLessons !== undefined) {
      activeLessons = parseActiveLessons(body.activeLessons);
      if (!activeLessons) {
        return NextResponse.json(
          {
            error:
              "activeLessons must be a [u64,u64,u64,u64] of decimal strings",
          },
          { status: 400 }
        );
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (new TextEncoder().encode(courseId).length > 32) {
    return NextResponse.json(
      { error: "courseId exceeds 32 bytes (on-chain limit)" },
      { status: 400 }
    );
  }

  if (isDraftId(courseId)) {
    return NextResponse.json(
      { error: "Cannot sync draft documents" },
      { status: 400 }
    );
  }

  const courses = await getAllCoursesAdmin();
  const course = courses.find((c) => c._id === courseId);
  if (!course) {
    return NextResponse.json(
      { error: "Course not found in the content bundle" },
      { status: 404 }
    );
  }

  const missingFields = getMissingCourseFields(course);
  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields", missingFields },
      { status: 400 }
    );
  }

  // #332: `lesson_count` is a u8 create_course arg — the program rejects 0
  // (InvalidLessonCount) and anything above 255 overflows the byte. Fail closed
  // BEFORE building any create/update params so a malformed content value can
  // never reach the signer. (v-next still sends lesson_count on create; the
  // update path derives live-lesson changes from the active_lessons mask.)
  if (!isValidLessonCount(course.lessonCount)) {
    return NextResponse.json(
      {
        error: `Course lessonCount must be an integer in 1..=255 (got ${String(
          course.lessonCount
        )})`,
      },
      { status: 400 }
    );
  }

  const connection = new Connection(serverEnv.SOLANA_RPC_URL, "confirmed");
  const [coursePda] = findCoursePDA(courseId, getProgramId());
  const accountInfo = await connection.getAccountInfo(coursePda);

  if (!accountInfo) {
    // Resolve prerequisite PDA if configured
    let prerequisitePda: string | undefined;
    if (course.prerequisiteCourse) {
      const [prereqPda] = findCoursePDA(
        course.prerequisiteCourse._id,
        getProgramId()
      );
      const prereqInfo = await connection.getAccountInfo(prereqPda);
      if (!prereqInfo) {
        return NextResponse.json(
          {
            error: `Prerequisite course "${course.prerequisiteCourse.title}" is not yet deployed on-chain`,
          },
          { status: 400 }
        );
      }
      prerequisitePda = prereqPda.toBase58();
    }

    // Resolve the on-chain creator directly from the course's `creator` wallet
    // (issue #478 — `course.creator`, projected by getAllCoursesAdmin). `Course.
    // creator` is a Pubkey set once at create_course and is immutable, so this
    // must be a real, on-curve address — an off-curve owner (a PDA) cannot hold
    // the creator-reward ATA. There is NO platform-authority fallback: a course
    // with no creator, or an invalid wallet, fails loudly here rather than
    // silently deploying rewards to the wrong key.
    const creatorWallet = course.creatorWallet ?? undefined;
    if (!creatorWallet) {
      return NextResponse.json(
        {
          error:
            "Course has no creator wallet — set course.creator to a wallet",
        },
        { status: 400 }
      );
    }
    try {
      const pk = new PublicKey(creatorWallet);
      if (!PublicKey.isOnCurve(pk.toBytes())) {
        throw new Error("off-curve");
      }
    } catch {
      return NextResponse.json(
        {
          error: `Instructor wallet "${creatorWallet}" is not a valid on-curve Solana address`,
        },
        { status: 400 }
      );
    }

    // Honor exactly what the content sets (the content-schema and the projector
    // both default these to 0), so the deploy value and the drift engine's
    // comparison — which also treats absent as 0 — never disagree.
    const creatorRewardXp = course.creatorRewardXp ?? 0;

    const result = await deployCoursePda({
      courseId,
      lessonCount: course.lessonCount,
      difficulty: difficultyToNumber(course.difficulty),
      xpPerLesson: course.xpPerLesson ?? 10,
      trackId: course.trackId ?? 0,
      trackLevel: course.trackLevel ?? 0,
      prerequisitePda,
      creatorWallet,
      creatorRewardXp,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Deployment failed" },
        { status: 500 }
      );
    }

    // Create the Metaplex Core collection for this course's credential NFTs.
    // Failure here does NOT roll back the Course PDA — the admin can retry.
    let trackCollectionAddress: string | undefined;
    // Set when the collection exists but its on-chain binding did not land, so
    // the admin sees the course needs a re-sync (credential mint reverts with
    // CollectionMismatch until course.collection is bound).
    let collectionWarning: string | undefined;
    try {
      const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/certificates/metadata/${courseId}`;
      const collectionResult = await deployCourseTrackCollection({
        courseId,
        courseName: course.title,
        metadataUri,
      });
      if (collectionResult.success && collectionResult.collectionAddress) {
        trackCollectionAddress = collectionResult.collectionAddress;
        await writeCourseTrackCollection(courseId, trackCollectionAddress);
        // Bind the collection on-chain so credential mint can validate it.
        const bindResult = await setCourseCollectionPda(
          courseId,
          trackCollectionAddress
        );
        if (!bindResult.success) {
          console.error(
            "[admin/courses/sync] Binding collection on-chain failed:",
            bindResult.error
          );
          collectionWarning = `Collection created but on-chain binding failed: ${bindResult.error ?? "unknown error"}. Re-sync to retry.`;
        }
      } else {
        console.error(
          "[admin/courses/sync] Collection creation failed:",
          collectionResult.error
        );
        collectionWarning = `Collection creation failed: ${collectionResult.error ?? "unknown error"}. Re-sync to retry.`;
      }
    } catch (collectionErr) {
      console.error(
        "[admin/courses/sync] Collection creation threw:",
        collectionErr
      );
      collectionWarning = `Collection creation threw: ${collectionErr instanceof Error ? collectionErr.message : String(collectionErr)}. Re-sync to retry.`;
    }

    try {
      await writeCourseOnChainStatus(
        courseId,
        "synced",
        coursePda.toBase58(),
        result.signature!
      );
    } catch (mutationErr) {
      console.error(
        "[admin/courses/sync] deployment write-back failed:",
        mutationErr
      );
    }

    // The course is now "synced" in Sanity — purge the catalog cache so it
    // appears immediately instead of after the 1h ISR window.
    revalidateTag(COURSES_CACHE_TAG);

    return NextResponse.json({
      action: "created",
      txSignature: result.signature,
      coursePda: coursePda.toBase58(),
      trackCollectionAddress,
      ...(collectionWarning ? { warning: collectionWarning } : {}),
    });
  }

  // Course PDA exists — ensure the Metaplex collection was created AND bound
  // on-chain. The bind can silently fail on a prior sync (collection created,
  // course.collection left as Pubkey::default()), which makes credential mint
  // revert with CollectionMismatch. Read the real on-chain binding rather than
  // trusting the Sanity field so a partially-synced course can self-heal.
  let trackCollectionAddress = course.trackCollectionAddress;
  let collectionWarning: string | undefined;

  // fetchCourse uses the raw-IDL BorshCoder → snake_case `collection`, returned
  // as a base58 string or raw bytes. Normalize before comparing to default.
  // A pre-migration 192-byte Course account fails to decode against the current
  // 224-byte layout — surface that as a clear 400 rather than an opaque 500.
  let onChainCourse: Awaited<ReturnType<typeof fetchCourse>>;
  try {
    onChainCourse = await fetchCourse(courseId, connection, getProgramId());
  } catch {
    return NextResponse.json(
      {
        error:
          "Course on-chain account is stale (pre-migration 192-byte layout). Re-create it via create_course before re-syncing.",
      },
      { status: 400 }
    );
  }
  const onChainCollection = onChainCourse?.collection as
    | string
    | Uint8Array
    | undefined;
  const boundCollection =
    onChainCollection == null
      ? null
      : typeof onChainCollection === "string"
        ? onChainCollection
        : new PublicKey(onChainCollection).toBase58();
  const isUnbound =
    boundCollection == null || boundCollection === PublicKey.default.toBase58();

  if (!trackCollectionAddress || isUnbound) {
    try {
      // Only create a new collection when none exists in Sanity — recreating
      // one would orphan any credentials already minted into the old address.
      if (!trackCollectionAddress) {
        const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/certificates/metadata/${courseId}`;
        const collectionResult = await deployCourseTrackCollection({
          courseId,
          courseName: course.title,
          metadataUri,
        });
        if (collectionResult.success && collectionResult.collectionAddress) {
          trackCollectionAddress = collectionResult.collectionAddress;
          await writeCourseTrackCollection(courseId, trackCollectionAddress);
        } else {
          console.error(
            "[admin/courses/sync] Collection retry failed:",
            collectionResult.error
          );
          collectionWarning = `Collection creation failed: ${collectionResult.error ?? "unknown error"}. Re-sync to retry.`;
        }
      }

      // Bind on-chain whenever the collection exists but course.collection is
      // still unset — this is the self-heal path for a previously-failed bind.
      if (trackCollectionAddress && isUnbound) {
        const bindResult = await setCourseCollectionPda(
          courseId,
          trackCollectionAddress
        );
        if (!bindResult.success) {
          console.error(
            "[admin/courses/sync] Binding collection on-chain failed:",
            bindResult.error
          );
          collectionWarning = `Collection created but on-chain binding failed: ${bindResult.error ?? "unknown error"}. Re-sync to retry.`;
        }
      }
    } catch (collectionErr) {
      console.error(
        "[admin/courses/sync] Collection retry threw:",
        collectionErr
      );
      collectionWarning = `Collection sync threw: ${collectionErr instanceof Error ? collectionErr.message : String(collectionErr)}. Re-sync to retry.`;
    }
  }

  // Update mutable fields
  const updateParams: {
    courseId: string;
    newXpPerLesson?: number;
    newCreatorRewardXp?: number;
    newActiveLessons?: [bigint, bigint, bigint, bigint];
    contentTxId?: number[];
  } = { courseId };
  const updatedFields: string[] = [];

  // §11.0 content commitment + v-next live-lesson mask. When the panel sends its
  // intended active_lessons mask, load the committed lockfile INDEPENDENTLY (from
  // the synced tree) and assert the two agree right before signing — update_course
  // trusts the authority blindly, so this is where the "slots never reused"
  // invariant is enforced. The asserted mask is written on-chain via
  // new_active_lessons AND the git SHA is committed into content_tx_id in the SAME
  // update (v-next exposes new_active_lessons; this replaces v1's count-based
  // new_lesson_count grow).
  if (activeLessons || commitContent) {
    let commit: ReturnType<typeof buildCourseCommit>;
    try {
      const { contentSha, slotsLock } = readCourseSlotsLock(courseId);
      // `commitContent` (no explicit mask) derives the mask from the lockfile;
      // an explicit `activeLessons` is still cross-checked against it, so the
      // "slots never reused" invariant holds on both paths.
      const maskToSend = activeLessons ?? deriveActiveMask(slotsLock);
      commit = buildCourseCommit({
        courseId,
        contentSha,
        slotsLock,
        activeLessons: maskToSend,
      });
    } catch (e) {
      if (e instanceof MaskMismatchError) {
        return NextResponse.json({ error: e.message }, { status: 409 });
      }
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : "Failed to load committed lockfile",
        },
        { status: 409 }
      );
    }
    updateParams.contentTxId = commit.contentTxId;
    updatedFields.push("contentTxId");
    // v-next: write the (lockfile-asserted) mask on-chain in the same update.
    updateParams.newActiveLessons = commit.activeLessons;
    updatedFields.push("newActiveLessons");
  }

  if (course.xpPerLesson !== null) {
    updateParams.newXpPerLesson = course.xpPerLesson;
    updatedFields.push("newXpPerLesson");
  }
  if (course.creatorRewardXp !== null) {
    updateParams.newCreatorRewardXp = course.creatorRewardXp;
    updatedFields.push("newCreatorRewardXp");
  }
  // v-next drops `new_min_completions_for_reward` and the count-based
  // `new_lesson_count` grow entirely. Live-lesson changes (add / retire /
  // reorder) now flow ONLY through `new_active_lessons` above — the mask the
  // panel sends, cross-checked against the committed slots.lock.json. A sync
  // that carries no mask leaves the on-chain live-lesson set untouched.

  if (updatedFields.length === 0) {
    // Even if no fields changed, sync the PDA address to Sanity
    // (needed after fresh deploys where the program ID changed)
    const knownPda = course.onChainStatus?.coursePda;
    if (knownPda !== coursePda.toBase58()) {
      try {
        await writeCourseOnChainStatus(
          courseId,
          "synced",
          coursePda.toBase58(),
          "noop"
        );
      } catch (mutationErr) {
        console.error(
          "[admin/courses/sync] deployment PDA write-back failed:",
          mutationErr
        );
      }
    } else {
      // PDA already recorded and correct — the course is fully synced. The
      // `synced` write above clears the maintenance gate in the other branch;
      // here there is no status change, so clear it directly so a stale gate
      // from a prior interrupted recreate can never strand this course
      // write-dead. (WS-2 F1 defense-in-depth — closes the stuck-gate residual
      // even if the compile projector's reward-field defaults ever change.)
      try {
        await writeCourseMaintenanceFlag(courseId, false);
      } catch (mutationErr) {
        console.error(
          "[admin/courses/sync] maintenance-gate clear failed:",
          mutationErr
        );
      }
    }
    revalidateTag(COURSES_CACHE_TAG);
    return NextResponse.json({
      action: "noop",
      message: "Already synced",
      trackCollectionAddress: trackCollectionAddress ?? null,
      ...(collectionWarning ? { warning: collectionWarning } : {}),
    });
  }

  const result = await updateCoursePda(updateParams);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Update failed" },
      { status: 500 }
    );
  }

  try {
    await writeCourseOnChainStatus(
      courseId,
      "synced",
      coursePda.toBase58(),
      result.signature!
    );
  } catch (mutationErr) {
    console.error(
      "[admin/courses/sync] deployment write-back failed:",
      mutationErr
    );
  }

  revalidateTag(COURSES_CACHE_TAG);
  return NextResponse.json({
    action: "updated",
    txSignature: result.signature,
    fieldsUpdated: updatedFields,
    ...(collectionWarning ? { warning: collectionWarning } : {}),
  });
}
