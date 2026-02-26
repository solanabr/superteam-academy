import { NextResponse } from "next/server";
import { requireWalletSession } from "@/lib/auth/require-session";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getBackendProgram } from "@/lib/solana/backend-signer";
import { findConfigPDA } from "@/lib/solana/pda";
import {
  parseAnchorError,
  isIdempotentError,
  isClientError,
} from "@/lib/solana/anchor-errors";
import { withRetry } from "@/lib/solana/retry";

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
);

/**
 * POST /api/claim-achievement
 *
 * Awards an achievement to a learner via the `award_achievement` instruction.
 * Requires: achievementId, recipient, collection (the achievement type collection pubkey).
 */
export async function POST(req: Request) {
  try {
    const session = await requireWalletSession();
    if ("error" in session) return session.error;

    const body = await req.json();
    const { achievementId, collection } = body as {
      achievementId?: string;
      collection?: string;
    };

    if (!achievementId || !collection) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: achievementId, collection",
        },
        { status: 400 },
      );
    }

    const { program, signer } = getBackendProgram();
    const recipientKey = new PublicKey(session.wallet);
    const [configPDA] = findConfigPDA();
    const collectionKey = new PublicKey(collection);

    // Derive achievement PDAs
    const [achievementTypePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("achievement"), Buffer.from(achievementId)],
      program.programId,
    );
    const [achievementReceiptPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("achievement_receipt"),
        Buffer.from(achievementId),
        recipientKey.toBuffer(),
      ],
      program.programId,
    );

    const tx = await withRetry(() =>
      program.methods
        .awardAchievement(achievementId)
        .accounts({
          config: configPDA,
          achievementType: achievementTypePDA,
          achievementReceipt: achievementReceiptPDA,
          collection: collectionKey,
          recipient: recipientKey,
          backendSigner: signer.publicKey,
          payer: signer.publicKey,
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
    console.error("award-achievement error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
