"use client";

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID as SPL_TOKEN_2022,
} from "@solana/spl-token";
import { AnchorProvider, Program, BN, Idl } from "@coral-xyz/anchor";
import { PROGRAM_ID, TOKEN_2022_PROGRAM_ID, SOLANA_NETWORK } from "./constants";
import { getCoursePDA, getEnrollmentPDA, getConfigPDA } from "./pda";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnrollmentData {
  course: PublicKey;
  enrolledAt: number;
  completedAt: number | null;
  lessonFlags: number[];
  credentialAsset: PublicKey | null;
  bump: number;
}

export interface LeaderboardEntry {
  wallet: string;
  xp: number;
  level: number;
  rank: number;
}

export interface CredentialData {
  mint: string;
  name: string;
  uri: string;
  coursesCompleted: number;
  totalXp: number;
}

// ─── XP Token Mint (from program config) ─────────────────────────────────────
// This is fetched from the config PDA on first use
let cachedXpMint: PublicKey | null = null;

// ─── Connection ───────────────────────────────────────────────────────────────

export function getConnection(): Connection {
  return new Connection(SOLANA_NETWORK, "confirmed");
}

// ─── Fetch XP Mint from Config PDA ───────────────────────────────────────────

async function fetchXpMint(connection: Connection): Promise<PublicKey | null> {
  if (cachedXpMint) return cachedXpMint;
  try {
    const [configPda] = getConfigPDA();
    const accountInfo = await connection.getAccountInfo(configPda);
    if (!accountInfo) return null;
    // Config account layout: 8 (discriminator) + 32 (authority) + 32 (xp_mint) + ...
    // Skip discriminator (8) + authority (32) = offset 40
    const xpMintBytes = accountInfo.data.slice(40, 72);
    cachedXpMint = new PublicKey(xpMintBytes);
    return cachedXpMint;
  } catch {
    return null;
  }
}

// ─── Fetch XP Balance ─────────────────────────────────────────────────────────

export async function fetchXPBalance(walletPublicKey: PublicKey): Promise<number> {
  try {
    const connection = getConnection();
    const xpMint = await fetchXpMint(connection);
    if (!xpMint) return 0;

    const ata = getAssociatedTokenAddressSync(
      xpMint,
      walletPublicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const account = await getAccount(connection, ata, "confirmed", TOKEN_2022_PROGRAM_ID);
    return Number(account.amount);
  } catch {
    return 0;
  }
}

// ─── Fetch Enrollment PDA ─────────────────────────────────────────────────────

export async function fetchEnrollment(
  walletPublicKey: PublicKey,
  courseId: string
): Promise<EnrollmentData | null> {
  try {
    const connection = getConnection();
    const [enrollmentPda] = getEnrollmentPDA(courseId, walletPublicKey);
    const accountInfo = await connection.getAccountInfo(enrollmentPda);
    if (!accountInfo) return null;

    const data = accountInfo.data;
    let offset = 8; // skip discriminator

    // course: Pubkey (32)
    const course = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;

    // enrolled_at: i64 (8)
    const enrolledAt = Number(data.readBigInt64LE(offset));
    offset += 8;

    // completed_at: Option<i64> (1 + 8)
    const hasCompletedAt = data[offset] === 1;
    offset += 1;
    const completedAt = hasCompletedAt ? Number(data.readBigInt64LE(offset)) : null;
    offset += 8;

    // lesson_flags: [u64; 4] (32)
    const lessonFlags: number[] = [];
    for (let i = 0; i < 4; i++) {
      lessonFlags.push(Number(data.readBigUInt64LE(offset)));
      offset += 8;
    }

    // credential_asset: Option<Pubkey> (1 + 32)
    const hasCredential = data[offset] === 1;
    offset += 1;
    const credentialAsset = hasCredential ? new PublicKey(data.slice(offset, offset + 32)) : null;
    offset += 32;

    // bump: u8
    const bump = data[offset + 4]; // skip _reserved (4)

    return { course, enrolledAt, completedAt, lessonFlags, credentialAsset, bump };
  } catch {
    return null;
  }
}

// ─── Check if lesson is complete ─────────────────────────────────────────────

export function isLessonComplete(lessonFlags: number[], lessonIndex: number): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  if (wordIndex >= lessonFlags.length) return false;
  return (lessonFlags[wordIndex] & (1 << bitIndex)) !== 0;
}

// ─── Build Enroll Transaction ─────────────────────────────────────────────────

