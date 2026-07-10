import { execFileSync } from "node:child_process";

function git(root: string, args: string[]): string | null {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

/**
 * The fork point of HEAD and baseRef.
 *
 * `exact: true` is the real `git merge-base` (the true common ancestor). When
 * that fails — most commonly a SHALLOW base fetch (`--depth=1`) with no parent
 * links, so there is no reachable common ancestor — it degrades to the base
 * `rev-parse` (the base TIP) and reports `exact: false`. The tip is NOT the fork
 * point on a diverged base, so callers (gates 2 and 3, which compare against the
 * base) MUST surface `exact: false` as a diagnostic — a silent wrong comparison
 * defeats the immutability gates. Returns null only when git is unavailable.
 */
export function mergeBase(
  root: string,
  baseRef: string
): { ref: string; exact: boolean } | null {
  const mb = git(root, ["merge-base", "HEAD", baseRef]);
  if (mb) return { ref: mb.trim(), exact: true };
  // No reachable common ancestor (shallow base, or baseRef == HEAD in a fresh
  // repo) — fall back to the base tip and flag the comparison as inexact.
  const tip = git(root, ["rev-parse", baseRef])?.trim();
  return tip ? { ref: tip, exact: false } : null;
}

/** File contents at `ref`, or null when the path did not exist there. */
export function gitShow(
  root: string,
  ref: string,
  path: string
): string | null {
  return git(root, ["show", `${ref}:${path}`]);
}
