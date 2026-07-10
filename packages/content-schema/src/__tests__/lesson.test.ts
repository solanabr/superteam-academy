import { describe, it, expect } from "vitest";
import { Lesson } from "../lesson";

const base = {
  id: "lesson-accounts",
  slug: "accounts",
  title: "Accounts",
  blocks: [{ type: "prose", key: "intro", src: "intro.md" }],
};

describe("Lesson", () => {
  it("accepts a prose-only lesson", () => {
    expect(Lesson.parse(base).blocks).toHaveLength(1);
  });

  it("rejects duplicate block keys", () => {
    const bad = {
      ...base,
      blocks: [
        { type: "prose", key: "intro", src: "a.md" },
        { type: "prose", key: "intro", src: "b.md" },
      ],
    };
    expect(Lesson.safeParse(bad).success).toBe(false);
  });

  it("requires at least one block", () => {
    expect(Lesson.safeParse({ ...base, blocks: [] }).success).toBe(false);
  });

  it("has no xpReward field — XP is course.xpPerLesson", () => {
    const parsed = Lesson.parse({ ...base, xpReward: 50 });
    expect("xpReward" in parsed).toBe(false);
  });

  it("accepts a consumes with no in-lesson producer (the producer may be an earlier lesson)", () => {
    // Cross-lesson/course ordering by DISPLAY order is checked by the linter
    // (Plan 2), not here — within a single lesson a dangling consumes is legal.
    const ok = {
      ...base,
      blocks: [
        {
          type: "deployed-program-card",
          key: "card",
          consumes: ["deployed-program"],
        },
      ],
    };
    expect(Lesson.safeParse(ok).success).toBe(true);
  });
});
