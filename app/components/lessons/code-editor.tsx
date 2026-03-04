"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { academyEditorTheme } from "./editor-theme";

type Props = {
  value: string;
  onChange: (value: string) => void;
  language: "typescript" | "rust";
  readOnly?: boolean;
  className?: string;
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  className,
}: Props) {
  const extensions = language === "typescript" ? [javascript()] : [rust()];

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      readOnly={readOnly}
      className={className}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
      }}
      theme={academyEditorTheme}
    />
  );
}
