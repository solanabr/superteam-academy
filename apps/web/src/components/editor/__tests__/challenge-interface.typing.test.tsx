// @vitest-environment jsdom
// Chrome delivers Monaco's typing through EditContext `textupdate`, which React
// schedules as a normal update rather than a discrete one, so `code` can commit
// after the learner has typed more. These run the real ChallengeInterface and
// CodeEditor over a fake Monaco that is ahead of React, the way it is then.
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { EditorProps, Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import messages from "@/messages/en.json";
import {
  LESSON_COMPLETE_EVENT,
  onLessonEvent,
} from "@/lib/lessons/lesson-events";
import { ChallengeInterface } from "../challenge-interface";
import type { CodePart } from "../types";

const h = vi.hoisted(() => ({
  editorProps: null as unknown,
  onApply: null as ((proposed: string) => void) | null,
  aiGetCode: null as (() => string) | null,
  runnerGetCode: null as (() => string) | null,
  onSubmit: null as (() => void) | null,
}));

/** The code Run would get if it were clicked now. */
const runCode = () => h.runnerGetCode?.();

vi.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: (props: unknown) => {
    h.editorProps = props;
    return null;
  },
  loader: { config: vi.fn() },
}));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));
vi.mock("../output-panel", () => ({ OutputPanel: () => null }));
vi.mock("../challenge-runner", () => ({
  ChallengeRunner: (props: { getCode: () => string; onSubmit: () => void }) => {
    h.runnerGetCode = props.getCode;
    h.onSubmit = props.onSubmit;
    return null;
  },
}));
vi.mock("../ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: (props: {
    onApply: (proposed: string) => void;
    getCode: () => string;
  }) => {
    h.onApply = props.onApply;
    h.aiGetCode = props.getCode;
    return null;
  },
}));

const STARTER = "// starter";
const KEY = "superteam-lms-code-lesson-1";

/**
 * A Monaco that reports content changes the way the real one does. The wrapper
 * subscribes `onChange` after `onMount`, so the draft restore goes unreported.
 */
function mountEditor() {
  const editorProps = () => h.editorProps as EditorProps;
  const domNode = document.createElement("div");
  domNode.appendChild(document.createElement("textarea"));
  const model = { value: STARTER };
  let subscribed = false;
  const setValue = vi.fn((next: string) => {
    model.value = next;
    if (subscribed) {
      editorProps().onChange?.(next, {} as editor.IModelContentChangedEvent);
    }
  });
  const instance = {
    onDidFocusEditorWidget: () => ({ dispose: vi.fn() }),
    onDidBlurEditorWidget: () => ({ dispose: vi.fn() }),
    getDomNode: () => domNode,
    getValue: () => model.value,
    setValue,
  };
  act(() => {
    editorProps().onMount?.(
      instance as unknown as editor.IStandaloneCodeEditor,
      {} as Monaco
    );
  });
  subscribed = true;
  setValue.mockClear();
  const keystroke = (next: string) => {
    model.value = next;
    editorProps().onChange?.(next, {} as editor.IModelContentChangedEvent);
  };
  return { model, setValue, keystroke };
}

function renderInterface(
  opts: { userId?: string | null; blockKey?: string; codePart?: CodePart } = {}
) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId="lesson-1"
        userId={opts.userId}
        blockKey={opts.blockKey}
        codePart={opts.codePart}
        courseId="course-1"
        courseSlug="course"
        lessonSlug="lesson"
        initialCode={STARTER}
        language="typescript"
        tests={[]}
        hints={[]}
        xpReward={30}
      />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  h.editorProps = null;
  h.onApply = null;
  h.aiGetCode = null;
  h.runnerGetCode = null;
  h.onSubmit = null;
});

afterEach(cleanup);

function part(number: number): CodePart {
  return {
    number,
    total: 2,
    otherParts: [3 - number],
    pendingParts: [3 - number],
    submitted: false,
    onSubmittedCodeEdited: () => {},
    onJumpToPart: () => {},
  };
}

