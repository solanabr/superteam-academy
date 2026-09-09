import { afterEach, describe, expect, it } from "vitest";
import { runLint } from "../lint";
import type { Diagnostic } from "../diagnostics";
import { hasToolchain, resetToolchainProbe } from "../rust-oracle";
import {
  LIB_PATH,
  VERIFY_PATH,
  buildGradeFiles,
  splitHarness,
} from "../harness";
import "../checks/gate1-schema";
import "../checks/gate6-executor";
import { makeTempRepo } from "./helpers";

const course = `id: course-x
slug: x
title: X
difficulty: beginner
duration: 1
sourceLocale: en
xpPerLesson: 10
xpReward: 100
modules: [{ key: m, title: M, lessons: [lesson-a] }]
`;

const lessonYaml = `id: lesson-a
slug: a
title: A
skills: [general]
blocks:
  - key: program
    type: code
    language: rust
    buildType: buildable
    starter: program/starter.rs
    solution: program/solution.rs
    tests: program/tests.json
`;

const HARNESS = `
// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION HARNESS — DO NOT EDIT ANYTHING BELOW THIS LINE.
// ─────────────────────────────────────────────────────────────────────────────
#[allow(dead_code)]
mod verify {
    const PING: fn() = super::ping;
}
`;

/** No `ping` yet, so the harness fails to resolve it. */
const STARTER = `// TODO: add a public \`ping\` function.\n${HARNESS}`;
const SOLUTION = `pub fn ping() {}\n`;
/** Compiles on its own, but not with the harness spliced back on. */
const WRONG_SOLUTION = `pub fn pong() {}\n`;

function tree(starter: string, solution: string): Record<string, string> {
  return {
    "courses/x/course.yaml": course,
    "courses/x/lessons/a/lesson.yaml": lessonYaml,
    "courses/x/lessons/a/program/starter.rs": starter,
    "courses/x/lessons/a/program/solution.rs": solution,
    "courses/x/lessons/a/program/tests.json":
      '[{ "id": "t1", "input": "", "expectedOutput": "ok" }]',
  };
}

function errors(diagnostics: Diagnostic[]): Diagnostic[] {
  return diagnostics.filter(
    (d) => d.gate === "gate-6" && d.severity === "error"
  );
}

function errorMatching(diagnostics: Diagnostic[], re: RegExp): boolean {
  return errors(diagnostics).some((d) => re.test(d.message));
}

describe("gate 6 — grade files (pure)", () => {
  it("keeps the harness region from the rule line down", () => {
    const { body, harness } = splitHarness(STARTER);
    expect(body.trim()).toBe("// TODO: add a public `ping` function.");
    expect(harness).toContain("const PING: fn() = super::ping;");
  });

  it("puts the starter's harness in its own module file, not appended", () => {
    const files = buildGradeFiles("pub fn ping() {}", STARTER);
    expect(files.map(([p]) => p)).toEqual([LIB_PATH, VERIFY_PATH]);

    const lib = files[0]![1];
    expect(lib).toContain("mod _verify;");
    expect(lib).toContain("pub fn ping() {}");
    expect(lib).not.toContain("const PING: fn() = super::ping;");
    // The declaration must lead, or a trailing attribute in the body could
    // bind to it and switch the harness off.
    expect(lib.indexOf("mod _verify;")).toBeLessThan(
      lib.indexOf("pub fn ping")
    );

    const verify = files[1]![1];
    expect(verify.startsWith("use super::*;")).toBe(true);
    expect(verify).toContain("const PING: fn() = super::ping;");
  });

  it("compiles a harness-less starter as a lone lib.rs", () => {
    expect(buildGradeFiles(SOLUTION, "pub fn ping() {}")).toEqual([
      [LIB_PATH, SOLUTION],
    ]);
  });

  it("strips a harness the submission carries before splicing the canonical one", () => {
    const tampered = `pub fn ping() {}\n${HARNESS.replace("super::ping", "super::nope")}`;
    const [, [, verify]] = buildGradeFiles(tampered, STARTER) as [
      [string, string],
      [string, string],
    ];
    expect(verify).toContain("const PING: fn() = super::ping;");
    expect(verify).not.toContain("super::nope");
  });
});

describe("gate 6 — rust oracle without a toolchain", () => {
  const realPath = process.env.PATH;
  afterEach(() => {
    process.env.CONTENT_LINT_RUST_ORACLE = "off";
    process.env.PATH = realPath;
    resetToolchainProbe();
  });

  it("defers with a notice that names the missing toolchain", async () => {
    process.env.CONTENT_LINT_RUST_ORACLE = "auto";
    process.env.PATH = "/nonexistent";
    resetToolchainProbe();
    const r = await runLint(makeTempRepo(tree(STARTER, SOLUTION)));
    expect(errors(r.diagnostics)).toEqual([]);
    const notice = r.diagnostics.find(
      (d) => d.gate === "gate-6" && d.severity === "notice"
    );
    expect(notice?.message).toMatch(/DEFERRED to runtime grading/);
    expect(notice?.message).toMatch(/cargo-build-sbf not found/);
  });

  it("errors instead of deferring when the oracle is required", async () => {
    process.env.CONTENT_LINT_RUST_ORACLE = "require";
    process.env.PATH = "/nonexistent";
    resetToolchainProbe();
    const r = await runLint(makeTempRepo(tree(STARTER, SOLUTION)));
    expect(errorMatching(r.diagnostics, /cargo-build-sbf is not on PATH/)).toBe(
      true
    );
  });
});

// The real thing: minutes on a cold dependency tree, seconds once the shared
// CARGO_TARGET_DIR is warm. Skipped where the Solana toolchain is absent.
const realBuild = hasToolchain() ? describe : describe.skip;

realBuild("gate 6 — rust oracle against the real toolchain", () => {
  afterEach(() => {
    process.env.CONTENT_LINT_RUST_ORACLE = "off";
  });

  it("passes when the starter fails and the solution compiles", async () => {
    process.env.CONTENT_LINT_RUST_ORACLE = "require";
    const r = await runLint(makeTempRepo(tree(STARTER, SOLUTION)));
    expect(errors(r.diagnostics)).toEqual([]);
  }, 900_000);

  it("errors when the solution does not compile with the harness", async () => {
    process.env.CONTENT_LINT_RUST_ORACLE = "require";
    const r = await runLint(makeTempRepo(tree(STARTER, WRONG_SOLUTION)));
    expect(errorMatching(r.diagnostics, /solution does NOT compile/)).toBe(
      true
    );
  }, 900_000);

  it("errors when the starter already compiles", async () => {
    process.env.CONTENT_LINT_RUST_ORACLE = "require";
    const r = await runLint(makeTempRepo(tree(SOLUTION + HARNESS, SOLUTION)));
    expect(errorMatching(r.diagnostics, /starter already compiles/)).toBe(true);
  }, 900_000);

  it("reports a timeout as an error rather than hanging", async () => {
    process.env.CONTENT_LINT_RUST_ORACLE = "require";
    process.env.CONTENT_LINT_RUST_TIMEOUT_MS = "1";
    try {
      const r = await runLint(makeTempRepo(tree(STARTER, SOLUTION)));
      expect(errorMatching(r.diagnostics, /timed out/)).toBe(true);
    } finally {
      delete process.env.CONTENT_LINT_RUST_TIMEOUT_MS;
    }
  }, 900_000);
});
