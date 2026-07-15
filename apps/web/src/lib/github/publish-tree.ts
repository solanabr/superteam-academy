import {
  ASSET_PUBLIC_PREFIX,
  GENERATED_DIR,
  GENERATED_README,
  type CompiledBundle,
} from "@/lib/content/compile/compile-bundle";

/**
 * Pure helpers for the one-click publish commit (`/api/admin/publish/pin/open`).
 *
 * The commit REBUILDS the generated bundle from scratch, mirroring
 * `scripts/compile-content.ts`'s `writeBundle` (which `rm -rf`s the two managed
 * dirs before writing): the new git tree lists every carried-forward repo path
 * explicitly and drops every base-tree entry under the managed paths, so a
 * removed module or renamed asset can never survive as an orphan and turn the
 * CI "Content bundle freshness" check red. No `server-only`, no network — kept
 * pure so the tree shape is unit-testable without a live GitHub.
 */

const enc = new TextEncoder();

/** The web app's path prefix inside the monorepo (APP repo is the monorepo). */
export const WEB_ROOT = "apps/web";
/** Repo-relative path of the pin file the commit bumps. */
export const LOCK_REPO_PATH = `${WEB_ROOT}/content.lock`;
/** Repo-relative dir the JSON modules + README are rebuilt under. */
export const GENERATED_REPO_DIR = `${WEB_ROOT}/${GENERATED_DIR}`;
/** Repo-relative dir the copied content assets are rebuilt under. */
export const ASSET_REPO_DIR = `${WEB_ROOT}/public/${ASSET_PUBLIC_PREFIX}`;

/**
 * True for a repo path the publish commit owns and rebuilds from scratch: the
 * pin file, anything under the generated dir, anything under the asset dir.
 * Every base-tree entry matching this is dropped from the carried-forward set.
 */
export function isManagedPath(path: string): boolean {
  return (
    path === LOCK_REPO_PATH ||
    path.startsWith(`${GENERATED_REPO_DIR}/`) ||
    path.startsWith(`${ASSET_REPO_DIR}/`)
  );
}

/**
 * Byte-faithful `content.lock` bump: swap the pinned sha inside the existing
 * lock text, preserving every other byte (formatting, key order, the trailing
 * newline). Editing the raw text rather than re-serializing guarantees the only
 * change is the sha — nothing a prettier check could flag.
 */
export function bumpLockContent(
  currentLock: string,
  newSha: string
): { text: string; oldSha: string } {
  const parsed = JSON.parse(currentLock) as { sha?: unknown };
  const oldSha = parsed.sha;
  if (typeof oldSha !== "string" || oldSha.length === 0) {
    throw new Error("content.lock has no sha");
  }
  return { text: currentLock.replaceAll(oldSha, newSha), oldSha };
}

/** A file the publish commit writes fresh (uploaded as a blob, then committed). */
export interface FreshFile {
  /** Repo-relative path (under the monorepo root). */
  path: string;
  /** Exact bytes to commit. */
  bytes: Uint8Array;
}

/**
 * Every file the publish commit writes fresh, at repo-relative paths, mirroring
 * `writeBundle`'s on-disk layout: the bumped lock, the generated README + JSON
 * modules, and the copied assets. Text is encoded UTF-8 so blob bytes match the
 * committed bundle exactly.
 */
export function bundleFreshFiles(
  bundle: CompiledBundle,
  lockText: string
): FreshFile[] {
  const files: FreshFile[] = [
    { path: LOCK_REPO_PATH, bytes: enc.encode(lockText) },
    {
      path: `${GENERATED_REPO_DIR}/README.md`,
      bytes: enc.encode(GENERATED_README),
    },
  ];
  for (const [name, contents] of bundle.files) {
    files.push({
      path: `${GENERATED_REPO_DIR}/${name}`,
      bytes: enc.encode(contents),
    });
  }
  for (const [rel, bytes] of bundle.assets) {
    files.push({ path: `${ASSET_REPO_DIR}/${rel}`, bytes });
  }
  return files;
}

/** A leaf entry in a git tree (blob file or commit gitlink; never a dir tree). */
export interface BaseTreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
}

/**
 * Base-tree entries carried forward unchanged: every leaf (`blob` file or
 * `commit` submodule gitlink — NOT the implicit `tree` dir entries, which
 * GitHub rebuilds from the leaf paths) whose path the commit does not own.
 * Managed paths are dropped so the fresh set is the ONLY content beneath the
 * generated/asset dirs and the lock — the from-scratch rebuild, no `base_tree`
 * overlay, no orphans.
 */
export function retainedBaseEntries(entries: BaseTreeEntry[]): BaseTreeEntry[] {
  return entries.filter((e) => e.type !== "tree" && !isManagedPath(e.path));
}
