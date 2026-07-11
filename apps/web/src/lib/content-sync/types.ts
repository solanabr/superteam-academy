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

export interface SyncResult {
  sha: string;
  written: number;
  skipped: number;
  pruned: number;
  assetsUploaded: number;
  pendingChainDeltas: string[]; // course ids whose active_lessons mask changed
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
