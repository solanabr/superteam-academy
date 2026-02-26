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
import { updateStreak } from "@/lib/streak";
import {
  PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  getConfigPda,
  getAchievementTypePda,
  getAchievementReceiptPda,
  getMinterRolePda,
} from "@/lib/solana/program";

const ACHIEVEMENT_ID = "early-adopter";
const MAX_SUPPLY = 100;

const RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ?? "5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd",
);

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

/**
 * Parse AchievementType account fields after the three Borsh strings.
 * Layout: 8 disc + (4+len) achievement_id + (4+len) name + (4+len) metadata_uri
 *         + 32 collection + 32 creator + 4 max_supply(u32) + 4 current_supply(u32)
 */
function skipStrings(data: Buffer): number {
  let offset = 8;
  const idLen = data.readUInt32LE(offset); offset += 4 + idLen;
  const nameLen = data.readUInt32LE(offset); offset += 4 + nameLen;
  const uriLen = data.readUInt32LE(offset); offset += 4 + uriLen;
  return offset;
}

function parseMintedCount(data: Buffer): number {
  let offset = skipStrings(data);
  offset += 32; // collection
  offset += 32; // creator
  offset += 4;  // max_supply (u32)
  return data.readUInt32LE(offset); // current_supply (u32)
}

function parseCollection(data: Buffer): PublicKey {
  const offset = skipStrings(data);
  return new PublicKey(data.subarray(offset, offset + 32));
}

/** GET: Return current mint count + whether a specific user already minted */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const walletAddress = request.nextUrl.searchParams.get("wallet");

    const connection = new Connection(RPC_URL, "confirmed");
    const achievementTypePda = getAchievementTypePda(ACHIEVEMENT_ID);
    const account = await connection.getAccountInfo(achievementTypePda);

    const minted = account ? parseMintedCount(account.data) : 0;

    let userMinted = false;
    if (userId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      // Check DB first
      const { data } = await supabase
        .from("user_achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_id", ACHIEVEMENT_ID)
        .maybeSingle();
      userMinted = !!data;

      // If DB says no but we have a wallet, check on-chain receipt as fallback
      if (!userMinted && walletAddress) {
        try {
          const recipientKey = new PublicKey(walletAddress);
          const receiptPda = getAchievementReceiptPda(ACHIEVEMENT_ID, recipientKey);
          const receipt = await connection.getAccountInfo(receiptPda);
          if (receipt) {
            userMinted = true;
            // Sync DB — the confirm step was likely missed
            await supabase
              .from("user_achievements")
              .upsert({
                user_id: userId,
                achievement_id: ACHIEVEMENT_ID,
                earned_at: new Date().toISOString(),
              }, { onConflict: "user_id,achievement_id" });
          }
        } catch {
          // On-chain check failed — rely on DB result
        }
      }
    }

    return NextResponse.json({ minted, maxSupply: MAX_SUPPLY, userMinted });
  } catch (error) {
    console.error("Early adopter GET error:", error);
    return NextResponse.json({ minted: 0, maxSupply: MAX_SUPPLY, userMinted: false });
  }
}

/** POST: Build partially-signed tx for Early Adopter NFT mint.
 *  If action=confirm, just record in Supabase after frontend sent the tx. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, action, signature, assetAddress } = body;

    if (!userId || !walletAddress) {
      return NextResponse.json(
        { error: "Missing userId or walletAddress" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // --- Confirm mode: frontend already sent the tx, record in Supabase ---
    if (action === "confirm") {
      if (!signature || !assetAddress) {
        return NextResponse.json({ error: "Missing signature or assetAddress" }, { status: 400 });
      }
      await supabase
        .from("user_achievements")
        .upsert({
          user_id: userId,
          achievement_id: ACHIEVEMENT_ID,
          earned_at: new Date().toISOString(),
          asset_address: assetAddress,
        }, { onConflict: "user_id,achievement_id" });

      await updateStreak(supabase, userId);

      return NextResponse.json({ success: true });
    }

    // --- Prepare mode: build partially-signed transaction ---

    // Validate user
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
    const recipientKey = new PublicKey(walletAddress);

    const configPda = getConfigPda();
    const achievementTypePda = getAchievementTypePda(ACHIEVEMENT_ID);
    const achievementReceiptPda = getAchievementReceiptPda(ACHIEVEMENT_ID, recipientKey);
    const minterRolePda = getMinterRolePda(backendKeypair.publicKey);

    // Check if already minted
    const existingReceipt = await connection.getAccountInfo(achievementReceiptPda);
    if (existingReceipt) {
      return NextResponse.json(
        { error: "Already minted", alreadyMinted: true },
        { status: 200 },
      );
    }

    // Check achievement type exists and read minted count
    const achievementAccount = await connection.getAccountInfo(achievementTypePda);
    if (!achievementAccount) {
      return NextResponse.json(
        { error: "Early Adopter achievement not configured on-chain" },
        { status: 404 },
      );
    }

    const minted = parseMintedCount(achievementAccount.data);
    if (minted >= MAX_SUPPLY) {
      return NextResponse.json(
        { error: "All Early Adopter NFTs have been minted", soldOut: true },
        { status: 200 },
      );
    }

    const collection = parseCollection(achievementAccount.data);

    const recipientTokenAccount = getAssociatedTokenAddressSync(
      XP_MINT, recipientKey, true, TOKEN_2022_PROGRAM_ID,
    );

    const assetKeypair = Keypair.generate();

    // Ensure recipient's Token-2022 ATA exists before minting XP
    const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      recipientKey, recipientTokenAccount, recipientKey, XP_MINT, TOKEN_2022_PROGRAM_ID,
    );

    // Learner wallet is the payer (pays rent + tx fee)
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
      recipientKey,              // payer = learner wallet
      backendKeypair.publicKey,  // minter = backend
    );

    const { blockhash } =
      await connection.getLatestBlockhash("confirmed");

    const messageV0 = new TransactionMessage({
      payerKey: recipientKey,  // learner pays tx fee
      recentBlockhash: blockhash,
      instructions: [createAtaIx, ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    // Backend partial-signs (minter + asset keypair). Learner signs on frontend.
    tx.sign([backendKeypair, assetKeypair]);

    return NextResponse.json({
      transaction: Buffer.from(tx.serialize()).toString("base64"),
      assetAddress: assetKeypair.publicKey.toBase58(),
      minted: minted + 1,
      maxSupply: MAX_SUPPLY,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Early adopter mint error:", message);

    if (message.includes("AchievementAlreadyAwarded") || message.includes("already in use")) {
      return NextResponse.json(
        { error: "Already minted", alreadyMinted: true },
        { status: 200 },
      );
    }

    if (message.includes("MaxSupplyReached")) {
      return NextResponse.json(
        { error: "All Early Adopter NFTs have been minted", soldOut: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Failed to mint Early Adopter NFT", details: message },
      { status: 500 },
    );
  }
}
