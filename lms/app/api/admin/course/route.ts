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
import { uploadJson, txIdToBytes } from "@/lib/arweave";

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
    courseContent,
    // Content metadata fields
    title,
    slug,
    description,
    thumbnail,
    duration,
    modules,
  } = await req.json();

  if (!courseId || !lessonCount) {
    return NextResponse.json(
      { error: "missing courseId or lessonCount" },
      { status: 400 },
    );
  }

  let creatorAddress: string;
  let sig: string | null = null;
  let onChainAddress: string | null = null;
  let onChainError: string | null = null;

  // Upload course content to Arweave if provided
  let contentTxIdBytes = new Array(32).fill(0);
  let contentTxId: string | undefined;
  if (courseContent) {
    try {
      const result = await uploadJson(courseContent, [
        { name: "App-Name", value: "Superteam-Academy" },
        { name: "Content-Kind", value: "course-content" },
        { name: "Course-Id", value: courseId },
      ]);
      contentTxId = result.txId;
      contentTxIdBytes = txIdToBytes(result.txId);
    } catch (err: any) {
      console.warn("[course/POST] arweave upload failed:", err?.message);
    }
  }

  // Try on-chain creation (non-blocking — saves to DB regardless)
  try {
    const connection = getConnection();
    const backendKeypair = getBackendSigner();
    const program = getBackendProgram(backendKeypair);

    const creatorPubkey = creator
      ? new PublicKey(creator)
      : backendKeypair.publicKey;
    creatorAddress = creatorPubkey.toBase58();

    const tx = await buildCreateCourseTx(program, backendKeypair.publicKey, {
      courseId,
      creator: creatorPubkey,
      contentTxId: contentTxIdBytes,
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
    sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

    const [pda] = getCoursePDA(courseId);
    onChainAddress = pda.toBase58();
  } catch (err: any) {
    onChainError = err?.message ?? "unknown on-chain error";
    creatorAddress = creator || "unknown";
    console.warn("[course/POST] on-chain tx failed:", onChainError);
  }

  // Count challenges from modules if provided
  let challengeCount = 0;
  let computedLessonCount = Number(lessonCount);
  if (modules && Array.isArray(modules)) {
    computedLessonCount = 0;
    for (const m of modules) {
      if (m.lessons && Array.isArray(m.lessons)) {
        computedLessonCount += m.lessons.length;
        challengeCount += m.lessons.filter(
          (l: any) => l.type === "challenge",
        ).length;
      }
    }
  }

  const difficultyLabel =
    Number(difficulty) === 3
      ? "advanced"
      : Number(difficulty) === 2
        ? "intermediate"
        : "beginner";

  // Always save to MongoDB
  await connectDB();
  await CourseModel.findOneAndUpdate(
    { courseId },
    {
      $setOnInsert: {
        courseId,
        slug: slug || courseId,
        title: title || courseId,
        description: description || "",
        thumbnail: thumbnail || undefined,
        creator: creatorAddress,
        difficulty: difficultyLabel,
        lessonCount: computedLessonCount,
        challengeCount,
        xpTotal: Number(xpPerLesson || 100) * computedLessonCount,
        trackId: Number(trackId) || 0,
        trackLevel: Number(trackLevel) || 1,
        duration: duration || "",
        isActive: true,
        modules: modules || [],
        createdAt: new Date().toISOString(),
      },
      $set: {
        ...(sig && { onChainTxHash: sig }),
        ...(onChainAddress && { onChainAddress }),
        ...(contentTxId && { contentTxId }),
      },
    },
    { upsert: true },
  );

  return NextResponse.json({
    ok: true,
    txSignature: sig,
    contentTxId,
    onChainAddress,
    onChainError,
    savedToDb: true,
  });
}

export async function PUT(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const {
    courseId,
    newContentTxId,
    newCourseContent,
    newIsActive,
    newXpPerLesson,
    newCreatorRewardXp,
    newMinCompletionsForReward,
  } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: "missing courseId" }, { status: 400 });
  }

  // Upload new course content to Arweave if provided
  let contentTxIdBytes: number[] | null = newContentTxId ?? null;
  let contentTxIdString: string | undefined;
  if (newCourseContent) {
    try {
      const result = await uploadJson(newCourseContent, [
        { name: "App-Name", value: "Superteam-Academy" },
        { name: "Content-Kind", value: "course-content" },
        { name: "Course-Id", value: courseId },
      ]);
      contentTxIdString = result.txId;
      contentTxIdBytes = txIdToBytes(result.txId);
    } catch (err: any) {
      console.warn("[course/PUT] arweave upload failed:", err?.message);
    }
  }

  // Try on-chain update
  let sig: string | null = null;
  let onChainError: string | null = null;
  try {
    const connection = getConnection();
    const backendKeypair = getBackendSigner();
    const program = getBackendProgram(backendKeypair);

    const tx = await buildUpdateCourseTx(
      program,
      backendKeypair.publicKey,
      courseId,
      {
        newContentTxId: contentTxIdBytes,
        newIsActive: newIsActive ?? null,
        newXpPerLesson: newXpPerLesson ?? null,
        newCreatorRewardXp: newCreatorRewardXp ?? null,
        newMinCompletionsForReward: newMinCompletionsForReward ?? null,
      },
    );
    tx.feePayer = backendKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    sig = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);
  } catch (err: any) {
    onChainError = err?.message ?? "unknown on-chain error";
    console.warn("[course/PUT] on-chain tx failed:", onChainError);
  }

  // Always update MongoDB
  const dbUpdate: Record<string, any> = {};
  if (contentTxIdString) dbUpdate.contentTxId = contentTxIdString;
  if (newIsActive !== undefined && newIsActive !== null)
    dbUpdate.isActive = newIsActive;
  if (newXpPerLesson !== undefined && newXpPerLesson !== null)
    dbUpdate.xpPerLesson = newXpPerLesson;
  if (sig) dbUpdate.onChainTxHash = sig;

  if (Object.keys(dbUpdate).length > 0) {
    await connectDB();
    await CourseModel.findOneAndUpdate({ courseId }, { $set: dbUpdate });
  }

  return NextResponse.json({
    ok: true,
    txSignature: sig,
    contentTxId: contentTxIdString,
    onChainError,
  });
}
