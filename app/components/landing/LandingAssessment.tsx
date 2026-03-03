'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, RotateCcw, Layers, BarChart3 } from 'lucide-react';
import { CourseCard } from '@/components/ui/CourseCard';

/* ─── Question keys ─────────────────────────────────────────────── */

const QUESTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;
const OPTION_KEYS = ['o1', 'o2', 'o3', 'o4'] as const;

/* ─── Component ────────────────────────────────────────────────── */

export function LandingAssessment() {
    const t = useTranslations('landing');
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(
        () => Array(QUESTION_KEYS.length).fill(null)
    );
    const [completed, setCompleted] = useState(false);

    const total = QUESTION_KEYS.length;
    const progress = ((currentQ + 1) / total) * 100;

    function selectOption(optionIndex: number) {
        setAnswers((prev) => {
            const next = [...prev];
            next[currentQ] = optionIndex;
            return next;
        });
    }

    function goNext() {
        if (currentQ < total - 1) {
            setCurrentQ((p) => p + 1);
        } else {
            setCompleted(true);
        }
    }

    function goBack() {
        if (currentQ > 0) setCurrentQ((p) => p - 1);
    }

    function restart() {
        setCurrentQ(0);
        setAnswers(Array(QUESTION_KEYS.length).fill(null));
        setCompleted(false);
    }

    /* ── Result screen ─────────────────────────────────────────── */
    if (completed) {
        return (
            <section
                aria-label="Assessment result"
                className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8 sm:py-24"
            >
                <div className="mx-auto max-w-[640px] text-center">
                    <p className="mb-3 font-supreme text-sm font-semibold tracking-wide text-brand-green-dark dark:text-brand-yellow sm:text-base">
                        {t('assessment.tagline')}
                    </p>
                    <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {t('assessment.resultTitle')}
                    </h2>
                    <p className="mb-10 font-supreme text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {t('assessment.resultSubtitle')}
                    </p>
                </div>

                {/* Result card with restart button beside it */}
                <div className="mx-auto flex max-w-[520px] items-start justify-center gap-4">
                    <button
                        type="button"
                        onClick={restart}
                        aria-label="Restart assessment"
                        className="mt-2 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 font-supreme text-sm font-medium text-brand-green-dark transition-colors hover:bg-brand-green-dark/10 dark:text-brand-yellow dark:hover:bg-brand-yellow/10"
                    >
                        <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
                        {t('assessment.retake')}
                    </button>

                    <div className="w-full max-w-[380px]">
                        <CourseCard
                            image={
                                <Image
                                    src="/course/solana_course.png"
                                    alt={t('courses.solanaFundamentals.title')}
                                    width={400}
                                    height={267}
                                    className="h-full w-full object-cover"
                                />
                            }
                        >
                            {/* Badges */}
                            <div className="mb-3 flex items-center gap-2">
                                <span className="inline-block rounded-full bg-brand-green-emerald/15 px-2.5 py-1 font-supreme text-[11px] font-bold leading-none text-[#006838] dark:bg-brand-green-emerald/25 dark:text-[#6ee7a0]">
                                    {t('courses.difficulty.beginner')}
                                </span>
                                <span className="inline-block rounded-full bg-foreground/8 px-2.5 py-1 font-supreme text-[11px] font-bold leading-none text-foreground/70 dark:bg-white/10 dark:text-white/70">
                                    Core
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="mb-2 font-display text-lg font-bold text-foreground sm:text-xl">
                                {t('courses.solanaFundamentals.title')}
                            </h3>

                            {/* Description */}
                            <p className="mb-4 font-supreme text-sm leading-relaxed text-[#3a4d40] dark:text-[#d4e0d7]">
                                {t('courses.solanaFundamentals.description')}
                            </p>

                            {/* Meta */}
                            <div className="mb-4 flex items-center gap-4 border-t border-foreground/10 pt-3 dark:border-white/15">
                                <div className="flex items-center gap-1 text-brand-green-dark dark:text-brand-yellow">
                                    <Layers size={14} strokeWidth={1.5} aria-hidden="true" />
                                    <span className="font-supreme text-[11px] font-medium">12 {t('courses.lessons')}</span>
                                </div>
                                <div className="flex items-center gap-1 text-brand-green-dark dark:text-brand-yellow">
                                    <BarChart3 size={14} strokeWidth={1.5} aria-hidden="true" />
                                    <span className="font-supreme text-[11px] font-medium">Core</span>
                                </div>
                                <div className="ml-auto flex items-center gap-1">
                                    <span className="font-array text-sm font-bold text-brand-green-dark dark:text-brand-yellow">600</span>
                                    <span className="font-supreme text-[10px] font-medium text-brand-green-dark dark:text-brand-yellow">XP</span>
                                </div>
                            </div>

                            {/* CTA */}
                            <a
                                href="/login"
                                className="cta-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 font-supreme text-sm"
                            >
                                {t('assessment.getStarted')}
                                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                            </a>
                        </CourseCard>
                    </div>
                </div>
            </section>
        );
    }

    /* ── Quiz screen ───────────────────────────────────────────── */
    const qKey = QUESTION_KEYS[currentQ];

    return (
        <section
            aria-label="Assessment"
            className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8 sm:py-24"
        >
            {/* Header */}
            <div className="mx-auto max-w-[640px] text-center">
                <p className="mb-3 font-supreme text-sm font-semibold tracking-wide text-brand-green-dark dark:text-brand-yellow sm:text-base">
                    {t('assessment.tagline')}
                </p>
                <h2 className="mb-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {t('assessment.title')}
                </h2>
                <p className="mb-8 font-supreme text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {t('assessment.subtitle', { total })}
                </p>
            </div>

            {/* Quiz card */}
            <div className="mx-auto max-w-[640px]">
                {/* Progress bar */}
                <div className="mb-2 flex items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-green-dark/15 dark:bg-white/20">
                        <div
                            className="h-full rounded-full bg-brand-green-emerald transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="font-array text-xs font-bold text-foreground">
                        {currentQ + 1}/{total}
                    </span>
                </div>

                {/* Question */}
                <div className="mt-8">
                    <p className="mb-6 font-supreme text-base font-bold text-foreground sm:text-lg">
                        {currentQ + 1}. {t(`assessment.${qKey}.question`)}
                    </p>

                    {/* Options */}
                    <fieldset className="flex flex-col gap-3">
                        <legend className="sr-only">{t(`assessment.${qKey}.question`)}</legend>
                        {OPTION_KEYS.map((oKey, i) => {
                            const isSelected = answers[currentQ] === i;
                            return (
                                <label
                                    key={oKey}
                                    className={`
                                        flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 font-supreme text-sm font-medium transition-colors
                                        ${isSelected
                                            ? 'border-brand-green-emerald bg-brand-green-emerald/12 text-foreground dark:border-brand-yellow dark:bg-brand-yellow/12'
                                            : 'border-brand-green-dark/25 bg-white/70 text-foreground hover:border-brand-green-dark/50 dark:border-white/25 dark:bg-white/5 dark:hover:border-white/40'
                                        }
                                    `}
                                >
                                    <span
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isSelected
                                            ? 'border-brand-green-emerald dark:border-brand-yellow'
                                            : 'border-brand-green-dark/30 dark:border-white/35'
                                            }`}
                                    >
                                        {isSelected && (
                                            <span className="h-2.5 w-2.5 rounded-full bg-brand-green-emerald dark:bg-brand-yellow" />
                                        )}
                                    </span>
                                    <input
                                        type="radio"
                                        name={`question-${currentQ}`}
                                        value={i}
                                        checked={isSelected}
                                        onChange={() => selectOption(i)}
                                        className="sr-only"
                                    />
                                    {t(`assessment.${qKey}.${oKey}`)}
                                </label>
                            );
                        })}
                    </fieldset>
                </div>

                {/* Navigation buttons */}
                <div className="mt-8 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={currentQ === 0}
                        className={`
                            flex items-center gap-1.5 rounded-xl border-2 px-5 py-2.5 font-supreme text-sm font-bold transition-colors
                            ${currentQ === 0
                                ? 'cursor-not-allowed border-brand-green-dark/10 text-brand-green-dark/25 dark:border-white/10 dark:text-white/25'
                                : 'border-brand-green-dark/30 text-foreground hover:border-brand-green-dark/60 hover:bg-brand-green-dark/5 dark:border-white/30 dark:text-white dark:hover:border-white/50 dark:hover:bg-white/10'
                            }
                        `}
                    >
                        <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
                        {t('assessment.back')}
                    </button>

                    <button
                        type="button"
                        onClick={goNext}
                        disabled={answers[currentQ] === null}
                        className={`
                            cta-primary flex items-center gap-1.5 rounded-xl px-6 py-2.5 font-supreme text-sm
                            ${answers[currentQ] === null ? 'pointer-events-none opacity-40' : ''}
                        `}
                    >
                        {currentQ === total - 1 ? t('assessment.finish') : t('assessment.next')}
                        <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </section>
    );
}
