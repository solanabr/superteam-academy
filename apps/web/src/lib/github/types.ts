/** A repo tarball flattened to POSIX paths (relative to the repo root) → file bytes. */
export type RepoTree = Map<string, Uint8Array>;

/** GitHub combined check state for a commit (Checks API `conclusion` folded). */
export type ChecksState = "success" | "failure" | "pending" | "unknown";

/** HEAD's CI is red — refuse to sync (§11.1 `blocked`). */
export class BlockedCommitError extends Error {
  constructor(public readonly sha: string) {
    super(`Refusing to sync ${sha}: its CI checks are not passing`);
    this.name = "BlockedCommitError";
  }
}

/** GitHub API unreachable / unauthenticated (missing GITHUB_TOKEN, rate limit). */
export class GitHubUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubUnavailableError";
  }
}

/**
 * The target branch already exists (createRef → 422). The one-click publish
 * route maps this to a 409-degrade instead of a 500/force-push: a re-click at
 * the same content SHA is idempotent, never destructive.
 */
export class RefExistsError extends Error {
  constructor(public readonly branch: string) {
    super(`ref refs/heads/${branch} already exists`);
    this.name = "RefExistsError";
  }
}

/**
 * The base tree came back truncated (too many entries for one recursive read).
 * The rebuild-from-scratch tree lists every retained path explicitly, so a
 * truncated read would silently DROP repo files from the commit — refuse rather
 * than open a destructive PR.
 */
export class TreeTruncatedError extends Error {
  constructor() {
    super("repo tree too large to rebuild safely (truncated)");
    this.name = "TreeTruncatedError";
  }
}

/** The active_lessons mask does not match the committed slots.lock.json (§11.0). */
export class MaskMismatchError extends Error {
  constructor(public readonly courseId: string) {
    super(
      `active_lessons mask for ${courseId} does not match its slots.lock.json`
    );
    this.name = "MaskMismatchError";
  }
}
