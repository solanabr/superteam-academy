// @vitest-environment jsdom
// A build that ends without a verdict (service unavailable, busy, timed out)
// is not a run: no test row fails, the fail streak and the AI Partner's test
// summary don't move, and the output area offers a retry instead.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import { resetAnalyticsEventDedupeForTests } from "@/lib/analytics/events";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";

interface AiPaneProps {
  getTestSummary: () => string;
  hasRunTests: boolean;
  hasFailedRun: boolean;
}

const h = vi.hoisted(() => ({
  buildProgram: vi.fn(),
  trackEvent: vi.fn(),
  aiPane: null as AiPaneProps | null,
}));

vi.mock("@/lib/build-server/client", () => ({ buildProgram: h.buildProgram }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));
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

vi.mock("../ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: (props: AiPaneProps) => {
    h.aiPane = props;
    return null;
  },
}));

const UNAVAILABLE_COPY =
  "The build service is unavailable right now. This isn't your code.";

const tests: TestCase[] = [
  {
    id: "t1",
    description: "Program compiles successfully",
    input: "",
    expectedOutput: "true",
  },
  {
    id: "t2",
    description: "Code contains a greet function",
    input: "",
    expectedOutput: "true",
  },
];

const serviceFailure = (kind: "unavailable" | "busy" | "timeout") => ({
  success: false,
  stderr: "",
  uuid: null,
  error: "Build server returned an error",
  kind,
});

const compileError = {
  success: false,
  stderr: "error[E0425]: cannot find value `x` in this scope",
  uuid: null,
};

const compiled = { success: true, stderr: "", uuid: "u1" };

function renderChallenge() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId="lesson-1"
        courseId="course-1"
        courseSlug="anchor-101"
        lessonSlug="first-build"
        initialCode={'declare_id!("Fg6");\n'}
        language="rust"
        buildType="buildable"
        tests={tests}
        hints={[]}
        xpReward={50}
      />
    </NextIntlClientProvider>
  );
}

const buildButton = () => screen.getByRole("button", { name: "Build" });
const testsTab = () => screen.getByRole("tab", { name: /test cases/i });

async function build() {
  const calls = h.buildProgram.mock.calls.length;
  await waitFor(() => expect(buildButton()).not.toBeDisabled());
  fireEvent.click(buildButton());
  await waitFor(() => expect(h.buildProgram).toHaveBeenCalledTimes(calls + 1));
  await waitFor(() => expect(buildButton()).not.toBeDisabled());
}

function eventsNamed(name: string) {
  return h.trackEvent.mock.calls.filter((c) => c[0] === name);
}

beforeEach(() => {
  h.buildProgram.mockReset();
  h.trackEvent.mockClear();
  h.aiPane = null;
  resetAnalyticsEventDedupeForTests();
});

describe("ChallengeInterface: build without a verdict", () => {
  it("shows the notice and leaves the test rows untouched", async () => {
    h.buildProgram.mockResolvedValue(serviceFailure("unavailable"));
    renderChallenge();

    await build();

    expect(await screen.findByText(UNAVAILABLE_COPY)).toBeInTheDocument();
    // No pass/fail count on the tab, and the rows are still the authored spec.
    expect(testsTab()).not.toHaveTextContent(/\d\/\d/);
    fireEvent.mouseDown(testsTab());
    expect(
      screen.getByText("Program compiles successfully")
    ).toBeInTheDocument();
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
  });

  it("does not count as a run for the AI Partner or analytics", async () => {
    h.buildProgram.mockResolvedValue(serviceFailure("unavailable"));
    renderChallenge();

    await build();
    await screen.findByText(UNAVAILABLE_COPY);

    expect(h.aiPane?.getTestSummary()).toBe("No tests run yet");
    expect(h.aiPane?.hasRunTests).toBe(false);
    expect(h.aiPane?.hasFailedRun).toBe(false);
    expect(eventsNamed("challenge_run")).toHaveLength(0);
    expect(eventsNamed("challenge_failed")).toHaveLength(0);
  });

  it.each(["unavailable", "busy", "timeout"] as const)(
    "repeated %s builds never raise the stuck banner",
    async (kind) => {
      h.buildProgram.mockResolvedValue(serviceFailure(kind));
      renderChallenge();

      await build();
      await build();
      await build();
      await build();

      expect(
        screen.queryByText(messages.lesson.encouragementTitle)
      ).not.toBeInTheDocument();
    }
  );

  it("raises the stuck banner after the same number of compile errors", async () => {
    h.buildProgram.mockResolvedValue(compileError);
    renderChallenge();

    await build();
    await build();
    await build();

    expect(
      await screen.findByText(messages.lesson.encouragementTitle)
    ).toBeInTheDocument();
  });

  it("keeps an earlier run's rows and summary when a later build has no verdict", async () => {
    h.buildProgram.mockResolvedValueOnce(compileError);
    h.buildProgram.mockResolvedValue(serviceFailure("unavailable"));
    renderChallenge();

    await build();
    await waitFor(() => expect(testsTab()).toHaveTextContent("0/2"));
    const summary = h.aiPane?.getTestSummary();

    await build();
    await screen.findByText(UNAVAILABLE_COPY);

    expect(testsTab()).toHaveTextContent("0/2");
    expect(h.aiPane?.getTestSummary()).toBe(summary);
    expect(eventsNamed("challenge_failed")).toHaveLength(1);
  });

  it("Try again reruns the build, and a verdict replaces the notice", async () => {
    h.buildProgram.mockResolvedValueOnce(serviceFailure("unavailable"));
    h.buildProgram.mockResolvedValue(compiled);
    renderChallenge();

    await build();
    await screen.findByText(UNAVAILABLE_COPY);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(h.buildProgram).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByText(UNAVAILABLE_COPY)).not.toBeInTheDocument()
    );
    await waitFor(() => expect(testsTab()).toHaveTextContent("2/2"));
  });
});
