// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { ChallengeRunner } from "../challenge-runner";
import type { ChallengeRunnerProps, ExecutionResult } from "../types";

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

function renderRunner(
  onResult: (r: ExecutionResult) => void,
  extra: Pick<ChallengeRunnerProps, "onRunStart" | "onServiceFailure"> = {}
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeRunner
        getCode={() => 'use anchor_lang::prelude::*;\ndeclare_id!("Fg6");\n'}
        tests={tests}
        language="rust"
        buildType="buildable"
        onResult={onResult}
        onSubmit={() => {}}
        isComplete={false}
        xpReward={50}
        {...extra}
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

  it("shows a rejected build's message as an error on the run", async () => {
    const message = "Blocked name 'env' found in /src/lib.rs; rename it";
    h.buildProgram.mockResolvedValue({
      success: false,
      stderr: "",
      uuid: null,
      error: message,
      kind: "rejected",
    });
    const onResult = vi.fn();
    const onServiceFailure = vi.fn();
    renderRunner(onResult, { onServiceFailure });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(onResult).toHaveBeenCalled());
    const result = onResult.mock.calls[0]![0] as ExecutionResult;
    expect(result.success).toBe(false);
    expect(result.error).toBe(message);
    expect(result.testResults?.every((r) => r.error === message)).toBe(true);
    expect(onServiceFailure).not.toHaveBeenCalled();
  });
});

describe("ChallengeRunner build service failures", () => {
  it.each(["unavailable", "busy", "timeout"] as const)(
    "reports %s without producing a run result",
    async (kind) => {
      h.buildProgram.mockResolvedValue({
        success: false,
        stderr: "",
        uuid: null,
        error: "Build server returned an error",
        kind,
      });
      const onResult = vi.fn();
      const onServiceFailure = vi.fn();
      renderRunner(onResult, { onServiceFailure });

      fireEvent.click(screen.getByRole("button"));

      await waitFor(() => expect(onServiceFailure).toHaveBeenCalledWith(kind));
      expect(onServiceFailure).toHaveBeenCalledTimes(1);
      expect(onResult).not.toHaveBeenCalled();
      // The button is usable again for the retry.
      await waitFor(() =>
        expect(screen.getByRole("button")).not.toBeDisabled()
      );
    }
  );

  it("hides Submit when a run after a pass ends without a verdict", async () => {
    h.buildProgram.mockResolvedValueOnce({
      success: true,
      stderr: "",
      uuid: "u1",
    });
    h.buildProgram.mockResolvedValue({
      success: false,
      stderr: "",
      uuid: null,
      error: "Build server returned an error",
      kind: "unavailable",
    });
    const onResult = vi.fn();
    const onServiceFailure = vi.fn();
    renderRunner(onResult, { onServiceFailure });
    const submit = () =>
      screen.queryByRole("button", {
        name: new RegExp(messages.lesson.submitSolution),
      });
    const build = () => screen.getByRole("button", { name: "Build" });

    fireEvent.click(build());
    await waitFor(() => expect(submit()).toBeInTheDocument());

    // The learner edits and builds again; this build gets no verdict, so the
    // earlier pass no longer stands for what is in the editor.
    await waitFor(() => expect(build()).not.toBeDisabled());
    fireEvent.click(build());
    await waitFor(() => expect(onServiceFailure).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(submit()).not.toBeInTheDocument());
    // Still not a run: the only result reported is the first build's pass.
    expect(onResult).toHaveBeenCalledTimes(1);
    expect((onResult.mock.calls[0]![0] as ExecutionResult).success).toBe(true);
  });

  it("announces the start of each run", async () => {
    h.buildProgram.mockResolvedValue({
      success: true,
      stderr: "",
      uuid: "u1",
    });
    const onResult = vi.fn();
    const onRunStart = vi.fn();
    renderRunner(onResult, { onRunStart });

    fireEvent.click(screen.getByRole("button"));

    expect(onRunStart).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onResult).toHaveBeenCalled());
  });
});
