// @vitest-environment jsdom
// While a build is in flight, the Output tab says so ("Building Solana
// program..."), and every way the build can end clears that message: a
// verdict (pass or fail), no verdict (service unavailable), and a thrown error.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import { resetAnalyticsEventDedupeForTests } from "@/lib/analytics/events";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";

const h = vi.hoisted(() => ({
  buildProgram: vi.fn(),
}));

vi.mock("@/lib/build-server/client", () => ({ buildProgram: h.buildProgram }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));
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

vi.mock("../ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: () => null,
}));

const BUILDING = messages.lesson.buildingProgram;
const PLACEHOLDER = messages.lesson.runCodePrompt;
const UNAVAILABLE_COPY =
  "The build service is unavailable right now. This isn't your code.";

const tests: TestCase[] = [
  {
    id: "t1",
    description: "Program compiles successfully",
    input: "",
    expectedOutput: "true",
  },
];

const compileError = {
  success: false,
  stderr: "error[E0425]: cannot find value `x` in this scope",
  uuid: null,
};
const compiled = { success: true, stderr: "", uuid: "u1" };
const unavailable = {
  success: false,
  stderr: "",
  uuid: null,
  error: "Build server returned an error",
  kind: "unavailable" as const,
};

/** A build answer the test releases by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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
const outputTab = () => screen.getByRole("tab", { name: /^output$/i });
const testsTab = () => screen.getByRole("tab", { name: /test cases/i });

/** Click Build and wait until the build request is in flight. */
async function startBuild<T>(answer: Promise<T>) {
  h.buildProgram.mockReturnValueOnce(answer);
  await waitFor(() => expect(buildButton()).not.toBeDisabled());
  fireEvent.click(buildButton());
  await waitFor(() => expect(h.buildProgram).toHaveBeenCalled());
}

beforeEach(() => {
  h.buildProgram.mockReset();
  resetAnalyticsEventDedupeForTests();
});

describe("ChallengeInterface: build in flight", () => {
  it("says the program is building, in place of the placeholder", async () => {
    const answer = deferred<typeof compiled>();
    renderChallenge();
    expect(screen.getByText(PLACEHOLDER)).toBeInTheDocument();

    await startBuild(answer.promise);

    const message = await screen.findByText(BUILDING);
    // Screen readers hear it: the message sits in a status region.
    expect(message.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByText(PLACEHOLDER)).not.toBeInTheDocument();
    // The Build button keeps its own spinner and stays locked.
    expect(buildButton()).toBeDisabled();

    answer.resolve(compiled);
    await waitFor(() =>
      expect(screen.queryByText(BUILDING)).not.toBeInTheDocument()
    );
  });

  it.each([
    ["a failed build", () => Promise.resolve(compileError)],
    ["a passing build", () => Promise.resolve(compiled)],
    ["no verdict", () => Promise.resolve(unavailable)],
    ["a thrown error", () => Promise.reject(new Error("network down"))],
  ])(
    "clears the message after %s",
    async (_label: string, answer: () => Promise<unknown>) => {
      const gate = deferred<void>();
      renderChallenge();

      await startBuild(gate.promise.then(answer));
      expect(await screen.findByText(BUILDING)).toBeInTheDocument();

      gate.resolve();
      await waitFor(() =>
        expect(screen.queryByText(BUILDING)).not.toBeInTheDocument()
      );
      await waitFor(() => expect(buildButton()).not.toBeDisabled());
    }
  );

  it("keeps the no-verdict notice after the message clears", async () => {
    const answer = deferred<typeof unavailable>();
    renderChallenge();

    await startBuild(answer.promise);
    expect(await screen.findByText(BUILDING)).toBeInTheDocument();
    answer.resolve(unavailable);

    expect(await screen.findByText(UNAVAILABLE_COPY)).toBeInTheDocument();
    expect(screen.queryByText(BUILDING)).not.toBeInTheDocument();
  });

  it("brings the Output tab forward when a build starts", async () => {
    renderChallenge();
    // A failed first build surfaces the Test Cases tab.
    await startBuild(Promise.resolve(compileError));
    await waitFor(() =>
      expect(testsTab()).toHaveAttribute("aria-selected", "true")
    );
    await waitFor(() => expect(buildButton()).not.toBeDisabled());

    const answer = deferred<typeof compiled>();
    await startBuild(answer.promise);

    await waitFor(() =>
      expect(outputTab()).toHaveAttribute("aria-selected", "true")
    );
    expect(screen.getByText(BUILDING)).toBeInTheDocument();
    answer.resolve(compiled);
  });
});
