import { describe, it, expect } from "vitest";
import type { BuildDiagnostic } from "@/lib/build-server/diagnostics";
import { toEditorRange } from "../diagnostic-position";
import {
  buildGradeFiles,
  HARNESS_MARKER,
  LIB_PATH,
  VERIFY_PATH,
} from "../harness";

const RULE = "// ─────────────────────────────────────────";

/** The learner's part of a lesson: editor lines 1 to 5. */
const BODY_LINES = [
  "use anchor_lang::prelude::*;",
  "",
  "pub fn ping() -> u64 {",
  "    missing_value",
  "}",
];

const HARNESS_LINES = [
  RULE,
  HARNESS_MARKER,
  "mod verify {",
  "    const PING: fn() -> u64 = super::ping;",
  "}",
];

/** What the editor holds: the learner's lines, a blank line, the harness. */
const WITH_HARNESS = [...BODY_LINES, "", ...HARNESS_LINES, ""].join("\n");
const WITHOUT_HARNESS = [...BODY_LINES, ""].join("\n");

function diagnostic(
  line: number,
  col: number,
  overrides: Partial<BuildDiagnostic> = {}
): BuildDiagnostic {
  return {
    file: LIB_PATH,
    line,
    col,
    endLine: line,
    endCol: col,
    level: "error",
    code: "E0425",
    message: "cannot find value `missing_value` in this scope",
    ...overrides,
  };
}

/** The 1-based line of `text` in the crate root the build compiles. */
function compiledLine(code: string, starter: string, text: string): number {
  const lib = new Map(buildGradeFiles(code, starter)).get(LIB_PATH) ?? "";
  const at = lib.split(/\r?\n/).indexOf(text);
  expect(at).toBeGreaterThanOrEqual(0);
  return at + 1;
}

describe("toEditorRange: a lesson with a harness", () => {
  const source = { code: WITH_HARNESS, starter: WITH_HARNESS };

  it("puts each compiled learner line on its editor line", () => {
    BODY_LINES.forEach((text, index) => {
      if (text === "") return;
      const line = compiledLine(source.code, source.starter, text);
      // The build puts lines above the learner's code, so the two differ.
      expect(line).toBeGreaterThan(index + 1);
      expect(toEditorRange(diagnostic(line, 1), source)?.line).toBe(index + 1);
    });
  });

  it("keeps the columns of a span", () => {
    const line = compiledLine(source.code, source.starter, "    missing_value");

    expect(toEditorRange(diagnostic(line, 5, { endCol: 18 }), source)).toEqual({
      line: 4,
      column: 5,
      endLine: 4,
      endColumn: 18,
    });
  });

  it("positions an entry on the first learner line", () => {
    const line = compiledLine(source.code, source.starter, BODY_LINES[0]!);

    expect(toEditorRange(diagnostic(line, 1), source)).toEqual({
      line: 1,
      column: 1,
      endLine: 1,
      endColumn: 1,
    });
  });

  it("positions an entry on the last learner line", () => {
    const line = compiledLine(source.code, source.starter, "}");

    expect(toEditorRange(diagnostic(line, 1, { endCol: 2 }), source)).toEqual({
      line: 5,
      column: 1,
      endLine: 5,
      endColumn: 2,
    });
  });

  it("gives no position to an entry above the learner's first line", () => {
    const first = compiledLine(source.code, source.starter, BODY_LINES[0]!);

    for (let line = 1; line < first; line++) {
      expect(toEditorRange(diagnostic(line, 1), source)).toBeNull();
    }
  });

  it("gives no position to an entry past the learner's last line", () => {
    const last = compiledLine(source.code, source.starter, "}");

    // The editor has text on these lines: the harness, which is not compiled
    // into the crate root.
    for (let line = last + 1; line <= last + HARNESS_LINES.length + 2; line++) {
      expect(toEditorRange(diagnostic(line, 1), source)).toBeNull();
    }
  });

  it("gives no position to an entry in the hidden verification file", () => {
    expect(
      toEditorRange(diagnostic(4, 31, { file: VERIFY_PATH }), source)
    ).toBeNull();
  });

  it("gives no position to an entry in any other file", () => {
    for (const file of ["/src/_nonce.rs", "/src/other.rs", "src/lib.rs", ""]) {
      expect(toEditorRange(diagnostic(4, 1, { file }), source)).toBeNull();
    }
  });

  it("reads the same lines from a CRLF source", () => {
    const crlf = {
      code: WITH_HARNESS.replace(/\n/g, "\r\n"),
      starter: WITH_HARNESS,
    };
    const line = compiledLine(crlf.code, crlf.starter, "    missing_value");

    expect(toEditorRange(diagnostic(line, 5, { endCol: 18 }), crlf)).toEqual({
      line: 4,
      column: 5,
      endLine: 4,
      endColumn: 18,
    });
    expect(toEditorRange(diagnostic(line + 2, 1), crlf)).toBeNull();
  });

  it("uses the harness region of the submission, not the starter's length", () => {
    // The learner added two lines, so their code ends lower than the starter's.
    const longer = [
      ...BODY_LINES,
      "",
      "pub fn pong() {}",
      "",
      ...HARNESS_LINES,
      "",
    ].join("\n");
    const grown = { code: longer, starter: WITH_HARNESS };
    const line = compiledLine(grown.code, grown.starter, "pub fn pong() {}");

    expect(toEditorRange(diagnostic(line, 8), grown)?.line).toBe(7);
    expect(toEditorRange(diagnostic(line + 1, 1), grown)).toBeNull();
  });

  it("covers the whole submission when the learner removed the harness", () => {
    const bare = { code: WITHOUT_HARNESS, starter: WITH_HARNESS };
    const line = compiledLine(bare.code, bare.starter, "}");

    expect(toEditorRange(diagnostic(line, 1), bare)?.line).toBe(5);
    expect(toEditorRange(diagnostic(line + 1, 1), bare)).toBeNull();
  });
});

