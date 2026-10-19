/**
 * compileBundle(tree, opts) — pure, in-memory compile of an academy-courses
 * repo tree into a committed, typed JSON bundle.
 *
 * Pipeline: Zod-validate every doc (fail-closed) → project into Sanity-shaped
 * docs via the SAME projector the content sync uses → emit deterministic
 * JSON. CI recompiles and `git diff --exit-code`s the result, so output MUST
 * be a pure function of the input: stable key order, no wall-clock
 * timestamps (meta.compiledAt is the locked commit's own date), image refs
 * rewritten to content-addressed blob urls derived from the bytes alone.
 *
 * The executor gate (§6.2a: solution passes / starter fails) is NOT re-run
 * here. It requires the live QuickJS/rust/build runners, was already
 * enforced by the academy-courses CI gate that made this SHA mergeable, and
 * the sync itself defers rust/buildable. Compile is a projection step, not a
 * re-certification.
 *
 * Shared by `scripts/compile-content.ts` (fetches the tarball, calls this,
 * writes the result to disk) and any future in-app publish route — both need
 * byte-identical output from the same input tree.
 */
import { parse as parseYaml } from "yaml";
import {
  Course,
  Lesson,
  SlotsLock,
  Achievement,
  Quest,
  LearningPath,
  SkillsTaxonomy,
  checkSkillVocabulary,
  isExcludedContentPath,
  type SlotsLockT,
} from "@superteam-lms/content-schema";
import type { RepoTree } from "@/lib/github/types";
import { projectContent } from "./projector";
import {
  collectL10nFile,
  collectL10nImage,
  planL10n,
  validateL10n,
} from "./l10n";
import {
  ASSET_EXT_ALLOWLIST,
  IMAGE_CONTENT_TYPES,
  MAX_ASSET_BYTES,
  contentImagePathname,
  contentImageUrl,
  imageExt,
  type AssetManifestEntry,
} from "./assets";
import { splitRepoTree, type ContentTree } from "./tarball";
import { ContentValidationError } from "./types";
import type { ValidatedContent } from "./validate";

// ── deterministic serialization ────────────────────────────────────────────

/** Recursively order object keys; arrays keep their (pre-sorted) order. */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      const v = (value as Record<string, unknown>)[k];
      if (v !== undefined) out[k] = sortKeysDeep(v);
    }
    return out;
  }
  return value;
}

/** Prettier-stable JSON: 2-space indent, sorted keys, trailing newline. */
function stableJson(value: unknown): string {
  return `${JSON.stringify(sortKeysDeep(value), null, 2)}\n`;
}

// ── Zod-only validation → ValidatedContent (the projector's input) ───────────

const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);
const dirOf = (p: string): string => p.slice(0, p.lastIndexOf("/"));

function formatZodError(where: string, e: unknown): string {
  if (e && typeof e === "object" && "issues" in e) {
    const issues = (
      e as { issues: { path: (string | number)[]; message: string }[] }
    ).issues;
    const lines = issues.map(
      (i) => `    - ${i.path.join(".") || "<root>"}: ${i.message}`
    );
    return `${where}:\n${lines.join("\n")}`;
  }
  return `${where}: ${e instanceof Error ? e.message : String(e)}`;
}

interface CompileInput {
  content: ValidatedContent;
  /** course id → repo dir, so each course's slots.lock.json can be keyed by id. */
  courseDirById: Map<string, string>;
}

/**
 * Re-parse and Zod-validate every YAML/JSON in the tree into the projector's
 * `ValidatedContent`. Mirrors content/compile/validate.ts's classification but is
 * Zod-only (no executor gate). Accumulates all issues, then throws once.
 */
