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
  loader: { config: vi.fn() },
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
  // The lesson-only key every draft used before drafts were kept per user.
  const LEGACY_KEY = "superteam-lms-code-lesson-test";
  const keyFor = (owner: string, scope?: string) =>
    `${LEGACY_KEY}${scope ? `::${scope}` : ""}@${owner}`;

  function renderScoped(storageScope?: string, userId: string | null = null) {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <CodeEditor
          lessonId="lesson-test"
          userId={userId}
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

  it("keeps a single-block lesson's key unscoped", () => {
    window.localStorage.setItem(keyFor("anon"), "// saved earlier");
    renderScoped();
    const fake = mountFakeEditor();
    expect(fake.instance.setValue).toHaveBeenCalledWith("// saved earlier");

    typeInto("// new work");
    expect(window.localStorage.getItem(keyFor("anon"))).toBe("// new work");
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
    expect(window.localStorage.getItem(keyFor("anon"))).toBeNull();
    expect(window.localStorage.length).toBe(2);
  });

  it("doesn't load the lesson-only key into a scoped editor", () => {
    window.localStorage.setItem(LEGACY_KEY, "// whichever editor saved last");
    renderScoped("first", "user-a");
    const fake = mountFakeEditor();
    expect(fake.instance.setValue).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(LEGACY_KEY)).toBe(
      "// whichever editor saved last"
    );
  });

  describe("per user", () => {
    it("never opens another user's draft", () => {
      renderScoped(undefined, "user-a");
      mountFakeEditor();
      typeInto("// a's work");
      cleanup();

      renderScoped(undefined, "user-b");
      const b = mountFakeEditor();
      expect(b.instance.setValue).not.toHaveBeenCalled();
      typeInto("// b's work");
      cleanup();

      renderScoped(undefined, "user-a");
      const a = mountFakeEditor();
      expect(a.instance.setValue).toHaveBeenCalledWith("// a's work");
      expect(window.localStorage.getItem(keyFor("user:user-b"))).toBe(
        "// b's work"
      );
    });

    it("keeps signed-out work apart from a user's own draft", () => {
      window.localStorage.setItem(keyFor("user:user-a"), "// a's work");
      renderScoped();
      mountFakeEditor();
      typeInto("// signed out");
      cleanup();

      renderScoped(undefined, "user-a");
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// a's work"
      );
      cleanup();

      renderScoped();
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// signed out"
      );
    });

    it("keeps each part of a lesson apart per user", () => {
      renderScoped("second", "user-a");
      mountFakeEditor();
      typeInto("// a, part two");
      cleanup();

      renderScoped("second", "user-b");
      expect(mountFakeEditor().instance.setValue).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(keyFor("user:user-a", "second"))).toBe(
        "// a, part two"
      );
    });
  });

  describe("a draft saved while signed out", () => {
    it("goes to a user who signs in with no draft of their own", () => {
      window.localStorage.setItem(keyFor("anon"), "// tried it signed out");

      renderScoped(undefined, "user-a");
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// tried it signed out"
      );
      expect(window.localStorage.getItem(keyFor("anon"))).toBeNull();
      expect(window.localStorage.getItem(keyFor("user:user-a"))).toBe(
        "// tried it signed out"
      );
      cleanup();

      renderScoped(undefined, "user-b");
      expect(mountFakeEditor().instance.setValue).not.toHaveBeenCalled();
    });

    it("moves with its part", () => {
      window.localStorage.setItem(keyFor("anon", "second"), "// part two");

      renderScoped("second", "user-a");
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// part two"
      );
      expect(window.localStorage.getItem(keyFor("anon", "second"))).toBeNull();
    });

    it("never replaces a user's own draft", () => {
      window.localStorage.setItem(keyFor("anon"), "// signed out");
      window.localStorage.setItem(keyFor("user:user-a"), "// a's work");

      renderScoped(undefined, "user-a");
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// a's work"
      );
      expect(window.localStorage.getItem(keyFor("anon"))).toBe("// signed out");
      expect(window.localStorage.getItem(keyFor("user:user-a"))).toBe(
        "// a's work"
      );
    });

    it("comes before a draft saved before drafts were per user", () => {
      window.localStorage.setItem(keyFor("anon"), "// signed out");
      window.localStorage.setItem(LEGACY_KEY, "// saved before");

      renderScoped(undefined, "user-a");
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// signed out"
      );
      expect(window.localStorage.getItem(keyFor("anon"))).toBeNull();
      expect(window.localStorage.getItem(LEGACY_KEY)).toBe("// saved before");
    });
  });

  describe("a draft saved before drafts were per user", () => {
    it("goes to the first user to open the lesson, once", () => {
      window.localStorage.setItem(LEGACY_KEY, "// saved before");

      renderScoped(undefined, "user-a");
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// saved before"
      );
      expect(window.localStorage.getItem(LEGACY_KEY)).toBeNull();
      expect(window.localStorage.getItem(keyFor("user:user-a"))).toBe(
        "// saved before"
      );
      cleanup();

      renderScoped(undefined, "user-b");
      expect(mountFakeEditor().instance.setValue).not.toHaveBeenCalled();
    });

    it("moves with its part", () => {
      window.localStorage.setItem(`${LEGACY_KEY}::second`, "// part two");

      renderScoped("second", "user-a");
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// part two"
      );
      expect(window.localStorage.getItem(`${LEGACY_KEY}::second`)).toBeNull();
      expect(window.localStorage.getItem(keyFor("user:user-a", "second"))).toBe(
        "// part two"
      );
    });

    it("stays where it is while signed out", () => {
      window.localStorage.setItem(LEGACY_KEY, "// saved before");

      renderScoped();
      expect(mountFakeEditor().instance.setValue).not.toHaveBeenCalled();
      typeInto("// signed out");

      expect(window.localStorage.getItem(LEGACY_KEY)).toBe("// saved before");
    });

    it("doesn't replace a draft the user already has", () => {
      window.localStorage.setItem(LEGACY_KEY, "// saved before");
      window.localStorage.setItem(keyFor("user:user-a"), "// newer");

      renderScoped(undefined, "user-a");
      expect(mountFakeEditor().instance.setValue).toHaveBeenCalledWith(
        "// newer"
      );
      expect(window.localStorage.getItem(keyFor("user:user-a"))).toBe(
        "// newer"
      );
    });
  });

  describe("reporting a restored draft", () => {
    function mountWith(lessonId: string, storageScope?: string) {
      const onChange = vi.fn();
      render(
        <NextIntlClientProvider locale="en" messages={messages}>
          <CodeEditor
            lessonId={lessonId}
            initialCode="const a = 1;"
            language="typescript"
            storageScope={storageScope}
            onChange={onChange}
          />
        </NextIntlClientProvider>
      );
      mountFakeEditor();
      return onChange;
    }

    it("reports each part's own draft", () => {
      window.localStorage.setItem(keyFor("anon", "first"), "// first");
      window.localStorage.setItem(keyFor("anon", "second"), "// second");

      expect(mountWith("lesson-test", "first").mock.calls).toEqual([
        ["// first"],
      ]);
      expect(mountWith("lesson-test", "second").mock.calls).toEqual([
        ["// second"],
      ]);
    });

    it("doesn't report another lesson's draft", () => {
      window.localStorage.setItem(keyFor("anon"), "// other lesson");

      expect(mountWith("lesson-other")).not.toHaveBeenCalled();
    });

    it("doesn't report the lesson-only key to a scoped part", () => {
      window.localStorage.setItem(keyFor("anon"), "// whichever saved last");

      expect(mountWith("lesson-test", "first")).not.toHaveBeenCalled();
    });

    it("reports nothing when nothing was saved", () => {
      expect(mountWith("lesson-test")).not.toHaveBeenCalled();
    });

    it("doesn't rewrite the saved draft", () => {
      window.localStorage.setItem(keyFor("anon"), "// saved");
      const setItem = vi.spyOn(Storage.prototype, "setItem");

      mountWith("lesson-test");
      vi.advanceTimersByTime(1500);

      expect(setItem).not.toHaveBeenCalled();
      setItem.mockRestore();
    });
  });

  it("resets only the scope and user it's given", () => {
    renderScoped("first", "user-a");
    mountFakeEditor();
    typeInto("// first");
    cleanup();
    renderScoped("second", "user-a");
    mountFakeEditor();
    typeInto("// second");
    cleanup();
    renderScoped("second", "user-b");
    mountFakeEditor();
    typeInto("// b's second");

    resetEditorStorage("lesson-test", "second", "user-a");
    expect(window.localStorage.getItem(keyFor("user:user-a", "second"))).toBe(
      null
    );
    expect(window.localStorage.getItem(keyFor("user:user-a", "first"))).toBe(
      "// first"
    );
    expect(window.localStorage.getItem(keyFor("user:user-b", "second"))).toBe(
      "// b's second"
    );

    resetEditorStorage("lesson-test", "first", "user-a");
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
