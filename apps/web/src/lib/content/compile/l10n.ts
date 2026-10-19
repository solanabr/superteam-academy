import { parse as parseYaml } from "yaml";
import {
  CONTENT_LOCALES,
  L10N_STRINGS_FILE,
  L10nStrings,
  isForbiddenL10nPath,
  parseL10nPath,
  type CourseT,
  type L10nBlockT,
  type L10nStringsT,
  type LessonT,
} from "@superteam-lms/content-schema";
import {
  ASSET_EXT_ALLOWLIST,
  MAX_ASSET_BYTES,
  rewriteMarkdownAssetPaths,
} from "./assets";

/**
 * Course translations in the compiler (academy-courses PR #51).
 *
 * A course is one course in every language it is available in. The base tree
 * IS the source language (`course.yaml` `sourceLocale`); every other language
 * is an OVERLAY at `courses/<slug>/l10n/<locale>/` that mirrors the course
 * folder and holds only what differs — a `strings.yaml` for structured
 * strings, translated `.md` prose and re-rendered images at their mirrored
 * paths. Anything absent falls back to the source, per item.
 *
 * This module owns the overlay end to end:
 *
 *  1. `collectL10nFile` — classification, shared by the bundle compiler and
 *     the admin-sync validator so the two can never disagree about what an
 *     overlay file is (#973 was exactly that disagreement, for `_draft/`).
 *  2. `validateL10n` — every overlay key must name something real in the
 *     source course: a module key, a lesson slug, a block key of the right
 *     type, a question/option/test id, a hint index in range, a prose file a
 *     block actually reads, an image the source actually has. Fail-closed:
 *     a translation can never bind to nothing and never ship a duplicate
 *     document.
 *  3. `planL10n` — the emitted `l10n.json`, keyed by course id → locale, with
 *     translated prose already rewritten to image urls (localized image
 *     where one exists, the source image otherwise).
 *
 * The Zod shape (`L10nStrings`, strictObject throughout) is what keeps an
 * overlay structurally incapable of carrying an id, a `correct` flag, an XP
 * value, a `starter`/`solution` or a test's `input`/`expectedOutput`. This
 * module adds the cross-reference checks the shape alone cannot express.
 */

/** One overlay folder as collected from the tree, before validation. */
export interface L10nOverlayInput {
  courseDir: string;
  /** The folder name under `l10n/` — validated against `CONTENT_LOCALES` later. */
  locale: string;
  /** Parsed + Zod-validated `strings.yaml`, or null when the folder has none. */
  strings: L10nStringsT | null;
  /** Repo path of `strings.yaml`, for diagnostics. */
  stringsPath: string | null;
  /** overlay-relative path (`lessons/x/intro.md`) → markdown body. */
  prose: Map<string, string>;
  /** overlay-relative path (`lessons/x/assets/a.png`, `assets/banner.webp`) → its repo path and size. */
  assets: Map<string, { path: string; size: number }>;
}

export type L10nOverlays = Map<string, L10nOverlayInput>;

const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/** Map key for one overlay folder. `/` cannot appear in a locale and `|`
 *  cannot appear in a repo path segment, so the pair is unambiguous. */
const overlayKey = (courseDir: string, locale: string): string =>
  `${courseDir}|${locale}`;

/**
 * The overlay folder a path sits in, created on first sight. Null when the
 * path is not under `l10n/`; `overlay: null` when it is, but carries one of
 * the forbidden basenames. That is an error rather than a silent skip: the
 * author believed they were shipping a translation.
 */
function overlayFor(
  path: string,
  overlays: L10nOverlays,
  issues: string[]
): { overlay: L10nOverlayInput | null; rest: string } | null {
  const l = parseL10nPath(path);
  if (!l) return null;

  if (isForbiddenL10nPath(path)) {
    issues.push(
      `${path}: this filename is forbidden under l10n/ — an overlay carries display strings and images only; structured strings go in ${L10N_STRINGS_FILE}`
    );
    return { overlay: null, rest: l.rest };
  }

  const key = overlayKey(l.courseDir, l.locale);
  let overlay = overlays.get(key);
  if (!overlay) {
    overlay = {
      courseDir: l.courseDir,
      locale: l.locale,
      strings: null,
      stringsPath: null,
      prose: new Map(),
      assets: new Map(),
    };
    overlays.set(key, overlay);
  }
  return { overlay, rest: l.rest };
}

