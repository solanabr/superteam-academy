import { NextResponse } from "next/server";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { isAdminRequest } from "@/lib/auth/admin";
import { getReadonlyProgram, getAccounts } from "@/lib/solana/program";
import { getBackendProgram } from "@/lib/solana/backend-signer";
import { findConfigPDA, findCoursePDA } from "@/lib/solana/pda";
import { connection } from "@/lib/solana/connection";
import { courses as staticCourses } from "@/lib/services/courses";
import { TRACK_TYPES } from "@/lib/constants";
import {
  parseAnchorError,
  isClientError,
} from "@/lib/solana/anchor-errors";

export interface AdminCourse {
  courseId: string;
  title: string;
  description: string;
  track: string;
  trackId: number;
  difficulty: number;
  lessonCount: number;
  xpPerLesson: number;
  creatorRewardXp: number;
  totalEnrollments: number;
  totalCompletions: number;
  isActive: boolean;
  onChain: boolean;
  publicKey: string | null;
}

export async function GET(req: Request) {
  try {
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const program = getReadonlyProgram(connection);
    const accounts = getAccounts(program);

    // Fetch on-chain courses
    let onChainCourses: Awaited<ReturnType<typeof accounts.course.all>> = [];
    try {
      onChainCourses = await accounts.course.all();
    } catch {
      // Program unavailable
    }

    // Build a map of on-chain courses by courseId
    const onChainMap = new Map<
      string,
      (typeof onChainCourses)[number]
    >();
    for (const c of onChainCourses) {
      onChainMap.set(c.account.courseId, c);
    }

    const result: AdminCourse[] = [];

    // Merge static courses with on-chain data
    for (const sc of staticCourses) {
      const oc = onChainMap.get(sc.id);
      if (oc) {
        const trackIdx = oc.account.trackId;
        result.push({
          courseId: oc.account.courseId,
          title: sc.title,
          description: sc.description,
          track:
            trackIdx < TRACK_TYPES.length
              ? TRACK_TYPES[trackIdx]
              : sc.track,
          trackId: trackIdx,
          difficulty: oc.account.difficulty,
          lessonCount: oc.account.lessonCount,
          xpPerLesson: oc.account.xpPerLesson,
          creatorRewardXp: oc.account.creatorRewardXp,
          totalEnrollments: oc.account.totalEnrollments,
          totalCompletions: oc.account.totalCompletions,
          isActive: oc.account.isActive,
          onChain: true,
          publicKey: oc.publicKey.toBase58(),
        });
        onChainMap.delete(sc.id);
      } else {
        const diffMap: Record<string, number> = {
          beginner: 0,
          intermediate: 1,
          advanced: 2,
        };
        result.push({
          courseId: sc.id,
          title: sc.title,
          description: sc.description,
          track: sc.track,
          trackId: TRACK_TYPES.indexOf(sc.track),
          difficulty: diffMap[sc.difficulty] ?? 0,
          lessonCount: sc.lessonCount,
          xpPerLesson:
            sc.lessonCount > 0
              ? Math.round(sc.xpReward / sc.lessonCount)
              : 0,
          creatorRewardXp: 0,
          totalEnrollments: sc.enrolledCount ?? 0,
          totalCompletions: sc.totalCompletions ?? 0,
          isActive: sc.isActive ?? true,
          onChain: false,
          publicKey: null,
        });
      }
    }

    // Add any on-chain courses not in the static list
    for (const [, oc] of onChainMap) {
      const trackIdx = oc.account.trackId;
      result.push({
        courseId: oc.account.courseId,
        title: oc.account.courseId,
        description: "",
        track:
          trackIdx < TRACK_TYPES.length
            ? TRACK_TYPES[trackIdx]
            : `track-${trackIdx}`,
        trackId: trackIdx,
        difficulty: oc.account.difficulty,
        lessonCount: oc.account.lessonCount,
        xpPerLesson: oc.account.xpPerLesson,
        creatorRewardXp: oc.account.creatorRewardXp,
        totalEnrollments: oc.account.totalEnrollments,
        totalCompletions: oc.account.totalCompletions,
        isActive: oc.account.isActive,
        onChain: true,
        publicKey: oc.publicKey.toBase58(),
      });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Admin courses GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!(await isAdminRequest(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      courseId,
      creator,
      lessonCount,
      difficulty,
      xpPerLesson,
      trackId,
      trackLevel,
      creatorRewardXp,
      minCompletionsForReward,
    } = body as {
      courseId?: string;
      creator?: string;
      lessonCount?: number;
      difficulty?: number;
      xpPerLesson?: number;
      trackId?: number;
      trackLevel?: number;
      creatorRewardXp?: number;
      minCompletionsForReward?: number;
    };

    if (!courseId || !creator) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, creator" },
        { status: 400 },
      );
    }

    const { program, signer } = getBackendProgram();
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(courseId);
    const creatorKey = new PublicKey(creator);

    const contentTxId = new Array(32).fill(0);

    const tx = await program.methods
      .createCourse({
        courseId,
        creator: creatorKey,
        contentTxId,
        lessonCount: lessonCount ?? 1,
        difficulty: difficulty ?? 0,
        xpPerLesson: xpPerLesson ?? 100,
        trackId: trackId ?? 0,
        trackLevel: trackLevel ?? 1,
        prerequisite: null,
        creatorRewardXp: creatorRewardXp ?? 0,
        minCompletionsForReward: minCompletionsForReward ?? 10,
      })
      .accounts({
        course: coursePDA,
        config: configPDA,
        authority: signer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc();

    return NextResponse.json({
      signature: tx,
      courseId,
      coursePDA: coursePDA.toBase58(),
    });
  } catch (err: unknown) {
    const anchor = parseAnchorError(err);
    if (anchor && isClientError(anchor.code)) {
      return NextResponse.json(
        { error: anchor.message, code: anchor.name },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Transaction failed";
    console.error("Admin courses POST error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
