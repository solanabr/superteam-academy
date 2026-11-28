// @vitest-environment jsdom
// Compiler errors and warnings shown in the editor after a build.
import { createRef } from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { EditorProps, Monaco, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import messages from "@/messages/en.json";
import { CodeEditor } from "../code-editor";
import type { CodeEditorHandle, EditorMarker } from "../types";

const captured = vi.hoisted(() => ({
  props: null as unknown,
}));

vi.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: (props: unknown) => {
    captured.props = props;
    return <div data-testid="monaco-editor" />;
  },
  loader: { config: vi.fn() },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));

function editorProps(): EditorProps {
  return captured.props as EditorProps;
}

const SOURCE = [
  "use anchor_lang::prelude::*;",
  "",
  "pub fn ping() -> u64 {",
  "    missing_value + (1)",
  "}",
].join("\n");

const SEVERITY = { Error: 8, Warning: 4 };

/** The parts of a text model the markers read, over a fixed text. */
function makeFakeModel(text: string) {
  const lines = text.split("\n");
  const lineAt = (lineNumber: number) => lines[lineNumber - 1] ?? "";
  return {
    getLineCount: () => lines.length,
    getLineMaxColumn: (lineNumber: number) => lineAt(lineNumber).length + 1,
    getLineFirstNonWhitespaceColumn: (lineNumber: number) =>
      lineAt(lineNumber).search(/\S/) + 1,
    getWordAtPosition: (position: { lineNumber: number; column: number }) => {
      for (const match of lineAt(position.lineNumber).matchAll(/\w+/g)) {
        const startColumn = match.index + 1;
        const endColumn = startColumn + match[0].length;
        if (startColumn <= position.column && position.column <= endColumn) {
          return { word: match[0], startColumn, endColumn };
        }
      }
      return null;
    },
  };
}

function renderEditor() {
  const ref = createRef<CodeEditorHandle>();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CodeEditor
        ref={ref}
        lessonId="lesson-test"
        initialCode={SOURCE}
        language="rust"
      />
    </NextIntlClientProvider>
  );
  return ref;
}

/** Render the editor and mount stand-ins for the Monaco editor and namespace. */
function mountEditor() {
  const ref = renderEditor();
  const model = makeFakeModel(SOURCE);
  const domNode = document.createElement("div");
  const editorFake = {
    onDidFocusEditorWidget: () => ({ dispose: vi.fn() }),
    onDidBlurEditorWidget: () => ({ dispose: vi.fn() }),
    getDomNode: () => domNode,
    setValue: vi.fn(),
    getValue: () => SOURCE,
    getModel: () => model,
    setPosition: vi.fn(),
    revealPositionInCenterIfOutsideViewport: vi.fn(),
    focus: vi.fn(),
  };
  const setModelMarkers = vi.fn();
  const monaco = { MarkerSeverity: SEVERITY, editor: { setModelMarkers } };
  act(() => {
    (editorProps().onMount as OnMount)(
      editorFake as unknown as editor.IStandaloneCodeEditor,
      monaco as unknown as Monaco
    );
  });

  return {
    handle: ref.current as CodeEditorHandle,
    model,
    editorFake,
    setModelMarkers,
    /** The marker list of the latest call. */
    shown: () => setModelMarkers.mock.calls.at(-1)?.[2] as editor.IMarkerData[],
    type: (code: string) =>
      act(() => {
        (editorProps().onChange as (value: string | undefined) => void)(code);
      }),
  };
}

const error: EditorMarker = {
  line: 4,
  column: 5,
  endLine: 4,
  endColumn: 18,
  severity: "error",
  code: "E0425",
  message: "cannot find value `missing_value` in this scope",
};

