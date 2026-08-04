/**
 * Repo-path conventions of the academy-courses tree. Lives in content-schema
 * because it must be ONE rule: the bundle compiler (apps/web) and content-lint
 * (packages/content-lint) both walk the same tree, and #973 was exactly the bug
 * of them disagreeing — content-lint's anchored fixed-depth regexes silently
 * dropped `_draft/` files (so CI went green BECAUSE it could no longer see
 * them) while the compiler's unanchored `endsWith("/course.yaml")` compiled
 * them straight into the shipped bundle.
 */

/** `courses/_template/**` — the authoring scaffold (spec §4.1, §12), never synced. */
export const TEMPLATE_PREFIX = "courses/_template/";

/**
 * The parking directory. A course/path/achievement leaves the catalog by being
 * moved under `_draft/` rather than deleted, so its history and ids survive.
 */
export const DRAFT_DIR = "_draft";

/**
 * A `_draft` directory SEGMENT at any depth — not a prefix, because the parking
 * dir appears under each collection (`courses/_draft/x/course.yaml`,
 * `paths/_draft/p.yaml`, `achievements/_draft/a.yaml`, `quests/_draft/q.yaml`)
 * and may also be nested inside a course.
 *
 * Anchored on `/` (or string start) left and `/` right so it matches a directory
 * and only a directory: `courses/_drafts/…` (typo) and `courses/x/_draft.md`
 * are NOT parked. A near-miss must stay visible and get flagged, not vanish —
 * that is what content-lint's unclassified-file diagnostic is for.
 */
const DRAFT_SEGMENT = /(?:^|\/)_draft\//;

/** True when a repo-relative POSIX path sits under a `_draft/` parking directory. */
export function isDraftPath(relPath: string): boolean {
  return DRAFT_SEGMENT.test(relPath);
}

/**
 * True when a repo-relative POSIX path carries no shippable content: parked, or
 * the authoring scaffold.
 *
 * Note the asymmetry with {@link isDraftPath}: content-lint deliberately LINTS
 * `courses/_template/**` (the scaffold must stay valid — see the `good` fixture
 * and gate 19's own narrower `TEMPLATE_LESSON_PREFIX`) while the compiler never
 * ships it. Parked content is excluded from both.
 */
export function isExcludedContentPath(relPath: string): boolean {
  return relPath.startsWith(TEMPLATE_PREFIX) || isDraftPath(relPath);
}
