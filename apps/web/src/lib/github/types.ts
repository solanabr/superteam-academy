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

/** The active_lessons mask does not match the committed slots.lock.json (§11.0). */
export class MaskMismatchError extends Error {
  constructor(public readonly courseId: string) {
    super(
      `active_lessons mask for ${courseId} does not match its slots.lock.json`
    );
    this.name = "MaskMismatchError";
  }
}
