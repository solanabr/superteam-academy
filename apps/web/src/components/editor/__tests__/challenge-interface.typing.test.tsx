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
import { ChallengeInterface } from "../challenge-interface";

const h = vi.hoisted(() => ({
  editorProps: null as unknown,
  onApply: null as ((proposed: string) => void) | null,
  runnerCode: null as string | null,
}));

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
  ChallengeRunner: (props: { code: string }) => {
    h.runnerCode = props.code;
    return null;
  },
}));
vi.mock("../ai-partner/ai-partner-pane", () => ({
  AiPartnerPane: (props: { onApply: (proposed: string) => void }) => {
    h.onApply = props.onApply;
    return null;
  },
}));

const STARTER = "// starter";

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

function renderInterface() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChallengeInterface
        lessonId="lesson-1"
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
  h.runnerCode = null;
});

afterEach(cleanup);

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
    expect(h.runnerCode).toBe("abc");
  });
});

describe("code replaced from outside the editor", () => {
  it("Reset puts the starter code back in the editor", () => {
    renderInterface();
    const { model, keystroke } = mountEditor();
    act(() => keystroke("// my work"));

    fireEvent.click(screen.getByLabelText("Reset Code"));

    expect(model.value).toBe(STARTER);
    expect(h.runnerCode).toBe(STARTER);
  });

  it("Reset clears a restored draft the learner hasn't edited", () => {
    window.localStorage.setItem("superteam-lms-code-lesson-1", "// my draft");
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
    expect(h.runnerCode).toBe("// proposed");
  });

  it("leaves the editor alone when the code already matches", () => {
    renderInterface();
    const { setValue, keystroke } = mountEditor();
    act(() => keystroke("// same"));

    act(() => h.onApply?.("// same"));

    expect(setValue).not.toHaveBeenCalled();
  });
});
