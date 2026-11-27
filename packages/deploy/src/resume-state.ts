import { Keypair } from "@solana/web3.js";
import { CHUNK_SIZE } from "./constants";
import { getCachedBinaryLength } from "./deploy";
import type { DeploymentState } from "./types";

function sameBytes(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

/**
 * Is this saved state safe to resume into?
 *
 * Saved state comes back from browser storage, which anything running in the
 * origin can write. Resuming replays rent-paying transactions against whatever
 * accounts the state names, so every field that names an account is checked
 * against something this session already knows: the build it belongs to, and
 * the program keypair the build server injected via `declare_id!`.
 */
export function isResumableDeploymentState(
  state: unknown,
  expected: { buildUuid: string; programKeypairSecret?: number[] }
): state is DeploymentState {
  if (typeof state !== "object" || state === null) return false;
  const candidate = state as Partial<DeploymentState>;

  if (candidate.buildUuid !== expected.buildUuid) return false;
  if (
    typeof candidate.totalChunks !== "number" ||
    candidate.totalChunks <= 0 ||
    !Number.isInteger(candidate.totalChunks)
  ) {
    return false;
  }
  if (
    typeof candidate.lastUploadedChunk !== "number" ||
    !Number.isInteger(candidate.lastUploadedChunk) ||
    candidate.lastUploadedChunk < -1 ||
    candidate.lastUploadedChunk >= candidate.totalChunks
  ) {
    return false;
  }

  const cachedLen = getCachedBinaryLength(expected.buildUuid);
  if (
    cachedLen !== null &&
    candidate.totalChunks !== Math.ceil(cachedLen / CHUNK_SIZE)
  ) {
    return false;
  }

  if (
    !isKeypairSecret(candidate.bufferKeypairSecret) ||
    !isKeypairSecret(candidate.programKeypairSecret)
  ) {
    return false;
  }

  // The deployed address must be the one `declare_id!()` was compiled with, so
  // a swapped program keypair — the crafted state that would hand the deploy to
  // someone else's program id — cannot be resumed into.
  if (
    expected.programKeypairSecret &&
    !sameBytes(candidate.programKeypairSecret, expected.programKeypairSecret)
  ) {
    return false;
  }

  return (
    candidate.phase === "buffer_created" ||
    candidate.phase === "uploading" ||
    candidate.phase === "finalizing" ||
    candidate.phase === "complete"
  );
}

function isKeypairSecret(value: unknown): value is number[] {
  if (!Array.isArray(value) || value.length !== 64) return false;
  if (!value.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
    return false;
  }
  try {
    Keypair.fromSecretKey(Uint8Array.from(value));
    return true;
  } catch {
    return false;
  }
}
