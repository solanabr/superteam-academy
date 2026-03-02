"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full min-h-[400px]" />,
});

interface CodeEditorProps {
  defaultValue?: string;
  language?: "typescript" | "rust" | "javascript";
  readOnly?: boolean;
  onChange?: (value: string | undefined) => void;
  className?: string;
}

export function CodeEditor({
  defaultValue = "",
  language = "typescript",
  readOnly = false,
  onChange,
  className,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const [value, setValue] = useState(defaultValue);

  return (
    <div className={className || "h-[500px] rounded-lg overflow-hidden border border-border"}>
      <MonacoEditor
        height="100%"
        language={language}
        theme={theme === "dark" ? "vs-dark" : "light"}
        value={value}
        onChange={(v) => {
          setValue(v || "");
          onChange?.(v);
        }}
        options={{
          readOnly,
          minimap: { enabled: false },
          lineNumbers: "on",
          wordWrap: "on",
          fontSize: 14,
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          tabSize: 2,
        }}
      />
    </div>
  );
}