function validateTree({ files, images }: ContentTree): CompileInput {
  const issues: string[] = [];
  const content: ValidatedContent = {
    courses: [],
    lessons: [],
    achievements: [],
    quests: [],
    paths: [],
    slots: new Map(),
    skills: [],
    prose: new Map(),
    code: new Map(),
    idl: new Map(),
    assets: new Map(),
    l10n: new Map(),
  };
  const courseDirById = new Map<string, string>();

  const zod = <T>(
    schema: { parse: (x: unknown) => T },
    raw: unknown,
    where: string
  ): T | null => {
    try {
      return schema.parse(raw);
    } catch (e) {
      issues.push(formatZodError(where, e));
      return null;
    }
  };

  for (const [p, bytes] of files) {
    // #973: the tree normally arrives pre-filtered from `extractTarball`, but
    // classification below is unanchored (`endsWith("/course.yaml")`), so a tree
    // built anywhere else would compile parked docs into the shipped bundle.
    if (isExcludedContentPath(p)) continue;
    // Translation overlays first (academy-courses PR #51): a file under
    // `l10n/` is fully owned by that branch, whatever its name, so the
    // unanchored suffix checks below can never mistake an overlay for a
    // course, a lesson, source prose or a source asset — the exact duplicate-
    // document hazard the content repo's README warns about.
    if (collectL10nFile(p, bytes, content.l10n, issues)) continue;
    if (p === "skills.yaml") {
      // The only content type at the repo root, not nested under a course/
      // collection dir — a single canonical skill vocabulary, not one doc per
      // file. The compiler tolerates its absence (`content.skills` stays `[]`),
      // but every lesson `skills` slug is checked against it below (#466 C3).
      const s = zod(SkillsTaxonomy, parseYaml(text(bytes)), p);
      if (s) content.skills = s;
    } else if (p.endsWith("/course.yaml")) {
      const c = zod(Course, parseYaml(text(bytes)), p);
      if (c) {
        content.courses.push(c);
        courseDirById.set(c.id, dirOf(p));
      }
    } else if (p.endsWith("/slots.lock.json")) {
      const s = zod(SlotsLock, JSON.parse(text(bytes)), p);
      if (s) content.slots.set(dirOf(p), s);
    } else if (p.endsWith("/lesson.yaml")) {
      const l = zod(Lesson, parseYaml(text(bytes)), p);
      if (l) content.lessons.push({ dir: dirOf(p), lesson: l });
    } else if (p.startsWith("achievements/") && p.endsWith(".yaml")) {
      const a = zod(Achievement, parseYaml(text(bytes)), p);
      if (a) content.achievements.push(a);
    } else if (p.startsWith("quests/") && p.endsWith(".yaml")) {
      const q = zod(Quest, parseYaml(text(bytes)), p);
      if (q) content.quests.push(q);
    } else if (p.startsWith("paths/") && p.endsWith(".yaml")) {
      const lp = zod(LearningPath, parseYaml(text(bytes)), p);
      if (lp) content.paths.push(lp);
    } else if (p.endsWith(".md")) {
      content.prose.set(p, text(bytes));
    } else if (p.endsWith(".ts") || p.endsWith(".rs")) {
      content.code.set(p, text(bytes));
    } else if (p.endsWith(".idl.json")) {
      content.idl.set(p, text(bytes));
    }
  }
  // Images arrive by reference (size + hash); the same l10n-first rule holds.
  for (const [p, image] of images) {
    if (isExcludedContentPath(p)) continue;
    if (collectL10nImage(p, image.size, content.l10n, issues)) continue;
    content.assets.set(p, image);
  }

  // #466 C3: every lesson `skills` slug must be a member of the canonical
  // vocabulary — the allowlist guarantee, kept in sync with the admin-sync
  // validator's `parseAndValidateTree` (src/lib/content/compile/validate.ts).
  issues.push(
    ...checkSkillVocabulary(
      content.lessons.map(({ lesson }) => ({
        id: lesson.id,
        skills: lesson.skills,
      })),
      content.skills
    )
  );

  // Every course needs its slots lockfile — it is emitted verbatim (keyed by id).
  for (const c of content.courses) {
    const dir = courseDirById.get(c.id);
    if (!dir || !content.slots.has(dir)) {
      issues.push(`course ${c.id}: missing slots.lock.json`);
    }
  }

  // Every code block's referenced files must be present. The projector falls
  // back to "" for a missing starter/solution (projector.ts) and [] for missing
  // tests, which would bundle a broken challenge instead of failing closed.
  // Mirrors content/compile/validate.ts's presence check, minus the executor gate.
  for (const { dir, lesson } of content.lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "code") continue;
      const missing: string[] = [];
      if (!content.code.has(`${dir}/${block.starter}`))
        missing.push(`${dir}/${block.starter}`);
      if (!content.code.has(`${dir}/${block.solution}`))
        missing.push(`${dir}/${block.solution}`);
      if (!files.has(`${dir}/${block.tests}`))
        missing.push(`${dir}/${block.tests}`);
      if (missing.length > 0) {
        issues.push(
          `lesson ${lesson.id} block ${block.key}: missing file(s): ${missing.join(", ")}`
        );
      }
    }
  }

  if (issues.length > 0) throw new ContentValidationError(issues);
  return { content, courseDirById };
}

