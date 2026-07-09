import { describe, it, expect } from "vitest";
import { SlotsLock, assignSlots } from "../slots";

const lock = {
  version: 1 as const,
  slots: { "lesson-a": 0, "lesson-b": 1 },
  retired: [] as number[],
  next: 2,
};

describe("SlotsLock", () => {
  it("accepts a well-formed lockfile", () => {
    expect(SlotsLock.parse(lock).next).toBe(2);
  });

  it("rejects a duplicate slot number", () => {
    expect(
      SlotsLock.safeParse({ ...lock, slots: { "lesson-a": 0, "lesson-b": 0 } })
        .success
    ).toBe(false);
  });

  it("rejects a live slot that is also retired", () => {
    expect(SlotsLock.safeParse({ ...lock, retired: [1] }).success).toBe(false);
  });

  it("rejects next <= any assigned or retired slot", () => {
    expect(SlotsLock.safeParse({ ...lock, next: 1 }).success).toBe(false);
  });

  it("rejects a slot beyond the on-chain bitmap", () => {
    expect(
      SlotsLock.safeParse({
        version: 1,
        slots: { "lesson-a": 256 },
        retired: [],
        next: 257,
      }).success
    ).toBe(false);
  });
});

describe("assignSlots", () => {
  it("assigns dense slots from live order on first run", () => {
    const out = assignSlots(null, ["lesson-a", "lesson-b", "lesson-c"]);
    expect(out.slots).toEqual({ "lesson-a": 0, "lesson-b": 1, "lesson-c": 2 });
    expect(out.next).toBe(3);
  });

  it("never renumbers an existing lesson when the order changes", () => {
    const out = assignSlots(lock, ["lesson-b", "lesson-a"]);
    expect(out.slots).toEqual({ "lesson-a": 0, "lesson-b": 1 });
  });

  it("appends a new lesson at next, and advances next", () => {
    const out = assignSlots(lock, ["lesson-a", "lesson-c", "lesson-b"]);
    expect(out.slots["lesson-c"]).toBe(2);
    expect(out.next).toBe(3);
  });

  it("retires a removed lesson's slot and never reuses it", () => {
    const out = assignSlots(lock, ["lesson-a"]);
    expect(out.slots).toEqual({ "lesson-a": 0 });
    expect(out.retired).toEqual([1]);
    const after = assignSlots(out, ["lesson-a", "lesson-d"]);
    expect(after.slots["lesson-d"]).toBe(2); // NOT 1
  });

  it("throws when the course exceeds the bitmap", () => {
    const ids = Array.from({ length: 257 }, (_, i) => `lesson-l${i}`);
    expect(() => assignSlots(null, ids)).toThrow(/at most 256/);
  });
});
