import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  isDraftPath,
  isExcludedContentPath,
} from "@superteam-lms/content-schema";
import { diag, type Diagnostic } from "./diagnostics";

export type DocKind =
  | "course"
  | "lesson"
  | "quiz"
  | "achievement"
  | "quest"
  | "path"
  | "slots";

export interface RawDoc {
  /** Repo-relative POSIX-style path. */
  path: string;
  abs: string;
  kind: DocKind;
  /** Parsed YAML (1.2 core) or JSON; undefined when parseError is set. */
  data: unknown;
  parseError?: string;
}

/** Directories we never descend into. */
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".github",
  "schema",
  ".vscode",
]);

/** Every file under `root`, repo-relative, POSIX separators. */
export function walkFiles(root: string, dir = root): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    // lstat (not stat): never follow a symlink. A symlinked file or directory
    // could point outside `root` — reading through it would let content
    // outside the lesson tree get parsed and echoed into diagnostics via a
    // path that still looks repo-relative.
    const st = lstatSync(abs);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      out.push(...walkFiles(root, abs));
    } else {
      out.push(relative(root, abs).split("\\").join("/"));
    }
  }
  return out;
}

/** Path-pattern classification. Returns null for files we do not lint directly. */
function classify(path: string): DocKind | null {
  if (/^courses\/[^/]+\/course\.yaml$/.test(path)) return "course";
  if (/^courses\/[^/]+\/slots\.lock\.json$/.test(path)) return "slots";
  if (/^courses\/[^/]+\/lessons\/[^/]+\/lesson\.yaml$/.test(path)) {
    return "lesson";
  }
  if (/^courses\/[^/]+\/lessons\/[^/]+\/[^/]+\.quiz\.yaml$/.test(path)) {
    return "quiz";
  }
  if (/^achievements\/[^/]+\.yaml$/.test(path)) return "achievement";
  if (/^quests\/[^/]+\.yaml$/.test(path)) return "quest";
  if (/^paths\/[^/]+\.yaml$/.test(path)) return "path";
  return null;
}

function parseByKind(abs: string, kind: DocKind): unknown {
  const text = readFileSync(abs, "utf8");
  // slots.lock.json and *.json fixtures are JSON: exact byte semantics (spec §4.2).
  if (kind === "slots") return JSON.parse(text);
  // yaml v2 default schema for 1.2 is `core` — Norway-safe (No/Yes/off stay strings).
  return parseYaml(text, { version: "1.2" });
}

/**
 * Top-level content collections. A `.yaml` under one of these that classify()
 * does not claim is a mistake worth naming (see {@link unclassifiedContentFiles}).
 */
const COLLECTION_DIRS = ["courses/", "paths/", "achievements/", "quests/"];

/**
 * `.yaml` files inside a content collection that no classifier claims and that
 * are not parked — a typo'd parking dir (`courses/_drafts/x/course.yaml`), a
 * doc at the wrong depth, an unrecognised collection subdir. Each is content
 * the author believes is linted and is not, so it gets a warning rather than
 * `loader.ts`'s old bare `if (!kind) continue;`.
 */
export function unclassifiedContentFiles(root: string): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const path of walkFiles(root)) {
    if (!path.endsWith(".yaml")) continue;
    if (classify(path) !== null) continue;
    if (isExcludedContentPath(path)) continue;
    if (!COLLECTION_DIRS.some((d) => path.startsWith(d))) continue;
    out.push(
      diag(
        "loader",
        "warning",
        path,
        "unclassified content file — wrong depth or directory name? it is NOT linted by any gate " +
          "(park a file deliberately by moving it under a `_draft/` directory)"
      )
    );
  }
  return out;
}

/** Discover + parse every lintable file. Parse failures become `parseError`, never throws. */
export function discover(root: string): RawDoc[] {
  const docs: RawDoc[] = [];
  for (const path of walkFiles(root)) {
    // Parked content (`_draft/`) is out of the catalog and out of the bundle, so
    // it is not linted either. #973: this skip used to be an EMERGENT property of
    // classify()'s anchored fixed-depth regexes — load-bearing, untested,
    // invisible — while the bundle compiler shipped the very same files. Now it
    // is a named concept, shared with the compiler. `courses/_template/**` is
    // deliberately NOT skipped here: the scaffold stays linted.
    if (isDraftPath(path)) continue;
    const kind = classify(path);
    if (!kind) continue;
    const abs = join(root, path);
    try {
      docs.push({ path, abs, kind, data: parseByKind(abs, kind) });
    } catch (err) {
      docs.push({
        path,
        abs,
        kind,
        data: undefined,
        parseError: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return docs;
}
