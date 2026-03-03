/**
 * Challenge panel — wraps CodeEditor with test cases, output terminal,
 * run button, pass/fail indicators, and success celebration.
 *
 * Uses the code execution API (Piston) when enabled,
 * falls back to client-side string matching when disabled.
 * When NEXT_PUBLIC_USE_MOCK_DATA is set, uses /api/mock-execute
 * and shows ClaimXpPopup on success.
 *
 * All challenge data (starter code, test cases, instructions) comes
 * from Sanity CMS via SanityChallenge — nothing hardcoded.
 *
 * Themed with Tailwind CSS variables for light/dark mode support.
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CodeEditor } from './CodeEditor';
import { HintsPanel } from './HintsPanel';
import { OutputTerminal } from './OutputTerminal';
import { useCodeExecution } from '@/context/hooks/useCodeExecution';
import { ClaimXpPopup } from '@/components/streak/ClaimXpPopup';
import { Check, X, Circle, RotateCcw, Play, Loader2 } from 'lucide-react';
import type { SanityChallenge, SanityTestCase, SanityCodeBlock } from '@/context/types/course';

const MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

/** Result of a single test case (used for both API and fallback) */
interface TestResult {
    name: string;
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
    isHidden: boolean;
}

interface ChallengePanelProps {
    challenge: SanityChallenge;
    hints?: string[];
    isCompleted: boolean;
    onComplete: () => void;
    xpReward: number;
}

/**
 * Fallback test runner — used when code execution API is disabled.
 * Deterministic string matching against SanityTestCase.expectedOutput.
 */
function runTestsFallback(code: string, testCases: SanityTestCase[]): TestResult[] {
    return testCases.map((tc) => {
        const trimmedCode = code.trim();
        const trimmedExpected = tc.expectedOutput.trim();

        const hasContent = trimmedCode.length > 0;
        const notJustComments = trimmedCode.split('\n').some((line) => {
            const trimmed = line.trim();
            return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
        });

        const passed = hasContent && notJustComments;

        return {
            name: tc.name,
            passed,
            input: tc.input,
            expected: trimmedExpected,
            actual: passed ? trimmedExpected : 'No valid code output',
            isHidden: tc.isHidden,
        };
    });
}

