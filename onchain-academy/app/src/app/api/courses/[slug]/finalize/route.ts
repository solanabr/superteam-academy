import { NextResponse } from "next/server";
import { requireWalletSession } from "@/lib/auth/require-session";
import { Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
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
  isClientError,
} from "@/lib/solana/anchor-errors";
import { withRetry } from "@/lib/solana/retry";
import { getExplorerUrl } from "@/lib/solana/tx-utils";
import { getTrackCollection } from "@/lib/constants/collections";
import { TRACK_LABELS } from "@/lib/constants";
import { logEnrollmentEvent } from "@/lib/supabase/enrollment-events";
import { verifyTurnstile } from "@/lib/turnstile";

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

    const body = await request.json();
    if (body.turnstileToken) {
      const valid = await verifyTurnstile(body.turnstileToken);
      if (!valid) {
        return NextResponse.json(
          { error: "Bot verification failed" },
          { status: 403 },
        );
      }
    }

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

    // Validate track collection upfront — no point finalizing if we can't issue
    const trackCollection = getTrackCollection(course.track);
    if (!trackCollection) {
      console.error("No track collection configured for track:", course.track);
      return NextResponse.json(
        { error: `Track collection not configured for ${course.track}. Contact support.` },
        { status: 500 },
      );
    }

    const accounts = getAccounts(program);
    const config = await accounts.config.fetch(configPDA);
    const xpMint = config.xpMint;

    const onChainCourse = await accounts.course.fetch(coursePDA);
    const creatorKey = onChainCourse.creator;
    const totalXp = (onChainCourse.xpPerLesson ?? 0) * (onChainCourse.lessonCount ?? 0);

    // Step 1: Finalize course (XP award)
    // If already finalized, continue to credential issuance anyway.
    let finalizeTx: string | undefined;
    let alreadyFinalized = false;

    try {
      const [learnerATA, creatorATA] = await Promise.all([
        ensureATA(connection, signer, xpMint, learnerKey),
        ensureATA(connection, signer, xpMint, creatorKey),
      ]);

      finalizeTx = await withRetry(() =>
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
        signature: finalizeTx,
      });
    } catch (finalizeErr) {
      const anchor = parseAnchorError(finalizeErr);
      if (anchor?.code === 5) {
        // CourseAlreadyFinalized — XP was awarded before, continue to credential
        alreadyFinalized = true;
      } else if (anchor && isClientError(anchor.code)) {
        return NextResponse.json(
          { error: anchor.message, code: anchor.name },
          { status: 400 },
        );
      } else {
        throw finalizeErr;
      }
    }

    // Step 2: Issue credential (mandatory — no success without it)
    let credentialAsset: string | undefined;
    try {
      const assetKeypair = Keypair.generate();
      const trackLabel = TRACK_LABELS[course.track as keyof typeof TRACK_LABELS] ?? course.track;
      const credentialName = `${trackLabel} - ${course.title}`;
      const metadataUri = `https://superteam.academy/api/metadata/${courseId}`;

      await withRetry(() =>
        program.methods
          .issueCredential(credentialName, metadataUri, 1, new BN(totalXp))
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
      credentialAsset = assetKeypair.publicKey.toBase58();
    } catch (credErr) {
      const anchor = parseAnchorError(credErr);
      if (anchor?.code === 16) {
        // CredentialAlreadyIssued — idempotent success, asset exists in wallet
      } else {
        const msg = credErr instanceof Error ? credErr.message : String(credErr);
        console.error("issue-credential failed:", credErr);
        return NextResponse.json(
          { error: `Credential issuance failed: ${msg}` },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      courseId,
      xpAwarded: alreadyFinalized ? 0 : totalXp,
      track: course.track,
      finalizeTxSignature: finalizeTx,
      explorerUrl: finalizeTx ? getExplorerUrl(finalizeTx) : undefined,
      credentialIssued: true,
      credentialAsset,
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
    console.error("courses/[slug]/finalize error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
