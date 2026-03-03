'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import { useAwardXP } from '@/lib/hooks/useAwardXP'
import { trackEvent } from '@/lib/analytics'
import { TEMPLATES } from './code-templates'
import { OutputPanel } from './OutputPanel'
import { HintsRow, SuccessBanner } from './LessonPanels'
import { runTestsAgainstOutput } from './test-runner'

export type SolanaLanguage = 'rust' | 'typescript' | 'json'

export interface TestCase {
    description: string
    input?: string
    expectedOutput: string
    hidden?: boolean
    validator?: (output: string) => boolean
}

export interface RunResult {
    stdout: string
    stderr: string
    success: boolean
    compileTime?: number
    warnings?: string[]
}

export interface TestResult {
    passed: boolean
    passedCount: number
    totalCount: number
    results: Array<{
        description: string
        passed: boolean
        expected: string
        actual: string
        hidden?: boolean
    }>
}

interface SolanaCodeLessonProps {
    // Challenge data
    prompt?: string
    starterCode: string
    solutionCode?: string
    language?: SolanaLanguage
    testCases?: TestCase[]
    hints?: string[]
    // Metadata
    courseId?: string
    lessonId?: string
    xpReward?: number
    // Layout
    height?: string
    readOnly?: boolean
    showTemplates?: boolean
    onComplete?: (code: string) => void
}

/* ──────────────────────────────────────────────
   Status badge colours
────────────────────────────────────────────── */
const statusColour = (s: 'idle' | 'running' | 'success' | 'error') =>
    ({ idle: 'text-gray-400', running: 'text-yellow-400 animate-pulse', success: 'text-green-400', error: 'text-red-400' }[s])

