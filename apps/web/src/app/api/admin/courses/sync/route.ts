import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { getAllCoursesAdmin } from "@/lib/sanity/queries";
import { fetchCourse } from "@/lib/solana/academy-reads";
import { findCoursePDA, getProgramId } from "@/lib/solana/pda";
import {
  deployCoursePda,
  updateCoursePda,
  deployCourseTrackCollection,
  setCourseCollectionPda,
} from "@/lib/solana/admin-signer";
import {
  difficultyToNumber,
  getMissingCourseFields,
  isDraftId,
} from "@/lib/admin/sync-diff";
import {
  writeCourseOnChainStatus,
  writeCourseTrackCollection,
} from "@/lib/sanity/admin-mutations";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  let courseId: string;
  try {
    const body = (await req.json()) as { courseId?: unknown };
    if (typeof body.courseId !== "string" || !body.courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 400 }
      );
    }
    courseId = body.courseId;
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
      { error: "Course not found in Sanity" },
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

    const result = await deployCoursePda({
      courseId,
      lessonCount: course.lessonCount,
      difficulty: difficultyToNumber(course.difficulty),
      xpPerLesson: course.xpPerLesson ?? 10,
      trackId: course.trackId ?? 0,
      trackLevel: course.trackLevel ?? 0,
      prerequisitePda,
      creatorRewardXp: course.creatorRewardXp ?? 0,
      minCompletionsForReward: course.minCompletionsForReward ?? 0,
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
        "[admin/courses/sync] Sanity write-back failed:",
        mutationErr
      );
    }

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
  const onChainCourse = await fetchCourse(courseId, connection, getProgramId());
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
    newMinCompletionsForReward?: number;
  } = { courseId };
  const updatedFields: string[] = [];

  if (course.xpPerLesson !== null) {
    updateParams.newXpPerLesson = course.xpPerLesson;
    updatedFields.push("newXpPerLesson");
  }
  if (course.creatorRewardXp !== null) {
    updateParams.newCreatorRewardXp = course.creatorRewardXp;
    updatedFields.push("newCreatorRewardXp");
  }
  if (course.minCompletionsForReward !== null) {
    updateParams.newMinCompletionsForReward = course.minCompletionsForReward;
    updatedFields.push("newMinCompletionsForReward");
  }

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
          "[admin/courses/sync] Sanity PDA write-back failed:",
          mutationErr
        );
      }
    }
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
      "[admin/courses/sync] Sanity write-back failed:",
      mutationErr
    );
  }

  return NextResponse.json({
    action: "updated",
    txSignature: result.signature,
    fieldsUpdated: updatedFields,
    ...(collectionWarning ? { warning: collectionWarning } : {}),
  });
}
