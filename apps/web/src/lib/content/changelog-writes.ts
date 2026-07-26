import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { lessonsById, slotsByCourseId } from "@/lib/content/store";
import { diffMasks } from "@/lib/courses/changelog-diff";
import type {
  ChangelogKind,
  ChangelogLessonRef,
  DeployedDetail,
  LessonsDetail,
  XpChangedDetail,
  ContentUpdatedDetail,
  RecreatedDetail,
} from "@/lib/courses/changelog-types";
import type { Json } from "@/lib/supabase/types";

/**
 * Course changelog (#654) — WRITE seam.
 *
 * Every route that mutates a course's on-chain state records HERE, at mutation
 * time — not replayed from `CourseUpdated` events (the event carries only
 * version/collection/timestamp and cannot say which lesson slots moved). Each
 * mutator holds both the prior on-chain state and the intended new state in the
 * same call, which is what makes a meaningful diff possible. Coverage (#654 +
 * #738):
 *   - `api/admin/courses/sync`      → deployed / lessons_* / xp_changed /
 *                                     content_updated   (recordCourseDeployed,
 *                                     recordCourseUpdate)
 *   - `api/admin/courses/deactivate`→ deactivated       (recordCourseDeactivated)
 *   - `api/admin/courses/reactivate`→ reactivated       (recordCourseReactivated)
 *   - `lib/admin/recreate-course`   → recreated         (recordCourseRecreated)
 * All four go through {@link recordCourseChange} (the single low-level writer),
 * so the fifth mutator added later has one obvious seam to call rather than a
 * fresh inline supabase write. NOT logged, by design: the collection re-bind
 * (`setCourseCollectionPda`) and recreate's internal `restoreAfterCreate`
 * is_active restore — both are metadata plumbing / sub-steps of an operation
 * already captured by its own entry, not independent learner-facing changes.
 *
 * Lesson titles are SNAPSHOTTED into `detail` at capture time (a changelog is an
 * immutable historical record; a retired lesson may later vanish from the
 * bundle, and a renamed lesson should read under the name it had when it
 * changed). The read seam therefore never touches the content bundle.
 *
 * All writes go through the service-role client — the table has RLS on with a
 * public SELECT policy and NO write policy, so only service_role can insert.
 * Inserts are idempotent on `(course_id, kind, tx_signature)`: re-running the
 * same sync (same tx) never double-logs.
 */

type ChangelogInsert = {
  course_id: string;
  kind: ChangelogKind;
  version: number;
  detail: Json;
  tx_signature: string;
};

/**
 * Resolve a slot (bit index) to a lesson id + title snapshot from the committed
 * bundle. Inverts the course's `slots` map (lessonId → slot) once per call set.
 * Returns `{ slot, id: null, title: null }` when the slot is unknown to the
 * bundle (e.g. a slot retired before its lesson was tracked) so the entry still
 * records the slot number.
 */
function resolveSlots(courseId: string, slots: number[]): ChangelogLessonRef[] {
  const lock = slotsByCourseId.get(courseId);
  const slotToLessonId = new Map<number, string>();
  if (lock) {
    for (const [lessonId, slot] of Object.entries(lock.slots)) {
      slotToLessonId.set(slot, lessonId);
    }
  }
  return slots.map((slot) => {
    const id = slotToLessonId.get(slot) ?? null;
    const rawTitle = id ? lessonsById.get(id)?.title : undefined;
    const title = typeof rawTitle === "string" ? rawTitle : null;
    return { slot, id, title };
  });
}

