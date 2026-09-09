// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { resetDeployFlow, setDeployFlow } from "@/lib/deploy/flow-store";
import { DEPLOY_EDITOR_ANCHOR_ID } from "@/lib/deploy/scroll";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";

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
    ChallengeRunner: () =>
      React.createElement("div", { "data-testid": "runner" }),
  };
});

vi.mock("../ai-partner/ai-partner-pane", () => ({ AiPartnerPane: () => null }));
vi.mock("../output-panel", () => ({ OutputPanel: () => null }));

beforeAll(() => {
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

beforeEach(() => resetDeployFlow());

function renderChallenge(
  overrides: Partial<Parameters<typeof ChallengeInterface>[0]> = {}
) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId="lesson-1"
        courseId="course-1"
        courseSlug="btc-to-sol-evolution"
        lessonSlug="your-first-solana-program"
        initialCode="// starter"
        language="rust"
        buildType="buildable"
        isDeployable
        tests={[]}
        hints={[]}
        xpReward={50}
        {...overrides}
      />
    </NextIntlClientProvider>
  );
}

describe("ChallengeInterface — deploy flow", () => {
  it("mirrors the stepper in the toolbar for a deployable lesson", () => {
    setDeployFlow({ built: true });
    renderChallenge();
    const nav = screen.getByRole("navigation", { name: "Deploy progress" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fund/ })).toHaveAttribute(
      "aria-current",
      "step"
    );
  });

  it("leaves a non-deployable lesson's toolbar alone", () => {
    renderChallenge({
      isDeployable: false,
      language: "typescript",
      buildType: undefined,
    });
    expect(
      screen.queryByRole("navigation", { name: "Deploy progress" })
    ).not.toBeInTheDocument();
    expect(document.getElementById(DEPLOY_EDITOR_ANCHOR_ID)).toBeNull();
  });

  it("is the scroll target the Build step points at", () => {
    renderChallenge();
    expect(document.getElementById(DEPLOY_EDITOR_ANCHOR_ID)).not.toBeNull();
  });

  it("submits through its own path when the deploy card asks", () => {
    const onComplete = vi.fn();
    const completed = vi.fn();
    window.addEventListener("superteam:lesson-complete", completed);
    renderChallenge({ onComplete, isEnrolled: true });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("superteam:request-submit", {
          detail: { lessonId: "lesson-1" },
        })
      );
    });

    expect(onComplete).toHaveBeenCalledOnce();
    expect(completed).toHaveBeenCalledOnce();
    window.removeEventListener("superteam:lesson-complete", completed);
  });

  it("ignores a submit request meant for another lesson", () => {
    const onComplete = vi.fn();
    renderChallenge({ onComplete, isEnrolled: true });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("superteam:request-submit", {
          detail: { lessonId: "some-other-lesson" },
        })
      );
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
