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
import { checkAllEligibility } from "@/lib/achievement-eligibility";
import {
  PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  getConfigPda,
  getAchievementTypePda,
  getAchievementReceiptPda,
  getMinterRolePda,
} from "@/lib/solana/program";

const RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ??
    "5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd",
);

const AWARD_ACHIEVEMENT_DISC = Buffer.from([
  75, 47, 156, 253, 124, 231, 84, 12,
]);

interface AchievementDef {
  id: string;
  name: string;
  iconUrl: string;
  xpReward: number;
  requirement: string;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first-steps",
    name: "First Steps",
    iconUrl: "https://i.ibb.co/ccHMmzD5/first-steps.jpg",
    xpReward: 10,
    requirement: "Complete any lesson in any course",
  },
  {
    id: "course-completer",
    name: "Course Completer",
    iconUrl: "https://i.ibb.co/tRymDvf/coursecompleter.jpg",
    xpReward: 50,
    requirement: "Complete all lessons in any course",
  },
  {
    id: "speed-runner",
    name: "Speed Runner",
    iconUrl: "https://i.ibb.co/4RhqCCGV/speedrunner.jpg",
    xpReward: 75,
    requirement: "Enroll and complete a course within 24 hours",
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    iconUrl: "https://i.ibb.co/kV8GrtN9/weekwarrior.jpg",
    xpReward: 30,
    requirement: "7-day learning streak",
  },
  {
    id: "monthly-master",
    name: "Monthly Master",
    iconUrl: "https://i.ibb.co/cKk15smD/montlymaster.jpg",
    xpReward: 100,
    requirement: "30-day learning streak",
  },
  {
    id: "consistency-king",
    name: "Consistency King",
    iconUrl: "https://i.ibb.co/8gTyjgtS/Consistencyking.jpg",
    xpReward: 250,
    requirement: "100-day learning streak",
  },
  {
    id: "rust-rookie",
    name: "Rust Rookie",
    iconUrl: "https://i.ibb.co/608V57hq/rustrookie.jpg",
    xpReward: 50,
    requirement: "Complete the Rust Fundamentals course",
  },
  {
    id: "anchor-expert",
    name: "Anchor Expert",
    iconUrl: "https://i.ibb.co/v6KYQ0Ws/anchorexpert.jpg",
    xpReward: 150,
    requirement: "Complete all Anchor Framework courses",
  },
  {
    id: "full-stack-solana",
    name: "Full Stack Solana",
    iconUrl: "https://i.ibb.co/1tz81kmr/fullstack.jpg",
    xpReward: 300,
    requirement: "Complete at least 12 courses",
  },
  {
    id: "helper",
    name: "Helper",
    iconUrl: "https://i.ibb.co/GvtspMdN/Communityhelper.jpg",
    xpReward: 25,
    requirement: "Have your comment marked as helpful",
  },
  {
    id: "first-comment",
    name: "First Comment",
    iconUrl: "https://i.ibb.co/j9zXC4jk/communityfirst.jpg",
    xpReward: 10,
    requirement: "Leave a comment on any lesson",
  },
  {
    id: "top-contributor",
    name: "Top Contributor",
    iconUrl: "https://i.ibb.co/zHBTV4XC/communitytop.jpg",
    xpReward: 200,
    requirement: "Reach top 10 on the XP leaderboard",
  },
  {
    id: "early-adopter",
    name: "Early Adopter",
    iconUrl: "https://i.ibb.co/7xNkX9tB/earlyadopter.jpg",
    xpReward: 100,
    requirement: "First 100 beta users to mint",
  },
  {
    id: "bug-hunter",
    name: "Bug Hunter",
    iconUrl: "https://i.ibb.co/Xm8MZwN/bughunter.jpg",
    xpReward: 150,
    requirement: "Report a verified bug (admin-granted)",
  },
];

// ── On-chain parsers ────────────────────────────────────────────────

function skipStrings(data: Buffer): number {
  let offset = 8;
  const idLen = data.readUInt32LE(offset);
  offset += 4 + idLen;
  const nameLen = data.readUInt32LE(offset);
  offset += 4 + nameLen;
  const uriLen = data.readUInt32LE(offset);
  offset += 4 + uriLen;
  return offset;
}

function parseCollection(data: Buffer): PublicKey {
  const offset = skipStrings(data);
  return new PublicKey(data.subarray(offset, offset + 32));
}

