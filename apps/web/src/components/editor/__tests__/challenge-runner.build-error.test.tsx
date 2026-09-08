// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { ChallengeRunner } from "../challenge-runner";
import type { ExecutionResult } from "../types";

const h = vi.hoisted(() => ({
  buildProgram: vi.fn(),
}));

vi.mock("@/lib/build-server/client", () => ({ buildProgram: h.buildProgram }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));

/** Real cargo-build-sbf failure: the error sits well past 500 chars of preamble. */
const STDERR = [
  '[2026-09-08T12:00:01Z INFO  cargo_build_sbf] spawn: "/Users/x/.cache/solana/v1.43/platform-tools/rust/bin/rustc" "--version"',
  '[2026-09-08T12:00:01Z INFO  cargo_build_sbf] spawn: "/Users/x/.cache/solana/v1.43/platform-tools/rust/bin/cargo" "build" "--release" "--target" "sbpf-solana-solana"',
  "warning: dropping unsupported crate type `cdylib` for target `sbpf-solana-solana`",
  "warning: two crate types defined, only the first is used",
  "    Compiling counter v0.1.0 (/build)",
  "error[E0107]: struct takes 4 lifetime arguments but 1 lifetime argument was supplied",
  "   --> src/lib.rs:24:24",
].join("\n");

const tests: TestCase[] = [
  {
    id: "t1",
    description: "Program compiles successfully",
    input: "",
    expectedOutput: "true",
  },
  {
    id: "t2",
    description: "Code contains a greet function",
    input: "",
    expectedOutput: "true",
  },
];

beforeEach(() => {
  h.buildProgram.mockReset();
});

function renderRunner(onResult: (r: ExecutionResult) => void) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeRunner
        code={'use anchor_lang::prelude::*;\ndeclare_id!("Fg6");\n'}
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
}

describe("ChallengeRunner buildable failure output", () => {
  it("shows the compiler error on test 0, not cargo's preamble", async () => {
    h.buildProgram.mockResolvedValue({
      success: false,
      stderr: STDERR,
      uuid: null,
    });
    const onResult = vi.fn();
    renderRunner(onResult);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(onResult).toHaveBeenCalled());
    const result = onResult.mock.calls[0]![0] as ExecutionResult;

    expect(result.success).toBe(false);
    const testResults = result.testResults ?? [];
    expect(testResults[0]?.actualOutput).toBe(
      "error[E0107]: struct takes 4 lifetime arguments but 1 lifetime argument was supplied --> src/lib.rs:24:24"
    );
    expect(testResults[0]?.actualOutput).not.toContain("INFO");
    // Additional tests keep their generic message; full stderr stays available.
    expect(testResults[1]?.actualOutput).toBe("Compilation failed");
    expect(result.error).toContain("cargo_build_sbf");
  });
});
