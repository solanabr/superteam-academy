'use client'

import React from 'react'
import type { RunResult, TestResult } from './SolanaCodeLesson'

interface OutputPanelProps {
  runResult: RunResult | null
  testResult: TestResult | null
  activeTab: 'output' | 'tests'
  onTabChange: (tab: 'output' | 'tests') => void
}

/**
 * Output and test results panel for the code editor.
 * Displays compilation output, warnings, errors, and test case results.
 */
export const OutputPanel: React.FC<OutputPanelProps> = ({
  runResult,
  testResult,
  activeTab,
  onTabChange,
}) => {
  if (!runResult && !testResult) return null

  return (
    <div className="border-t border-slate-700/50 bg-[#0e0e18] flex-shrink-0">
      {/* Tab header */}
      <div className="flex items-center gap-0 border-b border-slate-700/50 px-4">
        {(['output', 'tests'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab === 'output'
              ? '📤 Output'
              : `🧪 Tests ${testResult ? `(${testResult.passedCount}/${testResult.totalCount})` : ''}`}
          </button>
        ))}

        {runResult && (
          <span
            className={`ml-auto text-xs font-mono ${runResult.success ? 'text-green-400' : 'text-red-400'}`}
          >
            {runResult.success ? '✓ success' : '✗ failed'}{' '}
            {runResult.compileTime ? `(${runResult.compileTime}ms)` : ''}
          </span>
        )}
      </div>

      <div className="p-4 space-y-2">
        {activeTab === 'output' && runResult && (
          <>
            {runResult.warnings && runResult.warnings.length > 0 && (
              <div className="text-xs font-mono text-yellow-400 bg-yellow-900/10 border border-yellow-800/30 rounded p-3 space-y-0.5">
                <p className="font-semibold mb-1">⚠ Warnings</p>
                {runResult.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            )}
            {runResult.stderr && (
              <pre className="text-xs font-mono text-red-300 bg-red-900/10 border border-red-800/30 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
                {runResult.stderr}
              </pre>
            )}
            {runResult.stdout && (
              <pre className="text-xs font-mono text-green-300 bg-green-900/10 border border-green-800/30 rounded p-3 overflow-x-auto whitespace-pre-wrap">
                {runResult.stdout}
              </pre>
            )}
            {!runResult.stdout && !runResult.stderr && (
              <p className="text-xs text-gray-500 italic">(no output)</p>
            )}
          </>
        )}

        {activeTab === 'tests' && testResult && (
          <div className="space-y-2">
            {testResult.results.map((r, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded text-xs border ${
                  r.passed
                    ? 'bg-green-900/10 border-green-800/30'
                    : 'bg-red-900/10 border-red-800/30'
                }`}
              >
                <span className={`font-bold mt-0.5 ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {r.passed ? '✓' : '✗'}
                </span>
                <div className="flex-1 space-y-1">
                  <p className={r.passed ? 'text-green-300' : 'text-red-300'}>{r.description}</p>
                  {!r.passed && !r.hidden && (
                    <>
                      <p className="text-gray-400">
                        Expected: <span className="font-mono text-cyan-300">{r.expected}</span>
                      </p>
                      <p className="text-gray-400">
                        Got: <span className="font-mono text-orange-300">{r.actual || '(empty)'}</span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
