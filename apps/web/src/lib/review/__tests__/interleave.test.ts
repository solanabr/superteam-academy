import { describe, it, expect } from "vitest";
import { REVIEW_INTERLEAVING_PAIRS } from "@superteam-lms/content-schema";
import { interleaveReviewSession, type ReviewSessionItem } from "../interleave";

function item(itemKey: string, skills: string[]): ReviewSessionItem {
  return {
    itemKey,
    box: 1,
    lessonTitle: itemKey,
    courseSlug: "course",
    lessonSlug: itemKey,
    skills,
    quiz: [],
  };
}

const keys = (items: ReviewSessionItem[]) => items.map((i) => i.itemKey);

describe("interleaveReviewSession (LX-B5 confusable-pair ordering)", () => {
  it("preserves due order when no items form a confusable pair", () => {
    const input = [
      item("a", ["typescript"]),
      item("b", ["react"]),
      item("c", ["cpi"]), // pairs with `signers`, which no other item carries
    ];
    expect(keys(interleaveReviewSession(input))).toEqual(["a", "b", "c"]);
  });

  it("pulls a confusable partner adjacent to its counterpart", () => {
    // pdas ↔ account-model is a REVIEW_INTERLEAVING_PAIRS pair.
    const input = [
      item("pda", ["pdas"]),
      item("mid", ["typescript"]),
      item("am", ["account-model"]),
    ];
    expect(keys(interleaveReviewSession(input))).toEqual(["pda", "am", "mid"]);
  });

  it("leaves an already-adjacent pair in place", () => {
    const input = [
      item("cpi", ["cpi"]),
      item("sig", ["signers"]),
      item("other", ["react"]),
    ];
    expect(keys(interleaveReviewSession(input))).toEqual([
      "cpi",
      "sig",
      "other",
    ]);
  });

  it("is a permutation — never adds, drops, or duplicates (cap preserved)", () => {
    const input = [
      item("pda", ["pdas"]),
      item("x", ["react"]),
      item("am", ["account-model"]),
      item("y", ["typescript"]),
      item("sig", ["signers"]),
      item("cpi", ["cpi"]),
    ];
    const out = interleaveReviewSession(input);
    expect(out).toHaveLength(input.length);
    expect(new Set(keys(out))).toEqual(new Set(keys(input)));
  });

  it("does not mutate the input array", () => {
    const input = [item("pda", ["pdas"]), item("am", ["account-model"])];
    const before = keys(input);
    interleaveReviewSession(input);
    expect(keys(input)).toEqual(before);
  });

  it("returns the empty session unchanged", () => {
    expect(interleaveReviewSession([])).toEqual([]);
  });

  it("defaults to the canonical REVIEW_INTERLEAVING_PAIRS", () => {
    // Sanity: the default arg is the shared vocabulary, so a known pair reorders.
    const [a, b] = REVIEW_INTERLEAVING_PAIRS[0]!;
    const input = [
      item("first", [a]),
      item("gap", ["react"]),
      item("second", [b]),
    ];
    expect(keys(interleaveReviewSession(input))).toEqual([
      "first",
      "second",
      "gap",
    ]);
  });
});
