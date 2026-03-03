import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js';
import BN from 'bn.js';
import { TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID } from './constants';
import IDL from '../../../lib/anchor/academy.json' assert { type: 'json' };
import { PROGRAM_ID } from './constants';
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  getMinterRolePda,
  getAchievementTypePda,
  getAchievementReceiptPda,
} from './pda';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

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
    // Anchor v0.29 API: new Program(idl, programId, provider)
    this.program = new Program(IDL as Parameters<typeof Program>[0], PROGRAM_ID, provider);
  }

  getBackendSignerPublicKey(): PublicKey {
    return this.backendSigner.publicKey;
  }

  /**
   * Complete a lesson for a learner
   */
  async completeLesson(
    courseId: string,
    lessonIndex: number,
    learnerAddress: PublicKey,
    xpMintAddress: PublicKey
  ): Promise<string> {
    try {
      const [coursePda] = getCoursePda(courseId);
      const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);
      const [configPda] = getConfigPda();

      // Get learner's XP token account
      const learnerXpAccount = getAssociatedTokenAddressSync(xpMintAddress, learnerAddress);

      const signature = await (this.program.rpc as unknown as Record<string, CallableFunction>).completeLesson(
        new BN(lessonIndex),
        {
          accounts: {
            learner: learnerAddress,
            course: coursePda,
            enrollment: enrollmentPda,
            config: configPda,
            xpMint: xpMintAddress,
            learnerXpAccount: learnerXpAccount,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      return signature;
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  }

  /**
   * Finalize a course for a learner
   */
  async finalizeCourse(
    courseId: string,
    learnerAddress: PublicKey,
    xpMintAddress: PublicKey
  ): Promise<string> {
    try {
      const [coursePda] = getCoursePda(courseId);
      const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);
      const [configPda] = getConfigPda();

      // Get learner's XP token account
      const learnerXpAccount = getAssociatedTokenAddressSync(xpMintAddress, learnerAddress);

      const signature = await (this.program.rpc as unknown as Record<string, CallableFunction>).finalizeCourse({
        accounts: {
          learner: learnerAddress,
          course: coursePda,
          enrollment: enrollmentPda,
          config: configPda,
          xpMint: xpMintAddress,
          learnerXpAccount: learnerXpAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        },
      });

      return signature;
    } catch (error) {
      console.error('Error finalizing course:', error);
      throw error;
    }
  }

  /**
   * Issue a credential (cNFT) for a completed course
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
    try {
      const [coursePda] = getCoursePda(courseId);
      const [enrollmentPda] = getEnrollmentPda(courseId, learnerAddress);
      const [configPda] = getConfigPda();

      // In production, would create collection item via Metaplex Core
      // For now, return a placeholder

      const signature = await (this.program.rpc as unknown as Record<string, CallableFunction>).issueCredential(
        credentialName,
        metadataUri,
        new BN(coursesCompleted),
        totalXp,
        {
          accounts: {
            learner: learnerAddress,
            course: coursePda,
            enrollment: enrollmentPda,
            config: configPda,
            collection: trackCollectionAddress,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      return {
        txId: signature,
        assetAddress: learnerAddress, // Placeholder - in production would be credential asset
      };
    } catch (error) {
      console.error('Error issuing credential:', error);
      throw error;
    }
  }

  /**
   * Upgrade a credential with new attributes
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
    try {
      const [coursePda] = getCoursePda(courseId);
      const [configPda] = getConfigPda();

      const signature = await (this.program.rpc as unknown as Record<string, CallableFunction>).upgradeCredential(
        newName,
        newUri,
        new BN(coursesCompleted),
        totalXp,
        {
          accounts: {
            learner: learnerAddress,
            credentialAsset: credentialAssetAddress,
            course: coursePda,
            config: configPda,
            collection: trackCollectionAddress,
            systemProgram: SystemProgram.programId,
          },
        }
      );

      return signature;
    } catch (error) {
      console.error('Error upgrading credential:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create BackendSignerService
 */
export function createBackendSignerService(connection: Connection): BackendSignerService {
  const secretKeyStr = process.env.BACKEND_SIGNER_SECRET_KEY;
  if (!secretKeyStr) {
    throw new Error(
      'BACKEND_SIGNER_SECRET_KEY environment variable is required. ' +
      'Generate one from your Solana keypair: cat ~/.config/solana/id.json | jq -c "."'
    );
  }

  // Parse secret key (assumes base58 or JSON format)
  let secretKey: Uint8Array;
  try {
    // Try parsing as JSON array
    const parsed = JSON.parse(secretKeyStr);
    if (Array.isArray(parsed) && parsed.length === 64) {
      secretKey = new Uint8Array(parsed);
    } else if (Array.isArray(parsed)) {
      throw new Error(`Invalid secret key length: ${parsed.length}. Expected 64 bytes.`);
    } else {
      throw new Error('BACKEND_SIGNER_SECRET_KEY must be a JSON array of 64 numbers');
    }
  } catch (error) {
    // If not JSON, assume base58
    try {
      const bs58 = require('bs58');
      secretKey = bs58.decode(secretKeyStr);
      if (secretKey.length !== 64) {
        throw new Error(`Invalid secret key length: ${secretKey.length}. Expected 64 bytes.`);
      }
    } catch (e) {
      throw new Error(
        `Failed to parse BACKEND_SIGNER_SECRET_KEY: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  try {
    return new BackendSignerService(connection, secretKey);
  } catch (error) {
    throw new Error(
      `Failed to initialize backend signer service: ${error instanceof Error ? error.message : 'unknown error'}.`
    );
  }
}
