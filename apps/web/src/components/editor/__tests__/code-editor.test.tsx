// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { EditorProps, Monaco, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { CodeEditor } from "../code-editor";
import messages from "@/messages/en.json";

const captured = vi.hoisted(() => ({
  props: null as unknown,
}));

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

function editorProps(): EditorProps {
  return captured.props as EditorProps;
}

/**
 * Minimal stand-in for Monaco's IStandaloneCodeEditor covering exactly what
 * CodeEditor.handleMount touches, plus manual focus/blur triggers.
 */
function makeFakeEditor() {
  const focusCallbacks: Array<() => void> = [];
  const blurCallbacks: Array<() => void> = [];
  const domNode = document.createElement("div");
  const textarea = document.createElement("textarea");
  domNode.appendChild(textarea);

  const fake = {
    onDidFocusEditorWidget: (cb: () => void) => {
      focusCallbacks.push(cb);
      return { dispose: vi.fn() };
    },
    onDidBlurEditorWidget: (cb: () => void) => {
      blurCallbacks.push(cb);
      return { dispose: vi.fn() };
    },
    getDomNode: () => domNode,
    setValue: vi.fn(),
    getValue: () => "",
  };

  return {
    instance: fake as unknown as editor.IStandaloneCodeEditor,
    textarea,
    focus: () => focusCallbacks.forEach((cb) => cb()),
    blur: () => blurCallbacks.forEach((cb) => cb()),
  };
}

function renderEditor() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CodeEditor
        lessonId="lesson-test"
        initialCode="const a = 1;"
        language="typescript"
      />
    </NextIntlClientProvider>
  );
}

function mountFakeEditor(): ReturnType<typeof makeFakeEditor> {
  const fake = makeFakeEditor();
  const onMount = editorProps().onMount as OnMount;
  act(() => {
    onMount(fake.instance, {} as unknown as Monaco);
  });
  return fake;
}

function setNavigatorPlatform(platform: string): void {
  Object.defineProperty(window.navigator, "platform", {
    value: platform,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  // Remove any per-test platform override (restores jsdom's prototype getter).
  Reflect.deleteProperty(window.navigator, "platform");
});

describe("CodeEditor a11y (LX-C5)", () => {
  it("labels the editor region and associates the escape hint via aria-describedby", () => {
    setNavigatorPlatform("Win32");
    renderEditor();

    const group = screen.getByRole("group", { name: "Code editor" });
    const hintId = group.getAttribute("aria-describedby");
    expect(hintId).toBeTruthy();

    const hint = document.getElementById(hintId as string);
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent(
      "Press Ctrl+M to toggle whether Tab indents code or moves focus out of the editor. Press F8 or Shift+F8 to cycle through errors."
    );
  });

  it("advertises the macOS chord (Ctrl+Shift+M) on Apple platforms", () => {
    setNavigatorPlatform("MacIntel");
    renderEditor();

    const group = screen.getByRole("group", { name: "Code editor" });
    const hint = document.getElementById(
      group.getAttribute("aria-describedby") as string
    );
    expect(hint).toHaveTextContent(/Ctrl\+Shift\+M/);
  });

  it("passes the a11y editor options to Monaco", () => {
    renderEditor();

    const options = editorProps()
      .options as editor.IStandaloneEditorConstructionOptions;
    expect(options.accessibilitySupport).toBe("auto");
    expect(options.ariaLabel).toBe("Code editor");
  });

  it("reveals the hint while the editor has focus and dims it on blur, without unmounting it", () => {
    setNavigatorPlatform("Win32");
    renderEditor();
    const fake = mountFakeEditor();

    const group = screen.getByRole("group", { name: "Code editor" });
    const hint = document.getElementById(
      group.getAttribute("aria-describedby") as string
    ) as HTMLElement;

    expect(hint).not.toHaveAttribute("data-focused");
    expect(hint.className).toContain("opacity-0");

    act(() => fake.focus());
    expect(hint).toHaveAttribute("data-focused", "true");
    expect(hint.className).toContain("opacity-100");

    act(() => fake.blur());
    expect(hint).not.toHaveAttribute("data-focused");
    expect(hint.className).toContain("opacity-0");
    // Still in the DOM (and the accessibility tree) when visually hidden.
    expect(hint).toBeInTheDocument();
  });

  it("wires aria-describedby onto Monaco's focus-receiving textarea", () => {
    renderEditor();
    const fake = mountFakeEditor();

    const group = screen.getByRole("group", { name: "Code editor" });
    expect(fake.textarea.getAttribute("aria-describedby")).toBe(
      group.getAttribute("aria-describedby")
    );
  });

  it("introduces no focus stop of its own (no focusable content in the hint)", () => {
    renderEditor();

    const group = screen.getByRole("group", { name: "Code editor" });
    const hint = document.getElementById(
      group.getAttribute("aria-describedby") as string
    ) as HTMLElement;

    expect(hint).not.toHaveAttribute("tabindex");
    expect(hint.querySelector("a, button, input, [tabindex]")).toBeNull();
  });
});
