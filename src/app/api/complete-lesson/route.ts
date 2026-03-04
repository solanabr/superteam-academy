import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { IDL } from "@/lib/idl";
import { getConfigPda, getCoursePda, getEnrollmentPda } from "@/lib/pda";
import {
  isLessonComplete,
  normalizeFlags,
  countCompletedLessons,
} from "@/lib/bitmap";
import { PROGRAM_ID, XP_MINT, getConnection } from "@/lib/anchor";
import type { ActionProof } from "@/lib/action-proof";
import {
  requireSameOrigin,
  verifyWalletActionProof,
} from "@/lib/server/request-security";
import { checkRateLimit } from "@/lib/server/rate-limit";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Anchor instruction discriminator = sha256("global:<name>")[0..8]. */
function anchorDiscriminator(name: string): Buffer {
  return Buffer.from(
    createHash("sha256").update(`global:${name}`).digest(),
  ).subarray(0, 8);
}

/**
 * Parse BACKEND_SIGNER_KEYPAIR env var.
 * Accepts two formats:
 *   - JSON array:  [1,2,3,...]   (solana-keygen output)
 *   - Base58:      5Kkx...       (bs58-encoded 64-byte secret key)
 * Never logs the raw value.
 */
function parseSigner(raw: string): Keypair {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    const arr = JSON.parse(trimmed) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  // bs58 is a direct dep of @coral-xyz/anchor; safe to require server-side.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bs58 = require("bs58") as { decode: (input: string) => Uint8Array };
  return Keypair.fromSecretKey(bs58.decode(trimmed));
}

