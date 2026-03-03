'use client'

import React, { useRef, useState, useCallback } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { Button } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'
import { RustExecutionService, type RustExecutionOutput } from '@/lib/services/rust-execution.service'

interface RustEditorProps {
  language?: 'rust' | 'anchor'
  value?: string
  onChange?: (value: string) => void
  readonly?: boolean
  height?: string
  defaultValue?: string
  onRun?: (code: string, output: RustExecutionOutput) => void
  showTemplates?: boolean
}

export function RustEditor({
  language = 'rust',
  value,
  onChange,
  readonly = false,
  height = '600px',
  defaultValue = '',
  onRun,
  showTemplates = true,
}: RustEditorProps) {
  const { t } = useI18n()
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<string>('')
  const [errors, setErrors] = useState<string>('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [compileTime, setCompileTime] = useState<number>(0)

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
    // Configure Rust syntax highlighting
    editor.updateOptions({
      formatOnPaste: true,
      formatOnType: true,
    })
  }

  const handleEditorChange: OnChange = (newValue) => {
    if (onChange && newValue) {
      onChange(newValue)
    }
  }

  const handleRun = useCallback(async () => {
    if (!editorRef.current) return

    setIsRunning(true)
    setOutput('')
    setErrors('')
    setWarnings([])

    try {
      const code = editorRef.current.getValue()
      const result = await RustExecutionService.executeRust(code)

      setOutput(result.stdout)
      setErrors(result.stderr)
      setWarnings(result.warnings || [])
      setCompileTime(result.compileTime || 0)

      if (onRun) {
        onRun(code, result)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Execution failed'
      setErrors(message)
    } finally {
      setIsRunning(false)
    }
  }, [onRun])

  const handleInsertTemplate = useCallback((templateType: 'rust' | 'anchor' | 'anchor-instruction') => {
    if (!editorRef.current) return

    const template = RustExecutionService.getTemplate(templateType)
    editorRef.current.setValue(template)
    if (onChange) {
      onChange(template)
    }
  }, [onChange])

  const handleClear = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.setValue('')
      if (onChange) {
        onChange('')
      }
    }
  }, [onChange])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cyan-400 uppercase">{language}</span>
          {compileTime > 0 && (
            <span className="text-xs text-gray-400">Compiled in {compileTime}ms</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showTemplates && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleInsertTemplate('rust')}
                className="text-xs"
              >
                Basic
              </Button>
              {language === 'anchor' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleInsertTemplate('anchor')}
                    className="text-xs"
                  >
                    Program
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleInsertTemplate('anchor-instruction')}
                    className="text-xs"
                  >
                    Instruction
                  </Button>
                </>
              )}
            </div>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={handleClear}
            className="text-xs"
          >
            Clear
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleRun}
            isLoading={isRunning}
            className="text-sm"
          >
            {isRunning ? 'Running...' : 'Run ▶'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="border-2 border-terminal-border rounded-lg overflow-hidden">
        <Editor
          height={height}
          language={language}
          value={value || defaultValue}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            insertSpaces: true,
            readOnly: readonly,
            wordWrap: 'on',
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'gutter',
            cursorBlinking: 'blink',
            smoothScrolling: true,
          }}
          defaultLanguage={language}
          defaultValue={defaultValue}
        />
      </div>

      {/* Output Section */}
      {(output || errors || warnings.length > 0) && (
        <div className="space-y-2">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
              <div className="text-xs font-semibold text-yellow-400 mb-2">
                ⚠ Warnings ({warnings.length})
              </div>
              <div className="text-xs text-yellow-200 space-y-1 font-mono">
                {warnings.map((warning, i) => (
                  <div key={i}>{warning}</div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors && (
            <div className="bg-red-900/20 border border-red-700/50 rounded p-3">
              <div className="text-xs font-semibold text-red-400 mb-2">✗ Errors</div>
              <div className="text-xs text-red-200 font-mono whitespace-pre-wrap break-words">
                {errors}
              </div>
            </div>
          )}

          {/* Output */}
          {output && (
            <div className="bg-green-900/20 border border-green-700/50 rounded p-3">
              <div className="text-xs font-semibold text-green-400 mb-2">✓ Output</div>
              <div className="text-xs text-green-200 font-mono whitespace-pre-wrap break-words">
                {output}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
