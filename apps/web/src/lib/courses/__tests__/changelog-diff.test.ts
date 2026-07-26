import { describe, it, expect } from "vitest";
import { maskToSlots, diffMasks } from "../changelog-diff";

describe("maskToSlots", () => {
  it("enumerates set bits within a single word", () => {
    expect(maskToSlots([0b1011n, 0n, 0n, 0n])).toEqual([0, 1, 3]);
  });

  it("offsets bits by 64 per word", () => {
    // bit 0 of word 1 = slot 64; bit 2 of word 2 = slot 130.
    expect(maskToSlots([0n, 1n, 0b100n, 0n])).toEqual([64, 130]);
  });

  it("handles the top bit of a word (bit 63)", () => {
    expect(maskToSlots([1n << 63n, 0n, 0n, 0n])).toEqual([63]);
  });

  it("returns nothing for an all-zero mask", () => {
    expect(maskToSlots([0n, 0n, 0n, 0n])).toEqual([]);
  });
});

describe("diffMasks", () => {
  it("reports added slots (live now, not before)", () => {
    const { addedSlots, removedSlots } = diffMasks(
      [0b011n, 0n, 0n, 0n],
      [0b111n, 0n, 0n, 0n]
    );
    expect(addedSlots).toEqual([2]);
    expect(removedSlots).toEqual([]);
  });

  it("reports removed slots (live before, not now)", () => {
    const { addedSlots, removedSlots } = diffMasks(
      [0b111n, 0n, 0n, 0n],
      [0b011n, 0n, 0n, 0n]
    );
    expect(addedSlots).toEqual([]);
    expect(removedSlots).toEqual([2]);
  });

  it("reports both directions at once, ascending", () => {
    // old: slots 0,1,3 ; new: slots 0,2,3 → added 2, removed 1.
    const { addedSlots, removedSlots } = diffMasks(
      [0b1011n, 0n, 0n, 0n],
      [0b1101n, 0n, 0n, 0n]
    );
    expect(addedSlots).toEqual([2]);
    expect(removedSlots).toEqual([1]);
  });

  it("is empty for an identical mask (a pure content re-sync)", () => {
    const same = [0b1010n, 5n, 0n, 0n];
    expect(diffMasks(same, same)).toEqual({ addedSlots: [], removedSlots: [] });
  });

  it("diffs across word boundaries", () => {
    const { addedSlots, removedSlots } = diffMasks(
      [0n, 0n, 0n, 0n],
      [0n, 1n, 0n, 0n]
    );
    expect(addedSlots).toEqual([64]);
    expect(removedSlots).toEqual([]);
  });
});
