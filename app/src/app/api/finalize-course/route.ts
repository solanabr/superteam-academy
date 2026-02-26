import { NextResponse } from "next/server";
import { requireWalletSession } from "@/lib/auth/require-session";
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
import {
  parseAnchorError,
  isIdempotentError,
  isClientError,
} from "@/lib/solana/anchor-errors";
import { logEnrollmentEvent } from "@/lib/supabase/enrollment-events";
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

export async function POST(req: Request) {
  try {
    const session = await requireWalletSession();
    if ("error" in session) return session.error;

    const body = await req.json();
    const { courseId } = body as {
      courseId?: string;
    };

    if (!courseId) {
      return NextResponse.json(
        { error: "Missing required field: courseId" },
        { status: 400 },
      );
    }

    const { program, signer, connection } = getBackendProgram();
    const learnerKey = new PublicKey(session.wallet);
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(courseId);
    const [enrollmentPDA] = findEnrollmentPDA(courseId, learnerKey);

    const accounts = getAccounts(program);
    const config = await accounts.config.fetch(configPDA);
    const xpMint = config.xpMint;

    const course = await accounts.course.fetch(coursePDA);
    const creatorKey = course.creator;

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
