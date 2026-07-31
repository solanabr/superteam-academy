// @vitest-environment jsdom
import { createRef } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { EditorProps, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import messages from "@/messages/en.json";
import { formatCode } from "@/lib/editor/format-code";
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

/** The owner's report: a markdown fence pasted in, so line 1 opens with a bare
 *  `typescript` token and the whole function sits on one line. */
const PASTE_ARTIFACT =
  "typescript function decodeVault(data: Uint8Array): {discriminator: number} {const d = data[0]; return {discriminator: d};}";
const VALID_ONE_LINER =
  "function decodeVault(data: Uint8Array): {discriminator: number} {const d = data[0]; return {discriminator: d};}";

/**
 * Stand-in for Monaco's IStandaloneCodeEditor covering what CodeEditor touches
 * on mount, plus the model read/write that `format()` performs.
 */
function makeFakeEditor(initial: string) {
  const domNode = document.createElement("div");
  domNode.appendChild(document.createElement("textarea"));
  const state = { value: initial };
  const executeEdits = vi.fn((_source: string, edits: { text: string }[]) => {
    if (edits[0]) state.value = edits[0].text;
    return true;
  });
  const model = {
    getValue: () => state.value,
    getFullModelRange: () => ({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1,
    }),
  };
  const instance = {
    onDidFocusEditorWidget: () => ({ dispose: vi.fn() }),
    onDidBlurEditorWidget: () => ({ dispose: vi.fn() }),
    getDomNode: () => domNode,
    setValue: vi.fn(),
    getValue: () => state.value,
    getModel: () => model,
    executeEdits,
    pushUndoStop: vi.fn(),
  };
  return {
    instance: instance as unknown as editor.IStandaloneCodeEditor,
    state,
    executeEdits,
  };
}

function mountEditor(
  initial: string,
  language: "typescript" | "json" | "rust" = "typescript"
) {
  const ref = createRef<CodeEditorHandle>();
  const fake = makeFakeEditor(initial);
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CodeEditor
        ref={ref}
        lessonId="lesson-1"
        initialCode={initial}
        language={language}
      />
    </NextIntlClientProvider>
  );
  act(() => {
    (captured.props as EditorProps).onMount!(
      fake.instance,
      {} as Parameters<OnMount>[1]
    );
  });
  return { ref, ...fake };
}

afterEach(cleanup);

describe("canFormatLanguage", () => {
  it("covers exactly the languages we can format", () => {
    expect(canFormatLanguage("typescript")).toBe(true);
    expect(canFormatLanguage("json")).toBe(true);
    // No Prettier plugin for Rust — the toolbar hides the button entirely.
    expect(canFormatLanguage("rust")).toBe(false);
  });
});

describe("formatCode", () => {
  it("REFLOWS a one-liner onto multiple lines", async () => {
    const result = await formatCode(VALID_ONE_LINER, "typescript");

    expect(result.status).toBe("formatted");
    if (result.status !== "formatted") return;
    // The regression this fix exists for: Monaco's built-in TS formatter is
    // whitespace-only, so it left this a single line — which read to the owner
    // as "the button does nothing".
    expect(result.code.split("\n").length).toBeGreaterThan(3);
    expect(result.code).toContain("const d = data[0];");
  });

  it("fixes indentation on multi-line code", async () => {
    const result = await formatCode(
      "function f() {\n        const a = 1;\n            if (a) {\nreturn a;\n}\n}\n",
      "typescript"
    );
    expect(result.status).toBe("formatted");
    if (result.status !== "formatted") return;
    expect(result.code).toContain("  const a = 1;");
  });

  it("reports syntax-error for the paste artifact instead of no-oping", async () => {
    expect((await formatCode(PASTE_ARTIFACT, "typescript")).status).toBe(
      "syntax-error"
    );
  });

  it("reports syntax-error for unbalanced braces", async () => {
    expect(
      (await formatCode("function f() { const a = 1;", "typescript")).status
    ).toBe("syntax-error");
  });

  it("reports unchanged for already-formatted code", async () => {
    expect((await formatCode("const a = 1;\n", "typescript")).status).toBe(
      "unchanged"
    );
  });

  it("formats JSON, and rejects invalid JSON", async () => {
    const ok = await formatCode('{"b":1,"a":[1,2,   3]}', "json");
    expect(ok.status).toBe("formatted");
    if (ok.status === "formatted") expect(ok.code).toContain('"b": 1');

    expect((await formatCode("{'not': json,}", "json")).status).toBe(
      "syntax-error"
    );
  });

  it("reports unsupported for Rust", async () => {
    expect((await formatCode("fn main() {}", "rust")).status).toBe(
      "unsupported"
    );
  });
});

describe("CodeEditorHandle.format()", () => {
  it("writes the reformatted code back through executeEdits", async () => {
    const { ref, state, executeEdits } = mountEditor(VALID_ONE_LINER);

    await expect(ref.current!.format()).resolves.toBe("formatted");
    expect(state.value.split("\n").length).toBeGreaterThan(3);
    // executeEdits (not setValue) keeps the reformat one undoable step.
    expect(executeEdits).toHaveBeenCalledTimes(1);
  });

  it("reports syntax-error and leaves the buffer untouched", async () => {
    const { ref, state, executeEdits } = mountEditor(PASTE_ARTIFACT);

    await expect(ref.current!.format()).resolves.toBe("syntax-error");
    expect(state.value).toBe(PASTE_ARTIFACT);
    expect(executeEdits).not.toHaveBeenCalled();
  });

  it("reports unchanged without touching the buffer", async () => {
    const { ref, executeEdits } = mountEditor("const a = 1;\n");

    await expect(ref.current!.format()).resolves.toBe("unchanged");
    expect(executeEdits).not.toHaveBeenCalled();
  });

  it("reports unsupported for a Rust buffer", async () => {
    const { ref } = mountEditor("fn main() {}", "rust");
    await expect(ref.current!.format()).resolves.toBe("unsupported");
  });

  it("reports unsupported before the editor has mounted", async () => {
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
    await expect(ref.current!.format()).resolves.toBe("unsupported");
  });
});
