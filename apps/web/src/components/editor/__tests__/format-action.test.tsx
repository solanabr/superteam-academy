// @vitest-environment jsdom
import { createRef } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { EditorProps, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import messages from "@/messages/en.json";
import { CodeEditor } from "../code-editor";
import { canFormatLanguage } from "../formatting";
import type { CodeEditorHandle } from "../types";

const captured = vi.hoisted(() => ({ props: null as unknown }));

vi.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: (props: unknown) => {
    captured.props = props;
    return <div data-testid="monaco-editor" />;
  },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark" }),
}));

/**
 * Stand-in for Monaco's IStandaloneCodeEditor covering what CodeEditor touches
 * on mount, plus a configurable `editor.action.formatDocument`.
 */
function makeFakeEditor(action: unknown | null) {
  const domNode = document.createElement("div");
  domNode.appendChild(document.createElement("textarea"));
  return {
    onDidFocusEditorWidget: () => ({ dispose: vi.fn() }),
    onDidBlurEditorWidget: () => ({ dispose: vi.fn() }),
    getDomNode: () => domNode,
    setValue: vi.fn(),
    getValue: () => "",
    getAction: (id: string) =>
      id === "editor.action.formatDocument" ? action : null,
  } as unknown as editor.IStandaloneCodeEditor;
}

function mountEditor(action: unknown | null) {
  const ref = createRef<CodeEditorHandle>();
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CodeEditor
        ref={ref}
        lessonId="lesson-1"
        initialCode=""
        language="typescript"
      />
    </NextIntlClientProvider>
  );
  act(() => {
    (captured.props as EditorProps).onMount!(
      makeFakeEditor(action),
      {} as Parameters<OnMount>[1]
    );
  });
  return ref;
}

afterEach(cleanup);

describe("canFormatLanguage", () => {
  it("covers exactly the languages Monaco ships a formatter for", () => {
    expect(canFormatLanguage("typescript")).toBe(true);
    expect(canFormatLanguage("json")).toBe(true);
    // Rust is highlight-only — the toolbar hides the button rather than
    // offering a control that silently does nothing.
    expect(canFormatLanguage("rust")).toBe(false);
  });
});

describe("CodeEditorHandle.format()", () => {
  it("runs Monaco's formatDocument action and reports success", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const ref = mountEditor({ isSupported: () => true, run });

    await expect(ref.current!.format()).resolves.toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("reports false and never runs when no formatter is installed", async () => {
    const run = vi.fn();
    // Monaco keeps the action registered but unsupported when the model's
    // language has no formatting provider; running it would be a no-op.
    const ref = mountEditor({ isSupported: () => false, run });

    await expect(ref.current!.format()).resolves.toBe(false);
    expect(run).not.toHaveBeenCalled();
  });

  it("reports false when the action is absent entirely", async () => {
    const ref = mountEditor(null);
    await expect(ref.current!.format()).resolves.toBe(false);
  });

  it("reports false before the editor has mounted", async () => {
    const ref = createRef<CodeEditorHandle>();
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CodeEditor
          ref={ref}
          lessonId="lesson-1"
          initialCode=""
          language="typescript"
        />
      </NextIntlClientProvider>
    );
    await expect(ref.current!.format()).resolves.toBe(false);
  });
});
