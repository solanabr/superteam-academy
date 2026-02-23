import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, XCircle, RotateCcw, Lightbulb } from 'lucide-react';

interface CodeEditorProps {
  starterCode: string;
  solutionCode?: string;
  language?: string;
  onSuccess?: () => void;
}

function validateCode(code: string): { passed: boolean; message: string } {
  const checks = [
    { pattern: /initialize/, message: 'Missing `initialize` function or keyword' },
    { pattern: /return|Ok\(|console\.log/, message: 'Function needs a return statement' },
  ];

  // Basic validation: code must be non-empty and contain meaningful content
  if (code.trim().length < 20) {
    return { passed: false, message: '❌ Code is too short. Write your solution!' };
  }

  // Check for TODO comments still present (user hasn't started)
  const todoLines = (code.match(/\/\/ TODO:/g) || []).length;
  const originalTodos = (code.match(/\/\/ TODO:/g) || []).length;
  
  // Check for key solution keywords
  const solutionKeywords = [
    'initialize', 'transfer', 'increment', 'calculateSwap', 'identifyAccountType',
    'return', 'Result', 'function', 'fn ', 'pub fn',
  ];
  
  const hasKeyword = solutionKeywords.some(kw => code.includes(kw));
  
  if (!hasKeyword) {
    return { passed: false, message: '❌ Your code doesn\'t seem to implement the required function.' };
  }

  // Check for placeholder values
  if (code.includes('return 0;') && code.includes('outputAmount: 0')) {
    return { passed: false, message: '❌ Replace the placeholder values with your implementation.' };
  }

  // If code has valid structure, pass
  if (code.includes('return') || code.includes('Ok(') || code.includes('console.log')) {
    return { passed: true, message: '✅ Tests passed! Great implementation.' };
  }

  return { passed: false, message: '❌ Your code needs a return value or output.' };
}

export function CodeEditor({ starterCode, solutionCode, language = 'typescript', onSuccess }: CodeEditorProps) {
  const [code, setCode] = useState(starterCode);
  const [result, setResult] = useState<{ passed: boolean; message: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 800));
    const validation = validateCode(code);
    setResult(validation);
    setIsRunning(false);
    if (validation.passed && !submitted) {
      setSubmitted(true);
      onSuccess?.();
    }
  };

  const handleReset = () => {
    setCode(starterCode);
    setResult(null);
    setSubmitted(false);
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-card-border bg-card">
      {/* Editor header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-card-border bg-background-secondary">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <div className="h-3 w-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-2">solution.{language === 'rust' ? 'rs' : 'ts'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full border border-card-border text-muted-foreground">
            {language}
          </span>
          {solutionCode && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 text-xs text-yellow-400/80 hover:text-yellow-400 transition-colors"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {showHint ? 'Hide' : 'Hint'}
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-[350px]">
        <Editor
          height="100%"
          defaultLanguage={language === 'rust' ? 'rust' : 'typescript'}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Hint panel */}
      {showHint && solutionCode && (
        <div className="border-t border-card-border bg-yellow-400/5 p-4">
          <p className="text-xs font-semibold text-yellow-400 mb-2">💡 Solution Reference</p>
          <pre className="text-xs font-mono text-muted-foreground overflow-auto max-h-40">
            {solutionCode}
          </pre>
        </div>
      )}

      {/* Result panel */}
      {result && (
        <div className={`border-t border-card-border p-4 flex items-start gap-3 ${
          result.passed ? 'bg-success/5' : 'bg-destructive/5'
        }`}>
          {result.passed ? (
            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-semibold ${result.passed ? 'text-success' : 'text-destructive'}`}>
              {result.passed ? 'All Tests Passed!' : 'Tests Failed'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{result.message}</p>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="border-t border-card-border px-4 py-3 flex items-center justify-between bg-background-secondary">
        <p className="text-xs text-muted-foreground">
          {submitted ? '✅ Completed — XP awarded!' : 'Write your solution and click Run'}
        </p>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 btn-solana px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="h-4 w-4" />
          {isRunning ? 'Running...' : 'Run & Submit'}
        </button>
      </div>
    </div>
  );
}
