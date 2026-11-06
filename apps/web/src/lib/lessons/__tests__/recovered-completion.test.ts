import { describe, expect, it } from "vitest";
import { recoveredCompletedAt } from "../recovered-completion";

const NOW = new Date("2026-11-05T12:00:00Z");
const CREATED = "2026-11-05T10:00:00Z";
const seconds = (iso: string) => new Date(iso).getTime() / 1000;

describe("recoveredCompletedAt", () => {
  it("dates a lesson from this account's own enrollment to now", () => {
    expect(
      recoveredCompletedAt(seconds("2026-11-05T11:00:00Z"), CREATED, NOW)
    ).toBe(NOW.toISOString());
  });

  it("leaves the date empty when the enrollment predates the account", () => {
    expect(
      recoveredCompletedAt(seconds("2026-11-05T09:00:00Z"), CREATED, NOW)
    ).toBeNull();
  });

  it("accepts the BN the Anchor decoder returns", () => {
    const bn = { toString: () => String(seconds("2026-01-01T00:00:00Z")) };
    expect(recoveredCompletedAt(bn, CREATED, NOW)).toBeNull();
  });

  it.each([
    [undefined, CREATED],
    [null, CREATED],
    ["not a number", CREATED],
    [seconds("2026-01-01T00:00:00Z"), null],
    [seconds("2026-01-01T00:00:00Z"), undefined],
    [seconds("2026-01-01T00:00:00Z"), "garbage"],
  ])("keeps today's date when it can't tell (%s, %s)", (enrolled, created) => {
    expect(recoveredCompletedAt(enrolled, created, NOW)).toBe(
      NOW.toISOString()
    );
  });
});
