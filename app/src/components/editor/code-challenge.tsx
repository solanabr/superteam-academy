'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CodeEditor, SupportedLanguage, EditorError } from './code-editor';
import {
  validateChallenge,
  executeRustCode,
  analyzeCode,
  TestCase,
  TestResult,
  ChallengeValidation,
} from '@/lib/services/code-execution-service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Code2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CodeChallengeProps {
  /** Challenge title */
  title: string;
  /** Challenge prompt/description */
  prompt: string;
  /** Initial starter code */
  starterCode: string;
  /** Solution code (hidden by default) */
  solution: string;
  /** Programming language */
  language?: SupportedLanguage;
  /** Test cases for validation */
  testCases: TestCase[];
  /** Optional hints */
  hints?: string[];
  /** Function name to test (for function-based challenges) */
  functionName?: string;
  /** XP reward for completion */
  xpReward?: number;
  /** Difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  /** Time estimate in minutes */
  timeEstimate?: number;
  /** Callback when challenge is completed */
  onComplete?: (code: string, results: ChallengeValidation) => void;
  /** Callback when code changes */
  onChange?: (code: string) => void;
  /** Initial completed state */
  initialCompleted?: boolean;
  /** Layout mode */
  layout?: 'stacked' | 'three-column';
  /** Additional className */
  className?: string;
}

