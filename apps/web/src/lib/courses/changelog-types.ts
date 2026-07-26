/**
 * Course changelog (#654) — shared shapes for the post-deployment evolution log.
 *
 * This module is intentionally FREE of server-only imports (no content bundle,
 * no supabase) so both the capture seam (server) and the rendering component
 * (client) can share one discriminated union. The row's `kind` column is the
 * discriminant; `detail` is decoded into the matching payload at the read seam
 * (see {@link file://./changelog.ts}).
 */

/** The change kinds captured at mutation time. Mirrors the DB CHECK constraint. */
export type ChangelogKind =
  | "deployed"
  | "lessons_added"
  | "lessons_removed"
  | "xp_changed"
  | "content_updated"
  // #738 — the other on-chain course mutators, previously silent:
  | "deactivated" // deactivate route (is_active → false; #713 retirement path)
  | "reactivated" // reactivate route (is_active → true)
  | "recreated"; // close + recreate (WS-2), the account rebuild

/**
 * A lesson referenced by a changelog entry. `slot` is the permanent bit index
 * in the on-chain `active_lessons` mask (always known — it comes from the diff).
 * `id`/`title` are SNAPSHOTS taken at capture time and may be `null` when the
 * slot could not be resolved to a bundle lesson then (e.g. a retired slot whose
 * lesson was already gone) — rendering falls back to the slot number.
 */
export interface ChangelogLessonRef {
  slot: number;
  id: string | null;
  title: string | null;
}

export interface DeployedDetail {
  /** Live lesson count at first deploy. */
  lessonCount: number;
}
export interface LessonsDetail {
  lessons: ChangelogLessonRef[];
}
export interface XpChangedDetail {
  from: number;
  to: number;
}
export interface ContentUpdatedDetail {
  /** The content bundle git SHA this re-sync pinned. */
  sha: string;
}
export interface RecreatedDetail {
  /** Live lesson count preserved through the recreate (never widened — H3). */
  lessonCount: number;
}
/** Status flips carry no payload — the kind + version + timestamp say it all. */
export type StatusChangeDetail = Record<string, never>;

interface EntryBase {
  id: number;
  /** On-chain `course.version` after the change. */
  version: number;
  /** The mutation's on-chain signature (public). NOT NULL — the dedup key. */
  txSignature: string;
  /** ISO timestamp. */
  createdAt: string;
}

/**
 * A decoded, render-ready changelog entry. Discriminated on `kind` so the UI
 * can switch exhaustively and TypeScript narrows `detail` per branch.
 */
export type CourseChangelogEntry =
  | (EntryBase & { kind: "deployed"; detail: DeployedDetail })
  | (EntryBase & { kind: "lessons_added"; detail: LessonsDetail })
  | (EntryBase & { kind: "lessons_removed"; detail: LessonsDetail })
  | (EntryBase & { kind: "xp_changed"; detail: XpChangedDetail })
  | (EntryBase & { kind: "content_updated"; detail: ContentUpdatedDetail })
  | (EntryBase & { kind: "deactivated"; detail: StatusChangeDetail })
  | (EntryBase & { kind: "reactivated"; detail: StatusChangeDetail })
  | (EntryBase & { kind: "recreated"; detail: RecreatedDetail });
