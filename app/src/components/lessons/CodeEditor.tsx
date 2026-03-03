"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import Editor, { type Monaco, type OnMount } from "@monaco-editor/react";

export type SupportedLanguage = "javascript" | "typescript" | "rust" | "json";

type CodeEditorProps = {
  initialValue?: string;
  language: SupportedLanguage;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  className?: string;
  onGetCode?: (getCode: () => string) => void;
};

// TS error codes to ignore
const IGNORED_TS_ERROR_CODES = new Set([2307, 2304, 2468, 1378, 1375, 7016]);

export function CodeEditor({
  initialValue = "",
  language,
  readOnly,
  onChange,
  className,
  onGetCode,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [code, setCode] = useState(initialValue);

  // Create a ref for the latest code so onGetCode always fetches the fresh value
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    if (onGetCode) {
      onGetCode(() => codeRef.current);
    }
  }, [onGetCode]);

  const languageMap: Record<SupportedLanguage, string> = {
    rust: "rust",
    typescript: "typescript",
    javascript: "javascript",
    json: "json",
  };

  const handleEditorWillMount = (monaco: any) => {
    // Configure TS compiler to be lenient for challenge code snippets
    if (language === "typescript" || language === "javascript") {
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        allowJs: true,
        noResolve: true,       // Don't resolve imports (no node_modules)
        allowImportingTsExtensions: true,
        strict: false,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      });
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      });
    }

    // Custom theme to match superteam
    monaco.editor.defineTheme("superteamDark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "14F195", fontStyle: "bold" },
        { token: "string", foreground: "F06529" },
        { token: "comment", foreground: "8F9099", fontStyle: "italic" },
        { token: "number", foreground: "8470FF" },
        { token: "type", foreground: "14F195" },
        { token: "class", foreground: "14F195" },
      ],
      colors: {
        "editor.background": "#00000000", // Transparent to let app theme show
        "editor.lineHighlightBackground": "#ffffff08",
        "editorLineNumber.foreground": "#8F9099",
        "editor.selectionBackground": "#14f19533",
        "editorCursor.foreground": "#14f195",
        "editorIndentGuide.background": "#ffffff14",
        "editorIndentGuide.activeBackground": "#14f1954d",
      },
    });
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Initial content set (if it wasn't picked up)
    if (initialValue && !editor.getValue()) {
      editor.setValue(initialValue);
    }
  };

  useEffect(() => {
    setCode(initialValue);
  }, [initialValue]);

  // Handle local state and parent callback
  const handleEditorChange = (value: string | undefined) => {
    const newVal = value ?? "";
    setCode(newVal);
    onChange?.(newVal);
  };

  return (
    <div className={`w-full h-full min-h-[300px] relative ${className || ""}`}>
      <Editor
        height="100%"
        language={languageMap[language] ?? "plaintext"}
        value={code}
        onChange={handleEditorChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorMount}
        theme="superteamDark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 4,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "line",
          automaticLayout: true,
          readOnly: readOnly,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          formatOnPaste: true,
          fixedOverflowWidgets: true,
        }}

        loading={<div className="h-full w-full animate-pulse bg-void/50 flex items-center justify-center text-text-muted text-sm font-mono">Loading Monaco...</div>}
      />
    </div>
  );
}