export function CodeChallenge({
  title,
  prompt,
  starterCode,
  solution,
  language = 'typescript',
  testCases,
  hints = [],
  functionName,
  xpReward = 50,
  difficulty = 'intermediate',
  timeEstimate = 15,
  onComplete,
  onChange,
  initialCompleted = false,
  layout = 'stacked',
  className,
}: CodeChallengeProps) {
  const [code, setCode] = useState(starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [validation, setValidation] = useState<ChallengeValidation | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [completed, setCompleted] = useState(initialCompleted);
  const [showOutput, setShowOutput] = useState(true);
  const [editorErrors, setEditorErrors] = useState<EditorError[]>([]);
  const [copied, setCopied] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem(`challenge-${title}`);
    if (savedCode && savedCode !== starterCode) {
      setCode(savedCode);
    }
  }, [title, starterCode]);

  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(`challenge-${title}`, code);
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [code, title]);

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value ?? '';
      setCode(newCode);
      onChange?.(newCode);

      // Clear previous validation when code changes
      if (validation) {
        setValidation(null);
      }
    },
    [onChange, validation]
  );

  const handleRunTests = useCallback(async () => {
    setIsRunning(true);
    setValidation(null);
    setEditorErrors([]);

    try {
      let result: ChallengeValidation;

      if (language === 'rust') {
        result = await executeRustCode(code, testCases);
      } else {
        result = await validateChallenge(
          code,
          testCases,
          functionName,
          language as 'typescript' | 'javascript'
        );
      }

      setValidation(result);

      // Set editor errors for failed tests
      const errors: EditorError[] = result.results
        .filter((r) => !r.passed && r.error)
        .map((r, index) => ({
          line: 1,
          column: 1,
          message: r.error || 'Test failed',
          severity: 'error' as const,
        }));
      setEditorErrors(errors);

      if (result.allPassed && !completed) {
        setCompleted(true);
        toast.success(
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <span>Challenge completed! +{xpReward} XP</span>
          </div>
        );
        onComplete?.(code, result);

        // Clear saved code on completion
        localStorage.removeItem(`challenge-${title}`);
      } else if (!result.allPassed) {
        toast.error(`${result.failedCount} test${result.failedCount > 1 ? 's' : ''} failed`);
      }
    } catch (error) {
      toast.error('Error running tests');
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  }, [code, language, testCases, functionName, completed, xpReward, onComplete, title]);

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setValidation(null);
    setEditorErrors([]);
    setCompleted(false);
    setShowSolution(false);
    localStorage.removeItem(`challenge-${title}`);
    toast.info('Code reset to starter');
  }, [starterCode, title]);

  const handleRevealHint = useCallback((index: number) => {
    setRevealedHints((prev) => (prev.includes(index) ? prev : [...prev, index]));
  }, []);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(showSolution ? solution : code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  }, [code, solution, showSolution]);

  const codeAnalysis = analyzeCode(code, language as 'typescript' | 'javascript' | 'rust');

  const visibleTestCases = testCases.filter((tc) => !tc.hidden);
  const hiddenTestCount = testCases.length - visibleTestCases.length;

  const difficultyColors = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  if (layout === 'three-column') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="text-primary h-5 w-5" />
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={difficultyColors[difficulty]}>
                {difficulty}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {timeEstimate} min
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />+{xpReward} XP
              </Badge>
              {completed && (
                <Badge className="gap-1 bg-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr_1fr]">
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Terminal className="h-4 w-4" />
                  Challenge
                </h4>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{prompt}</p>
              </div>

              {hints.length > 0 && (
                <div className="rounded-lg border p-4">
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Hints ({revealedHints.length}/{hints.length})
                    </h4>
                    {showHints ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {showHints && (
                    <div className="mt-3 space-y-2">
                      {hints.map((hint, index) => (
                        <div key={index} className="rounded-lg bg-yellow-500/10 p-3">
                          {revealedHints.includes(index) ? (
                            <p className="text-sm">{hint}</p>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevealHint(index)}
                              className="w-full"
                            >
                              Reveal Hint {index + 1}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm uppercase">{language}</span>
                  {codeAnalysis.issues.length > 0 && (
                    <Badge variant="outline" className="gap-1 text-yellow-500">
                      <AlertTriangle className="h-3 w-3" />
                      {codeAnalysis.issues.length}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Reset
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowSolution(!showSolution)}>
                    {showSolution ? (
                      <>
                        <EyeOff className="mr-1 h-4 w-4" />
                        Hide Solution
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-4 w-4" />
                        Solution
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <CodeEditor
                value={showSolution ? solution : code}
                onChange={showSolution ? undefined : handleCodeChange}
                language={language}
                height={420}
                readOnly={showSolution}
                errors={editorErrors}
                minimap={false}
              />

              {codeAnalysis.issues.length > 0 && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    Suggestions
                  </div>
                  <ul className="mt-2 space-y-1">
                    {codeAnalysis.issues.map((issue, index) => (
                      <li key={index} className="text-muted-foreground text-xs">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button onClick={handleRunTests} disabled={isRunning || showSolution} className="gap-2">
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Tests
                    </>
                  )}
                </Button>

                {completed && (
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Sparkles className="h-4 w-4 text-yellow-500" />+{xpReward} XP earned
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <button
                  onClick={() => setShowOutput(!showOutput)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    Test Cases ({visibleTestCases.length}
                    {hiddenTestCount > 0 && ` + ${hiddenTestCount} hidden`})
                  </h4>
                  {showOutput ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showOutput && (
                  <div className="mt-3 space-y-2">
                    {visibleTestCases.map((testCase, index) => {
                      const result = validation?.results.find((r) => r.id === testCase.id);
                      return (
                        <div
                          key={testCase.id}
                          className={cn(
                            'rounded-lg border p-3 text-sm transition-colors',
                            result?.passed && 'border-green-500/50 bg-green-500/10',
                            result && !result.passed && 'border-red-500/50 bg-red-500/10',
                            !result && 'bg-muted/30'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {index + 1}. {testCase.description}
                            </span>
                            {result && (
                              <span className="flex items-center gap-1">
                                {result.passed ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {validation && (
                <div
                  className={cn(
                    'rounded-lg border p-4',
                    validation.allPassed
                      ? 'border-green-500/50 bg-green-500/10'
                      : 'border-red-500/50 bg-red-500/10'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {validation.allPassed ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-green-500">All tests passed!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="font-medium text-red-500">
                            {validation.failedCount} failed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Progress value={(validation.passedCount / testCases.length) * 100} className="mt-3" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="text-primary h-5 w-5" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={difficultyColors[difficulty]}>
              {difficulty}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {timeEstimate} min
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />+{xpReward} XP
            </Badge>
            {completed && (
              <Badge className="gap-1 bg-green-500">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {/* Challenge Prompt */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Terminal className="h-4 w-4" />
            Challenge
          </h4>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{prompt}</p>
          </div>
        </div>

        {/* Test Cases Preview */}
        <div className="rounded-lg border p-4">
          <button
            onClick={() => setShowOutput(!showOutput)}
            className="flex w-full items-center justify-between text-left"
          >
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Test Cases ({visibleTestCases.length}
              {hiddenTestCount > 0 && ` + ${hiddenTestCount} hidden`})
            </h4>
            {showOutput ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showOutput && (
            <div className="mt-3 space-y-2">
              {visibleTestCases.map((testCase, index) => {
                const result = validation?.results.find((r) => r.id === testCase.id);
                return (
                  <div
                    key={testCase.id}
                    className={cn(
                      'rounded-lg border p-3 text-sm transition-colors',
                      result?.passed && 'border-green-500/50 bg-green-500/10',
                      result && !result.passed && 'border-red-500/50 bg-red-500/10',
                      !result && 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {index + 1}. {testCase.description}
                      </span>
                      {result && (
                        <span className="flex items-center gap-1">
                          {result.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-muted-foreground text-xs">
                            {result.executionTime.toFixed(0)}ms
                          </span>
                        </span>
                      )}
                    </div>
                    {testCase.input !== undefined && (
                      <div className="text-muted-foreground mt-1">
                        <span className="font-mono text-xs">
                          Input: {JSON.stringify(testCase.input)}
                        </span>
                      </div>
                    )}
                    <div className="text-muted-foreground mt-1">
                      <span className="font-mono text-xs">
                        Expected: {JSON.stringify(testCase.expectedOutput)}
                      </span>
                    </div>
                    {result && !result.passed && (
                      <div className="mt-2 rounded bg-red-500/20 p-2">
                        {result.error ? (
                          <span className="font-mono text-xs text-red-400">{result.error}</span>
                        ) : (
                          <span className="font-mono text-xs text-red-400">
                            Got: {JSON.stringify(result.actualOutput)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Code Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm uppercase">{language}</span>
              {codeAnalysis.issues.length > 0 && (
                <Badge variant="outline" className="gap-1 text-yellow-500">
                  <AlertTriangle className="h-3 w-3" />
                  {codeAnalysis.issues.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSolution(!showSolution)}>
                {showSolution ? (
                  <>
                    <EyeOff className="mr-1 h-4 w-4" />
                    Hide Solution
                  </>
                ) : (
                  <>
                    <Eye className="mr-1 h-4 w-4" />
                    Solution
                  </>
                )}
              </Button>
            </div>
          </div>

          <CodeEditor
            value={showSolution ? solution : code}
            onChange={showSolution ? undefined : handleCodeChange}
            language={language}
            height={350}
            readOnly={showSolution}
            errors={editorErrors}
            minimap={false}
          />
        </div>

        {/* Code Analysis Warnings */}
        {codeAnalysis.issues.length > 0 && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              Suggestions
            </div>
            <ul className="mt-2 space-y-1">
              {codeAnalysis.issues.map((issue, index) => (
                <li key={index} className="text-muted-foreground text-xs">
                  • {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Results */}
        {validation && (
          <div
            className={cn(
              'rounded-lg border p-4',
              validation.allPassed
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-red-500/50 bg-red-500/10'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {validation.allPassed ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-500">All tests passed!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-500">
                      {validation.failedCount} test{validation.failedCount > 1 ? 's' : ''} failed
                    </span>
                  </>
                )}
              </div>
              <div className="text-muted-foreground text-sm">
                {validation.passedCount}/{testCases.length} passed •{' '}
                {validation.totalTime.toFixed(0)}ms
              </div>
            </div>
            <Progress value={(validation.passedCount / testCases.length) * 100} className="mt-3" />
          </div>
        )}

        {/* Hints */}
        {hints.length > 0 && (
          <div className="rounded-lg border p-4">
            <button
              onClick={() => setShowHints(!showHints)}
              className="flex w-full items-center justify-between text-left"
            >
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Hints ({revealedHints.length}/{hints.length})
              </h4>
              {showHints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showHints && (
              <div className="mt-3 space-y-2">
                {hints.map((hint, index) => (
                  <div key={index} className="rounded-lg bg-yellow-500/10 p-3">
                    {revealedHints.includes(index) ? (
                      <p className="text-sm">{hint}</p>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevealHint(index)}
                        className="w-full"
                      >
                        Reveal Hint {index + 1}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={handleRunTests} disabled={isRunning || showSolution} className="gap-2">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>

          {completed && (
            <span className="text-muted-foreground flex items-center gap-1 text-sm">
              <Sparkles className="h-4 w-4 text-yellow-500" />+{xpReward} XP earned
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
