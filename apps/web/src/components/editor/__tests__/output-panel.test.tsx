// @vitest-environment jsdom
import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import { OutputPanel } from "../output-panel";
import type { ExecutionResult } from "../types";
import messages from "@/messages/en.json";

function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

function tc(
  id: string,
  description: string,
  input: string,
  expectedOutput: string
): TestCase {
  return { id, description, input, expectedOutput };
}

function panel(executionResult: ExecutionResult | null) {
  return (
    <OutputPanel
      executionResult={executionResult}
      isRunning={false}
      onClear={vi.fn()}
    />
  );
}

/** Normal JS-executor shape: pass, fail, fail. */
const jsResult: ExecutionResult = {
  success: false,
  output: "some log line",
  testResults: [
    {
      testCase: tc("t1", "adds two numbers", "1, 2", "result === 3"),
      passed: true,
      actualOutput: "pass",
    },
    {
      testCase: tc("t2", "handles zero", "0, 0", "result === 0"),
      passed: false,
      actualOutput: "fail: assertion false",
    },
    {
      testCase: tc("t3", "handles negatives", "-1, -2", "result === -3"),
      passed: false,
      actualOutput: "",
      error: "boom",
    },
  ],
};

const allPassResult: ExecutionResult = {
  success: true,
  output: "done",
  testResults: [
    {
      testCase: tc("t1", "adds two numbers", "1, 2", "result === 3"),
      passed: true,
      actualOutput: "pass",
    },
    {
      testCase: tc("t2", "handles zero", "0, 0", "result === 0"),
      passed: true,
      actualOutput: "pass",
    },
  ],
};

/** Degenerate shape synthesized by parseRustTestResults on compile failure. */
const rustCompileFailure: ExecutionResult = {
  success: false,
  output: "",
  error: "error[E0308]: mismatched types",
  testResults: [
    {
      testCase: tc("r1", "squares the input", "5", "__result__ == 25"),
      passed: false,
      actualOutput: "",
      error: "Compilation failed",
    },
    {
      testCase: tc("r2", "squares zero", "0", "__result__ == 0"),
      passed: false,
      actualOutput: "",
      error: "Compilation failed",
    },
  ],
};

/** Degenerate shape synthesized by runBuildChallenge: empty test code, stderr dump. */
const buildFailure: ExecutionResult = {
  success: false,
  output: "",
  error: "error[E0432]: unresolved import `anchor_lang`",
  testResults: [
    {
      testCase: tc("b1", "Program compiles successfully", "", ""),
      passed: false,
      actualOutput:
        "error[E0432]: unresolved import `anchor_lang`\n --> src/lib.rs:1:5\n  |\n1 | use anchor_lang::prelude::*;",
    },
    {
      testCase: tc("b2", "No warnings emitted", "", ""),
      passed: false,
      actualOutput: "Compilation failed",
    },
  ],
};

function expandedRows(): HTMLElement[] {
  return screen.queryAllByRole("button", { expanded: true });
}

