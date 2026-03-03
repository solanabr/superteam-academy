'use client'

import { ChallengeRunner } from '@/components/editor'
import { useI18n } from '@/lib/hooks/useI18n'
import { Card } from '@/components/ui'
import Link from 'next/link'

/**
 * Demo page showcasing working code execution with JavaScript
 * Shows how ChallengeRunner works with real test validation
 */
export default function CodeExecutionDemo() {
  const { t } = useI18n()

  const jsChallenge = {
    language: 'javascript' as const,
    starterCode: `function add(a, b) {
  // TODO: Implement the add function
  return 0;
}

// Test calls (will be executed)
console.log(add(2, 3));
console.log(add(5, 7));`,
    testCases: [
      {
        input: 'add(2, 3)',
        expectedOutput: '5',
        description: 'Should add 2 + 3',
      },
      {
        input: 'add(5, 7)',
        expectedOutput: '12',
        description: 'Should add 5 + 7',
      },
      {
        input: 'add(10, -5)',
        expectedOutput: '5',
        description: 'Should handle negative numbers',
      },
    ],
    solutionCode: `function add(a, b) {
  return a + b;
}

console.log(add(2, 3));
console.log(add(5, 7));`,
  }

  return (
    <main className="min-h-screen py-12 bg-gray-50 dark:bg-inherit">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl font-bold text-blue-600 dark:text-neon-cyan mb-2">
            Code Execution Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the working code execution engine with real test validation
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/50">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
              ℹ️ About This Demo
            </h2>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>
                <strong>Phase 2 Feature:</strong> Code execution engine with test validation
              </li>
              <li>
                <strong>Supported Languages:</strong> JavaScript and TypeScript
              </li>
              <li>
                <strong>How It Works:</strong> Your code is executed in a sandboxed environment
                and compared against expected outputs
              </li>
              <li>
                <strong>Test Cases:</strong> Each test case has inputs, expected outputs, and
                descriptions
              </li>
              <li>
                <strong>Note:</strong> Rust and Python execution requires backend support
                (coming in Phase 3)
              </li>
            </ul>
          </div>
        </Card>

        {/* Challenge */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Challenge: Simple Addition</h2>
            <p className="text-gray-400 mb-6">
              Implement a function that adds two numbers together. Your solution must pass all
              test cases.
            </p>

            <ChallengeRunner
              language={jsChallenge.language}
              starterCode={jsChallenge.starterCode}
              testCases={jsChallenge.testCases}
              solutionCode={jsChallenge.solutionCode}
              onComplete={() => {
                console.log('Challenge completed!')
              }}
            />
          </div>
        </Card>

        {/* How To Use */}
        <Card className="bg-gray-900 border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">How to Use</h2>
            <ol className="space-y-3 text-sm text-gray-300">
              <li>
                <strong className="text-white">1. Edit the code:</strong> Modify the starter code
                to implement the required function
              </li>
              <li>
                <strong className="text-white">2. Click Run:</strong> Execute your code against
                all test cases
              </li>
              <li>
                <strong className="text-white">3. View Results:</strong> See which tests passed
                or failed with detailed output
              </li>
              <li>
                <strong className="text-white">4. Show Solution:</strong> Click the solution
                button to see the correct implementation
              </li>
            </ol>
          </div>
        </Card>
      </div>
    </main>
  )
}
