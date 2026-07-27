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

/**
 * A best-effort base ref for a run with no explicit `GITHUB_BASE_REF` /
 * `LINT_BASE_REF` (a bare local invocation). Prefers the remote's default branch
 * (`origin/HEAD` → e.g. `origin/main`), then the common `origin/main` /
 * `origin/master`. Returns null when no remote-tracking base exists — a repo with
 * no fetched remote — in which case gates 2/3 cannot verify immutability and MUST
 * say so rather than fabricate a comparison. Never invents `HEAD` as its own base.
 */
export function resolveLocalBase(root: string): string | null {
  const head = git(root, [
    "symbolic-ref",
    "--quiet",
    "refs/remotes/origin/HEAD",
  ])
    ?.trim()
    .replace(/^refs\/remotes\//, "");
  if (head && head !== "origin/HEAD") return head;
  for (const cand of ["origin/main", "origin/master"]) {
    if (
      git(root, ["rev-parse", "--verify", "--quiet", `${cand}^{commit}`]) !==
      null
    ) {
      return cand;
    }
  }
  return null;
}

/** True when `ref` resolves to a commit object in `root`. */
export function resolvesRef(root: string, ref: string): boolean {
  return (
    git(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]) !== null
  );
}

/** File contents at `ref`, or null when the path did not exist there. */
export function gitShow(
  root: string,
  ref: string,
  path: string
): string | null {
  return git(root, ["show", `${ref}:${path}`]);
}
