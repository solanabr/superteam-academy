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
    const { courseId, lessonIndex } = body as {
      courseId?: string;
      lessonIndex?: number;
    };

    if (!courseId || lessonIndex === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, lessonIndex" },
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

    const learnerATA = await ensureATA(connection, signer, xpMint, learnerKey);

    const tx = await withRetry(() =>
      program.methods
        .completeLesson(lessonIndex)
        .accounts({
          config: configPDA,
          course: coursePDA,
          enrollment: enrollmentPDA,
          learner: learnerKey,
          learnerTokenAccount: learnerATA,
          xpMint,
          backendSigner: signer.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([signer])
        .rpc(),
    );

    logEnrollmentEvent({
      eventType: "complete_lesson",
      wallet: session.wallet,
      courseId,
      lessonIndex,
      signature: tx,
    });

    return NextResponse.json({ signature: tx });
  } catch (err: unknown) {
    const anchor = parseAnchorError(err);
    if (anchor && isIdempotentError(anchor.code)) {
      return NextResponse.json({
        alreadyDone: true,
        message: anchor.message,
      });
    }
    if (anchor && isClientError(anchor.code)) {
      return NextResponse.json(
        { error: anchor.message, code: anchor.name },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Transaction failed";
    console.error("complete-lesson error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
