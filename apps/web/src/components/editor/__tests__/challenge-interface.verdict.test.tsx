// @vitest-environment jsdom
// Submit verdict state machine (#942 PR A): idle → judging → accepted |
// rejected, driven by the existing event contract — the lesson-complete
// dispatch, the isAlreadyCompleted flip, and superteam:lesson-complete-error.
// The accepted path plays a ~600ms flash on the editor card before the
// Accepted card appears; reduced motion settles instantly.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";
import type { ChallengeRunnerProps } from "../types";

const h = vi.hoisted(() => ({
  runnerProps: null as Pick<ChallengeRunnerProps, "onSubmit"> | null,
  reducedMotion: false,
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

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
      h.runnerProps = { onSubmit: props.onSubmit };
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

beforeEach(() => {
  h.runnerProps = null;
  h.reducedMotion = false;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  );
  // The component reads prefers-reduced-motion at accept time.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion") && h.reducedMotion,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function renderChallenge(
  overrides: Partial<Parameters<typeof ChallengeInterface>[0]> = {}
) {
  const props = {
    lessonId: "lesson-1",
    courseId: "course-1",
    courseSlug: "solana-101",
    lessonSlug: "first-challenge",
    initialCode: "// starter",
    language: "typescript" as const,
    tests: [],
    hints: [],
    xpReward: 50,
    ...overrides,
  };
  const view = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface {...props} />
    </NextIntlClientProvider>
  );
  return {
    ...view,
    rerenderWith(next: Partial<Parameters<typeof ChallengeInterface>[0]>) {
      view.rerender(
        <NextIntlClientProvider locale="en" messages={messages}>
          <ChallengeInterface {...props} {...next} />
        </NextIntlClientProvider>
      );
    },
  };
}

const verdictCard = (container: HTMLElement): HTMLElement => {
  const el = container.querySelector<HTMLElement>(".verdict-card");
  if (!el) throw new Error("verdict card not rendered");
  return el;
};

describe("ChallengeInterface — Submit verdict state machine (#942)", () => {
  it("accepted path: judging while in flight, green flash, then Accepted card with XP", () => {
    vi.useFakeTimers();
    const dispatched: CustomEvent[] = [];
    const listener = (e: Event) => dispatched.push(e as CustomEvent);
    window.addEventListener("superteam:lesson-complete", listener);

    const view = renderChallenge();
    expect(verdictCard(view.container).dataset.verdict).toBe("idle");

    // Submit (pass-gated in the real runner) → judging + the complete event.
    act(() => h.runnerProps?.onSubmit());
    expect(verdictCard(view.container).dataset.verdict).toBe("judging");
    expect(screen.getByText("Judging your submission…")).toBeTruthy();
    // Judging hides Submit without claiming completion: the runner sees
    // isJudging, never a fake isComplete — no "Lesson Complete!" badge yet.
    expect(h.runnerProps?.isComplete).toBe(false);
    expect(h.runnerProps?.isJudging).toBe(true);
    expect(screen.queryByText("Lesson Complete!")).toBeNull();
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]?.detail).toEqual({
      lessonId: "lesson-1",
      submittedCode: "// starter",
    });

    // lesson-client flips isAlreadyCompleted on API success → accepted, and
    // the card flashes before the Accepted card appears.
    act(() => view.rerenderWith({ isAlreadyCompleted: true }));
    const card = verdictCard(view.container);
    expect(card.dataset.verdict).toBe("accepted");
    expect(card.hasAttribute("data-verdict-flash")).toBe(true);
    expect(screen.queryByText("Accepted")).toBeNull();

    act(() => vi.advanceTimersByTime(600));
    expect(verdictCard(view.container).hasAttribute("data-verdict-flash")).toBe(
      false
    );
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(screen.getByText("+50 XP earned")).toBeTruthy();

    window.removeEventListener("superteam:lesson-complete", listener);
  });

  it("rejected path: shows the server deny reason with Retry, and Retry resets to idle", () => {
    const view = renderChallenge();
    act(() => h.runnerProps?.onSubmit());
    expect(verdictCard(view.container).dataset.verdict).toBe("judging");

    act(() => {
      window.dispatchEvent(
        new CustomEvent("superteam:lesson-complete-error", {
          detail: { lessonId: "lesson-1", message: "Hidden tests failed." },
        })
      );
    });
    expect(verdictCard(view.container).dataset.verdict).toBe("rejected");
    expect(screen.getByRole("alert").textContent).toContain(
      "Hidden tests failed."
    );
    expect(screen.getByText("Not accepted")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(verdictCard(view.container).dataset.verdict).toBe("idle");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("ignores a rejection for a different lesson", () => {
    const view = renderChallenge();
    act(() => h.runnerProps?.onSubmit());
    act(() => {
      window.dispatchEvent(
        new CustomEvent("superteam:lesson-complete-error", {
          detail: { lessonId: "other-lesson", message: "nope" },
        })
      );
    });
    expect(verdictCard(view.container).dataset.verdict).toBe("judging");
  });

  it("reduced motion: no flash, Accepted card settles instantly", () => {
    h.reducedMotion = true;
    const view = renderChallenge();
    act(() => h.runnerProps?.onSubmit());

    act(() => view.rerenderWith({ isAlreadyCompleted: true }));
    const card = verdictCard(view.container);
    expect(card.dataset.verdict).toBe("accepted");
    expect(card.hasAttribute("data-verdict-flash")).toBe(false);
    expect(screen.getByText("Accepted")).toBeTruthy();
    expect(screen.getByText("+50 XP earned")).toBeTruthy();
  });

  it("a lesson already completed on mount starts settled — no flash", () => {
    const view = renderChallenge({ isAlreadyCompleted: true, earnedXp: 35 });
    const card = verdictCard(view.container);
    expect(card.dataset.verdict).toBe("accepted");
    expect(card.hasAttribute("data-verdict-flash")).toBe(false);
    expect(screen.getByText("+35 XP earned")).toBeTruthy();
  });
});
