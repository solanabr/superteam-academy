import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import type { EnrollmentData, TransactionResult } from "./types";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IEnrollmentService {
  enroll(courseId: string): Promise<TransactionResult>;
  closeEnrollment(courseId: string): Promise<TransactionResult>;
  getEnrollment(courseId: string, learner: string): Promise<EnrollmentData | null>;
  getUserEnrollments(learner: string): Promise<EnrollmentData[]>;
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

/** Build a deterministic 4-element lesson-flags array from a bitmask integer. */
function makeLessonFlags(completedCount: number, lessonCount: number): number[] {
  const flags = [0, 0, 0, 0];
  for (let i = 0; i < Math.min(completedCount, lessonCount); i++) {
    const word = Math.floor(i / 32);
    const bit = i % 32;
    flags[word] |= 1 << bit;
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const STUB_ENROLLMENTS: Record<string, EnrollmentData> = {
  "solana-101": {
    course: "solana-101",
    enrolledAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    lessonFlags: makeLessonFlags(8, 8),
    credentialAsset: "CREDmock1111111111111111111111111111111111111",
  },
  "anchor-fundamentals": {
    course: "anchor-fundamentals",
    enrolledAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    completedAt: null,
    lessonFlags: makeLessonFlags(4, 10),
    credentialAsset: null,
  },
};

// ---------------------------------------------------------------------------
// Stub implementation
// ---------------------------------------------------------------------------

export class StubEnrollmentService implements IEnrollmentService {
  private enrollments: Map<string, EnrollmentData> = new Map(
    Object.entries(STUB_ENROLLMENTS)
  );

  async enroll(courseId: string): Promise<TransactionResult> {
    await randomDelay();

    if (this.enrollments.has(courseId)) {
      return {
        signature: "",
        success: false,
        error: "Already enrolled in this course",
      };
    }

    const enrollment: EnrollmentData = {
      course: courseId,
      enrolledAt: Date.now(),
      completedAt: null,
      lessonFlags: [0, 0, 0, 0],
      credentialAsset: null,
    };

    this.enrollments.set(courseId, enrollment);

    return {
      signature: `stub_enroll_${courseId}_${Date.now()}`,
      success: true,
    };
  }

  async closeEnrollment(courseId: string): Promise<TransactionResult> {
    await randomDelay();

    if (!this.enrollments.has(courseId)) {
      return {
        signature: "",
        success: false,
        error: "No active enrollment found for this course",
      };
    }

    this.enrollments.delete(courseId);

    return {
      signature: `stub_close_${courseId}_${Date.now()}`,
      success: true,
    };
  }

  async getEnrollment(courseId: string, _learner: string): Promise<EnrollmentData | null> {
    await randomDelay();
    return this.enrollments.get(courseId) ?? null;
  }

  async getUserEnrollments(_learner: string): Promise<EnrollmentData[]> {
    await randomDelay();
    return Array.from(this.enrollments.values());
  }
}

// ---------------------------------------------------------------------------
// On-chain implementation
// ---------------------------------------------------------------------------

export class OnChainEnrollmentService implements IEnrollmentService {
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

  private deriveEnrollment(courseId: string, learner: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
      this.program.programId
    );
    return pda;
  }

  async enroll(courseId: string): Promise<TransactionResult> {
    try {
      const learner = this.provider.wallet.publicKey;
      const coursePda = this.deriveCourse(courseId);
      const enrollmentPda = this.deriveEnrollment(courseId, learner);

      const signature = await this.program.methods
        .enroll(courseId)
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { signature, success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { signature: "", success: false, error: message };
    }
  }

  async closeEnrollment(courseId: string): Promise<TransactionResult> {
    try {
      const learner = this.provider.wallet.publicKey;
      const coursePda = this.deriveCourse(courseId);
      const enrollmentPda = this.deriveEnrollment(courseId, learner);

      const signature = await this.program.methods
        .closeEnrollment()
        .accountsPartial({
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
        })
        .rpc();

      return { signature, success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { signature: "", success: false, error: message };
    }
  }

  async getEnrollment(courseId: string, learner: string): Promise<EnrollmentData | null> {
    try {
      const learnerPubkey = new PublicKey(learner);
      const enrollmentPda = this.deriveEnrollment(courseId, learnerPubkey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (this.program.account as any).enrollment.fetchNullable(enrollmentPda);
      if (!raw) return null;

      return {
        course: courseId,
        enrolledAt: raw.enrolledAt.toNumber() * 1000,
        completedAt: raw.completedAt ? raw.completedAt.toNumber() * 1000 : null,
        lessonFlags: raw.lessonFlags.map((f: { toNumber: () => number }) => f.toNumber()),
        credentialAsset: raw.credentialAsset ? raw.credentialAsset.toBase58() : null,
      };
    } catch {
      return null;
    }
  }

  async getUserEnrollments(learner: string): Promise<EnrollmentData[]> {
    try {
      const learnerPubkey = new PublicKey(learner);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = await (this.program.account as any).enrollment.all();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const owned = all.filter((e: any) => {
        const enrollmentPda = this.deriveEnrollment(e.account.courseId, learnerPubkey);
        return e.publicKey.equals(enrollmentPda);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return owned.map((e: any) => ({
        course: e.account.courseId as string,
        enrolledAt: e.account.enrolledAt.toNumber() * 1000,
        completedAt: e.account.completedAt
          ? e.account.completedAt.toNumber() * 1000
          : null,
        lessonFlags: e.account.lessonFlags.map(
          (f: { toNumber: () => number }) => f.toNumber()
        ),
        credentialAsset: e.account.credentialAsset
          ? e.account.credentialAsset.toBase58()
          : null,
      }));
    } catch {
      return [];
    }
  }
}