/**
 * Classify one non-image tree entry as overlay content. Returns true when the
 * path sits under an `l10n/` directory (and is therefore fully handled here,
 * whatever it was), false when the caller's ordinary chain should see it.
 *
 * This runs FIRST in both classifiers, which is what stops an overlay's
 * files from ever being read as a course, a lesson, source prose or a source
 * asset.
 */
export function collectL10nFile(
  path: string,
  bytes: Uint8Array,
  overlays: L10nOverlays,
  issues: string[]
): boolean {
  const at = overlayFor(path, overlays, issues);
  if (!at) return false;
  const { overlay, rest } = at;
  if (!overlay) return true;

  if (rest === L10N_STRINGS_FILE) {
    try {
      overlay.strings = L10nStrings.parse(parseYaml(text(bytes)));
      overlay.stringsPath = path;
    } catch (e) {
      issues.push(formatZod(path, e));
    }
  } else if (rest.endsWith(".md")) {
    overlay.prose.set(rest, text(bytes));
  }
  // Anything else under l10n/ (a translator's `visual-src/`, a README) is a
  // build input at most — never shipped, never an error.
  return true;
}

/** {@link collectL10nFile} for an image, which the tree carries by size and hash only. */
export function collectL10nImage(
  path: string,
  size: number,
  overlays: L10nOverlays,
  issues: string[]
): boolean {
  const at = overlayFor(path, overlays, issues);
  if (!at) return false;
  at.overlay?.assets.set(at.rest, { path, size });
  return true;
}

