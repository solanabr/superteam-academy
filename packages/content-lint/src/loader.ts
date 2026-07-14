import { readFileSync, readdirSync, lstatSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

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

/** Discover + parse every lintable file. Parse failures become `parseError`, never throws. */
export function discover(root: string): RawDoc[] {
  const docs: RawDoc[] = [];
  for (const path of walkFiles(root)) {
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