// ── compile: validate → project → serialize ──────────────────────────────────

/** _type → emitted filename. Every type is always emitted (empty array if none). */
const FILE_BY_TYPE: Record<string, string> = {
  course: "courses.json",
  lesson: "lessons.json",
  learningPath: "paths.json",
  achievement: "achievements.json",
  quest: "quests.json",
};

/** Sync-added overlay/preserve fields — never part of the committed bundle. */
const OVERLAY_MARKERS = new Set(["sync", "onChainStatus", "authoringStatus"]);

const COUNT_KEY: Record<string, string> = {
  course: "courses",
  lesson: "lessons",
  learningPath: "learningPaths",
  achievement: "achievements",
  quest: "quests",
};

// ── asset pipeline ───────────────────────────────────────────────────────────

/**
 * The README written verbatim into the generated dir. Lives here (not in
 * `scripts/compile-content.ts`) so BOTH the disk writer (`writeBundle`) and the
 * in-route publish tree builder emit byte-identical content — a divergent copy
 * would drift from what CI recompiles and turn the freshness check red.
 */
export const GENERATED_README = `# Generated content bundle

Generated by \`scripts/compile-content.ts\` (\`pnpm compile-content\`) from the
academy-courses repo pinned in \`apps/web/content.lock\`. **Do not hand-edit** —
CI recompiles and \`git diff --exit-code\`s this directory to enforce freshness.
`;

/** Relative (non-remote, non-absolute) markdown image targets, in document order.
 *  Mirrors the projector's rewrite regex so validation and rewrite agree. */
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

/**
 * Every file under a recognized `assets/` dir (course-level or lesson-level) is
 * shippable, provided it passes the extension allowlist and size cap. Returns
 * the shippable repo paths; accumulates issues, the caller throws.
 */
function planAssets(
  { files, images }: ContentTree,
  content: ValidatedContent,
  courseDirById: Map<string, string>
): { shippable: Set<string>; issues: string[] } {
  const issues: string[] = [];
  const shippable = new Set<string>();

  const courseDirs = [...courseDirById.values()];
  const assetDirs = new Set(courseDirs.map((dir) => `${dir}/assets`));
  for (const { dir } of content.lessons) {
    // An orphan lesson (outside every course dir) is module validation's problem.
    if (courseDirs.some((cd) => dir === cd || dir.startsWith(`${cd}/`))) {
      assetDirs.add(`${dir}/assets`);
    }
  }

  const consider = (p: string, size: number): void => {
    if (!assetDirs.has(dirOf(p))) return;
    const ext = imageExt(p);
    if (!ASSET_EXT_ALLOWLIST.has(ext)) {
      issues.push(
        `asset ${p}: extension "${ext || "(none)"}" not allowed (png, jpg, jpeg, webp, svg)`
      );
    }
    if (size > MAX_ASSET_BYTES) {
      issues.push(
        `asset ${p}: ${size} bytes exceeds the ${MAX_ASSET_BYTES}-byte (1 MiB) cap`
      );
    }
    shippable.add(p);
  };
  for (const [p, bytes] of files) consider(p, bytes.byteLength);
  for (const [p, image] of images) consider(p, image.size);

  return { shippable, issues };
}

/**
 * Every referenced image must be shippable: a course `thumbnail:`
 * (course-folder-relative) and each relative markdown image in a prose block
 * (lesson-dir-relative). Fail-closed naming the course/lesson and the path.
 */