function formatZod(where: string, e: unknown): string {
  if (e && typeof e === "object" && "issues" in e) {
    const issues = (
      e as { issues: { path: (string | number)[]; message: string }[] }
    ).issues;
    return `${where}:\n${issues
      .map((i) => `    - ${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("\n")}`;
  }
  return `${where}: ${e instanceof Error ? e.message : String(e)}`;
}

// ── validation ──────────────────────────────────────────────────────────────

export interface L10nSourceView {
  courses: readonly CourseT[];
  lessons: readonly { dir: string; lesson: LessonT }[];
  /** course id → repo dir. */
  courseDirById: ReadonlyMap<string, string>;
}

/** Which overlay leaves each source block type may carry. */
const FIELDS_BY_BLOCK_TYPE: Record<string, ReadonlySet<keyof L10nBlockT>> = {
  openEnded: new Set(["prompt"]),
  parsons: new Set(["prompt", "explanation"]),
  video: new Set(["url"]),
  code: new Set(["hints", "tutorNotes", "tests"]),
  quiz: new Set(["questions"]),
};

interface TestsResolver {
  (dir: string, rel: string): { id?: unknown }[];
}

/**
 * Cross-reference every overlay against the real source course. Accumulates
 * issues; the caller throws once. An overlay folder for the SOURCE locale is
 * an error too — it can only ever be a mistake, and honouring it would let a
 * "translation" silently rewrite the original.
 */
export function validateL10n(
  overlays: L10nOverlays,
  source: L10nSourceView,
  /** Every path in the repo snapshot, images included. */
  tree: { has(path: string): boolean },
  resolveTests: TestsResolver
): string[] {
  const issues: string[] = [];
  const courseByDir = new Map<string, CourseT>();
  for (const c of source.courses) {
    const dir = source.courseDirById.get(c.id);
    if (dir) courseByDir.set(dir, c);
  }

  for (const o of overlays.values()) {
    const where = `${o.courseDir}/l10n/${o.locale}`;
    const course = courseByDir.get(o.courseDir);
    if (!course) {
      issues.push(`${where}: overlay under a directory with no course.yaml`);
      continue;
    }
    if (!(CONTENT_LOCALES as readonly string[]).includes(o.locale)) {
      issues.push(
        `${where}: "${o.locale}" is not a supported locale (${CONTENT_LOCALES.join(", ")})`
      );
      continue;
    }
    if (o.locale === course.sourceLocale) {
      issues.push(
        `${where}: "${o.locale}" is this course's sourceLocale — the base tree already IS that language`
      );
      continue;
    }
    if (o.strings && o.strings.locale !== o.locale) {
      issues.push(
        `${o.stringsPath}: locale "${o.strings.locale}" does not match the folder "${o.locale}" (case matters in git even where it does not on disk)`
      );
    }

    const lessonsInCourse = source.lessons.filter(({ dir }) =>
      dir.startsWith(`${o.courseDir}/`)
    );
    const lessonBySlug = new Map(
      lessonsInCourse.map((l) => [l.lesson.slug, l] as const)
    );

    // ── strings.yaml ──
    const moduleKeys = new Set(course.modules.map((m) => m.key));
    for (const key of Object.keys(o.strings?.course?.modules ?? {})) {
      if (!moduleKeys.has(key)) {
        issues.push(
          `${o.stringsPath}: course.modules.${key}: no such module key`
        );
      }
    }
    for (const [slug, entry] of Object.entries(o.strings?.lessons ?? {})) {
      const found = lessonBySlug.get(slug);
      if (!found) {
        issues.push(
          `${o.stringsPath}: lessons.${slug}: no lesson with that slug in this course`
        );
        continue;
      }
      const blockByKey = new Map(found.lesson.blocks.map((b) => [b.key, b]));
      for (const [key, stanza] of Object.entries(entry.blocks ?? {})) {
        const at = `${o.stringsPath}: lessons.${slug}.blocks.${key}`;
        const block = blockByKey.get(key);
        if (!block) {
          issues.push(`${at}: no such block key`);
          continue;
        }
        const allowed = FIELDS_BY_BLOCK_TYPE[block.type] ?? new Set();
        for (const field of Object.keys(stanza) as (keyof L10nBlockT)[]) {
          if (!allowed.has(field)) {
            issues.push(
              `${at}.${field}: a ${block.type} block has no translatable "${field}"`
            );
          }
        }
        if (block.type === "code") {
          checkIndexed(stanza.hints, block.hints.length, `${at}.hints`, issues);
          checkIndexed(
            stanza.tutorNotes,
            block.tutorNotes?.length ?? 0,
            `${at}.tutorNotes`,
            issues
          );
          if (stanza.tests) {
            const ids = new Set(
              resolveTests(found.dir, block.tests)
                .map((t) => t?.id)
                .filter((id): id is string => typeof id === "string")
            );
            for (const id of Object.keys(stanza.tests)) {
              if (!ids.has(id))
                issues.push(`${at}.tests.${id}: no such test case id`);
            }
          }
        }
        if (block.type === "quiz" && stanza.questions) {
          const questionById = new Map(block.questions.map((q) => [q.id, q]));
          for (const [qid, q] of Object.entries(stanza.questions)) {
            const sourceQ = questionById.get(qid);
            if (!sourceQ) {
              issues.push(`${at}.questions.${qid}: no such question id`);
              continue;
            }
            const optionIds = new Set(sourceQ.options.map((op) => op.id));
            for (const oid of Object.keys(q.options ?? {})) {
              if (!optionIds.has(oid)) {
                issues.push(
                  `${at}.questions.${qid}.options.${oid}: no such option id`
                );
              }
            }
          }
        }
      }
    }

    // ── translated prose: must mirror a file some prose block reads ──
    for (const rest of o.prose.keys()) {
      const m = /^lessons\/([^/]+)\/(.+)$/.exec(rest);
      const found = m ? lessonBySlug.get(m[1]!) : undefined;
      const readsIt = found?.lesson.blocks.some(
        (b) => b.type === "prose" && b.src === m![2]
      );
      if (!found || !readsIt) {
        issues.push(
          `${where}/${rest}: no prose block in this course reads a file at that path — a translated .md must sit at its source's mirrored path`
        );
      }
    }

    // ── localized images: must mirror a source image, same rules as source ──
    for (const [rest, image] of o.assets) {
      const at = `${where}/${rest}`;
      const sourcePath = mirroredSourcePath(o.courseDir, rest, lessonBySlug);
      if (!sourcePath || !tree.has(sourcePath)) {
        issues.push(
          `${at}: does not mirror a source image (expected ${sourcePath ?? "assets/<file> or lessons/<slug>/assets/<file>"}) — a localized image keeps the source filename, extension included`
        );
      }
      const ext = rest.slice(rest.lastIndexOf(".") + 1).toLowerCase();
      if (!ASSET_EXT_ALLOWLIST.has(ext)) {
        issues.push(
          `${at}: extension "${ext}" not allowed (png, jpg, jpeg, webp, svg)`
        );
      }
      if (image.size > MAX_ASSET_BYTES) {
        issues.push(
          `${at}: ${image.size} bytes exceeds the ${MAX_ASSET_BYTES}-byte (1 MiB) cap`
        );
      }
    }

    // ── every image a translated .md references must resolve, localized or source ──
    for (const [rest, md] of o.prose) {
      const lessonRest = rest.slice(0, rest.lastIndexOf("/"));
      const m = /^lessons\/([^/]+)$/.exec(lessonRest);
      const found = m ? lessonBySlug.get(m[1]!) : undefined;
      if (!found) continue; // reported above
      for (const rel of markdownImageRefs(md)) {
        const localized = o.assets.has(`${lessonRest}/${rel}`);
        const inSource = tree.has(`${found.dir}/${rel}`);
        if (!localized && !inSource) {
          issues.push(
            `${where}/${rest}: markdown image "${rel}" exists neither in this overlay nor in the source lesson`
          );
        }
      }
    }
  }
  return issues;
}

