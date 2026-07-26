// @vitest-environment jsdom
// AI-pane gating (LX-C1/F18, #564): in a mixed code+quiz lesson the AI Partner
// must stay hidden while a quiz block is unanswered — the retrieval close must
// not be answerable by the tutor. The gate is a single `aiSuppressed` prop on
// ChallengeInterface (threaded from lesson-client via the code block); the
// AiPartnerPane itself is untouched.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ChallengeInterface } from "../challenge-interface";
import messages from "@/messages/en.json";

vi.mock("../code-editor", async () => {
  const { forwardRef } = await import("react");
  return {
    CodeEditor: forwardRef(function CodeEditorMock() {
      return null;
    }),
    resetEditorStorage: vi.fn(),
  };
});

vi.mock("../output-panel", () => ({
  OutputPanel: () => null,
}));

vi.mock("../challenge-runner", () => ({
  ChallengeRunner: () => null,
}));

vi.mock("../ai-partner/ai-partner-pane", async () => {
  const { createElement } = await import("react");
  return {
    AiPartnerPane: () => createElement("div", { "data-testid": "ai-pane" }),
  };
});

beforeEach(() => {
  // Sentinel observer that intersects immediately — the scroll reveal fires on
  // mount, isolating the tests to the aiSuppressed gate.
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

function renderInterface(aiSuppressed?: boolean) {
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
        aiSuppressed={aiSuppressed}
      />
    </NextIntlClientProvider>
  );
}

describe("ChallengeInterface — AI Partner suppression (F18)", () => {
  it("reveals the AI pane on scroll when not suppressed", () => {
    renderInterface(false);
    expect(screen.getByTestId("ai-pane")).toBeInTheDocument();
  });

  it("defaults to visible when the prop is omitted (code-only lessons)", () => {
    renderInterface(undefined);
    expect(screen.getByTestId("ai-pane")).toBeInTheDocument();
  });

  it("keeps the AI pane unmounted while suppressed, even after scroll reveal", () => {
    renderInterface(true);
    // Unmounted, not just visually hidden — a CSS-only hide would leave its
    // controls in the tab order (WCAG 4.1.2).
    expect(screen.queryByTestId("ai-pane")).not.toBeInTheDocument();
  });

  it("mounts the pane when the quiz gets answered mid-session", () => {
    const view = renderInterface(true);
    expect(screen.queryByTestId("ai-pane")).not.toBeInTheDocument();

    view.rerender(
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
          aiSuppressed={false}
        />
      </NextIntlClientProvider>
    );
    expect(screen.getByTestId("ai-pane")).toBeInTheDocument();
  });
});
