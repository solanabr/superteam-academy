import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { createClient } from "@supabase/supabase-js";
import {
  PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
} from "@/lib/solana/program";
import { updateStreak } from "@/lib/streak";
import { sanityClient } from "@/lib/sanity/client";

const RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ?? "5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd",
);

const CREDENTIAL_COLLECTION = new PublicKey(
  process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "3kVGs49bDKKjwhP1B83QuQDdNnCcDPkMoyRGKBm6Nosb",
);

// Anchor discriminators (sha256("global:<fn_name>")[..8])
const COMPLETE_LESSON_DISC = Buffer.from([77, 217, 53, 132, 204, 150, 169, 58]);
const FINALIZE_COURSE_DISC = Buffer.from([68, 189, 122, 239, 39, 121, 16, 218]);
const ISSUE_CREDENTIAL_DISC = Buffer.from([255, 193, 171, 224, 68, 171, 194, 87]);
const CLOSE_ENROLLMENT_DISC = Buffer.from([236, 137, 133, 253, 91, 138, 217, 91]);

// CU budget for lesson completion batches
const CU_PER_LESSON = 20_000;
const CU_OVERHEAD = 10_000;
const MAX_CU = 1_400_000;

function getBackendSigner(): Keypair {
  const keyJson = process.env.BACKEND_SIGNER_KEY;
  if (!keyJson) throw new Error("BACKEND_SIGNER_KEY not configured");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyJson)));
}

function parseLessonFlags(accountData: Buffer): { flags: bigint[]; lessonCount: number } {
  // Borsh layout: 8 disc + 32 course + 8 enrolled_at + Option<i64> completed_at + [u64;4] lesson_flags
  // Option<i64>: None = 1 byte (0x00), Some = 9 bytes (0x01 + i64)
  const optionTag = accountData[48];
  const flagsOffset = 48 + 1 + (optionTag === 1 ? 8 : 0);
  const flags: bigint[] = [];
  for (let i = 0; i < 4; i++) {
    let val = BigInt(0);
    for (let b = 0; b < 8; b++) {
      val |= BigInt(accountData[flagsOffset + i * 8 + b]) << BigInt(b * 8);
    }
    flags.push(val);
  }
  // Count completed lessons from bitmap
  let lessonCount = 0;
  for (const w of flags) {
    let v = w;
    while (v > BigInt(0)) { v &= v - BigInt(1); lessonCount++; }
  }
  return { flags, lessonCount };
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
  COMPLETE_LESSON_DISC.copy(data, 0);
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

function buildFinalizeCourseIx(
  config: PublicKey,
  course: PublicKey,
  enrollment: PublicKey,
  learner: PublicKey,
  learnerTokenAccount: PublicKey,
  creatorTokenAccount: PublicKey,
  creator: PublicKey,
  xpMint: PublicKey,
  backendSigner: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: true },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: learnerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: false, isWritable: false },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: FINALIZE_COURSE_DISC,
  });
}

function buildIssueCredentialIx(
  config: PublicKey,
  course: PublicKey,
  enrollment: PublicKey,
  learner: PublicKey,
  credentialAsset: PublicKey,
  trackCollection: PublicKey,
  payer: PublicKey,
  backendSigner: PublicKey,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: bigint,
): TransactionInstruction {
  // Serialize: discriminator + name (borsh string) + metadata_uri (borsh string)
  //            + courses_completed (u32 LE) + total_xp (u64 LE)
  const nameBytes = Buffer.from(credentialName, "utf-8");
  const uriBytes = Buffer.from(metadataUri, "utf-8");

  const data = Buffer.alloc(
    8 + 4 + nameBytes.length + 4 + uriBytes.length + 4 + 8,
  );
  let offset = 0;

  ISSUE_CREDENTIAL_DISC.copy(data, offset);
  offset += 8;

  data.writeUInt32LE(nameBytes.length, offset);
  offset += 4;
  nameBytes.copy(data, offset);
  offset += nameBytes.length;

  data.writeUInt32LE(uriBytes.length, offset);
  offset += 4;
  uriBytes.copy(data, offset);
  offset += uriBytes.length;

  data.writeUInt32LE(coursesCompleted, offset);
  offset += 4;

  data.writeBigUInt64LE(totalXp, offset);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: false },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: credentialAsset, isSigner: true, isWritable: true },
      { pubkey: trackCollection, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
    ],
    data,
  });
}

