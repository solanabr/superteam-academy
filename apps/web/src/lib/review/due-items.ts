import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Per-session flood-shaping cap (LX-B4 hard constraint, from PR #689's
 * adversarial review). The #569 seed enqueues EVERY completed lesson as a box-1
 * item due tomorrow, simultaneously, for the whole cohort — so the first time
 * any learner-facing surface reads the queue, a heavy learner would face their
 * entire backlog as one wall. The spec sizes the review surface at "a 3–6-item
 * Leitner review strip" (unified spec §1; LX-B6 dashboard strip: "3–6 due
 * items"). `6` is the upper bound of that band and the HARD ceiling: no surface
 * may pull more than this in one read.
 *
 * This is why the cap is a shared primitive and not a per-caller `.limit(...)`:
 * the /review page (#571) and the dashboard strip (#572) both go through
 * `getDueReviewItems`, which clamps to `REVIEW_SESSION_CAP` regardless of the
 * requested limit, so neither can ship an uncapped read.
 */
export const REVIEW_SESSION_CAP = 6;

/** A due review item as the feed surfaces consume it (own-row read). */
export type DueReviewItem = Pick<
  Database["public"]["Tables"]["review_items"]["Row"],
  "item_key" | "box" | "due_at" | "lapses"
>;

/**
 * Read a learner's DUE review items (`due_at <= now`), soonest first, capped to
 * `REVIEW_SESSION_CAP`. This is the ONE read path for every review surface.
 *
 * Works with any client: own-row RLS SELECT (LX-B3) restricts an authenticated
 * client to the learner's own rows automatically, while the explicit
 * `user_id` filter keeps it correct under the RLS-bypassing admin client too.
 *
 * `limit` may narrow the pull (e.g. a 3-item dashboard strip) but is CLAMPED to
 * the cap — a caller can never widen past it. A non-positive limit yields the
 * empty set (nothing due to show), never a negative `.limit`.
 */
export async function getDueReviewItems(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: { limit?: number; now?: Date } = {}
): Promise<DueReviewItem[]> {
  const requested = options.limit ?? REVIEW_SESSION_CAP;
  const cap = Math.min(Math.max(0, requested), REVIEW_SESSION_CAP);
  if (cap === 0) return [];

  const nowIso = (options.now ?? new Date()).toISOString();

  const { data, error } = await supabase
    .from("review_items")
    .select("item_key, box, due_at, lapses")
    .eq("user_id", userId)
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(cap);

  if (error) throw new Error(error.message);
  return data ?? [];
}
