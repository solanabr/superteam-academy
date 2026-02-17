"use client";

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Play, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-[300px] flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-slate-400 dark:text-gray-500">Loading editor...</div>
    </div>
  ),
});

interface CodeEditorProps {
  language: 'rust' | 'typescript' | 'json';
  starterCode: string;
  testKeyword: string;
  onPass: () => void;
  onCodeChange?: (code: string) => void;
}

export function CodeEditor({ language, starterCode, testKeyword, onPass, onCodeChange }: CodeEditorProps) {
  const { t } = useLang();
  const { isDark } = useTheme();
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'pass' | 'fail'>('idle');

  const monacoLang = language === 'rust' ? 'rust' : language === 'typescript' ? 'typescript' : 'json';

  const runCode = useCallback(() => {
    setStatus('running');
    setOutput(null);

    setTimeout(() => {
      const passed = code.includes(testKeyword);
      if (passed) {
        setStatus('pass');
        setOutput(`✅ Compilation successful!\n\n> Program output:\n  ${testKeyword} found in submission.\n  All assertions passed.\n\n🎉 Challenge completed!`);
        onPass();
      } else {
        setStatus('fail');
        setOutput(`❌ Compilation failed!\n\n> Expected keyword "${testKeyword}" not found in your code.\n> Please review the instructions and try again.\n\nHint: Make sure you've implemented the required functionality.`);
      }
    }, 1500);
  }, [code, testKeyword, onPass]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-800 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 transition-colors">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500/80" />
          </div>
          <span className="text-slate-400 dark:text-gray-500 text-xs ml-2 font-mono">
            {language === 'rust' ? 'main.rs' : language === 'typescript' ? 'index.ts' : 'config.json'}
          </span>
        </div>

        <button
          onClick={runCode}
          disabled={status === 'running'}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            status === 'running'
              ? 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-400 cursor-wait'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/20'
          }`}
        >
          {status === 'running' ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {t('lesson.run')}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="100%"
          language={monacoLang}
          value={code}
          onChange={(v) => {
            const val = v || '';
            setCode(val);
            onCodeChange?.(val);
          }}
          theme={isDark ? 'vs-dark' : 'vs'}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
          }}
        />
      </div>

      {/* Output */}
      {output !== null && (
        <div className="border-t border-slate-200 dark:border-gray-800 transition-colors">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-gray-900 transition-colors">
            {status === 'pass' ? (
              <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
            ) : (
              <XCircle size={14} className="text-red-600 dark:text-red-400" />
            )}
            <span className={`text-xs font-semibold ${status === 'pass' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {t('lesson.output')}
            </span>
          </div>
          <pre className="p-4 text-sm font-mono text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-950 max-h-40 overflow-auto whitespace-pre-wrap transition-colors">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
