import "server-only";

import fs from "fs";
import path from "path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ACADEMY_CLUSTER,
  ACADEMY_PROGRAM_ID,
  ACADEMY_RPC_URL,
} from "@/lib/generated/academy-program";

const CONFIG_SEED = "config";
const LEARNER_SEED = "learner";
const COURSE_SEED = "course";
const ENROLLMENT_SEED = "enrollment";

let cachedConnection: Connection | null = null;
let cachedBackendKeypair: Keypair | null = null;

function keypair(): string {
  return "[254,140,9,1,99,219,118,106,147,86,25,95,78,31,254,148,163,95,183,208,127,190,220,93,191,49,4,154,248,236,22,50,171,175,142,158,235,36,219,4,123,33,90,21,193,6,145,227,74,158,145,17,180,214,51,12,198,229,67,107,195,236,182,231]";
}

function loadKeypair(): Keypair {
  const kp = keypair();
  const secret = Uint8Array.from(JSON.parse(kp) as number[]);
  return Keypair.fromSecretKey(secret);
}

function getClient(): { connection: Connection; backend: Keypair } {
  if (cachedConnection && cachedBackendKeypair) {
    return { connection: cachedConnection, backend: cachedBackendKeypair };
  }
  const backend = loadKeypair();
  const connection = new Connection(ACADEMY_RPC_URL, "confirmed");
  cachedConnection = connection;
  cachedBackendKeypair = backend;
  return { connection, backend };
}

function u16le(value: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(value, 0);
  return b;
}

function u32le(value: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(value, 0);
  return b;
}

function encodeCreateCourseArgs(
  courseId: string,
  lessonsCount: number,
  trackId: number,
): Buffer {
  const courseIdBytes = Buffer.from(courseId);
  return Buffer.concat([
    Buffer.from([120, 121, 154, 164, 107, 180, 167, 241]), // create_course discriminator
    u32le(courseIdBytes.length),
    courseIdBytes,
    u16le(lessonsCount),
    u16le(trackId),
  ]);
}

function decodeEnrollmentLessonsCompleted(data: Buffer): number {
  // 8 bytes discriminator + 32 course + 32 user
  return data.readUInt16LE(8 + 32 + 32);
}

export function deriveConfigPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    new PublicKey(ACADEMY_PROGRAM_ID),
  )[0];
}

export function deriveLearnerPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(LEARNER_SEED), user.toBuffer()],
    new PublicKey(ACADEMY_PROGRAM_ID),
  )[0];
}

export function deriveCoursePda(courseId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(COURSE_SEED), Buffer.from(courseId)],
    new PublicKey(ACADEMY_PROGRAM_ID),
  )[0];
}

export function deriveEnrollmentPda(
  course: PublicKey,
  user: PublicKey,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ENROLLMENT_SEED), course.toBuffer(), user.toBuffer()],
    new PublicKey(ACADEMY_PROGRAM_ID),
  )[0];
}

export async function ensureCourseOnChain(
  courseId: string,
  lessonsCount: number,
  trackId: number,
) {
  try {
    const { connection, backend } = getClient();
    const coursePda = deriveCoursePda(courseId);
    const existing = await connection.getAccountInfo(coursePda);
    if (existing) return coursePda;

    const instruction = new TransactionInstruction({
      programId: new PublicKey(ACADEMY_PROGRAM_ID),
      keys: [
        { pubkey: deriveConfigPda(), isSigner: false, isWritable: true },
        { pubkey: coursePda, isSigner: false, isWritable: true },
        { pubkey: backend.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: encodeCreateCourseArgs(courseId, lessonsCount, trackId),
    });
    const tx = new Transaction().add(instruction);
    await sendAndConfirmTransaction(connection, tx, [backend], {
      commitment: "confirmed",
    });

    return coursePda;
  } catch (error: any) {
    // Network errors - return PDA anyway (course may exist, we just can't verify)
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      console.warn(
        `Network error ensuring course ${courseId}, returning PDA anyway:`,
        error.message,
      );
      return deriveCoursePda(courseId);
    }
    throw error;
  }
}

export async function fetchLearnerProfile(
  user: PublicKey,
): Promise<any | null> {
  try {
    const { connection } = getClient();
    const learner = deriveLearnerPda(user);
    const info = await connection.getAccountInfo(learner);
    return info ? { exists: true } : null;
  } catch (error: any) {
    // Network errors - assume no profile (safe fallback)
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      return null;
    }
    throw error;
  }
}

export async function fetchEnrollment(
  user: PublicKey,
  courseId: string,
): Promise<any | null> {
  try {
    const { connection } = getClient();
    const course = deriveCoursePda(courseId);
    const enrollment = deriveEnrollmentPda(course, user);
    const info = await connection.getAccountInfo(enrollment);
    if (!info) return null;
    return {
      lessonsCompleted: decodeEnrollmentLessonsCompleted(info.data),
    };
  } catch (error: any) {
    // Network errors - assume not enrolled (safe fallback)
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      return null;
    }
    throw error;
  }
}

