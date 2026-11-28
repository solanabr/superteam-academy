// What the tutor is told about a failed build.
import { describe, it, expect } from "vitest";
import { MAX_BUILD_OUTPUT_CHARS } from "@/lib/ai/partner-types";
import { buildOutputText, listedErrors } from "../build-output";
import type { EditorMarker, ExecutionResult } from "../types";

/** Stands in for a line of the hidden verification file. */
const HIDDEN = "HIDDEN_VERIFY_LINE";

const LOG = [
  "error[E0425]: cannot find function `ping` in this scope",
  "  --> src/_verify.rs:12:22",
  `12 |     const PING: fn() -> u64 = super::ping; // ${HIDDEN}`,
].join("\n");

function marker(line: number, overrides: Partial<EditorMarker> = {}) {
  return {
    line,
    column: 5,
    endLine: line,
    endColumn: 9,
    severity: "error",
    code: null,
    message: `error on line ${line}`,
    ...overrides,
  } satisfies EditorMarker;
}

function failedBuild(extra: Partial<ExecutionResult> = {}): ExecutionResult {
  return { success: false, output: "", error: LOG, ...extra };
}

const row = (m: EditorMarker) => `Line ${m.line}: ${m.message}`;

describe("listedErrors", () => {
  it("gives at most three errors and no warnings, in order", () => {
    const result = failedBuild({
      markers: [
        marker(1),
        marker(2, { severity: "warning" }),
        marker(3),
        marker(4),
        marker(5),
      ],
    });

    expect(listedErrors(result).map((m) => m.line)).toEqual([1, 3, 4]);
  });

  it("gives nothing for a run that passed or did not happen", () => {
    expect(listedErrors(null)).toEqual([]);
    expect(
      listedErrors({ success: true, output: "", markers: [marker(1)] })
    ).toEqual([]);
  });
});

describe("buildOutputText", () => {
  it("is the listed rows, one per line", () => {
    const result = failedBuild({
      markers: [marker(4), marker(9), marker(11), marker(12)],
    });

    expect(buildOutputText(result, row)).toBe(
      [
        "Line 4: error on line 4",
        "Line 9: error on line 9",
        "Line 11: error on line 11",
      ].join("\n")
    );
  });

  it("adds the sentence that stands in for a hidden-file error", () => {
    const result = failedBuild({
      markers: [marker(4)],
      harnessNotice: "The harness could not find: ping",
    });

    expect(buildOutputText(result, row)).toBe(
      "The harness could not find: ping\nLine 4: error on line 4"
    );
  });

  it("is that sentence alone when no error has a place in the editor", () => {
    const result = failedBuild({
      harnessNotice: "The harness could not find: ping",
    });

    expect(buildOutputText(result, row)).toBe(
      "The harness could not find: ping"
    );
  });

  it("never takes text from the compiler log", () => {
    const result = failedBuild({
      markers: [marker(4)],
      harnessNotice: "The harness could not find: ping",
      testResults: [
        {
          testCase: {
            id: "t1",
            description: "d",
            input: "",
            expectedOutput: "",
          },
          passed: false,
          actualOutput: HIDDEN,
          error: HIDDEN,
        },
      ],
    });

    expect(result.error).toContain(HIDDEN);
    expect(buildOutputText(result, row)).not.toContain(HIDDEN);
    expect(buildOutputText(result, row)).not.toContain("_verify.rs");
  });

  it("is empty for a failed run with nothing to show from a build", () => {
    // A failed test run, or a build whose errors have no place in the editor.
    expect(buildOutputText(failedBuild(), row)).toBe("");
    expect(
      buildOutputText(
        failedBuild({ markers: [marker(2, { severity: "warning" })] }),
        row
      )
    ).toBe("");
  });

  it("is empty when the last run passed or there was none", () => {
    expect(buildOutputText(null, row)).toBe("");
    expect(
      buildOutputText(
        {
          success: true,
          output: "ok",
          markers: [marker(1)],
          harnessNotice: "x",
        },
        row
      )
    ).toBe("");
  });

  it("stops at the length the route accepts", () => {
    const result = failedBuild({
      markers: [marker(1), marker(2), marker(3)],
      harnessNotice: "x".repeat(MAX_BUILD_OUTPUT_CHARS),
    });

    expect(buildOutputText(result, row)).toHaveLength(MAX_BUILD_OUTPUT_CHARS);
  });
});
