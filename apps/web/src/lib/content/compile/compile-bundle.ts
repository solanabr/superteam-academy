/**
 * compileBundle(tree, opts) — pure, in-memory compile of a courses-academy
 * repo tree into a committed, typed JSON bundle (+ asset binaries).
 *
 * Pipeline: Zod-validate every doc (fail-closed) → project into Sanity-shaped
 * docs via the SAME projector the content sync uses → emit deterministic
 * JSON. CI recompiles and `git diff --exit-code`s the result, so output MUST
 * be a pure function of the input: stable key order, no wall-clock
 * timestamps (meta.compiledAt is the locked commit's own date), assets left
 * as repo-relative paths.
 *
 * The executor gate (§6.2a: solution passes / starter fails) is NOT re-run
 * here. It requires the live QuickJS/rust/build runners, was already
 * enforced by the courses-academy CI gate that made this SHA mergeable, and
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
  type SlotsLockT,
} from "@superteam-lms/content-schema";
import { projectContent } from "./projector";
import { ContentValidationError } from "./types";
import type { ValidatedContent } from "./validate";
import type { RepoTree } from "@/lib/github/types";

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
function validateTree(tree: RepoTree): CompileInput {
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

  for (const [p, bytes] of tree) {
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
    } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(p)) {
      content.assets.set(p, bytes);
    }
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
      if (!tree.has(`${dir}/${block.tests}`))
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

// ── asset pipeline (SP2 Task 2) ──────────────────────────────────────────────

/** Only these image formats may enter the app repo (fail-closed on anything else). */
const ASSET_EXT_ALLOWLIST = new Set(["png", "jpg", "jpeg", "webp", "svg"]);
/** Per-file cap so a content PR can't bloat the app repo. 1 MiB. */
const MAX_ASSET_BYTES = 1024 * 1024;
/** Copied under public/<PREFIX>; the rewritten url is `/<PREFIX>/...`. */
export const ASSET_PUBLIC_PREFIX = "content-assets";

const baseName = (p: string): string => p.slice(p.lastIndexOf("/") + 1);
const extOf = (p: string): string => {
  const dot = p.lastIndexOf(".");
  return dot < 0 ? "" : p.slice(dot + 1).toLowerCase();
};

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

interface AssetPlan {
  /** repo path → public url (`/content-assets/...`), for reference rewriting. */
  urlByRepoPath: Map<string, string>;
  /** public rel path (`intro/hello/x.png`) → bytes, for writing under public/. */
  bytesByPublicPath: Map<string, Uint8Array>;
}

/**
 * Copy every file under a recognized `assets/` dir (course-level or lesson-level)
 * to a slug-mirrored public path, enforcing the extension allowlist and size cap.
 * Deterministic: the public path is `<courseSlug>[/<lessonSlug>]/<file>` — no hash,
 * the bundle is pinned per content SHA. Accumulates issues; the caller throws.
 */
function planAssets(
  tree: RepoTree,
  content: ValidatedContent,
  courseDirById: Map<string, string>
): { plan: AssetPlan; issues: string[] } {
  const issues: string[] = [];
  const urlByRepoPath = new Map<string, string>();
  const bytesByPublicPath = new Map<string, Uint8Array>();

  // sourceAssetsDir → public dest dir (slug-based), course-level and lesson-level.
  const destByAssetsDir = new Map<string, string>();
  const courseSlugByDir = new Map<string, string>();
  for (const c of content.courses) {
    const dir = courseDirById.get(c.id);
    if (!dir) continue;
    courseSlugByDir.set(dir, c.slug);
    destByAssetsDir.set(`${dir}/assets`, c.slug);
  }
  for (const { dir, lesson } of content.lessons) {
    let courseSlug: string | undefined;
    for (const [cd, slug] of courseSlugByDir) {
      if (dir === cd || dir.startsWith(`${cd}/`)) {
        courseSlug = slug;
        break;
      }
    }
    if (courseSlug === undefined) continue; // orphan lesson — module validation owns this
    destByAssetsDir.set(`${dir}/assets`, `${courseSlug}/${lesson.slug}`);
  }

  for (const [p, bytes] of tree) {
    const dest = destByAssetsDir.get(dirOf(p));
    if (dest === undefined) continue;
    const base = baseName(p);
    const ext = extOf(base);
    if (!ASSET_EXT_ALLOWLIST.has(ext)) {
      issues.push(
        `asset ${p}: extension "${ext || "(none)"}" not allowed (png, jpg, jpeg, webp, svg)`
      );
    }
    if (bytes.byteLength > MAX_ASSET_BYTES) {
      issues.push(
        `asset ${p}: ${bytes.byteLength} bytes exceeds the ${MAX_ASSET_BYTES}-byte (1 MiB) cap`
      );
    }
    const publicPath = `${dest}/${base}`;
    bytesByPublicPath.set(publicPath, bytes);
    urlByRepoPath.set(p, `/${ASSET_PUBLIC_PREFIX}/${publicPath}`);
  }

  return { plan: { urlByRepoPath, bytesByPublicPath }, issues };
}

