'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { TestRunnerResult } from '@/lib/services/test-runner.service'

interface TestResultsProps {
  result: TestRunnerResult
}

/**
 * Display test execution results
 */
export function TestResults({ result }: TestResultsProps) {
  const { passed, passedTests, totalTests, executionTime, results, execution } = result

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card
        className={`border-2 ${
          passed
            ? 'border-green-500/50 bg-green-500/5'
            : 'border-red-500/50 bg-red-500/5'
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{passed ? '✅' : '❌'}</span>
              <div>
                <h3 className="font-semibold text-white">
                  {passed ? 'All Tests Passed!' : 'Some Tests Failed'}
                </h3>
                <p className="text-sm text-gray-400">
                  {passedTests} of {totalTests} tests passing
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono text-gray-400">{executionTime}ms</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Test Cases Results */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
          Test Results
        </h4>

        {results.map((testResult, idx) => (
          <Card
            key={idx}
            className={`border-l-4 ${
              testResult.passed ? 'border-l-green-500' : 'border-l-red-500'
            }`}
          >
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Test Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{testResult.passed ? '✓' : '✗'}</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Test {idx + 1}
                        {testResult.testCase.description && (
                          <span className="text-gray-400 ml-2">
                            – {testResult.testCase.description}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={testResult.passed ? 'text-green-400' : 'text-red-400'}>
                    {testResult.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* Input/Output Comparison */}
                {testResult.testCase.input && (
                  <div className="text-sm">
                    <p className="text-gray-400 mb-1">Input:</p>
                    <code className="block bg-black/30 px-3 py-2 rounded text-xs font-mono text-gray-300 overflow-x-auto">
                      {testResult.testCase.input}
                    </code>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Expected Output:</p>
                    <code
                      className={`block px-3 py-2 rounded text-xs font-mono overflow-x-auto ${
                        testResult.passed
                          ? 'bg-green-500/10 text-green-300'
                          : 'bg-red-500/10 text-red-300'
                      }`}
                    >
                      {testResult.expected || '(empty)'}
                    </code>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Your Output:</p>
                    <code
                      className={`block px-3 py-2 rounded text-xs font-mono overflow-x-auto ${
                        testResult.passed
                          ? 'bg-green-500/10 text-green-300'
                          : 'bg-red-500/10 text-red-300'
                      }`}
                    >
                      {testResult.actual || '(empty)'}
                    </code>
                  </div>
                </div>

                {/* Error Message */}
                {testResult.error && (
                  <div className="text-sm">
                    <p className="text-red-400 mb-1">Error:</p>
                    <code className="block bg-red-500/10 px-3 py-2 rounded text-xs font-mono text-red-300 overflow-x-auto">
                      {testResult.error}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution Output (stderr) */}
      {execution.stderr && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <h4 className="text-sm font-semibold text-yellow-400">⚠️ Warnings/Errors</h4>
          </CardHeader>
          <CardContent>
            <code className="block bg-black/30 px-3 py-2 rounded text-xs font-mono text-yellow-200 overflow-x-auto max-h-48 overflow-y-auto">
              {execution.stderr}
            </code>
          </CardContent>
        </Card>
      )}

      {/* Console Output */}
      {execution.stdout && !passed && (
        <Card className="border-gray-600/50">
          <CardHeader>
            <h4 className="text-sm font-semibold text-gray-300">Console Output</h4>
          </CardHeader>
          <CardContent>
            <code className="block bg-black/30 px-3 py-2 rounded text-xs font-mono text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
              {execution.stdout}
            </code>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
