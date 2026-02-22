import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { getAllCoursesAdmin } from "@/lib/sanity/queries";
import { findCoursePDA, getProgramId } from "@/lib/solana/pda";
import {
  deployCoursePda,
  updateCoursePda,
  deployCourseTrackCollection,
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

  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
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
      } else {
        console.error(
          "[admin/courses/sync] Collection creation failed:",
          collectionResult.error
        );
      }
    } catch (collectionErr) {
      console.error(
        "[admin/courses/sync] Collection creation threw:",
        collectionErr
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
      action: "created",
      txSignature: result.signature,
      coursePda: coursePda.toBase58(),
      trackCollectionAddress,
    });
  }

  // Course PDA exists — update mutable fields
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
    return NextResponse.json({ action: "noop", message: "Already synced" });
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
  });
}
