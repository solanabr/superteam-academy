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
import {
  parseAnchorError,
  isIdempotentError,
  isClientError,
} from "@/lib/solana/anchor-errors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { learner, courseId } = body as {
      learner?: string;
      courseId?: string;
    };

    if (!learner || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields: learner, courseId" },
        { status: 400 },
      );
    }

    const { program, signer } = getBackendProgram();
    const learnerKey = new PublicKey(learner);
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(courseId);
    const [enrollmentPDA] = findEnrollmentPDA(courseId, learnerKey);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = program.account as any;
    const config = await accounts.config.fetch(configPDA);
    const xpMint = config.xpMint as PublicKey;

    const course = await accounts.course.fetch(coursePDA);
    const creatorKey = course.creator as PublicKey;

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

    return NextResponse.json({ signature: tx });
  } catch (err: unknown) {
    const anchor = parseAnchorError(err);
    if (anchor && isIdempotentError(anchor.code)) {
      return NextResponse.json({ alreadyDone: true, message: anchor.message });
    }
    if (anchor && isClientError(anchor.code)) {
      return NextResponse.json(
        { error: anchor.message, code: anchor.name },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Transaction failed";
    console.error("finalize-course error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