// ─── POST /api/complete-lesson ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const sameOriginError = requireSameOrigin(req);
  if (sameOriginError) return sameOriginError;
  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    learner?: unknown;
    courseId?: unknown;
    lessonIndex?: unknown;
    testResults?: { passed?: boolean };
    proof?: ActionProof;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { learner, courseId, lessonIndex, testResults, proof } = body;

  // ── 1. Input validation ───────────────────────────────────────────────────
  if (!testResults?.passed) {
    return NextResponse.json({ error: "TEST_NOT_PASSED" }, { status: 400 });
  }
  if (typeof learner !== "string" || !learner) {
    return NextResponse.json({ error: "INVALID_LEARNER" }, { status: 400 });
  }
  if (typeof courseId !== "string" || !courseId) {
    return NextResponse.json({ error: "INVALID_COURSE_ID" }, { status: 400 });
  }
  if (
    typeof lessonIndex !== "number" ||
    !Number.isInteger(lessonIndex) ||
    lessonIndex < 0 ||
    lessonIndex > 255
  ) {
    return NextResponse.json(
      { error: "INVALID_LESSON_INDEX" },
      { status: 400 },
    );
  }

  let learnerPubkey: PublicKey;
  try {
    learnerPubkey = new PublicKey(learner);
  } catch {
    return NextResponse.json(
      { error: "INVALID_LEARNER_PUBKEY" },
      { status: 400 },
    );
  }

  // ── 2. Rate limit (1 req / learner+course+lesson / 5 s) ──────────────────
  const proofValid = verifyWalletActionProof({
    proof,
    action: "complete_lesson",
    learner,
    courseId,
    lessonIndex,
  });
  if (!proofValid) {
    return NextResponse.json({ error: "UNAUTHORIZED_ACTION" }, { status: 401 });
  }

  const rlKey = `${learner}:${courseId}:${lessonIndex}`;
  const rateLimit = await checkRateLimit({
    key: rlKey,
    windowMs: 5_000,
    maxRequests: 1,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 },
    );
  }

  // ── 3. Backend signer (never log the secret) ──────────────────────────────
  const signerRaw = process.env.BACKEND_SIGNER_KEYPAIR;
  if (!signerRaw) {
    return NextResponse.json(
      { error: "SIGNER_NOT_CONFIGURED" },
      { status: 500 },
    );
  }
  let backendKeypair: Keypair;
  try {
    backendKeypair = parseSigner(signerRaw);
  } catch (e) {
    console.error(
      "[complete-lesson] Failed to parse BACKEND_SIGNER_KEYPAIR:",
      e instanceof Error ? e.message : "parse error",
    );
    return NextResponse.json({ error: "SIGNER_INVALID" }, { status: 500 });
  }

  // ── 4. PDAs & connection ──────────────────────────────────────────────────
  const connection = getConnection();
  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learnerPubkey);

  // ── 5. Fetch on-chain accounts (read-only provider) ───────────────────────
  const dummyWallet = {
    publicKey: Keypair.generate().publicKey,
    signTransaction: async <T>(tx: T) => tx,
    signAllTransactions: async <T>(txs: T[]) => txs,
  };
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const program = new Program(IDL as any, provider);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrollment = await (program.account as any)["enrollment"].fetchNullable(
    enrollmentPda,
  );
  if (!enrollment) {
    return NextResponse.json(
      { error: "ENROLLMENT_NOT_FOUND" },
      { status: 404 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseData = await (program.account as any)["course"].fetchNullable(
    coursePda,
  );
  if (!courseData) {
    return NextResponse.json({ error: "COURSE_NOT_FOUND" }, { status: 404 });
  }

  // ── 6. Bounds check ───────────────────────────────────────────────────────
  const lessonCount = courseData.lessonCount as number;
  if (lessonIndex >= lessonCount) {
    return NextResponse.json(
      { error: "LESSON_OUT_OF_BOUNDS" },
      { status: 400 },
    );
  }

  // ── 7. Bitmap check — idempotency ─────────────────────────────────────────
  const flags = normalizeFlags(enrollment.lessonFlags as unknown);
  if (isLessonComplete(flags, lessonIndex)) {
    const completed = countCompletedLessons(flags);
    return NextResponse.json(
      {
        error: "ALREADY_COMPLETED",
        xpEarned: 0,
        lessonsCompleted: completed,
        totalLessons: lessonCount,
      },
      { status: 409 },
    );
  }

  // ── 8. Ensure learner XP ATA exists (Token-2022) ──────────────────────────
  const learnerAta = getAssociatedTokenAddressSync(
    XP_MINT,
    learnerPubkey,
    false,
    TOKEN_2022_PROGRAM_ID,
  );
  const ataInfo = await connection.getAccountInfo(learnerAta);
  const createAtaIx = ataInfo
    ? null
    : createAssociatedTokenAccountInstruction(
        backendKeypair.publicKey, // payer
        learnerAta,
        learnerPubkey,
        XP_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

  // ── 9. Build complete_lesson instruction (raw — IDL doesn't include it) ───
  //
  // Account order mirrors the Rust CompleteLesson struct field order:
  //   config (ro), course (ro), enrollment (rw), learner (ro),
  //   learner_token_account (rw), xp_mint (rw), backend_signer (signer), token_program (ro)
  const disc = anchorDiscriminator("complete_lesson");
  const ixData = Buffer.concat([disc, Buffer.from([lessonIndex])]);

  const completeLessonIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPda, isSigner: false, isWritable: false },
      { pubkey: coursePda, isSigner: false, isWritable: false },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: learnerPubkey, isSigner: false, isWritable: false },
      { pubkey: learnerAta, isSigner: false, isWritable: true },
      { pubkey: XP_MINT, isSigner: false, isWritable: true },
      { pubkey: backendKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: ixData,
  });

  // ── 10. Send transaction ──────────────────────────────────────────────────
  const tx = new Transaction();
  if (createAtaIx) tx.add(createAtaIx);
  tx.add(completeLessonIx);

  let txSignature: string;
  try {
    txSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [backendKeypair],
      {
        commitment: "confirmed",
      },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[complete-lesson] TX failed:", msg);
    return NextResponse.json({ error: "TX_FAILED" }, { status: 502 });
  }

  const xpPerLesson = courseData.xpPerLesson as number;
  const prevCompleted = countCompletedLessons(flags);

  return NextResponse.json({
    txSignature,
    xpEarned: xpPerLesson,
    lessonsCompleted: prevCompleted + 1,
    totalLessons: lessonCount,
  });
}
