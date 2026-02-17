/**
 * Devnet Program Integration Service
 *
 * Real Solana devnet connection patterns for:
 * - XP Token-2022 balance reads
 * - Credential NFT reads (Metaplex Core)
 * - Enrollment transaction building
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  clusterApiUrl,
} from '@solana/web3.js';

// ============================================================
// Configuration
// ============================================================

const DEVNET_RPC = clusterApiUrl('devnet');
const connection = new Connection(DEVNET_RPC, 'confirmed');

/**
 * Program IDs (placeholders — replace with real deployed program addresses)
 */
const PROGRAM_IDS = {
  /** Superteam Academy main program */
  academy: new PublicKey('11111111111111111111111111111111'),
  /** Token-2022 program */
  token2022: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
  /** XP token mint (Token-2022 soulbound) */
  xpMint: new PublicKey('11111111111111111111111111111111'),
  /** Metaplex Core program */
  metaplexCore: new PublicKey('CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rKrKJfkNGc'),
} as const;

// ============================================================
// XP Token Balance (Token-2022)
// ============================================================

/**
 * Read XP token balance from Token-2022
 *
 * Uses getTokenAccountsByOwner to find token accounts for the XP mint,
 * then reads the balance. Returns 0 if no account exists.
 */
export async function getXPTokenBalance(walletAddress: string): Promise<number> {
  try {
    const wallet = new PublicKey(walletAddress);

    // Find token accounts owned by this wallet for the XP mint
    const tokenAccounts = await connection.getTokenAccountsByOwner(wallet, {
      mint: PROGRAM_IDS.xpMint,
      programId: PROGRAM_IDS.token2022,
    });

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    // Parse the first token account's balance
    const accountInfo = tokenAccounts.value[0];
    if (!accountInfo) return 0;

    // Token account data layout: first 64 bytes are mint + owner,
    // bytes 64-72 are the amount as u64 little-endian
    const data = accountInfo.account.data;
    const amount = data.readBigUInt64LE(64);
    return Number(amount);
  } catch {
    // Wallet may not have any XP tokens yet — return 0
    return 0;
  }
}

// ============================================================
// Credential NFTs (Metaplex Core)
// ============================================================

export interface CredentialNFT {
  mintAddress: string;
  name: string;
  uri: string;
  owner: string;
}

/**
 * Read credential NFTs from wallet using Metaplex Core.
 *
 * In production, this would use the Metaplex DAS (Digital Asset Standard) API
 * or the @metaplex-foundation/mpl-core package to fetch assets by owner.
 *
 * For now, we query getProgramAccounts filtered by owner.
 */
export async function getCredentialNFTs(walletAddress: string): Promise<CredentialNFT[]> {
  try {
    const wallet = new PublicKey(walletAddress);

    // Query Metaplex Core assets owned by this wallet
    // In production: use DAS API getAssetsByOwner
    const accounts = await connection.getProgramAccounts(PROGRAM_IDS.metaplexCore, {
      filters: [
        // Filter by owner field in the Core asset account
        { memcmp: { offset: 8, bytes: wallet.toBase58() } },
      ],
      dataSlice: { offset: 0, length: 200 },
    });

    return accounts.map((acc) => ({
      mintAddress: acc.pubkey.toBase58(),
      name: 'Credential',
      uri: '',
      owner: walletAddress,
    }));
  } catch {
    // No credentials found or RPC error
    return [];
  }
}

// ============================================================
// Enrollment Transaction Builder
// ============================================================

export interface EnrollmentTransactionParams {
  studentWallet: string;
  courseId: string;
}

/**
 * Build an enrollment transaction (does NOT send it).
 *
 * Creates a transaction that would:
 * 1. Call the Academy program's "enroll" instruction
 * 2. Initialize a PDA for the student's enrollment record
 *
 * The transaction is returned unsigned for the wallet adapter to sign.
 * For safety in development, we build but don't auto-send.
 */
export async function buildEnrollmentTransaction(
  params: EnrollmentTransactionParams
): Promise<Transaction> {
  const student = new PublicKey(params.studentWallet);

  // Derive PDA for enrollment record
  const [enrollmentPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('enrollment'),
      student.toBuffer(),
      Buffer.from(params.courseId),
    ],
    PROGRAM_IDS.academy
  );

  // Build the enrollment instruction
  // Instruction data: [0] = enroll discriminator, followed by course ID
  const courseIdBuffer = Buffer.alloc(32);
  courseIdBuffer.write(params.courseId);

  const instructionData = Buffer.concat([
    Buffer.from([0]), // instruction index for "enroll"
    courseIdBuffer,
  ]);

  const enrollInstruction = new TransactionInstruction({
    keys: [
      { pubkey: student, isSigner: true, isWritable: true },
      { pubkey: enrollmentPDA, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_IDS.academy,
    data: instructionData,
  });

  const transaction = new Transaction();
  transaction.add(enrollInstruction);

  // Set recent blockhash (required for signing)
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = student;

  return transaction;
}

// ============================================================
// Devnet Connection Health Check
// ============================================================

export async function checkDevnetConnection(): Promise<{
  connected: boolean;
  slot: number;
  blockHeight: number;
}> {
  try {
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();
    return { connected: true, slot, blockHeight };
  } catch {
    return { connected: false, slot: 0, blockHeight: 0 };
  }
}

// ============================================================
// Export connection for direct use
// ============================================================

export { connection, PROGRAM_IDS };
