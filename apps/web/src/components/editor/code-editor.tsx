"use client";

import { useCallback, useEffect, useRef } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { superteamDark, superteamLight, THEME_MAP } from "./themes";
import type { CodeEditorProps, EditorLanguage } from "./types";
import { cn } from "@/lib/utils";

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

function EditorSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-2 bg-white p-4 dark:bg-[#333842]">
      <div className="bg-subtle/20 h-4 w-16 animate-pulse rounded" />
      <div className="bg-subtle/20 h-4 w-48 animate-pulse rounded" />
      <div className="bg-subtle/20 h-4 w-32 animate-pulse rounded" />
      <div className="bg-subtle/20 h-4 w-64 animate-pulse rounded" />
      <div className="bg-subtle/20 h-4 w-24 animate-pulse rounded" />
      <div className="bg-subtle/20 h-4 w-56 animate-pulse rounded" />
      <div className="bg-subtle/20 h-4 w-40 animate-pulse rounded" />
      <div className="bg-subtle/20 h-4 w-36 animate-pulse rounded" />
    </div>
  );
}

export function CodeEditor({
  lessonId,
  initialCode,
  language,
  value,
  onChange,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
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
    [lessonId]
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

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-md border",
        className
      )}
      aria-label="Code editor"
    >
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
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 22,
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
          fontLigatures: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "on",
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
          accessibilitySupport: "auto",
        }}
      />
    </div>
  );
}

export function resetEditorStorage(lessonId: string): void {
  try {
    localStorage.removeItem(getStorageKey(lessonId));
  } catch {
    // localStorage may be unavailable
  }
}
