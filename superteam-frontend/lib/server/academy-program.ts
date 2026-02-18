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

// ---------------------------------------------------------------------------
// TTL cache for RPC results — avoids repeated network calls within a window
// ---------------------------------------------------------------------------
type CacheEntry<T> = { value: T; expiresAt: number };
const rpcCache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 30_000; // 30 seconds

function cacheGet<T>(key: string): T | undefined {
  const entry = rpcCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    rpcCache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function cacheSet<T>(key: string, value: T, ttl = CACHE_TTL_MS): void {
  rpcCache.set(key, { value, expiresAt: Date.now() + ttl });
}

// Set of course IDs we already know exist on-chain (never expires within process)
const knownCourses = new Set<string>();

// Enrollment is a monotonic state — once confirmed on-chain, it should never
// appear as "missing" due to stale cache.  This Set tracks every
// (wallet, courseId) pair that we have seen exist so that a cached null
// can be bypassed with a fresh RPC call.
const knownEnrollments = new Set<string>();
const NULL_ENROLLMENT_TTL_MS = 5_000; // short TTL for "not enrolled yet"

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

function encodeUpdateCourseArgs(
  lessonsCount: number | null,
  isActive: boolean | null,
): Buffer {
  // update_course(lessons_count: Option<u16>, is_active: Option<bool>)
  // Borsh: Option<T> = 0 (None) | 1 + T (Some)
  const parts: Buffer[] = [
    Buffer.from([81, 217, 18, 192, 129, 233, 129, 231]), // update_course discriminator
  ];
  if (lessonsCount !== null) {
    parts.push(Buffer.from([1])); // Some
    parts.push(u16le(lessonsCount));
  } else {
    parts.push(Buffer.from([0])); // None
  }
  if (isActive !== null) {
    parts.push(Buffer.from([1])); // Some
    parts.push(Buffer.from([isActive ? 1 : 0]));
  } else {
    parts.push(Buffer.from([0])); // None
  }
  return Buffer.concat(parts);
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
  // Skip RPC entirely if we already know this course exists
  if (knownCourses.has(courseId)) return deriveCoursePda(courseId);

  try {
    const { connection, backend } = getClient();
    const coursePda = deriveCoursePda(courseId);
    const existing = await connection.getAccountInfo(coursePda);
    if (existing) {
      knownCourses.add(courseId);
      return coursePda;
    }

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

    knownCourses.add(courseId);
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

export async function updateCourseOnChain(
  courseId: string,
  lessonsCount: number | null,
  isActive: boolean | null,
): Promise<string> {
  const { connection, backend } = getClient();
  const coursePda = deriveCoursePda(courseId);

  const instruction = new TransactionInstruction({
    programId: new PublicKey(ACADEMY_PROGRAM_ID),
    keys: [
      { pubkey: coursePda, isSigner: false, isWritable: true },
      { pubkey: backend.publicKey, isSigner: true, isWritable: false },
    ],
    data: encodeUpdateCourseArgs(lessonsCount, isActive),
  });
  const tx = new Transaction().add(instruction);
  return sendAndConfirmTransaction(connection, tx, [backend], {
    commitment: "confirmed",
  });
}

export async function deactivateCourseOnChain(
  courseId: string,
): Promise<string> {
  return updateCourseOnChain(courseId, null, false);
}

export async function fetchLearnerProfile(
  user: PublicKey,
): Promise<any | null> {
  const cacheKey = `learner:${user.toBase58()}`;
  const cached = cacheGet<any | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const { connection } = getClient();
    const learner = deriveLearnerPda(user);
    const info = await connection.getAccountInfo(learner);
    const result = info ? { exists: true } : null;
    cacheSet(cacheKey, result);
    return result;
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
  const cacheKey = `enrollment:${user.toBase58()}:${courseId}`;
  const eKey = `${user.toBase58()}:${courseId}`;
  const cached = cacheGet<any | null>(cacheKey);

  if (cached !== undefined) {
    // Positive cache hit — always trust
    if (cached !== null) return cached;
    // Cached null, but we previously confirmed this enrollment exists.
    // Stale negative — bypass cache and do a fresh RPC call.
    if (knownEnrollments.has(eKey)) {
      rpcCache.delete(cacheKey);
    } else {
      return cached;
    }
  }

  try {
    const { connection } = getClient();
    const course = deriveCoursePda(courseId);
    const enrollment = deriveEnrollmentPda(course, user);
    const info = await connection.getAccountInfo(enrollment);
    if (!info) {
      cacheSet(cacheKey, null, NULL_ENROLLMENT_TTL_MS);
      return null;
    }
    const result = {
      lessonsCompleted: decodeEnrollmentLessonsCompleted(info.data),
    };
    knownEnrollments.add(eKey);
    cacheSet(cacheKey, result);
    return result;
  } catch (error: any) {
    if (
      error?.message?.includes("fetch failed") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.code === "ENOTFOUND"
    ) {
      // Network error: if enrollment was previously confirmed, return safe
      // fallback instead of a false negative that would block lesson completion.
      if (knownEnrollments.has(eKey)) {
        return { lessonsCompleted: 0 };
      }
      return null;
    }
    throw error;
  }
}

export function invalidateEnrollmentCache(user: PublicKey, courseId: string) {
  rpcCache.delete(`enrollment:${user.toBase58()}:${courseId}`);
  rpcCache.delete(`completedCount:${user.toBase58()}`);
  rpcCache.delete(`activity:${user.toBase58()}:365`);
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
    // Lesson completed successfully → enrollment must exist
    knownEnrollments.add(`${user.toBase58()}:${courseId}`);
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
  const cacheKey = `activity:${user.toBase58()}:${daysBack}`;
  const cached = cacheGet<ChainActivityData>(cacheKey);
  if (cached) return cached;

  try {
    const { connection } = getClient();
    const learnerPda = deriveLearnerPda(user);
    const signatures = await connection.getSignaturesForAddress(learnerPda, {
      limit: 200,
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

    const result = { days, recent };
    cacheSet(cacheKey, result, 60_000); // 60s cache for activity
    return result;
  } catch {
    return { days: [], recent: [] };
  }
}

/**
 * Batch-count how many courses the wallet has fully completed on-chain.
 * Uses a single getMultipleAccountsInfo RPC call.
 */
export async function countCompletedCoursesOnChain(
  walletAddress: string,
): Promise<number> {
  const cacheKey = `completedCount:${walletAddress}`;
  const cached = cacheGet<number>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const { connection } = getClient();
    const { courses } = await import("@/lib/course-catalog");
    const user = new PublicKey(walletAddress);

    const enrollmentPdas: PublicKey[] = [];
    const lessonCounts: number[] = [];
    for (const course of courses) {
      const coursePda = deriveCoursePda(course.slug);
      enrollmentPdas.push(deriveEnrollmentPda(coursePda, user));
      lessonCounts.push(
        course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
      );
    }

    const accounts = await connection.getMultipleAccountsInfo(enrollmentPdas);
    let completed = 0;
    for (let i = 0; i < accounts.length; i++) {
      const info = accounts[i];
      if (!info) continue;
      const lessonsCompleted = decodeEnrollmentLessonsCompleted(
        info.data as Buffer,
      );
      if (lessonsCompleted >= lessonCounts[i]) completed++;
    }
    cacheSet(cacheKey, completed);
    return completed;
  } catch {
    return 0;
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
    // Course finalized successfully → enrollment must exist
    knownEnrollments.add(`${user.toBase58()}:${courseId}`);
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
