// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { EditorProps, Monaco, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import messages from "@/messages/en.json";
import { CodeEditor, resetEditorStorage } from "../code-editor";

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

describe("CodeEditor autosave storage", () => {
  const LEGACY_KEY = "superteam-lms-code-lesson-test";

  function renderScoped(storageScope?: string) {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CodeEditor
          lessonId="lesson-test"
          initialCode="const a = 1;"
          language="typescript"
          storageScope={storageScope}
        />
      </NextIntlClientProvider>
    );
  }

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
  });

  function typeInto(code: string) {
    act(() => {
      (editorProps().onChange as (value: string | undefined) => void)(code);
      vi.advanceTimersByTime(1500);
    });
  }

  it("keeps a single-block lesson on the lesson-only key", () => {
    window.localStorage.setItem(LEGACY_KEY, "// saved before this change");
    renderScoped();
    const fake = mountFakeEditor();
    expect(fake.instance.setValue).toHaveBeenCalledWith(
      "// saved before this change"
    );

    typeInto("// new work");
    expect(window.localStorage.getItem(LEGACY_KEY)).toBe("// new work");
    expect(window.localStorage.length).toBe(1);
  });

  it("saves and restores two blocks of one lesson independently", () => {
    renderScoped("first");
    mountFakeEditor();
    typeInto("// first");
    cleanup();

    renderScoped("second");
    const second = mountFakeEditor();
    expect(second.instance.setValue).not.toHaveBeenCalled();
    typeInto("// second");
    cleanup();

    renderScoped("first");
    const first = mountFakeEditor();
    expect(first.instance.setValue).toHaveBeenCalledWith("// first");
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(window.localStorage.length).toBe(2);
  });

  it("doesn't load the lesson-only key into a scoped editor", () => {
    window.localStorage.setItem(LEGACY_KEY, "// whichever editor saved last");
    renderScoped("first");
    const fake = mountFakeEditor();
    expect(fake.instance.setValue).not.toHaveBeenCalled();
  });

  it("resets only the scope it's given", () => {
    renderScoped("first");
    mountFakeEditor();
    typeInto("// first");
    cleanup();
    renderScoped("second");
    mountFakeEditor();
    typeInto("// second");
    window.localStorage.setItem(LEGACY_KEY, "// legacy");

    resetEditorStorage("lesson-test", "second");
    expect(window.localStorage.length).toBe(2);
    expect(window.localStorage.getItem(LEGACY_KEY)).toBe("// legacy");

    resetEditorStorage("lesson-test");
    expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(window.localStorage.length).toBe(1);
  });
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