export async function completeLessonOnChain(
  user: PublicKey,
  courseId: string,
): Promise<string> {
  try {
    const { connection, backend } = getClient();
    const course = deriveCoursePda(courseId);
    const learner = deriveLearnerPda(user);
    const enrollment = deriveEnrollmentPda(course, user);

    const instruction = new TransactionInstruction({
      programId: new PublicKey(ACADEMY_PROGRAM_ID),
      keys: [
        { pubkey: deriveConfigPda(), isSigner: false, isWritable: false },
        { pubkey: learner, isSigner: false, isWritable: true },
        { pubkey: course, isSigner: false, isWritable: true },
        { pubkey: enrollment, isSigner: false, isWritable: true },
        { pubkey: backend.publicKey, isSigner: true, isWritable: false },
      ],
      data: Buffer.from([77, 217, 53, 132, 204, 150, 169, 58]), // complete_lesson
    });
    const tx = new Transaction().add(instruction);
    const sig = await sendAndConfirmTransaction(connection, tx, [backend], {
      commitment: "confirmed",
    });
    return sig;
  } catch (error: any) {
    // Network errors - rethrow with clearer message
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      throw new Error(
        "Network error: Unable to connect to Solana RPC. Please check your internet connection.",
      );
    }
    throw error;
  }
}

function countToIntensity(count: number): number {
  if (count >= 6) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

export type ChainActivityItem = {
  type: "lesson" | "course";
  text: string;
  course: string;
  xp: number;
  ts: number;
};

export type ChainActivityData = {
  days: Array<{ date: string; intensity: number; count: number }>;
  recent: ChainActivityItem[];
};

/**
 * Single RPC call to fetch learner signatures, then derive both
 * heatmap days and recent activity items from the same data.
 */
export async function fetchChainActivity(
  user: PublicKey,
  daysBack: number,
  recentLimit = 20,
): Promise<ChainActivityData> {
  try {
    const { connection } = getClient();
    const learnerPda = deriveLearnerPda(user);
    const signatures = await connection.getSignaturesForAddress(learnerPda, {
      limit: 1000,
    });

    const cutoff = Date.now() / 1000 - daysBack * 86400;
    const countsByDate = new Map<string, number>();
    const recent: ChainActivityItem[] = [];

    for (const sig of signatures) {
      if (!sig.blockTime || sig.err) continue;
      if (sig.blockTime >= cutoff) {
        const date = new Date(sig.blockTime * 1000)
          .toISOString()
          .split("T")[0]!;
        countsByDate.set(date, (countsByDate.get(date) ?? 0) + 1);
      }
      if (recent.length < recentLimit) {
        recent.push({
          type: "lesson",
          text: "Completed a lesson",
          course: "",
          xp: 50,
          ts: sig.blockTime * 1000,
        });
      }
    }

    const days: ChainActivityData["days"] = [];
    for (const [date, count] of countsByDate) {
      days.push({ date, intensity: countToIntensity(count), count });
    }

    return { days, recent };
  } catch {
    return { days: [], recent: [] };
  }
}

/** @deprecated use fetchChainActivity instead */
export async function fetchActivityFromChain(
  user: PublicKey,
  daysBack: number,
): Promise<Array<{ date: string; intensity: number; count: number }>> {
  const { days } = await fetchChainActivity(user, daysBack);
  return days;
}

/** @deprecated use fetchChainActivity instead */
export async function fetchRecentActivityFromChain(
  user: PublicKey,
  limit = 20,
): Promise<ChainActivityItem[]> {
  const { recent } = await fetchChainActivity(user, 365, limit);
  return recent;
}

export async function finalizeCourseOnChain(
  user: PublicKey,
  courseId: string,
): Promise<string> {
  try {
    const { connection, backend } = getClient();
    const course = deriveCoursePda(courseId);
    const learner = deriveLearnerPda(user);
    const enrollment = deriveEnrollmentPda(course, user);

    const instruction = new TransactionInstruction({
      programId: new PublicKey(ACADEMY_PROGRAM_ID),
      keys: [
        { pubkey: deriveConfigPda(), isSigner: false, isWritable: false },
        { pubkey: learner, isSigner: false, isWritable: true },
        { pubkey: course, isSigner: false, isWritable: true },
        { pubkey: enrollment, isSigner: false, isWritable: true },
        { pubkey: backend.publicKey, isSigner: true, isWritable: false },
      ],
      data: Buffer.from([68, 189, 122, 239, 39, 121, 16, 218]), // finalize_course
    });
    const tx = new Transaction().add(instruction);
    const sig = await sendAndConfirmTransaction(connection, tx, [backend], {
      commitment: "confirmed",
    });
    return sig;
  } catch (error: any) {
    // Network errors - rethrow with clearer message
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      throw new Error(
        "Network error: Unable to connect to Solana RPC. Please check your internet connection.",
      );
    }
    throw error;
  }
}
