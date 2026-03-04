"use client";

import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readonly?: boolean;
}

/**
 * Code Editor Component
 *
 * This is a lightweight code editor wrapper.
 * In production, integrate Monaco Editor or CodeMirror for full IDE experience.
 *
 * To add Monaco:
 * 1. pnpm add @monaco-editor/react
 * 2. Replace this component with Monaco implementation
 *
 * To add CodeMirror:
 * 1. pnpm add @codemirror/view @codemirror/state @codemirror/lang-rust
 * 2. Replace this component with CodeMirror implementation
 */
export function CodeEditor({
  value,
  onChange,
  language = "rust",
  readonly = false,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([1]);

  // Update line numbers when value changes
  useEffect(() => {
    const lines = value.split("\n").length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [value]);

  // Handle tab key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newValue =
        value.substring(0, start) + "    " + value.substring(end);
      onChange(newValue);

      // Set cursor position after tab
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Sync scroll between line numbers and code
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbersEl = document.getElementById("line-numbers");
    if (lineNumbersEl) {
      lineNumbersEl.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="h-full flex font-mono text-sm bg-[hsl(var(--editor-bg))]">
      {/* Line Numbers */}
      <div
        id="line-numbers"
        className="flex-shrink-0 w-12 py-4 overflow-hidden select-none text-right pr-3 bg-[hsl(var(--editor-line-bg))] text-[hsl(var(--editor-line))]"
      >
        {lineNumbers.map((num) => (
          <div key={num} className="leading-6">
            {num}
          </div>
        ))}
      </div>

      {/* Code Area */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readonly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="absolute inset-0 w-full h-full p-4 resize-none bg-transparent text-[hsl(var(--editor-text))] outline-none leading-6 overflow-auto"
          placeholder={`// Write your ${language} code here...`}
        />
      </div>
    </div>
  );
}

/**
 * Monaco Editor Integration Example:
 *
 * import Editor from "@monaco-editor/react";
 *
 * export function CodeEditor({ value, onChange, language, readonly }: CodeEditorProps) {
 *   const { resolvedTheme } = useTheme();
 *
 *   return (
 *     <Editor
 *       height="100%"
 *       language={language}
 *       value={value}
 *       theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
 *       onChange={(v) => onChange(v || "")}
 *       options={{
 *         readOnly: readonly,
 *         minimap: { enabled: false },
 *         fontSize: 14,
 *         lineNumbers: "on",
 *         scrollBeyondLastLine: false,
 *         automaticLayout: true,
 *         tabSize: 4,
 *         wordWrap: "on",
 *       }}
 *     />
 *   );
 * }
 */
