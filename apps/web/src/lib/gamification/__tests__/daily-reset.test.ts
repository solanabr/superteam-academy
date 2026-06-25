import { describe, it, expect } from "vitest";
import { nextMidnightUtc } from "../daily-reset";

describe("nextMidnightUtc", () => {
  it("returns the next UTC midnight for a mid-day time", () => {
    const now = new Date("2026-06-25T13:45:30.000Z");
    expect(nextMidnightUtc(now)).toBe("2026-06-26T00:00:00.000Z");
  });

  it("rolls over month and year boundaries", () => {
    expect(nextMidnightUtc(new Date("2026-12-31T23:59:59.000Z"))).toBe(
      "2027-01-01T00:00:00.000Z"
    );
  });

  it("always lands exactly on midnight and strictly in the future", () => {
    const now = new Date("2026-06-25T00:00:00.000Z");
    const next = nextMidnightUtc(now);
    expect(next).toMatch(/T00:00:00\.000Z$/);
    expect(new Date(next).getTime()).toBeGreaterThan(now.getTime());
  });
});
