# Code Editor Service

## Overview

The Code Editor Service provides an integrated code editing experience with syntax highlighting, test execution, and pass/fail feedback.

## Editor Options

Using **Monaco Editor** (VS Code's editor)

## Features

- Rust/TypeScript/JSON syntax highlighting
- Basic autocompletion
- Error display
- Test case execution
- Pass/fail feedback
- Real-time output display
- Success celebration

## Implementation

### 1. Monaco Editor Setup

```typescript
// components/editor/CodeEditor.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { TestRunner } from './TestRunner';
import { Button } from '@/components/ui/button';

interface CodeEditorProps {
  language: 'rust' | 'typescript' | 'json';
  starterCode: string;
  testCases: TestCase[];
  savedCode?: string | null;
  onSave: (code: string) => void;
  onComplete: () => void;
  isCompleted: boolean;
}

export function CodeEditor({
  language,
  starterCode,
  testCases,
  savedCode,
  onSave,
  onComplete,
  isCompleted,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);
  const [code, setCode] = useState(savedCode || starterCode);
  const [output, setOutput] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  
  useAutoSave({ data: code, onSave, debounce: 2000 });
  
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
    });
  };
  
  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };
  
  const runTests = async () => {
    setIsRunning(true);
    setOutput(['Running tests...']);
    setTestResults([]);
    
    try {
      const results = await executeTests(code, testCases, language);
      setTestResults(results);
      
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      
      setOutput([
        `Tests: ${passed}/${total} passed`,
        ...results.map(r => 
          `${r.passed ? '✓' : '✗'} Test ${r.testCaseId}: ${r.passed ? 'Passed' : r.error || 'Failed'}`
        ),
      ]);
      
      if (passed === total && !isCompleted) {
        onComplete();
      }
    } catch (error) {
      setOutput([`Error: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };
  
  const resetCode = () => {
    setCode(starterCode);
    setTestResults([]);
    setOutput([]);
  };
  
  return (
    <div className="code-editor-container">
      <div className="editor-toolbar">
        <div className="language-badge">{language}</div>
        <div className="actions">
          <Button variant="outline" size="sm" onClick={resetCode}>
            Reset
          </Button>
          <Button 
            onClick={runTests} 
            disabled={isRunning || isCompleted}
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </div>
      
      <div className="editor-wrapper">
        <Editor
          height="400px"
          language={language === 'rust' ? 'rust' : language === 'typescript' ? 'typescript' : 'json'}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            readOnly: isCompleted,
          }}
        />
      </div>
      
      <div className="output-panel">
        <div className="output-header">
          <h4>Output</h4>
          {testResults.length > 0 && (
            <span className="test-summary">
              {testResults.filter(r => r.passed).length}/{testResults.length} passed
            </span>
          )}
        </div>
        <div className="output-content">
          {output.map((line, i) => (
            <div key={i} className="output-line">{line}</div>
          ))}
        </div>
      </div>
      
      <div className="test-cases">
        <h4>Test Cases</h4>
        {testCases.map((tc, i) => (
          <div key={tc.id} className={`test-case ${getTestStatus(testResults, tc.id)}`}>
            <span className="test-number">Test {i + 1}</span>
            {!tc.isHidden && (
              <div className="test-details">
                <span className="input">Input: {tc.input}</span>
                <span className="expected">Expected: {tc.expectedOutput}</span>
              </div>
            )}
            {getTestResult(testResults, tc.id) && (
              <span className="result">
                {getTestResult(testResults, tc.id)!.passed ? '✓' : '✗'}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {isCompleted && (
        <div className="completion-celebration">
          <div className="confetti">🎉</div>
          <h3>Congratulations!</h3>
          <p>You've completed this challenge!</p>
        </div>
      )}
    </div>
  );
}
```

### 2. Test Executor (Stub)

```typescript
// lib/test-executor.ts
import { TestCase, TestResult } from '@/types/lesson';

export async function executeTests(
  code: string,
  testCases: TestCase[],
  language: string
): Promise<TestResult[]> {
  // In production, this would:
  // 1. Send code to a sandboxed execution environment
  // 2. Run each test case
  // 3. Return results
  
  // For MVP, we'll use a simple stub that simulates execution
  const results: TestResult[] = [];
  
  for (const tc of testCases) {
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Stub: check if code contains expected patterns
    const passed = checkCodePattern(code, tc, language);
    
    results.push({
      testCaseId: tc.id,
      passed,
      actualOutput: passed ? tc.expectedOutput : undefined,
      error: passed ? undefined : 'Output does not match expected result',
    });
  }
  
  return results;
}

function checkCodePattern(code: string, testCase: TestCase, language: string): boolean {
  // Simple pattern matching for demo
  // In production, this would actually execute the code
  
  // Check for obvious errors
  if (code.includes('TODO') || code.includes('FIXME')) {
    return false;
  }
  
  // For demo purposes, return true if code is substantially different from starter
  return code.length > 50;
}
```

### 3. Solana Playground Integration (Alternative)

```typescript
// components/editor/SolanaPlaygroundEditor.tsx
'use client';

import { useRef, useEffect } from 'react';

interface SolanaPlaygroundEditorProps {
  projectId?: string;
  onRun?: () => void;
  onComplete?: () => void;
}

export function SolanaPlaygroundEditor({ 
  projectId, 
  onRun, 
  onComplete 
}: SolanaPlaygroundEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://beta.solpg.io') return;
      
      if (event.data.type === 'build_complete') {
        onRun?.();
      }
      
      if (event.data.type === 'test_complete') {
        if (event.data.allPassed) {
          onComplete?.();
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRun, onComplete]);
  
  return (
    <div className="solana-playground-container">
      <iframe
        ref={iframeRef}
        src={`https://beta.solpg.io/${projectId || ''}`}
        className="w-full h-[600px] border-0"
        allow="cross-origin-isolated"
      />
    </div>
  );
}
```

### 4. Resizable Split Layout

```typescript
// components/editor/SplitLayout.tsx
'use client';

import { useState, useRef, ReactNode } from 'react';

interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
  defaultLeftWidth?: number; // percentage
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

export function SplitLayout({
  left,
  right,
  defaultLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70,
}: SplitLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = () => {
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    setLeftWidth(Math.min(maxLeftWidth, Math.max(minLeftWidth, newWidth)));
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  return (
    <div
      ref={containerRef}
      className="split-layout"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="split-left" style={{ width: `${leftWidth}%` }}>
        {left}
      </div>
      
      <div
        className={`split-divider ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      />
      
      <div className="split-right" style={{ width: `${100 - leftWidth}%` }}>
        {right}
      </div>
    </div>
  );
}
```

## Supported Languages

| Language | Monaco ID | Features |
|----------|-----------|----------|
| Rust | `rust` | Syntax, autocomplete, errors |
| TypeScript | `typescript` | Syntax, autocomplete, type checking |
| JSON | `json` | Syntax, validation |

## Editor Configuration

```typescript
// lib/editor-config.ts
export const editorConfig = {
  rust: {
    language: 'rust',
    tabSize: 4,
    insertSpaces: true,
  },
  typescript: {
    language: 'typescript',
    tabSize: 2,
    insertSpaces: true,
  },
  json: {
    language: 'json',
    tabSize: 2,
    insertSpaces: true,
  },
};

export const theme = {
  dark: 'vs-dark',
  light: 'vs',
};
```

## Future: Real Code Execution

For production, code execution should be done in a sandboxed environment:
1. Send code to backend
2. Backend spins up isolated container
3. Execute code with test inputs
4. Return results

This ensures security and prevents malicious code execution.
