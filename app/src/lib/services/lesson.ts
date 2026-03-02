import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { TransactionResult } from "./types";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ILessonService {
  completeLesson(courseId: string, lessonIndex: number): Promise<TransactionResult>;
  finalizeCourse(courseId: string): Promise<TransactionResult>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(300 + Math.random() * 500);
}

// ---------------------------------------------------------------------------
// Stub implementation
// ---------------------------------------------------------------------------

export class StubLessonService implements ILessonService {
  async completeLesson(courseId: string, lessonIndex: number): Promise<TransactionResult> {
    await randomDelay();
    return {
      signature: `stub_lesson_${courseId}_${lessonIndex}_${Date.now()}`,
      success: true,
    };
  }

  async finalizeCourse(courseId: string): Promise<TransactionResult> {
    await randomDelay();
    return {
      signature: `stub_finalize_${courseId}_${Date.now()}`,
      success: true,
    };
  }
}

// ---------------------------------------------------------------------------
// On-chain implementation
//
// NOTE: completeLesson and finalizeCourse are backend-signed instructions.
// In production the frontend calls a backend API route, which holds the
// backend_signer keypair and submits the transaction. These methods are
// provided for environments where the frontend has direct signer access
// (e.g., integration tests against a local validator with the authority
// wallet acting as backend_signer).
// ---------------------------------------------------------------------------

export class OnChainLessonService implements ILessonService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private program: Program<any>;
  private provider: AnchorProvider;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(program: Program<any>, provider: AnchorProvider) {
    this.program = program;
    this.provider = provider;
  }

  private deriveCourse(courseId: string): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(courseId)],
      this.program.programId
    );
    return pda;
  }

  private deriveConfig(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    );
    return pda;
  }

  private deriveEnrollment(courseId: string, learner: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
      this.program.programId
    );
    return pda;
  }

  async completeLesson(courseId: string, lessonIndex: number): Promise<TransactionResult> {
    try {
      const backendSigner = this.provider.wallet.publicKey;
      const configPda = this.deriveConfig();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = await (this.program.account as any).config.fetch(configPda);
      const xpMint: PublicKey = config.xpMint;

      // The learner pubkey must be passed in or resolved from context.
      // Here we assume the backend is acting on behalf of the connected wallet.
      const learner = backendSigner;
      const coursePda = this.deriveCourse(courseId);
      const enrollmentPda = this.deriveEnrollment(courseId, learner);
      const learnerTokenAccount = getAssociatedTokenAddressSync(
        xpMint,
        learner,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const signature = await this.program.methods
        .completeLesson(lessonIndex)
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          learnerTokenAccount,
          xpMint,
          backendSigner,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      return { signature, success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { signature: "", success: false, error: message };
    }
  }

  async finalizeCourse(courseId: string): Promise<TransactionResult> {
    try {
      const backendSigner = this.provider.wallet.publicKey;
      const configPda = this.deriveConfig();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config = await (this.program.account as any).config.fetch(configPda);
      const xpMint: PublicKey = config.xpMint;

      const learner = backendSigner;
      const coursePda = this.deriveCourse(courseId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const courseAccount = await (this.program.account as any).course.fetch(coursePda);
      const creator: PublicKey = courseAccount.creator;

      const enrollmentPda = this.deriveEnrollment(courseId, learner);
      const learnerTokenAccount = getAssociatedTokenAddressSync(
        xpMint,
        learner,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      const creatorTokenAccount = getAssociatedTokenAddressSync(
        xpMint,
        creator,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const signature = await this.program.methods
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          learnerTokenAccount,
          creatorTokenAccount,
          creator,
          xpMint,
          backendSigner,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      return { signature, success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { signature: "", success: false, error: message };
    }
  }
}
