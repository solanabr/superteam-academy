import { describe, it, expect } from 'vitest'
import { runTestsAgainstOutput } from '../test-runner'
import type { TestCase } from '../SolanaCodeLesson'

describe('runTestsAgainstOutput', () => {
  it('returns all passed when stdout matches all expected outputs', () => {
    const testCases: TestCase[] = [
      { description: 'Prints hello', expectedOutput: 'Hello' },
      { description: 'Prints world', expectedOutput: 'World' },
    ]

    const result = runTestsAgainstOutput('Hello\nWorld', testCases)

    expect(result.passed).toBe(true)
    expect(result.passedCount).toBe(2)
    expect(result.totalCount).toBe(2)
    expect(result.results[0].passed).toBe(true)
    expect(result.results[1].passed).toBe(true)
  })

  it('returns failed when stdout does not match', () => {
    const testCases: TestCase[] = [
      { description: 'Prints hello', expectedOutput: 'Hello' },
      { description: 'Prints world', expectedOutput: 'World' },
    ]

    const result = runTestsAgainstOutput('Hello\nFoo', testCases)

    expect(result.passed).toBe(false)
    expect(result.passedCount).toBe(1)
    expect(result.totalCount).toBe(2)
    expect(result.results[0].passed).toBe(true)
    expect(result.results[1].passed).toBe(false)
    expect(result.results[1].actual).toBe('Foo')
  })

  it('uses validator function when provided', () => {
    const testCases: TestCase[] = [
      {
        description: 'Contains keyword',
        expectedOutput: 'anything',
        validator: (out: string) => out.includes('magic'),
      },
    ]

    const passResult = runTestsAgainstOutput('some magic text', testCases)
    expect(passResult.passed).toBe(true)

    const failResult = runTestsAgainstOutput('no keyword here', testCases)
    expect(failResult.passed).toBe(false)
  })

  it('handles empty stdout gracefully', () => {
    const testCases: TestCase[] = [
      { description: 'Prints hello', expectedOutput: 'Hello' },
    ]

    const result = runTestsAgainstOutput('', testCases)

    expect(result.passed).toBe(false)
    expect(result.passedCount).toBe(0)
  })

  it('handles empty test cases', () => {
    const result = runTestsAgainstOutput('Hello World', [])

    expect(result.passed).toBe(true)
    expect(result.passedCount).toBe(0)
    expect(result.totalCount).toBe(0)
  })

  it('preserves hidden flag on results', () => {
    const testCases: TestCase[] = [
      { description: 'Visible test', expectedOutput: 'Hello', hidden: false },
      { description: 'Hidden test', expectedOutput: 'Secret', hidden: true },
    ]

    const result = runTestsAgainstOutput('Hello\nSecret', testCases)

    expect(result.results[0].hidden).toBe(false)
    expect(result.results[1].hidden).toBe(true)
  })

  it('matches expected output anywhere in stdout (fallback)', () => {
    // When line-by-line match fails, it falls back to checking if expectedOutput
    // exists anywhere in the entire stdout
    const testCases: TestCase[] = [
      { description: 'Finds keyword', expectedOutput: 'success' },
    ]

    const result = runTestsAgainstOutput('line 1\noperation success\nline 3', testCases)

    // The first line is 'line 1' which doesn't include 'success',
    // but the full stdout includes it, so the fallback check passes
    expect(result.passed).toBe(true)
  })
})