function checkIndexed(
  list: Record<string, string> | undefined,
  sourceLength: number,
  at: string,
  issues: string[]
): void {
  if (!list) return;
  for (const idx of Object.keys(list)) {
    if (Number(idx) >= sourceLength) {
      issues.push(
        `${at}.${idx}: the source has ${sourceLength} item(s); indices run 0..${sourceLength - 1}`
      );
    }
  }
}

/** The source-tree path an overlay-relative image path mirrors, or null when the shape is wrong. */
function mirroredSourcePath(
  courseDir: string,
  rest: string,
  lessonBySlug: ReadonlyMap<string, { dir: string }>
): string | null {
  const courseLevel = /^assets\/[^/]+$/.test(rest);
  if (courseLevel) return `${courseDir}/${rest}`;
  const m = /^lessons\/([^/]+)\/(assets\/[^/]+)$/.exec(rest);
  if (!m) return null;
  const lesson = lessonBySlug.get(m[1]!);
  return lesson ? `${lesson.dir}/${m[2]}` : null;
}

/** Relative markdown image targets, in document order — the projector's regex. */
function markdownImageRefs(markdown: string): string[] {
  const re = /!\[[^\]]*\]\(([^)]+)\)/g;
  const out: string[] = [];
  for (let m = re.exec(markdown); m; m = re.exec(markdown)) {
    const url = m[1]!;
    if (/^(https?:)?\/\//.test(url) || url.startsWith("/")) continue;
    out.push(url);
  }
  return out;
}

// ── emit ────────────────────────────────────────────────────────────────────

/** A lesson's overlay as emitted: the strings stanza plus rewritten prose per block key. */
export interface L10nLessonBundle {
  title?: string;
  blocks?: Record<string, L10nBlockT & { src?: string }>;
}

