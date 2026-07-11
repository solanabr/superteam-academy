#!/usr/bin/env tsx
/**
 * compile-content.ts — compile the courses-academy content repo (pinned in
 * content.lock) into a committed, typed JSON bundle under src/content/generated.
 *
 * Pipeline: fetch tarball at the locked SHA → extract → Zod-validate every doc
 * (fail-closed) → project into Sanity-shaped docs via the SAME projector the
 * content sync uses → emit deterministic JSON. CI recompiles and `git diff
 * --exit-code`s the result, so output MUST be a pure function of the input:
 * stable key order, no wall-clock timestamps (meta.compiledAt is the locked
 * commit's own date), assets left as repo-relative paths.
 *
 * The executor gate (§6.2a: solution passes / starter fails) is NOT re-run here.
 * It requires the live QuickJS/rust/build runners, was already enforced by the
 * courses-academy CI gate that made this SHA mergeable, and the sync itself
 * defers rust/buildable. Compile is a projection step, not a re-certification.
 *
 *   Run from apps/web:  pnpm compile-content   (or: pnpm tsx scripts/compile-content.ts)
 *   Optional GITHUB_TOKEN raises the GitHub rate limit.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import {
  Course,
  Lesson,
  SlotsLock,
  Achievement,
  Quest,
  LearningPath,
  Instructor,
  type CourseT,
  type SlotsLockT,
} from "@superteam-lms/content-schema";
import { extractTarball } from "../src/lib/content-sync/tarball";
import { projectContent } from "../src/lib/content-sync/projector";
import { ContentValidationError } from "../src/lib/content-sync/types";
import type { RepoTree } from "../src/lib/content-sync/types";
import type { ValidatedContent } from "../src/lib/content-sync/validate";

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
 * `ValidatedContent`. Mirrors content-sync/validate.ts's classification but is
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
    instructors: [],
    slots: new Map(),
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
    if (p.endsWith("/course.yaml")) {
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
    } else if (p.startsWith("instructors/") && p.endsWith(".yaml")) {
      const i = zod(Instructor, parseYaml(text(bytes)), p);
      if (i) content.instructors.push(i);
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

  // Every course needs its slots lockfile — it is emitted verbatim (keyed by id).
  for (const c of content.courses as CourseT[]) {
    const dir = courseDirById.get(c.id);
    if (!dir || !content.slots.has(dir)) {
      issues.push(`course ${c.id}: missing slots.lock.json`);
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
  instructor: "instructors.json",
  learningPath: "paths.json",
  achievement: "achievements.json",
  quest: "quests.json",
};

/** Sync-added overlay/preserve fields — never part of the committed bundle. */
const OVERLAY_MARKERS = new Set(["sync", "onChainStatus", "authoringStatus"]);

const COUNT_KEY: Record<string, string> = {
  course: "courses",
  lesson: "lessons",
  instructor: "instructors",
  learningPath: "learningPaths",
  achievement: "achievements",
  quest: "quests",
};

export interface CompileOptions {
  sha: string;
  /** The locked commit's own date (ISO), or null to omit compiledAt. Never wall-clock. */
  compiledAt: string | null;
}

/**
 * Pure compile: tree → { filename → file content }. Throws `ContentValidationError`
 * before emitting anything, so a failed compile never writes a partial bundle.
 */
export function compileContent(
  tree: RepoTree,
  opts: CompileOptions
): Map<string, string> {
  const { content, courseDirById } = validateTree(tree);

  // Reuse the sync's projector so emitted docs match Sanity's shape exactly.
  // No Sanity here: markdown image paths stay repo-relative (resolveAsset → null,
  // which rewriteMarkdownAssetPaths leaves untouched); tests.json is read from the tree.
  const resolveTests = (dir: string, rel: string): unknown[] => {
    const raw = tree.get(`${dir}/${rel}`);
    return raw ? (JSON.parse(text(raw)) as unknown[]) : [];
  };
  const { docs } = projectContent(content, opts.sha, () => null, resolveTests);

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
  for (const c of content.courses as CourseT[]) {
    const dir = courseDirById.get(c.id)!;
    slotsById[c.id] = content.slots.get(dir)!;
  }
  files.set("slots.json", stableJson(slotsById));

  const meta: Record<string, unknown> = { sha: opts.sha, counts };
  if (opts.compiledAt !== null) meta.compiledAt = opts.compiledAt;
  files.set("meta.json", stableJson(meta));

  return files;
}

// ── GitHub fetch (local, no server-only deps) ────────────────────────────────

interface Lock {
  repo: string;
  sha: string;
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "superteam-academy-compile-content",
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

/** Small retry — the local DNS here is flaky; a commit SHA's bytes never change. */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempts = 4
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1)
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error(
    `GitHub request failed after ${attempts} attempts (${url}): ${String(lastErr)}`
  );
}

async function fetchTarball(lock: Lock): Promise<Uint8Array> {
  const url = `https://api.github.com/repos/${lock.repo}/tarball/${lock.sha}`;
  const res = await fetchWithRetry(url, {
    headers: githubHeaders(),
    redirect: "follow",
  });
  return new Uint8Array(await res.arrayBuffer());
}

/** The locked commit's own committer date — deterministic per SHA, never wall-clock. */
async function fetchCommitDate(lock: Lock): Promise<string> {
  const url = `https://api.github.com/repos/${lock.repo}/commits/${lock.sha}`;
  const res = await fetchWithRetry(url, { headers: githubHeaders() });
  const body = (await res.json()) as {
    commit?: { committer?: { date?: string } };
  };
  const date = body.commit?.committer?.date;
  if (!date) throw new Error(`commit ${lock.sha} has no committer date`);
  return date;
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const README = `# Generated content bundle

Generated by \`scripts/compile-content.ts\` (\`pnpm compile-content\`) from the
courses-academy repo pinned in \`apps/web/content.lock\`. **Do not hand-edit** —
CI recompiles and \`git diff --exit-code\`s this directory to enforce freshness.
`;

async function main(): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const lockPath = path.resolve(here, "../content.lock");
  const outDir = path.resolve(here, "../src/content/generated");

  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as Lock;
  console.log(`Compiling ${lock.repo}@${lock.sha}`);

  const [tarball, compiledAt] = await Promise.all([
    fetchTarball(lock),
    fetchCommitDate(lock),
  ]);
  const tree = await extractTarball(tarball);
  const files = compileContent(tree, { sha: lock.sha, compiledAt });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "README.md"), README);
  for (const [name, contents] of files) {
    fs.writeFileSync(path.join(outDir, name), contents);
  }

  const counts = (
    JSON.parse(files.get("meta.json")!) as { counts: Record<string, number> }
  ).counts;
  console.log(
    `Emitted ${files.size} modules to ${path.relative(process.cwd(), outDir)}`
  );
  console.log(`Counts: ${JSON.stringify(counts)}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((err: unknown) => {
    if (err instanceof ContentValidationError) {
      console.error(
        `Content validation failed (${err.issues.length} issue(s)):`
      );
      for (const issue of err.issues) console.error(issue);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}
