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

  it("absent tutorNotes leaves the prefix unperturbed; present appends [TUTOR_NOTES] at the end", () => {
    const withoutNotes = buildStaticPrefix(ctx); // ctx has no tutorNotes
    expect(withoutNotes).not.toContain("[TUTOR_NOTES]");

    const withNotes = buildStaticPrefix({
      ...ctx,
      tutorNotes: "Nudge toward a fold, not a loop.",
    });
    expect(withNotes).toContain("[TUTOR_NOTES]");
    expect(withNotes).toContain("Nudge toward a fold, not a loop.");
    // The optional section appends at the END, so the no-notes prefix is a
    // literal prefix of the with-notes one — an absent optional field never
    // shifts the rest of the (cacheable) static prefix.
    expect(withNotes.startsWith(withoutNotes)).toBe(true);

    // undefined and empty-string are treated the same as absent (no marker),
    // so a challenge without notes has a byte-identical prefix either way.
    expect(buildStaticPrefix({ ...ctx, tutorNotes: undefined })).toBe(
      withoutNotes
    );
    expect(buildStaticPrefix({ ...ctx, tutorNotes: "" })).toBe(withoutNotes);
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

  it("token caps grow with intent and stay within the model ceiling", () => {
    // Ordered by how much output each intent needs — hint (a sentence) <
    // ask (a full answer) < propose (the entire updated file + a 3-option
    // check) — and every cap fits Flash-Lite's 8192-token output ceiling.
    expect(maxTokensFor("hint")).toBeLessThan(maxTokensFor("ask"));
    expect(maxTokensFor("ask")).toBeLessThan(maxTokensFor("propose"));
    expect(maxTokensFor("propose")).toBeLessThanOrEqual(8192);
  });
});
