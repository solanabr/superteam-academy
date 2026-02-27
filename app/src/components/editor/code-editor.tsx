'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Editor, { OnMount, OnChange, Monaco } from '@monaco-editor/react';
import { useThemeContext } from '@/components/providers';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { LogoLoader } from '@/components/ui/logo-loader';
import type { editor, Position, IRange } from 'monaco-editor';

export type SupportedLanguage =
  | 'typescript'
  | 'javascript'
  | 'rust'
  | 'json'
  | 'markdown'
  | 'html'
  | 'css'
  | 'solidity';

export interface CodeEditorProps {
  /** Initial code value */
  value?: string;
  /** Callback when code changes */
  onChange?: (value: string | undefined) => void;
  /** Programming language for syntax highlighting */
  language?: SupportedLanguage;
  /** Editor height - can be number (px) or string (e.g., '100%', '400px') */
  height?: number | string;
  /** Make editor read-only */
  readOnly?: boolean;
  /** Show line numbers */
  lineNumbers?: 'on' | 'off' | 'relative';
  /** Show minimap */
  minimap?: boolean;
  /** Word wrap setting */
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  /** Tab size */
  tabSize?: number;
  /** Auto format on paste */
  formatOnPaste?: boolean;
  /** Auto format on type */
  formatOnType?: boolean;
  /** Additional className for container */
  className?: string;
  /** Callback when editor mounts */
  onMount?: OnMount;
  /** Error markers to display */
  errors?: EditorError[];
  /** Placeholder text when value is empty */
  placeholder?: string;
}

export interface EditorError {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

// Map our language names to Monaco language IDs
const languageMap: Record<SupportedLanguage, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  rust: 'rust',
  json: 'json',
  markdown: 'markdown',
  html: 'html',
  css: 'css',
  solidity: 'sol',
};

// Solana/Anchor-specific Rust snippets
const rustSnippets = [
  {
    label: 'anchor-program',
    insertText: `use anchor_lang::prelude::*;

declare_id!("\${1:YOUR_PROGRAM_ID}");

#[program]
pub mod \${2:program_name} {
    use super::*;

    pub fn \${3:initialize}(ctx: Context<\${4:Initialize}>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct \${4:Initialize} {}`,
    documentation: 'Basic Anchor program structure',
  },
  {
    label: 'anchor-account',
    insertText: `#[account]
#[derive(Default)]
pub struct \${1:AccountName} {
    pub \${2:field}: \${3:u64},
}`,
    documentation: 'Anchor account definition',
  },
  {
    label: 'anchor-context',
    insertText: `#[derive(Accounts)]
pub struct \${1:ContextName}<'info> {
    #[account(mut)]
    pub \${2:signer}: Signer<'info>,
    #[account(
        init,
        payer = \${2:signer},
        space = 8 + \${3:size}
    )]
    pub \${4:account}: Account<'info, \${5:AccountType}>,
    pub system_program: Program<'info, System>,
}`,
    documentation: 'Anchor context with accounts',
  },
];

// TypeScript/Solana snippets
const typescriptSnippets = [
  {
    label: 'solana-connection',
    insertText: `import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('\${1|devnet,mainnet-beta,testnet|}'));`,
    documentation: 'Solana connection setup',
  },
  {
    label: 'anchor-provider',
    insertText: `import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';

const { connection } = useConnection();
const wallet = useAnchorWallet();
const provider = new AnchorProvider(connection, wallet!, {});`,
    documentation: 'Anchor provider setup with wallet adapter',
  },
  {
    label: 'send-transaction',
    insertText: `const tx = new Transaction().add(
    \${1:instruction}
);

const signature = await sendTransaction(tx, connection);
await connection.confirmTransaction(signature, 'confirmed');`,
    documentation: 'Send and confirm transaction',
  },
];

export function CodeEditor({
  value = '',
  onChange,
  language = 'typescript',
  height = 400,
  readOnly = false,
  lineNumbers = 'on',
  minimap = false,
  wordWrap = 'on',
  tabSize = 2,
  formatOnPaste = true,
  formatOnType = true,
  className,
  onMount,
  errors = [],
  placeholder,
}: CodeEditorProps) {
  const { resolvedTheme } = useThemeContext();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      setIsLoading(false);

      // Configure Rust language support for Anchor
      if (language === 'rust') {
        monaco.languages.registerCompletionItemProvider('rust', {
          provideCompletionItems: (model: editor.ITextModel, position: Position) => {
            const word = model.getWordUntilPosition(position);
            const range: IRange = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            return {
              suggestions: rustSnippets.map((snippet) => ({
                label: snippet.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: snippet.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: snippet.documentation,
                range,
              })),
            };
          },
        });
      }

      // Configure TypeScript for Solana
      if (language === 'typescript' || language === 'javascript') {
        monaco.languages.registerCompletionItemProvider(language, {
          provideCompletionItems: (model: editor.ITextModel, position: Position) => {
            const word = model.getWordUntilPosition(position);
            const range: IRange = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn,
            };

            return {
              suggestions: typescriptSnippets.map((snippet) => ({
                label: snippet.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: snippet.insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: snippet.documentation,
                range,
              })),
            };
          },
        });

        // TypeScript compiler options
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          noEmit: true,
        });
      }

      // Focus editor
      editor.focus();

      // Call user's onMount if provided
      onMount?.(editor, monaco);
    },
    [language, onMount]
  );

  // Update error markers
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = errors.map((error) => ({
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.endLine ?? error.line,
      endColumn: error.endColumn ?? error.column + 1,
      message: error.message,
      severity:
        error.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : error.severity === 'info'
            ? monaco.MarkerSeverity.Info
            : monaco.MarkerSeverity.Error,
    }));

    monaco.editor.setModelMarkers(model, 'code-editor', markers);
  }, [errors]);

  const handleChange: OnChange = useCallback(
    (newValue) => {
      onChange?.(newValue);
    },
    [onChange]
  );

  // Editor options
  const options: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    lineNumbers,
    minimap: { enabled: minimap },
    wordWrap,
    tabSize,
    formatOnPaste,
    formatOnType,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontLigatures: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    acceptSuggestionOnEnter: 'on',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'mouseover',
    // Placeholder support (Monaco doesn't have native placeholder, we handle it separately)
  };

  return (
    <div className={cn('relative overflow-hidden rounded-lg border', className)}>
      {isLoading && (
        <div className="bg-muted/50 absolute inset-0 z-10 flex items-center justify-center">
          <LogoLoader size="md" message="Loading editor..." />
        </div>
      )}
      {placeholder && !value && (
        <div className="text-muted-foreground pointer-events-none absolute top-4 left-16 z-10 font-mono text-sm">
          {placeholder}
        </div>
      )}
      <Editor
        height={height}
        language={languageMap[language] || language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
        options={options}
        loading={
          <div className="bg-muted/50 flex h-full items-center justify-center">
            <LogoLoader size="md" message="Initializing..." />
          </div>
        }
      />
    </div>
  );
}

// Export editor actions for external control
export function useCodeEditorActions() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const setEditor = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  }, []);

  const formatDocument = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  }, []);

  const undo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'undo', null);
  }, []);

  const redo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'redo', null);
  }, []);

  const getValue = useCallback(() => {
    return editorRef.current?.getValue();
  }, []);

  const setValue = useCallback((value: string) => {
    editorRef.current?.setValue(value);
  }, []);

  const focus = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  return {
    setEditor,
    formatDocument,
    undo,
    redo,
    getValue,
    setValue,
    focus,
  };
}
