"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { rust } from "@codemirror/lang-rust";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";

export type CodeLanguage = "rust" | "typescript" | "javascript" | "json" | "text";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeLanguage;
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
  className?: string;
}

function getLanguageExtension(lang: CodeLanguage) {
  switch (lang) {
    case "rust":
      return rust();
    case "typescript":
      return javascript({ typescript: true });
    case "javascript":
      return javascript();
    case "json":
      return json();
    default:
      return [];
  }
}

/* Minimal light theme */
const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "#fafafa",
    color: "#1a1a1a",
  },
  ".cm-gutters": {
    backgroundColor: "#f5f5f5",
    color: "#a3a3a3",
    borderRight: "1px solid #e5e5e5",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#ebebeb",
  },
  ".cm-activeLine": {
    backgroundColor: "#f0f0f0",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#111",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "#d7d4f0",
  },
  ".cm-selectionMatch": {
    backgroundColor: "#e8e6f0",
  },
});

export function CodeEditor({
  value,
  onChange,
  language = "rust",
  readOnly = false,
  height = "300px",
  className = "",
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const createState = useCallback(
    (doc: string) => {
      return EditorState.create({
        doc,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          foldGutter(),
          history(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          getLanguageExtension(language),
          isDark ? oneDark : lightTheme,
          keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            indentWithTab,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current?.(update.state.doc.toString());
            }
          }),
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.theme({
            "&": { height, maxHeight: "600px" },
            ".cm-scroller": { overflow: "auto" },
          }),
        ],
      });
    },
    [language, isDark, readOnly, height]
  );

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: createState(value),
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only re-create on structural changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createState]);

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden text-sm font-mono ${className}`}
    />
  );
}
