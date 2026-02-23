import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import {
  buildCreateCourseTx,
  buildUpdateCourseTx,
} from "@/lib/solana/transactions";
import { getCoursePDA } from "@/lib/solana/pda";
import { connectDB } from "@/lib/db/mongodb";
import { CourseModel } from "@/lib/db/models/course";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const {
    courseId,
    creator,
    lessonCount,
    difficulty,
    xpPerLesson,
    trackId,
    trackLevel,
    prerequisite,
    creatorRewardXp,
    minCompletionsForReward,
  } = await req.json();

  if (!courseId || !lessonCount) {
    return NextResponse.json(
      { error: "missing courseId or lessonCount" },
      { status: 400 },
    );
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);

  const creatorPubkey = creator
    ? new PublicKey(creator)
    : backendKeypair.publicKey;

  const tx = await buildCreateCourseTx(program, backendKeypair.publicKey, {
    courseId,
    creator: creatorPubkey,
    contentTxId: new Array(32).fill(0),
    lessonCount: Number(lessonCount),
    difficulty: Number(difficulty) || 1,
    xpPerLesson: Number(xpPerLesson) || 100,
    trackId: Number(trackId) || 0,
    trackLevel: Number(trackLevel) || 1,
    prerequisite: prerequisite ? new PublicKey(prerequisite) : null,
    creatorRewardXp: Number(creatorRewardXp) || 0,
    minCompletionsForReward: Number(minCompletionsForReward) || 0,
  });
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

  // Save to MongoDB
  const [pda] = getCoursePDA(courseId);
  await connectDB();
  await CourseModel.findOneAndUpdate(
    { courseId },
    {
      $setOnInsert: {
        courseId,
        slug: courseId,
        title: courseId,
        description: "",
        creator: creatorPubkey.toBase58(),
        difficulty:
          Number(difficulty) === 3
            ? "advanced"
            : Number(difficulty) === 2
              ? "intermediate"
              : "beginner",
        lessonCount: Number(lessonCount),
        challengeCount: 0,
        xpTotal: Number(xpPerLesson) * Number(lessonCount),
        trackId: Number(trackId) || 0,
        trackLevel: Number(trackLevel) || 1,
        duration: "",
        isActive: true,
        modules: [],
        createdAt: new Date().toISOString(),
      },
      $set: {
        onChainTxHash: sig,
        onChainAddress: pda.toBase58(),
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true, txSignature: sig });
}

export async function PUT(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const {
    courseId,
    newContentTxId,
    newIsActive,
    newXpPerLesson,
    newCreatorRewardXp,
    newMinCompletionsForReward,
  } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: "missing courseId" }, { status: 400 });
  }

  const connection = getConnection();
  const backendKeypair = getBackendSigner();
  const program = getBackendProgram(backendKeypair);

  const tx = await buildUpdateCourseTx(
    program,
    backendKeypair.publicKey,
    courseId,
    {
      newContentTxId: newContentTxId ?? null,
      newIsActive: newIsActive ?? null,
      newXpPerLesson: newXpPerLesson ?? null,
      newCreatorRewardXp: newCreatorRewardXp ?? null,
      newMinCompletionsForReward: newMinCompletionsForReward ?? null,
    },
  );
  tx.feePayer = backendKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

  return NextResponse.json({ ok: true, txSignature: sig });
}
