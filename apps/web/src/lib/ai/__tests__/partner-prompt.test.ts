import { describe, it, expect } from "vitest";
import {
  buildStaticPrefix,
  buildDynamicSuffix,
  maxTokensFor,
} from "../partner-prompt";

const ctx = {
  task: "Build an instruction",
  visibleTests: [{ description: "returns X", input: "a", expectedOutput: "b" }],
  solution: "fn solve() {}",
  language: "rust",
};

describe("partner-prompt", () => {
  it("static prefix is deterministic (cache-shaped) and includes solution + tests", () => {
    const a = buildStaticPrefix(ctx);
    const b = buildStaticPrefix(ctx);
    expect(a).toBe(b); // byte-identical across calls → cacheable
    expect(a).toContain("fn solve() {}");
    expect(a).toContain("returns X");
    expect(a).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no timestamps
  });

  it("dynamic suffix carries learner code + action, not in the prefix", () => {
    const suffix = buildDynamicSuffix({
      lessonSlug: "l",
      courseSlug: "c",
      action: "propose",
      code: "let x = 1;",
      testSummary: "1/2 passing",
    });
    expect(suffix).toContain("let x = 1;");
    expect(suffix).toContain("propose");
    expect(buildStaticPrefix(ctx)).not.toContain("let x = 1;");
  });

  it("token caps are tight per intent", () => {
    expect(maxTokensFor("hint")).toBeLessThanOrEqual(160);
    expect(maxTokensFor("propose")).toBeLessThanOrEqual(500);
  });
});
