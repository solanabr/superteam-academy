import { describe, it, expect } from "vitest";
import { capCredentialName } from "../credential-metadata";

const byteLen = (s: string) => new TextEncoder().encode(s).length;

describe("capCredentialName", () => {
  it("keeps short course names intact under the prefix", () => {
    expect(capCredentialName("Rust")).toBe("Superteam Academy: Rust");
  });

  it("never exceeds the 32-byte on-chain limit", () => {
    const long = capCredentialName("Full Stack Solana Development Masterclass");
    expect(byteLen(long)).toBeLessThanOrEqual(32);
    expect(long.startsWith("Superteam Academy: ")).toBe(true);
  });

  it("caps multi-byte (non-ASCII) titles cleanly on code-point boundaries", () => {
    // each 🚀 is 4 UTF-8 bytes / 2 UTF-16 code units — naive code-unit slicing
    // would orphan a surrogate and emit U+FFFD.
    const capped = capCredentialName("🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀");
    expect(byteLen(capped)).toBeLessThanOrEqual(32);
    // No replacement character (would signal an orphaned surrogate half).
    expect(capped).not.toContain("�");
    // Every code point is whole (no lone surrogate in D800–DFFF).
    for (const ch of capped) {
      const cp = ch.codePointAt(0) ?? 0;
      expect(cp < 0xd800 || cp > 0xdfff).toBe(true);
    }
  });

  it("handles an empty course name", () => {
    expect(byteLen(capCredentialName(""))).toBeLessThanOrEqual(32);
  });
});
