// @vitest-environment jsdom
// The build output the AI Partner is sent, and the "Explain this error" button:
// when it shows, what it asks, and what it opens while a quiz is unanswered.
// The runner, the Output tab, the pane and its hook are the real ones.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import { resetAnalyticsEventDedupeForTests } from "@/lib/analytics/events";
import { HARNESS_MARKER, LIB_PATH, VERIFY_PATH } from "@/lib/challenge/harness";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";
import type { ChallengeInterfaceProps, CodePart } from "../types";

const h = vi.hoisted(() => ({
  buildProgram: vi.fn(),
  /** What the learner types goes through the editor's onChange. */
  type: (_code: string): void => {},
}));

vi.mock("@/lib/build-server/client", () => ({ buildProgram: h.buildProgram }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

vi.mock("../code-editor", async () => {
  const React = await import("react");
  return {
    CodeEditor: React.forwardRef(function MockCodeEditor(
      props: { onChange?: (code: string) => void },
      ref: React.ForwardedRef<unknown>
    ) {
      const onChange = React.useRef(props.onChange);
      onChange.current = props.onChange;
      h.type = (code) => onChange.current?.(code);
      React.useImperativeHandle(ref, () => ({
        getEditor: () => null,
        format: async () => "unsupported",
        replaceCode: vi.fn(),
        setMarkers: vi.fn(),
        clearMarkers: vi.fn(),
        goTo: vi.fn(),
      }));
      return React.createElement("div", { "data-testid": "editor" });
    }),
    resetEditorStorage: vi.fn(),
  };
});

/** Editor lines 1 to 5 are the learner's; the harness starts on line 7. */
const STARTER = [
  "use anchor_lang::prelude::*;",
  'declare_id!("Fg6");',
  "pub fn ping() -> u64 {",
  "    missing_value",
  "}",
  "",
  "// ─────",
  HARNESS_MARKER,
  "mod verify {",
  "    const PING: fn() -> u64 = super::ping;",
  "}",
  "",
].join("\n");

const tests: TestCase[] = [
  {
    id: "t1",
    description: "Program compiles successfully",
    input: "",
    expectedOutput: "true",
  },
];

const libError = {
  file: LIB_PATH,
  line: 7,
  col: 5,
  endLine: 7,
  endCol: 18,
  level: "error",
  code: "E0425",
  message: "cannot find value `missing_value` in this scope",
};
const LIB_ROW =
  "Line 4: cannot find value `missing_value` in this scope [E0425]";

const LIB_LOG = [
  "error[E0425]: cannot find value `missing_value` in this scope",
  " --> src/lib.rs:7:5",
].join("\n");

const failedInOwnCode = {
  success: false,
  stderr: LIB_LOG,
  uuid: null,
  diagnostics: [libError],
};
/** A failed build with nothing the Output tab can list. */
const failedUnplaced = { success: false, stderr: LIB_LOG, uuid: null };
const passed = { success: true, stderr: "", uuid: "u1" };

/** Planted in everything the build says about the hidden verification file. */
const HIDDEN = "HIDDEN_VERIFY_TEXT_7f3a";
const failedInHiddenFile = {
  success: false,
  uuid: null,
  stderr: [
    "error[E0425]: cannot find function `ping` in this scope",
    "  --> src/_verify.rs:3:35",
    "   |",
    `3  |     const PING: fn() -> u64 = super::ping; // ${HIDDEN}`,
    `   = note: ${HIDDEN}`,
    "",
    LIB_LOG,
  ].join("\n"),
  diagnostics: [
    {
      ...libError,
      file: VERIFY_PATH,
      line: 3,
      endLine: 3,
      message: `cannot find function \`ping\` in this scope ${HIDDEN}`,
    },
    libError,
  ],
};
const HARNESS_SENTENCE =
  "The verification harness could not find what the lesson asks for: ping";

const FIXED_QUESTION = messages.aiPartner.explainError.message;
const ANSWER = { type: "answer", text: "The name missing_value is not set." };
const EARLIER_LOG = [
  { role: "user", text: "an earlier question" },
  { role: "ai", response: { type: "answer", text: "an earlier answer" } },
];

/** What the tutor routes answer; each test can change it. */
let partnerReply: unknown = ANSWER;
let partnerLog: unknown = { log: [] };

function json(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.startsWith("/api/ai/partner/log")) return json(partnerLog);
  if (url === "/api/ai/partner") return json(partnerReply);
  return json({});
});