describe("first-failure auto-expand", () => {
  it("auto-focuses the Tests tab and expands exactly the first failing test", () => {
    renderWithIntl(panel(jsResult));

    expect(screen.getByRole("tab", { name: /test cases/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    const expanded = expandedRows();
    expect(expanded).toHaveLength(1);
    expect(expanded[0]).toHaveAccessibleName(/handles zero/i);

    // Pass row and second failure are collapsed.
    expect(
      screen.getByRole("button", { name: /adds two numbers/i })
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: /handles negatives/i })
    ).toHaveAttribute("aria-expanded", "false");

    // The expanded first failure shows test code + message side-by-side.
    expect(screen.getByText("result === 0")).toBeInTheDocument();
    expect(screen.getByText("fail: assertion false")).toBeInTheDocument();
  });

  it("switches to the Tests tab only on run-result arrival, without stealing focus", () => {
    const { rerender } = renderWithIntl(panel(null));

    expect(screen.getByRole("tab", { name: /output/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        {panel(jsResult)}
      </NextIntlClientProvider>
    );

    expect(screen.getByRole("tab", { name: /test cases/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    // Tab selection changed but DOM focus was not moved.
    expect(screen.getByRole("tab", { name: /test cases/i })).not.toHaveFocus();

    // The user can still switch back manually — the auto-switch does not lock.
    fireEvent.mouseDown(screen.getByRole("tab", { name: /output/i }));
    expect(screen.getByRole("tab", { name: /output/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("keeps every row collapsed and stays on Output when all tests pass", () => {
    renderWithIntl(panel(allPassResult));

    expect(screen.getByRole("tab", { name: /output/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    fireEvent.mouseDown(screen.getByRole("tab", { name: /test cases/i }));
    // Banner span (the sr-only status region announces the same text).
    expect(
      screen.getByText(/all tests passed/i, { selector: "span" })
    ).toBeInTheDocument();
    expect(expandedRows()).toHaveLength(0);
  });

  it("toggles rows through keyboard-operable button semantics", () => {
    renderWithIntl(panel(jsResult));

    const passRow = screen.getByRole("button", { name: /adds two numbers/i });
    expect(passRow).toHaveAttribute("aria-expanded", "false");
    expect(passRow).toHaveAttribute("aria-controls");

    fireEvent.click(passRow);
    expect(passRow).toHaveAttribute("aria-expanded", "true");
    const controlled = document.getElementById(
      passRow.getAttribute("aria-controls") as string
    );
    expect(controlled).not.toBeNull();
    expect(controlled).toBeVisible();

    fireEvent.click(passRow);
    expect(passRow).toHaveAttribute("aria-expanded", "false");
  });
});

describe("degenerate synthesized shapes", () => {
  it("renders parseRustTestResults compile-failure rows without breaking", () => {
    renderWithIntl(panel(rustCompileFailure));

    // First failure auto-expanded, second collapsed.
    const expanded = expandedRows();
    expect(expanded).toHaveLength(1);
    expect(expanded[0]).toHaveAccessibleName(/squares the input/i);

    // Row-level synthesized error is shown; Rust assertion renders as test
    // code. Scope to the expanded detail region — collapsed rows keep their
    // (hidden) detail in the DOM.
    const detail = document.getElementById(
      expanded[0]?.getAttribute("aria-controls") as string
    ) as HTMLElement;
    expect(within(detail).getByText("Compilation failed")).toBeInTheDocument();
    expect(within(detail).getByText("__result__ == 25")).toBeInTheDocument();
  });

  it("renders runBuildChallenge rows (empty test code, multi-line stderr) without breaking", () => {
    renderWithIntl(panel(buildFailure));

    const expanded = expandedRows();
    expect(expanded).toHaveLength(1);
    expect(expanded[0]).toHaveAccessibleName(/program compiles successfully/i);

    // Multi-line compiler dump renders inside the message pane.
    expect(
      screen.getByText(/unresolved import `anchor_lang`/i, {
        selector: "pre",
      })
    ).toBeInTheDocument();

    // Empty input/expectedOutput → the test-code column is omitted entirely.
    expect(screen.queryByText("Test code")).not.toBeInTheDocument();
  });
});

describe("authored failure_message (#575)", () => {
  const withMessage: ExecutionResult = {
    success: false,
    output: "",
    testResults: [
      {
        testCase: {
          ...tc("t1", "handles zero", "0, 0", "result === 0"),
          failureMessage:
            "Adding zero should return the other operand unchanged.",
        },
        passed: false,
        actualOutput: "fail: assertion false",
      },
    ],
  };

  it("renders the authored explanation on the failing test", () => {
    renderWithIntl(panel(withMessage));

    expect(screen.getByText(/why this failed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/adding zero should return the other operand/i)
    ).toBeInTheDocument();
    // The raw actualOutput is still shown — the authored message composes with
    // the existing failure detail, it does not replace it.
    expect(screen.getByText("fail: assertion false")).toBeInTheDocument();
  });

  it("shows exactly today's display when no failureMessage is authored", () => {
    renderWithIntl(panel(jsResult));

    expect(screen.queryByText(/why this failed/i)).not.toBeInTheDocument();
  });

  it("never renders a failureMessage on a passing test", () => {
    renderWithIntl(
      panel({
        success: true,
        output: "",
        testResults: [
          {
            testCase: {
              ...tc("t1", "adds", "1, 2", "result === 3"),
              failureMessage: "should not appear on a pass",
            },
            passed: true,
            actualOutput: "pass",
          },
        ],
      })
    );

    fireEvent.mouseDown(screen.getByRole("tab", { name: /test cases/i }));
    expect(screen.queryByText(/why this failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/should not appear/i)).not.toBeInTheDocument();
  });
});

describe("stdout cap", () => {
  it("caps stdout at 10,000 characters and shows a truncation notice", () => {
    const bigOutput = "x".repeat(10_000) + "END_MARKER";
    renderWithIntl(
      panel({ success: true, output: bigOutput, testResults: [] })
    );

    // No test results → Output tab stays active by default.
    expect(screen.getByRole("tab", { name: /output/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.queryByText(/END_MARKER/)).not.toBeInTheDocument();
    expect(screen.getByText(/output truncated/i)).toBeInTheDocument();
  });

  it("renders short output unchanged with no truncation notice", () => {
    renderWithIntl(
      panel({ success: true, output: "hello world", testResults: [] })
    );

    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.queryByText(/output truncated/i)).not.toBeInTheDocument();
  });
});
