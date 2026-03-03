import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OutputPanel } from '../OutputPanel'
import type { RunResult, TestResult } from '../SolanaCodeLesson'

describe('OutputPanel', () => {
  const mockOnTabChange = vi.fn()

  const baseRunResult: RunResult = {
    stdout: 'Hello, World!',
    stderr: '',
    success: true,
    compileTime: 42,
  }

  const baseTestResult: TestResult = {
    passed: true,
    passedCount: 2,
    totalCount: 2,
    results: [
      { description: 'Test 1', passed: true, expected: 'Hello', actual: 'Hello' },
      { description: 'Test 2', passed: true, expected: 'World', actual: 'World' },
    ],
  }

  it('renders nothing when no results provided', () => {
    const { container } = render(
      <OutputPanel
        runResult={null}
        testResult={null}
        activeTab="output"
        onTabChange={mockOnTabChange}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders output tab with stdout', () => {
    render(
      <OutputPanel
        runResult={baseRunResult}
        testResult={null}
        activeTab="output"
        onTabChange={mockOnTabChange}
      />
    )
    expect(screen.getByText('Hello, World!')).toBeInTheDocument()
  })

  it('shows success status indicator', () => {
    render(
      <OutputPanel
        runResult={baseRunResult}
        testResult={null}
        activeTab="output"
        onTabChange={mockOnTabChange}
      />
    )
    expect(screen.getByText(/✓ success/)).toBeInTheDocument()
    expect(screen.getByText(/42ms/)).toBeInTheDocument()
  })

  it('shows error status for failed runs', () => {
    const failedResult: RunResult = {
      stdout: '',
      stderr: 'Compilation error',
      success: false,
    }
    render(
      <OutputPanel
        runResult={failedResult}
        testResult={null}
        activeTab="output"
        onTabChange={mockOnTabChange}
      />
    )
    expect(screen.getByText(/✗ failed/)).toBeInTheDocument()
    expect(screen.getByText('Compilation error')).toBeInTheDocument()
  })

  it('displays test results tab with pass/fail counts', () => {
    render(
      <OutputPanel
        runResult={baseRunResult}
        testResult={baseTestResult}
        activeTab="tests"
        onTabChange={mockOnTabChange}
      />
    )
    expect(screen.getByText(/Tests.*2\/2/)).toBeInTheDocument()
  })

  it('calls onTabChange when clicking tabs', () => {
    render(
      <OutputPanel
        runResult={baseRunResult}
        testResult={baseTestResult}
        activeTab="output"
        onTabChange={mockOnTabChange}
      />
    )
    const testsTab = screen.getByText(/Tests/)
    fireEvent.click(testsTab)
    expect(mockOnTabChange).toHaveBeenCalledWith('tests')
  })

  it('shows warnings when present', () => {
    const resultWithWarnings: RunResult = {
      ...baseRunResult,
      warnings: ['unused variable x', 'dead code detected'],
    }
    render(
      <OutputPanel
        runResult={resultWithWarnings}
        testResult={null}
        activeTab="output"
        onTabChange={mockOnTabChange}
      />
    )
    expect(screen.getByText('unused variable x')).toBeInTheDocument()
    expect(screen.getByText('dead code detected')).toBeInTheDocument()
  })

  it('shows "(no output)" when no stdout/stderr', () => {
    const emptyResult: RunResult = {
      stdout: '',
      stderr: '',
      success: true,
    }
    render(
      <OutputPanel
        runResult={emptyResult}
        testResult={null}
        activeTab="output"
        onTabChange={mockOnTabChange}
      />
    )
    expect(screen.getByText('(no output)')).toBeInTheDocument()
  })
})
