"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { Monaco } from "@monaco-editor/react";
import { useCallback, useRef } from "react";
import { SOLANA_WEB3_TYPES, BUFFER_TYPES } from "./solana-types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-foreground">
      Loading editor...
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "typescript" | "rust" | "javascript";
}

export function CodeEditor({ value, onChange, language = "typescript" }: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const initialized = useRef(false);

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    if (initialized.current) return;
    initialized.current = true;

    const ts = monaco.languages.typescript;

    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      allowNonTsExtensions: true,
      noEmit: true,
      strict: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: ts.JsxEmit.ReactJSX,
    });

    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    ts.typescriptDefaults.addExtraLib(
      SOLANA_WEB3_TYPES,
      "file:///node_modules/@solana/web3.js/index.d.ts",
    );

    ts.typescriptDefaults.addExtraLib(
      BUFFER_TYPES,
      "file:///node_modules/@types/node/buffer.d.ts",
    );
  }, []);

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage={language}
      language={language}
      theme={resolvedTheme === "light" ? "vs-light" : "vs-dark"}
      value={value}
      onChange={(newValue) => onChange(newValue ?? "")}
      beforeMount={handleBeforeMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        smoothScrolling: true,
        padding: { top: 14 },
        automaticLayout: true,
        lineNumbersMinChars: 3,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        wordWrap: "on",
        tabSize: 2,
      }}
    />
  );
}
