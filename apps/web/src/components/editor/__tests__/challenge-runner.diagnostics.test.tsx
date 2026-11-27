// @vitest-environment jsdom
// What a build's compiler diagnostics become in the run result: positions in
// the learner's editor, and nothing for a file the learner cannot see.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import type { BuildDiagnostic } from "@/lib/build-server/diagnostics";
import { HARNESS_MARKER, LIB_PATH, VERIFY_PATH } from "@/lib/challenge/harness";
import { ChallengeRunner } from "../challenge-runner";
import type { ExecutionResult } from "../types";

const h = vi.hoisted(() => ({ buildProgram: vi.fn() }));

vi.mock("@/lib/build-server/client", () => ({ buildProgram: h.buildProgram }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));

/** Editor lines 1 to 5 are the learner's; the harness starts on line 7. */
const CODE = [
  "use anchor_lang::prelude::*;",
  'declare_id!("Fg6");',
  "pub fn ping() -> u64 {",
  "    missing_value",
  "}",
  "",
  "// ─────",
  HARNESS_MARKER,
  "mod verify {",
  "    const PING: fn() -> u64 = super::ping;",
  "}",
  "",
].join("\n");

const NO_HARNESS = CODE.split("\n").slice(0, 5).join("\n") + "\n";

const tests: TestCase[] = [
  {
    id: "t1",
    description: "Program compiles successfully",
    input: "",
    expectedOutput: "true",
  },
  {
    id: "t2",
    description: "Defines ping",
    input: "",
    expectedOutput: "true",
  },
];

const LIB_ERROR_LOG = [
  "error[E0425]: cannot find value `missing_value` in this scope",
  " --> src/lib.rs:7:5",
].join("\n");

const HARNESS_ERROR_LOG = [
  "error[E0425]: cannot find function `ping` in this scope",
  "  --> src/_verify.rs:4:38",
].join("\n");

function entry(overrides: Partial<BuildDiagnostic>): BuildDiagnostic {
  return {
    file: LIB_PATH,
    line: 7,
    col: 5,
    endLine: 7,
    endCol: 18,
    level: "error",
    code: "E0425",
    message: "cannot find value `missing_value` in this scope",
    ...overrides,
  };
}

async function run(
  answer: Record<string, unknown>,
  { code = CODE, starter = CODE }: { code?: string; starter?: string } = {}
): Promise<ExecutionResult> {
  h.buildProgram.mockResolvedValue(answer);
  const onResult = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeRunner
        getCode={() => code}
        starter={starter}
        tests={tests}
        language="rust"
        buildType="buildable"
        onResult={onResult}
        onSubmit={() => {}}
        isComplete={false}
        xpReward={50}
      />
    </NextIntlClientProvider>
  );

  fireEvent.click(screen.getByRole("button", { name: "Build" }));
  await waitFor(() => expect(onResult).toHaveBeenCalled());
  return onResult.mock.calls[0]![0] as ExecutionResult;
}

function sentLib(): string {
  const { files } = h.buildProgram.mock.calls[0]![0] as {
    files: { path: string; content: string }[];
  };
  return files.find((f) => f.path === LIB_PATH)?.content ?? "";
}

beforeEach(() => {
  h.buildProgram.mockReset();
});

