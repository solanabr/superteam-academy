/**
 * OutputTerminal — terminal emulator UI for code execution output.
 *
 * Displays stdout (green), stderr (red), compilation errors (orange),
 * with auto-scroll, loading spinner, and copy-to-clipboard.
 */
'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { ExecutionOutput } from '@/context/hooks/useCodeExecution';

interface OutputTerminalProps {
    output: ExecutionOutput | null;
    isExecuting: boolean;
    error: string | null;
}

export function OutputTerminal({ output, isExecuting, error }: OutputTerminalProps) {
    const t = useTranslations('editor');
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new output
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [output, error, isExecuting]);

    const handleCopy = useCallback(() => {
        if (!output) return;
        const text = [output.stdout, output.stderr].filter(Boolean).join('\n');
        navigator.clipboard.writeText(text);
    }, [output]);

    const hasOutput = output || error || isExecuting;

    return (
        <div className="output-terminal-container">
            {/* Terminal header */}
            <div className="terminal-header">
                <div className="terminal-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                </div>
                <span className="terminal-title">{t('output')}</span>
                {output && (
                    <button
                        className="terminal-copy-btn"
                        onClick={handleCopy}
                        type="button"
                        title="Copy output"
                    >
                        {'⧉'}
                    </button>
                )}
            </div>

            {/* Terminal body */}
            <div className="terminal-body" ref={terminalRef}>
                {!hasOutput && (
                    <div className="terminal-empty">
                        <span className="terminal-prompt">{'$'}</span>
                        <span className="terminal-empty-text">{t('noOutput')}</span>
                    </div>
                )}

                {isExecuting && (
                    <div className="terminal-executing">
                        <span className="terminal-spinner" />
                        <span>{t('running')}</span>
                    </div>
                )}

                {error && (
                    <div className="terminal-line terminal-error">
                        <span className="terminal-prompt">{'!'}</span>
                        <span>{error}</span>
                    </div>
                )}

                {output?.compilationError && (
                    <div className="terminal-section">
                        <div className="terminal-section-label">Compilation Error</div>
                        <pre className="terminal-pre terminal-compilation-error">
                            {output.compilationError}
                        </pre>
                    </div>
                )}

                {output?.stderr && !output.compilationError && (
                    <div className="terminal-section">
                        <div className="terminal-section-label">stderr</div>
                        <pre className="terminal-pre terminal-stderr">
                            {output.stderr}
                        </pre>
                    </div>
                )}

                {output?.stdout && (
                    <div className="terminal-section">
                        <div className="terminal-section-label">stdout</div>
                        <pre className="terminal-pre terminal-stdout">
                            {output.stdout}
                        </pre>
                    </div>
                )}

                {output && !output.compilationError && (
                    <div className={`terminal-exit-code ${output.exitCode === 0 ? 'exit-success' : 'exit-error'}`}>
                        Process exited with code {output.exitCode}
                    </div>
                )}
            </div>

            <style jsx>{`
                .output-terminal-container {
                    display: flex;
                    flex-direction: column;
                    background: #0d0d14;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }
                .terminal-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    background: rgba(0, 0, 0, 0.3);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                }
                .terminal-dots {
                    display: flex;
                    gap: 4px;
                }
                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .dot-red { background: #ff5f57; }
                .dot-yellow { background: #ffbd2e; }
                .dot-green { background: #28c840; }
                .terminal-title {
                    font-size: 0.68rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.35);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    flex: 1;
                }
                .terminal-copy-btn {
                    background: none;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 0.75rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .terminal-copy-btn:hover {
                    color: rgba(255, 255, 255, 0.7);
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .terminal-body {
                    min-height: 100px;
                    max-height: 200px;
                    overflow-y: auto;
                    padding: 10px 14px;
                    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
                    font-size: 0.72rem;
                    line-height: 1.6;
                }
                .terminal-empty {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.2);
                    font-style: italic;
                }
                .terminal-prompt {
                    color: #14F195;
                    font-weight: 700;
                }
                .terminal-empty-text {
                    color: rgba(255, 255, 255, 0.2);
                }
                .terminal-executing {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.5);
                }
                .terminal-spinner {
                    width: 12px;
                    height: 12px;
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                    border-top-color: #14F195;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                .terminal-line {
                    display: flex;
                    gap: 8px;
                    align-items: baseline;
                    margin-bottom: 2px;
                }
                .terminal-error {
                    color: #ff6b6b;
                }
                .terminal-section {
                    margin-bottom: 8px;
                }
                .terminal-section-label {
                    font-size: 0.6rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: rgba(255, 255, 255, 0.2);
                    margin-bottom: 2px;
                }
                .terminal-pre {
                    margin: 0;
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: inherit;
                    font-size: inherit;
                    line-height: inherit;
                }
                .terminal-stdout {
                    color: rgba(255, 255, 255, 0.8);
                }
                .terminal-stderr {
                    color: #ff6b6b;
                }
                .terminal-compilation-error {
                    color: #ffa94d;
                }
                .terminal-exit-code {
                    margin-top: 8px;
                    padding-top: 6px;
                    border-top: 1px solid rgba(255, 255, 255, 0.04);
                    font-size: 0.65rem;
                    color: rgba(255, 255, 255, 0.2);
                }
                .exit-success {
                    color: rgba(20, 241, 149, 0.4);
                }
                .exit-error {
                    color: rgba(255, 107, 107, 0.4);
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
