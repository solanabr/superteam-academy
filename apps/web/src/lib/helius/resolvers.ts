import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, Idl } from "@coral-xyz/anchor";
import { createAdminClient } from "@/lib/supabase/admin";
import IDL from "@/lib/solana/idl/superteam_academy.json";

const coder = new BorshCoder(IDL as unknown as Idl);

/**
 * Resolve a wallet address to a Supabase user_id.
 * Returns null if no profile found (manual program interaction).
 */
export async function resolveUserId(
  walletAddress: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("wallet_address", walletAddress)
    .maybeSingle();
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
    if (!accountInfo) return null;

    const decoded = coder.accounts.decode("Course", accountInfo.data);
    const courseId = decoded.courseId as string;
    coursePdaCache.set(coursePda, courseId);
    return courseId;
  } catch {
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
    if (!course) return null;
    const allLessons = (course.modules ?? []).flatMap(
      (m: { lessons?: { _id: string }[] }) => m.lessons ?? []
    );
    return allLessons[lessonIndex]?._id ?? null;
  } catch {
    return null;
  }
}

/** Clear the course PDA cache (call between webhook invocations if needed) */
export function clearCoursePdaCache(): void {
  coursePdaCache.clear();
}
