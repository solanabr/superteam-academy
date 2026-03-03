/**
 * Lesson content component — renders lesson text + quiz + completion.
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import DOMPurify from 'dompurify';
import type { Lesson, SanityCodeBlock } from '@/context/types/course';
import type { CompletionStep } from '@/context/hooks/useLessonCompletion';
import { QuizSection } from './QuizSection';
import { HintsPanel } from '@/components/editor/HintsPanel';

interface LessonContentProps {
    lesson: Lesson;
    lessonContent: string | null;
    isContentLoading: boolean;
    isCompleted: boolean;
    isCompleting: boolean;
    completionStep: CompletionStep;
    onComplete: () => void;
    xpReward: number;
    hints?: string[];
    solutionCode?: SanityCodeBlock;
}

export function LessonContent({
    lesson,
    lessonContent,
    isContentLoading,
    isCompleted,
    isCompleting,
    completionStep,
    onComplete,
    xpReward,
    hints,
    solutionCode,
}: LessonContentProps) {
    const t = useTranslations('lesson');
    const [quizPassed, setQuizPassed] = useState(false);
    const hasQuiz = !!lesson.quiz;
    const canComplete = isCompleted || (!hasQuiz || quizPassed);

    const stepLabel = completionStep === 'submitting'
        ? t('submitting')
        : completionStep === 'confirming'
            ? t('confirming')
            : null;

    return (
        <div className="lesson-content">
            <div className="content-header">
                <div className="lesson-badge">{t('lessonNumber', { n: lesson.index + 1 })}</div>
                <h1 className="lesson-title">{lesson.title}</h1>
            </div>

            {/* Lesson body */}
            <div className="content-body">
                {isContentLoading ? (
                    <div className="content-skeleton">
                        <div className="skeleton-line w-full" />
                        <div className="skeleton-line w-3-4" />
                        <div className="skeleton-line w-full" />
                        <div className="skeleton-line w-1-2" />
                        <div className="skeleton-line w-full" />
                    </div>
                ) : lessonContent ? (
                    <div
                        className="lesson-markdown"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lessonContent) }}
                    />
                ) : (
                    <div className="content-placeholder">
                        <p>{t('contentLoading')}</p>
                        <p className="placeholder-hint">
                            {t('contentTx', { txId: lesson.contentTxId })}
                        </p>
                    </div>
                )}
            </div>

            {/* Hints */}
            {((hints && hints.length > 0) || solutionCode) && (
                <HintsPanel
                    hints={hints || []}
                    solutionCode={solutionCode}
                    isCompleted={isCompleted}
                />
            )}

            {/* Quiz */}
            {hasQuiz && !isCompleted && (
                <QuizSection
                    quiz={lesson.quiz!}
                    onPass={() => setQuizPassed(true)}
                    disabled={isCompleted}
                />
            )}

            {/* Completion */}
            <div className="completion-section">
                {isCompleted ? (
                    <div className="completed-badge">
                        {t('completedWithXp', { xp: xpReward })}
                    </div>
                ) : (
                    <button
                        className="complete-button"
                        onClick={onComplete}
                        disabled={!canComplete || isCompleting}
                        type="button"
                    >
                        {isCompleting
                            ? stepLabel ?? t('completing')
                            : hasQuiz && !quizPassed
                                ? t('quizRequired')
                                : t('completeButton', { xp: xpReward })
                        }
                    </button>
                )}
            </div>

            <style jsx>{`
                .lesson-content {
                    min-height: 100%;
                    padding: 32px;
                    overflow-y: auto;
                }
                .content-header {
                    margin-bottom: 32px;
                }
                .lesson-badge {
                    display: inline-block;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #9945FF;
                    background: rgba(153, 69, 255, 0.1);
                    border: 1px solid rgba(153, 69, 255, 0.2);
                    padding: 4px 10px;
                    border-radius: 20px;
                    margin-bottom: 12px;
                }
                .lesson-title {
                    font-size: 1.6rem;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.95);
                    margin: 0;
                    line-height: 1.3;
                }
                .content-body {
                    margin-bottom: 32px;
                }
                .lesson-markdown {
                    font-size: 0.95rem;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 1.8;
                }
                .lesson-markdown :global(h2) {
                    font-size: 1.2rem;
                    color: rgba(255, 255, 255, 0.9);
                    margin: 32px 0 12px;
                }
                .lesson-markdown :global(h3) {
                    font-size: 1.05rem;
                    color: rgba(255, 255, 255, 0.85);
                    margin: 24px 0 10px;
                }
                .lesson-markdown :global(code) {
                    background: rgba(255, 255, 255, 0.06);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.85em;
                    color: #14F195;
                }
                .lesson-markdown :global(pre) {
                    background: rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 10px;
                    padding: 16px;
                    overflow-x: auto;
                    margin: 16px 0;
                }
                .lesson-markdown :global(pre code) {
                    background: none;
                    padding: 0;
                    color: rgba(255, 255, 255, 0.8);
                }
                .lesson-markdown :global(a) {
                    color: #9945FF;
                }
                .content-skeleton {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .skeleton-line {
                    height: 16px;
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    animation: pulse 1.5s ease infinite;
                }
                .w-full { width: 100%; }
                .w-3-4 { width: 75%; }
                .w-1-2 { width: 50%; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .content-placeholder {
                    padding: 40px;
                    text-align: center;
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px dashed rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: rgba(255, 255, 255, 0.4);
                }
                .content-placeholder p {
                    margin: 0 0 8px;
                }
                .placeholder-hint {
                    font-size: 0.75rem;
                    font-family: monospace;
                    color: rgba(255, 255, 255, 0.25);
                }
                .completion-section {
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }
                .completed-badge {
                    padding: 16px;
                    background: rgba(20, 241, 149, 0.08);
                    border: 1px solid rgba(20, 241, 149, 0.2);
                    border-radius: 12px;
                    text-align: center;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #14F195;
                }
                .complete-button {
                    width: 100%;
                    padding: 14px;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #9945FF, #14F195);
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .complete-button:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 20px rgba(153, 69, 255, 0.3);
                }
                .complete-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
