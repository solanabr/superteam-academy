import { NextRequest, NextResponse } from "next/server";
import { Keypair, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import { fetchConfig, fetchCourse } from "@/lib/solana/readers";
import {
  buildInitializeTx,
  buildCreateSeasonTx,
  buildCreateCourseTx,
} from "@/lib/solana/transactions";
import { getCoursePDA } from "@/lib/solana/pda";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { connectDB } from "@/lib/db/mongodb";
import { CourseModel } from "@/lib/db/models/course";

const DIFFICULTY_MAP: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);
  const authority = backendKeypair.publicKey;
  const results: string[] = [];

  // Step 1: Initialize Config + XP Mint (idempotent)
  let config = await fetchConfig();
  if (!config) {
    const xpMintKeypair = Keypair.generate();
    const { tx } = await buildInitializeTx(program, authority, xpMintKeypair);
    tx.feePayer = authority;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const sig = await sendAndConfirmTransaction(connection, tx, [
      backendKeypair,
      xpMintKeypair,
    ]);
    results.push(`initialize: ${sig}`);
    config = await fetchConfig();
  } else {
    results.push("initialize: already exists");
  }

  // Step 2: Create Season 1 (idempotent)
  if (config && config.currentSeason === 0) {
    const mintKeypair = Keypair.generate();
    const { tx } = await buildCreateSeasonTx(
      program,
      authority,
      mintKeypair,
      1,
    );
    tx.feePayer = authority;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const sig = await sendAndConfirmTransaction(connection, tx, [
      backendKeypair,
      mintKeypair,
    ]);
    results.push(`create_season(1): ${sig}`);
    config = await fetchConfig();
  } else {
    results.push(`create_season: already at season ${config?.currentSeason}`);
  }

  // Step 3: Create courses (idempotent) + save to MongoDB
  await connectDB();
  for (const course of SAMPLE_COURSES) {
    const existing = await fetchCourse(course.id);
    let txSig: string | null = null;

    if (existing) {
      results.push(`create_course(${course.id}): already on-chain`);
    } else {
      const xpPerLesson = Math.floor(
        course.xpTotal / (course.lessonCount || 1),
      );
      const tx = await buildCreateCourseTx(program, authority, {
        courseId: course.id,
        creator: authority,
        contentTxId: new Array(32).fill(0),
        lessonCount: course.lessonCount,
        difficulty: DIFFICULTY_MAP[course.difficulty] ?? 1,
        xpPerLesson,
        trackId: course.trackId,
        trackLevel: course.trackLevel,
        prerequisite: null,
        creatorRewardXp: 50,
        minCompletionsForReward: 5,
      });
      tx.feePayer = authority;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      txSig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);
      results.push(`create_course(${course.id}): ${txSig}`);
    }

    // Upsert into MongoDB
    const [pda] = getCoursePDA(course.id);
    await CourseModel.findOneAndUpdate(
      { courseId: course.id },
      {
        $setOnInsert: {
          courseId: course.id,
          slug: course.slug,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          creator: course.creator,
          difficulty: course.difficulty,
          lessonCount: course.lessonCount,
          challengeCount: course.challengeCount,
          xpTotal: course.xpTotal,
          trackId: course.trackId,
          trackLevel: course.trackLevel,
          duration: course.duration,
          prerequisiteId: course.prerequisiteId,
          isActive: course.isActive,
          modules: course.modules,
          createdAt: course.createdAt,
        },
        $set: {
          onChainAddress: pda.toBase58(),
          ...(txSig ? { onChainTxHash: txSig } : {}),
        },
      },
      { upsert: true },
    );
  }

  return NextResponse.json({ ok: true, results });
}