/**
 * Every referenced image must resolve to a copied asset: a course `thumbnail:`
 * (course-folder-relative) and each relative markdown image in a prose block
 * (lesson-dir-relative). Fail-closed naming the course/lesson and the path.
 */
function validateAssetReferences(
  content: ValidatedContent,
  courseDirById: Map<string, string>,
  plan: AssetPlan
): string[] {
  const issues: string[] = [];
  for (const c of content.courses) {
    if (!c.thumbnail) continue;
    const dir = courseDirById.get(c.id);
    if (!dir) continue;
    if (!plan.urlByRepoPath.has(`${dir}/${c.thumbnail}`)) {
      issues.push(
        `course ${c.id}: thumbnail "${c.thumbnail}" is not a copied asset (missing ${dir}/${c.thumbnail})`
      );
    }
  }
  for (const { dir, lesson } of content.lessons) {
    for (const block of lesson.blocks) {
      if (block.type !== "prose") continue;
      const md = content.prose.get(`${dir}/${block.src}`) ?? "";
      for (const rel of markdownImageRefs(md)) {
        if (!plan.urlByRepoPath.has(`${dir}/${rel}`)) {
          issues.push(
            `lesson ${lesson.id} block ${block.key}: markdown image "${rel}" is not a copied asset (missing ${dir}/${rel})`
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
}

/** A compiled bundle: JSON modules (filename → contents) plus asset binaries
 *  (public rel path → bytes) to copy under `public/content-assets`. */
export interface CompiledBundle {
  files: Map<string, string>;
  assets: Map<string, Uint8Array>;
}

/**
 * Pure compile: tree → { files, assets }. Throws `ContentValidationError` before
 * emitting anything, so a failed compile never writes a partial bundle. Assets under
 * recognized `assets/` dirs are copied to slug-mirrored public paths and their
 * references (course thumbnails, markdown images) are rewritten to `/content-assets/...`.
 */
export function compileBundle(
  tree: RepoTree,
  opts: CompileOptions
): CompiledBundle {
  const { content, courseDirById } = validateTree(tree);

  // Asset pipeline first: copy-and-validate assets, then verify every reference
  // resolves. Both accumulate into one fail-closed throw before any emit.
  const { plan, issues: assetIssues } = planAssets(
    tree,
    content,
    courseDirById
  );
  const refIssues = validateAssetReferences(content, courseDirById, plan);
  const issues = [...assetIssues, ...refIssues];
  if (issues.length > 0) throw new ContentValidationError(issues);

  // Reuse the sync's projector so emitted docs match Sanity's shape exactly.
  // The resolver maps repo-relative markdown image paths → their public url;
  // unreferenced paths return null (rewriteMarkdownAssetPaths leaves them as-is,
  // but validateAssetReferences already proved every reference resolves).
  const resolveAsset = (p: string): string | null =>
    plan.urlByRepoPath.get(p) ?? null;
  const resolveTests = (dir: string, rel: string): unknown[] => {
    const raw = tree.get(`${dir}/${rel}`);
    return raw ? (JSON.parse(text(raw)) as unknown[]) : [];
  };
  const { docs } = projectContent(
    content,
    opts.sha,
    resolveAsset,
    resolveTests
  );

  // Course thumbnails are not projected (repo-relative in the schema); inject the
  // rewritten public url here, keyed by course id.
  const thumbUrlByCourseId = new Map<string, string>();
  for (const c of content.courses) {
    if (!c.thumbnail) continue;
    const dir = courseDirById.get(c.id);
    const url = dir && plan.urlByRepoPath.get(`${dir}/${c.thumbnail}`);
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

  const meta: Record<string, unknown> = { sha: opts.sha, counts };
  if (opts.compiledAt !== null) meta.compiledAt = opts.compiledAt;
  files.set("meta.json", stableJson(meta));

  return { files, assets: plan.bytesByPublicPath };
}

/** JSON-modules-only view of {@link compileBundle} (assets written separately). */
export function compileContent(
  tree: RepoTree,
  opts: CompileOptions
): Map<string, string> {
  return compileBundle(tree, opts).files;
}
