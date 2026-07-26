import { describe, it, expect } from "vitest";
import { ParsonsBlock } from "../blocks/parsons";

const p = (over: Record<string, unknown> = {}) => ({
  type: "parsons" as const,
  key: "arrange",
  prompt: "Arrange the lines into a working function.",
  lines: [
    { id: "sig", content: "function add(a, b) {" },
    { id: "ret", content: "  return a + b;" },
    { id: "close", content: "}" },
  ],
  correctOrder: ["sig", "ret", "close"],
  ...over,
});

describe("ParsonsBlock", () => {
  it("accepts a well-formed ordering block", () => {
    const b = ParsonsBlock.parse(p());
    expect(b.correctOrder).toEqual(["sig", "ret", "close"]);
    // `distractor` defaults to false when omitted.
    expect(b.lines[0]!.distractor).toBe(false);
  });

  it("keeps the explanation channel", () => {
    const b = ParsonsBlock.parse(p({ explanation: "Signature, body, brace." }));
    expect(b.explanation).toBe("Signature, body, brace.");
  });

  it("accepts a distractor excluded from correctOrder", () => {
    const b = ParsonsBlock.parse(
      p({
        lines: [
          { id: "sig", content: "function add(a, b) {" },
          { id: "ret", content: "  return a + b;" },
          { id: "close", content: "}" },
          { id: "bad", content: "  return a - b;", distractor: true },
        ],
      })
    );
    expect(b.lines.find((l) => l.id === "bad")!.distractor).toBe(true);
  });

  it("accepts a distractor paired with its correct line", () => {
    const ok = ParsonsBlock.safeParse(
      p({
        lines: [
          { id: "sig", content: "function add(a, b) {" },
          { id: "ret", content: "  return a + b;" },
          { id: "close", content: "}" },
          {
            id: "bad",
            content: "  return a - b;",
            distractor: true,
            pairedWith: "ret",
          },
        ],
      })
    );
    expect(ok.success).toBe(true);
  });

  it("rejects fewer than two lines", () => {
    const bad = p({
      lines: [{ id: "only", content: "x" }],
      correctOrder: ["only"],
    });
    expect(ParsonsBlock.safeParse(bad).success).toBe(false);
  });

  it("rejects duplicate line ids", () => {
    const bad = p({
      lines: [
        { id: "sig", content: "a" },
        { id: "sig", content: "b" },
      ],
      correctOrder: ["sig"],
    });
    expect(ParsonsBlock.safeParse(bad).success).toBe(false);
  });

  it("rejects a repeated id in correctOrder", () => {
    expect(
      ParsonsBlock.safeParse(p({ correctOrder: ["sig", "sig", "close"] }))
        .success
    ).toBe(false);
  });

  it("rejects a correctOrder that references a distractor", () => {
    const bad = p({
      lines: [
        { id: "sig", content: "function add(a, b) {" },
        { id: "ret", content: "  return a + b;" },
        { id: "bad", content: "  return a - b;", distractor: true },
      ],
      correctOrder: ["sig", "ret", "bad"],
    });
    expect(ParsonsBlock.safeParse(bad).success).toBe(false);
  });

  it("rejects a correctOrder missing a non-distractor line", () => {
    // `close` is a solution line but absent from correctOrder.
    expect(
      ParsonsBlock.safeParse(p({ correctOrder: ["sig", "ret"] })).success
    ).toBe(false);
  });

  it("rejects a correctOrder id that matches no line", () => {
    expect(
      ParsonsBlock.safeParse(p({ correctOrder: ["sig", "ret", "ghost"] }))
        .success
    ).toBe(false);
  });

  it("rejects pairedWith on a non-distractor line", () => {
    const bad = p({
      lines: [
        { id: "sig", content: "function add(a, b) {", pairedWith: "ret" },
        { id: "ret", content: "  return a + b;" },
        { id: "close", content: "}" },
      ],
    });
    expect(ParsonsBlock.safeParse(bad).success).toBe(false);
  });

  it("rejects pairedWith referencing a distractor", () => {
    const bad = p({
      lines: [
        { id: "sig", content: "function add(a, b) {" },
        { id: "ret", content: "  return a + b;" },
        { id: "close", content: "}" },
        { id: "d1", content: "x", distractor: true, pairedWith: "d2" },
        { id: "d2", content: "y", distractor: true },
      ],
    });
    expect(ParsonsBlock.safeParse(bad).success).toBe(false);
  });
});
