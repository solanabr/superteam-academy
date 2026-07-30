// @vitest-environment jsdom
// AI hard-off on the capstone (#867) — the CLIENT leg. Unlike `aiSuppressed`
// (temporary, silent), this state is permanent and must be EXPLAINED: the pane
// is replaced by the AI-free rationale, so a learner who expected a tutor
// learns why there isn't one instead of finding an empty column.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";

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
vi.mock("../challenge-runner", () => ({ ChallengeRunner: () => null }));

vi.mock("../ai-partner/ai-partner-pane", async () => {
  const { createElement } = await import("react");
  return {
    AiPartnerPane: () => createElement("div", { "data-testid": "ai-pane" }),
  };
});

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds: readonly number[] = [];
      constructor(private readonly cb: IntersectionObserverCallback) {}
      observe(): void {
        this.cb(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
  );
});

function renderInterface(props: { capstoneAiOff?: boolean } = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId="lesson-1"
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

describe("ChallengeInterface — capstone AI-free state (#867)", () => {
  it("never mounts the AI pane on the capstone", () => {
    renderInterface({ capstoneAiOff: true });
    // Unmounted, not CSS-hidden: hidden controls would still be reachable by
    // keyboard (WCAG 4.1.2) and would still POST to the route.
    expect(screen.queryByTestId("ai-pane")).not.toBeInTheDocument();
  });

  it("renders the AI-free explanation in the pane's place", () => {
    renderInterface({ capstoneAiOff: true });
    expect(
      screen.getByText(messages.lesson.capstoneAiOffBody)
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.lesson.capstoneAiOffTitle)
    ).toBeInTheDocument();
  });

  it("shows no explanation and keeps the pane on an ordinary lesson", () => {
    renderInterface({ capstoneAiOff: false });
    expect(screen.getByTestId("ai-pane")).toBeInTheDocument();
    expect(
      screen.queryByText(messages.lesson.capstoneAiOffBody)
    ).not.toBeInTheDocument();
  });

  it("defaults to off (ordinary lesson) when the prop is omitted", () => {
    renderInterface();
    expect(screen.getByTestId("ai-pane")).toBeInTheDocument();
    expect(
      screen.queryByText(messages.lesson.capstoneAiOffBody)
    ).not.toBeInTheDocument();
  });
});
