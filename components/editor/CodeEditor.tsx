'use client'

import React, { useRef, useState } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { Button } from '@/components/ui'
import { useI18n } from '@/lib/hooks/useI18n'

interface CodeEditorProps {
  language?: 'rust' | 'typescript' | 'json' | 'javascript'
  value?: string
  onChange?: (value: string) => void
  readonly?: boolean
  height?: string
  defaultValue?: string
  onRun?: (code: string) => void
}

export function CodeEditor({
  language = 'rust',
  value,
  onChange,
  readonly = false,
  height = '500px',
  defaultValue = '',
  onRun,
}: CodeEditorProps) {
  const { t } = useI18n()
  const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor
  }

  const handleEditorChange: OnChange = (newValue) => {
    if (onChange && newValue) {
      onChange(newValue)
    }
  }

  const handleRun = async () => {
    if (onRun && editorRef.current) {
      setIsRunning(true)
      onRun(editorRef.current.getValue())
      // Simulate delay
      setTimeout(() => setIsRunning(false), 500)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase">{language}</span>
        </div>
        {onRun && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleRun}
            isLoading={isRunning}
            className="text-sm"
          >
            {t('challenge.run')} ▶
          </Button>
        )}
      </div>

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
    </div>
  )
}
