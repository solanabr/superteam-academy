"use client";

/**
 * Code-editor abstraction: Monaco with JS/TS/Rust support and customizable theme.
 * TypeScript/JavaScript intellisense via Monaco; Rust syntax highlighting via Monarch.
 */

import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import type { editor } from "monaco-editor";
import {
  DEFAULT_EDITOR_THEME_ID,
  defaultEditorThemeColors,
  buildMonacoTheme,
  type EditorThemeColors,
} from "@/lib/editor/theme";
import { rustLanguageConfig, rustMonarchGrammar } from "@/lib/editor/rust-monarch";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false }
);

export type CodeEditorLanguage = "javascript" | "typescript" | "rust";

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeEditorLanguage;
  themeColors?: Partial<EditorThemeColors>;
  height?: string | number;
  className?: string;
  readOnly?: boolean;
  options?: editor.IStandaloneEditorConstructionOptions;
}

const LANGUAGE_MONACO: Record<CodeEditorLanguage, string> = {
  javascript: "javascript",
  typescript: "typescript",
  rust: "rust",
};

function registerRust(monaco: typeof import("monaco-editor")) {
  if (monaco.languages.getLanguages().some((l) => l.id === "rust")) return;
  monaco.languages.register({ id: "rust" });
  monaco.languages.setLanguageConfiguration("rust", rustLanguageConfig);
  monaco.languages.setMonarchTokensProvider("rust", rustMonarchGrammar);
}

function applyTheme(
  monaco: typeof import("monaco-editor"),
  colors: Partial<EditorThemeColors> & { background: string; foreground: string }
) {
  const theme = buildMonacoTheme(DEFAULT_EDITOR_THEME_ID, colors);
  monaco.editor.defineTheme(DEFAULT_EDITOR_THEME_ID, theme);
}

/** Monaco TS/JS language API (monaco.languages.typescript); types may be deprecated in @types. */
interface MonacoTsApi {
  typescriptDefaults: {
    addExtraLib(content: string, filePath?: string): void;
    getCompilerOptions(): object;
    setCompilerOptions(options: object): void;
    getDiagnosticsOptions(): object;
    setDiagnosticsOptions(options: object): void;
  };
  javascriptDefaults: {
    addExtraLib(content: string, filePath?: string): void;
    getCompilerOptions(): object;
    setCompilerOptions(options: object): void;
    getDiagnosticsOptions(): object;
    setDiagnosticsOptions(options: object): void;
  };
}

/** Configure TypeScript/JS so require() and Node-style code don't show "Cannot find name 'require'" */
function configureMonacoTypescript(monaco: typeof import("monaco-editor")) {
  const raw = monaco.languages?.typescript ?? (monaco as unknown as { typescript?: MonacoTsApi }).typescript;
  const ts = raw as unknown as MonacoTsApi | undefined;
  if (!ts) return;

  const nodeDecl = `
declare const require: {
  (id: string): unknown;
  resolve(id: string): string;
  cache: Record<string, unknown>;
  extensions: Record<string, (m: unknown, filename: string) => unknown>;
};
declare const module: { exports: unknown; id: string; filename: string };
declare const exports: unknown;
`;

  try {
    ts.typescriptDefaults.addExtraLib(nodeDecl, "file:///node_modules/@types/node/global.d.ts");
    ts.javascriptDefaults.addExtraLib(nodeDecl, "file:///node_modules/@types/node/global.d.ts");
    ts.typescriptDefaults.setCompilerOptions({
      ...ts.typescriptDefaults.getCompilerOptions(),
      module: 1, // ModuleKind.CommonJS
      moduleResolution: 2, // ModuleResolutionKind.NodeJs
      noEmit: true,
      allowNonTsExtensions: true,
    });
    ts.javascriptDefaults.setCompilerOptions({
      ...ts.javascriptDefaults.getCompilerOptions(),
      module: 1,
      moduleResolution: 2,
      allowNonTsExtensions: true,
    });
    // Suppress "Cannot find name 'require'" (TS2580) if extraLib isn't picked up by the worker
    const ignoreRequire = { diagnosticCodesToIgnore: [2580] };
    ts.typescriptDefaults.setDiagnosticsOptions({
      ...ts.typescriptDefaults.getDiagnosticsOptions(),
      ...ignoreRequire,
    });
    ts.javascriptDefaults.setDiagnosticsOptions({
      ...ts.javascriptDefaults.getDiagnosticsOptions(),
      ...ignoreRequire,
    });
  } catch (_) {
    // API may vary by Monaco version
  }
}

export function CodeEditor({
  value,
  onChange,
  language = "typescript",
  themeColors,
  height = "400px",
  className = "",
  readOnly = false,
  options = {},
}: CodeEditorProps) {
  const mergedColors = useMemo(
    () => ({ ...defaultEditorThemeColors, ...themeColors }),
    [themeColors]
  );

  const handleEditorMount = useCallback(
    (_editor: import("monaco-editor").editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
      configureMonacoTypescript(monaco);
      registerRust(monaco);
      applyTheme(monaco, mergedColors);
    },
    [mergedColors]
  );

  const editorOptions: editor.IStandaloneEditorConstructionOptions = useMemo(
    () => ({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
      readOnly,
      ...options,
    }),
    [readOnly, options]
  );

  return (
    <div className={className} data-editor="monaco">
      <MonacoEditor
        height={height}
        language={LANGUAGE_MONACO[language]}
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        theme={DEFAULT_EDITOR_THEME_ID}
        options={editorOptions}
        beforeMount={(monaco) => {
          configureMonacoTypescript(monaco);
          registerRust(monaco);
          applyTheme(monaco, mergedColors);
        }}
        onMount={handleEditorMount}
        loading={null}
      />
    </div>
  );
}
