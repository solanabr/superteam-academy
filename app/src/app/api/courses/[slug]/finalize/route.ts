import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { getBackendProgram } from "@/lib/solana/backend-signer";
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

    const { program, signer } = getBackendProgram();
    const learnerKey = new PublicKey(walletAddress);
    const courseId = course.id;
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(courseId);
    const [enrollmentPDA] = findEnrollmentPDA(courseId, learnerKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = program.account as any;
    const config = await accounts.config.fetch(configPDA);
    const xpMint = config.xpMint as PublicKey;

    const onChainCourse = await accounts.course.fetch(coursePDA);
    const creatorKey = onChainCourse.creator as PublicKey;

    const learnerATA = getAssociatedTokenAddressSync(
      xpMint,
      learnerKey,
      true,
      TOKEN_2022_PROGRAM_ID,
    );
    const creatorATA = getAssociatedTokenAddressSync(
      xpMint,
      creatorKey,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    const tx = await program.methods
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
      .rpc();

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
