import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID, DEVNET } from '@/lib/anchor/constants';
import { getProgram } from '@/lib/anchor';
import type { UntypedAccountAccess } from '@/lib/types/shared';
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMinterRolePda,
  getAchievementTypePda,
  getAchievementReceiptPda,
} from '@/lib/anchor/pda';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

/* ─── Dev logger (only in non-production) ─── */
const isDev = process.env.NODE_ENV !== 'production';
function onchainLog(tag: string, ...args: unknown[]) {
  if (isDev) {
    console.log(`[onchain:${tag}]`, ...args);
  }
}

/**
 * Backend Signer Service
 * Signs server-side transactions (lesson completion, course finalization, credential issuance)
 * Requires environment variable: BACKEND_SIGNER_SECRET_KEY
 */

export class BackendSignerService {
  private program: Program;
  private backendSigner: Keypair;

  constructor(connection: Connection, backendSignerSecretKey: Uint8Array) {
    this.backendSigner = Keypair.fromSecretKey(backendSignerSecretKey);

    // Create provider with backend signer
    const backendWallet = {
      publicKey: this.backendSigner.publicKey,
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
        return txs.map((tx) => {
          if ('sign' in tx && typeof tx.sign === 'function') {
            (tx as Transaction).sign(this.backendSigner);
          }
          return tx;
        });
      },
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
        if ('sign' in tx && typeof tx.sign === 'function') {
          (tx as Transaction).sign(this.backendSigner);
        }
        return tx;
      },
    };

    const provider = new AnchorProvider(connection, backendWallet, { commitment: 'confirmed' });
    this.program = getProgram(provider);
  }

  /**
   * Complete a lesson for a learner
   * Creates XP token account if needed, mints XP
   */
  async completeLesson(
    courseId: string,
    lessonIndex: number,
    learnerAddress: PublicKey,
    xpMint: PublicKey
  ): Promise<string> {
    const [configPda] = getConfigPda();
    const [coursePda] = getCoursePda(courseId);
    const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);

    // Create learner XP ATA if needed
    const learnerXpAta = getAssociatedTokenAddressSync(
      xpMint,
      learnerAddress,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const config = await (this.program.account as unknown as UntypedAccountAccess).config.fetch(configPda);
    const course = await (this.program.account as unknown as UntypedAccountAccess).course.fetch(coursePda);

    const tx = await this.program.methods
      .completeLesson(lessonIndex)
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerAddress,
        learnerTokenAccount: learnerXpAta,
        xpMint: xpMint,
        backendSigner: this.backendSigner.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .preInstructions([
        // Create XP ATA if it doesn't exist
        createAssociatedTokenAccountInstruction(
          this.backendSigner.publicKey,
          learnerXpAta,
          learnerAddress,
          xpMint,
          TOKEN_2022_PROGRAM_ID
        ),
      ])
      .signers([this.backendSigner])
      .rpc({ skipPreflight: true });

    return tx;
  }

  /**
   * Finalize a course
   * Verifies completion, awards bonus XP, triggers creator reward if threshold met
   */
  async finalizeCourse(
    courseId: string,
    learnerAddress: PublicKey,
    xpMint: PublicKey
  ): Promise<string> {
    const [configPda] = getConfigPda();
    const [coursePda] = getCoursePda(courseId);
    const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);

    const course = await (this.program.account as unknown as UntypedAccountAccess).course.fetch(coursePda) as unknown as { creator: PublicKey };

    const learnerXpAta = getAssociatedTokenAddressSync(
      xpMint,
      learnerAddress,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const creatorXpAta = getAssociatedTokenAddressSync(
      xpMint,
      course.creator,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await this.program.methods
      .finalizeCourse()
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerAddress,
        learnerTokenAccount: learnerXpAta,
        creatorTokenAccount: creatorXpAta,
        creator: course.creator,
        xpMint: xpMint,
        backendSigner: this.backendSigner.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([this.backendSigner])
      .rpc({ skipPreflight: true });

    return tx;
  }

  /**
   * Issue a soulbound credential NFT
   * Requires: course already finalized
   * Writes coursesCompleted and totalXp to NFT attributes
   */
  async issueCredential(
    courseId: string,
    learnerAddress: PublicKey,
    trackCollectionAddress: PublicKey,
    credentialName: string,
    metadataUri: string,
    coursesCompleted: number,
    totalXp: BN
  ): Promise<{ txId: string; assetAddress: PublicKey }> {
    const [configPda] = getConfigPda();
    const [coursePda] = getCoursePda(courseId);
    const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);

    const credentialAsset = Keypair.generate();

    const tx = await this.program.methods
      .issueCredential(credentialName, metadataUri, coursesCompleted, { value: totalXp })
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerAddress,
        credentialAsset: credentialAsset.publicKey,
        trackCollection: trackCollectionAddress,
        payer: this.backendSigner.publicKey,
        backendSigner: this.backendSigner.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.backendSigner, credentialAsset])
      .rpc({ skipPreflight: true });

    return {
      txId: tx,
      assetAddress: credentialAsset.publicKey,
    };
  }

  /**
   * Upgrade an existing credential NFT
   * Updates name, URI, and attributes
   */
  async upgradeCredential(
    courseId: string,
    learnerAddress: PublicKey,
    credentialAssetAddress: PublicKey,
    trackCollectionAddress: PublicKey,
    newName: string,
    newUri: string,
    coursesCompleted: number,
    totalXp: BN
  ): Promise<string> {
    const [configPda] = getConfigPda();
    const [coursePda] = getCoursePda(courseId);
    const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);

    const tx = await this.program.methods
      .upgradeCredential(newName, newUri, coursesCompleted, { value: totalXp })
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner: learnerAddress,
        credentialAsset: credentialAssetAddress,
        trackCollection: trackCollectionAddress,
        payer: this.backendSigner.publicKey,
        backendSigner: this.backendSigner.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.backendSigner])
      .rpc({ skipPreflight: true });

    return tx;
  }

  /**
   * Reward arbitrary XP using the MinterRole PDA
   * Used for lesson completion XP when called outside the complete_lesson instruction
   */
  async rewardXp(
    recipientAddress: PublicKey,
    xpMint: PublicKey,
    amount: number,
    reason: string
  ): Promise<string> {
    onchainLog('rewardXp', { recipient: recipientAddress.toBase58(), amount, reason });

    const [configPda] = getConfigPda();
    const [minterRolePda] = getMinterRolePda(this.backendSigner.publicKey);

    const recipientAta = getAssociatedTokenAddressSync(
      xpMint,
      recipientAddress,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await this.program.methods
      .rewardXp({ value: new BN(amount) }, reason)
      .accountsPartial({
        config: configPda,
        minterRole: minterRolePda,
        xpMint: xpMint,
        recipientTokenAccount: recipientAta,
        minter: this.backendSigner.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .preInstructions([
        createAssociatedTokenAccountInstruction(
          this.backendSigner.publicKey,
          recipientAta,
          recipientAddress,
          xpMint,
          TOKEN_2022_PROGRAM_ID
        ),
      ])
      .signers([this.backendSigner])
      .rpc({ skipPreflight: true });

    onchainLog('rewardXp', '✅ TX:', tx);
    return tx;
  }

  /**
   * Get backend signer public key
   */
  getBackendSignerPublicKey(): PublicKey {
    return this.backendSigner.publicKey;
  }
}

/**
 * Factory function to create BackendSignerService from environment
 */
export function createBackendSignerService(connection: Connection): BackendSignerService {
  const secretKeyString = process.env.BACKEND_SIGNER_SECRET_KEY;
  if (!secretKeyString) {
    throw new Error('BACKEND_SIGNER_SECRET_KEY environment variable not set');
  }

  const secretKeyArray = JSON.parse(secretKeyString) as number[];
  const secretKey = new Uint8Array(secretKeyArray);

  return new BackendSignerService(connection, secretKey);
}

/**
 * Check whether on-chain signer is configured
 */
export function isOnchainConfigured(): boolean {
  return !!process.env.BACKEND_SIGNER_SECRET_KEY;
}

/**
 * Create a Connection using env RPC URL
 */
export function getServerConnection(): Connection {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    process.env.SOLANA_RPC_URL ||
    'https://api.devnet.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Get the XP Mint public key from env or constants
 */
export function getXpMint(): PublicKey {
  const mint = process.env.NEXT_PUBLIC_XP_TOKEN_MINT;
  if (mint) return new PublicKey(mint);
  return DEVNET.XP_MINT;
}

/**
 * Convenience: create service from env (connection + signer key)
 * Returns null if BACKEND_SIGNER_SECRET_KEY is not set.
 */
export function tryCreateBackendSigner(): BackendSignerService | null {
  if (!isOnchainConfigured()) {
    onchainLog('init', '⚠️ BACKEND_SIGNER_SECRET_KEY not set — on-chain disabled');
    return null;
  }
  try {
    const svc = createBackendSignerService(getServerConnection());
    onchainLog('init', '✅ BackendSignerService ready, signer:', svc.getBackendSignerPublicKey().toBase58());
    return svc;
  } catch (err) {
    onchainLog('init', '❌ Failed to create BackendSignerService:', err);
    return null;
  }
}
