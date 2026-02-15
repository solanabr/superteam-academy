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
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";

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

  // Step 1: Initialize Config (idempotent)
  let config = await fetchConfig();
  if (!config) {
    const tx = await buildInitializeTx(program, authority, 2000, 1000);
    tx.feePayer = authority;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);
    results.push(`initialize: ${sig}`);
    config = await fetchConfig();
  } else {
    results.push("initialize: already exists");
  }

  // Step 2: Create Season 1 (idempotent)
  if (config && config.currentSeason === 0) {
    const mintKeypair = Keypair.generate();
    const { tx } = await buildCreateSeasonTx(program, authority, mintKeypair, 1);
    tx.feePayer = authority;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair, mintKeypair]);
    results.push(`create_season(1): ${sig}`);
    config = await fetchConfig();
  } else {
    results.push(`create_season: already at season ${config?.currentSeason}`);
  }

  // Step 3: Create courses (idempotent)
  for (const course of SAMPLE_COURSES) {
    const existing = await fetchCourse(course.id);
    if (existing) {
      results.push(`create_course(${course.id}): already exists`);
      continue;
    }

    const tx = await buildCreateCourseTx(program, authority, {
      courseId: course.id,
      creator: authority,
      contentTxId: new Array(32).fill(0),
      contentType: 0,
      lessonCount: course.lessonCount,
      challengeCount: course.challengeCount,
      difficulty: DIFFICULTY_MAP[course.difficulty] ?? 1,
      xpTotal: course.xpTotal,
      trackId: course.trackId,
      trackLevel: course.trackLevel,
      prerequisite: null,
      completionRewardXp: 50,
      minCompletionsForReward: 5,
    });
    tx.feePayer = authority;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);
    results.push(`create_course(${course.id}): ${sig}`);
  }

  return NextResponse.json({ ok: true, results });
}
