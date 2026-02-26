import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { createClient } from "@supabase/supabase-js";
import {
  PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  getConfigPda,
  getAchievementTypePda,
  getAchievementReceiptPda,
  getMinterRolePda,
} from "@/lib/solana/program";
import { updateStreak } from "@/lib/streak";

const RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ?? "5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd",
);

// Anchor discriminator for global::award_achievement
const AWARD_ACHIEVEMENT_DISC = Buffer.from([75, 47, 156, 253, 124, 231, 84, 12]);

function getBackendSigner(): Keypair {
  const keyJson = process.env.BACKEND_SIGNER_KEY;
  if (!keyJson) throw new Error("BACKEND_SIGNER_KEY not configured");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyJson)));
}

function buildAwardAchievementIx(
  config: PublicKey,
  achievementType: PublicKey,
  achievementReceipt: PublicKey,
  minterRole: PublicKey,
  asset: PublicKey,
  collection: PublicKey,
  recipient: PublicKey,
  recipientTokenAccount: PublicKey,
  xpMint: PublicKey,
  payer: PublicKey,
  minter: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: achievementType, isSigner: false, isWritable: true },
      { pubkey: achievementReceipt, isSigner: false, isWritable: true },
      { pubkey: minterRole, isSigner: false, isWritable: true },
      { pubkey: asset, isSigner: true, isWritable: true },
      { pubkey: collection, isSigner: false, isWritable: true },
      { pubkey: recipient, isSigner: false, isWritable: false },
      { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: minter, isSigner: true, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: AWARD_ACHIEVEMENT_DISC,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { achievementId, recipientWallet, userId } = body;

    if (!achievementId || !recipientWallet || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: achievementId, recipientWallet, userId" },
        { status: 400 },
      );
    }

    // Validate user via Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const backendKeypair = getBackendSigner();
    const recipientKey = new PublicKey(recipientWallet);

    const configPda = getConfigPda();
    const achievementTypePda = getAchievementTypePda(achievementId);
    const achievementReceiptPda = getAchievementReceiptPda(achievementId, recipientKey);
    const minterRolePda = getMinterRolePda(backendKeypair.publicKey);

    // Check if already awarded (receipt PDA exists)
    const existingReceipt = await connection.getAccountInfo(achievementReceiptPda);
    if (existingReceipt) {
      return NextResponse.json(
        { error: "Achievement already awarded", alreadyAwarded: true },
        { status: 200 },
      );
    }

    // Check achievement type exists
    const achievementAccount = await connection.getAccountInfo(achievementTypePda);
    if (!achievementAccount) {
      return NextResponse.json(
        { error: `Achievement type "${achievementId}" not found on-chain` },
        { status: 404 },
      );
    }

    // Parse collection from achievement type data
    // Layout: 8 disc + (4+len) achievement_id + (4+len) name + (4+len) metadata_uri + 32 collection
    const achData = achievementAccount.data;
    let offset = 8;
    const achIdLen = achData.readUInt32LE(offset); offset += 4 + achIdLen;
    const nameLen = achData.readUInt32LE(offset); offset += 4 + nameLen;
    const uriLen = achData.readUInt32LE(offset); offset += 4 + uriLen;
    const collection = new PublicKey(achData.subarray(offset, offset + 32));

    const recipientTokenAccount = getAssociatedTokenAddressSync(
      XP_MINT, recipientKey, true, TOKEN_2022_PROGRAM_ID,
    );

    const assetKeypair = Keypair.generate();

    // Ensure recipient's Token-2022 ATA exists before minting XP
    const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      backendKeypair.publicKey, recipientTokenAccount, recipientKey, XP_MINT, TOKEN_2022_PROGRAM_ID,
    );

    const ix = buildAwardAchievementIx(
      configPda,
      achievementTypePda,
      achievementReceiptPda,
      minterRolePda,
      assetKeypair.publicKey,
      collection,
      recipientKey,
      recipientTokenAccount,
      XP_MINT,
      backendKeypair.publicKey,
      backendKeypair.publicKey,
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const messageV0 = new TransactionMessage({
      payerKey: backendKeypair.publicKey,
      recentBlockhash: blockhash,
      instructions: [createAtaIx, ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    tx.sign([backendKeypair, assetKeypair]);

    const signature = await connection.sendTransaction(tx, {
      skipPreflight: false,
      maxRetries: 3,
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    // Record in Supabase
    await supabase
      .from("user_achievements")
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        earned_at: new Date().toISOString(),
        asset_address: assetKeypair.publicKey.toBase58(),
      }, { onConflict: "user_id,achievement_id" });

    await updateStreak(supabase, userId);

    return NextResponse.json({
      success: true,
      signature,
      assetAddress: assetKeypair.publicKey.toBase58(),
      message: `Achievement "${achievementId}" awarded!`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("award-achievement API error:", message);

    if (message.includes("AchievementAlreadyAwarded") || message.includes("already in use")) {
      return NextResponse.json(
        { error: "Achievement already awarded", alreadyAwarded: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Failed to award achievement", details: message },
      { status: 500 },
    );
  }
}
