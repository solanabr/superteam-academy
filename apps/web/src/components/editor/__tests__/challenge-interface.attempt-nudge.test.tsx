// @vitest-environment jsdom
// Attempt-gate wiring (#865, replaces the #770 hard think-first lock):
// ChallengeInterface threads the run signal into the AiPartnerPane as
// `hasRunTests` and wires the nudge analytics callbacks. There is NO
// time-based lock anymore: nothing is written to localStorage, no unlock
// moment exists, and an already-completed lesson reports the attempt as made
// so the pane can never nudge it. The pane's own nudge UI is covered in
// ai-partner/__tests__/ai-partner-pane.test.tsx; here we assert the props the
// pane receives and the analytics wire format end-to-end (real events module
// with its per-lesson dedupe, mocked facade).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { resetAnalyticsEventDedupeForTests } from "@/lib/analytics/events";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";
import type { ExecutionResult } from "../types";

const h = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  runnerProps: null as { onResult: (result: unknown) => void } | null,
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));

vi.mock("../code-editor", async () => {
  const { forwardRef } = await import("react");
  return {
    CodeEditor: forwardRef(function CodeEditorMock() {
      return null;
    }),
    resetEditorStorage: vi.fn(),
  };
});

vi.mock("../output-panel", () => ({ OutputPanel: () => null }));

vi.mock("../challenge-runner", async () => {
  const { createElement } = await import("react");
  return {
    ChallengeRunner: (props: { onResult: (result: unknown) => void }) => {
      h.runnerProps = { onResult: props.onResult };
      return createElement("div", { "data-testid": "runner" });
    },
  };
});

// Capture the pane's attempt-gate props and expose the analytics callbacks as
// clickable buttons, instead of rendering the real pane.
vi.mock("../ai-partner/ai-partner-pane", async () => {
  const { createElement } = await import("react");
  return {
    AiPartnerPane: (props: {
      hasRunTests?: boolean;
      onNudgeShown?: () => void;
    }) =>
      createElement(
        "div",
        {
          "data-testid": "ai-pane",
          "data-hasruntests": String(props.hasRunTests),
        },
        createElement("button", {
          "data-testid": "fire-shown",
          onClick: props.onNudgeShown,
        })
      ),
  };
});

beforeEach(() => {
  window.localStorage.clear();
  h.trackEvent.mockClear();
  h.runnerProps = null;
  resetAnalyticsEventDedupeForTests();
});

const LESSON_ID = "lesson-1";

function renderInterface(props: { isAlreadyCompleted?: boolean } = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId={LESSON_ID}
        courseId="course-1"
        courseSlug="course"
        lessonSlug="lesson"
        initialCode=""
        language="typescript"
        tests={[]}
        hints={[]}
        xpReward={30}
        {...props}
      />
    </NextIntlClientProvider>
  );
}

function readHasRunTests(): boolean {
  return (
    screen.getByTestId("ai-pane").getAttribute("data-hasruntests") === "true"
  );
}

function simulateRun(success: boolean): void {
  const result: ExecutionResult = {
    success,
    output: "",
    testResults: [],
  };
  act(() => h.runnerProps?.onResult(result));
}

describe("ChallengeInterface — attempt-gate signal (#865)", () => {
  it("reports no attempt before the first run and writes nothing to localStorage", () => {
    renderInterface();
    expect(readHasRunTests()).toBe(false);
    // The #770 lock persisted `challenge:ai-open:<lessonId>` on mount; the
    // attempt gate stores nothing — no key, no clock, no lock to resume.
    expect(window.localStorage.length).toBe(0);
  });

  it("flips hasRunTests after a run — even a FAILING one counts as the attempt", () => {
    renderInterface();
    simulateRun(false);
    expect(readHasRunTests()).toBe(true);
  });

  it("treats an already-completed lesson as attempted (no nudge possible)", () => {
    renderInterface({ isAlreadyCompleted: true });
    expect(readHasRunTests()).toBe(true);
  });

  it("fires attempt_gate_nudge_shown exactly once per challenge", () => {
    renderInterface();

    fireEvent.click(screen.getByTestId("fire-shown"));
    fireEvent.click(screen.getByTestId("fire-shown"));

    const shown = h.trackEvent.mock.calls.filter(
      ([name]) => name === "attempt_gate_nudge_shown"
    );
    expect(shown).toHaveLength(1);
    expect(shown[0]?.[1]).toEqual({
      lessonId: LESSON_ID,
      courseId: "course-1",
      challengeKind: "js",
    });
  });

  it("has no override event to fire — the gate is one line with no buttons", () => {
    renderInterface();
    fireEvent.click(screen.getByTestId("fire-shown"));
    expect(
      h.trackEvent.mock.calls.filter(
        ([name]) => name === "attempt_gate_overridden"
      )
    ).toHaveLength(0);
  });
});
