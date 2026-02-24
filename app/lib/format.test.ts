import { describe, it, expect } from "vitest";
import {
  formatXp,
  truncateWallet,
  formatDate,
  difficultyLabel,
  solscanTxUrl,
} from "./format";

describe("formatXp", () => {
  it("formats 0", () => {
    expect(formatXp(0)).toBe("0");
  });

  it("formats 999", () => {
    expect(formatXp(999)).toBe("999");
  });

  it("formats 1000 as 1.0K", () => {
    expect(formatXp(1000)).toBe("1.0K");
  });

  it("formats 1500 as 1.5K", () => {
    expect(formatXp(1500)).toBe("1.5K");
  });

  it("formats 1M", () => {
    expect(formatXp(1_000_000)).toBe("1.0M");
  });

  it("formats 2.5M", () => {
    expect(formatXp(2_500_000)).toBe("2.5M");
  });
});

describe("truncateWallet", () => {
  it("returns short address as-is", () => {
    expect(truncateWallet("abc")).toBe("abc");
  });

  it("truncates 44-char address", () => {
    const addr = "A".repeat(44);
    expect(truncateWallet(addr)).toBe("AAAA...AAAA");
  });

  it("truncates with custom char count", () => {
    const addr = "A".repeat(44);
    expect(truncateWallet(addr, 6)).toBe("AAAAAA...AAAAAA");
  });

  it("keeps address at boundary length", () => {
    // chars=4, threshold = 4*2+3 = 11
    expect(truncateWallet("12345678901")).toBe("12345678901");
    expect(truncateWallet("123456789012")).toBe("1234...9012");
  });
});

describe("formatDate", () => {
  it("formats date in English", () => {
    const result = formatDate(1704067200, "en");
    expect(result).toContain("2024");
  });

  it("formats date in pt-BR", () => {
    const result = formatDate(1704067200, "pt-BR");
    expect(result).toContain("2024");
  });

  it("formats date in Spanish", () => {
    const result = formatDate(1704067200, "es");
    expect(result).toContain("2024");
  });
});

describe("difficultyLabel", () => {
  it("returns Beginner for 1", () => {
    expect(difficultyLabel(1)).toBe("Beginner");
  });

  it("returns Intermediate for 2", () => {
    expect(difficultyLabel(2)).toBe("Intermediate");
  });

  it("returns Advanced for 3", () => {
    expect(difficultyLabel(3)).toBe("Advanced");
  });

  it("returns Unknown for out of range", () => {
    expect(difficultyLabel(99)).toBe("Unknown");
  });

  it("returns empty string for 0", () => {
    expect(difficultyLabel(0)).toBe("");
  });
});

describe("solscanTxUrl", () => {
  it("builds devnet URL", () => {
    expect(solscanTxUrl("abc123", "devnet")).toBe(
      "https://solscan.io/tx/abc123?cluster=devnet"
    );
  });

  it("defaults to devnet", () => {
    expect(solscanTxUrl("abc123")).toBe(
      "https://solscan.io/tx/abc123?cluster=devnet"
    );
  });
});