function parseMaxSupply(data: Buffer): number {
  const offset = skipStrings(data);
  return data.readUInt32LE(offset + 64); // +32 collection +32 creator
}

function parseMintedCount(data: Buffer): number {
  const offset = skipStrings(data);
  return data.readUInt32LE(offset + 68); // +32 collection +32 creator +4 max_supply
}

// ── Helpers ─────────────────────────────────────────────────────────

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

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ── GET: List mintable achievements for a user ──────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const walletAddress = request.nextUrl.searchParams.get("wallet");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();
    const connection = new Connection(RPC_URL, "confirmed");

    // 1. Check eligibility for all achievements
    const eligibility = await checkAllEligibility(
      supabase,
      userId,
      walletAddress ?? undefined,
    );

    // 2. Get already-earned achievements from DB (does NOT mean NFT was minted)
    const { data: earned } = await supabase
      .from("user_achievements")
      .select("achievement_id, asset_address")
      .eq("user_id", userId);
    const earnedSet = new Set(
      (earned ?? []).map((e: { achievement_id: string }) => e.achievement_id),
    );
    // Only consider it "NFT minted" if asset_address is a real pubkey (not null / "synced")
    const nftMintedSet = new Set(
      (earned ?? [])
        .filter(
          (e: { achievement_id: string; asset_address?: string | null }) =>
            e.asset_address && e.asset_address.length > 10,
        )
        .map((e: { achievement_id: string }) => e.achievement_id),
    );

    // 3. For achievements NOT in DB at all, check on-chain receipt as fallback
    const candidateIds = ACHIEVEMENT_DEFS.map((d) => d.id).filter(
      (id) =>
        (eligibility[id]?.eligible || earnedSet.has(id)) &&
        !nftMintedSet.has(id),
    );

    // Batch-check on-chain receipts
    if (walletAddress && candidateIds.length > 0) {
      const recipientKey = new PublicKey(walletAddress);
      const receiptPdas = candidateIds.map((id) =>
        getAchievementReceiptPda(id, recipientKey),
      );

      try {
        const receiptAccounts =
          await connection.getMultipleAccountsInfo(receiptPdas);
        for (let i = 0; i < candidateIds.length; i++) {
          if (receiptAccounts[i]) {
            // On-chain receipt exists — NFT already minted
            nftMintedSet.add(candidateIds[i]);
            // Sync DB if missing
            if (!earnedSet.has(candidateIds[i])) {
              await supabase.from("user_achievements").upsert(
                {
                  user_id: userId,
                  achievement_id: candidateIds[i],
                  earned_at: new Date().toISOString(),
                },
                { onConflict: "user_id,achievement_id" },
              );
            }
          }
        }
      } catch {
        // On-chain check failed — rely on DB
      }
    }

    // 4. Batch-check which achievement types are deployed on-chain
    const typePdas = ACHIEVEMENT_DEFS.map((d) =>
      getAchievementTypePda(d.id),
    );
    let deployedSet = new Set<string>();
    try {
      const typeAccounts =
        await connection.getMultipleAccountsInfo(typePdas);
      for (let i = 0; i < ACHIEVEMENT_DEFS.length; i++) {
        if (typeAccounts[i]) {
          deployedSet.add(ACHIEVEMENT_DEFS[i].id);
        }
      }
    } catch {
      // If RPC fails, assume all deployed
      deployedSet = new Set(ACHIEVEMENT_DEFS.map((d) => d.id));
    }

    // 5. Build the mintable list
    //    Show if: (eligible OR already earned in DB) AND NFT not yet minted AND deployed on-chain
    const mintable = ACHIEVEMENT_DEFS.filter((def) => {
      const elig = eligibility[def.id];
      if (!elig) return false;
      if (elig.comingSoon || elig.adminOnly) return false;
      const isEligibleOrEarned = elig.eligible || earnedSet.has(def.id);
      if (!isEligibleOrEarned) return false;
      if (nftMintedSet.has(def.id)) return false;
      if (!deployedSet.has(def.id)) return false;
      return true;
    }).map((def) => ({
      id: def.id,
      name: def.name,
      iconUrl: def.iconUrl,
      xpReward: def.xpReward,
      requirement: def.requirement,
    }));

    return NextResponse.json({ mintable });
  } catch (error) {
    console.error("Achievement GET error:", error);
    return NextResponse.json({ mintable: [] });
  }
}

