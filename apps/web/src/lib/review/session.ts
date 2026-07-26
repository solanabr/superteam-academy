import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { resolveReviewItems } from "@/lib/content/queries";
import { getDueReviewItems } from "./due-items";
import { interleaveReviewSession, type ReviewSessionItem } from "./interleave";

/**
 * Build a learner's review session (LX-B5): the due queue (capped to
 * `REVIEW_SESSION_CAP` by `getDueReviewItems` — the ONE read path, so the
 * /review page can never ship an uncapped read), resolved against the content
 * bundle and confusable-pair interleaved.
 *
 * Items whose lesson is no longer in the bundle are dropped by
 * `resolveReviewItems`, so the returned length may be below the due count; it is
 * never above the cap. Ordering is due-first, then interleaved.
 */
export async function buildReviewSession(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ReviewSessionItem[]> {
  const due = await getDueReviewItems(supabase, userId);
  if (due.length === 0) return [];

  const boxByKey = new Map(due.map((d) => [d.item_key, d.box]));
  const resolved = await resolveReviewItems(due.map((d) => d.item_key));

  const items: ReviewSessionItem[] = resolved.map((r) => ({
    itemKey: r.itemKey,
    box: boxByKey.get(r.itemKey) ?? 1,
    lessonTitle: r.lessonTitle,
    courseSlug: r.courseSlug,
    lessonSlug: r.lessonSlug,
    skills: r.skills,
    quiz: r.quiz,
  }));

  return interleaveReviewSession(items);
}
