import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { lessonsById } from "@/lib/content/store";
import { HARNESS_MARKER, splitHarness, withCanonicalHarness } from "../harness";

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

describe("withCanonicalHarness", () => {
  it("re-attaches the harness a learner deleted", () => {
    const spliced = withCanonicalHarness("pub fn nothing() {}", STARTER);
    expect(spliced).toContain("pub fn nothing() {}");
    expect(spliced).toContain("first_program::ping");
  });

  it("replaces a harness the learner edited into a no-op", () => {
    const tampered = `pub fn nothing() {}\n${RULE}\n${HARNESS_MARKER}\n// nothing here\n`;
    const spliced = withCanonicalHarness(tampered, STARTER);
    expect(spliced).not.toContain("// nothing here");
    expect(spliced).toContain("first_program::ping");
  });

  it("collapses a duplicated harness back to exactly one", () => {
    const spliced = withCanonicalHarness(`${STARTER}\n${HARNESS}`, STARTER);
    expect(spliced.split(HARNESS_MARKER)).toHaveLength(2);
  });

  it("leaves an untouched submission's own harness in place, once", () => {
    const spliced = withCanonicalHarness(STARTER, STARTER);
    expect(spliced.split(HARNESS_MARKER)).toHaveLength(2);
    expect(spliced).toContain("// TODO: add `ping`.");
  });

  it("returns the submission unchanged when the starter has no harness", () => {
    expect(withCanonicalHarness("pub fn nothing() {}", "fn main() {}")).toBe(
      "pub fn nothing() {}"
    );
  });

  it("normalises CRLF submissions", () => {
    const crlf = "pub fn nothing() {}\r\n";
    expect(withCanonicalHarness(crlf, STARTER)).not.toContain("\r");
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
  it("splices ping/Ping back into a `pub fn nothing() {}` submission", () => {
    const spliced = withCanonicalHarness(
      "pub fn nothing() {}",
      buildableStarter("lesson-b2s-your-first-solana-program")
    );
    // Both symbols the deleted exercise had to define — the spliced source
    // cannot compile without them.
    expect(spliced).toContain("first_program::ping");
    expect(spliced).toContain("Ping {}");
  });

  it("splices the bump type-check back into an emptied vault submission", () => {
    const spliced = withCanonicalHarness(
      "pub fn nothing() {}",
      buildableStarter("lesson-b2s-an-anchor-vault")
    );
    expect(spliced).toContain("s.vault_bump");
    expect(spliced).toContain("s.state_bump");
  });

  it("every live buildable starter carries the marker", () => {
    const blocks = buildableBlocks();
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect(splitHarness(b.starter ?? "").harness).not.toBe("");
    }
  });
});