/** The parsed bodies of the requests made to the tutor route, in order. */
function partnerRequests(): Array<Record<string, unknown>> {
  return fetchMock.mock.calls
    .filter(([input]) => String(input) === "/api/ai/partner")
    .map(
      (call) =>
        JSON.parse(
          (call as unknown as [unknown, RequestInit])[1].body as string
        ) as Record<string, unknown>
    );
}
/** The same bodies as sent, to search for text that must not be in them. */
function partnerRequestText(): string {
  return fetchMock.mock.calls
    .filter(([input]) => String(input) === "/api/ai/partner")
    .map((call) => (call as unknown as [unknown, RequestInit])[1].body)
    .join("\n");
}

function challenge(props: Partial<ChallengeInterfaceProps> = {}) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId="lesson-1"
        courseId="course-1"
        courseSlug="anchor-101"
        lessonSlug="first-build"
        initialCode={STARTER}
        language="rust"
        buildType="buildable"
        tests={tests}
        hints={[]}
        xpReward={50}
        {...props}
      />
    </NextIntlClientProvider>
  );
}

const buildButton = () => screen.getByRole("button", { name: "Build" });
const explainButton = () =>
  screen.queryByRole("button", { name: messages.lesson.explainError });
const questionBox = () =>
  screen.queryByLabelText(messages.aiPartner.actions.askLabel);

/** Click Build, wait for the run to end and bring the Output tab forward. */
async function build() {
  const calls = h.buildProgram.mock.calls.length;
  await waitFor(() => expect(buildButton()).not.toBeDisabled());
  fireEvent.click(buildButton());
  await waitFor(() => expect(h.buildProgram).toHaveBeenCalledTimes(calls + 1));
  await waitFor(() => expect(buildButton()).not.toBeDisabled());
  fireEvent.mouseDown(screen.getByRole("tab", { name: /output/i }));
}

async function clickExplain() {
  const sent = partnerRequests().length;
  fireEvent.click(explainButton()!);
  await waitFor(() => expect(partnerRequests()).toHaveLength(sent + 1));
  return partnerRequests()[sent]!;
}

/** Ask a free-text question in the pane's question box. */
async function askInPane(question: string) {
  const sent = partnerRequests().length;
  fireEvent.change(questionBox()!, { target: { value: question } });
  fireEvent.click(
    screen.getByRole("button", { name: messages.aiPartner.actions.askSend })
  );
  await waitFor(() => expect(partnerRequests()).toHaveLength(sent + 1));
  return partnerRequests()[sent]!;
}

function laterPart(): CodePart {
  return {
    number: 2,
    total: 2,
    otherParts: [1],
    pendingParts: [],
    submitted: false,
    onSubmittedCodeEdited: () => {},
    onJumpToPart: () => {},
  };
}

