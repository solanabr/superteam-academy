import { describe, it, expect } from "vitest";
import { Block, BLOCK_REGISTRY, isGraded, isRequired } from "../blocks";

describe("Block union", () => {
  it("discriminates on `type`", () => {
    expect(Block.parse({ type: "prose", key: "i", src: "i.md" }).type).toBe(
      "prose"
    );
    expect(
      Block.parse({
        type: "quiz",
        key: "q",
        questions: [
          {
            id: "q1",
            prompt: "p",
            options: [
              { id: "a", label: "x", correct: true },
              { id: "b", label: "y", correct: false },
            ],
          },
        ],
      }).type
    ).toBe("quiz");
  });

  it("discriminates a parsons block", () => {
    expect(
      Block.parse({
        type: "parsons",
        key: "p",
        prompt: "Order the lines",
        lines: [
          { id: "a", content: "let x = 1;" },
          { id: "b", content: "return x;" },
        ],
        correctOrder: ["a", "b"],
      }).type
    ).toBe("parsons");
  });

  it("rejects an unknown block type", () => {
    expect(Block.safeParse({ type: "podcast", key: "p" }).success).toBe(false);
  });
});

describe("BLOCK_REGISTRY", () => {
  it("has an entry for every member of the union", () => {
    const types = [
      "prose",
      "video",
      "code",
      "quiz",
      "parsons",
      "openEnded",
      "wallet-funding",
      "program-explorer",
      "deployed-program-card",
    ];
    expect(Object.keys(BLOCK_REGISTRY).sort()).toEqual([...types].sort());
  });

  it("marks exactly code, quiz and parsons as graded", () => {
    const graded = Object.keys(BLOCK_REGISTRY).filter((t) =>
      isGraded(t as never)
    );
    expect(graded.sort()).toEqual(["code", "parsons", "quiz"]);
  });

  it("marks code, quiz, parsons and openEnded as required", () => {
    const required = Object.keys(BLOCK_REGISTRY).filter((t) =>
      isRequired(t as never)
    );
    expect(required.sort()).toEqual(["code", "openEnded", "parsons", "quiz"]);
  });

  it("never marks a block graded without also marking it required", () => {
    for (const [type, meta] of Object.entries(BLOCK_REGISTRY)) {
      if (meta.graded)
        expect(meta.required, `${type} is graded but not required`).toBe(true);
    }
  });
});