function validateAssetReferences(
  content: ValidatedContent,
  courseDirById: Map<string, string>,
  shippable: Set<string>
): string[] {
  const issues: string[] = [];
  for (const c of content.courses) {
    if (!c.thumbnail) continue;
    const dir = courseDirById.get(c.id);
    if (!dir) continue;
    if (!shippable.has(`${dir}/${c.thumbnail}`)) {
      issues.push(
        `course ${c.id}: thumbnail "${c.thumbnail}" is not a shippable asset (missing ${dir}/${c.thumbnail})`
      );
    }
  }
  for (const { dir, lesson } of content.lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "prose") continue;
      const md = content.prose.get(`${dir}/${block.src}`) ?? "";
      for (const rel of markdownImageRefs(md)) {
        if (!shippable.has(`${dir}/${rel}`)) {
          issues.push(
            `lesson ${lesson.id} block ${block.key}: markdown image "${rel}" is not a shippable asset (missing ${dir}/${rel})`
          );
        }
      }
    }
  }
  return issues;
}

export interface CompileOptions {
  sha: string;
  /** The locked commit's own date (ISO), or null to omit compiledAt. Never wall-clock. */
  compiledAt: string | null;
  /**
   * Where an image reference points, by repo path. Default: its
   * content-addressed blob url, which needs a hashed tree and also emits the
   * `assets.json` manifest. The teacher preview passes its own route instead.
   */
  imageUrl?: (repoPath: string) => string;
}

/** A compiled bundle: JSON modules (filename → contents) and the images they reference. */
export interface CompiledBundle {
  files: Map<string, string>;
  /** Repo paths of every image the bundle references, sorted. */
  imagePaths: string[];
}

/**
 * Pure compile: tree → bundle. Throws `ContentValidationError` before emitting
 * anything, so a failed compile never writes a partial bundle. Every image
 * reference (course thumbnails, markdown images, localized images) is
 * rewritten through `opts.imageUrl`. An in-memory `RepoTree` is accepted for
 * callers that already hold the bytes; it is split and hashed first.
 */