beforeEach(() => {
  h.buildProgram.mockReset();
  fetchMock.mockClear();
  partnerReply = ANSWER;
  partnerLog = { log: [] };
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
  resetAnalyticsEventDedupeForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ChallengeInterface: when Explain this error shows", () => {
  it("shows after a failed build with an error the Output tab lists", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge());
    expect(explainButton()).not.toBeInTheDocument();

    await build();

    expect(explainButton()).toBeEnabled();
  });

  it("shows after a failed build whose error is in the hidden verification file", async () => {
    h.buildProgram.mockResolvedValue({
      ...failedInHiddenFile,
      diagnostics: [failedInHiddenFile.diagnostics[0]],
    });
    render(challenge());

    await build();

    expect(explainButton()).toBeEnabled();
  });

  it.each([
    ["a build that passed", passed],
    ["a failed build with no error it can show", failedUnplaced],
    [
      "a build that gave no verdict",
      {
        success: false,
        stderr: "",
        uuid: null,
        error: "Build server returned an error",
        kind: "busy",
      },
    ],
  ])("does not show after %s", async (_name, answer) => {
    h.buildProgram.mockResolvedValue(answer);
    render(challenge());

    await build();

    expect(explainButton()).not.toBeInTheDocument();
  });

  it("goes away when the learner edits the code", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge());
    await build();
    expect(explainButton()).toBeInTheDocument();

    act(() => h.type(`${STARTER}\n// an edit`));

    expect(explainButton()).not.toBeInTheDocument();
  });

  it("does not show for a build that ended after the learner edited", async () => {
    let settle: (answer: unknown) => void = () => {};
    h.buildProgram.mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      })
    );
    render(challenge());
    fireEvent.click(buildButton());
    await waitFor(() => expect(h.buildProgram).toHaveBeenCalledTimes(1));

    act(() => h.type(`// a new first line\n${STARTER}`));
    await act(async () => settle(failedInOwnCode));
    await waitFor(() => expect(buildButton()).not.toBeDisabled());
    fireEvent.mouseDown(screen.getByRole("tab", { name: /output/i }));

    expect(explainButton()).not.toBeInTheDocument();
  });

  it("does not show on the capstone, where the tutor is off", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge({ capstoneAiOff: true }));

    await build();

    expect(explainButton()).not.toBeInTheDocument();
  });

  it("does not show on a later code part, which has no tutor", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(
      challenge({
        blockKey: "second",
        codePart: laterPart(),
        aiSuppressed: true,
      })
    );

    await build();

    expect(explainButton()).not.toBeInTheDocument();
  });
});

describe("ChallengeInterface: what Explain this error sends", () => {
  it("asks the fixed question with the code and the listed rows", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge());
    await build();

    const request = await clickExplain();

    expect(request).toEqual({
      lessonSlug: "first-build",
      courseSlug: "anchor-101",
      action: "ask",
      message: FIXED_QUESTION,
      code: STARTER,
      testSummary: "0/1 passing; failing: Program compiles successfully",
      buildOutput: LIB_ROW,
      explainError: true,
    });
    expect(await screen.findByText(ANSWER.text)).toBeInTheDocument();
  });

  it("sends at most three rows", async () => {
    h.buildProgram.mockResolvedValue({
      ...failedInOwnCode,
      diagnostics: [4, 5, 6, 7].map((line) => ({
        ...libError,
        line,
        endLine: line,
        message: `error ${line}`,
      })),
    });
    render(challenge());
    await build();

    const request = await clickExplain();

    expect(String(request.buildOutput).split("\n")).toHaveLength(3);
  });

  it("sends nothing from the hidden verification file", async () => {
    h.buildProgram.mockResolvedValue(failedInHiddenFile);
    render(challenge());
    await build();
    // The compiler log on screen does hold the planted text.
    expect(document.body.textContent).toContain(HIDDEN);

    const explain = await clickExplain();
    await screen.findByText(ANSWER.text);
    const ask = await askInPane("why?");

    // The friendly sentence and the learner's own row, and no more.
    const buildOutput = `${HARNESS_SENTENCE}\n${LIB_ROW}`;
    expect(explain.buildOutput).toBe(buildOutput);
    expect(ask.buildOutput).toBe(buildOutput);
    expect(partnerRequestText()).not.toContain(HIDDEN);
    expect(partnerRequestText()).not.toContain("_verify");
  });

  it("sends the build output with the other tutor actions too", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge());
    await build();

    const request = await askInPane("why does this fail?");

    expect(request).toMatchObject({
      action: "ask",
      message: "why does this fail?",
      buildOutput: LIB_ROW,
    });
    expect(request).not.toHaveProperty("explainError");
  });

  it("sends no build output once the learner has edited the code", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge());
    await build();
    const edited = `${STARTER}\n// an edit`;
    act(() => h.type(edited));

    const request = await askInPane("why does this fail?");

    expect(request.code).toBe(edited);
    expect(request).not.toHaveProperty("buildOutput");
  });

  it("sends no build output when the last run was not a failed build", async () => {
    h.buildProgram.mockResolvedValueOnce(failedInOwnCode);
    h.buildProgram.mockResolvedValue(passed);
    render(challenge());
    await build();
    await build();

    const request = await askInPane("is this right?");

    expect(request).not.toHaveProperty("buildOutput");
  });
});

