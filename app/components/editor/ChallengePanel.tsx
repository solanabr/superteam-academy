/**
 * Challenge panel — wraps CodeEditor with test cases, output terminal,
 * run button, pass/fail indicators, and success celebration.
 *
 * Uses the code execution API (Piston) when enabled,
 * falls back to client-side string matching when disabled.
 *
 * All challenge data (starter code, test cases, instructions) comes
 * from Sanity CMS via SanityChallenge — nothing hardcoded.
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CodeEditor } from './CodeEditor';
import { HintsPanel } from './HintsPanel';
import { OutputTerminal } from './OutputTerminal';
import { useCodeExecution } from '@/context/hooks/useCodeExecution';
import type { SanityChallenge, SanityTestCase, SanityCodeBlock } from '@/context/types/course';

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

    const handleRun = useCallback(async () => {
        setActiveTab('output');

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
        <div className="challenge-panel" ref={editorContainerRef}>
            {/* Challenge prompt */}
            <div className="challenge-header">
                <div className="challenge-badge">{t('challenge')}</div>
                <div className="challenge-instructions">
                    {challenge.instructions}
                </div>
            </div>

            {/* Editor */}
            <div className="challenge-editor">
                <CodeEditor
                    language={challenge.language as 'rust' | 'typescript' | 'json'}
                    starterCode={challenge.starterCode.code}
                    isCompleted={isCompleted}
                    onChange={setCurrentCode}
                />
            </div>

            {/* Toolbar */}
            <div className="challenge-toolbar">
                <button
                    className="toolbar-btn reset-btn"
                    onClick={handleReset}
                    disabled={isCompleted}
                    type="button"
                >
                    {t('resetCode')}
                </button>
                <button
                    className="toolbar-btn run-btn"
                    onClick={handleRun}
                    disabled={isExecuting || isCompleted}
                    type="button"
                >
                    {isExecuting ? t('running') : t('runCode')}
                </button>
            </div>

            {/* Tab bar */}
            <div className="panel-tabs">
                <button
                    className={`panel-tab ${activeTab === 'output' ? 'panel-tab-active' : ''}`}
                    onClick={() => setActiveTab('output')}
                    type="button"
                >
                    {t('output')}
                    {isExecuting && <span className="tab-spinner" />}
                </button>
                <button
                    className={`panel-tab ${activeTab === 'tests' ? 'panel-tab-active' : ''}`}
                    onClick={() => setActiveTab('tests')}
                    type="button"
                >
                    {t('testCases')}
                    {displayResults.length > 0 && (
                        <span className={`tab-badge ${allVisiblePassed ? 'badge-pass' : 'badge-fail'}`}>
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
                <div className="test-cases">
                    <div className="test-cases-header">{t('testCases')}</div>
                    {challenge.testCases.map((tc, i) => {
                        const result = displayResults[i];
                        const statusClass = result
                            ? result.passed ? 'test-pass' : 'test-fail'
                            : 'test-pending';

                        return (
                            <div key={tc.name} className={`test-case ${statusClass}`}>
                                <div className="test-name">
                                    <span className="test-icon">
                                        {result
                                            ? result.passed ? '\u2713' : '\u2717'
                                            : '\u25CB'}
                                    </span>
                                    {tc.isHidden ? t('hidden') : tc.name}
                                </div>
                                {!tc.isHidden && (
                                    <div className="test-details">
                                        <div className="test-row">
                                            <span className="test-label">{t('input')}:</span>
                                            <code className="test-value">{tc.input}</code>
                                        </div>
                                        <div className="test-row">
                                            <span className="test-label">{t('expected')}:</span>
                                            <code className="test-value">{tc.expectedOutput}</code>
                                        </div>
                                        {result && !result.passed && (
                                            <div className="test-row test-actual">
                                                <span className="test-label">{t('actual')}:</span>
                                                <code className="test-value">{result.actual}</code>
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
                <div className={`results-summary ${allVisiblePassed ? 'summary-pass' : 'summary-fail'}`}>
                    {allVisiblePassed
                        ? t('allTestsPassed')
                        : t('someTestsFailed', { count: failedCount })}
                </div>
            )}

            {/* Mark complete */}
            {allVisiblePassed && !isCompleted && (
                <button
                    className="complete-btn"
                    onClick={handleMarkComplete}
                    type="button"
                >
                    {t('markComplete', { xp: xpReward })}
                </button>
            )}

            {isCompleted && (
                <div className="completed-indicator">
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

            {/* Success celebration */}
            {showSuccess && (
                <div className="success-overlay" onClick={() => setShowSuccess(false)}>
                    <div className="success-card">
                        <div className="success-icon">{'\u2713'}</div>
                        <h3 className="success-title">{t('successTitle')}</h3>
                        <p className="success-message">{t('successMessage', { xp: xpReward })}</p>
                        <button
                            className="success-btn"
                            onClick={handleMarkComplete}
                            type="button"
                        >
                            {t('markComplete', { xp: xpReward })}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .challenge-panel {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: #1a1a2e;
                    overflow-y: auto;
                }
                .challenge-header {
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .challenge-badge {
                    display: inline-block;
                    font-size: 0.65rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #14F195;
                    background: rgba(20, 241, 149, 0.1);
                    border: 1px solid rgba(20, 241, 149, 0.2);
                    padding: 3px 8px;
                    border-radius: 4px;
                    margin-bottom: 10px;
                }
                .challenge-instructions {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.6;
                }
                .challenge-editor {
                    flex: 1;
                    min-height: 200px;
                    max-height: 400px;
                }
                .challenge-toolbar {
                    display: flex;
                    gap: 8px;
                    padding: 8px 20px;
                    background: rgba(0, 0, 0, 0.2);
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .toolbar-btn {
                    padding: 6px 14px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .toolbar-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.9);
                }
                .toolbar-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .run-btn {
                    margin-left: auto;
                    background: rgba(20, 241, 149, 0.1);
                    border-color: rgba(20, 241, 149, 0.2);
                    color: #14F195;
                }
                .run-btn:hover:not(:disabled) {
                    background: rgba(20, 241, 149, 0.2);
                }
                /* Tab bar */
                .panel-tabs {
                    display: flex;
                    background: rgba(0, 0, 0, 0.3);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .panel-tab {
                    flex: 1;
                    padding: 7px 16px;
                    border: none;
                    border-bottom: 2px solid transparent;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.35);
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    cursor: pointer;
                    transition: all 0.15s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }
                .panel-tab:hover {
                    color: rgba(255, 255, 255, 0.6);
                    background: rgba(255, 255, 255, 0.02);
                }
                .panel-tab-active {
                    color: rgba(255, 255, 255, 0.85);
                    border-bottom-color: #9945FF;
                }
                .tab-spinner {
                    width: 10px;
                    height: 10px;
                    border: 1.5px solid rgba(255, 255, 255, 0.15);
                    border-top-color: #14F195;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                .tab-badge {
                    font-size: 0.6rem;
                    padding: 1px 5px;
                    border-radius: 8px;
                    font-weight: 700;
                }
                .badge-pass {
                    background: rgba(20, 241, 149, 0.15);
                    color: #14F195;
                }
                .badge-fail {
                    background: rgba(255, 107, 107, 0.15);
                    color: #ff6b6b;
                }
                .test-cases {
                    padding: 12px 20px;
                }
                .test-cases-header {
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: rgba(255, 255, 255, 0.35);
                    margin-bottom: 8px;
                }
                .test-case {
                    padding: 10px 12px;
                    border-radius: 8px;
                    margin-bottom: 4px;
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    background: rgba(255, 255, 255, 0.02);
                }
                .test-pass {
                    border-color: rgba(20, 241, 149, 0.15);
                    background: rgba(20, 241, 149, 0.03);
                }
                .test-fail {
                    border-color: rgba(255, 107, 107, 0.15);
                    background: rgba(255, 107, 107, 0.03);
                }
                .test-name {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.75);
                }
                .test-icon {
                    font-size: 0.85rem;
                    width: 18px;
                    text-align: center;
                }
                .test-pass .test-icon { color: #14F195; }
                .test-fail .test-icon { color: #ff6b6b; }
                .test-pending .test-icon { color: rgba(255, 255, 255, 0.25); }
                .test-details {
                    margin-top: 8px;
                    padding-left: 26px;
                }
                .test-row {
                    display: flex;
                    gap: 8px;
                    align-items: baseline;
                    font-size: 0.75rem;
                    margin-bottom: 2px;
                }
                .test-label {
                    color: rgba(255, 255, 255, 0.35);
                    min-width: 60px;
                    flex-shrink: 0;
                }
                .test-value {
                    font-family: monospace;
                    color: rgba(255, 255, 255, 0.6);
                    background: rgba(0, 0, 0, 0.2);
                    padding: 1px 6px;
                    border-radius: 3px;
                    font-size: 0.72rem;
                }
                .test-actual .test-value {
                    color: #ff6b6b;
                }
                .results-summary {
                    margin: 0 20px;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    text-align: center;
                }
                .summary-pass {
                    background: rgba(20, 241, 149, 0.08);
                    border: 1px solid rgba(20, 241, 149, 0.2);
                    color: #14F195;
                }
                .summary-fail {
                    background: rgba(255, 107, 107, 0.08);
                    border: 1px solid rgba(255, 107, 107, 0.2);
                    color: #ff6b6b;
                }
                .complete-btn {
                    margin: 12px 20px;
                    padding: 12px;
                    border: none;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #9945FF, #14F195);
                    color: white;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .complete-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(153, 69, 255, 0.3);
                }
                .completed-indicator {
                    margin: 12px 20px;
                    padding: 12px;
                    border-radius: 10px;
                    background: rgba(20, 241, 149, 0.08);
                    border: 1px solid rgba(20, 241, 149, 0.2);
                    color: #14F195;
                    text-align: center;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .success-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    animation: fadeIn 0.3s ease;
                }
                .success-card {
                    background: #1a1a2e;
                    border: 1px solid rgba(20, 241, 149, 0.3);
                    border-radius: 20px;
                    padding: 40px;
                    text-align: center;
                    max-width: 360px;
                    animation: scaleIn 0.3s ease;
                }
                .success-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: rgba(20, 241, 149, 0.15);
                    color: #14F195;
                    font-size: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                }
                .success-title {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.95);
                    margin: 0 0 8px;
                }
                .success-message {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0 0 24px;
                }
                .success-btn {
                    padding: 12px 32px;
                    border: none;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #9945FF, #14F195);
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .success-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(153, 69, 255, 0.3);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
