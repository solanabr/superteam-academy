/**
 * Lesson content component — renders lesson text + quiz + completion.
 * Themed with Tailwind CSS variables for light/dark mode support.
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
        <div className="min-h-full p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-block text-[0.7rem] font-semibold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full mb-3">
                    {t('lessonNumber', { n: lesson.index + 1 })}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight font-display">
                    {lesson.title}
                </h1>
            </div>

            {/* Lesson body */}
            <div className="mb-8">
                {isContentLoading ? (
                    <div className="flex flex-col gap-3">
                        <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
                        <div className="h-4 w-3/4 bg-muted/40 rounded animate-pulse" />
                        <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-muted/40 rounded animate-pulse" />
                        <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
                    </div>
                ) : lessonContent ? (
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none font-supreme text-foreground/80 leading-relaxed
                            prose-headings:text-foreground prose-headings:font-display
                            prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
                            prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
                            prose-code:text-brand-green-emerald prose-code:bg-muted/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                            prose-pre:bg-muted/60 prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:p-4
                            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                            prose-table:text-sm
                            prose-th:text-foreground/80 prose-th:font-semibold
                            prose-td:text-foreground/60"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lessonContent) }}
                    />
                ) : (
                    <div className="py-10 text-center bg-muted/10 border border-dashed border-border rounded-xl text-muted-foreground">
                        <p className="mb-2">{t('contentLoading')}</p>
                        <p className="text-xs font-mono text-muted-foreground/50">
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
            <div className="mt-8 pt-6 border-t border-border">
                {isCompleted ? (
                    <div className="py-4 bg-brand-green-emerald/10 border border-brand-green-emerald/20 rounded-xl text-center text-sm font-semibold text-brand-green-emerald">
                        {t('completedWithXp', { xp: xpReward })}
                    </div>
                ) : (
                    <button
                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-accent to-brand-green-emerald hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
        </div>
    );
}
