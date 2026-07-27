// @vitest-environment jsdom
// Solution-reveal post-completion gate (#770): the reference solution is a
// reward, not a crutch. The "View reference solution" control is hidden until
// the challenge is verified complete; once complete it reveals the solution
// directly (no confirm step, no review-reschedule side effect — that LX-C6
// machinery is retained in code but unreachable via this path).
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { resetAnalyticsEventDedupeForTests } from "@/lib/analytics/events";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";
import type { ChallengeRunnerProps } from "../types";

const h = vi.hoisted(() => ({ trackEvent: vi.fn() }));

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
    ChallengeRunner: (_props: ChallengeRunnerProps) =>
      React.createElement("div", { "data-testid": "runner" }),
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

const fetchMock = vi.fn(() =>
  Promise.resolve({ ok: true, json: async () => ({ scheduled: true }) })
);

beforeEach(() => {
  h.trackEvent.mockClear();
  fetchMock.mockClear();
  resetAnalyticsEventDedupeForTests();
  vi.stubGlobal("fetch", fetchMock);
});

const SOLUTION = "export const answer = () => 42;";

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
        solution={SOLUTION}
        xpReward={50}
        {...overrides}
      />
    </NextIntlClientProvider>
  );
}

describe("ChallengeInterface — reference solution post-completion gate (#770)", () => {
  it("offers no reveal control when the challenge ships no solution", () => {
    renderChallenge({ solution: undefined, isAlreadyCompleted: true });
    expect(
      screen.queryByRole("button", { name: /view reference solution/i })
    ).not.toBeInTheDocument();
  });

  it("hides the reveal control until the challenge is complete", () => {
    renderChallenge();
    expect(
      screen.queryByRole("button", { name: /view reference solution/i })
    ).not.toBeInTheDocument();
  });

  it("shows the reveal control once the lesson is complete", () => {
    renderChallenge({ isAlreadyCompleted: true });
    expect(
      screen.getByRole("button", { name: /view reference solution/i })
    ).toBeInTheDocument();
  });

  it("reveals the solution directly on click — no confirm, no review-reschedule", () => {
    renderChallenge({ isAlreadyCompleted: true });
    fireEvent.click(
      screen.getByRole("button", { name: /view reference solution/i })
    );
    // Solution is shown immediately; the old confirm prompt never appears.
    expect(screen.getByText(SOLUTION)).toBeInTheDocument();
    expect(
      screen.queryByText(messages.lesson.solutionGateBody)
    ).not.toBeInTheDocument();
    // Post-completion reveal carries no review-reschedule side effect.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("toggles the panel closed on a second click", () => {
    renderChallenge({ isAlreadyCompleted: true });
    const button = screen.getByRole("button", {
      name: /view reference solution/i,
    });
    fireEvent.click(button);
    expect(screen.getByText(SOLUTION)).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText(SOLUTION)).not.toBeInTheDocument();
  });
});
