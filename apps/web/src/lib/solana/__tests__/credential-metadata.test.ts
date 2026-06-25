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

  it("caps multi-byte (non-ASCII) titles by bytes, not characters", () => {
    // each emoji is 4 UTF-8 bytes — char-based truncation would overflow
    const capped = capCredentialName("🚀🚀🚀🚀🚀🚀🚀🚀🚀🚀");
    expect(byteLen(capped)).toBeLessThanOrEqual(32);
  });

  it("handles an empty course name", () => {
    expect(byteLen(capCredentialName(""))).toBeLessThanOrEqual(32);
  });
});
