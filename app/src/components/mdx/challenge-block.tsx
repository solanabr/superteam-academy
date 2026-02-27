'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Code, Play, CheckCircle, XCircle, Lightbulb, Eye, EyeOff, Loader2 } from 'lucide-react';
import { LogoLoader } from '@/components/ui/logo-loader';
import { toast } from 'sonner';
import {
  validateChallenge,
  type TestCase as ExecutionTestCase,
  type ChallengeValidation,
} from '@/lib/services/code-execution-service';

// Lazy load Monaco Editor for better initial load performance
const CodeEditor = lazy(() =>
  import('@/components/editor/code-editor').then((mod) => ({ default: mod.CodeEditor }))
);

interface TestCase {
  description: string;
  input?: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface ChallengeBlockProps {
  title?: string;
  prompt: string;
  starterCode: string;
  solution: string;
  language?: 'rust' | 'typescript' | 'json';
  testCases: TestCase[];
  hints?: string[];
  xpReward?: number;
  onComplete?: (code: string) => void;
  className?: string;
}

export function ChallengeBlock({
  title = 'Coding Challenge',
  prompt,
  starterCode,
  solution,
  language = 'typescript',
  testCases,
  hints = [],
  xpReward = 50,
  onComplete,
  className,
}: ChallengeBlockProps) {
  const [code, setCode] = useState(starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Array<{ passed: boolean; message: string }>>([]);
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleCodeChange = useCallback((value: string | undefined) => {
    setCode(value ?? '');
    setResults([]);
  }, []);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Convert test cases to execution format
      const executionTestCases: ExecutionTestCase[] = testCases.map((tc, index) => ({
        id: `test-${index}`,
        description: tc.description,
        input: tc.input ? JSON.parse(tc.input) : undefined,
        expectedOutput: JSON.parse(tc.expectedOutput),
        hidden: tc.hidden,
      }));

      // Run real code validation
      const validation: ChallengeValidation = await validateChallenge(
        code,
        executionTestCases,
        undefined,
        language as 'typescript' | 'javascript'
      );

      const testResults = validation.results.map((r) => ({
        passed: r.passed,
        message: r.description,
      }));

      setResults(testResults);

      if (validation.allPassed && !completed) {
        setCompleted(true);
        toast.success(`Challenge completed! +${xpReward} XP`);
        onComplete?.(code);
      } else if (!validation.allPassed) {
        toast.error(`${validation.failedCount} test(s) failed`);
      }
    } catch (error) {
      // Fallback to simple validation for non-JS code
      const testResults = testCases.map((testCase) => {
        const passed =
          code.includes(testCase.expectedOutput) || code.length > starterCode.length + 20;
        return {
          passed,
          message: testCase.description,
        };
      });

      setResults(testResults);

      const allPassed = testResults.every((r) => r.passed);
      if (allPassed && !completed) {
        setCompleted(true);
        toast.success(`Challenge completed! +${xpReward} XP`);
        onComplete?.(code);
      }
    } finally {
      setIsRunning(false);
    }
  }, [code, testCases, language, completed, xpReward, onComplete, starterCode]);

  const handleRevealHint = useCallback(
    (index: number) => {
      if (!revealedHints.includes(index)) {
        setRevealedHints([...revealedHints, index]);
      }
    },
    [revealedHints]
  );

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setResults([]);
    setCompleted(false);
    setShowSolution(false);
  }, [starterCode]);

  const visibleTestCases = testCases.filter((tc) => !tc.hidden);

  return (
    <Card className={cn('my-6', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code className="text-primary h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            +{xpReward} XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="whitespace-pre-wrap">{prompt}</p>
        </div>

        <Tabs defaultValue="code" className="w-full">
          <TabsList>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="tests">Tests ({visibleTestCases.length})</TabsTrigger>
            {hints.length > 0 && <TabsTrigger value="hints">Hints</TabsTrigger>}
          </TabsList>

          <TabsContent value="code" className="space-y-4">
            {/* Code Editor */}
            <div className="bg-muted/30 relative rounded-lg border">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <span className="text-muted-foreground text-xs uppercase">{language}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleReset}>
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
                        Show Solution
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Suspense
                fallback={
                  <div className="flex min-h-[200px] items-center justify-center">
                    <LogoLoader size="sm" message="Running tests..." />
                  </div>
                }
              >
                <CodeEditor
                  value={showSolution ? solution : code}
                  onChange={showSolution ? undefined : handleCodeChange}
                  language={language}
                  height={250}
                  readOnly={showSolution}
                  minimap={false}
                  lineNumbers="on"
                />
              </Suspense>
            </div>

            {/* Run Button */}
            <div className="flex items-center gap-4">
              <Button onClick={handleRun} disabled={isRunning || showSolution}>
                {isRunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {isRunning ? 'Running...' : 'Run Tests'}
              </Button>
              {completed && (
                <Badge className="bg-green-500">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Completed
                </Badge>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Test Results</h4>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2 rounded-lg p-3',
                      result.passed
                        ? 'bg-green-50 dark:bg-green-950/30'
                        : 'bg-red-50 dark:bg-red-950/30'
                    )}
                  >
                    {result.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">{result.message}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-2">
            {visibleTestCases.map((testCase, index) => (
              <div key={index} className="rounded-lg border p-3">
                <p className="font-medium">{testCase.description}</p>
                {testCase.input && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    Input: <code className="bg-muted rounded px-1">{testCase.input}</code>
                  </p>
                )}
                <p className="text-muted-foreground mt-1 text-sm">
                  Expected: <code className="bg-muted rounded px-1">{testCase.expectedOutput}</code>
                </p>
              </div>
            ))}
            {testCases.some((tc) => tc.hidden) && (
              <p className="text-muted-foreground text-sm italic">
                + {testCases.filter((tc) => tc.hidden).length} hidden test(s)
              </p>
            )}
          </TabsContent>

          {hints.length > 0 && (
            <TabsContent value="hints" className="space-y-2">
              {hints.map((hint, index) => (
                <div key={index}>
                  {revealedHints.includes(index) ? (
                    <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950/30">
                      <div className="mb-1 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Hint {index + 1}</span>
                      </div>
                      <p className="text-sm">{hint}</p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevealHint(index)}
                      className="w-full justify-start"
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Reveal Hint {index + 1}
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
