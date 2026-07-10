import { describe, it, expect } from "vitest";
import {
  padContentTxId,
  contentTxIdMatchesHead,
  deriveActiveMask,
  assertMaskMatchesLockfile,
} from "../content-commit";
import { MaskMismatchError } from "../types";

const sha = "a".repeat(40); // 20 bytes of 0xaa

describe("padContentTxId", () => {
  it("left-pads the 20-byte sha into 32 bytes (12 leading zeros)", () => {
    const bytes = padContentTxId(sha);
    expect(bytes).toHaveLength(32);
    expect(bytes.slice(0, 12)).toEqual(Array(12).fill(0));
    expect(bytes.slice(12)).toEqual(Array(20).fill(0xaa));
  });

  it("rejects a non-40-hex sha", () => {
    expect(() => padContentTxId("abc")).toThrow();
  });
});

describe("contentTxIdMatchesHead", () => {
  it("is true when the on-chain bytes equal the padded head sha", () => {
    expect(contentTxIdMatchesHead(padContentTxId(sha), sha)).toBe(true);
  });
  it("is false for the all-zero legacy value", () => {
    expect(contentTxIdMatchesHead(Array(32).fill(0), sha)).toBe(false);
  });
  it("accepts a Uint8Array as well as number[]", () => {
    expect(
      contentTxIdMatchesHead(new Uint8Array(padContentTxId(sha)), sha)
    ).toBe(true);
  });
});

describe("deriveActiveMask", () => {
  it("sets a bit per live slot and clears retired ones", () => {
    // slots 0 and 2 live, slot 1 retired → mask low word = 0b101 = 5
    const mask = deriveActiveMask({
      version: 1,
      slots: { a: 0, b: 1, c: 2 },
      retired: [1],
      next: 3,
    });
    expect(mask[0]).toBe(5n);
    expect(mask.slice(1)).toEqual([0n, 0n, 0n]);
  });

  it("places a high slot in the correct u64 word", () => {
    const mask = deriveActiveMask({
      version: 1,
      slots: { x: 64 },
      retired: [],
      next: 65,
    });
    expect(mask[0]).toBe(0n);
    expect(mask[1]).toBe(1n);
  });
});

describe("assertMaskMatchesLockfile", () => {
  const slots = { version: 1, slots: { a: 0, c: 2 }, retired: [], next: 3 };
  it("passes when the mask to send equals the lockfile-derived mask", () => {
    expect(() =>
      assertMaskMatchesLockfile("course-x", [5n, 0n, 0n, 0n], slots)
    ).not.toThrow();
  });
  it("throws MaskMismatchError when the panel would set an arbitrary bit", () => {
    expect(() =>
      assertMaskMatchesLockfile("course-x", [7n, 0n, 0n, 0n], slots)
    ).toThrow(MaskMismatchError);
  });
});
