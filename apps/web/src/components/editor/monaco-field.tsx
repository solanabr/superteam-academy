"use client";

import { useCallback } from "react";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { superteamDark, superteamLight, THEME_MAP } from "./themes";
import { cn } from "@/lib/utils";

interface MonacoFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Lesson language: "typescript" | "rust" (falls back to plaintext). */
  language: string;
  ariaLabel: string;
  placeholder?: string;
  /** Editor height (any CSS length). Defaults to 14rem. */
  height?: string;
  className?: string;
}

function toMonacoLanguage(language: string): string {
  switch (language) {
    case "typescript":
      return "typescript";
    case "rust":
      return "rust";
    default:
      return "plaintext";
  }
}

// Shown while the Monaco chunk loads, so the field doesn't flash the library's
// default "Loading..." text (parity with the challenge CodeEditor skeleton).
function FieldSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-2 bg-[var(--surface)] p-3">
      <div className="h-3 w-24 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-3 w-40 animate-pulse rounded [background:var(--border-default)]" />
      <div className="h-3 w-32 animate-pulse rounded [background:var(--border-default)]" />
    </div>
  );
}

/**
 * Controlled, theme-aware Monaco editor for authoring code (starter code /
 * solution) in the teacher course builder. Deliberately NOT the challenge
 * `CodeEditor`: that one autosaves to localStorage keyed by `lessonId`, which
 * would collide between the code and solution fields and across unsaved lessons.
 * This field is fully controlled by React state and does no persistence.
 */
export function MonacoField({
  value,
  onChange,
  language,
  ariaLabel,
  placeholder,
  height = "14rem",
  className,
}: MonacoFieldProps) {
  const { resolvedTheme } = useTheme();
  const themeName =
    resolvedTheme === "light" ? THEME_MAP.light : THEME_MAP.dark;

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme("superteam-dark", superteamDark);
    monaco.editor.defineTheme("superteam-light", superteamLight);
    // Authoring code references packages that can't resolve in the browser
    // (e.g. @solana/web3.js) — suppress semantic squiggles, keep syntax checks.
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSuggestionDiagnostics: true,
    });
  }, []);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border",
        className
      )}
      style={{ height }}
    >
      <Editor
        value={value}
        language={toMonacoLanguage(language)}
        theme={themeName}
        beforeMount={handleBeforeMount}
        onChange={(v) => onChange(v ?? "")}
        loading={<FieldSkeleton />}
        options={{
          ariaLabel,
          placeholder,
          minimap: { enabled: false },
          fontSize: 13,
          lineHeight: 20,
          fontFamily:
            "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 8, bottom: 8 },
          lineNumbersMinChars: 3,
          folding: false,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerLanes: 0,
          overviewRulerBorder: false,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
}
