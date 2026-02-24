import { NextResponse } from "next/server";
import { SystemProgram } from "@solana/web3.js";
import { getBackendProgram } from "@/lib/solana/backend-signer";
import { findConfigPDA, findCoursePDA } from "@/lib/solana/pda";
import { getSanityWriteClient } from "@/lib/sanity/write-client";
import { adminCourseDetailQuery } from "@/lib/sanity/admin-queries";
import {
  parseAnchorError,
  isIdempotentError,
  isClientError,
} from "@/lib/solana/anchor-errors";
import { TRACK_TYPES } from "@/lib/constants";
import type { TrackType, DifficultyLevel } from "@/lib/constants";
import { isAdminRequest } from "@/lib/auth/admin";

const DIFFICULTY_MAP: Record<DifficultyLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function trackIdFromName(track: string): number {
  const idx = TRACK_TYPES.indexOf(track as TrackType);
  return idx >= 0 ? idx : 0;
}

interface SanityModule {
  lessons?: { xpReward?: number }[];
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params;
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sanity = getSanityWriteClient();
    const course = await sanity.fetch(adminCourseDetailQuery, { id: courseId });
    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 },
      );
    }

    // Derive on-chain courseId from slug
    const onChainCourseId = course.slug as string;
    if (!onChainCourseId) {
      return NextResponse.json(
        { error: "Course slug is required for on-chain registration" },
        { status: 400 },
      );
    }

    // Count all lessons across modules
    const modules = (course.modules ?? []) as SanityModule[];
    const lessonCount = modules.reduce(
      (sum: number, m: SanityModule) => sum + (m.lessons?.length ?? 0),
      0,
    );
    if (lessonCount === 0) {
      return NextResponse.json(
        { error: "Course must have at least one lesson" },
        { status: 400 },
      );
    }

    // Calculate XP per lesson from total xpReward
    const totalXp = (course.xpReward as number) ?? 100;
    const xpPerLesson = Math.max(1, Math.floor(totalXp / lessonCount));

    const difficulty =
      DIFFICULTY_MAP[(course.difficulty as DifficultyLevel) ?? "beginner"] ?? 0;
    const trackId = trackIdFromName((course.track as string) ?? "rust");

    const { program, signer } = getBackendProgram();
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(onChainCourseId);

    // 32-byte content_tx_id placeholder (all zeros)
    const contentTxId = new Array(32).fill(0);

    const createCourseParams = {
      courseId: onChainCourseId,
      creator: signer.publicKey,
      contentTxId,
      lessonCount,
      difficulty,
      xpPerLesson,
      trackId,
      trackLevel: 1,
      prerequisite: null,
      creatorRewardXp: Math.floor(totalXp * 0.1),
      minCompletionsForReward: 10,
    };

    const tx = await program.methods
      .createCourse(createCourseParams)
      .accounts({
        course: coursePDA,
        config: configPDA,
        authority: signer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc();

    return NextResponse.json({
      success: true,
      signature: tx,
      coursePDA: coursePDA.toBase58(),
      courseId: onChainCourseId,
    });
  } catch (err: unknown) {
    const anchor = parseAnchorError(err);
    if (anchor && isIdempotentError(anchor.code)) {
      return NextResponse.json({
        alreadyDone: true,
        message: anchor.message,
      });
    }
    if (anchor && isClientError(anchor.code)) {
      return NextResponse.json(
        { error: anchor.message, code: anchor.name },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "On-chain registration failed";
    console.error("register-onchain error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
