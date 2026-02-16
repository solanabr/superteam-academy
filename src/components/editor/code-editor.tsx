'use client';

import { useRef, useCallback } from 'react';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'typescript',
  readOnly = false,
  height = '100%',
  className,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monaco = useMonaco();

  const handleMount: OnMount = useCallback((editor, monacoInstance) => {
    editorRef.current = editor;

    // Define custom RPG dark theme
    monacoInstance.editor.defineTheme('solana-quest-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C678DD' },
        { token: 'string', foreground: '98C379' },
        { token: 'number', foreground: 'D19A66' },
        { token: 'type', foreground: 'E5C07B' },
        { token: 'function', foreground: '61AFEF' },
        { token: 'variable', foreground: 'E06C75' },
        { token: 'operator', foreground: '56B6C2' },
      ],
      colors: {
        'editor.background': '#0D1117',
        'editor.foreground': '#E6EDF3',
        'editor.lineHighlightBackground': '#161B22',
        'editor.selectionBackground': '#264F78',
        'editorCursor.foreground': '#9945FF',
        'editorLineNumber.foreground': '#484F58',
        'editorLineNumber.activeForeground': '#9945FF',
        'editor.selectionHighlightBackground': '#264F7844',
        'editorIndentGuide.background1': '#21262D',
        'editorIndentGuide.activeBackground1': '#30363D',
        'editorBracketMatch.background': '#9945FF22',
        'editorBracketMatch.border': '#9945FF44',
        'scrollbarSlider.background': '#484F5833',
        'scrollbarSlider.hoverBackground': '#484F5855',
        'scrollbarSlider.activeBackground': '#484F5888',
      },
    });

    monacoInstance.editor.defineTheme('solana-quest-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7C3AED' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'D97706' },
        { token: 'type', foreground: 'B45309' },
        { token: 'function', foreground: '2563EB' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editorCursor.foreground': '#9945FF',
        'editorLineNumber.activeForeground': '#9945FF',
      },
    });

    const themeName = resolvedTheme === 'dark' ? 'solana-quest-dark' : 'solana-quest-light';
    monacoInstance.editor.setTheme(themeName);

    // Editor settings
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 16, bottom: 16 },
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      bracketPairColorization: { enabled: true },
      autoClosingBrackets: 'always',
      tabSize: 2,
      wordWrap: 'on',
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      cursorBlinking: 'smooth',
    });
  }, [resolvedTheme]);

  // Update theme when it changes
  if (monaco && editorRef.current) {
    const themeName = resolvedTheme === 'dark' ? 'solana-quest-dark' : 'solana-quest-light';
    monaco.editor.setTheme(themeName);
  }

  const langMap: Record<string, string> = {
    rust: 'rust',
    typescript: 'typescript',
    ts: 'typescript',
    json: 'json',
    javascript: 'javascript',
    js: 'javascript',
  };

  return (
    <div className={className} style={{ height }}>
      <Editor
        height="100%"
        language={langMap[language] || 'typescript'}
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleMount}
        theme={resolvedTheme === 'dark' ? 'solana-quest-dark' : 'solana-quest-light'}
        loading={
          <div className="flex items-center justify-center h-full bg-background p-8">
            <div className="space-y-3 w-full max-w-md">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        }
        options={{
          readOnly,
          domReadOnly: readOnly,
        }}
      />
    </div>
  );
}
