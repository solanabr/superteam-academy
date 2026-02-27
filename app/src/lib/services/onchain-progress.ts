import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import type {
  Progress,
  StreakData,
  LeaderboardEntry,
  Credential,
  Achievement,
} from "@/types";
import type { LearningProgressService } from "./learning-progress";
import {
  getConnection,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  TOKEN_2022_PROGRAM_ID,
  PROGRAM_ID,
} from "@/lib/onchain";
import { getCompletedLessonIndices } from "@/lib/onchain/bitmap";
import {
  getOnChainCredentials,
  getXpTokenHolders,
} from "@/lib/onchain/credentials";
import {
  deserializeConfig,
  deserializeCourse,
  deserializeEnrollment,
} from "@/lib/onchain/deserializers";

/**
 * Derive a learner's level from their total XP.
 * Formula: `Level = floor(sqrt(xp / 100))` — matches the on-chain program.
 */
function levelFromXP(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Service that reads real on-chain state for XP, enrollments, credentials,
 * and leaderboard. Write operations that require backend signing are stubs.
 */
export class OnChainProgressService implements LearningProgressService {
  private connection: Connection;
  private wallet: AnchorWallet | null = null;
  private xpMint: PublicKey | null = null;

  /**
   * @param rpcUrl - Optional custom RPC endpoint (defaults to devnet)
   */
  constructor(rpcUrl?: string) {
    this.connection = getConnection(rpcUrl);
  }

  /**
   * Set the connected wallet for signing enrollment transactions.
   * @param wallet - Anchor wallet adapter, or null when disconnected
   */
  setWallet(wallet: AnchorWallet | null) {
    this.wallet = wallet;
  }

  /** Fetch and cache the XP token mint address from the on-chain Config PDA. */
  private async getXpMint(): Promise<PublicKey | null> {
    if (this.xpMint) return this.xpMint;
    try {
      const [configPda] = getConfigPda();
      const info = await this.connection.getAccountInfo(configPda);
      if (!info) return null;
      const config = deserializeConfig(info.data as Buffer);
      this.xpMint = config.xpMint;
      return this.xpMint;
    } catch {
      return null;
    }
  }

  // ---- XP (reads real Token-2022 balance) ---------------------------------

  async getXP(userId: string): Promise<number> {
    try {
      const mint = await this.getXpMint();
      if (!mint) return 0;

      let walletPubkey: PublicKey;
      try {
        walletPubkey = new PublicKey(userId);
      } catch {
        return 0;
      }

      const ata = getAssociatedTokenAddressSync(
        mint,
        walletPubkey,
        false,
        TOKEN_2022_PROGRAM_ID,
      );

      const balance = await this.connection.getTokenAccountBalance(ata);
      return Number(balance.value.amount);
    } catch {
      return 0;
    }
  }

  async addXP(_userId: string, _amount: number): Promise<number> {
    console.warn("OnChainProgressService.addXP: Backend-signed operation");
    return this.getXP(_userId);
  }

  // ---- Progress ----------------------------------------------------------

  async getProgress(
    userId: string,
    courseId: string,
  ): Promise<Progress | null> {
    try {
      let learner: PublicKey;
      try {
        learner = new PublicKey(userId);
      } catch {
        return null;
      }

      const [enrollmentPda] = getEnrollmentPda(courseId, learner);
      const enrollInfo = await this.connection.getAccountInfo(enrollmentPda);
      if (!enrollInfo) return null;

      const enrollment = deserializeEnrollment(enrollInfo.data as Buffer);

      const [coursePda] = getCoursePda(courseId);
      const courseInfo = await this.connection.getAccountInfo(coursePda);
      if (!courseInfo) return null;

      const course = deserializeCourse(courseInfo.data as Buffer);

      const completedIndices = getCompletedLessonIndices(
        enrollment.lessonFlags,
        course.lessonCount,
      );
      const totalLessons = course.lessonCount;
      const percentage =
        totalLessons > 0
          ? Math.round((completedIndices.length / totalLessons) * 100)
          : 0;

      return {
        courseId,
        completedLessons: completedIndices,
        totalLessons,
        percentage,
        enrolledAt: new Date(enrollment.enrolledAt * 1000).toISOString(),
        completedAt: enrollment.completedAt
          ? new Date(enrollment.completedAt * 1000).toISOString()
          : undefined,
        lastAccessedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async getAllProgress(userId: string): Promise<Progress[]> {
    try {
      let learner: PublicKey;
      try {
        learner = new PublicKey(userId);
      } catch {
        return [];
      }

      // Fetch all program accounts owned by the program
      const accounts = await this.connection.getProgramAccounts(PROGRAM_ID, {
        commitment: "confirmed",
      });

      const progresses: Progress[] = [];

      for (const { account } of accounts) {
        const data = account.data as Buffer;
        // Skip accounts that are too small to be enrollments
        if (data.length < 80) continue;

        try {
          const enrollment = deserializeEnrollment(data);
          // We need to figure out the courseId to verify this enrollment belongs to this learner
          // Find the matching course
          for (const { account: acc2, pubkey } of accounts) {
            const d2 = acc2.data as Buffer;
            if (d2.length < 50) continue;
            try {
              const course = deserializeCourse(d2);
              if (!course.courseId) continue;

              const [expectedEnrollment] = getEnrollmentPda(
                course.courseId,
                learner,
              );
              const [coursePda] = getCoursePda(course.courseId);
              if (
                enrollment.course.equals(coursePda) &&
                expectedEnrollment.equals(pubkey)
              ) {
                // This enrollment belongs to this learner
                // Actually we need the enrollment pubkey, not the course pubkey
                // Let me just check by re-deriving
              }

              // Simpler approach: derive expected enrollment PDA and check
              const [enrollPda] = getEnrollmentPda(course.courseId, learner);
              // Check if this account's enrollment.course matches the course PDA
              if (enrollment.course.equals(coursePda)) {
                // Verify the enrollment PDA matches
                const enrollInfo =
                  await this.connection.getAccountInfo(enrollPda);
                if (enrollInfo) {
                  const completedIndices = getCompletedLessonIndices(
                    enrollment.lessonFlags,
                    course.lessonCount,
                  );
                  const percentage =
                    course.lessonCount > 0
                      ? Math.round(
                          (completedIndices.length / course.lessonCount) * 100,
                        )
                      : 0;

                  progresses.push({
                    courseId: course.courseId,
                    completedLessons: completedIndices,
                    totalLessons: course.lessonCount,
                    percentage,
                    enrolledAt: new Date(
                      enrollment.enrolledAt * 1000,
                    ).toISOString(),
                    completedAt: enrollment.completedAt
                      ? new Date(enrollment.completedAt * 1000).toISOString()
                      : undefined,
                    lastAccessedAt: new Date().toISOString(),
                  });
                  break;
                }
              }
            } catch {
              continue;
            }
          }
        } catch {
          continue;
        }
      }

      return progresses;
    } catch {
      return [];
    }
  }

  async completeLesson(
    _userId: string,
    _courseId: string,
    _lessonIndex: number,
  ): Promise<void> {
    console.warn(
      "OnChainProgressService.completeLesson: Backend-signed operation",
    );
  }

  async enrollInCourse(userId: string, courseId: string): Promise<void> {
    if (!this.wallet) {
      throw new Error("Wallet not connected");
    }

    // Build the enroll instruction using the Anchor instruction discriminator
    // sha256("global:enroll")[..8] = discriminator for enroll instruction
    // Pre-computed discriminator to avoid runtime dependency
    const crypto = globalThis.crypto || (await import("crypto")).webcrypto;
    const hashBuf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode("global:enroll"),
    );
    const discriminator = Buffer.from(new Uint8Array(hashBuf).slice(0, 8));

    // Encode the courseId as a Borsh string (4-byte length + utf8 bytes)
    const courseIdBytes = Buffer.from(courseId, "utf8");
    const courseIdLen = Buffer.alloc(4);
    courseIdLen.writeUInt32LE(courseIdBytes.length, 0);

    const instructionData = Buffer.concat([
      discriminator,
      courseIdLen,
      courseIdBytes,
    ]);

    const [coursePda] = getCoursePda(courseId);
    const [enrollmentPda] = getEnrollmentPda(courseId, this.wallet.publicKey);

    const { TransactionInstruction } = await import("@solana/web3.js");

    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: coursePda, isSigner: false, isWritable: true },
        { pubkey: enrollmentPda, isSigner: false, isWritable: true },
        { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });

    const { blockhash } = await this.connection.getLatestBlockhash();
    const message = new TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    const signedTx = await this.wallet.signTransaction(tx);
    await this.connection.sendRawTransaction(signedTx.serialize());
  }

  // ---- Streaks -----------------------------------------------------------

  async getStreak(_userId: string): Promise<StreakData> {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
      streakFreezes: 0,
      activityCalendar: {},
    };
  }

  async recordActivity(_userId: string): Promise<StreakData> {
    return this.getStreak(_userId);
  }

  // ---- Leaderboard -------------------------------------------------------

  async getLeaderboard(
    _timeframe: "weekly" | "monthly" | "alltime",
    _courseId?: string,
  ): Promise<LeaderboardEntry[]> {
    try {
      const mint = await this.getXpMint();
      if (!mint) return [];

      const holders = await getXpTokenHolders(mint.toBase58());

      return holders.map((h, i) => ({
        rank: i + 1,
        wallet: h.owner,
        displayName: h.owner.slice(0, 4) + ".." + h.owner.slice(-4),
        xp: h.balance,
        level: levelFromXP(h.balance),
        streak: 0,
      }));
    } catch {
      return [];
    }
  }

  // ---- Credentials -------------------------------------------------------

  async getCredentials(wallet: string): Promise<Credential[]> {
    return getOnChainCredentials(wallet);
  }

  // ---- Achievements ------------------------------------------------------

  async getAchievements(_userId: string | null): Promise<Achievement[]> {
    return [];
  }

  async claimAchievement(
    _userId: string,
    _achievementId: number,
  ): Promise<void> {
    console.warn(
      "OnChainProgressService.claimAchievement: Backend-signed operation",
    );
  }
}
