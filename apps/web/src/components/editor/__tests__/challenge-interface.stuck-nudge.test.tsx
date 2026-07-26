// @vitest-environment jsdom
// Stuck-nudge v1 (LX-C4, #576): after ENCOURAGEMENT_THRESHOLD consecutive
// failed runs the encouragement banner also offers to reveal an authored hint
// in-editor, wired to stuck_nudge_shown / stuck_nudge_accepted and tagging the
// eventual solve postNudge. It composes with the single consecutive-fail
// counter (#549) — never a second counter — and must respect AI suppression
// (#631) by pointing at hints, never the tutor.
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ChallengeInterface } from "../challenge-interface";
import type { ChallengeRunnerProps, ExecutionResult } from "../types";
import { resetAnalyticsEventDedupeForTests } from "@/lib/analytics/events";
import messages from "@/messages/en.json";

const h = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  runnerProps: null as { onResult: (result: unknown) => void } | null,
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));

vi.mock("../code-editor", async () => {
  const React = await import("react");
  return {
    CodeEditor: React.forwardRef(function MockCodeEditor() {
      return React.createElement("textarea", { "data-testid": "editor" });
    }),
    resetEditorStorage: vi.fn(),
  };
});

vi.mock("../challenge-runner", async () => {
  const React = await import("react");
  return {
    ChallengeRunner: (props: ChallengeRunnerProps) => {
      h.runnerProps = { onResult: props.onResult as (r: unknown) => void };
      return React.createElement("div", { "data-testid": "runner" });
    },
  };
});

vi.mock("../ai-partner/ai-partner-pane", async () => {
  const React = await import("react");
  return {
    AiPartnerPane: () =>
      React.createElement("div", { "data-testid": "ai-pane" }),
  };
});

vi.mock("../output-panel", () => ({ OutputPanel: () => null }));

beforeAll(() => {
  // Sentinel observer that intersects immediately, so the AI-pane reveal is not
  // what these tests are gated on — only aiSuppressed and the nudge are.
  class MockIntersectionObserver {
    constructor(private readonly cb: IntersectionObserverCallback) {}
    observe(): void {
      this.cb(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    }
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

beforeEach(() => {
  h.trackEvent.mockClear();
  h.runnerProps = null;
  resetAnalyticsEventDedupeForTests();
});

const HINTS = ["Start from the base case", "Then recurse on the tail"];

function renderChallenge(
  overrides: Partial<Parameters<typeof ChallengeInterface>[0]> = {}
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId="lesson-1"
        courseId="course-1"
        courseSlug="solana-101"
        lessonSlug="first-challenge"
        initialCode="// starter"
        language="typescript"
        tests={[]}
        hints={HINTS}
        xpReward={50}
        {...overrides}
      />
    </NextIntlClientProvider>
  );
}

const fail: ExecutionResult = { success: false, output: "", testResults: [] };
const pass: ExecutionResult = { success: true, output: "", testResults: [] };

function eventsNamed(name: string) {
  return h.trackEvent.mock.calls.filter((c) => c[0] === name);
}

describe("ChallengeInterface — stuck-nudge (LX-C4)", () => {
  it("hides the hint nudge before the threshold, shows it at ≥3 fails", () => {
    renderChallenge();
    // Two fails: below the threshold, no nudge.
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    expect(
      screen.queryByRole("button", { name: /show a hint/i })
    ).not.toBeInTheDocument();
    expect(eventsNamed("stuck_nudge_shown")).toHaveLength(0);

    // Third fail crosses the threshold.
    act(() => h.runnerProps?.onResult(fail));
    expect(
      screen.getByRole("button", { name: /show a hint/i })
    ).toBeInTheDocument();
    expect(eventsNamed("stuck_nudge_shown")).toHaveLength(1);
    expect(h.trackEvent).toHaveBeenCalledWith("stuck_nudge_shown", {
      lessonId: "lesson-1",
      challengeKind: "js",
      courseId: "course-1",
      consecutiveFails: 3,
    });
  });

  it("stuck_nudge_shown fires once even as later fails re-render the banner", () => {
    renderChallenge();
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    expect(eventsNamed("stuck_nudge_shown")).toHaveLength(1);
  });

  it("reveals authored hints one at a time, each firing stuck_nudge_accepted", () => {
    renderChallenge();
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));

    fireEvent.click(screen.getByRole("button", { name: /show a hint/i }));
    expect(screen.getByText(HINTS[0]!)).toBeInTheDocument();
    expect(screen.queryByText(HINTS[1]!)).not.toBeInTheDocument();
    expect(h.trackEvent).toHaveBeenCalledWith("stuck_nudge_accepted", {
      lessonId: "lesson-1",
      challengeKind: "js",
      courseId: "course-1",
      hintIndex: 0,
    });

    fireEvent.click(screen.getByRole("button", { name: /show another hint/i }));
    expect(screen.getByText(HINTS[1]!)).toBeInTheDocument();
    expect(h.trackEvent).toHaveBeenCalledWith("stuck_nudge_accepted", {
      lessonId: "lesson-1",
      challengeKind: "js",
      courseId: "course-1",
      hintIndex: 1,
    });

    // All hints revealed — the reveal button retires.
    expect(
      screen.queryByRole("button", { name: /show (a|another) hint/i })
    ).not.toBeInTheDocument();
  });

  it("tags the post-nudge solve and resets on a pass", () => {
    renderChallenge();
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));

    act(() => h.runnerProps?.onResult(pass));
    expect(h.trackEvent).toHaveBeenCalledWith("challenge_solved", {
      lessonId: "lesson-1",
      challengeKind: "js",
      courseId: "course-1",
      postNudge: true,
    });
    // Banner cleared by the passing run.
    expect(
      screen.queryByRole("button", { name: /show a hint/i })
    ).not.toBeInTheDocument();
  });

  it("does not tag a solve that never crossed the threshold", () => {
    renderChallenge();
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(pass));
    expect(h.trackEvent).toHaveBeenLastCalledWith("challenge_solved", {
      lessonId: "lesson-1",
      challengeKind: "js",
      courseId: "course-1",
    });
  });

  it("dismiss hides the whole nudge", () => {
    renderChallenge();
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(
      screen.queryByRole("button", { name: /show a hint/i })
    ).not.toBeInTheDocument();
  });

  it("still reveals authored hints while the AI pane is suppressed (#631)", () => {
    renderChallenge({ aiSuppressed: true });
    // AI pane must stay unmounted under suppression.
    expect(screen.queryByTestId("ai-pane")).not.toBeInTheDocument();

    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));

    // Hints-only copy, and the authored-hint reveal is still offered — the
    // static hint channel is safe while the tutor is gated.
    expect(
      screen.getByText(messages.lesson.encouragementBodyHintsOnly)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show a hint/i }));
    expect(screen.getByText(HINTS[0]!)).toBeInTheDocument();
    // Revealing a hint never mounts the suppressed AI pane.
    expect(screen.queryByTestId("ai-pane")).not.toBeInTheDocument();
  });

  it("with no authored hints, keeps the plain encouragement banner (no nudge)", () => {
    renderChallenge({ hints: [] });
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));
    act(() => h.runnerProps?.onResult(fail));

    expect(
      screen.getByText(messages.lesson.encouragementTitle)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /show a hint/i })
    ).not.toBeInTheDocument();
    expect(eventsNamed("stuck_nudge_shown")).toHaveLength(0);
  });
});
