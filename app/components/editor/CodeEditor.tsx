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

export type CodeEditorLanguage = "javascript" | "typescript" | "rust" | "json";

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: CodeEditorLanguage;
  themeColors?: Partial<EditorThemeColors>;
  height?: string | number;
  className?: string;
  readOnly?: boolean;
  options?: editor.IStandaloneEditorConstructionOptions;
  onValidate?: (markers: editor.IMarker[]) => void;
}

const LANGUAGE_MONACO: Record<CodeEditorLanguage, string> = {
  javascript: "javascript",
  typescript: "typescript",
  rust: "rust",
  json: "json",
};

function registerRust(monaco: typeof import("monaco-editor")) {
  if (monaco.languages.getLanguages().some((l) => l.id === "rust")) return;
  monaco.languages.register({ id: "rust" });
  monaco.languages.setLanguageConfiguration("rust", rustLanguageConfig);
  monaco.languages.setMonarchTokensProvider("rust", rustMonarchGrammar);
}

let rustCompletionRegistered = false;

function registerRustCompletions(monaco: typeof import("monaco-editor")) {
  if (rustCompletionRegistered) return;

  const rustKeywordSuggestions = [
    "fn",
    "let",
    "mut",
    "pub",
    "struct",
    "enum",
    "impl",
    "match",
    "if",
    "else",
    "for",
    "while",
    "loop",
    "use",
    "mod",
    "crate",
    "super",
    "self",
    "return",
    "Result",
    "Option",
    "Some",
    "None",
    "Ok",
    "Err",
  ];

  monaco.languages.registerCompletionItemProvider("rust", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: import("monaco-editor").languages.CompletionItem[] = rustKeywordSuggestions.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range,
      }));

      suggestions.push(
        {
          label: "fn snippet",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "fn ${1:name}(${2:args}) -> ${3:Result<()>} {\n\t${0}\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: "struct snippet",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "struct ${1:Name} {\n\t${2:field}: ${3:Type},\n}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        }
      );

      return { suggestions };
    },
  });

  rustCompletionRegistered = true;
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

let typescriptSupportConfigured = false;

/** Configure TypeScript/JS so require() and Node-style code don't show "Cannot find name 'require'" */
function configureMonacoTypescript(monaco: typeof import("monaco-editor")) {
  const raw = monaco.languages?.typescript ?? (monaco as unknown as { typescript?: MonacoTsApi }).typescript;
  const ts = raw as unknown as MonacoTsApi | undefined;
  if (!ts) return;
  if (typescriptSupportConfigured) return;

  const nodeDecl = `
declare const require: {
  (id: string): unknown;
  resolve(id: string): string;
  cache: Record<string, unknown>;
  extensions: Record<string, (m: unknown, filename: string) => unknown>;
};
declare const module: { exports: unknown; id: string; filename: string };
declare const exports: unknown;
declare const Buffer: {
  from(input: string | ArrayLike<number>): Uint8Array;
  alloc(size: number): Uint8Array;
};
`;

  const solanaModuleDecl = `
declare module "@solana/web3.js" {
  export class PublicKey {
    constructor(value: string | Uint8Array | number[] | PublicKey);
    toBase58(): string;
    toBuffer(): Uint8Array;
    equals(other: PublicKey): boolean;
    static findProgramAddressSync(
      seeds: Array<Uint8Array | number[]>,
      programId: PublicKey
    ): [PublicKey, number];
  }

  export class Connection {
    constructor(endpoint: string, commitment?: any);
    getLatestBlockhash(...args: any[]): Promise<any>;
    getTokenAccountBalance(...args: any[]): Promise<any>;
  }

  export class Keypair {
    publicKey: PublicKey;
    secretKey: Uint8Array;
    static generate(): Keypair;
  }

  export class Transaction {
    recentBlockhash?: string;
    feePayer?: PublicKey;
    add(...instructions: any[]): Transaction;
  }

  export class TransactionInstruction {
    constructor(args?: any);
  }

  export const SystemProgram: {
    programId: PublicKey;
    transfer(args: any): any;
  };

  export function sendAndConfirmTransaction(
    connection: Connection,
    transaction: Transaction,
    signers?: Keypair[],
    options?: any
  ): Promise<string>;

  export const LAMPORTS_PER_SOL: number;
}

declare module "@solana/spl-token" {
  export const TOKEN_2022_PROGRAM_ID: any;
  export const getAssociatedTokenAddressSync: any;
  export const createMint: any;
}

declare module "@coral-xyz/anchor" {
  export const Program: any;
  export const AnchorProvider: any;
  export const BN: any;
  export const web3: any;
}
`;

  try {
    ts.typescriptDefaults.addExtraLib(nodeDecl, "file:///node_modules/@types/node/global.d.ts");
    ts.javascriptDefaults.addExtraLib(nodeDecl, "file:///node_modules/@types/node/global.d.ts");
    ts.typescriptDefaults.addExtraLib(solanaModuleDecl, "file:///node_modules/@types/solana-modules.d.ts");
    ts.javascriptDefaults.addExtraLib(solanaModuleDecl, "file:///node_modules/@types/solana-modules.d.ts");
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
    typescriptSupportConfigured = true;
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
  onValidate,
}: CodeEditorProps) {
  const mergedColors = useMemo(
    () => ({ ...defaultEditorThemeColors, ...themeColors }),
    [themeColors]
  );

  const handleEditorMount = useCallback(
    (_editor: import("monaco-editor").editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
      configureMonacoTypescript(monaco);
      registerRust(monaco);
      registerRustCompletions(monaco);
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
          registerRustCompletions(monaco);
          applyTheme(monaco, mergedColors);
        }}
        onMount={handleEditorMount}
        onValidate={(markers) => onValidate?.(markers)}
        loading={null}
      />
    </div>
  );
}
