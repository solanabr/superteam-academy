// @vitest-environment jsdom
// Solution-reveal soft-gate (LX-C6, #582): the reference solution already ships
// in the client payload; this gates it behind a deliberate, confirmed click
// (never auto-shown, never refused — one-tap override, AIE-27). Confirming logs
// solution_revealed and best-effort reschedules the lesson into review; the XP
// path is untouched.
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

function eventsNamed(name: string) {
  return h.trackEvent.mock.calls.filter((c) => c[0] === name);
}

describe("ChallengeInterface — solution-reveal soft-gate (LX-C6)", () => {
  it("offers no reveal control when the challenge ships no solution", () => {
    renderChallenge({ solution: undefined });
    expect(
      screen.queryByRole("button", { name: /view reference solution/i })
    ).not.toBeInTheDocument();
  });

  it("offers no reveal control once the lesson is already complete", () => {
    renderChallenge({ isAlreadyCompleted: true });
    expect(
      screen.queryByRole("button", { name: /view reference solution/i })
    ).not.toBeInTheDocument();
  });

  it("gates the reveal behind a confirm — the solution is not shown on the first click", () => {
    renderChallenge();
    fireEvent.click(
      screen.getByRole("button", { name: /view reference solution/i })
    );
    // Confirm prompt is up; the solution text and the reveal event are not.
    expect(
      screen.getByText(messages.lesson.solutionGateBody)
    ).toBeInTheDocument();
    expect(screen.queryByText(SOLUTION)).not.toBeInTheDocument();
    expect(eventsNamed("solution_revealed")).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("backing out of the confirm reveals nothing and logs nothing (one-tap override)", () => {
    renderChallenge();
    fireEvent.click(
      screen.getByRole("button", { name: /view reference solution/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /keep trying/i }));
    expect(
      screen.queryByText(messages.lesson.solutionGateBody)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(SOLUTION)).not.toBeInTheDocument();
    expect(eventsNamed("solution_revealed")).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirming reveals the solution, logs it once, and reschedules into review", async () => {
    renderChallenge();
    fireEvent.click(
      screen.getByRole("button", { name: /view reference solution/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /show solution/i }));

    expect(screen.getByText(SOLUTION)).toBeInTheDocument();
    expect(eventsNamed("solution_revealed")).toHaveLength(1);
    expect(h.trackEvent).toHaveBeenCalledWith("solution_revealed", {
      lessonId: "lesson-1",
      challengeKind: "js",
      courseId: "course-1",
    });

    // Best-effort review reschedule, keyed by the lesson slugs.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/lessons/reveal-solution");
    expect(JSON.parse(init.body as string)).toEqual({
      courseSlug: "solana-101",
      lessonSlug: "first-challenge",
    });

    // Honesty (AIE-27): the "marked for review" claim appears ONLY after the
    // server confirms (2xx + scheduled=true) — not synchronously on reveal.
    expect(
      screen.getByText(messages.lesson.solutionRevealedNote)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(messages.lesson.solutionReviewScheduledNote)
    ).toBeInTheDocument();
  });

  it("makes NO review-queue claim when the reschedule fails (e.g. anonymous 401)", async () => {
    // Anonymous learner: the route 401s. The component reads the body only when
    // res.ok, so the json shape here is never consumed — it just satisfies the
    // mock's inferred type.
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ scheduled: false }),
    });
    renderChallenge();
    fireEvent.click(
      screen.getByRole("button", { name: /view reference solution/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /show solution/i }));

    // Solution still revealed (never a refusal), and the fetch was attempted.
    expect(screen.getByText(SOLUTION)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // Let the fetch chain settle, then assert the panel shows the neutral note
    // and never the "marked for review" claim.
    await new Promise((r) => setTimeout(r, 0));
    expect(
      screen.getByText(messages.lesson.solutionRevealedNote)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.lesson.solutionReviewScheduledNote)
    ).not.toBeInTheDocument();
  });
});
