import { describe, it, expect } from "vitest";
import { truncateAddress, formatXp, cn } from "../utils";

describe("truncateAddress — extended coverage", () => {
  describe("default 4-character truncation", () => {
    it("truncates a typical 32-char Solana address", () => {
      const addr = "So11111111111111111111111111111112";
      const result = truncateAddress(addr);
      expect(result).toBe("So11...1112");
    });

    it("produces <start>...<end> format always", () => {
      const result = truncateAddress("ABCDEFGHIJKLMNOPQRSTUVWXYZ123456", 4);
      expect(result).toMatch(/^ABCD\.\.\.3456$/);
    });

    it("handles exactly 8-char address (min useful length)", () => {
      const addr = "12345678";
      const result = truncateAddress(addr, 4);
      expect(result).toBe("1234...5678");
    });

    it("always has exactly '...' as separator", () => {
      expect(truncateAddress("AAABBBCCCDDD", 3)).toBe("AAA...DDD");
    });
  });

  describe("custom chars parameter", () => {
    it("uses 1 char on each side", () => {
      expect(truncateAddress("ABCDEFGHIJ", 1)).toBe("A...J");
    });

    it("uses 2 chars on each side", () => {
      expect(truncateAddress("ABCDEFGHIJ", 2)).toBe("AB...IJ");
    });

    it("uses 6 chars on each side", () => {
      const addr = "AABBCCDDEEFFGGHH";
      // truncateAddress(addr, 6) = addr.slice(0,6) + "..." + addr.slice(-6) = "AABBCC...FFGGHH"
      expect(truncateAddress(addr, 6)).toBe("AABBCC...FFGGHH");
    });

    it("uses 8 chars on each side", () => {
      const addr = "12345678ABCDEFGH";
      const result = truncateAddress(addr, 8);
      expect(result).toBe("12345678...ABCDEFGH");
    });
  });

  describe("edge cases", () => {
    it("handles all-same-character address", () => {
      const addr = "1111111111111111111111111111111111";
      const result = truncateAddress(addr);
      expect(result).toBe("1111...1111");
    });

    it("preserves exact prefix and suffix characters", () => {
      const addr = "XYZWabcdefghijklmnopqrstuvwxyzABCD";
      const result = truncateAddress(addr, 4);
      expect(result.startsWith("XYZW")).toBe(true);
      expect(result.endsWith("ABCD")).toBe(true);
    });

    it("contains exactly one '...' separator", () => {
      const result = truncateAddress("SomeAddressHere1234", 3);
      const occurrences = (result.match(/\.\.\./g) ?? []).length;
      expect(occurrences).toBe(1);
    });
  });
});

describe("formatXp — extended coverage", () => {
  describe("values under 1000 (no suffix)", () => {
    it("formats 0 as '0'", () => {
      expect(formatXp(0)).toBe("0");
    });

    it("formats 1 as '1'", () => {
      expect(formatXp(1)).toBe("1");
    });

    it("formats 99 as '99'", () => {
      expect(formatXp(99)).toBe("99");
    });

    it("formats 500 as '500'", () => {
      expect(formatXp(500)).toBe("500");
    });

    it("formats 999 as '999'", () => {
      expect(formatXp(999)).toBe("999");
    });
  });

  describe("thousands range (1000–999999)", () => {
    it("formats 1000 as '1.0K'", () => {
      expect(formatXp(1000)).toBe("1.0K");
    });

    it("formats 1500 as '1.5K'", () => {
      expect(formatXp(1500)).toBe("1.5K");
    });

    it("formats 2000 as '2.0K'", () => {
      expect(formatXp(2000)).toBe("2.0K");
    });

    it("formats 10000 as '10.0K'", () => {
      expect(formatXp(10000)).toBe("10.0K");
    });

    it("formats 100000 as '100.0K'", () => {
      expect(formatXp(100000)).toBe("100.0K");
    });

    it("formats 999000 as '999.0K'", () => {
      expect(formatXp(999000)).toBe("999.0K");
    });

    it("formats 999999 as '1000.0K'", () => {
      expect(formatXp(999999)).toBe("1000.0K");
    });

    it("formats 1001 as '1.0K' (rounds down at 1 decimal)", () => {
      // 1001 / 1000 = 1.001 → toFixed(1) = '1.0'
      expect(formatXp(1001)).toBe("1.0K");
    });
  });

  describe("millions range (1000000+)", () => {
    it("formats 1000000 as '1.0M'", () => {
      expect(formatXp(1_000_000)).toBe("1.0M");
    });

    it("formats 1500000 as '1.5M'", () => {
      expect(formatXp(1_500_000)).toBe("1.5M");
    });

    it("formats 2500000 as '2.5M'", () => {
      expect(formatXp(2_500_000)).toBe("2.5M");
    });

    it("formats 10000000 as '10.0M'", () => {
      expect(formatXp(10_000_000)).toBe("10.0M");
    });

    it("formats 100000000 as '100.0M'", () => {
      expect(formatXp(100_000_000)).toBe("100.0M");
    });
  });

  describe("suffix invariants", () => {
    it("values < 1000 have no K or M suffix", () => {
      expect(formatXp(999)).not.toContain("K");
      expect(formatXp(999)).not.toContain("M");
    });

    it("values 1000–999999 have K suffix, not M", () => {
      expect(formatXp(5000)).toContain("K");
      expect(formatXp(5000)).not.toContain("M");
    });

    it("values >= 1000000 have M suffix, not K", () => {
      expect(formatXp(1_000_000)).toContain("M");
      expect(formatXp(1_000_000)).not.toContain("K");
    });
  });
});

describe("cn (className merger)", () => {
  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });

  it("returns a single class unchanged", () => {
    expect(cn("flex")).toBe("flex");
  });

  it("merges multiple classes", () => {
    const result = cn("flex", "items-center", "gap-2");
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("gap-2");
  });

  it("resolves conflicting Tailwind classes (last wins)", () => {
    // twMerge should resolve p-2 vs p-4 → p-4 wins
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
    expect(result).not.toContain("p-2");
  });

  it("handles conditional classes (falsy values omitted)", () => {
    const result = cn("base", false && "conditional", "always");
    expect(result).toContain("base");
    expect(result).toContain("always");
    expect(result).not.toContain("conditional");
  });

  it("handles undefined values gracefully", () => {
    const result = cn("flex", undefined, "gap-2");
    expect(result).toContain("flex");
    expect(result).toContain("gap-2");
  });

  it("handles array of classes from object notation", () => {
    const result = cn({ flex: true, hidden: false, "items-center": true });
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).not.toContain("hidden");
  });

  it("resolves text color conflicts", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });
});
