"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-xl border border-white/10 bg-zinc-950 text-sm text-zinc-400">
      Loading editor...
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export function CodeEditor({ value, onChange, language = "typescript" }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <MonacoEditor
      height="100%"
      language={language}
      theme={resolvedTheme === "light" ? "vs-light" : "vs-dark"}
      value={value}
      onChange={(newValue) => onChange(newValue ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        smoothScrolling: true,
        padding: { top: 14 },
      }}
    />
  );
}
