import { NextResponse } from "next/server";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
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

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      learner,
      courseId,
      credentialName,
      metadataUri,
      trackCollection,
      coursesCompleted,
      totalXp,
    } = body as {
      learner?: string;
      courseId?: string;
      credentialName?: string;
      metadataUri?: string;
      trackCollection?: string;
      coursesCompleted?: number;
      totalXp?: number;
    };

    if (
      !learner ||
      !courseId ||
      !credentialName ||
      !metadataUri ||
      !trackCollection
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: learner, courseId, credentialName, metadataUri, trackCollection",
        },
        { status: 400 },
      );
    }

    const { program, signer } = getBackendProgram();
    const learnerKey = new PublicKey(learner);
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(courseId);
    const [enrollmentPDA] = findEnrollmentPDA(courseId, learnerKey);

    // Generate a fresh keypair for the Metaplex Core asset
    const assetKeypair = Keypair.generate();

    const tx = await program.methods
      .issueCredential(
        credentialName,
        metadataUri,
        coursesCompleted ?? 1,
        totalXp != null ? totalXp : 0,
      )
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
      .rpc();

    return NextResponse.json({
      signature: tx,
      credentialAsset: assetKeypair.publicKey.toBase58(),
    });
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
    console.error("issue-credential error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