/* ──────────────────────────────────────────────
   Main component
────────────────────────────────────────────── */
export function SolanaCodeLesson({
    prompt,
    starterCode,
    solutionCode,
    language = 'rust',
    testCases = [],
    hints = [],
    courseId,
    lessonId,
    xpReward = 50,
    height = '480px',
    readOnly = false,
    showTemplates = true,
    onComplete,
}: SolanaCodeLessonProps) {
    const editorRef = useRef<import('monaco-editor').editor.IStandaloneCodeEditor | null>(null)
    const outputRef = useRef<HTMLDivElement>(null)
    const { awardXP, isAwarding, error: xpError, isAuthenticated } = useAwardXP()

    const [code, setCode] = useState(starterCode)
    const [activeLanguage, setActiveLanguage] = useState<SolanaLanguage>(language)
    const [runResult, setRunResult] = useState<RunResult | null>(null)
    const [testResult, setTestResult] = useState<TestResult | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
    const [xpClaimed, setXpClaimed] = useState(false)
    const [activeTab, setActiveTab] = useState<'output' | 'tests'>('output')

    /* keep editor in sync when starterCode prop changes */
    useEffect(() => {
        setCode(starterCode)
        if (editorRef.current) editorRef.current.setValue(starterCode)
    }, [starterCode])

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor

        /* ── custom Solana dark theme ── */
        monaco.editor.defineTheme('solana-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: '22d3ee', fontStyle: 'bold' },
                { token: 'string', foreground: '34d399' },
                { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
                { token: 'number', foreground: 'f59e0b' },
                { token: 'type', foreground: 'a78bfa' },
                { token: 'function', foreground: '60a5fa' },
                { token: 'macro', foreground: 'f472b6' },
            ],
            colors: {
                'editor.background': '#0a0a0f',
                'editor.foreground': '#e2e8f0',
                'editor.lineHighlightBackground': '#1e293b40',
                'editorGutter.background': '#0a0a0f',
                'editorLineNumber.foreground': '#374151',
                'editorLineNumber.activeForeground': '#22d3ee',
                'editor.selectionBackground': '#22d3ee30',
                'editorCursor.foreground': '#22d3ee',
            },
        })
        monaco.editor.setTheme('solana-dark')

        /* ── Rust/Anchor snippets ── */
        if (activeLanguage === 'rust') {
            monaco.languages.registerCompletionItemProvider('rust', {
                provideCompletionItems: (model: import('monaco-editor').editor.ITextModel, position: import('monaco-editor').Position) => {
                    const snippets = [
                        { label: 'anchor_program', insertText: '#[program]\npub mod ${1:my_program} {\n    use super::*;\n\n    pub fn ${2:initialize}(ctx: Context<${3:Initialize}>) -> Result<()> {\n        Ok(())\n    }\n}', detail: 'Anchor #[program] macro' },
                        { label: 'anchor_derive', insertText: '#[derive(Accounts)]\npub struct ${1:MyAccounts}<\'info> {\n    $0\n}', detail: 'Anchor accounts struct' },
                        { label: 'account_attr', insertText: '#[account(${1:init, payer = user, space = ${2:MyAccount::LEN}})]\npub ${3:my_account}: Account<\'info, ${4:MyAccount}>,', detail: '#[account] attribute' },
                        { label: 'pda_seeds', insertText: 'seeds = [b"${1:seed}", ${2:user}.key().as_ref()],\nbump', detail: 'PDA seeds + bump' },
                        { label: 'error_code', insertText: '#[error_code]\npub enum ${1:ErrorCode} {\n    #[msg("${2:Error message}")]\n    ${3:MyError},\n}', detail: 'Anchor error enum' },
                        { label: 'msg', insertText: 'msg!("${1:message}", ${2:value});', detail: 'Anchor logging macro' },
                        { label: 'require', insertText: 'require!(${1:condition}, ${2:ErrorCode::MyError});', detail: 'Anchor require! macro' },
                        { label: 'checked_add', insertText: '.checked_add(${1:value}).ok_or(${2:error})?', detail: 'Safe arithmetic' },
                    ]
                    return {
                        suggestions: snippets.map(s => ({
                            label: s.label,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: s.insertText,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: s.detail,
                            range: {
                                startLineNumber: position.lineNumber,
                                endLineNumber: position.lineNumber,
                                startColumn: position.column - (model.getWordAtPosition(position)?.word.length || 0),
                                endColumn: position.column,
                            },
                        })),
                    }
                },
            })
        }

        editor.updateOptions({ fontLigatures: true })
    }

    /* ── Run code ── */
    const handleRun = useCallback(async () => {
        const currentCode = editorRef.current?.getValue() || code
        if (!currentCode.trim()) return

        setIsRunning(true)
        setStatus('running')
        setRunResult(null)
        setTestResult(null)
        setActiveTab('output')

        trackEvent('challenge_run', { language: activeLanguage, courseId: courseId || '', lessonId: lessonId || '' })

        try {
            const response = await fetch('/api/code-execution/rust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: currentCode,
                    language: activeLanguage === 'rust' ? 'rust' : 'rust',
                    timeout: 30000,
                }),
            })

            const result: RunResult = await response.json()
            setRunResult(result)
            setStatus(result.success ? 'success' : 'error')

            /* Run tests if we have them */
            if (testCases.length > 0) {
                setActiveTab('tests')
                const testResults = runTestsAgainstOutput(result.stdout, testCases)
                setTestResult(testResults)

                if (testResults.passed) {
                    trackEvent('challenge_passed', { language: activeLanguage, courseId: courseId || '', lessonId: lessonId || '' })
                    if (onComplete) {
                        onComplete(currentCode)
                    }
                }
            }

            /* Scroll output into view */
            setTimeout(() => {
                outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 100)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Execution failed'
            setRunResult({ stdout: '', stderr: msg, success: false })
            setStatus('error')
            setTimeout(() => {
                outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }, 100)
        } finally {
            setIsRunning(false)
        }
    }, [code, activeLanguage, testCases, onComplete])

    /* ── Keyboard shortcut: Ctrl/Cmd+Enter to run ── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleRun()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [handleRun])

    const handleClaimXP = async () => {
        if (!courseId || !lessonId) return
        const result = await awardXP({ courseId, lessonId, xpAmount: xpReward })
        if (result.success) {
            setXpClaimed(true)
            trackEvent('xp_claimed', { courseId, lessonId, amount: xpReward })
        }
    }

    const insertTemplate = (name: string) => {
        const tmpl = TEMPLATES[activeLanguage]?.[name]
        if (!tmpl || !editorRef.current) return
        editorRef.current.setValue(tmpl)
        setCode(tmpl)
    }

    const resetCode = () => {
        editorRef.current?.setValue(starterCode)
        setCode(starterCode)
        setRunResult(null)
        setTestResult(null)
        setStatus('idle')
    }

    const allTestsPassed = testResult?.passed ?? false

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f] rounded-xl overflow-hidden border border-slate-700/50 shadow-2xl">
            {/* ── Top Toolbar ── */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e0e18] border-b border-slate-700/50 flex-shrink-0">
                {/* Language tabs */}
                <div className="flex items-center gap-1">
                    {(['rust', 'typescript', 'json'] as SolanaLanguage[]).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setActiveLanguage(lang)}
                            className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors ${activeLanguage === lang
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {lang === 'rust' ? '🦀 Rust/Anchor' : lang === 'typescript' ? '🔷 TypeScript' : '📄 JSON/IDL'}
                        </button>
                    ))}
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${statusColour(status)}`}>
                        {status === 'idle' ? '● ready' : status === 'running' ? '⏳ compiling…' : status === 'success' ? '✓ compiled' : '✗ error'}
                    </span>

                    <button
                        onClick={resetCode}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        title="Reset to starter code"
                    >
                        ↺ reset
                    </button>

                    {showTemplates && TEMPLATES[activeLanguage] && (
                        <select
                            onChange={(e) => { if (e.target.value) insertTemplate(e.target.value) }}
                            className="text-xs bg-slate-800 border border-slate-600 text-gray-300 rounded px-2 py-1 cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>Templates…</option>
                            {Object.keys(TEMPLATES[activeLanguage]).map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-wait text-black font-bold text-xs rounded transition-colors"
                        title="Run (Ctrl+Enter)"
                    >
                        {isRunning ? (
                            <span className="flex items-center gap-1">
                                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Running
                            </span>
                        ) : (
                            <>▶ Run<span className="opacity-60 font-normal">⌘↵</span></>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Editor + Output panel ── */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Monaco Editor */}
                <div className="flex-1 overflow-hidden" style={{ minHeight: height }}>
                    <Editor
                        height={height}
                        language={activeLanguage === 'rust' ? 'rust' : activeLanguage}
                        value={code}
                        onChange={(val) => setCode(val || '')}
                        onMount={handleEditorMount}
                        theme="solana-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13.5,
                            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
                            fontLigatures: true,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 4,
                            insertSpaces: true,
                            readOnly,
                            wordWrap: 'off',
                            padding: { top: 16, bottom: 16 },
                            renderLineHighlight: 'gutter',
                            cursorBlinking: 'smooth',
                            smoothScrolling: true,
                            bracketPairColorization: { enabled: true },
                            guides: { bracketPairs: true, indentation: true },
                            suggest: { showKeywords: true, showSnippets: true },
                            quickSuggestions: { other: true, comments: false, strings: false },
                            scrollbar: { useShadows: false, verticalScrollbarSize: 6, horizontalScrollbarSize: 6, alwaysConsumeMouseWheel: false },
                            overviewRulerLanes: 0,
                            glyphMargin: false,
                            lineDecorationsWidth: 4,
                        }}
                    />
                </div>

                {/* ── Output / Tests Panel ── */}
                <OutputPanel
                    runResult={runResult}
                    testResult={testResult}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </div>

            {/* ── Hints ── */}
            <HintsRow hints={hints} />

            {/* ── Success / Claim XP ── */}
            {allTestsPassed && (
                <SuccessBanner
                    xpReward={xpReward}
                    xpClaimed={xpClaimed}
                    isAuthenticated={isAuthenticated}
                    isAwarding={isAwarding}
                    xpError={xpError}
                    solutionCode={solutionCode}
                    onClaimXP={handleClaimXP}
                />
            )}
        </div>
    )
}


