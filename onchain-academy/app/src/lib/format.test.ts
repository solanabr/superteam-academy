import { describe, it, expect } from "vitest";
import { formatDate, formatNumber } from "./format";

describe("formatDate", () => {
  const date = new Date("2026-02-25T12:00:00Z");

  it("formats with en locale", () => {
    const result = formatDate(date, "en");
    expect(result).toContain("Feb");
    expect(result).toContain("25");
    expect(result).toContain("2026");
  });

  it("accepts string input", () => {
    const result = formatDate("2026-02-25T12:00:00Z", "en");
    expect(result).toContain("2026");
  });

  it("accepts number (timestamp) input", () => {
    const result = formatDate(date.getTime(), "en");
    expect(result).toContain("2026");
  });

  it("maps pt-br locale", () => {
    const result = formatDate(date, "pt-br");
    expect(result).toContain("2026");
  });
});

describe("formatNumber", () => {
  it("formats thousands with en locale", () => {
    expect(formatNumber(1000, "en")).toBe("1,000");
  });

  it("formats large numbers", () => {
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
  });

  it("handles zero", () => {
    expect(formatNumber(0, "en")).toBe("0");
  });

  it("handles decimals", () => {
    const result = formatNumber(1234.56, "en");
    expect(result).toContain("1,234");
  });
});
