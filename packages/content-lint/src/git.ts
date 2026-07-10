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

/** The merge-base of HEAD and baseRef; falls back to baseRef itself. Null if git is unavailable. */
export function mergeBase(root: string, baseRef: string): string | null {
  const mb = git(root, ["merge-base", "HEAD", baseRef]);
  if (mb) return mb.trim();
  // No common ancestor (e.g. baseRef == HEAD in a fresh repo) — use baseRef directly.
  return git(root, ["rev-parse", baseRef])?.trim() ?? null;
}

/** File contents at `ref`, or null when the path did not exist there. */
export function gitShow(
  root: string,
  ref: string,
  path: string
): string | null {
  return git(root, ["show", `${ref}:${path}`]);
}
