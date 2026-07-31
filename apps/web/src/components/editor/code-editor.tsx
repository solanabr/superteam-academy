"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { superteamDark, superteamLight, THEME_MAP } from "./themes";
import type {
  CodeEditorProps,
  CodeEditorHandle,
  EditorLanguage,
} from "./types";
import { cn } from "@/lib/utils";
import { tabFocusModeChord } from "@/lib/utils/keyboard";

const AUTOSAVE_DELAY_MS = 1000;

function getStorageKey(lessonId: string): string {
  return `superteam-lms-code-${lessonId}`;
}

function getMonacoLanguage(language: EditorLanguage): string {
  switch (language) {
    case "typescript":
      return "typescript";
    case "rust":
      return "rust";
    case "json":
      return "json";
  }
}

/**
 * Whether Monaco ships a document-formatting provider for this language.
 * The TS worker formats TypeScript/JavaScript and the JSON worker formats
 * JSON; Rust is highlight-only, so the Format button hides there rather than
 * offering a control that does nothing (`format()` is the runtime backstop).
 */
export function canFormatLanguage(language: EditorLanguage): boolean {
  return language === "typescript" || language === "json";
}

function EditorSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-2 bg-[var(--surface)] p-4">
      <div className="h-4 w-16 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-48 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-32 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-64 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-24 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-56 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-40 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-4 w-36 animate-pulse rounded [background:var(--border-default)]" />
    </div>
  );
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(
    {
      lessonId,
      initialCode,
      language,
      value,
      onChange,
      readOnly = false,
      className,
    },
    ref
  ) {
    const { resolvedTheme } = useTheme();
    const tA11y = useTranslations("a11y");
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    // Tab-trap escape affordance (LX-C5 / WCAG 2.1.2). Monaco traps Tab by
    // design; the built-in escape is `editor.action.toggleTabFocusMode`, bound
    // to Ctrl+M (Windows/Linux) / Ctrl+Shift+M (macOS). The chord is resolved
    // client-side after mount — during SSR/hydration there is no navigator, so
    // rendering it eagerly would mismatch on Macs.
    const hintId = useId();
    const [escapeChord, setEscapeChord] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const focusListenersRef = useRef<IDisposable[]>([]);

    useEffect(() => {
      setEscapeChord(tabFocusModeChord());
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editorRef.current,
        format: async () => {
          const action = editorRef.current?.getAction(
            "editor.action.formatDocument"
          );
          // Monaco keeps the action registered but unsupported when no
          // formatting provider is installed for the model's language; running
          // it then silently does nothing.
          if (!action || action.isSupported() === false) return false;
          await action.run();
          return true;
        },
      }),
      []
    );

    const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isExternalUpdate = useRef(false);

    const themeName =
      resolvedTheme === "light" ? THEME_MAP.light : THEME_MAP.dark;

    const handleBeforeMount: BeforeMount = useCallback((monaco) => {
      monaco.editor.defineTheme("superteam-dark", superteamDark);
      monaco.editor.defineTheme("superteam-light", superteamLight);

      // Disable semantic validation (cannot resolve @solana/web3.js in browser)
      // Keep syntax validation so typos are still caught
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSuggestionDiagnostics: true,
      });
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSuggestionDiagnostics: true,
      });
    }, []);

    const handleMount: OnMount = useCallback(
      (editorInstance) => {
        editorRef.current = editorInstance;

        // Show the Tab-trap escape hint while the editor owns the keyboard.
        focusListenersRef.current.push(
          editorInstance.onDidFocusEditorWidget(() => setIsFocused(true)),
          editorInstance.onDidBlurEditorWidget(() => setIsFocused(false))
        );

        // Associate the hint with the element that actually receives focus.
        // Monaco has no public describedby option (only `ariaLabel`), so this
        // reaches for its hidden <textarea>; the group-level aria-describedby
        // below remains the fallback if the internal structure ever changes.
        editorInstance
          .getDomNode()
          ?.querySelector("textarea")
          ?.setAttribute("aria-describedby", hintId);

        // Restore saved code from localStorage
        try {
          const saved = localStorage.getItem(getStorageKey(lessonId));
          if (saved) {
            editorInstance.setValue(saved);
          }
        } catch {
          // localStorage may be unavailable
        }
      },
      [lessonId, hintId]
    );

    const handleChange = useCallback(
      (value: string | undefined) => {
        const code = value ?? "";
        onChange?.(code);

        // Debounced autosave
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
        autosaveTimerRef.current = setTimeout(() => {
          try {
            localStorage.setItem(getStorageKey(lessonId), code);
          } catch {
            // localStorage may be unavailable
          }
        }, AUTOSAVE_DELAY_MS);
      },
      [lessonId, onChange]
    );

    // Sync external value changes (Reset / Show Solution) into Monaco
    useEffect(() => {
      if (value === undefined) return;
      const editor = editorRef.current;
      if (!editor) return;
      const currentValue = editor.getValue();
      if (currentValue !== value) {
        isExternalUpdate.current = true;
        editor.setValue(value);
        isExternalUpdate.current = false;
      }
    }, [value]);

    // Cleanup autosave timer + focus listeners on unmount
    useEffect(() => {
      const focusListeners = focusListenersRef.current;
      return () => {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
        focusListeners.forEach((listener) => listener.dispose());
        focusListeners.length = 0;
      };
    }, []);

    return (
      <div
        role="group"
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden rounded-md border",
          className
        )}
        aria-label={tA11y("codeEditor")}
        aria-describedby={hintId}
      >
        <div className="relative min-h-0 flex-1">
          <Editor
            defaultValue={initialCode}
            language={getMonacoLanguage(language)}
            theme={themeName}
            beforeMount={handleBeforeMount}
            onMount={handleMount}
            onChange={handleChange}
            loading={<EditorSkeleton />}
            options={{
              readOnly,
              // Names Monaco's focus target (its hidden <textarea>) for screen
              // readers; the group label alone is not announced on focus.
              ariaLabel: tA11y("codeEditor"),
              minimap: { enabled: false },
              fontSize: 14,
              lineHeight: 22,
              fontFamily:
                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
              fontLigatures: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: "off",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: "line",
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              suggest: {
                showKeywords: true,
                showSnippets: true,
              },
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
              },
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              fixedOverflowWidgets: true,
              contextmenu: true,
              // "auto" defers to Monaco's screen-reader detection, which also
              // scales accessibilityPageSize. Tab focus mode itself stays OFF by
              // default (Tab indents while coding); the built-in
              // `editor.action.toggleTabFocusMode` chord advertised by the hint
              // below is the escape (WCAG 2.1.2), and F8 / Shift+F8 marker
              // navigation works against the syntax-only diagnostics configured
              // in beforeMount.
              accessibilitySupport: "auto",
            }}
          />
        </div>

        {/* Tab-trap escape hint — reserved strip, so its appearance on focus
            never shifts the layout. Plain text (no focusable content: it must
            not add a keyboard stop of its own) that fades in while the editor
            owns the keyboard. It stays in the accessibility tree at opacity-0,
            keeping the aria-describedby associations valid at all times.
            {escapeChord} is null until mount (SSR has no navigator). */}
        <p
          id={hintId}
          data-focused={isFocused || undefined}
          className={cn(
            "min-h-7 shrink-0 border-t border-border bg-card px-3 py-1.5 text-xs text-text-3 transition-opacity motion-reduce:transition-none",
            isFocused ? "opacity-100" : "opacity-0"
          )}
        >
          {escapeChord
            ? tA11y("editorKeyboardHint", { chord: escapeChord })
            : " "}
        </p>
      </div>
    );
  }
);

export function resetEditorStorage(lessonId: string): void {
  try {
    localStorage.removeItem(getStorageKey(lessonId));
  } catch {
    // localStorage may be unavailable
  }
}
