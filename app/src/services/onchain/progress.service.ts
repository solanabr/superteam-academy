import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import type { ProgressService } from "../interfaces";
import type { CourseProgress } from "@/types";
import type { AcademyProgram } from "@/lib/solana/program";
import { LocalProgressService } from "../progress.service";
import {
  deriveCoursePda,
  deriveEnrollmentPda,
  PROGRAM_ID,
} from "@/lib/solana/constants";
import { deserializeEnrollment } from "@/lib/solana/enrollment";
import { courses } from "@/data/courses";

/**
 * Devnet progress service — reads enrollment PDAs on-chain,
 * builds and sends `enroll` transactions via Anchor Program.
 *
 * `completeLesson`, `finalizeCourse`, and `closeEnrollment` remain stubbed
 * (backend-signed instructions — not implemented in frontend).
 */
export class DevnetProgressService implements ProgressService {
  private connection: Connection;
  private fallback = new LocalProgressService();
  private _program: AcademyProgram | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /** Injected by SolanaProgramProvider when wallet connects */
  setProgram(program: AcademyProgram | null): void {
    this._program = program;
  }

  async getProgress(
    wallet: string,
    courseId: string,
  ): Promise<CourseProgress | null> {
    try {
      const learner = new PublicKey(wallet);
      const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);
      const accountInfo = await this.connection.getAccountInfo(enrollmentPda);

      if (
        !accountInfo ||
        accountInfo.owner.toBase58() !== PROGRAM_ID.toBase58()
      )
        return null;

      return deserializeEnrollment(Buffer.from(accountInfo.data), courseId);
    } catch {
      // PDA doesn't exist or RPC error — fall back to local
      return this.fallback.getProgress(wallet, courseId);
    }
  }

  async getAllEnrollments(wallet: string): Promise<CourseProgress[]> {
    const results: CourseProgress[] = [];

    const checks = courses.map(async (course) => {
      const progress = await this.getProgress(wallet, course.slug);
      if (progress) {
        progress.totalLessons = course.lessons;
        results.push(progress);
      }
    });

    await Promise.all(checks);
    return results;
  }

  async enroll(
    wallet: string,
    courseId: string,
  ): Promise<{ txSignature: string }> {
    // Check if the course exists on-chain before attempting tx
    const [coursePda] = deriveCoursePda(courseId);
    const courseAccount = await this.connection.getAccountInfo(coursePda);

    if (
      !courseAccount ||
      courseAccount.owner.toBase58() !== PROGRAM_ID.toBase58()
    ) {
      // Course not on-chain — use local enrollment
      await this.fallback.enroll(wallet, courseId);
      return { txSignature: "" };
    }

    if (!this._program) {
      // Wallet not connected — fall back to local
      await this.fallback.enroll(wallet, courseId);
      return { txSignature: "" };
    }

    const program = this._program!;
    const learner = new PublicKey(wallet);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);

    const signature = (await program.methods
      .enroll(courseId)
      .accountsPartial({
        course: coursePda,
        enrollment: enrollmentPda,
        learner,
        systemProgram: SystemProgram.programId,
      })
      .rpc()) as string;

    // Also persist locally for instant UI
    await this.fallback.enroll(wallet, courseId);

    return { txSignature: signature };
  }

  // Backend-signed instructions — delegate to local stubs
  async completeLesson(
    wallet: string,
    courseId: string,
    lessonIndex: number,
  ): Promise<{ xpEarned: number; txSignature: string | null }> {
    return this.fallback.completeLesson(wallet, courseId, lessonIndex);
  }

  async finalizeCourse(
    wallet: string,
    courseId: string,
  ): Promise<{ bonusXp: number; txSignature: string | null }> {
    return this.fallback.finalizeCourse(wallet, courseId);
  }

  async closeEnrollment(
    wallet: string,
    courseId: string,
  ): Promise<{ txSignature: string }> {
    return this.fallback.closeEnrollment(wallet, courseId);
  }
}
