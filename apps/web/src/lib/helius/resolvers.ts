import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, Idl } from "@coral-xyz/anchor";
import { createAdminClient } from "@/lib/supabase/admin";
import IDL from "@/lib/solana/idl/superteam_academy.json";

// Double cast: JSON import lacks Anchor's Idl type shape at compile time
const coder = new BorshCoder(IDL as unknown as Idl);

/**
 * Resolve a wallet address to a Supabase user_id.
 * Returns null if no profile found (manual program interaction).
 */
export async function resolveUserId(
  walletAddress: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) {
    console.error(
      `[resolver] resolveUserId failed for ${walletAddress}:`,
      error.message
    );
    return null;
  }

  if (!data) {
    console.log(
      `[resolver] No profile found for wallet ${walletAddress} — skipping event`
    );
  }

  return data?.id ?? null;
}

/** Cache for course PDA → course_id lookups within a single webhook invocation */
const coursePdaCache = new Map<string, string>();

/**
 * Resolve a course PDA (Pubkey) to its string course_id.
 * Fetches the on-chain Course account and reads the course_id field.
 * Cached per webhook invocation to avoid redundant RPC calls.
 */
export async function resolveCourseId(
  coursePda: string,
  connection: Connection
): Promise<string | null> {
  if (coursePdaCache.has(coursePda)) {
    return coursePdaCache.get(coursePda)!;
  }

  try {
    const accountInfo = await connection.getAccountInfo(
      new PublicKey(coursePda)
    );
    if (!accountInfo) {
      console.warn(
        `[resolver] No on-chain account found for course PDA ${coursePda}`
      );
      return null;
    }

    const decoded = coder.accounts.decode("Course", accountInfo.data);
    const courseId = decoded.courseId as string;
    coursePdaCache.set(coursePda, courseId);
    return courseId;
  } catch (err) {
    console.error(
      `[resolver] resolveCourseId failed for PDA ${coursePda}:`,
      err
    );
    return null;
  }
}

/**
 * Resolve lesson_index to lesson_id using Sanity course structure.
 * Flattens modules → lessons and returns the lesson at the given index.
 */
export async function resolveLessonId(
  courseId: string,
  lessonIndex: number
): Promise<string | null> {
  // Dynamic import to avoid pulling Sanity client into non-page contexts
  const { getCourseById } = await import("@/lib/sanity/queries");
  try {
    const course = await getCourseById(courseId);
    if (!course) {
      console.warn(`[resolver] No Sanity course found for ${courseId}`);
      return null;
    }
    const allLessons = (course.modules ?? []).flatMap(
      (m: { lessons?: { _id: string }[] }) => m.lessons ?? []
    );
    const lessonId = allLessons[lessonIndex]?._id ?? null;
    if (!lessonId) {
      console.warn(
        `[resolver] No lesson at index ${lessonIndex} for course ${courseId} (total: ${allLessons.length})`
      );
    }
    return lessonId;
  } catch (err) {
    console.error(
      `[resolver] resolveLessonId failed for course=${courseId} index=${lessonIndex}:`,
      err
    );
    return null;
  }
}

/** Clear the course PDA cache (call between webhook invocations if needed) */
export function clearCoursePdaCache(): void {
  coursePdaCache.clear();
}
