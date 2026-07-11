import { describe, it, expect } from "vitest";
import { gateCodeBlock, type GraderSet } from "../executor-gate";

const tests = [{ id: "t1", description: "d", input: "", expectedOutput: "42" }];

// Fake graders: a submission "passes" iff it equals the string "SOLUTION".
const graders: GraderSet = {
  js: async (code) => ({ passed: code.trim() === "SOLUTION", failures: [] }),
  rust: async (code) => ({ passed: code.trim() === "SOLUTION", failures: [] }),
  buildable: async (code) => ({
    passed: code.trim() === "SOLUTION",
    failures: [],
  }),
};

const files = (starter: string, solution: string) => ({
  starter,
  solution,
  tests,
});

describe("gateCodeBlock", () => {
  it("passes when the solution passes and the starter fails", async () => {
    const block = {
      key: "ex",
      type: "code",
      language: "typescript" as const,
      buildType: "standard" as const,
    };
    const issues = await gateCodeBlock(
      block,
      files("STARTER", "SOLUTION"),
      graders
    );
    expect(issues).toEqual([]);
  });

  it("rejects when the reference solution does NOT pass its own tests", async () => {
    const block = {
      key: "ex",
      type: "code",
      language: "typescript" as const,
      buildType: "standard" as const,
    };
    const issues = await gateCodeBlock(
      block,
      files("STARTER", "BROKEN"),
      graders
    );
    expect(issues.join(" ")).toContain("solution does not pass");
  });

  it("rejects when the starter already passes (nothing to solve)", async () => {
    const block = {
      key: "ex",
      type: "code",
      language: "typescript" as const,
      buildType: "standard" as const,
    };
    const issues = await gateCodeBlock(
      block,
      files("SOLUTION", "SOLUTION"),
      graders
    );
    expect(issues.join(" ")).toContain("starter already passes");
  });

  it("routes a rust standard block to the rust grader", async () => {
    let used = "";
    const spy: GraderSet = {
      ...graders,
      rust: async (c) => (
        (used = "rust"),
        { passed: c.trim() === "SOLUTION", failures: [] }
      ),
    };
    const block = {
      key: "ex",
      type: "code",
      language: "rust" as const,
      buildType: "standard" as const,
    };
    await gateCodeBlock(block, files("STARTER", "SOLUTION"), spy);
    expect(used).toBe("rust");
  });

  it("routes a buildable block to the buildable grader", async () => {
    let used = "";
    const spy: GraderSet = {
      ...graders,
      buildable: async (c) => (
        (used = "buildable"),
        { passed: c.trim() === "SOLUTION", failures: [] }
      ),
    };
    const block = {
      key: "ex",
      type: "code",
      language: "rust" as const,
      buildType: "buildable" as const,
    };
    await gateCodeBlock(block, files("STARTER", "SOLUTION"), spy);
    expect(used).toBe("buildable");
  });
});