// ── POST: Build partially-signed tx or confirm mint ─────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { achievementId, userId, walletAddress, action, signature, assetAddress } =
      body;

    if (!achievementId || !userId || !walletAddress) {
      return NextResponse.json(
        { error: "Missing achievementId, userId, or walletAddress" },
        { status: 400 },
      );
    }

    const def = ACHIEVEMENT_DEFS.find((d) => d.id === achievementId);
    if (!def) {
      return NextResponse.json(
        { error: "Unknown achievement" },
        { status: 400 },
      );
    }

    const supabase = getSupabase();

    // ── Confirm mode ──
    if (action === "confirm") {
      if (!signature || !assetAddress) {
        return NextResponse.json(
          { error: "Missing signature or assetAddress" },
          { status: 400 },
        );
      }

      await supabase.from("user_achievements").upsert(
        {
          user_id: userId,
          achievement_id: achievementId,
          earned_at: new Date().toISOString(),
          asset_address: assetAddress,
        },
        { onConflict: "user_id,achievement_id" },
      );

      await updateStreak(supabase, userId);
      return NextResponse.json({ success: true });
    }

    // ── Prepare mode ──

    // Re-check eligibility server-side (security)
    const eligibility = await checkAllEligibility(
      supabase,
      userId,
      walletAddress,
    );
    const elig = eligibility[achievementId];
    if (!elig?.eligible) {
      return NextResponse.json(
        {
          error: elig?.reason ?? "Not eligible for this achievement",
          notEligible: true,
        },
        { status: 200 },
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const backendKeypair = getBackendSigner();
    const recipientKey = new PublicKey(walletAddress);

    const configPda = getConfigPda();
    const achievementTypePda = getAchievementTypePda(achievementId);
    const achievementReceiptPda = getAchievementReceiptPda(
      achievementId,
      recipientKey,
    );
    const minterRolePda = getMinterRolePda(backendKeypair.publicKey);

    // Check if already minted on-chain
    const existingReceipt =
      await connection.getAccountInfo(achievementReceiptPda);
    if (existingReceipt) {
      // Sync DB just in case
      await supabase.from("user_achievements").upsert(
        {
          user_id: userId,
          achievement_id: achievementId,
          earned_at: new Date().toISOString(),
        },
        { onConflict: "user_id,achievement_id" },
      );
      return NextResponse.json(
        { error: "Already minted", alreadyMinted: true },
        { status: 200 },
      );
    }

    // Check achievement type exists on-chain
    const achievementAccount =
      await connection.getAccountInfo(achievementTypePda);
    if (!achievementAccount) {
      return NextResponse.json(
        { error: `Achievement "${achievementId}" not configured on-chain` },
        { status: 404 },
      );
    }

    // Check supply
    const maxSupply = parseMaxSupply(achievementAccount.data);
    const mintedCount = parseMintedCount(achievementAccount.data);
    if (maxSupply > 0 && mintedCount >= maxSupply) {
      return NextResponse.json(
        { error: "Max supply reached", soldOut: true },
        { status: 200 },
      );
    }

    const collection = parseCollection(achievementAccount.data);
    const recipientTokenAccount = getAssociatedTokenAddressSync(
      XP_MINT,
      recipientKey,
      true,
      TOKEN_2022_PROGRAM_ID,
    );

    const assetKeypair = Keypair.generate();

    // Ensure recipient's Token-2022 ATA exists before minting XP
    const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      recipientKey, recipientTokenAccount, recipientKey, XP_MINT, TOKEN_2022_PROGRAM_ID,
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
      recipientKey,
      backendKeypair.publicKey,
    );

    const { blockhash } =
      await connection.getLatestBlockhash("confirmed");

    const messageV0 = new TransactionMessage({
      payerKey: recipientKey,
      recentBlockhash: blockhash,
      instructions: [createAtaIx, ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    tx.sign([backendKeypair, assetKeypair]);

    return NextResponse.json({
      transaction: Buffer.from(tx.serialize()).toString("base64"),
      assetAddress: assetKeypair.publicKey.toBase58(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Achievement mint error:", message);

    if (
      message.includes("AchievementAlreadyAwarded") ||
      message.includes("already in use")
    ) {
      return NextResponse.json(
        { error: "Already minted", alreadyMinted: true },
        { status: 200 },
      );
    }
    if (message.includes("MaxSupplyReached")) {
      return NextResponse.json(
        { error: "Max supply reached", soldOut: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Failed to mint achievement", details: message },
      { status: 500 },
    );
  }
}
