import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { decodeCourse } from "@/lib/solana/academy-reads";

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

  if (!data && process.env.NODE_ENV === "development") {
    console.debug(
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

    const decoded = decodeCourse(accountInfo.data);
    const courseId = decoded.course_id;
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
 * Resolve an on-chain LessonCompleted event's index to a lesson_id.
 *
 * The event index IS the permanent on-chain SLOT (that is what the program sets
 * and what our completion route now sends — #741), NOT the lesson's position in
 * the flattened module array. Resolving it via array position (the old
 * `allLessons[index]`) would, on any sparse/reordered course, name the WRONG
 * lesson — writing a phantom `user_progress` row and an XP reason for a lesson
 * the learner never did. Resolve slot → lessonId through the committed slot lock.
 *
 * A retired or not-yet-synced slot has no live lesson → returns null, which the
 * caller (`handleLessonCompleted`) already handles gracefully: it skips the
 * progress upsert and falls the XP reason back to the raw index. Never throws —
 * a webhook that throws is retried into a loop.
 */
export async function resolveLessonId(
  courseId: string,
  lessonIndex: number
): Promise<string | null> {
  try {
    const { slotToLiveLessonId } = await import("@/lib/courses/lesson-slot");
    const lessonId = slotToLiveLessonId(courseId).get(lessonIndex) ?? null;
    if (!lessonId) {
      console.warn(
        `[resolver] No live lesson at slot ${lessonIndex} for course ${courseId} (retired or re-sync pending)`
      );
    }
    return lessonId;
  } catch (err) {
    console.error(
      `[resolver] resolveLessonId failed for course=${courseId} slot=${lessonIndex}:`,
      err
    );
    return null;
  }
}

/** Clear the course PDA cache (call between webhook invocations if needed) */
export function clearCoursePdaCache(): void {
  coursePdaCache.clear();
}
