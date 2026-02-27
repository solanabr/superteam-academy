import { NextResponse } from "next/server";
import { requireWalletSession } from "@/lib/auth/require-session";
import { Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
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
import { getTrackCollection } from "@/lib/constants/collections";
import { TRACK_LABELS } from "@/lib/constants";
import { logEnrollmentEvent } from "@/lib/supabase/enrollment-events";

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);

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
    const session = await requireWalletSession();
    if ("error" in session) return session.error;

    const { slug } = await params;
    const course = courses.find((c) => c.slug === slug);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const { program, signer, connection } = getBackendProgram();
    const learnerKey = new PublicKey(session.wallet);
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

    logEnrollmentEvent({
      eventType: "finalize_course",
      wallet: session.wallet,
      courseId,
      signature: tx,
    });

    // Attempt credential issuance if track collection is configured
    let credentialIssued = false;
    let credentialAsset: string | undefined;
    const trackCollection = getTrackCollection(course.track);
    if (trackCollection) {
      try {
        const assetKeypair = Keypair.generate();
        const trackLabel = TRACK_LABELS[course.track as keyof typeof TRACK_LABELS] ?? course.track;
        const credentialName = `${trackLabel} - ${course.title}`;
        const metadataUri = `https://superteam.academy/api/metadata/${courseId}`;

        await withRetry(() =>
          program.methods
            .issueCredential(credentialName, metadataUri, 1, course.xpReward ?? 0)
            .accounts({
              config: configPDA,
              course: coursePDA,
              enrollment: enrollmentPDA,
              learner: learnerKey,
              credentialAsset: assetKeypair.publicKey,
              trackCollection: new PublicKey(trackCollection),
              payer: signer.publicKey,
              backendSigner: signer.publicKey,
              mplCoreProgram: MPL_CORE_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .signers([signer, assetKeypair])
            .rpc(),
        );
        credentialIssued = true;
        credentialAsset = assetKeypair.publicKey.toBase58();
      } catch (credErr) {
        console.error("issue-credential after finalize failed (non-fatal):", credErr);
      }
    }

    return NextResponse.json({
      success: true,
      courseId,
      xpAwarded: course.xpReward,
      track: course.track,
      finalizeTxSignature: tx,
      credentialIssued,
      credentialAsset,
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