function buildCloseEnrollmentIx(
  course: PublicKey,
  enrollment: PublicKey,
  learner: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: course, isSigner: false, isWritable: false },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: true, isWritable: true },
    ],
    data: CLOSE_ENROLLMENT_DISC,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, learnerWallet, userId, action } = body;

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

    // --- Confirm mode: frontend already sent the tx, update Supabase ---
    if (action === "confirm") {
      await supabase
        .from("course_progress")
        .update({
          is_finalized: true,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("course_id", courseId);

      await updateStreak(supabase, userId);
      return NextResponse.json({ success: true });
    }

    // --- Prepare mode: build partially-signed transactions ---

    // Check course progress in Supabase
    const { data: progress } = await supabase
      .from("course_progress")
      .select("completed_lessons, is_completed, is_finalized, xp_earned")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!progress) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 400 });
    }

    if (progress.is_finalized) {
      return NextResponse.json(
        { error: "Course already finalized", alreadyFinalized: true },
        { status: 200 },
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const backendKeypair = getBackendSigner();
    const learnerKey = new PublicKey(learnerWallet);

    // Fetch course title from Sanity for credential metadata
    const sanityCourse = await sanityClient.fetch<{ title: string } | null>(
      `*[_type == "course" && courseId == $courseId][0] { title }`,
      { courseId },
    );
    const courseTitle = sanityCourse?.title ?? courseId;

    const configPda = getConfigPda();
    const coursePda = getCoursePda(courseId);
    const enrollmentPda = getEnrollmentPda(courseId, learnerKey);

    // Read course + enrollment accounts
    const [courseAccount, enrollmentAccount] = await Promise.all([
      connection.getAccountInfo(coursePda),
      connection.getAccountInfo(enrollmentPda),
    ]);
    if (!courseAccount) {
      return NextResponse.json({ error: "Course not found on-chain" }, { status: 404 });
    }
    if (!enrollmentAccount) {
      return NextResponse.json({ error: "Enrollment not found on-chain" }, { status: 404 });
    }
    const courseData = courseAccount.data;
    const courseIdLen = courseData.readUInt32LE(8);
    const creatorOffset = 8 + 4 + courseIdLen;
    const creator = new PublicKey(courseData.subarray(creatorOffset, creatorOffset + 32));

    // Parse on-chain lesson_count + xp_per_lesson from Course account
    // Layout: 8 disc + (4+len) course_id + 32 creator + 32 content_tx_id + 2 version + 1 lesson_count + 1 difficulty + 4 xp_per_lesson
    const lessonCountOffset = 8 + 4 + courseIdLen + 32 + 32 + 2;
    const onChainLessonCount = courseData.readUInt8(lessonCountOffset);
    const xpPerLesson = courseData.readUInt32LE(lessonCountOffset + 2); // skip difficulty (u8)

    const learnerTokenAccount = getAssociatedTokenAddressSync(
      XP_MINT, learnerKey, true, TOKEN_2022_PROGRAM_ID,
    );
    const creatorTokenAccount = getAssociatedTokenAddressSync(
      XP_MINT, creator, true, TOKEN_2022_PROGRAM_ID,
    );

    // Check which lessons still need on-chain completion
    const { flags } = parseLessonFlags(enrollmentAccount.data);
    const pendingIndices: number[] = [];
    for (let i = 0; i < onChainLessonCount; i++) {
      const wordIndex = Math.floor(i / 64);
      const bitIndex = i % 64;
      if ((flags[wordIndex] & (BigInt(1) << BigInt(bitIndex))) === BigInt(0)) {
        pendingIndices.push(i);
      }
    }

    // Build lesson completion txs if any lessons are pending
    const lessonCompletionTxs: string[] = [];
    if (pendingIndices.length > 0) {
      const createLearnerAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        learnerKey, learnerTokenAccount, learnerKey, XP_MINT, TOKEN_2022_PROGRAM_ID,
      );
      const lessonIxs = pendingIndices.map((idx) =>
        buildCompleteLessonIx(
          idx, configPda, coursePda, enrollmentPda,
          learnerKey, learnerTokenAccount, XP_MINT, backendKeypair.publicKey,
        ),
      );
      const maxPerTx = Math.floor((MAX_CU - CU_OVERHEAD) / CU_PER_LESSON);
      for (let i = 0; i < lessonIxs.length; i += maxPerTx) {
        const batch = lessonIxs.slice(i, i + maxPerTx);
        const totalCU = CU_OVERHEAD + batch.length * CU_PER_LESSON;
        const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: totalCU });
        const { blockhash: bh } = await connection.getLatestBlockhash("confirmed");
        const msg = new TransactionMessage({
          payerKey: learnerKey,
          recentBlockhash: bh,
          instructions: [computeBudgetIx, createLearnerAtaIx, ...batch],
        }).compileToV0Message();
        const tx = new VersionedTransaction(msg);
        tx.sign([backendKeypair]);
        lessonCompletionTxs.push(Buffer.from(tx.serialize()).toString("base64"));
      }
    }

    // Build finalize tx — learner pays tx fee
    const createLearnerAta = createAssociatedTokenAccountIdempotentInstruction(
      learnerKey, learnerTokenAccount, learnerKey, XP_MINT, TOKEN_2022_PROGRAM_ID,
    );
    const createCreatorAta = createAssociatedTokenAccountIdempotentInstruction(
      learnerKey, creatorTokenAccount, creator, XP_MINT, TOKEN_2022_PROGRAM_ID,
    );

    const finalizeIx = buildFinalizeCourseIx(
      configPda, coursePda, enrollmentPda,
      learnerKey, learnerTokenAccount,
      creatorTokenAccount, creator,
      XP_MINT, backendKeypair.publicKey,
    );

    const { blockhash } =
      await connection.getLatestBlockhash("confirmed");

    const finalizeMsg = new TransactionMessage({
      payerKey: learnerKey,
      recentBlockhash: blockhash,
      instructions: [createLearnerAta, createCreatorAta, finalizeIx],
    }).compileToV0Message();

    const finalizeTx = new VersionedTransaction(finalizeMsg);
    finalizeTx.sign([backendKeypair]);

    // Build credential + close_enrollment tx (auto-close reclaims rent)
    const closeIx = buildCloseEnrollmentIx(coursePda, enrollmentPda, learnerKey);
    let credentialTxBase64: string | null = null;
    let credentialAssetAddress: string | null = null;
    try {
      const credentialKeypair = Keypair.generate();
      const totalXp = BigInt(onChainLessonCount * xpPerLesson);

      const issueIx = buildIssueCredentialIx(
        configPda, coursePda, enrollmentPda,
        learnerKey, credentialKeypair.publicKey,
        CREDENTIAL_COLLECTION,
        learnerKey,                // payer = learner
        backendKeypair.publicKey,  // backend_signer
        `${courseTitle} — Superteam Academy`,
        `${process.env.NEXT_PUBLIC_PRODUCTION_URL}/api/metadata/credential/${courseId}`,
        1,
        totalXp,
      );

      const { blockhash: bh2 } =
        await connection.getLatestBlockhash("confirmed");

      // Credential first, then close enrollment to reclaim rent
      const credMsg = new TransactionMessage({
        payerKey: learnerKey,
        recentBlockhash: bh2,
        instructions: [issueIx, closeIx],
      }).compileToV0Message();

      const credTx = new VersionedTransaction(credMsg);
      credTx.sign([backendKeypair, credentialKeypair]);

      credentialTxBase64 = Buffer.from(credTx.serialize()).toString("base64");
      credentialAssetAddress = credentialKeypair.publicKey.toBase58();
    } catch (err) {
      console.error("Failed to build credential tx:", err);
    }

    // Standalone close_enrollment tx if credential build failed
    let closeEnrollmentTxBase64: string | null = null;
    if (!credentialTxBase64) {
      const { blockhash: bh3 } = await connection.getLatestBlockhash("confirmed");
      const closeMsg = new TransactionMessage({
        payerKey: learnerKey,
        recentBlockhash: bh3,
        instructions: [closeIx],
      }).compileToV0Message();
      const closeTx = new VersionedTransaction(closeMsg);
      closeEnrollmentTxBase64 = Buffer.from(closeTx.serialize()).toString("base64");
    }

    return NextResponse.json({
      success: true,
      lessonCompletionTxs,
      pendingLessons: pendingIndices.length,
      finalizeTx: Buffer.from(finalizeTx.serialize()).toString("base64"),
      credentialTx: credentialTxBase64,
      credentialAssetAddress,
      closeEnrollmentTx: closeEnrollmentTxBase64,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("finalize-course API error:", message);

    if (message.includes("CourseAlreadyFinalized")) {
      return NextResponse.json(
        { error: "Course already finalized on-chain", alreadyFinalized: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Failed to finalize course", details: message },
      { status: 500 },
    );
  }
}