describe("ChallengeInterface: Explain this error and the tutor's limits", () => {
  it("is disabled once the lesson is complete", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    const view = render(challenge());
    await build();

    view.rerender(challenge({ isAlreadyCompleted: true }));

    await waitFor(() => expect(explainButton()).toBeDisabled());
    fireEvent.click(explainButton()!);
    expect(partnerRequests()).toHaveLength(0);
  });

  it("is disabled when the lesson's tutor turns are used up", async () => {
    partnerLog = { log: [], counts: { free: 2, metered: 8, socratic: 20 } };
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge());

    await build();

    await waitFor(() => expect(explainButton()).toBeDisabled());
  });

  it("is disabled while its request is in flight", async () => {
    let settle: (response: Response) => void = () => {};
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge());
    await build();
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          settle = resolve;
        })
    );

    fireEvent.click(explainButton()!);

    await waitFor(() => expect(explainButton()).toBeDisabled());
    await act(async () => settle(json(ANSWER)));
    await waitFor(() => expect(explainButton()).toBeEnabled());
  });
});

describe("ChallengeInterface: Explain this error with an unanswered quiz", () => {
  it("keeps the tutor closed until the button is used", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge({ aiSuppressed: true }));

    await build();

    expect(explainButton()).toBeEnabled();
    expect(questionBox()).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.aiPartner.title)
    ).not.toBeInTheDocument();
    expect(partnerRequests()).toHaveLength(0);
  });

  it("shows the answer to the fixed question and no question box", async () => {
    partnerLog = { log: EARLIER_LOG };
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge({ aiSuppressed: true }));
    await build();

    const request = await clickExplain();

    expect(request).toMatchObject({
      action: "ask",
      message: FIXED_QUESTION,
      buildOutput: LIB_ROW,
      explainError: true,
    });
    expect(await screen.findByText(ANSWER.text)).toBeInTheDocument();
    expect(
      screen.getByText(messages.aiPartner.explainError.answerOnly)
    ).toBeInTheDocument();
    // No way to type a question, and no other tutor action.
    expect(questionBox()).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: messages.aiPartner.actions.askSend,
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: new RegExp(messages.aiPartner.actions.propose),
      })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("an earlier answer")).not.toBeInTheDocument();
  });

  it("opens the whole tutor when the quiz is answered", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    const view = render(challenge({ aiSuppressed: true }));
    await build();
    await clickExplain();
    await screen.findByText(ANSWER.text);

    view.rerender(challenge({ aiSuppressed: false }));

    expect(questionBox()).toBeInTheDocument();
    expect(screen.getByText(ANSWER.text)).toBeInTheDocument();
    // Opening it is not a second request.
    expect(partnerRequests()).toHaveLength(1);
  });

  it("is disabled after the server says the turns are used up", async () => {
    partnerReply = {
      budgetExhausted: true,
      counts: { free: 2, metered: 8, socratic: 20 },
    };
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge({ aiSuppressed: true }));
    await build();

    await clickExplain();

    await waitFor(() => expect(explainButton()).toBeDisabled());
    expect(
      screen.getByText(messages.aiPartner.exhausted.title)
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("does not show for a learner who is not enrolled", async () => {
    // Such a learner cannot answer the quiz, so the tutor never opens for
    // them in a lesson that has one.
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge({ aiSuppressed: true, isEnrolled: false }));

    await build();

    expect(explainButton()).not.toBeInTheDocument();
  });

  it("shows for a learner who is not enrolled where the tutor is open to them", async () => {
    h.buildProgram.mockResolvedValue(failedInOwnCode);
    render(challenge({ isEnrolled: false }));

    await build();

    expect(explainButton()).toBeEnabled();
    expect(questionBox()).toBeInTheDocument();
  });
});