export interface L10nCourseBundle {
  course?: {
    title?: string;
    description?: string;
    /** Url of a localized thumbnail, when the overlay re-rendered it. */
    thumbnail?: string;
    modules?: Record<string, { title?: string; description?: string }>;
  };
  /** Keyed by lesson ID (not slug) so the runtime merge is an id lookup. */
  lessons?: Record<string, L10nLessonBundle>;
}

/** `l10n.json`: course id → locale → overlay. Sparse — untranslated leaves are absent. */
export type L10nBundle = Record<string, Record<string, L10nCourseBundle>>;

/**
 * Build the emitted overlay. Pure: same tree → same bytes. Translated prose is
 * rewritten exactly like source prose (`rewriteMarkdownAssetPaths`), except
 * it prefers a localized image at the mirrored path and falls back to the
 * source image — per file, so a lesson with three of ten images re-rendered
 * ships three localized and seven source. `resolveImage` maps a repo path
 * (source or overlay) to its url.
 */
export function planL10n(
  overlays: L10nOverlays,
  source: L10nSourceView,
  resolveImage: (repoPath: string) => string | null
): L10nBundle {
  const bundle: L10nBundle = {};

  const courseByDir = new Map<string, CourseT>();
  for (const c of source.courses) {
    const dir = source.courseDirById.get(c.id);
    if (dir) courseByDir.set(dir, c);
  }

  for (const o of overlays.values()) {
    const course = courseByDir.get(o.courseDir);
    if (!course) continue; // validateL10n already failed the compile
    const lessonBySlug = new Map(
      source.lessons
        .filter(({ dir }) => dir.startsWith(`${o.courseDir}/`))
        .map((l) => [l.lesson.slug, l] as const)
    );

    const localizedUrl = (rest: string): string | null => {
      const image = o.assets.get(rest);
      return image ? resolveImage(image.path) : null;
    };

    const out: L10nCourseBundle = {};
    const s = o.strings;
    const courseStrings: NonNullable<L10nCourseBundle["course"]> = {};
    if (s?.course?.title) courseStrings.title = s.course.title;
    if (s?.course?.description)
      courseStrings.description = s.course.description;
    if (s?.course?.modules && Object.keys(s.course.modules).length > 0) {
      courseStrings.modules = s.course.modules;
    }
    if (course.thumbnail) {
      const localized = localizedUrl(course.thumbnail);
      if (localized) courseStrings.thumbnail = localized;
    }
    if (Object.keys(courseStrings).length > 0) out.course = courseStrings;

    const lessons: Record<string, L10nLessonBundle> = {};
    const lessonOut = (id: string): L10nLessonBundle => (lessons[id] ??= {});

    for (const [slug, entry] of Object.entries(s?.lessons ?? {})) {
      const found = lessonBySlug.get(slug);
      if (!found) continue;
      const target = lessonOut(found.lesson.id);
      if (entry.title) target.title = entry.title;
      if (entry.blocks && Object.keys(entry.blocks).length > 0) {
        target.blocks = { ...(target.blocks ?? {}), ...entry.blocks };
      }
    }

    for (const [rest, md] of o.prose) {
      const m = /^lessons\/([^/]+)\/(.+)$/.exec(rest);
      const found = m ? lessonBySlug.get(m[1]!) : undefined;
      if (!found) continue;
      const lessonRest = `lessons/${m![1]}`;
      const rewritten = rewriteMarkdownAssetPaths(
        md,
        (rel) =>
          localizedUrl(`${lessonRest}/${rel}`) ??
          resolveImage(`${found.dir}/${rel}`)
      );
      for (const b of found.lesson.blocks) {
        if (b.type !== "prose" || b.src !== m![2]) continue;
        const target = lessonOut(found.lesson.id);
        target.blocks ??= {};
        target.blocks[b.key] = {
          ...(target.blocks[b.key] ?? {}),
          src: rewritten,
        };
      }
    }

    if (Object.keys(lessons).length > 0) out.lessons = lessons;
    if (Object.keys(out).length === 0) continue; // an empty overlay folder emits nothing
    (bundle[course.id] ??= {})[o.locale] = out;
  }

  return bundle;
}
