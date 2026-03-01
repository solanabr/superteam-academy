import { NextRequest, NextResponse } from "next/server";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getBackendKeypair } from "@/lib/solana/backend-signer";
import { getProgram, connection } from "@/lib/solana/program-client";
import { deriveConfigPda, deriveCoursePda, deriveEnrollmentPda } from "@/lib/solana/pda";
import { BN } from "@coral-xyz/anchor";
import { requireSession } from "@/lib/auth/require-session";
import { issueCredentialSchema } from "@/lib/api-schemas";

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);

const TRACK_COLLECTION = new PublicKey(
  process.env.TRACK_COLLECTION_PUBKEY ?? "5uoE19soMKtT6M2QvPKEp9pYgZUPmAScfpLiaKjue3jg",
);

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (session instanceof NextResponse) return session;

    const body = await req.json();
    const parsed = issueCredentialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    const { courseId, learner, totalXp, coursesCompleted } = parsed.data;

    const backendKeypair = getBackendKeypair();
    const learnerPubkey = new PublicKey(learner);
    const program = getProgram();

    const [configPda] = deriveConfigPda();
    const [coursePda] = deriveCoursePda(courseId);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learnerPubkey);

    const enrollment = await program.account.enrollment.fetch(enrollmentPda);
    if (!enrollment.completedAt) {
      return NextResponse.json(
        { error: "Course not finalized yet" },
        { status: 400 },
      );
    }
    if (enrollment.credentialAsset) {
      return NextResponse.json({
        credential: enrollment.credentialAsset.toBase58(),
        message: "Credential already issued",
      });
    }

    const credentialKeypair = Keypair.generate();

    const ix = await program.methods
      .issueCredential(
        `Superteam Academy — ${courseId}`,
        `https://arweave.net/placeholder-${courseId}`,
        coursesCompleted ?? 1,
        new BN(totalXp ?? 500),
      )
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerPubkey,
        credentialAsset: credentialKeypair.publicKey,
        trackCollection: TRACK_COLLECTION,
        payer: backendKeypair.publicKey,
        backendSigner: backendKeypair.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
      })
      .instruction();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const tx = new Transaction({
      feePayer: backendKeypair.publicKey,
      recentBlockhash: blockhash,
    }).add(ix);

    tx.sign(backendKeypair, credentialKeypair);

    const rawTx = tx.serialize();
    const signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    return NextResponse.json({
      signature,
      credential: credentialKeypair.publicKey.toBase58(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("issue_credential error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
