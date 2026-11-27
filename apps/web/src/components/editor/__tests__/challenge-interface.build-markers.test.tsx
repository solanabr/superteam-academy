// @vitest-environment jsdom
// When the editor's compiler markers are set and cleared around a build, and
// which editor gets them in a lesson with two code blocks.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { TestCase } from "@superteam-lms/types";
import { resetAnalyticsEventDedupeForTests } from "@/lib/analytics/events";
import { HARNESS_MARKER, LIB_PATH, VERIFY_PATH } from "@/lib/challenge/harness";
import messages from "@/messages/en.json";
import { ChallengeInterface } from "../challenge-interface";
import type { CodePart } from "../types";

interface EditorSpies {
  setMarkers: ReturnType<typeof vi.fn>;
  clearMarkers: ReturnType<typeof vi.fn>;
  goTo: ReturnType<typeof vi.fn>;
  replaceCode: ReturnType<typeof vi.fn>;
  /** What the editor does when the learner types. */
  type: (code: string) => void;
}

const h = vi.hoisted(() => ({
  buildProgram: vi.fn(),
  /** One entry per mounted editor, by its storage scope. */
  editors: new Map<string, EditorSpies>(),
}));

vi.mock("@/lib/build-server/client", () => ({ buildProgram: h.buildProgram }));
vi.mock("@superteam-lms/deploy", () => ({ setCachedBinary: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../ai-partner/ai-partner-pane", () => ({ AiPartnerPane: () => null }));

vi.mock("../code-editor", async () => {
  const React = await import("react");
  return {
    CodeEditor: React.forwardRef(function MockCodeEditor(
      props: { storageScope?: string; onChange?: (code: string) => void },
      ref: React.ForwardedRef<unknown>
    ) {
      const onChange = React.useRef(props.onChange);
      onChange.current = props.onChange;
      const [spies] = React.useState<EditorSpies>(() => ({
        setMarkers: vi.fn(),
        clearMarkers: vi.fn(),
        goTo: vi.fn(),
        replaceCode: vi.fn(),
        type: (code) => onChange.current?.(code),
      }));
      h.editors.set(props.storageScope ?? "only", spies);
      React.useImperativeHandle(ref, () => ({
        getEditor: () => null,
        format: async () => "unsupported",
        replaceCode: spies.replaceCode,
        setMarkers: spies.setMarkers,
        clearMarkers: spies.clearMarkers,
        goTo: spies.goTo,
      }));
      return React.createElement("textarea", { "data-testid": "editor" });
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

const LOG = [
  "error[E0425]: cannot find value `missing_value` in this scope",
  " --> src/lib.rs:7:5",
].join("\n");

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

const failedWithDiagnostics = {
  success: false,
  stderr: LOG,
  uuid: null,
  diagnostics: [libError],
};

const failedWithout = { success: false, stderr: LOG, uuid: null };

const EDITOR_MARKER = {
  line: 4,
  column: 5,
  endLine: 4,
  endColumn: 18,
  severity: "error",
  code: "E0425",
  message: "cannot find value `missing_value` in this scope",
};

function part(number: number): CodePart {
  return {
    number,
    total: 2,
    otherParts: [number === 1 ? 2 : 1],
    pendingParts: [],
    submitted: false,
    onSubmittedCodeEdited: () => {},
    onJumpToPart: () => {},
  };
}

function challenge(blockKey?: string, codePart?: CodePart) {
  return (
    <ChallengeInterface
      lessonId="lesson-1"
      blockKey={blockKey}
      codePart={codePart}
      courseId="course-1"
      courseSlug="anchor-101"
      lessonSlug="first-build"
      initialCode={STARTER}
      language="rust"
      buildType="buildable"
      tests={tests}
      hints={[]}
      xpReward={50}
    />
  );
}

function renderOne() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {challenge()}
    </NextIntlClientProvider>
  );
  return h.editors.get("only")!;
}

const buildButton = (scope: HTMLElement = document.body) =>
  within(scope).getByRole("button", { name: "Build" });

/** Click Build and wait for the run to end. */
async function build(scope?: HTMLElement) {
  const calls = h.buildProgram.mock.calls.length;
  await waitFor(() => expect(buildButton(scope)).not.toBeDisabled());
  fireEvent.click(buildButton(scope));
  await waitFor(() => expect(h.buildProgram).toHaveBeenCalledTimes(calls + 1));
  await waitFor(() => expect(buildButton(scope)).not.toBeDisabled());
}

/** A build answer the test settles when it chooses. */
function pendingBuild() {
  let settle: (answer: unknown) => void = () => {};
  h.buildProgram.mockReturnValue(
    new Promise((resolve) => {
      settle = resolve;
    })
  );
  return (answer: unknown) => act(async () => settle(answer));
}

beforeEach(() => {
  h.buildProgram.mockReset();
  h.editors.clear();
  window.localStorage.clear();
  resetAnalyticsEventDedupeForTests();
});

describe("ChallengeInterface: compiler markers", () => {
  it("sets the markers of a build that returns diagnostics", async () => {
    h.buildProgram.mockResolvedValue(failedWithDiagnostics);
    const editor = renderOne();

    await build();

    expect(editor.setMarkers).toHaveBeenCalledTimes(1);
    expect(editor.setMarkers).toHaveBeenCalledWith([EDITOR_MARKER]);
  });

  it("clears the markers when the next run starts", async () => {
    h.buildProgram.mockResolvedValue(failedWithDiagnostics);
    const editor = renderOne();
    await build();
    editor.clearMarkers.mockClear();
    editor.setMarkers.mockClear();
    const settle = pendingBuild();

    fireEvent.click(buildButton());

    // The build is still running: the earlier markers are gone already.
    await waitFor(() => expect(h.buildProgram).toHaveBeenCalledTimes(2));
    expect(editor.clearMarkers).toHaveBeenCalledTimes(1);
    expect(editor.setMarkers).not.toHaveBeenCalled();

    await settle(failedWithDiagnostics);
    await waitFor(() => expect(editor.setMarkers).toHaveBeenCalledTimes(1));
  });

  it("leaves the editor without markers when the build has no diagnostics", async () => {
    h.buildProgram.mockResolvedValueOnce(failedWithDiagnostics);
    h.buildProgram.mockResolvedValue(failedWithout);
    const editor = renderOne();
    await build();
    expect(editor.setMarkers).toHaveBeenCalledTimes(1);

    await build();

    expect(editor.setMarkers).toHaveBeenCalledTimes(1);
    expect(editor.clearMarkers.mock.invocationCallOrder.at(-1)).toBeGreaterThan(
      editor.setMarkers.mock.invocationCallOrder.at(-1)!
    );
  });

  it("sets no markers for an error in the hidden verification file", async () => {
    h.buildProgram.mockResolvedValue({
      ...failedWithout,
      diagnostics: [{ ...libError, file: VERIFY_PATH, line: 4, endLine: 4 }],
    });
    const editor = renderOne();

    await build();

    expect(editor.setMarkers).not.toHaveBeenCalled();
    expect(editor.clearMarkers).toHaveBeenCalled();
  });

  it("sets no markers when the build ends without a verdict", async () => {
    h.buildProgram.mockResolvedValueOnce(failedWithDiagnostics);
    h.buildProgram.mockResolvedValue({
      success: false,
      stderr: "",
      uuid: null,
      error: "Build server returned an error",
      kind: "unavailable",
    });
    const editor = renderOne();
    await build();
    editor.clearMarkers.mockClear();

    await build();

    expect(editor.setMarkers).toHaveBeenCalledTimes(1);
    expect(editor.clearMarkers).toHaveBeenCalled();
  });

  it("clears the markers on reset", async () => {
    h.buildProgram.mockResolvedValue(failedWithDiagnostics);
    const editor = renderOne();
    await build();
    editor.clearMarkers.mockClear();

    fireEvent.click(
      screen.getByRole("button", { name: messages.lesson.resetCode })
    );

    expect(editor.clearMarkers).toHaveBeenCalledTimes(1);
    expect(editor.replaceCode).toHaveBeenCalledWith(STARTER);
  });

  it("sets no markers when the code changed while the build ran", async () => {
    const editor = renderOne();
    const settle = pendingBuild();
    fireEvent.click(buildButton());
    await waitFor(() => expect(h.buildProgram).toHaveBeenCalledTimes(1));

    // The positions are for the text that was sent, not for this one.
    act(() => editor.type(`// a new first line\n${STARTER}`));
    await settle(failedWithDiagnostics);
    await waitFor(() => expect(buildButton()).not.toBeDisabled());

    expect(editor.setMarkers).not.toHaveBeenCalled();
  });

  it("moves the cursor to an error clicked in the Output tab", async () => {
    h.buildProgram.mockResolvedValue(failedWithDiagnostics);
    const editor = renderOne();
    await build();

    fireEvent.mouseDown(screen.getByRole("tab", { name: /output/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^Line 4:/ }));

    expect(editor.goTo).toHaveBeenCalledTimes(1);
    expect(editor.goTo).toHaveBeenCalledWith(4, 5);
  });
});

describe("ChallengeInterface: a lesson with two code blocks", () => {
  function renderTwo() {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <div data-testid="first">{challenge("first", part(1))}</div>
        <div data-testid="second">{challenge("second", part(2))}</div>
      </NextIntlClientProvider>
    );
    return {
      first: h.editors.get("first")!,
      second: h.editors.get("second")!,
      firstBlock: screen.getByTestId("first"),
      secondBlock: screen.getByTestId("second"),
    };
  }

  it("sets markers only in the editor of the block that was built", async () => {
    h.buildProgram.mockResolvedValue(failedWithDiagnostics);
    const { first, second, secondBlock } = renderTwo();

    await build(secondBlock);

    expect(second.setMarkers).toHaveBeenCalledWith([EDITOR_MARKER]);
    expect(first.setMarkers).not.toHaveBeenCalled();
    expect(first.clearMarkers).not.toHaveBeenCalled();
  });

  it("keeps one block's markers when the other block is built", async () => {
    h.buildProgram.mockResolvedValueOnce(failedWithDiagnostics);
    h.buildProgram.mockResolvedValue(failedWithout);
    const { first, second, firstBlock, secondBlock } = renderTwo();
    await build(firstBlock);
    expect(first.setMarkers).toHaveBeenCalledTimes(1);
    first.clearMarkers.mockClear();

    await build(secondBlock);

    expect(first.clearMarkers).not.toHaveBeenCalled();
    expect(second.setMarkers).not.toHaveBeenCalled();
  });

  it("moves the cursor in the editor of the block whose error was clicked", async () => {
    h.buildProgram.mockResolvedValue(failedWithDiagnostics);
    const { first, second, secondBlock } = renderTwo();
    await build(secondBlock);

    fireEvent.mouseDown(
      within(secondBlock).getByRole("tab", { name: /output/i })
    );
    fireEvent.click(
      await within(secondBlock).findByRole("button", { name: /^Line 4:/ })
    );

    expect(second.goTo).toHaveBeenCalledWith(4, 5);
    expect(first.goTo).not.toHaveBeenCalled();
  });
});
