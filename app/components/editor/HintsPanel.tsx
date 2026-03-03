/**
 * Hints panel — progressive hint disclosure + solution toggle.
 *
 * Hints revealed one at a time. Solution requires confirmation
 * before display to encourage independent problem-solving.
 */
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { SanityCodeBlock } from '@/context/types/course';

interface HintsPanelProps {
    hints: string[];
    solutionCode?: SanityCodeBlock;
    isCompleted: boolean;
}

export function HintsPanel({
    hints,
    solutionCode,
    isCompleted,
}: HintsPanelProps) {
    const t = useTranslations('editor');
    const [revealedCount, setRevealedCount] = useState(0);
    const [showSolution, setShowSolution] = useState(false);
    const [confirmSolution, setConfirmSolution] = useState(false);

    const handleRevealHint = useCallback(() => {
        setRevealedCount((prev) => Math.min(prev + 1, hints.length));
    }, [hints.length]);

    const handleToggleSolution = useCallback(() => {
        if (showSolution) {
            setShowSolution(false);
            setConfirmSolution(false);
        } else if (confirmSolution || isCompleted) {
            setShowSolution(true);
        } else {
            setConfirmSolution(true);
        }
    }, [showSolution, confirmSolution, isCompleted]);

    const handleConfirmSolution = useCallback(() => {
        setShowSolution(true);
        setConfirmSolution(false);
    }, []);

    return (
        <div className="hints-panel">
            {/* Hints */}
            {hints.length > 0 && (
                <div className="hints-section">
                    {hints.slice(0, revealedCount).map((hint, i) => (
                        <div key={i} className="hint-item">
                            <div className="hint-label">{t('hint', { n: i + 1 })}</div>
                            <div className="hint-text">{hint}</div>
                        </div>
                    ))}

                    {revealedCount < hints.length && (
                        <button
                            className="hint-reveal-btn"
                            onClick={handleRevealHint}
                            type="button"
                        >
                            {t('showHint', { n: revealedCount + 1 })}
                        </button>
                    )}
                </div>
            )}

            {/* Solution toggle */}
            {solutionCode && (
                <div className="solution-section">
                    {confirmSolution && !showSolution && (
                        <div className="solution-confirm">
                            <p className="confirm-text">{t('solutionWarning')}</p>
                            <div className="confirm-actions">
                                <button
                                    className="confirm-btn confirm-yes"
                                    onClick={handleConfirmSolution}
                                    type="button"
                                >
                                    {t('showSolution')}
                                </button>
                                <button
                                    className="confirm-btn confirm-no"
                                    onClick={() => setConfirmSolution(false)}
                                    type="button"
                                >
                                    {t('hideSolution')}
                                </button>
                            </div>
                        </div>
                    )}

                    {!showSolution && !confirmSolution && (
                        <button
                            className="solution-toggle-btn"
                            onClick={handleToggleSolution}
                            type="button"
                        >
                            {t('showSolution')}
                        </button>
                    )}

                    {showSolution && (
                        <div className="solution-block">
                            <div className="solution-header">
                                <span className="solution-label">{t('showSolution')}</span>
                                <button
                                    className="solution-close"
                                    onClick={handleToggleSolution}
                                    type="button"
                                >
                                    {t('hideSolution')}
                                </button>
                            </div>
                            <pre className="solution-code">
                                <code>{solutionCode.code}</code>
                            </pre>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .hints-panel {
                    padding: 16px 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }
                .hints-section {
                    margin-bottom: 16px;
                }
                .hint-item {
                    padding: 10px 14px;
                    background: rgba(153, 69, 255, 0.05);
                    border: 1px solid rgba(153, 69, 255, 0.12);
                    border-radius: 8px;
                    margin-bottom: 6px;
                    animation: slideIn 0.2s ease;
                }
                .hint-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #9945FF;
                    margin-bottom: 4px;
                }
                .hint-text {
                    font-size: 0.82rem;
                    color: rgba(255, 255, 255, 0.65);
                    line-height: 1.5;
                }
                .hint-reveal-btn {
                    display: block;
                    width: 100%;
                    padding: 8px;
                    border: 1px dashed rgba(153, 69, 255, 0.2);
                    border-radius: 8px;
                    background: transparent;
                    color: #9945FF;
                    font-size: 0.78rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .hint-reveal-btn:hover {
                    background: rgba(153, 69, 255, 0.05);
                    border-color: rgba(153, 69, 255, 0.3);
                }
                .solution-section {
                    margin-top: 8px;
                }
                .solution-confirm {
                    padding: 14px;
                    background: rgba(255, 200, 50, 0.06);
                    border: 1px solid rgba(255, 200, 50, 0.15);
                    border-radius: 10px;
                    animation: slideIn 0.2s ease;
                }
                .confirm-text {
                    font-size: 0.82rem;
                    color: rgba(255, 200, 50, 0.85);
                    margin: 0 0 12px;
                    line-height: 1.4;
                }
                .confirm-actions {
                    display: flex;
                    gap: 8px;
                }
                .confirm-btn {
                    flex: 1;
                    padding: 7px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .confirm-yes {
                    background: rgba(255, 200, 50, 0.1);
                    border: 1px solid rgba(255, 200, 50, 0.2);
                    color: rgba(255, 200, 50, 0.85);
                }
                .confirm-yes:hover {
                    background: rgba(255, 200, 50, 0.15);
                }
                .confirm-no {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.5);
                }
                .confirm-no:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .solution-toggle-btn {
                    display: block;
                    width: 100%;
                    padding: 8px;
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.78rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .solution-toggle-btn:hover {
                    background: rgba(255, 255, 255, 0.03);
                    color: rgba(255, 255, 255, 0.6);
                }
                .solution-block {
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    overflow: hidden;
                    animation: slideIn 0.2s ease;
                }
                .solution-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 14px;
                    background: rgba(0, 0, 0, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }
                .solution-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: rgba(255, 255, 255, 0.35);
                }
                .solution-close {
                    padding: 3px 8px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.68rem;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .solution-close:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .solution-code {
                    margin: 0;
                    padding: 14px;
                    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
                    font-size: 0.8rem;
                    line-height: 1.6;
                    color: rgba(255, 255, 255, 0.75);
                    overflow-x: auto;
                    background: rgba(0, 0, 0, 0.15);
                }
                .solution-code code {
                    font-family: inherit;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
