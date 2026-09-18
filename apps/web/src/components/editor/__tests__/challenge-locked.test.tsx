// @vitest-environment jsdom
// A completed challenge is read-only (owner, 18-09-2026). The accepted verdict
// used to leave Run/Reset/Format live, so a learner could keep executing — and
// re-submitting — a lesson that was already banked. The lock is derived from
// the persisted completion (`isAlreadyCompleted`), not from the just-accepted
// client state, so it holds across a reload.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";
import { ChallengeRunner } from "../challenge-runner";
import type { CodeEditorProps, ExecutionResult } from "../types";

const h = vi.hoisted(() => ({
  editorProps: null as CodeEditorProps | null,
  resetEditorStorage: vi.fn(),
  executeRustCode: vi.fn(),
}));

// Read through a function so TypeScript doesn't narrow the field to `null`
// after a test resets it.
function editorProps(): CodeEditorProps | null {
  return h.editorProps;
}

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/rust/execute", () => ({ executeRustCode: h.executeRustCode }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));

vi.mock("../code-editor", async () => {
  const React = await import("react");
  return {
    CodeEditor: React.forwardRef(function MockCodeEditor(
      props: CodeEditorProps
    ) {
      h.editorProps = props;
      return React.createElement("textarea", {
        "data-testid": "editor",
        readOnly: props.readOnly,
        defaultValue: props.value,
      });
    }),
    resetEditorStorage: h.resetEditorStorage,
  };
});

vi.mock("../ai-partner/ai-partner-pane", () => ({ AiPartnerPane: () => null }));
vi.mock("../output-panel", () => ({ OutputPanel: () => null }));

const tests: TestCase[] = [
  { id: "t1", description: "returns 2", input: "", expectedOutput: "2" },
];

const ACCEPTED_CODE = "export function add() {\n  return 2;\n}\n";

function renderInterface(isAlreadyCompleted: boolean) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId="lesson-1"
        courseSlug="course"
        lessonSlug="lesson"
        initialCode={ACCEPTED_CODE}
        language="typescript"
        tests={tests}
        hints={[]}
        solution={ACCEPTED_CODE}
        xpReward={20}
        isAlreadyCompleted={isAlreadyCompleted}
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  h.editorProps = null;
  h.resetEditorStorage.mockReset();
  h.executeRustCode.mockReset();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  );
});

describe("completed challenge is locked", () => {
  it("leaves the editor editable while the challenge is unsolved", () => {
    renderInterface(false);
    expect(editorProps()?.readOnly).toBe(false);
    expect(screen.getByLabelText("Reset Code")).not.toHaveAttribute(
      "aria-disabled"
    );
  });

  it("makes the editor read-only once the lesson is completed", () => {
    renderInterface(true);
    expect(editorProps()?.readOnly).toBe(true);
    // The learner's own accepted code, not the starter reset.
    expect(editorProps()?.value).toBe(ACCEPTED_CODE);
  });

  it("locks Reset and Format with an announced reason, keeping them focusable", () => {
    renderInterface(true);
    const reset = screen.getByLabelText("Reset Code");
    const format = screen.getByLabelText("Format");

    for (const button of [reset, format]) {
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute(
        "title",
        messages.lesson.challengeLocked as string
      );
      // Soft-disabled, so it keeps its focus-visible ring and tab stop.
      expect(button).not.toBeDisabled();
    }

    fireEvent.click(reset);
    expect(h.resetEditorStorage).not.toHaveBeenCalled();

    // The toolbar says why it is inert, on its own line.
    expect(
      screen.getByText(messages.lesson.challengeLocked as string)
    ).toBeInTheDocument();
  });

  it("holds the lock across a remount with the persisted completion", () => {
    const { unmount } = renderInterface(true);
    expect(editorProps()?.readOnly).toBe(true);
    unmount();

    h.editorProps = null;
    renderInterface(true);
    expect(editorProps()?.readOnly).toBe(true);
    expect(screen.getByLabelText("Reset Code")).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });
});

describe("ChallengeRunner run button when complete", () => {
  function renderRunner(isComplete: boolean, onResult: () => void) {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ChallengeRunner
          code={ACCEPTED_CODE}
          tests={tests}
          language="rust"
          onResult={onResult as (r: ExecutionResult) => void}
          onSubmit={() => {}}
          isComplete={isComplete}
          xpReward={20}
        />
      </NextIntlClientProvider>
    );
  }

  it("refuses to execute and explains why", () => {
    const onResult = vi.fn();
    renderRunner(true, onResult);

    const run = screen.getByRole("button", { name: /Run Code/i });
    expect(run).toHaveAttribute("aria-disabled", "true");
    expect(run).toHaveAttribute(
      "title",
      messages.lesson.challengeLocked as string
    );
    expect(run).not.toBeDisabled();

    fireEvent.click(run);
    expect(h.executeRustCode).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
    expect(
      screen.getByText(messages.lesson.lessonComplete as string)
    ).toBeInTheDocument();
  });

  it("still runs while the challenge is unsolved", () => {
    h.executeRustCode.mockResolvedValue({
      stdout: "",
      stderr: "",
      success: true,
    });
    renderRunner(false, vi.fn());
    const run = screen.getByRole("button", { name: /Run Code/i });
    expect(run).not.toHaveAttribute("aria-disabled");
    fireEvent.click(run);
    expect(run).toBeDisabled(); // isRunning
  });
});
