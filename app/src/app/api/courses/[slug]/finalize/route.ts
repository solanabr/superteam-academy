import { NextResponse } from "next/server";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getBackendProgram } from "@/lib/solana/backend-signer";
import { getAccounts } from "@/lib/solana/program";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
} from "@/lib/solana/pda";
import { courses } from "@/lib/services/courses";
import {
  parseAnchorError,
  isIdempotentError,
  isClientError,
} from "@/lib/solana/anchor-errors";
import { withRetry } from "@/lib/solana/retry";

async function ensureATA(
  connection: import("@solana/web3.js").Connection,
  payer: import("@solana/web3.js").Keypair,
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    true,
    TOKEN_2022_PROGRAM_ID,
  );
  const info = await connection.getAccountInfo(ata);
  if (!info) {
    const ix = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ata,
      owner,
      mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(connection, tx, [payer]);
  }
  return ata;
}

/**
 * POST /api/courses/[slug]/finalize
 *
 * Resolves the course slug to a courseId, then executes the on-chain
 * `finalize_course` instruction via the backend signer.
 *
 * Body: { walletAddress: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const course = courses.find((c) => c.slug === slug);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { walletAddress } = body as { walletAddress?: string };

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress required" },
        { status: 400 },
      );
    }

    const { program, signer, connection } = getBackendProgram();
    const learnerKey = new PublicKey(walletAddress);
    const courseId = course.id;
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(courseId);
    const [enrollmentPDA] = findEnrollmentPDA(courseId, learnerKey);

    const accounts = getAccounts(program);
    const config = await accounts.config.fetch(configPDA);
    const xpMint = config.xpMint;

    const onChainCourse = await accounts.course.fetch(coursePDA);
    const creatorKey = onChainCourse.creator;

    const [learnerATA, creatorATA] = await Promise.all([
      ensureATA(connection, signer, xpMint, learnerKey),
      ensureATA(connection, signer, xpMint, creatorKey),
    ]);

    const tx = await withRetry(() =>
      program.methods
        .finalizeCourse()
        .accounts({
          config: configPDA,
          course: coursePDA,
          enrollment: enrollmentPDA,
          learner: learnerKey,
          learnerTokenAccount: learnerATA,
          creatorTokenAccount: creatorATA,
          creator: creatorKey,
          xpMint,
          backendSigner: signer.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([signer])
        .rpc(),
    );

    return NextResponse.json({
      success: true,
      courseId,
      xpAwarded: course.xpReward,
      track: course.track,
      finalizeTxSignature: tx,
    });
  } catch (err: unknown) {
    const anchor = parseAnchorError(err);
    if (anchor && isIdempotentError(anchor.code)) {
      return NextResponse.json({
        alreadyDone: true,
        message: anchor.message,
        xpAwarded: 0,
      });
    }
    if (anchor && isClientError(anchor.code)) {
      return NextResponse.json(
        { error: anchor.message, code: anchor.name },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Transaction failed";
    console.error("courses/[slug]/finalize error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