describe("a restored draft", () => {
  it("is the code Run gets, before any edit", () => {
    window.localStorage.setItem(`${KEY}@anon`, "// my draft");
    renderInterface();
    mountEditor();

    expect(runCode()).toBe("// my draft");
  });

  it("is the code Run gets before the editor has loaded", () => {
    window.localStorage.setItem(`${KEY}@user:user-1`, "// my draft");
    renderInterface({ userId: "user-1" });

    expect(runCode()).toBe("// my draft");
  });

  it("gives each part of a lesson its own draft before the editor loads", () => {
    window.localStorage.setItem(`${KEY}::first@anon`, "// first");
    window.localStorage.setItem(`${KEY}::second@anon`, "// second");

    renderInterface({ blockKey: "first", codePart: part(1) });
    expect(runCode()).toBe("// first");
    cleanup();
    renderInterface({ blockKey: "second", codePart: part(2) });
    expect(runCode()).toBe("// second");
  });

  it("is a draft saved before drafts were per user, without moving it yet", () => {
    window.localStorage.setItem(KEY, "// saved before");
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const removeItem = vi.spyOn(Storage.prototype, "removeItem");

    renderInterface({ userId: "user-1" });

    expect(runCode()).toBe("// saved before");
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    setItem.mockRestore();
    removeItem.mockRestore();
  });

  it("isn't another user's draft", () => {
    window.localStorage.setItem(`${KEY}@user:user-1`, "// theirs");
    window.localStorage.setItem(KEY, "// saved before");

    renderInterface({ userId: "user-2" });
    expect(runCode()).toBe("// saved before");
    cleanup();
    renderInterface();
    expect(runCode()).toBe(STARTER);
  });

  it("leaves Run on the starter when nothing was saved", () => {
    renderInterface();
    expect(runCode()).toBe(STARTER);
    mountEditor();

    expect(runCode()).toBe(STARTER);
  });
});

describe("code read when the learner acts", () => {
  // The editor holds text React hasn't committed yet.
  function typeAhead() {
    renderInterface();
    const { model, keystroke } = mountEditor();
    act(() => keystroke("// committed"));
    model.value = "// typed, not committed";
  }

  it("Run gets what's in the editor", () => {
    typeAhead();
    expect(runCode()).toBe("// typed, not committed");
  });

  it("Submit sends what's in the editor", () => {
    const submitted: (string | undefined)[] = [];
    const off = onLessonEvent(LESSON_COMPLETE_EVENT, (d) =>
      submitted.push(d.submittedCode)
    );
    typeAhead();

    act(() => h.onSubmit?.());

    off();
    expect(submitted).toEqual(["// typed, not committed"]);
  });

  it("the AI Partner reads what's in the editor", () => {
    typeAhead();
    expect(h.aiGetCode?.()).toBe("// typed, not committed");
  });
});

describe("typing ahead of a React commit", () => {
  it("keeps text typed after the change React is committing", () => {
    renderInterface();
    const { model, setValue, keystroke } = mountEditor();

    act(() => {
      keystroke("a");
      // React commits "a" with this already in the model, unreported.
      model.value = "ab";
    });

    expect(setValue).not.toHaveBeenCalled();
    expect(model.value).toBe("ab");

    act(() => keystroke("abc"));
    expect(model.value).toBe("abc");
    expect(runCode()).toBe("abc");
  });
});

describe("code replaced from outside the editor", () => {
  it("Reset puts the starter code back in the editor", () => {
    renderInterface();
    const { model, keystroke } = mountEditor();
    act(() => keystroke("// my work"));

    fireEvent.click(screen.getByLabelText("Reset Code"));

    expect(model.value).toBe(STARTER);
    expect(runCode()).toBe(STARTER);
  });

  it("Reset clears a restored draft the learner hasn't edited", () => {
    window.localStorage.setItem(`${KEY}@anon`, "// my draft");
    renderInterface();
    const { model } = mountEditor();
    expect(model.value).toBe("// my draft");

    fireEvent.click(screen.getByLabelText("Reset Code"));

    expect(model.value).toBe(STARTER);
  });

  it("an applied AI proposal lands in the editor", () => {
    renderInterface();
    const { model, setValue } = mountEditor();

    act(() => h.onApply?.("// proposed"));

    expect(setValue).toHaveBeenCalledWith("// proposed");
    expect(model.value).toBe("// proposed");
    expect(runCode()).toBe("// proposed");
  });

  it("leaves the editor alone when the code already matches", () => {
    renderInterface();
    const { setValue, keystroke } = mountEditor();
    act(() => keystroke("// same"));

    act(() => h.onApply?.("// same"));

    expect(setValue).not.toHaveBeenCalled();
  });
});
