'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStorageKey(language: string, defaultValue: string): string {
  // Simple hash from first 64 chars of defaultValue for uniqueness
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
// Component
// ---------------------------------------------------------------------------

/**
 * Lightweight code editor styled to look like a professional IDE.
 * Uses a textarea with line numbers instead of actual Monaco
 * to avoid heavy bundle size. Supports auto-save to localStorage.
 */
export function MonacoEditorWrapper({
  defaultValue,
  language,
  onChange,
  onRun,
  onReset,
  isRunning = false,
  className,
}: MonacoEditorWrapperProps) {
  const t = useTranslations('lesson');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = getStorageKey(language, defaultValue);
  const [value, setValue] = useState(() => loadSavedValue(storageKey) ?? defaultValue);
  const [copied, setCopied] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);

  const lineCount = value.split('\n').length;

  // Sync scroll between line numbers and textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Track cursor position
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const lines = value.slice(0, pos).split('\n');
    setCursorLine(lines.length);
  }, [value]);

  // Handle text changes with debounced auto-save
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange(newValue);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persistValue(storageKey, newValue);
      }, AUTO_SAVE_DELAY_MS);
    },
    [onChange, storageKey],
  );

  // Handle tab key for indentation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.slice(0, start) + '  ' + value.slice(end);

        setValue(newValue);
        onChange(newValue);

        // Restore cursor after indent
        requestAnimationFrame(() => {
          textarea.selectionStart = start + 2;
          textarea.selectionEnd = start + 2;
        });
      }

      // Ctrl/Cmd + Enter to run
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onRun) {
        e.preventDefault();
        onRun();
      }
    },
    [value, onChange, onRun],
  );

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — non-critical
    }
  }, [value]);

  // Reset to default value
  const handleReset = useCallback(() => {
    setValue(defaultValue);
    onChange(defaultValue);
    persistValue(storageKey, defaultValue);
    onReset?.();
  }, [defaultValue, onChange, storageKey, onReset]);

  // Cleanup save timer
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

      {/* Editor area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-none select-none overflow-hidden border-r border-neutral-700 bg-[#1e1e1e] py-3 pr-3 pl-3 text-right font-mono text-xs leading-[1.625rem] text-neutral-600"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className={cn(
                'transition-colors',
                i + 1 === cursorLine && 'text-neutral-400',
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onScroll={handleScroll}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className={cn(
            'flex-1 resize-none bg-[#1e1e1e] p-3 font-mono text-sm leading-[1.625rem] text-[#d4d4d4] caret-white outline-none',
            'placeholder:text-neutral-600',
            'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700',
          )}
          style={{
            tabSize: 2,
            minHeight: '300px',
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
