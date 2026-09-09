import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { lessonsById } from "@/lib/content/store";
import {
  buildGradeFiles,
  HARNESS_MARKER,
  LIB_PATH,
  splitHarness,
  VERIFY_PATH,
} from "../harness";

/** The two graded files, keyed by path. */
function graded(submission: string, starter: string) {
  const files = new Map(buildGradeFiles(submission, starter));
  return {
    files,
    lib: files.get(LIB_PATH) ?? "",
    verify: files.get(VERIFY_PATH) ?? "",
  };
}

const RULE = "// ─────────────────────────────────────────";
const STARTER = [
  "use anchor_lang::prelude::*;",
  "",
  "// TODO: add `ping`.",
  "",
  RULE,
  HARNESS_MARKER,
  "// A type check.",
  RULE,
  "mod verify {",
  "    const PING: fn() = first_program::ping;",
  "}",
  "",
].join("\n");

const HARNESS = splitHarness(STARTER).harness;

describe("splitHarness", () => {
  it("splits at the marker and keeps the rule line with the harness", () => {
    const { body, harness } = splitHarness(STARTER);
    expect(body).toBe("use anchor_lang::prelude::*;\n\n// TODO: add `ping`.\n");
    expect(harness.startsWith(RULE)).toBe(true);
    expect(harness).toContain("first_program::ping");
  });

  it("treats a source without the marker as all body", () => {
    expect(splitHarness("pub fn nothing() {}")).toEqual({
      body: "pub fn nothing() {}",
      harness: "",
    });
  });

  it("splits at the FIRST marker when the harness is duplicated", () => {
    const dup = `${STARTER}\n${HARNESS}`;
    expect(splitHarness(dup).body).not.toContain(HARNESS_MARKER);
    expect(splitHarness(dup).harness.split(HARNESS_MARKER)).toHaveLength(3);
  });

  it("is insensitive to CRLF line endings", () => {
    const crlf = STARTER.replace(/\n/g, "\r\n");
    expect(splitHarness(crlf)).toEqual(splitHarness(STARTER));
  });
});

describe("buildGradeFiles", () => {
  it("puts the harness in its own module file, never in lib.rs", () => {
    const { files, lib, verify } = graded("pub fn nothing() {}", STARTER);
    expect([...files.keys()]).toEqual([LIB_PATH, VERIFY_PATH]);
    expect(lib).toContain("pub fn nothing() {}");
    expect(lib).not.toContain(HARNESS_MARKER);
    expect(verify).toContain("first_program::ping");
  });

  it("declares the harness module ABOVE the learner's body", () => {
    const { lib } = graded("pub fn nothing() {}", STARTER);
    expect(lib.startsWith("#[allow(dead_code)]\nmod _verify;\n")).toBe(true);
    expect(lib.indexOf("mod _verify;")).toBeLessThan(
      lib.indexOf("pub fn nothing() {}")
    );
  });

  it("leaves a trailing attribute dangling at EOF, not on the harness", () => {
    // Bypass 1: `#[cfg(any())]` with nothing after it used to bind to the
    // appended `mod verify` and delete it. Nothing follows it now.
    const { lib } = graded("pub fn nothing() {}\n\n#[cfg(any())]\n", STARTER);
    expect(lib.trimEnd().endsWith("#[cfg(any())]")).toBe(true);
    expect(lib).not.toContain("first_program::ping");
  });

  it("pushes a crate-level inner attribute below an item (a hard error)", () => {
    // Bypass 2: `#![cfg(any())]` as line 1 stripped the whole crate. With the
    // module declaration first, rustc rejects it outright.
    const { lib } = graded("#![cfg(any())]\npub fn nothing() {}\n", STARTER);
    expect(lib.indexOf("mod _verify;")).toBeLessThan(
      lib.indexOf("#![cfg(any())]")
    );
  });

  it("replaces a harness the learner edited into a no-op", () => {
    const tampered = `pub fn nothing() {}\n${RULE}\n${HARNESS_MARKER}\n// nothing here\n`;
    const { lib, verify } = graded(tampered, STARTER);
    expect(lib).not.toContain("// nothing here");
    expect(verify).toContain("first_program::ping");
  });

  it("strips a duplicated harness whole", () => {
    const { lib, verify } = graded(`${STARTER}\n${HARNESS}`, STARTER);
    expect(lib).not.toContain(HARNESS_MARKER);
    expect(verify.split(HARNESS_MARKER)).toHaveLength(2);
  });

  it("keeps an untouched submission's own body, harness moved out", () => {
    const { lib } = graded(STARTER, STARTER);
    expect(lib).toContain("// TODO: add `ping`.");
    expect(lib).not.toContain(HARNESS_MARKER);
  });

  it("returns a lone lib.rs when the starter has no harness", () => {
    expect(buildGradeFiles("pub fn nothing() {}", "fn main() {}")).toEqual([
      [LIB_PATH, "pub fn nothing() {}"],
    ]);
  });

  it("normalises CRLF submissions", () => {
    const { lib } = graded("pub fn nothing() {}\r\n", STARTER);
    expect(lib).not.toContain("\r");
  });
});

// --- The exploit, against real content ---------------------------------------

interface CodeBlock {
  _type: string;
  buildType?: string | null;
  starter?: string;
}

/** Every buildable code block in the live content bundle. */
function buildableBlocks(): CodeBlock[] {
  return [...lessonsById.values()].flatMap((lesson) =>
    (lesson.blocks as CodeBlock[]).filter(
      (b) => b._type === "code" && b.buildType === "buildable"
    )
  );
}

function buildableStarter(lessonId: string): string {
  const lesson = lessonsById.get(lessonId);
  const block = (lesson?.blocks as CodeBlock[] | undefined)?.find(
    (b) => b._type === "code" && b.buildType === "buildable"
  );
  if (!block?.starter) throw new Error(`no buildable block in ${lessonId}`);
  return block.starter;
}

describe("the empty-submission exploit is closed", () => {
  it("compiles ping/Ping against a `pub fn nothing() {}` submission", () => {
    const { verify } = graded(
      "pub fn nothing() {}",
      buildableStarter("lesson-b2s-your-first-solana-program")
    );
    // Both symbols the deleted exercise had to define — the graded crate
    // cannot compile without them.
    expect(verify).toContain("first_program::ping");
    expect(verify).toContain("Ping {}");
  });

  it("compiles the bump type-check against an emptied vault submission", () => {
    const { verify } = graded(
      "pub fn nothing() {}",
      buildableStarter("lesson-b2s-an-anchor-vault")
    );
    expect(verify).toContain("s.vault_bump");
    expect(verify).toContain("s.state_bump");
  });

  it("every live buildable starter carries the marker", () => {
    const blocks = buildableBlocks();
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect(splitHarness(b.starter ?? "").harness).not.toBe("");
    }
  });
});
