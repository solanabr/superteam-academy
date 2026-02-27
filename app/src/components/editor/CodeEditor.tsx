'use client';

import Editor, { useMonaco } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
}

export function CodeEditor({ code, onChange, language = 'typescript', readOnly = false }: CodeEditorProps) {
  const { theme } = useTheme();
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('superteam-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6272a4' },
          { token: 'keyword', foreground: 'ff79c6' },
          { token: 'string', foreground: 'f1fa8c' },
        ],
        colors: {
          'editor.background': '#0A0A0F',
          'editor.lineHighlightBackground': '#1E1E24',
        },
      });
      monaco.editor.setTheme('superteam-dark');

      // Configure TypeScript compiler options
      const typescript = monaco.languages.typescript as any;
      if (typescript && typescript.typescriptDefaults) {
          typescript.typescriptDefaults.setCompilerOptions({
            target: typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: typescript.ModuleResolutionKind.NodeJs,
            module: typescript.ModuleKind.CommonJS,
            noEmit: true,
            typeRoots: ["node_modules/@types"]
          });
      }

      // Suppress benign cancellation errors from worker
      const originalConsoleError = console.error;
      console.error = (...args) => {
          if (args[0]?.msg === 'operation is manually canceled' || args[0]?.type === 'cancelation') {
              return;
          }
          originalConsoleError(...args);
      };
    }
  }, [monaco]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="h-full w-full rounded-md overflow-hidden border border-[#2E2E36]">
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="superteam-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          padding: { top: 16 },
        }}
      />
    </div>
  );
}
