"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: string;
};

export function CodeEditor({ value, onChange, language = "typescript" }: CodeEditorProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-md border">
      <MonacoEditor
        height="420px"
        theme="vs-dark"
        language={language}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true
        }}
      />
    </div>
  );
}
