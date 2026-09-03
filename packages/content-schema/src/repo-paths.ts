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
 * and gate 19's template-scoped exclusion) while the compiler never ships it.
 * Parked content is excluded from both.
 */
export function isExcludedContentPath(relPath: string): boolean {
  return relPath.startsWith(TEMPLATE_PREFIX) || isDraftPath(relPath);
}

/**
 * The translation overlay directory inside a course (academy-courses PR #51):
 * `courses/<slug>/l10n/<locale>/` mirrors the course folder and holds only
 * the files that DIFFER — a `strings.yaml` for structured strings, translated
 * `.md` prose and re-rendered images at their mirrored paths.
 */
export const L10N_DIR = "l10n";

/**
 * Three filenames are forbidden anywhere under `l10n/`. The compiler matches
 * them by suffix at ANY depth, so an overlay carrying one would ship as a
 * duplicate course or lesson (or a second slot lock). Structured strings go
 * in `strings.yaml`.
 */
export const L10N_FORBIDDEN_BASENAMES = [
  "course.yaml",
  "lesson.yaml",
  "slots.lock.json",
] as const;

export const L10N_STRINGS_FILE = "strings.yaml";

export interface L10nPath {
  /** The course directory the overlay belongs to (`courses/<slug>`). */
  courseDir: string;
  /** The folder name under `l10n/` — NOT yet validated as a known locale. */
  locale: string;
  /** Path inside the overlay, mirroring the course folder (`lessons/x/intro.md`). */
  rest: string;
}

const L10N_SEGMENT = /^(.*?)\/l10n\/([^/]+)\/(.+)$/;

/**
 * Split a repo-relative path that sits inside a course's translation
 * overlay, or null. Unanchored and depth-blind like every other compiler
 * rule here: whatever precedes `/l10n/` is the course dir. An `l10n/` at the
 * repo root (no course dir in front of it) does not match.
 *
 * The course-dir capture is LAZY, so the first `/l10n/` segment wins. A course
 * whose slug is literally `l10n` (`courses/l10n/l10n/en/…`) would therefore
 * mis-split; the slug regex allows it, nothing else about the tree does, and
 * it is not worth a special case — noted here so it is not rediscovered.
 */
export function parseL10nPath(relPath: string): L10nPath | null {
  const m = L10N_SEGMENT.exec(relPath);
  if (!m) return null;
  const [, courseDir, locale, rest] = m;
  if (!courseDir || !locale || !rest) return null;
  return { courseDir, locale, rest };
}

/** True for `courses/<slug>/l10n/<locale>/strings.yaml` — the one overlay DOCUMENT. */
export function isL10nStringsPath(relPath: string): boolean {
  return parseL10nPath(relPath)?.rest === L10N_STRINGS_FILE;
}

/** True when a file under `l10n/` carries one of the forbidden basenames. */
export function isForbiddenL10nPath(relPath: string): boolean {
  const l = parseL10nPath(relPath);
  if (!l) return false;
  const base = l.rest.slice(l.rest.lastIndexOf("/") + 1);
  return (L10N_FORBIDDEN_BASENAMES as readonly string[]).includes(base);
}

/** Collections whose `.yaml` files the compiler treats as documents, by prefix. */
const COMPILER_COLLECTION_PREFIXES = ["achievements/", "quests/", "paths/"];

/**
 * True when the bundle compiler would classify this path as a content DOCUMENT
 * and emit it — mirroring `validateTree`'s unanchored chain in
 * `apps/web/src/lib/content/compile/compile-bundle.ts` (and the identical chain
 * in `validate.ts`). Deliberately UNANCHORED and depth-blind, exactly like the
 * compiler: `courses/a/b/c/course.yaml` is a course to it.
 *
 * That is the whole asymmetry #973 turned on. content-lint's `classify()` is
 * anchored and fixed-depth, so a doc can be compiler-visible and lint-invisible.
 * Whenever that happens the file ships unlinted, so content-lint escalates such
 * a file to an ERROR rather than a warning (`unclassifiedContentFiles`).
 *
 * KNOWN GAP (follow-up, deliberately out of #973's scope): `slots.lock.json` is
 * also compiler-claimed but is `.json`, and the loader's unclassified scan only
 * walks `.yaml`. Same for `.yml`.
 */
export function isCompilerContentDoc(relPath: string): boolean {
  // The overlay branch runs FIRST in the compiler's chain, so a file under
  // `l10n/` is never a course or a lesson to it — its `strings.yaml` is the
  // only document the compiler emits from there.
  if (parseL10nPath(relPath)) return isL10nStringsPath(relPath);
  if (relPath.endsWith("/course.yaml") || relPath.endsWith("/lesson.yaml")) {
    return true;
  }
  return (
    relPath.endsWith(".yaml") &&
    COMPILER_COLLECTION_PREFIXES.some((p) => relPath.startsWith(p))
  );
}