describe("toEditorRange: a lesson without a harness", () => {
  const source = { code: WITHOUT_HARNESS, starter: WITHOUT_HARNESS };

  it("keeps the compiler's line", () => {
    expect(toEditorRange(diagnostic(1, 1), source)?.line).toBe(1);
    expect(toEditorRange(diagnostic(4, 5, { endCol: 18 }), source)).toEqual({
      line: 4,
      column: 5,
      endLine: 4,
      endColumn: 18,
    });
    expect(toEditorRange(diagnostic(5, 1), source)?.line).toBe(5);
  });

  it("keeps the compiler's line in a CRLF source", () => {
    const crlf = {
      code: WITHOUT_HARNESS.replace(/\n/g, "\r\n"),
      starter: WITHOUT_HARNESS,
    };

    expect(toEditorRange(diagnostic(4, 5, { endCol: 18 }), crlf)).toEqual({
      line: 4,
      column: 5,
      endLine: 4,
      endColumn: 18,
    });
  });

  it("gives no position past the end of the source", () => {
    // Line 6 is the empty line after the final line break.
    expect(toEditorRange(diagnostic(6, 1), source)?.line).toBe(6);
    expect(toEditorRange(diagnostic(7, 1), source)).toBeNull();
  });

  it("gives no position to an entry in another file", () => {
    expect(
      toEditorRange(diagnostic(1, 1, { file: VERIFY_PATH }), source)
    ).toBeNull();
  });
});

describe("toEditorRange: columns", () => {
  it("counts a character outside the BMP as two editor columns", () => {
    const code = 'let s = "\u{1F600}"; missing_value\n';
    // The compiler counts the emoji as one character: `missing_value` starts
    // at character column 14 and ends before 27.
    expect(
      toEditorRange(diagnostic(1, 14, { endCol: 27 }), { code, starter: code })
    ).toEqual({ line: 1, column: 15, endLine: 1, endColumn: 28 });
  });

  it("stops a column at the end of the line", () => {
    const code = "short\n";

    expect(
      toEditorRange(diagnostic(1, 3, { endCol: 80 }), { code, starter: code })
    ).toEqual({ line: 1, column: 3, endLine: 1, endColumn: 6 });
    expect(
      toEditorRange(diagnostic(1, 90, { endCol: 95 }), { code, starter: code })
    ).toEqual({ line: 1, column: 6, endLine: 1, endColumn: 6 });
  });

  it("maps a span over several lines", () => {
    const source = { code: WITHOUT_HARNESS, starter: WITHOUT_HARNESS };

    expect(
      toEditorRange(diagnostic(3, 1, { endLine: 5, endCol: 2 }), source)
    ).toEqual({ line: 3, column: 1, endLine: 5, endColumn: 2 });
  });

  it("ends a span at its start when the end is past the learner's lines", () => {
    const source = { code: WITH_HARNESS, starter: WITH_HARNESS };
    const line = compiledLine(source.code, source.starter, "}");

    expect(
      toEditorRange(
        diagnostic(line, 1, { endLine: line + 4, endCol: 2 }),
        source
      )
    ).toEqual({ line: 5, column: 1, endLine: 5, endColumn: 1 });
  });
});