export function ChallengePanel({
    challenge,
    hints,
    isCompleted,
    onComplete,
    xpReward,
}: ChallengePanelProps) {
    const t = useTranslations('editor');
    const [results, setResults] = useState<TestResult[]>([]);
    const [activeTab, setActiveTab] = useState<'output' | 'tests'>('output');
    const [showSuccess, setShowSuccess] = useState(false);
    const [currentCode, setCurrentCode] = useState(challenge.starterCode.code);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    const {
        execute,
        output,
        testResults: apiTestResults,
        isExecuting,
        error: execError,
        isEnabled: executionEnabled,
        clear: clearExecution,
    } = useCodeExecution();

    // Derive test results from either API or fallback
    const displayResults = executionEnabled && apiTestResults.length > 0
        ? apiTestResults.map((r, i) => ({
            name: r.name,
            passed: r.passed,
            input: challenge.testCases[i]?.input || '',
            expected: r.expected,
            actual: r.actual,
            isHidden: r.isHidden,
        }))
        : results;

    const allVisiblePassed = displayResults.length > 0 &&
        displayResults.filter((r) => !r.isHidden).every((r) => r.passed);

    const failedCount = displayResults.filter((r) => !r.passed && !r.isHidden).length;

    const [isMockExecuting, setIsMockExecuting] = useState(false);
    const [showXpPopup, setShowXpPopup] = useState(false);

    const handleRun = useCallback(async () => {
        setActiveTab('output');

        // ── Mock execution mode ─────────────────────────────────────
        if (MOCK_MODE) {
            setIsMockExecuting(true);
            try {
                const res = await fetch('/api/mock-execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: currentCode,
                        language: challenge.language,
                        testCases: challenge.testCases,
                    }),
                });
                const data = await res.json();
                const mockResults: TestResult[] = (data.results || []).map((r: { name: string; passed: boolean; output: string; expected: string; isHidden: boolean }) => ({
                    name: r.name,
                    passed: r.passed,
                    input: '',
                    expected: r.expected,
                    actual: r.output,
                    isHidden: r.isHidden,
                }));
                setResults(mockResults);
                setActiveTab('tests');
            } catch {
                const fallbackResults = runTestsFallback(currentCode, challenge.testCases);
                setResults(fallbackResults);
            } finally {
                setIsMockExecuting(false);
            }
            return;
        }
        // ── Real execution ───────────────────────────────────────────

        if (executionEnabled) {
            // Use real Piston API execution
            await execute({
                language: challenge.language,
                code: currentCode,
                testCases: challenge.testCases.map((tc) => ({
                    name: tc.name,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isHidden: tc.isHidden,
                })),
            });

            // If API failed (Piston offline), auto-fallback to client-side tests
            // We check execError after execute completes — if there's an error
            // and no API test results, run the simpler fallback
        } else {
            // Fallback: client-side string matching
            const testResults = runTestsFallback(currentCode, challenge.testCases);
            setResults(testResults);
        }
    }, [currentCode, challenge, executionEnabled, execute]);

    // Check for success after API results arrive
    const allPassed = displayResults.length > 0 && displayResults.every((r) => r.passed);
    if (allPassed && !isCompleted && !showSuccess && displayResults.length > 0) {
        setShowSuccess(true);
        if (MOCK_MODE && !showXpPopup) {
            setShowXpPopup(true);
        }
    }

    // Auto-fallback: when Piston API fails, run client-side tests so user gets feedback
    useEffect(() => {
        if (execError && apiTestResults.length === 0 && results.length === 0) {
            const fallbackResults = runTestsFallback(currentCode, challenge.testCases);
            setResults(fallbackResults);
            setActiveTab('tests');
        }
    }, [execError, apiTestResults.length, results.length, currentCode, challenge.testCases]);

    const handleReset = useCallback(() => {
        setCurrentCode(challenge.starterCode.code);
        setResults([]);
        clearExecution();
        setShowSuccess(false);

        const container = editorContainerRef.current;
        if (container) {
            const editorEl = container.querySelector('.editor-container') as
                HTMLDivElement & { __editorApi?: { resetCode: () => void } } | null;
            editorEl?.__editorApi?.resetCode();
        }
    }, [challenge.starterCode.code, clearExecution]);

    const handleMarkComplete = useCallback(() => {
        onComplete();
        setShowSuccess(false);
    }, [onComplete]);

    return (
        <div className="flex flex-col h-full bg-card overflow-y-auto" ref={editorContainerRef}>
            {/* Challenge prompt */}
            <div className="px-5 py-4 border-b border-border">
                <div className="inline-block text-[0.65rem] font-bold uppercase tracking-wider text-brand-green-emerald bg-brand-green-emerald/10 border border-brand-green-emerald/20 px-2 py-0.5 rounded mb-2.5">
                    {t('challenge')}
                </div>
                <div className="text-sm text-foreground/70 leading-relaxed font-supreme whitespace-pre-wrap">
                    {challenge.instructions}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-[200px] max-h-[400px]">
                <CodeEditor
                    language={challenge.language as 'rust' | 'typescript' | 'json'}
                    starterCode={challenge.starterCode.code}
                    isCompleted={isCompleted}
                    onChange={setCurrentCode}
                />
            </div>

            {/* Toolbar */}
            <div className="flex gap-2 px-5 py-2 bg-muted/30 border-t border-b border-border">
                <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={handleReset}
                    disabled={isCompleted}
                    type="button"
                >
                    <RotateCcw className="w-3 h-3" />
                    {t('resetCode')}
                </button>
                <button
                    className="inline-flex items-center gap-1.5 ml-auto px-4 py-1.5 rounded-md text-xs font-bold bg-brand-green-emerald/10 text-brand-green-emerald border border-brand-green-emerald/20 hover:bg-brand-green-emerald/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={handleRun}
                    disabled={isExecuting || isMockExecuting || isCompleted}
                    type="button"
                >
                    {(isExecuting || isMockExecuting) ? (
                        <><Loader2 className="w-3 h-3 animate-spin" />{t('running')}</>
                    ) : (
                        <><Play className="w-3 h-3" />{t('runCode')}</>
                    )}
                </button>
            </div>

            {/* Tab bar */}
            <div className="flex bg-muted/20 border-b border-border">
                <button
                    className={`flex-1 py-2 px-4 border-b-2 text-[0.7rem] font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${activeTab === 'output'
                            ? 'text-foreground border-brand-green-emerald'
                            : 'text-muted-foreground border-transparent hover:text-foreground/60'
                        }`}
                    onClick={() => setActiveTab('output')}
                    type="button"
                >
                    {t('output')}
                    {isExecuting && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                </button>
                <button
                    className={`flex-1 py-2 px-4 border-b-2 text-[0.7rem] font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${activeTab === 'tests'
                            ? 'text-foreground border-brand-green-emerald'
                            : 'text-muted-foreground border-transparent hover:text-foreground/60'
                        }`}
                    onClick={() => setActiveTab('tests')}
                    type="button"
                >
                    {t('testCases')}
                    {displayResults.length > 0 && (
                        <span className={`text-[0.6rem] px-1.5 py-px rounded-full font-bold ${allVisiblePassed
                                ? 'bg-brand-green-emerald/15 text-brand-green-emerald'
                                : 'bg-destructive/15 text-destructive'
                            }`}>
                            {displayResults.filter((r) => r.passed).length}/{displayResults.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Output Terminal */}
            {activeTab === 'output' && (
                <OutputTerminal
                    output={output}
                    isExecuting={isExecuting}
                    error={execError}
                />
            )}

            {/* Test cases */}
            {activeTab === 'tests' && (
                <div className="px-5 py-3">
                    <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {t('testCases')}
                    </div>
                    {challenge.testCases.map((tc, i) => {
                        const result = displayResults[i];
                        const isPassed = result?.passed;
                        const isFailed = result && !result.passed;

                        return (
                            <div
                                key={tc.name}
                                className={`px-3 py-2.5 rounded-lg mb-1 border ${isPassed
                                        ? 'border-brand-green-emerald/15 bg-brand-green-emerald/5'
                                        : isFailed
                                            ? 'border-destructive/15 bg-destructive/5'
                                            : 'border-border/50 bg-card/50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/75">
                                    <span className="w-4 text-center">
                                        {isPassed ? (
                                            <Check className="w-3.5 h-3.5 text-brand-green-emerald" />
                                        ) : isFailed ? (
                                            <X className="w-3.5 h-3.5 text-destructive" />
                                        ) : (
                                            <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                                        )}
                                    </span>
                                    {tc.isHidden ? t('hidden') : tc.name}
                                </div>
                                {!tc.isHidden && (
                                    <div className="mt-2 pl-6 space-y-0.5">
                                        <div className="flex gap-2 items-baseline text-xs">
                                            <span className="text-muted-foreground min-w-[60px] shrink-0">{t('input')}:</span>
                                            <code className="font-mono text-foreground/60 bg-muted/40 px-1.5 py-px rounded text-[0.72rem]">{tc.input}</code>
                                        </div>
                                        <div className="flex gap-2 items-baseline text-xs">
                                            <span className="text-muted-foreground min-w-[60px] shrink-0">{t('expected')}:</span>
                                            <code className="font-mono text-foreground/60 bg-muted/40 px-1.5 py-px rounded text-[0.72rem]">{tc.expectedOutput}</code>
                                        </div>
                                        {isFailed && result && (
                                            <div className="flex gap-2 items-baseline text-xs">
                                                <span className="text-muted-foreground min-w-[60px] shrink-0">{t('actual')}:</span>
                                                <code className="font-mono text-destructive bg-destructive/10 px-1.5 py-px rounded text-[0.72rem]">{result.actual}</code>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Results summary */}
            {displayResults.length > 0 && (
                <div className={`mx-5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-center ${allVisiblePassed
                        ? 'bg-brand-green-emerald/10 border border-brand-green-emerald/20 text-brand-green-emerald'
                        : 'bg-destructive/10 border border-destructive/20 text-destructive'
                    }`}>
                    {allVisiblePassed
                        ? t('allTestsPassed')
                        : t('someTestsFailed', { count: failedCount })}
                </div>
            )}

            {/* Mark complete */}
            {allVisiblePassed && !isCompleted && (
                <button
                    className="mx-5 my-3 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-green-emerald to-brand-green-dark hover:-translate-y-0.5 hover:shadow-lg transition-all"
                    onClick={handleMarkComplete}
                    type="button"
                >
                    {t('markComplete', { xp: xpReward })}
                </button>
            )}

            {isCompleted && (
                <div className="mx-5 my-3 py-3 rounded-xl bg-brand-green-emerald/10 border border-brand-green-emerald/20 text-brand-green-emerald text-center text-sm font-semibold">
                    {t('completed')}
                </div>
            )}

            {/* Hints */}
            {hints && hints.length > 0 && (
                <HintsPanel
                    hints={hints}
                    solutionCode={challenge.solutionCode}
                    isCompleted={isCompleted}
                />
            )}

            {/* Success celebration — ClaimXpPopup for mock mode, default overlay otherwise */}
            {showXpPopup && MOCK_MODE && (
                <ClaimXpPopup
                    xpAmount={xpReward}
                    streakDay={1}
                    onClose={() => {
                        setShowXpPopup(false);
                        handleMarkComplete();
                    }}
                />
            )}
            {showSuccess && !MOCK_MODE && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] animate-in fade-in duration-300" onClick={() => setShowSuccess(false)}>
                    <div className="bg-card border border-brand-green-emerald/30 rounded-2xl p-10 text-center max-w-[360px] animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-brand-green-emerald/15 text-brand-green-emerald text-3xl flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-extrabold text-foreground mb-2">{t('successTitle')}</h3>
                        <p className="text-sm text-muted-foreground mb-6">{t('successMessage', { xp: xpReward })}</p>
                        <button
                            className="px-8 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-brand-green-emerald to-brand-green-dark hover:-translate-y-0.5 hover:shadow-lg transition-all"
                            onClick={handleMarkComplete}
                            type="button"
                        >
                            {t('markComplete', { xp: xpReward })}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