export function compileBundle(
  input: RepoTree | ContentTree,
  opts: CompileOptions
): CompiledBundle {
  const tree = input instanceof Map ? splitRepoTree(input) : input;
  const { content, courseDirById } = validateTree(tree);

  // Asset pipeline first: validate what may ship, then verify every reference
  // resolves. Both accumulate into one fail-closed throw before any emit.
  const { shippable, issues: assetIssues } = planAssets(
    tree,
    content,
    courseDirById
  );
  const refIssues = validateAssetReferences(content, courseDirById, shippable);
  const resolveTests = (dir: string, rel: string): unknown[] => {
    const raw = tree.files.get(`${dir}/${rel}`);
    return raw ? (JSON.parse(text(raw)) as unknown[]) : [];
  };
  const l10nSource = {
    courses: content.courses,
    lessons: content.lessons,
    courseDirById,
  };
  const l10nIssues = validateL10n(
    content.l10n,
    l10nSource,
    { has: (p) => tree.files.has(p) || tree.images.has(p) },
    resolveTests as (dir: string, rel: string) => { id?: unknown }[]
  );
  const issues = [...assetIssues, ...refIssues, ...l10nIssues];
  if (issues.length > 0) throw new ContentValidationError(issues);

  // Localized images passed validateL10n, so they ship alongside the source's.
  for (const o of content.l10n.values()) {
    for (const { path } of o.assets.values()) shippable.add(path);
  }

  const imageUrl =
    opts.imageUrl ??
    ((repoPath: string): string => {
      const sha256 = tree.images.get(repoPath)?.sha256;
      if (!sha256) throw new Error(`image ${repoPath} was not hashed`);
      return contentImageUrl(sha256, imageExt(repoPath));
    });
  // Unshippable paths return null (rewriteMarkdownAssetPaths leaves them as-is,
  // but validateAssetReferences already proved every reference resolves).
  const referenced = new Set<string>();
  const resolveAsset = (p: string): string | null => {
    if (!shippable.has(p)) return null;
    referenced.add(p);
    return imageUrl(p);
  };

  // Reuse the sync's projector so emitted docs match Sanity's shape exactly.
  const { docs } = projectContent(
    content,
    opts.sha,
    resolveAsset,
    resolveTests
  );

  // Course thumbnails are not projected (repo-relative in the schema); inject the
  // rewritten url here, keyed by course id.
  const thumbUrlByCourseId = new Map<string, string>();
  for (const c of content.courses) {
    if (!c.thumbnail) continue;
    const dir = courseDirById.get(c.id);
    const url = dir && resolveAsset(`${dir}/${c.thumbnail}`);
    if (url) thumbUrlByCourseId.set(c.id, url);
  }

  // Bucket by type, dropping the preserve/overlay markers the sync adds (they are
  // not part of the bundle), and sort each array by _id for a stable, tree-order-
  // independent emit. Code-unit order (not localeCompare) so it is identical on
  // every runner — CI recompiles and `git diff --exit-code`s the result.
  const byType = new Map<string, Record<string, unknown>[]>(
    Object.keys(FILE_BY_TYPE).map((t) => [t, []])
  );
  for (const doc of docs) {
    const bucket = byType.get(doc._type);
    if (!bucket) continue;
    const kept: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(doc)) {
      if (!OVERLAY_MARKERS.has(k)) kept[k] = val;
    }
    if (doc._type === "course") {
      const thumb = thumbUrlByCourseId.get(String(doc._id));
      if (thumb !== undefined) kept.thumbnail = thumb;
    }
    bucket.push(kept);
  }

  const byId = (
    a: Record<string, unknown>,
    b: Record<string, unknown>
  ): number => {
    const x = String(a._id);
    const y = String(b._id);
    return x < y ? -1 : x > y ? 1 : 0;
  };
  const files = new Map<string, string>();
  const counts: Record<string, number> = {};
  for (const [type, filename] of Object.entries(FILE_BY_TYPE)) {
    const arr = byType.get(type)!;
    arr.sort(byId);
    files.set(filename, stableJson(arr));
    counts[COUNT_KEY[type]!] = arr.length;
  }

  // slots.json: each course's lockfile, keyed by course id.
  const slotsById: Record<string, SlotsLockT> = {};
  for (const c of content.courses) {
    const dir = courseDirById.get(c.id)!;
    slotsById[c.id] = content.slots.get(dir)!;
  }
  files.set("slots.json", stableJson(slotsById));

  // skills.json: the canonical skill vocabulary from a repo-root skills.yaml,
  // or [] when the file is absent. Every lesson `skills` slug is checked
  // against this vocabulary in `validateTree` above (#466 C3) — an unknown
  // slug fails the compile, naming the lesson and the bad slug.
  files.set("skills.json", stableJson(content.skills));

  // l10n.json: course id → locale → translated leaves (sparse), images
  // resolved like the source's. Always emitted — `{}` when no course has an
  // overlay — so the store's import never has to guess.
  const l10n = planL10n(content.l10n, l10nSource, resolveAsset);
  files.set("l10n.json", stableJson(l10n));
  counts.l10nCourses = Object.keys(l10n).length;

  const meta: Record<string, unknown> = { sha: opts.sha, counts };
  if (opts.compiledAt !== null) meta.compiledAt = opts.compiledAt;
  files.set("meta.json", stableJson(meta));

  const imagePaths = [...referenced].sort();
  if (!opts.imageUrl) {
    files.set("assets.json", stableJson(assetManifest(tree, imagePaths)));
  }
  return { files, imagePaths };
}

/**
 * `assets.json`: one entry per blob key the bundle references, sorted by key.
 * Identical bytes under several paths collapse to one entry naming the
 * smallest path, so the manifest depends on the bytes alone, not walk order.
 */
function assetManifest(
  tree: ContentTree,
  sortedPaths: string[]
): AssetManifestEntry[] {
  const byKey = new Map<string, AssetManifestEntry>();
  for (const path of sortedPaths) {
    const image = tree.images.get(path)!;
    const ext = imageExt(path);
    const key = contentImagePathname(image.sha256!, ext);
    if (byKey.has(key)) continue;
    byKey.set(key, {
      sha256: image.sha256!,
      ext,
      size: image.size,
      contentType: IMAGE_CONTENT_TYPES.get(ext)!,
      path,
    });
  }
  return [...byKey.keys()].sort().map((key) => byKey.get(key)!);
}

/** JSON-modules-only view of {@link compileBundle}. */
export function compileContent(
  tree: RepoTree | ContentTree,
  opts: CompileOptions
): Map<string, string> {
  return compileBundle(tree, opts).files;
}
