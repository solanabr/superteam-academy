import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { createClient } from "@supabase/supabase-js";
import {
  PROGRAM_ID,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
} from "@/lib/solana/program";
import { updateStreak } from "@/lib/streak";

const RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ?? "5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd",
);

// Anchor discriminator for global::complete_lesson
const COMPLETE_LESSON_DISCRIMINATOR = Buffer.from([
  77, 217, 53, 132, 204, 150, 169, 58,
]);

// ~15k CU per complete_lesson ix + ~6k for ATA create idempotent
const CU_PER_LESSON = 20_000;
const CU_OVERHEAD = 10_000;
const MAX_CU = 1_400_000;

function getBackendSigner(): Keypair {
  const keyJson = process.env.BACKEND_SIGNER_KEY;
  if (!keyJson) {
    throw new Error("BACKEND_SIGNER_KEY not configured");
  }
  const secretKey = Uint8Array.from(JSON.parse(keyJson));
  return Keypair.fromSecretKey(secretKey);
}

function buildCompleteLessonIx(
  lessonIndex: number,
  config: PublicKey,
  course: PublicKey,
  enrollment: PublicKey,
  learner: PublicKey,
  learnerTokenAccount: PublicKey,
  xpMint: PublicKey,
  backendSigner: PublicKey,
): TransactionInstruction {
  const data = Buffer.alloc(9);
  COMPLETE_LESSON_DISCRIMINATOR.copy(data, 0);
  data.writeUInt8(lessonIndex, 8);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: false },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: learnerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, learnerWallet, userId, action } = body;
    // Support both single lessonIndex and batch lessonIndices
    const lessonIndices: number[] = body.lessonIndices
      ?? (body.lessonIndex !== undefined ? [body.lessonIndex] : []);

    if (!courseId || !learnerWallet || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, learnerWallet, userId" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // --- Confirm mode: frontend already sent txs, update streak ---
    if (action === "confirm") {
      await updateStreak(supabase, userId);
      return NextResponse.json({ success: true });
    }

    if (lessonIndices.length === 0) {
      return NextResponse.json(
        { error: "Missing lessonIndices (or lessonIndex)" },
        { status: 400 },
      );
    }

    const { data: progress } = await supabase
      .from("course_progress")
      .select("completed_lessons")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!progress) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 400 },
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const backendKeypair = getBackendSigner();
    const learnerKey = new PublicKey(learnerWallet);

    const configPda = getConfigPda();
    const coursePda = getCoursePda(courseId);
    const enrollmentPda = getEnrollmentPda(courseId, learnerKey);

    const learnerTokenAccount = getAssociatedTokenAddressSync(
      XP_MINT, learnerKey, true, TOKEN_2022_PROGRAM_ID,
    );

    // Read enrollment on-chain to filter already-completed lessons
    const enrollmentAccount = await connection.getAccountInfo(enrollmentPda);
    let pendingIndices = lessonIndices;
    if (enrollmentAccount) {
      // Parse lesson_flags bitmap from enrollment account
      // Borsh layout: 8 disc + 32 course + 8 enrolled_at + Option<i64> completed_at + [u64;4] lesson_flags
      // Option<i64> is variable: None = 1 byte (0x00), Some = 9 bytes (0x01 + i64)
      const data = enrollmentAccount.data;
      const optionTag = data[48]; // 0 = None, 1 = Some
      const flagsOffset = 48 + 1 + (optionTag === 1 ? 8 : 0);
      const flags: bigint[] = [];
      for (let i = 0; i < 4; i++) {
        let val = BigInt(0);
        for (let b = 0; b < 8; b++) {
          val |= BigInt(data[flagsOffset + i * 8 + b]) << BigInt(b * 8);
        }
        flags.push(val);
      }
      pendingIndices = lessonIndices.filter((idx) => {
        const wordIndex = Math.floor(idx / 64);
        const bitIndex = idx % 64;
        return (flags[wordIndex] & (BigInt(1) << BigInt(bitIndex))) === BigInt(0);
      });
    }

    if (pendingIndices.length === 0) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        transactions: [],
        message: "All lessons already completed on-chain",
      });
    }

    // Build all complete_lesson ixs for pending lessons
    const lessonIxs = pendingIndices.map((idx) =>
      buildCompleteLessonIx(
        idx, configPda, coursePda, enrollmentPda,
        learnerKey, learnerTokenAccount, XP_MINT, backendKeypair.publicKey,
      ),
    );

    // Split into batches that fit within CU limit
    const maxPerTx = Math.floor((MAX_CU - CU_OVERHEAD) / CU_PER_LESSON);
    const batches: TransactionInstruction[][] = [];
    for (let i = 0; i < lessonIxs.length; i += maxPerTx) {
      batches.push(lessonIxs.slice(i, i + maxPerTx));
    }

    // Build partially-signed transactions — learner pays tx fee
    const transactions: string[] = [];
    for (const batch of batches) {
      const totalCU = CU_OVERHEAD + batch.length * CU_PER_LESSON;
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: totalCU,
      });

      const ataIx = createAssociatedTokenAccountIdempotentInstruction(
        learnerKey, learnerTokenAccount, learnerKey, XP_MINT, TOKEN_2022_PROGRAM_ID,
      );

      const { blockhash } =
        await connection.getLatestBlockhash("confirmed");

      const messageV0 = new TransactionMessage({
        payerKey: learnerKey, // learner pays tx fee
        recentBlockhash: blockhash,
        instructions: [computeBudgetIx, ataIx, ...batch],
      }).compileToV0Message();

      const tx = new VersionedTransaction(messageV0);
      tx.sign([backendKeypair]); // backend partial-signs

      transactions.push(Buffer.from(tx.serialize()).toString("base64"));
    }

    return NextResponse.json({
      success: true,
      transactions,
      pendingCount: pendingIndices.length,
      alreadyCompleted: false,
      message: `${transactions.length} transaction(s) prepared for ${pendingIndices.length} lesson(s)`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("complete-lesson API error:", message);

    return NextResponse.json(
      { error: "Failed to prepare lesson completion", details: message },
      { status: 500 },
    );
  }
}