async function insertEntries(rows: ChangelogInsert[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await createAdminClient()
    .from("course_changelog")
    .upsert(rows, {
      onConflict: "course_id,kind,tx_signature",
      ignoreDuplicates: true,
    });
  if (error) {
    // Non-fatal for the sync itself (the on-chain change already landed), but
    // surface it — a silently-dropped changelog row is a real regression.
    console.error(
      `[changelog] insert failed for ${rows[0]?.course_id}: ${error.message}`
    );
  }
}

/**
 * The single low-level writer every mutator records through (#738). One
 * `(course, kind, tx)` row, idempotent, non-fatal. `recordCourseDeployed` /
 * `recordCourseUpdate` build multiple rows in one call so they use
 * `insertEntries` directly; the single-row status/recreate recorders below
 * delegate here. Any future course mutator should call THIS rather than open a
 * fresh inline supabase write — that is the invariant #738 is enforcing.
 */
export async function recordCourseChange(params: {
  courseId: string;
  kind: ChangelogKind;
  version: number;
  txSignature: string;
  detail?: Json;
}): Promise<void> {
  await insertEntries([
    {
      course_id: params.courseId,
      kind: params.kind,
      version: params.version,
      detail: params.detail ?? {},
      tx_signature: params.txSignature,
    },
  ]);
}

/** Record a course's first on-chain deploy (create_course sets version = 1). */
export async function recordCourseDeployed(params: {
  courseId: string;
  txSignature: string;
  lessonCount: number;
}): Promise<void> {
  const detail: DeployedDetail = { lessonCount: params.lessonCount };
  await insertEntries([
    {
      course_id: params.courseId,
      kind: "deployed",
      version: 1,
      detail: detail as unknown as Json,
      tx_signature: params.txSignature,
    },
  ]);
}

/**
 * Record what an `update_course` changed. Given the prior on-chain state and the
 * intended new state, emit one row per change kind (a single sync can add
 * lessons AND change xp → two rows sharing tx/version).
 */
export async function recordCourseUpdate(params: {
  courseId: string;
  txSignature: string;
  /** Prior on-chain live-lesson mask. */
  oldMask: readonly bigint[];
  /** New mask sent this update, or `undefined` when the mask was untouched. */
  newMask?: readonly bigint[];
  oldXp: number;
  /** New xp-per-lesson sent this update, or `undefined` when untouched. */
  newXp?: number;
  /** True when `content_tx_id` was committed (bumps on-chain version by 1). */
  contentCommitted: boolean;
  /** New on-chain `course.version` after this update. */
  newVersion: number;
  /** The content bundle SHA pinned by this re-sync (for `content_updated`). */
  contentSha: string;
}): Promise<void> {
  const rows: ChangelogInsert[] = [];
  const base = {
    course_id: params.courseId,
    version: params.newVersion,
    tx_signature: params.txSignature,
  };

  let liveSetChanged = false;
  if (params.newMask) {
    const { addedSlots, removedSlots } = diffMasks(
      params.oldMask,
      params.newMask
    );
    if (addedSlots.length > 0) {
      liveSetChanged = true;
      const detail: LessonsDetail = {
        lessons: resolveSlots(params.courseId, addedSlots),
      };
      rows.push({
        ...base,
        kind: "lessons_added",
        detail: detail as unknown as Json,
      });
    }
    if (removedSlots.length > 0) {
      liveSetChanged = true;
      const detail: LessonsDetail = {
        lessons: resolveSlots(params.courseId, removedSlots),
      };
      rows.push({
        ...base,
        kind: "lessons_removed",
        detail: detail as unknown as Json,
      });
    }
  }

  // A content commit with NO live-lesson change is a pure re-sync (lesson text
  // edited, lessons reordered within the bundle, etc.). When lessons changed,
  // those rows already carry the version bump, so this would be redundant.
  if (params.contentCommitted && !liveSetChanged) {
    const detail: ContentUpdatedDetail = { sha: params.contentSha };
    rows.push({
      ...base,
      kind: "content_updated",
      detail: detail as unknown as Json,
    });
  }

  // XP change is independent of the content commit — only log a real delta.
  if (params.newXp !== undefined && params.newXp !== params.oldXp) {
    const detail: XpChangedDetail = { from: params.oldXp, to: params.newXp };
    rows.push({
      ...base,
      kind: "xp_changed",
      detail: detail as unknown as Json,
    });
  }

  await insertEntries(rows);
}

/**
 * Record a course deactivation (#738 — `api/admin/courses/deactivate`, the
 * path #713 retires the five superseded courses with). Deactivate does not
 * touch `content_tx_id`, so `version` is the course's CURRENT on-chain version,
 * unchanged — the caller reads it and passes it in.
 *
 * VISIBILITY: this entry is written while the course is (about to be) inactive,
 * and the #654 RLS policy scopes reads to synced+active courses — so it is
 * recorded but not publicly readable until the course is reactivated (at which
 * point the full deactivate→reactivate history becomes visible together). See
 * the PR/issue #738 note on why surfacing a retired course's log to enrolled
 * learners is deferred (it needs un-gating the course page, not just RLS).
 */
export async function recordCourseDeactivated(params: {
  courseId: string;
  txSignature: string;
  version: number;
}): Promise<void> {
  await recordCourseChange({
    courseId: params.courseId,
    kind: "deactivated",
    version: params.version,
    txSignature: params.txSignature,
  });
}

/**
 * Record a course reactivation (#738 — `api/admin/courses/reactivate`). Mirror
 * of {@link recordCourseDeactivated}; `version` is the current on-chain version
 * (reactivate does not bump it). The course is synced+active afterward, so this
 * entry — and any earlier `deactivated` one — is immediately readable.
 */
export async function recordCourseReactivated(params: {
  courseId: string;
  txSignature: string;
  version: number;
}): Promise<void> {
  await recordCourseChange({
    courseId: params.courseId,
    kind: "reactivated",
    version: params.version,
    txSignature: params.txSignature,
  });
}

/**
 * Record a close+recreate (#738 — `lib/admin/recreate-course.ts`, WS-2). This
 * is the most dramatic on-chain mutation: the Course PDA is closed and a fresh
 * one created. `create_course` resets `version` to 1, so that is the post-
 * recreate version. `lessonCount` is the live count preserved through the
 * recreate (H3 never widens it). The entry is keyed on the CREATE signature.
 * The course is synced+active afterward, so it is immediately readable.
 */
export async function recordCourseRecreated(params: {
  courseId: string;
  txSignature: string;
  lessonCount: number;
}): Promise<void> {
  const detail: RecreatedDetail = { lessonCount: params.lessonCount };
  await recordCourseChange({
    courseId: params.courseId,
    kind: "recreated",
    version: 1,
    txSignature: params.txSignature,
    detail: detail as unknown as Json,
  });
}
