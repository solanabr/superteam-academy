import { describe, it, expect } from "vitest";
import {
  parseDurationToMinutes,
  formatMinutesToDuration,
} from "@/lib/duration-utils";

describe("parseDurationToMinutes", () => {
  it("parses minutes in various formats", () => {
    expect(parseDurationToMinutes("15 min")).toBe(15);
    expect(parseDurationToMinutes("30 minutes")).toBe(30);
    expect(parseDurationToMinutes("45m")).toBe(45);
  });

  it("parses hours in various formats", () => {
    expect(parseDurationToMinutes("1 hour")).toBe(60);
    expect(parseDurationToMinutes("2 hours")).toBe(120);
    expect(parseDurationToMinutes("1.5 hours")).toBe(90);
    expect(parseDurationToMinutes("1h")).toBe(60);
    expect(parseDurationToMinutes("1 hr")).toBe(60);
  });

  it("parses combined hours and minutes", () => {
    expect(parseDurationToMinutes("2h 30m")).toBe(150);
    expect(parseDurationToMinutes("1 hour 15 min")).toBe(75);
    expect(parseDurationToMinutes("1h30m")).toBe(90);
  });

  it("returns 0 for empty or invalid strings", () => {
    expect(parseDurationToMinutes("")).toBe(0);
    expect(parseDurationToMinutes("abc")).toBe(0);
  });

  it("handles whitespace and case variations", () => {
    expect(parseDurationToMinutes("  2 HOURS  ")).toBe(120);
    expect(parseDurationToMinutes("30 MIN")).toBe(30);
  });
});

describe("formatMinutesToDuration", () => {
  it("formats minutes only", () => {
    expect(formatMinutesToDuration(30)).toBe("30 min");
    expect(formatMinutesToDuration(45)).toBe("45 min");
  });

  it("formats exact hours", () => {
    expect(formatMinutesToDuration(60)).toBe("1 hour");
    expect(formatMinutesToDuration(120)).toBe("2 hours");
  });

  it("formats hours and minutes", () => {
    expect(formatMinutesToDuration(90)).toBe("1 hour 30 min");
    expect(formatMinutesToDuration(150)).toBe("2 hours 30 min");
  });

  it("returns '0 min' for zero or negative", () => {
    expect(formatMinutesToDuration(0)).toBe("0 min");
    expect(formatMinutesToDuration(-10)).toBe("0 min");
  });
});