export async function buildEnrollTransaction(
  walletPublicKey: PublicKey,
  courseId: string
): Promise<Transaction> {
  const connection = getConnection();
  const [coursePda] = getCoursePDA(courseId);
  const [enrollmentPda] = getEnrollmentPDA(courseId, walletPublicKey);

  // Fetch IDL dynamically from on-chain
  const { Program, AnchorProvider } = await import("@coral-xyz/anchor");

  // Build instruction data manually since we don't have IDL file
  // enroll instruction discriminator: sha256("global:enroll")[0:8]
  const instructionDiscriminator = Buffer.from([210, 12, 186, 241, 75, 115, 234, 100]);
  const courseIdBytes = Buffer.from(courseId);
  const courseIdLen = Buffer.alloc(4);
  courseIdLen.writeUInt32LE(courseIdBytes.length, 0);

  const data = Buffer.concat([instructionDiscriminator, courseIdLen, courseIdBytes]);

  const { TransactionInstruction } = await import("@solana/web3.js");

  const instruction = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: true },
      { pubkey: enrollmentPda, isSigner: false, isWritable: true },
      { pubkey: walletPublicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const transaction = new Transaction();
  transaction.add(instruction);
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = walletPublicKey;

  return transaction;
}

// ─── Fetch Leaderboard via Helius DAS API ─────────────────────────────────────

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  try {
    const connection = getConnection();
    const xpMint = await fetchXpMint(connection);
    if (!xpMint) return getMockLeaderboard();

    const heliusUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (!heliusUrl) return getMockLeaderboard();

    const response = await fetch(heliusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "leaderboard",
        method: "getTokenAccounts",
        params: {
          mint: xpMint.toBase58(),
          limit,
          options: { showZeroBalance: false },
        },
      }),
    });

    const data = await response.json();
    if (!data.result?.token_accounts) return getMockLeaderboard();

    const entries: LeaderboardEntry[] = data.result.token_accounts
      .map((account: { owner: string; amount: string }) => ({
        wallet: account.owner,
        xp: Number(account.amount),
        level: Math.floor(Math.sqrt(Number(account.amount) / 100)),
        rank: 0,
      }))
      .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.xp - a.xp)
      .map((entry: LeaderboardEntry, index: number) => ({ ...entry, rank: index + 1 }));

    return entries;
  } catch {
    return getMockLeaderboard();
  }
}

// ─── Fetch Credentials (Metaplex Core NFTs) ───────────────────────────────────

export async function fetchCredentials(walletPublicKey: PublicKey): Promise<CredentialData[]> {
  try {
    const heliusUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (!heliusUrl) return [];

    const response = await fetch(heliusUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "credentials",
        method: "searchAssets",
        params: {
          ownerAddress: walletPublicKey.toBase58(),
          compressed: false,
          page: 1,
          limit: 50,
        },
      }),
    });

    const data = await response.json();
    if (!data.result?.items) return [];

    // Filter for assets from our program
    const credentials = data.result.items
      .filter((asset: { authorities?: Array<{ address: string }> }) =>
        asset.authorities?.some(
          (auth: { address: string }) => auth.address === PROGRAM_ID.toBase58()
        )
      )
      .map((asset: {
        id: string;
        content?: { metadata?: { name?: string; symbol?: string }; json_uri?: string };
        token_info?: { supply?: number };
      }) => ({
        mint: asset.id,
        name: asset.content?.metadata?.name || "Academy Credential",
        uri: asset.content?.json_uri || "",
        coursesCompleted: 0,
        totalXp: 0,
      }));

    return credentials;
  } catch {
    return [];
  }
}

// ─── Mock Leaderboard Fallback ────────────────────────────────────────────────

function getMockLeaderboard(): LeaderboardEntry[] {
  return [
    { wallet: "7xKX...mE4f", xp: 12500, level: 11, rank: 1 },
    { wallet: "3nPQ...vR2k", xp: 9800, level: 9, rank: 2 },
    { wallet: "5mBY...wT8j", xp: 8200, level: 9, rank: 3 },
    { wallet: "9aZW...nK5p", xp: 7100, level: 8, rank: 4 },
    { wallet: "2cLF...hG3q", xp: 6500, level: 8, rank: 5 },
  ];
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const learningProgressService = {
  fetchXPBalance,
  fetchEnrollment,
  fetchLeaderboard,
  fetchCredentials,
  buildEnrollTransaction,
  isLessonComplete,
  getConnection,
};

export default learningProgressService;
