'use client'

import { useState, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { Play, RotateCcw, Save, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  initialCode?: string
  language?: string
  onRun?: (code: string) => Promise<{ success: boolean; output: string }>
  onSave?: (code: string) => Promise<void>
}

export function CodeEditor({ 
  initialCode = '// Start coding here...', 
  language = 'rust',
  onRun,
  onSave
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [isRunning, setIsRunning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<{ success: boolean; output: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) setCode(value)
  }

  const handleRun = async () => {
    if (!onRun) {
      setIsRunning(true)
      // Mock run
      setTimeout(() => {
        setResult({ success: true, output: 'Success! Program compiled and executed on Solana Devnet (Simulated).' })
        setIsRunning(false)
      }, 1500)
      return
    }

    setIsRunning(true)
    setResult(null)
    try {
      const res = await onRun(code)
      setResult(res)
    } catch (error) {
      setResult({ success: false, output: 'An error occurred during execution.' })
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setCode(initialCode)
    setResult(null)
  }

  if (!mounted) return (
    <div className="h-[360px] w-full flex items-center justify-center bg-[#1e1e1e] rounded-xl border border-border/50">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-border/50 bg-[#1e1e1e] shadow-2xl">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="h-4 w-px bg-white/10" />
          <Badge variant="outline" className="text-[10px] uppercase font-mono border-white/10 text-white/40 bg-white/5">
            {language}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reset
          </Button>
          <Button 
            size="sm" 
            onClick={handleRun}
            disabled={isRunning}
            className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-2 h-3.5 w-3.5 fill-current" />
            )}
            Run Code
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 min-h-[320px]">
        <Editor
          height="420px"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: false,
            readOnly: isRunning,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
            cursorStyle: 'block',
            cursorBlinking: 'smooth',
          }}
        />
      </div>

      {/* Output Console */}
      {result && (
        <div className={cn(
          "border-t border-white/5 p-4 animate-in slide-in-from-bottom-2 duration-300",
          result.success ? "bg-primary/5" : "bg-red-500/5"
        )}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={cn(
              "text-xs font-bold uppercase tracking-wider",
              result.success ? "text-primary" : "text-red-500"
            )}>
              {result.success ? 'Success' : 'Error'}
            </span>
          </div>
          <pre className="text-sm font-mono text-muted-foreground bg-black/20 p-3 rounded-lg overflow-x-auto">
            {result.output}
          </pre>
        </div>
      )}
    </div>
  )
}
