import { NextRequest, NextResponse } from "next/server";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAnchorProgram,
  getXpMintPubkey,
  getAchievementCollection,
  ensureXpAta,
  serializeAnchorError,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from "@/lib/anchor-server";
import {
  findConfigPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  findMinterRolePDA,
} from "@/lib/pda";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    achievementId?: string;
    // achievement-engine.ts sends walletAddress; backend sent recipientWallet
    walletAddress?: string;
    recipientWallet?: string;
  };

  const achievementId = body.achievementId;
  const recipientWallet = body.walletAddress ?? body.recipientWallet;

  if (!achievementId || !recipientWallet) {
    return NextResponse.json(
      { error: "Missing achievementId or walletAddress" },
      { status: 400 },
    );
  }

  let recipient: PublicKey;
  try {
    recipient = new PublicKey(recipientWallet);
  } catch {
    return NextResponse.json(
      { error: "Invalid wallet pubkey" },
      { status: 400 },
    );
  }

  const collection = getAchievementCollection(achievementId);
  if (!collection) {
    // Collection not configured — silently succeed (expected in dev without on-chain setup)
    return NextResponse.json({ success: true, awarded: false });
  }

  try {
    const { program, backendKeypair, connection } = getAnchorProgram();
    const xpMint = getXpMintPubkey();

    const [configPda] = findConfigPDA();
    const [achievementTypePda] = findAchievementTypePDA(achievementId);
    const [achievementReceiptPda] = findAchievementReceiptPDA(
      achievementId,
      recipient,
    );
    const [minterRolePda] = findMinterRolePDA(backendKeypair.publicKey);

    // Skip if already awarded — prevents duplicate TX fees
    const receiptInfo = await connection.getAccountInfo(achievementReceiptPda);
    if (receiptInfo) {
      return NextResponse.json({ success: true, awarded: false });
    }

    const recipientTokenAccount = await ensureXpAta(
      connection,
      backendKeypair,
      recipient,
      xpMint,
    );
    const assetKp = Keypair.generate();

    const signature = await program.methods
      .awardAchievement()
      .accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        achievementReceipt: achievementReceiptPda,
        minterRole: minterRolePda,
        asset: assetKp.publicKey,
        collection,
        recipient,
        recipientTokenAccount,
        xpMint,
        payer: backendKeypair.publicKey,
        minter: backendKeypair.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backendKeypair, assetKp])
      .rpc();

    return NextResponse.json({
      success: true,
      awarded: true,
      signature,
      asset: assetKp.publicKey.toBase58(),
    });
  } catch (err) {
    const msg = serializeAnchorError(err);
    console.error("[api/achievements/award]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
