import { describe, it, expect } from "vitest";
import { sanitizeReason } from "../sanitize-reason";

describe("sanitizeReason", () => {
  it("redacts an api-keyed RPC URL", () => {
    const out = sanitizeReason(
      "boom at https://rpc.example/?api-key=SECRET and more"
    );
    expect(out).not.toMatch(/rpc\.example/);
    expect(out).not.toMatch(/SECRET/);
    expect(out).toContain("[redacted-url]");
  });

  it("redacts a leftover api-key query param not inside a URL match", () => {
    const out = sanitizeReason("params: ?api-key=abc123 leaked");
    expect(out).not.toMatch(/abc123/);
    expect(out).toContain("[redacted-api-key]");
  });

  it("redacts the SOLANA_RPC_URL env identifier", () => {
    const out = sanitizeReason("missing env SOLANA_RPC_URL at boot");
    expect(out).not.toMatch(/SOLANA_RPC_URL/);
    expect(out).toContain("[redacted-env]");
  });

  it("redacts the PROGRAM_AUTHORITY_SECRET env identifier", () => {
    const out = sanitizeReason("missing env PROGRAM_AUTHORITY_SECRET at boot");
    expect(out).not.toMatch(/PROGRAM_AUTHORITY_SECRET/);
    expect(out).toContain("[redacted-env]");
  });

  it("leaves an ordinary message untouched", () => {
    expect(sanitizeReason("Failed to fetch")).toBe("Failed to fetch");
  });
});
