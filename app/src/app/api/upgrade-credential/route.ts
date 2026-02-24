import { NextResponse } from "next/server";
import { PublicKey, SystemProgram } from "@solana/web3.js";
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
import { withRetry } from "@/lib/solana/retry";

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      learner,
      courseId,
      credentialAsset,
      trackCollection,
      newName,
      newUri,
    } = body as {
      learner?: string;
      courseId?: string;
      credentialAsset?: string;
      trackCollection?: string;
      newName?: string;
      newUri?: string;
    };

    if (
      !learner ||
      !courseId ||
      !credentialAsset ||
      !trackCollection ||
      !newName ||
      !newUri
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: learner, courseId, credentialAsset, trackCollection, newName, newUri",
        },
        { status: 400 },
      );
    }

    const { program, signer } = getBackendProgram();
    const learnerKey = new PublicKey(learner);
    const [configPDA] = findConfigPDA();
    const [coursePDA] = findCoursePDA(courseId);
    const [enrollmentPDA] = findEnrollmentPDA(courseId, learnerKey);

    const tx = await withRetry(() =>
      program.methods
        .upgradeCredential(newName, newUri)
        .accounts({
          config: configPDA,
          course: coursePDA,
          enrollment: enrollmentPDA,
          learner: learnerKey,
          credentialAsset: new PublicKey(credentialAsset),
          trackCollection: new PublicKey(trackCollection),
          payer: signer.publicKey,
          backendSigner: signer.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([signer])
        .rpc(),
    );

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
    console.error("upgrade-credential error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
