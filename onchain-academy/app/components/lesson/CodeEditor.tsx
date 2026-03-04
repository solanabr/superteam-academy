// components/lesson/CodeEditor.tsx

'use client';

import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { TestCase, CodeSubmission, SubmissionResult } from '@/lib/types/domain';
import { analytics } from '@/lib/services';

interface CodeEditorProps {
  initialCode: string;
  language: string;
  testCases: TestCase[];
  onSubmit?: (submission: CodeSubmission) => void;
  readOnly?: boolean;
}

export function CodeEditor({
  initialCode,
  language,
  testCases,
  onSubmit,
  readOnly = false,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [output, setOutput] = useState<string>('');

  const handleReset = () => {
    setCode(initialCode);
    setResult(null);
    setOutput('');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running tests...\n');

    const startTime = Date.now();

    try {
      // Simulate code execution
      // In production, this would call a backend API for secure execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock test results
      const passedTests = Math.min(
        testCases.length,
        Math.floor(Math.random() * (testCases.length + 1))
      );

      const executionTime = Date.now() - startTime;

      const testResult: SubmissionResult = {
        success: passedTests === testCases.length,
        passedTests,
        totalTests: testCases.length,
        executionTime,
        output: `✓ ${passedTests}/${testCases.length} tests passed\n\nExecution time: ${executionTime}ms`,
      };

      setResult(testResult);
      setOutput(testResult.output || '');

      // Track analytics
      analytics.codeExecuted(
        'lesson-id', // Would come from props
        language,
        testResult.success,
        executionTime
      );

      if (onSubmit) {
        const submission: CodeSubmission = {
          id: `submission-${Date.now()}`,
          userId: 'current-user', // Would come from auth
          lessonId: 'lesson-id', // Would come from props
          code,
          language,
          submittedAt: new Date().toISOString(),
          result: testResult,
        };
        onSubmit(submission);
      }
    } catch (error) {
      setResult({
        success: false,
        passedTests: 0,
        totalTests: testCases.length,
        executionTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
      setOutput('❌ Execution failed\n\n' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Code Editor</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{language}</Badge>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Editor
              height="400px"
              defaultLanguage={language}
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                readOnly,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      {!readOnly && (
        <div className="flex items-center gap-4">
          <Button
            onClick={handleRun}
            disabled={isRunning}
            className="gap-2"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>

          {result && (
            <div className="flex items-center gap-2">
              {result.success ? (
                <Badge variant="success" className="gap-1">
                  <Check className="h-3 w-3" />
                  All Tests Passed
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <X className="h-3 w-3" />
                  {result.passedTests}/{result.totalTests} Passed
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Output */}
      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
              {output}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Test Cases */}
      {testCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                <div
                  key={testCase.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Test {index + 1}</span>
                    {result && (
                      <Badge
                        variant={index < result.passedTests ? 'success' : 'destructive'}
                        className="gap-1"
                      >
                        {index < result.passedTests ? (
                          <>
                            <Check className="h-3 w-3" />
                            Passed
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3" />
                            Failed
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                  {testCase.description && (
                    <p className="text-sm text-muted-foreground">
                      {testCase.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Input:</span>
                      <pre className="mt-1 bg-muted p-2 rounded text-xs">
                        {testCase.input || 'None'}
                      </pre>
                    </div>
                    <div>
                      <span className="font-medium">Expected:</span>
                      <pre className="mt-1 bg-muted p-2 rounded text-xs">
                        {testCase.expectedOutput}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
              {testCases.some(tc => tc.isHidden) && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  + {testCases.filter(tc => tc.isHidden).length} hidden test case(s)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
