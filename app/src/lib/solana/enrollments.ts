import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { program, PROGRAM_ID } from "./program";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OnChainEnrollment {
  courseId: string;
  coursePda: PublicKey;
  enrolledAt: number; // unix ms
  completedAt: number | null; // unix ms
  progressPct: number;
  lessonFlags: BN[]; // [u64; 4] bitmap
  credentialAsset: PublicKey | null;
}

// ---------------------------------------------------------------------------
// PDA helper — single canonical derivation used everywhere
// ---------------------------------------------------------------------------

export function getCoursePDA(courseId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(courseId)],
    PROGRAM_ID,
  );
  return pda;
}

export function getEnrollmentPDA(courseId: string, learner: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
    PROGRAM_ID,
  );
  return pda;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

type RawEnrollment = Awaited<ReturnType<typeof program.account.enrollment.fetch>>;

/** Fetch a single enrollment. Returns null if the account does not exist. */
export async function fetchEnrollment(
  courseId: string,
  learner: PublicKey,
  totalLessons: number,
): Promise<OnChainEnrollment | null> {
  try {
    const pda = getEnrollmentPDA(courseId, learner);
    const raw = await program.account.enrollment.fetchNullable(pda);
    if (!raw) return null;
    return decode(courseId, raw, totalLessons);
  } catch {
    return null;
  }
}

/**
 * Batch-fetch enrollments for many courses in one RPC call.
 * Courses with no on-chain enrollment are omitted from the result.
 */
export async function fetchEnrollments(
  courses: { courseId: string; totalLessons: number }[],
  learner: PublicKey,
): Promise<OnChainEnrollment[]> {
  if (!courses.length) return [];
  try {
    const pdas = courses.map((c) => getEnrollmentPDA(c.courseId, learner));
    const accounts = await program.account.enrollment.fetchMultiple(pdas);
    return accounts.flatMap((raw, i) =>
      raw ? [decode(courses[i].courseId, raw, courses[i].totalLessons)] : [],
    );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Internal decoder
// ---------------------------------------------------------------------------

function decode(
  courseId: string,
  raw: RawEnrollment,
  totalLessons: number,
): OnChainEnrollment {
  const flags = raw.lessonFlags as BN[];
  const completedCount = flags.reduce((sum, f) => sum + popcount(f), 0);
  const progressPct =
    totalLessons > 0 ? Math.min(100, (completedCount / totalLessons) * 100) : 0;

  return {
    courseId,
    coursePda: raw.course as PublicKey,
    // i64 timestamp (seconds) → JS ms
    enrolledAt: (raw.enrolledAt as BN).toNumber() * 1000,
    completedAt: raw.completedAt
      ? (raw.completedAt as BN).toNumber() * 1000
      : null,
    progressPct,
    lessonFlags: flags,
    credentialAsset: (raw.credentialAsset as PublicKey | null) ?? null,
  };
}

function popcount(n: BN): number {
  let count = 0;
  let v = n.clone();
  while (!v.isZero()) {
    if (v.isOdd()) count++;
    v = v.shrn(1);
  }
  return count;
}
