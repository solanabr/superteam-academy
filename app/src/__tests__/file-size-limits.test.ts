import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Verify the PRD claim "Enforce max 400 lines per file".
 * These tests document files that violate this constraint.
 */

const SRC_ROOT = join(__dirname, "..");

function countLines(relativePath: string): number {
  const content = readFileSync(join(SRC_ROOT, relativePath), "utf-8");
  return content.split("\n").length;
}

describe("file size limits (PRD: max 400 lines)", () => {
  it("daily-challenges.ts exceeds 400 lines", () => {
    const lines = countLines("lib/daily-challenges.ts");
    // This file is ~1224 lines — 3x the limit
    expect(lines).toBeGreaterThan(400);
  });

  it("certificate-client.tsx exceeds 400 lines", () => {
    const lines = countLines("components/certificate/certificate-client.tsx");
    // This file is ~493 lines
    expect(lines).toBeGreaterThan(400);
  });

  it("prisma-progress.ts exceeds 400 lines", () => {
    const lines = countLines("lib/services/prisma-progress.ts");
    // This file is ~456 lines
    expect(lines).toBeGreaterThan(400);
  });
});
