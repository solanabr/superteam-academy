// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ChallengeInterface } from "../challenge-interface";
import type { ChallengeRunnerProps, ExecutionResult } from "../types";
import { resetAnalyticsEventDedupeForTests } from "@/lib/analytics/events";
import messages from "@/messages/en.json";

// The events module (REAL, with its dedupe) sits between the component and the
// facade — mocking only the facade asserts the true wire format end-to-end.
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
      h.runnerProps = {
        onResult: props.onResult as (result: unknown) => void,
      };
      return React.createElement("div", { "data-testid": "runner" });
    },
  };
});

vi.mock("../ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: () => null,
}));

vi.mock("../output-panel", () => ({
  OutputPanel: () => null,
}));

beforeAll(() => {
  // jsdom has no IntersectionObserver (AI-partner reveal sentinel)
  class MockIntersectionObserver {
    observe(): void {}
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
        hints={[]}
        xpReward={50}
        {...overrides}
      />
    </NextIntlClientProvider>
  );
}

const failResult: ExecutionResult = {
  success: false,
  output: "",
  testResults: [],
};
const passResult: ExecutionResult = {
  success: true,
  output: "",
  testResults: [],
};

const expectedCtx = {
  lessonId: "lesson-1",
  challengeKind: "js",
  courseId: "course-1",
};

describe("ChallengeInterface — challenge lifecycle events (LX-F1)", () => {
  it("fires challenge_started once on the first editor keystroke, never on render", () => {
    renderChallenge();
    expect(h.trackEvent).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByTestId("editor"), { key: "a" });
    fireEvent.keyDown(screen.getByTestId("editor"), { key: "b" });

    expect(h.trackEvent).toHaveBeenCalledTimes(1);
    expect(h.trackEvent).toHaveBeenCalledWith("challenge_started", expectedCtx);
  });

  it("covers run-first learners: first result fires started then run", () => {
    renderChallenge();
    act(() => h.runnerProps?.onResult(passResult));

    const names = h.trackEvent.mock.calls.map((c) => c[0] as string);
    expect(names).toEqual([
      "challenge_started",
      "challenge_run",
      "challenge_solved",
    ]);
  });

  it("fires challenge_run + challenge_failed per failing run with an escalating streak", () => {
    renderChallenge();
    fireEvent.keyDown(screen.getByTestId("editor"), { key: "a" });
    act(() => h.runnerProps?.onResult(failResult));
    act(() => h.runnerProps?.onResult(failResult));

    expect(h.trackEvent).toHaveBeenCalledWith("challenge_run", expectedCtx);
    expect(h.trackEvent).toHaveBeenCalledWith("challenge_failed", {
      ...expectedCtx,
      consecutiveFails: 1,
    });
    expect(h.trackEvent).toHaveBeenCalledWith("challenge_failed", {
      ...expectedCtx,
      consecutiveFails: 2,
    });
  });

  it("fires challenge_solved on a passing run and resets the fail streak", () => {
    renderChallenge();
    act(() => h.runnerProps?.onResult(failResult));
    act(() => h.runnerProps?.onResult(passResult));
    act(() => h.runnerProps?.onResult(failResult));

    expect(h.trackEvent).toHaveBeenCalledWith("challenge_solved", expectedCtx);
    // Streak restarted at 1 after the solve, not 2
    const failCalls = h.trackEvent.mock.calls.filter(
      (c) => c[0] === "challenge_failed"
    );
    expect(failCalls.map((c) => c[1])).toEqual([
      { ...expectedCtx, consecutiveFails: 1 },
      { ...expectedCtx, consecutiveFails: 1 },
    ]);
  });

  it("derives challengeKind buildable for rust build challenges", () => {
    renderChallenge({ language: "rust", buildType: "buildable" });
    act(() => h.runnerProps?.onResult(passResult));

    expect(h.trackEvent).toHaveBeenCalledWith("challenge_run", {
      lessonId: "lesson-1",
      challengeKind: "buildable",
      courseId: "course-1",
    });
  });

  it("keeps payloads lean — no code content, no PII keys", () => {
    renderChallenge();
    fireEvent.keyDown(screen.getByTestId("editor"), { key: "a" });
    act(() => h.runnerProps?.onResult(failResult));

    const allowed = new Set([
      "lessonId",
      "courseId",
      "challengeKind",
      "consecutiveFails",
    ]);
    for (const [, payload] of h.trackEvent.mock.calls) {
      for (const key of Object.keys(payload as Record<string, unknown>)) {
        expect(allowed.has(key)).toBe(true);
      }
    }
  });
});
