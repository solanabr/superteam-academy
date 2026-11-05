// @vitest-environment jsdom
// Below lg the output panel stacks under the editor, often past the fold, so a
// run's result is scrolled into view. At lg a single editor is locked to the
// viewport and nothing moves.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";
import type {
  ChallengeInterfaceProps,
  ChallengeRunnerProps,
  ExecutionResult,
} from "../types";

const h = vi.hoisted(() => ({
  onResult: null as ChallengeRunnerProps["onResult"] | null,
  media: { desktop: false, reducedMotion: false },
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

vi.mock("../code-editor", async () => {
  const React = await import("react");
  return {
    CodeEditor: React.forwardRef(function MockCodeEditor() {
      return React.createElement("textarea");
    }),
    resetEditorStorage: vi.fn(),
  };
});

vi.mock("../challenge-runner", () => ({
  ChallengeRunner: (props: ChallengeRunnerProps) => {
    h.onResult = props.onResult;
    return null;
  },
}));

vi.mock("../ai-partner/ai-partner-pane", () => ({ AiPartnerPane: () => null }));
vi.mock("../output-panel", () => ({ OutputPanel: () => null }));

const RESULT: ExecutionResult = {
  success: false,
  output: "",
  testResults: [],
};

const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollIntoView.mockClear();
  h.media = { desktop: false, reducedMotion: false };
  Element.prototype.scrollIntoView = scrollIntoView;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  );
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion")
      ? h.media.reducedMotion
      : h.media.desktop,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderAndRun(
  result: ExecutionResult | null = RESULT,
  props: Partial<ChallengeInterfaceProps> = {}
) {
  render(
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
        {...props}
      />
    </NextIntlClientProvider>
  );
  if (result) act(() => h.onResult?.(result));
}

describe("revealing the output panel after a run", () => {
  it("scrolls it into view below lg, only as far as needed", () => {
    renderAndRun();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "smooth",
    });
  });

  it("jumps instead of animating under reduced motion", () => {
    h.media.reducedMotion = true;
    renderAndRun();
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "auto",
    });
  });

  it("leaves the viewport-locked layout alone at lg", () => {
    h.media.desktop = true;
    renderAndRun();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("doesn't move the page before there is a result", () => {
    renderAndRun(null);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("reveals it at lg when several code blocks leave the page unlocked", () => {
    h.media.desktop = true;
    renderAndRun(RESULT, {
      codePart: {
        number: 1,
        total: 2,
        otherParts: [2],
        pendingParts: [2],
        submitted: false,
        onSubmittedCodeEdited: () => {},
        onJumpToPart: () => {},
      },
    });
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  // The runner announces the build right after this result, and the deploy
  // panel scrolls itself into view on that event.
  describe("on a deployable lesson", () => {
    const BUILT: ExecutionResult = {
      success: true,
      output: "Program compiled successfully!",
      testResults: [],
      buildUuid: "build-1",
    };
    // The build server returns a uuid for a compile error too.
    const BUILD_FAILED: ExecutionResult = {
      success: false,
      output: "",
      error: "error[E0308]: mismatched types",
      testResults: [],
      buildUuid: "build-2",
    };

    it("leaves a passing build to the deploy panel", () => {
      renderAndRun(BUILT, { isDeployable: true });
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it("still reveals a compile error that came back with a uuid", () => {
      renderAndRun(BUILD_FAILED, { isDeployable: true });
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it("still reveals a build that never reached the compiler", () => {
      renderAndRun(
        { ...BUILD_FAILED, error: "Build server unavailable", buildUuid: null },
        { isDeployable: true }
      );
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it("keeps the reveal for the same build when deploy is off", () => {
      renderAndRun(BUILT, { isDeployable: false });
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });
  });
});
