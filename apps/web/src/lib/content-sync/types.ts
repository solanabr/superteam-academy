/** A repo tarball flattened to POSIX paths (relative to the repo root) → file bytes. */
export type RepoTree = Map<string, Uint8Array>;

export const MANAGED_TYPES = [
  "course",
  "lesson",
  "instructor",
  "learningPath",
  "achievement",
  "quest",
] as const;
export type ManagedType = (typeof MANAGED_TYPES)[number];

/** A minimal Sanity document. `sync`/`onChainStatus` are optional overlays. */
export interface SanityDoc {
  _id: string;
  _type: string;
  sync?: { source: string; rev: string };
  onChainStatus?: Record<string, unknown>;
  [field: string]: unknown;
}

/** GitHub combined check state for a commit (Checks API `conclusion` folded). */
export type ChecksState = "success" | "failure" | "pending" | "unknown";

export interface SyncResult {
  sha: string;
  written: number;
  skipped: number;
  pruned: number;
  assetsUploaded: number;
  pendingChainDeltas: string[]; // course ids whose active_lessons mask changed
}

/** HEAD's CI is red — refuse to sync (§11.1 `blocked`). */
export class BlockedCommitError extends Error {
  constructor(public readonly sha: string) {
    super(`Refusing to sync ${sha}: its CI checks are not passing`);
    this.name = "BlockedCommitError";
  }
}

/** The prune set exceeds the 20% blast-radius guard (§9.4). */
export class BlastRadiusError extends Error {
  constructor(
    public readonly pruneCount: number,
    public readonly managedTotal: number
  ) {
    super(
      `Prune of ${pruneCount}/${managedTotal} managed docs exceeds the 20% blast radius; aborting`
    );
    this.name = "BlastRadiusError";
  }
}

/** Zod / executor re-validation rejected the tree (§9.2 step 2, §6.2a). */
export class ContentValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Content re-validation failed: ${issues.length} issue(s)`);
    this.name = "ContentValidationError";
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