const warning: EditorMarker = {
  line: 3,
  column: 8,
  endLine: 3,
  endColumn: 12,
  severity: "warning",
  code: null,
  message: "function `ping` is never used",
};

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("CodeEditor build markers", () => {
  it("sets an error and a warning with the matching severities", () => {
    const { handle, model, setModelMarkers } = mountEditor();

    handle.setMarkers([error, warning]);

    expect(setModelMarkers).toHaveBeenCalledTimes(1);
    expect(setModelMarkers).toHaveBeenCalledWith(model, "build", [
      {
        startLineNumber: 4,
        startColumn: 5,
        endLineNumber: 4,
        endColumn: 18,
        severity: SEVERITY.Error,
        message: "cannot find value `missing_value` in this scope [E0425]",
      },
      {
        startLineNumber: 3,
        startColumn: 8,
        endLineNumber: 3,
        endColumn: 12,
        severity: SEVERITY.Warning,
        message: "function `ping` is never used",
      },
    ]);
  });

  it("gives Monaco the message as a string and nothing it makes a link from", () => {
    const { handle, shown } = mountEditor();
    const message =
      "[open](command:workbench.action.terminal.new) <img src=x onerror=alert(1)> **bold**";

    handle.setMarkers([
      { ...error, message, code: "[x](http://example.test)" },
    ]);

    const [marker] = shown();
    // Monaco shows a string message as text. Its hover makes links only from a
    // `code` object with a target and from `relatedInformation`.
    expect(marker?.message).toBe(`${message} [[x](http://example.test)]`);
    expect(Object.keys(marker ?? {}).sort()).toEqual([
      "endColumn",
      "endLineNumber",
      "message",
      "severity",
      "startColumn",
      "startLineNumber",
    ]);
  });

  it("marks the word at the position when the span has no end", () => {
    const { handle, shown } = mountEditor();

    handle.setMarkers([{ ...error, column: 5, endColumn: 5 }]);

    expect(shown()[0]).toMatchObject({
      startLineNumber: 4,
      startColumn: 5,
      endLineNumber: 4,
      endColumn: 18,
    });
  });

  it("marks the whole line when the span has no end and no word is there", () => {
    const { handle, shown } = mountEditor();

    // Column 21 of line 4 is the opening parenthesis.
    handle.setMarkers([{ ...error, column: 21, endColumn: 21 }]);

    expect(shown()[0]).toMatchObject({
      startLineNumber: 4,
      startColumn: 5,
      endLineNumber: 4,
      endColumn: 24,
    });
  });

  it("leaves out a marker on a line the editor does not have", () => {
    const { handle, shown } = mountEditor();

    handle.setMarkers([{ ...error, line: 40, endLine: 40 }, error]);

    expect(shown()).toHaveLength(1);
    expect(shown()[0]?.startLineNumber).toBe(4);
  });

  it("clears the markers", () => {
    const { handle, model, setModelMarkers } = mountEditor();
    handle.setMarkers([error]);

    handle.clearMarkers();

    expect(setModelMarkers).toHaveBeenLastCalledWith(model, "build", []);
  });

  it("does not ask Monaco to clear markers when none are set", () => {
    const { handle, setModelMarkers } = mountEditor();

    handle.clearMarkers();
    expect(setModelMarkers).not.toHaveBeenCalled();

    handle.setMarkers([error]);
    handle.clearMarkers();
    handle.clearMarkers();
    expect(setModelMarkers).toHaveBeenCalledTimes(2);
  });

  it("clears every marker on the first edit after they are set", () => {
    const { handle, model, setModelMarkers, type } = mountEditor();
    handle.setMarkers([error, warning]);
    expect(setModelMarkers).toHaveBeenCalledTimes(1);

    type(`${SOURCE}\n// fixed`);

    expect(setModelMarkers).toHaveBeenCalledTimes(2);
    expect(setModelMarkers).toHaveBeenLastCalledWith(model, "build", []);

    // Later edits have nothing to clear.
    type(`${SOURCE}\n// fixed again`);
    expect(setModelMarkers).toHaveBeenCalledTimes(2);
  });

  it("does not touch markers on an edit when none are set", () => {
    const { handle, setModelMarkers, type } = mountEditor();

    type(`${SOURCE}\n// typing`);
    expect(setModelMarkers).not.toHaveBeenCalled();

    handle.setMarkers([]);
    type(`${SOURCE}\n// typing more`);
    expect(setModelMarkers).toHaveBeenCalledTimes(1);
  });

  it("does nothing before the editor has mounted", () => {
    const ref = renderEditor();

    expect(() => {
      ref.current?.setMarkers([error]);
      ref.current?.clearMarkers();
      ref.current?.goTo(4, 5);
    }).not.toThrow();
  });

  it("moves the cursor to a position and focuses the editor", () => {
    const { handle, editorFake } = mountEditor();

    handle.goTo(4, 5);

    const position = { lineNumber: 4, column: 5 };
    expect(editorFake.setPosition).toHaveBeenCalledWith(position);
    expect(
      editorFake.revealPositionInCenterIfOutsideViewport
    ).toHaveBeenCalledWith(position);
    expect(editorFake.focus).toHaveBeenCalled();
  });
});
