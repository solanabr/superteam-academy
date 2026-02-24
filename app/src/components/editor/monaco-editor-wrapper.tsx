'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import { Copy, Check, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Extract the editor instance type from the OnMount callback signature */
type MonacoEditorInstance = Parameters<OnMount>[0];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MonacoEditorWrapperProps {
  defaultValue: string;
  language: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  onReset?: () => void;
  isRunning?: boolean;
  readOnly?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'sta-editor-';
const AUTO_SAVE_DELAY_MS = 1000;

const LANGUAGE_LABELS: Record<string, string> = {
  rust: 'Rust',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  solidity: 'Solidity',
  json: 'JSON',
};

/** Map our language keys to Monaco's language identifiers */
const MONACO_LANGUAGE_MAP: Record<string, string> = {
  rust: 'rust',
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  solidity: 'sol',
  json: 'json',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStorageKey(language: string, defaultValue: string): string {
  const hash = defaultValue.slice(0, 64).replace(/\s/g, '').slice(0, 16);
  return `${STORAGE_PREFIX}${language}-${hash}`;
}

function loadSavedValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function persistValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Non-critical — localStorage quota exceeded or unavailable
  }
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function EditorLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-2 bg-[#1e1e1e] p-4">
      <Skeleton className="h-4 w-3/4 bg-neutral-700" />
      <Skeleton className="h-4 w-1/2 bg-neutral-700" />
      <Skeleton className="h-4 w-5/6 bg-neutral-700" />
      <Skeleton className="h-4 w-2/3 bg-neutral-700" />
      <Skeleton className="h-4 w-4/5 bg-neutral-700" />
      <Skeleton className="h-4 w-1/3 bg-neutral-700" />
      <Skeleton className="h-4 w-3/5 bg-neutral-700" />
      <Skeleton className="h-4 w-2/4 bg-neutral-700" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Monaco Editor wrapper with toolbar, auto-save, and theme support.
 * Dynamically imported with `ssr: false` in parent pages.
 */
export function MonacoEditorWrapper({
  defaultValue,
  language,
  onChange,
  onRun,
  onReset,
  isRunning = false,
  readOnly = false,
  className,
}: MonacoEditorWrapperProps) {
  const t = useTranslations('lesson');
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = getStorageKey(language, defaultValue);
  const [value, setValue] = useState(() => loadSavedValue(storageKey) ?? defaultValue);
  const [copied, setCopied] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);

  const monacoLanguage = MONACO_LANGUAGE_MAP[language] ?? language;
  const monacoTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'vs-dark'; // Editor always dark per VS Code style

  // -----------------------------------------------------------------------
  // Editor mount — configure keybindings and cursor tracking
  // -----------------------------------------------------------------------

  const handleEditorMount: OnMount = useCallback(
    (editorInstance, monaco) => {
      editorRef.current = editorInstance;

      // Track cursor line changes
      editorInstance.onDidChangeCursorPosition((e) => {
        setCursorLine(e.position.lineNumber);
      });

      // Ctrl/Cmd + Enter to run
      if (onRun) {
        editorInstance.addAction({
          id: 'run-code',
          label: 'Run Code',
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          run: () => onRun(),
        });
      }

      // Focus the editor on mount
      editorInstance.focus();
    },
    [onRun],
  );

  // -----------------------------------------------------------------------
  // Value change handler with debounced auto-save
  // -----------------------------------------------------------------------

  const handleEditorChange: OnChange = useCallback(
    (newValue) => {
      const updated = newValue ?? '';
      setValue(updated);
      onChange(updated);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persistValue(storageKey, updated);
      }, AUTO_SAVE_DELAY_MS);
    },
    [onChange, storageKey],
  );

  // -----------------------------------------------------------------------
  // Toolbar actions
  // -----------------------------------------------------------------------

  const handleCopy = useCallback(async () => {
    const currentValue = editorRef.current?.getValue() ?? value;
    try {
      await navigator.clipboard.writeText(currentValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — non-critical
    }
  }, [value]);

  const handleReset = useCallback(() => {
    setValue(defaultValue);
    onChange(defaultValue);
    persistValue(storageKey, defaultValue);

    // Update Monaco editor content directly
    if (editorRef.current) {
      editorRef.current.setValue(defaultValue);
    }

    onReset?.();
  }, [defaultValue, onChange, storageKey, onReset]);

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border bg-[#1e1e1e]', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-neutral-700 bg-[#252526] px-3 py-1.5">
        <div className="flex items-center gap-2">
          {/* Language indicator */}
          <span className="rounded bg-neutral-700 px-2 py-0.5 text-xs font-medium text-neutral-300">
            {LANGUAGE_LABELS[language] ?? language}
          </span>
          <span className="text-xs text-neutral-500">
            {t('line', { line: cursorLine })}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Copy */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            className="text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
            aria-label={copied ? t('copied') : t('copy_code')}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </Button>

          {/* Reset */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleReset}
            className="text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
            aria-label={t('reset_code')}
          >
            <RotateCcw className="size-3.5" />
          </Button>

          {/* Run */}
          {onRun && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onRun}
              disabled={isRunning}
              className="gap-1 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300 disabled:opacity-50"
            >
              <Play className="size-3" />
              <span>{isRunning ? t('running') : t('run_code')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="relative flex-1" style={{ minHeight: '300px' }}>
        <Editor
          defaultValue={value}
          language={monacoLanguage}
          theme={monacoTheme}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          loading={<EditorLoadingSkeleton />}
          options={{
            readOnly,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
            lineNumbers: 'on',
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            acceptSuggestionOnEnter: 'on',
            parameterHints: { enabled: true },
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'mouseover',
            matchBrackets: 'always',
            renderWhitespace: 'selection',
            guides: {
              indentation: true,
              bracketPairs: true,
            },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              verticalSliderSize: 8,
              horizontalSliderSize: 8,
            },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-neutral-700 bg-[#007acc] px-3 py-0.5 text-xs text-white/90">
        <span>{LANGUAGE_LABELS[language] ?? language}</span>
        <span className="text-white/60">{t('auto_saved')}</span>
      </div>
    </div>
  );
}