describe("ChallengeRunner build diagnostics", () => {
  it("puts an error in the crate root on the learner's editor line", async () => {
    const result = await run({
      success: false,
      stderr: LIB_ERROR_LOG,
      uuid: null,
      diagnostics: [entry({})],
    });

    // The sent file has that text on line 7; the editor has it on line 4.
    expect(sentLib().split("\n")[6]).toBe("    missing_value");
    expect(result.markers).toEqual([
      {
        line: 4,
        column: 5,
        endLine: 4,
        endColumn: 18,
        severity: "error",
        code: "E0425",
        message: "cannot find value `missing_value` in this scope",
      },
    ]);
  });

  it("keeps the compiler's line in a lesson without a harness", async () => {
    const result = await run(
      {
        success: false,
        stderr: LIB_ERROR_LOG,
        uuid: null,
        diagnostics: [entry({ line: 4, endLine: 4 })],
      },
      { code: NO_HARNESS, starter: NO_HARNESS }
    );

    expect(sentLib().split("\n")[3]).toBe("    missing_value");
    expect(result.markers?.[0]).toMatchObject({ line: 4, column: 5 });
  });

  it("keeps the order of the list and the level of each entry", async () => {
    const result = await run({
      success: false,
      stderr: LIB_ERROR_LOG,
      uuid: null,
      diagnostics: [
        entry({}),
        entry({ line: 8, endLine: 8, col: 1, endCol: 2, message: "second" }),
        entry({
          line: 6,
          endLine: 6,
          col: 8,
          endCol: 12,
          level: "warning",
          code: null,
          message: "function `ping` is never used",
        }),
      ],
    });

    expect(result.markers?.map((m) => [m.severity, m.line, m.message])).toEqual(
      [
        ["error", 4, "cannot find value `missing_value` in this scope"],
        ["error", 5, "second"],
        ["warning", 3, "function `ping` is never used"],
      ]
    );
  });

  it("leaves out entries in files the learner cannot see", async () => {
    const hidden = "cannot find function `ping` in module `super`";
    const result = await run({
      success: false,
      stderr: LIB_ERROR_LOG,
      uuid: null,
      diagnostics: [
        entry({ file: VERIFY_PATH, line: 4, endLine: 4, message: hidden }),
        entry({
          file: "/src/_nonce.rs",
          line: 1,
          endLine: 1,
          message: "nonce",
        }),
        entry({}),
      ],
    });

    expect(result.markers).toHaveLength(1);
    expect(result.markers?.[0]?.line).toBe(4);
    expect(JSON.stringify(result.markers)).not.toContain(hidden);
  });

  it("leaves out entries on lines that are not the learner's", async () => {
    const result = await run({
      success: false,
      stderr: LIB_ERROR_LOG,
      uuid: null,
      diagnostics: [
        // Above the learner's code, and past its last line (the editor has the
        // harness on those lines).
        entry({ line: 2, endLine: 2 }),
        entry({ line: 9, endLine: 9 }),
        entry({ line: 12, endLine: 12 }),
      ],
    });

    expect(result.markers).toBeUndefined();
  });

  it("keeps the friendly sentence for an error in the hidden file", async () => {
    const result = await run({
      success: false,
      stderr: HARNESS_ERROR_LOG,
      uuid: null,
      diagnostics: [
        entry({
          file: VERIFY_PATH,
          line: 4,
          col: 38,
          endLine: 4,
          endCol: 42,
          message: "cannot find function `ping` in this scope",
        }),
      ],
    });

    expect(result.markers).toBeUndefined();
    expect(result.testResults?.[0]?.actualOutput).toBe(
      "The verification harness could not find what the lesson asks for: ping"
    );
  });

  it("gives the same result as before when the build has no diagnostics", async () => {
    const answer = { success: false, stderr: LIB_ERROR_LOG, uuid: null };
    const without = await run(answer);
    cleanup();
    const withEmpty = await run({ ...answer, diagnostics: [] });

    for (const result of [without, withEmpty]) {
      expect(result).not.toHaveProperty("markers");
      expect(result.success).toBe(false);
      expect(result.error).toBe(LIB_ERROR_LOG);
      expect(result.testResults?.[0]?.actualOutput).toBe(
        "error[E0425]: cannot find value `missing_value` in this scope --> src/lib.rs:7:5"
      );
      expect(result.testResults?.[1]?.actualOutput).toBe("Compilation failed");
    }
  });

  it("keeps the test rows of a failed build that has markers", async () => {
    const result = await run({
      success: false,
      stderr: LIB_ERROR_LOG,
      uuid: null,
      diagnostics: [entry({})],
    });

    expect(result.error).toBe(LIB_ERROR_LOG);
    expect(result.testResults?.[0]?.actualOutput).toBe(
      "error[E0425]: cannot find value `missing_value` in this scope --> src/lib.rs:7:5"
    );
  });

  it("carries the warnings of a build that passed", async () => {
    const result = await run({
      success: true,
      stderr: "warning: unused",
      uuid: "u1",
      diagnostics: [
        entry({
          line: 6,
          endLine: 6,
          col: 8,
          endCol: 12,
          level: "warning",
          code: null,
          message: "function `ping` is never used",
        }),
      ],
    });

    expect(result.success).toBe(true);
    expect(result.markers).toEqual([
      expect.objectContaining({ severity: "warning", line: 3 }),
    ]);
  });

  it("keeps every line where it was when the program id spans lines", async () => {
    const spread = CODE.replace(
      'declare_id!("Fg6");',
      'declare_id!(\n    "Fg6"\n);'
    );
    const result = await run(
      {
        success: false,
        stderr: LIB_ERROR_LOG,
        uuid: null,
        // Two lines lower than in CODE, in the file and in the editor.
        diagnostics: [entry({ line: 9, endLine: 9 })],
      },
      { code: spread, starter: spread }
    );

    const lib = sentLib();
    expect(lib).toMatch(/declare_id!\("[1-9A-HJ-NP-Za-km-z]{32,44}"\)/);
    expect(lib).not.toContain("Fg6");
    expect(lib.split("\n")[8]).toBe("    missing_value");
    expect(result.markers?.[0]?.line).toBe(6);
    expect(spread.split("\n")[5]).toBe("    missing_value");
  });
});
