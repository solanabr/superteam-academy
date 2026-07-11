import { MaskMismatchError } from "./types";

interface SlotsLock {
  version: number;
  slots: Record<string, number>;
  retired: number[];
  next: number;
}

type Mask = [bigint, bigint, bigint, bigint];

/**
 * A git SHA-1 (40 hex = 20 bytes) left-padded into the 32-byte
 * `Course.content_tx_id` (§11.0): 12 leading zero bytes, then the sha.
 */
export function padContentTxId(sha: string): number[] {
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error(`expected a 40-hex git sha, got "${sha}"`);
  }
  const shaBytes: number[] = [];
  for (let i = 0; i < 40; i += 2)
    shaBytes.push(parseInt(sha.slice(i, i + 2), 16));
  return [...Array(12).fill(0), ...shaBytes];
}

/** Chain-current test (§11.0): on-chain content_tx_id equals the padded HEAD sha. */
export function contentTxIdMatchesHead(
  onChain: number[] | Uint8Array,
  headSha: string
): boolean {
  const want = padContentTxId(headSha);
  const got = Array.from(onChain);
  return got.length === 32 && want.every((b, i) => b === got[i]);
}

/**
 * Derive the 256-bit `active_lessons` mask (`[u64; 4]`) from a course's
 * slots.lock.json: one bit set per live (non-retired) slot. This is the only
 * invariant carrier for "slots are never reused" — the chain cannot know it.
 */
export function deriveActiveMask(slots: SlotsLock): Mask {
  const retired = new Set(slots.retired);
  const mask: Mask = [0n, 0n, 0n, 0n];
  for (const slot of Object.values(slots.slots)) {
    if (retired.has(slot)) continue;
    const word = Math.floor(slot / 64);
    if (word < 0 || word > 3) continue; // slots are bounded 0..255 (4 u64 words)
    const bit = BigInt(slot % 64);
    mask[word] = (mask[word] ?? 0n) | (1n << bit);
  }
  return mask;
}

/**
 * Guard for §11.0: `update_course(new_active_lessons)` trusts the authority
 * blindly, so a panel bug could set arbitrary bits. Assert the mask about to be
 * signed equals the mask derived from the committed lockfile, right before
 * signing.
 */
export function assertMaskMatchesLockfile(
  courseId: string,
  maskToSend: Mask,
  slots: SlotsLock
): void {
  const expected = deriveActiveMask(slots);
  if (!expected.every((w, i) => w === maskToSend[i])) {
    throw new MaskMismatchError(courseId);
  }
}
