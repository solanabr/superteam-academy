import { describe, it, expect } from "vitest";
import { CodeBlock } from "../blocks/code";

const valid = {
  type: "code" as const,
  key: "exercise",
  language: "typescript" as const,
  starter: "exercise/starter.ts",
  solution: "exercise/solution.ts",
  tests: "exercise/tests.json",
};

describe("CodeBlock", () => {
  it("accepts a typescript exercise", () => {
    expect(CodeBlock.parse(valid).language).toBe("typescript");
  });

  it("defaults buildType to standard and deployable to false", () => {
    const b = CodeBlock.parse(valid);
    expect(b.buildType).toBe("standard");
    expect(b.deployable).toBe(false);
  });

  it("requires tests to be .json, not .yaml", () => {
    // spec §4.2: expectedOutput has exact byte semantics; YAML coerces 1.0 -> 1
    expect(
      CodeBlock.safeParse({ ...valid, tests: "exercise/tests.yaml" }).success
    ).toBe(false);
  });

  it("rejects buildable on a typescript exercise", () => {
    const r = CodeBlock.safeParse({ ...valid, buildType: "buildable" });
    expect(r.success).toBe(false);
  });

  it("accepts buildable on a rust exercise", () => {
    const r = CodeBlock.safeParse({
      ...valid,
      language: "rust",
      starter: "exercise/starter.rs",
      solution: "exercise/solution.rs",
      buildType: "buildable",
    });
    expect(r.success).toBe(true);
  });

  it("rejects deployable unless buildable", () => {
    const r = CodeBlock.safeParse({
      ...valid,
      language: "rust",
      deployable: true,
    });
    expect(r.success).toBe(false);
  });

  it("accepts deployable on a buildable rust exercise, and it may produce a program", () => {
    const r = CodeBlock.parse({
      ...valid,
      language: "rust",
      starter: "s.rs",
      solution: "x.rs",
      buildType: "buildable",
      deployable: true,
      consumes: ["funded-wallet"],
      produces: "deployed-program",
    });
    expect(r.produces).toBe("deployed-program");
  });

  it("requires the starter and solution extensions to match the language", () => {
    const r = CodeBlock.safeParse({ ...valid, language: "rust" });
    expect(r.success).toBe(false); // .ts files declared as rust
  });

  it("rejects produces on a non-deployable code block", () => {
    const r = CodeBlock.safeParse({ ...valid, produces: "deployed-program" });
    expect(r.success).toBe(false); // a standard TS exercise deploys nothing
  });

  it("omits tutorNotes by default (optional, absent leaves the AI prompt unchanged)", () => {
    const b = CodeBlock.parse(valid);
    expect(b.tutorNotes).toBeUndefined();
  });

  it("accepts authored tutorNotes bullets (#592)", () => {
    const b = CodeBlock.parse({
      ...valid,
      tutorNotes: [
        "Learners often forget to await the RPC call.",
        "A common mistake is off-by-one on the loop bound.",
      ],
    });
    expect(b.tutorNotes).toHaveLength(2);
  });

  it("rejects more than six tutorNotes bullets (bounded prompt surface)", () => {
    const r = CodeBlock.safeParse({
      ...valid,
      tutorNotes: Array.from({ length: 7 }, (_, i) => `mistake ${i}`),
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty tutorNotes bullet", () => {
    const r = CodeBlock.safeParse({ ...valid, tutorNotes: [""] });
    expect(r.success).toBe(false);
  });

  it("rejects a tutorNotes bullet over 500 chars", () => {
    const r = CodeBlock.safeParse({
      ...valid,
      tutorNotes: ["x".repeat(501)],
    });
    expect(r.success).toBe(false);
  });

  it("rejects a code block producing a capability it cannot create", () => {
    const r = CodeBlock.safeParse({
      ...valid,
      language: "rust",
      starter: "s.rs",
      solution: "x.rs",
      buildType: "buildable",
      deployable: true,
      produces: "funded-wallet",
    });
    expect(r.success).toBe(false);
  });
});
