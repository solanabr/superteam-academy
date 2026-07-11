import { type ChecksState, BlockedCommitError } from "./types";
import { contentTxIdMatchesHead } from "./content-commit";
import type { SyncStatus } from "@/lib/admin/sync-diff";

export type ContentDriftState =
  | "up_to_date"
  | "behind"
  | "never_synced"
  | "blocked";

/**
 * Content drift (§11.1): the cached contentSync.sha vs GitHub HEAD. `blocked`
 * means HEAD's CI is red — the panel must refuse to sync it, or a human could
 * click invalid content past the Zod gate. `canSync` folds the CI gate in.
 */
export function computeContentDrift(input: {
  syncedSha: string | null;
  headSha: string;
  checks: ChecksState;
}): { state: ContentDriftState; canSync: boolean } {
  const ciGreen = input.checks === "success";
  if (input.syncedSha === input.headSha)
    return { state: "up_to_date", canSync: false };
  if (!ciGreen)
    return {
      state: input.syncedSha ? "blocked" : "never_synced",
      canSync: false,
    };
  if (!input.syncedSha) return { state: "never_synced", canSync: true };
  return { state: "behind", canSync: true };
}

export type ChainDriftState =
  | "content_current" // content_tx_id == HEAD (§11.0)
  | "content_stale" // deployed, but content_tx_id != HEAD
  | "not_deployed" // no PDA yet (diffCourse)
  | "missing_fields" // diffCourse
  | "awaiting_content_sync"; // content sync must land first (ordering interlock)

/**
 * Chain drift (§11.0/§11.1). The `content_tx_id == HEAD` equality replaces the
 * field-by-field `diffCourse` heuristic for "is this course current"; the
 * surviving diffCourse states pass through. Content sync must precede chain
 * sync, so a course whose Sanity is not yet at HEAD reports
 * `awaiting_content_sync`.
 */
export function computeChainDrift(input: {
  onChainContentTxId: number[] | Uint8Array | null;
  headSha: string;
  diffStatus: SyncStatus;
  contentUpToDate: boolean;
}): ChainDriftState {
  if (input.diffStatus === "not_deployed") return "not_deployed";
  if (input.diffStatus === "missing_fields") return "missing_fields";
  if (!input.contentUpToDate) return "awaiting_content_sync";
  if (
    input.onChainContentTxId &&
    contentTxIdMatchesHead(input.onChainContentTxId, input.headSha)
  ) {
    return "content_current";
  }
  return "content_stale";
}

/**
 * Sync-time gate (§11.1 `blocked`): refuse a commit whose CI is not green. Only
 * `success` is syncable — `pending` means the two-sided executor / Zod gate may
 * not have finished, `failure` means it rejected.
 */
export function assertCommitSyncable(checks: ChecksState, sha: string): void {
  if (checks !== "success") throw new BlockedCommitError(sha);
}
