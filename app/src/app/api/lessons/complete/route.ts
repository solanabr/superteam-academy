import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { getBackendKeypair } from "@/lib/solana/backend-signer";
import { getProgram, connection } from "@/lib/solana/program-client";
import { XP_MINT } from "@/lib/solana/constants";
import {
  deriveConfigPda,
  deriveCoursePda,
  deriveEnrollmentPda,
} from "@/lib/solana/pda";
import { requireSession } from "@/lib/auth/require-session";
import { completeLessonSchema } from "@/lib/api-schemas";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const body = await req.json();
    const parsed = completeLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    const { courseId, lessonIndex, learner } = parsed.data;

    const backendKeypair = getBackendKeypair();
    const learnerPubkey = new PublicKey(learner);
    const program = getProgram();

    const [configPda] = deriveConfigPda();
    const [coursePda] = deriveCoursePda(courseId);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learnerPubkey);

    const learnerAta = getAssociatedTokenAddressSync(
      XP_MINT,
      learnerPubkey,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const tx = new Transaction({
      feePayer: backendKeypair.publicKey,
      recentBlockhash: blockhash,
    });

    const ataInfo = await connection.getAccountInfo(learnerAta);
    if (!ataInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          backendKeypair.publicKey,
          learnerAta,
          learnerPubkey,
          XP_MINT,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      );
    }

    const ix = await program.methods
      .completeLesson(lessonIndex)
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerPubkey,
        learnerTokenAccount: learnerAta,
        xpMint: XP_MINT,
        backendSigner: backendKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();

    tx.add(ix);
    tx.sign(backendKeypair);

    const rawTx = tx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    return NextResponse.json({ signature });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("complete_lesson error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
