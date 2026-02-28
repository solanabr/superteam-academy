"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-background text-muted-foreground font-mono text-sm">
      Loading editor...
    </div>
  ),
});

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: "rust" | "typescript" | "json" | "bash";
  readOnly?: boolean;
  className?: string;
  height?: string;
}

const DARK_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "", foreground: "EDEDED", background: "0D0D0D" },
    { token: "comment", foreground: "666666", fontStyle: "italic" },
    { token: "keyword", foreground: "14F195" },
    { token: "string", foreground: "F5A623" },
    { token: "number", foreground: "9945FF" },
    { token: "type", foreground: "00D4FF" },
  ],
  colors: {
    "editor.background": "#0D0D0D",
    "editor.foreground": "#EDEDED",
    "editorLineNumber.foreground": "#333333",
    "editorLineNumber.activeForeground": "#666666",
    "editor.selectionBackground": "#14F19520",
    "editor.lineHighlightBackground": "#111111",
    "editorCursor.foreground": "#14F195",
    "editor.inactiveSelectionBackground": "#14F19510",
  },
};

export function MonacoEditor({
  value,
  onChange,
  language = "rust",
  readOnly = false,
  className,
  height = "400px",
}: MonacoEditorProps) {
  return (
    <div
      className={cn(
        "border border-border rounded overflow-hidden",
        height === "100%" && "h-full",
        className
      )}
    >
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme="academy-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          tabSize: 4,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "line",
          cursorStyle: "line",
          smoothScrolling: true,
        }}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("academy-dark", DARK_THEME);
        }}
        onMount={(editor) => {
          editor.updateOptions({ theme: "academy-dark" });
        }}
      />
    </div>
  );
}
