import { describe, it, expect } from "vitest";
import {
  buildStaticPrefix,
  buildDynamicSuffix,
  maxTokensFor,
  responseSchemaFor,
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

  it("propose output cap dropped to 2048 and sits below the full-answer ask cap", () => {
    // Post diff-propose (AIE-15): propose emits only the changed lines as compact
    // search/replace edits (median reference edit ~150 tokens), so it no longer
    // needs the biggest budget — the order is now hint < propose < ask, and
    // propose is pinned at 2048 to close AIE-11's truncation lever.
    expect(maxTokensFor("hint")).toBeLessThan(maxTokensFor("propose"));
    expect(maxTokensFor("propose")).toBe(2048);
    expect(maxTokensFor("propose")).toBeLessThan(maxTokensFor("ask"));
  });

  it("propose schema requests compact edits, never a whole-file field or prose", () => {
    const schema = responseSchemaFor("propose");
    expect(schema.properties).toHaveProperty("edits");
    expect(schema.properties).not.toHaveProperty("proposedCode");
    expect(schema.required).toContain("edits");
    // Still no `text` field — a propose response cannot emit a runaway narrative.
    expect(schema.properties).not.toHaveProperty("text");
  });

  it("persona instructs minimal search/replace edits, not a full-file echo", () => {
    const prefix = buildStaticPrefix(ctx);
    expect(prefix).toContain("search");
    expect(prefix).toContain("replace");
    expect(prefix).not.toContain("the full updated file");
  });
});
