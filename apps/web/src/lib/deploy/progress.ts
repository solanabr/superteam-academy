/**
 * Chunk progress as a bar, not a wall of signatures.
 *
 * The remaining estimate is deliberately crude — the rate observed so far,
 * applied to the chunks left — because the only question it has to answer is
 * "is this seconds or minutes?".
 */

import type { DeployStep } from "@superteam-lms/deploy";

/**
 * The deploy package emits buffer/upload/finalize/complete today. `transfer`
 * and `refund` exist here so a later phase has a label the moment it is
 * emitted; the UI renders whichever phase it is actually given.
 */
export type DeployPhase = DeployStep | "transfer" | "refund";

export const DEPLOY_PHASE_KEYS: Record<DeployPhase, string> = {
  buffer: "phaseBuffer",
  upload: "phaseUpload",
  finalize: "phaseFinalize",
  transfer: "phaseTransfer",
  refund: "phaseRefund",
  complete: "phaseComplete",
};

export interface DeployProgressInput {
  chunkCurrent: number;
  chunkTotal: number;
  elapsedMs: number;
}

export interface DeployProgressReadout {
  /** 0-100, integer. 0 while the total is unknown. */
  percent: number;
  /** Whole seconds left, or null when there is nothing to extrapolate from. */
  remainingSeconds: number | null;
}

export function deployProgress({
  chunkCurrent,
  chunkTotal,
  elapsedMs,
}: DeployProgressInput): DeployProgressReadout {
  if (chunkTotal <= 0) return { percent: 0, remainingSeconds: null };

  const done = Math.max(0, Math.min(chunkCurrent, chunkTotal));
  const percent = Math.round((done / chunkTotal) * 100);

  if (done <= 0 || elapsedMs <= 0 || done >= chunkTotal) {
    return { percent, remainingSeconds: null };
  }

  const msPerChunk = elapsedMs / done;
  return {
    percent,
    remainingSeconds: Math.max(
      1,
      Math.round((msPerChunk * (chunkTotal - done)) / 1000)
    ),
  };
}

export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
