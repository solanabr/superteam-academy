/**
 * Pure `active_lessons` mask-diff helpers for the course changelog (#654).
 *
 * The on-chain live-lesson set is a 256-bit bitmap held as four u64 words
 * (`active_lessons: [u64; 4]`). A slot's bit index is its permanent position
 * (never renumbered/reused — see packages/content-schema slots), so diffing the
 * pre- and post-update masks yields exactly which slots went live (added) or
 * were retired (removed). Kept free of server-only imports so it is unit
 * testable in isolation from the content bundle.
 */

/** Enumerate the set bit indices (global slot numbers) of a 4-word mask. */
export function maskToSlots(mask: readonly bigint[]): number[] {
  const slots: number[] = [];
  for (let w = 0; w < mask.length; w++) {
    const word = mask[w] ?? 0n;
    for (let b = 0; b < 64; b++) {
      if ((word & (1n << BigInt(b))) !== 0n) {
        slots.push(w * 64 + b);
      }
    }
  }
  return slots;
}

export interface MaskDiff {
  /** Slots live now but not before — lessons added. Ascending. */
  addedSlots: number[];
  /** Slots live before but not now — lessons retired. Ascending. */
  removedSlots: number[];
}

/** Slots that changed liveness between two masks. */
export function diffMasks(
  oldMask: readonly bigint[],
  newMask: readonly bigint[]
): MaskDiff {
  const oldSet = new Set(maskToSlots(oldMask));
  const newSet = new Set(maskToSlots(newMask));
  const addedSlots = [...newSet]
    .filter((s) => !oldSet.has(s))
    .sort((a, b) => a - b);
  const removedSlots = [...oldSet]
    .filter((s) => !newSet.has(s))
    .sort((a, b) => a - b);
  return { addedSlots, removedSlots };
}
