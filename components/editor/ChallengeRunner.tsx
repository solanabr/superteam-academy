'use client'

import React, { useState } from 'react'
import { CodeEditor } from './CodeEditor'
import { TestResults } from './TestResults'
import { Button, Card } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'
import { useAwardXP } from '@/lib/hooks/useAwardXP'
import { TestRunnerService } from '@/lib/services/test-runner.service'
import type { TestCase as ServiceTestCase, TestRunnerResult } from '@/lib/services/test-runner.service'

export interface TestCase {
  input?: string
  expectedOutput: string
  description?: string
  hidden?: boolean
}

interface ChallengeRunnerProps {
  language?: 'javascript' | 'typescript' | 'python' | 'rust'
  starterCode: string
  testCases: TestCase[]
  solutionCode?: string
  onComplete?: () => void
  courseId?: string
  lessonId?: string
  xpReward?: number
}

export function ChallengeRunner({
  language = 'javascript',
  starterCode,
  testCases,
  solutionCode,
  onComplete,
  courseId,
  lessonId,
  xpReward = testCases.length * 25,
}: ChallengeRunnerProps) {
  const { t } = useI18n()
  const { awardXP, isAwarding, error: xpError, isAuthenticated } = useAwardXP()
  const [code, setCode] = useState(starterCode)
  const [result, setResult] = useState<TestRunnerResult | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [xpClaimed, setXpClaimed] = useState(false)

  const executeCode = async (userCode: string) => {
    setIsExecuting(true)
    setError(null)

    try {
      // Only JavaScript/TypeScript supported in Phase 2
      if (language !== 'javascript' && language !== 'typescript') {
        setError(`${language} execution requires backend support (coming in Phase 3)`)
        setIsExecuting(false)
        return
      }

      // Run tests using TestRunnerService
      const testResult = await TestRunnerService.runTests(
        userCode,
        testCases as ServiceTestCase[],
        language
      )

      setResult(testResult)

      // Call onComplete if all tests passed
      if (testResult.passed && onComplete) {
        onComplete()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(errorMsg)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleRun = (userCode: string) => {
    executeCode(userCode)
  }

  const handleClaimRewards = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to claim rewards')
      return
    }

    if (!courseId || !lessonId) {
      setError('Course or lesson information missing')
      return
    }

    const xpResult = await awardXP({
      courseId,
      lessonId,
      xpAmount: xpReward,
    })

    if (xpResult.success) {
      setXpClaimed(true)
      alert(
        `🎉 Rewards Claimed!\n\n` +
        `XP Awarded: +${xpResult.xpAwarded}\n` +
        `Total XP: ${xpResult.totalXp}\n` +
        `Level: ${xpResult.level}`
      )
    } else {
      setError(xpResult.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Code Editor */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">{t('challenge.starterCode')}</h3>
        <CodeEditor
          language={
            language === 'python' || language === 'rust'
              ? 'rust'
              : (language as 'javascript' | 'typescript')
          }
          value={code}
          onChange={setCode}
          defaultValue={starterCode}
          onRun={handleRun}
          height="400px"
        />
      </div>

      {/* Test Cases */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">{t('challenge.testCases')}</h3>
        <div className="space-y-2">
          {testCases.map((testCase, idx) => (
            <div
              key={idx}
              className="bg-terminal-surface border border-terminal-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{testCase.description}</span>
                <span className="text-xs text-gray-500">Test {idx + 1}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <p className="text-gray-500 mb-1">Input:</p>
                  <p className="text-neon-cyan bg-terminal-bg rounded p-2">{testCase.input}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Expected Output:</p>
                  <p className="text-neon-green bg-terminal-bg rounded p-2">
                    {testCase.expectedOutput}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Messages */}
      {(error || xpError) && (
        <Card className="border-red-500/50 bg-red-500/5">
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400 font-semibold">⚠️ Error</p>
            <p className="text-red-300 text-sm mt-2">{error || xpError}</p>
          </div>
        </Card>
      )}

      {/* Execution Results */}
      {result && (
        <>
          <TestResults result={result} />

          {/* Solution Button */}
          {solutionCode && !result.passed && (
            <div className="border-t border-terminal-border pt-4">
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="text-neon-cyan hover:text-neon-cyan/70 text-sm font-semibold flex items-center gap-2"
              >
                <span>{showSolution ? '▼' : '▶'}</span> {t('lesson.showSolution')}
              </button>
              {showSolution && (
                <div className="mt-3">
                  <CodeEditor
                    language={
                      language === 'python' || language === 'rust'
                        ? 'rust'
                        : (language as 'javascript' | 'typescript')
                    }
                    value={solutionCode}
                    readonly
                    height="300px"
                  />
                </div>
              )}
            </div>
          )}

          {/* Success State */}
          {result.passed && (
            <div className="bg-gradient-to-r from-neon-green/10 to-neon-cyan/10 border-2 border-neon-green rounded-lg p-6 text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-neon-green mb-2">Challenge Completed!</h3>
              <p className="text-gray-300 mb-4">Great job! All tests passed.</p>
              <Button 
                onClick={handleClaimRewards} 
                disabled={isAwarding || xpClaimed}
                variant="primary"
                size="md"
              >
                {xpClaimed 
                  ? '✅ Rewards Claimed'
                  : isAwarding 
                    ? 'Claiming Rewards...'
                    : `Claim Rewards (+${xpReward} XP)`}
              </Button>
              {!isAuthenticated && (
                <p className="text-yellow-400 text-sm mt-3">Please sign in to claim rewards</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
